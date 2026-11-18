import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { DbService, NO_CONTEXT } from '../db/db.service.js';
import { rowsOf } from '../db/rows.js';
import { badCodeMessage, hashLinkCode, helpMessage, linkedMessage, normalizeLinkCode, unlinkedMessage } from './messages.js';
import { telegramUpdateSchema } from './notifications.schemas.js';
import { TelegramSender } from './telegram.sender.js';

const MAX_FAILS = 5;
const FAIL_WINDOW_MS = 15 * 60_000;
const MAX_TRACKED_CHATS = 5000;

/**
 * Webhook mantig'i: `/start KOD` bog'laydi, `/stop` uzadi. Tenant noma'lum bo'lgani uchun faqat tor
 * `app_telegram_redeem` / `app_telegram_unlink` funksiyalari ishlatiladi. Kod tanlash urinishlari chat bo'yicha cheklanadi.
 */
@Injectable()
export class TelegramBotService {
  private readonly fails = new Map<number, { count: number; resetAt: number }>();

  constructor(
    private readonly db: DbService,
    private readonly sender: TelegramSender,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async handleUpdate(raw: unknown, now: number = Date.now()): Promise<void> {
    const parsed = telegramUpdateSchema.safeParse(raw);
    const msg = parsed.success ? parsed.data.message : undefined;
    if (!msg || msg.chat.type !== 'private') return; // guruh va kanallarda ishlamaymiz (shaxsiy ma'lumot)
    const chatId = msg.chat.id;
    const text = (msg.text ?? '').trim();
    const [rawCommand = '', ...rest] = text.split(/\s+/);
    const command = rawCommand.split('@')[0]!.toLowerCase();

    if (command === '/stop') {
      const [row] = rowsOf<{ n: number }>(await this.db.withContext(NO_CONTEXT, (tx) => tx.execute(sql`select app_telegram_unlink(${chatId}::bigint) as n`)));
      await this.reply(chatId, unlinkedMessage(Number(row?.n ?? 0)));
      return;
    }
    if (command !== '/start' || rest.length === 0) {
      await this.reply(chatId, helpMessage());
      return;
    }

    if (this.blocked(chatId, now)) return; // juda ko'p xato urinish: javob ham bermaymiz
    const code = normalizeLinkCode(rest.join(''));
    const redeemed = code ? await this.redeem(code, chatId) : null;
    if (!redeemed) {
      this.recordFail(chatId, now);
      await this.reply(chatId, badCodeMessage());
      return;
    }
    this.fails.delete(chatId);
    await this.reply(chatId, linkedMessage(redeemed.fullName));
  }

  private async redeem(code: string, chatId: number) {
    const hash = hashLinkCode(code, this.config.accessSecret);
    const [row] = rowsOf<{ r_user_id: string; r_center_id: string; r_full_name: string }>(
      await this.db.withContext(NO_CONTEXT, (tx) => tx.execute(sql`select * from app_telegram_redeem(${hash}, ${chatId}::bigint)`)),
    );
    if (!row) return null;
    await this.db.withContext({ centerId: row.r_center_id, isSuperAdmin: false }, (tx) =>
      writeAudit(tx, { centerId: row.r_center_id, actorId: row.r_user_id, action: 'telegram.link', entity: 'user', entityId: row.r_user_id }),
    );
    return { userId: row.r_user_id, fullName: row.r_full_name };
  }

  private blocked(chatId: number, now: number): boolean {
    const f = this.fails.get(chatId);
    if (!f) return false;
    if (f.resetAt <= now) {
      this.fails.delete(chatId);
      return false;
    }
    return f.count >= MAX_FAILS;
  }

  private recordFail(chatId: number, now: number): void {
    if (this.fails.size >= MAX_TRACKED_CHATS) {
      for (const [k, v] of this.fails) if (v.resetAt <= now) this.fails.delete(k);
      if (this.fails.size >= MAX_TRACKED_CHATS) this.fails.clear();
    }
    const f = this.fails.get(chatId);
    if (f && f.resetAt > now) f.count++;
    else this.fails.set(chatId, { count: 1, resetAt: now + FAIL_WINDOW_MS });
  }

  private async reply(chatId: number, text: string): Promise<void> {
    if (!this.sender.isConfigured()) return;
    await this.sender.send(chatId, text); // javob xatosi (masalan, to'sgan foydalanuvchi) e'tiborsiz
  }
}
