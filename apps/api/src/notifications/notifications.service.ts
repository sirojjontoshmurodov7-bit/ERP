import { BadGatewayException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { and, count, desc, eq, gt, inArray, isNull, sql, type SQL } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { PermissionsService } from '../auth/permissions.service.js';
import { branchScope } from '../common/branch-scope.js';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { notificationLog, telegramLinkCodes, userBranches, users } from '../db/schema.js';
import { hashLinkCode, LINK_CODE_TTL_MS, newLinkCode } from './messages.js';
import type { ListNotificationsQuery } from './notifications.schemas.js';
import { TelegramSender } from './telegram.sender.js';

const forbidden = () => new ForbiddenException({ code: 'FORBIDDEN', message: "Bu amal uchun ruxsat yo'q" });
const notFound = () => new NotFoundException({ code: 'USER_NOT_FOUND', message: 'Foydalanuvchi topilmadi' });

/**
 * Telegram ulash va qo'lda xabar (`telegram.settings`, `notification.send`: rahbar ✔, admin ○ o'z filiallaridagi foydalanuvchilar).
 * O'z hisobini ulash/uzish ruxsat talab qilmaydi (o'z yozuvi). Xabar matni saqlanmaydi.
 */
@Injectable()
export class NotificationsService {
  constructor(
    private readonly db: DbService,
    private readonly perms: PermissionsService,
    private readonly sender: TelegramSender,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  private ctx(actor: AuthUser) {
    return contextOf(actor.centerId, actor.role);
  }

  /** Boshqa foydalanuvchi ustida amal: ruxsat + filial qamrovi (qamrovdan tashqari yoki begona = 404). */
  private async target(tx: Tx, actor: AuthUser, userId: string, code: 'telegram.settings' | 'notification.send') {
    if (!(await this.perms.hasIn(tx, actor, code))) throw forbidden();
    const [u] = await tx.select({ id: users.id, role: users.role, status: users.status, chatId: users.telegramChatId }).from(users).where(eq(users.id, userId));
    if (!u || u.role === 'SUPER_ADMIN') throw notFound();
    const scope = await branchScope(tx, actor);
    if (!scope.all) {
      if (!scope.branchIds.length) throw notFound();
      const [row] = await tx
        .select({ b: userBranches.branchId })
        .from(userBranches)
        .where(and(eq(userBranches.userId, u.id), inArray(userBranches.branchId, scope.branchIds)))
        .limit(1);
      if (!row) throw notFound();
    }
    return u;
  }

  /** Bir martalik bog'lash kodi (o'zi uchun yoki, ruxsat bilan, boshqa foydalanuvchi uchun). Kod faqat javobda, bazada xeshi. */
  async linkCode(actor: AuthUser, userId: string | undefined, client: ClientInfo) {
    const targetId = userId ?? actor.id;
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (targetId !== actor.id) {
        const target = await this.target(tx, actor, targetId, 'telegram.settings');
        if (target.status !== 'ACTIVE') throw new ConflictException({ code: 'USER_NOT_ACTIVE', message: 'Foydalanuvchi faol emas' });
      }
      const now = new Date();
      await tx
        .update(telegramLinkCodes)
        .set({ expiresAt: now })
        .where(and(eq(telegramLinkCodes.userId, targetId), isNull(telegramLinkCodes.usedAt), gt(telegramLinkCodes.expiresAt, now)));
      const code = newLinkCode();
      const expiresAt = new Date(now.getTime() + LINK_CODE_TTL_MS);
      await tx.insert(telegramLinkCodes).values({ centerId: actor.centerId!, userId: targetId, codeHash: hashLinkCode(code, this.config.accessSecret), expiresAt, createdBy: actor.id });
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'telegram.link_code', entity: 'user', entityId: targetId, after: { self: targetId === actor.id }, ip: client.ip });
      const bot = this.config.telegramBotUsername ?? null;
      return { code, expiresAt, botUsername: bot, deepLink: bot ? `https://t.me/${bot}?start=${code}` : null };
    });
  }

  async status(actor: AuthUser) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      const [u] = await tx.select({ chatId: users.telegramChatId }).from(users).where(eq(users.id, actor.id));
      return { linked: u?.chatId != null, botConfigured: this.sender.isConfigured() };
    });
  }

  async unlink(actor: AuthUser, userId: string | undefined, client: ClientInfo) {
    const targetId = userId ?? actor.id;
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (targetId !== actor.id) await this.target(tx, actor, targetId, 'telegram.settings');
      await tx.update(users).set({ telegramChatId: null, updatedAt: new Date() }).where(eq(users.id, targetId));
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'telegram.unlink', entity: 'user', entityId: targetId, ip: client.ip });
      return { linked: false };
    });
  }

  /** Qo'lda xabar (`notification.send`). Yuborish tranzaksiyadan tashqarida; natija (SENT/FAILED) jurnalga yoziladi. */
  async send(actor: AuthUser, input: { userId: string; message: string }, client: ClientInfo) {
    const target = await this.db.withContext(this.ctx(actor), (tx) => this.target(tx, actor, input.userId, 'notification.send'));
    if (target.status !== 'ACTIVE') throw new ConflictException({ code: 'USER_NOT_ACTIVE', message: 'Foydalanuvchi faol emas' });
    if (target.chatId == null) throw new ConflictException({ code: 'TELEGRAM_NOT_LINKED', message: "Foydalanuvchi Telegram'ni ulamagan" });
    if (!this.sender.isConfigured()) throw new ServiceUnavailableException({ code: 'TELEGRAM_NOT_CONFIGURED', message: 'Telegram bot sozlanmagan' });

    const res = await this.sender.send(target.chatId, input.message);
    await this.db.withContext(this.ctx(actor), async (tx) => {
      await tx.insert(notificationLog).values({
        centerId: actor.centerId!,
        userId: target.id,
        type: 'MANUAL',
        payload: { length: input.message.length },
        status: res.ok ? 'SENT' : 'FAILED',
        error: res.ok ? null : res.code,
        createdBy: actor.id,
      });
      if (!res.ok && res.blocked) await tx.execute(sql`select app_telegram_unlink(${target.chatId}::bigint)`);
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'notification.send', entity: 'user', entityId: target.id, after: { status: res.ok ? 'SENT' : 'FAILED' }, ip: client.ip });
    });
    if (!res.ok) throw new BadGatewayException({ code: 'TELEGRAM_SEND_FAILED', message: "Xabar yuborilmadi", reason: res.code });
    return { status: 'SENT' as const };
  }

  /** Jurnal (`notification.send`): rahbar hammasi, admin faqat o'z filiallaridagi foydalanuvchilar. */
  async list(actor: AuthUser, q: ListNotificationsQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'notification.send'))) throw forbidden();
      const scope = await branchScope(tx, actor);
      const where: SQL[] = [];
      if (!scope.all) {
        if (!scope.branchIds.length) return { items: [], total: 0, limit: q.limit, offset: q.offset };
        where.push(inArray(notificationLog.userId, tx.select({ u: userBranches.userId }).from(userBranches).where(inArray(userBranches.branchId, scope.branchIds))));
      }
      if (q.userId) where.push(eq(notificationLog.userId, q.userId));
      if (q.type) where.push(eq(notificationLog.type, q.type));
      if (q.status) where.push(eq(notificationLog.status, q.status));
      const cond = where.length ? and(...where) : undefined;
      const [{ total } = { total: 0 }] = await tx.select({ total: count() }).from(notificationLog).where(cond);
      const items = await tx
        .select({
          id: notificationLog.id,
          userId: notificationLog.userId,
          userName: users.fullName,
          channel: notificationLog.channel,
          type: notificationLog.type,
          status: notificationLog.status,
          error: notificationLog.error,
          payload: notificationLog.payload,
          createdBy: notificationLog.createdBy,
          createdAt: notificationLog.createdAt,
        })
        .from(notificationLog)
        .innerJoin(users, eq(users.id, notificationLog.userId))
        .where(cond)
        .orderBy(desc(notificationLog.id))
        .limit(q.limit)
        .offset(q.offset);
      return { items, total: Number(total), limit: q.limit, offset: q.offset };
    });
  }
}
