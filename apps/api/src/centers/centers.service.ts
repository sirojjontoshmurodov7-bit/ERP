import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DEFAULT_CENTER_SETTINGS, DEFAULT_TRIAL_DAYS, defaultRolePermissionRows } from '@erp/shared';
import { and, asc, desc, eq, isNull, type SQL } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { AuthUser } from '../auth/auth.types.js';
import type { ClientInfo } from '../auth/auth.service.js';
import { hashPassword } from '../auth/password.js';
import { generateTempPassword } from '../auth/temp-password.js';
import { uniqueViolation } from '../common/pg-errors.js';
import { slugify } from '../common/slug.js';
import { DbService, enterCenter, type Tx } from '../db/db.service.js';
import { branches, centerRolePermissions, centers, plans, sessions, users } from '../db/schema.js';
import type { CreateCenterInput, ListCentersQuery, UpdateCenterInput } from './centers.schemas.js';

const SUPER = { centerId: null, isSuperAdmin: true } as const;
/** Mavjud markaz ustida ishlash: super admin bayrog'i + shu markaz konteksti (sessiyalar, rahbar qatori uchun). */
const inCenter = (centerId: string) => ({ centerId, isSuperAdmin: true }) as const;

const notFound = () => new NotFoundException({ code: 'CENTER_NOT_FOUND', message: 'Markaz topilmadi' });
const DAY_MS = 86_400_000;

export interface CreatedCenter {
  center: { id: string; name: string; slug: string; status: string; trialEndsAt: Date | null };
  branch: { id: string; name: string };
  owner: { id: string; login: string; fullName: string; temporaryPassword: string };
}

@Injectable()
export class CentersService {
  constructor(private readonly db: DbService) {}

  /** Markaz + "Asosiy filial" + rol shabloni + rahbar akkaunti: bitta tranzaksiyada, yoki hech narsa. */
  async create(actor: AuthUser, input: CreateCenterInput, client: ClientInfo): Promise<CreatedCenter> {
    const slug = input.slug ?? slugify(input.name);
    if (slug.length < 3) {
      throw new BadRequestException({ code: 'SLUG_REQUIRED', message: "Markaz nomidan slug hosil bo'lmadi, slug kiriting" });
    }
    const firstName = slugify(input.ownerFullName.split(/\s+/)[0] ?? '', 20) || 'rahbar';
    const ownerLogin = input.ownerLogin ?? `${slug}.${firstName}`;
    const trialDays = input.trialDays ?? DEFAULT_TRIAL_DAYS;
    const temporaryPassword = generateTempPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    try {
      return await this.db.withContext(SUPER, async (tx) => {
        if (input.planId) {
          const [plan] = await tx.select({ id: plans.id }).from(plans).where(eq(plans.id, input.planId));
          if (!plan) throw new NotFoundException({ code: 'PLAN_NOT_FOUND', message: 'Tarif topilmadi' });
        }

        const trialEndsAt = trialDays > 0 ? new Date(Date.now() + trialDays * DAY_MS) : null;
        const [center] = await tx
          .insert(centers)
          .values({
            name: input.name,
            slug,
            status: trialDays > 0 ? 'TRIAL' : 'ACTIVE',
            planId: input.planId ?? null,
            trialEndsAt,
            settings: DEFAULT_CENTER_SETTINGS,
            createdBy: actor.id,
          })
          .returning();

        // Shu tranzaksiyada yangi markaz kontekstiga o'tamiz: tenant siyosatlari yozuvlarni qabul qiladi.
        await enterCenter(tx, center!.id);
        const centerId = center!.id;

        const [branch] = await tx.insert(branches).values({ centerId, name: 'Asosiy filial' }).returning();
        await tx
          .insert(centerRolePermissions)
          .values(defaultRolePermissionRows().map((r) => ({ centerId, ...r })));
        const [owner] = await tx
          .insert(users)
          .values({
            centerId,
            role: 'OWNER',
            login: ownerLogin,
            passwordHash,
            mustChangePassword: true,
            fullName: input.ownerFullName,
            phone: input.ownerPhone ?? null,
            createdBy: actor.id,
          })
          .returning();

        await writeAudit(tx, {
          centerId,
          actorId: actor.id,
          action: 'center.create',
          entity: 'center',
          entityId: centerId,
          after: { name: input.name, slug, status: center!.status, planId: input.planId ?? null, trialEndsAt },
          ip: client.ip,
        });
        await writeAudit(tx, {
          centerId,
          actorId: actor.id,
          action: 'owner.create',
          entity: 'owner',
          entityId: owner!.id,
          after: { login: ownerLogin, fullName: input.ownerFullName }, // parolsiz
          ip: client.ip,
        });

        return {
          center: { id: centerId, name: center!.name, slug, status: center!.status, trialEndsAt },
          branch: { id: branch!.id, name: branch!.name },
          owner: { id: owner!.id, login: ownerLogin, fullName: owner!.fullName, temporaryPassword },
        };
      });
    } catch (e) {
      const constraint = uniqueViolation(e);
      if (constraint === null) throw e;
      if (constraint.includes('login')) {
        throw new ConflictException({ code: 'LOGIN_TAKEN', message: 'Bu login band, boshqasini kiriting' });
      }
      if (constraint.includes('slug') || constraint.includes('centers')) {
        throw new ConflictException({ code: 'SLUG_TAKEN', message: 'Bu slug band, boshqasini kiriting' });
      }
      throw new ConflictException({ code: 'ALREADY_EXISTS', message: 'Bunday yozuv allaqachon bor' });
    }
  }

  list(query: ListCentersQuery) {
    return this.db.withContext(SUPER, async (tx) => {
      const where: SQL | undefined = query.status ? eq(centers.status, query.status) : undefined;
      const items = await tx
        .select({
          id: centers.id,
          name: centers.name,
          slug: centers.slug,
          status: centers.status,
          planId: centers.planId,
          planName: plans.name,
          trialEndsAt: centers.trialEndsAt,
          blockedAt: centers.blockedAt,
          blockedReason: centers.blockedReason,
          createdAt: centers.createdAt,
        })
        .from(centers)
        .leftJoin(plans, eq(plans.id, centers.planId))
        .where(where)
        .orderBy(desc(centers.createdAt))
        .limit(query.limit)
        .offset(query.offset);
      return { items, limit: query.limit, offset: query.offset };
    });
  }

  async get(id: string) {
    return this.db.withContext(inCenter(id), async (tx) => {
      const center = await this.load(tx, id);
      const owners = await tx
        .select({
          id: users.id,
          login: users.login,
          fullName: users.fullName,
          status: users.status,
          mustChangePassword: users.mustChangePassword,
          lastLoginAt: users.lastLoginAt,
        })
        .from(users)
        .where(and(eq(users.centerId, id), eq(users.role, 'OWNER')))
        .orderBy(asc(users.createdAt));
      return { ...center, owners };
    });
  }

  async update(actor: AuthUser, id: string, patch: UpdateCenterInput, client: ClientInfo) {
    return this.db.withContext(inCenter(id), async (tx) => {
      const before = await this.load(tx, id);
      if (patch.planId) {
        const [plan] = await tx.select({ id: plans.id }).from(plans).where(eq(plans.id, patch.planId));
        if (!plan) throw new NotFoundException({ code: 'PLAN_NOT_FOUND', message: 'Tarif topilmadi' });
      }
      const set: Partial<typeof centers.$inferInsert> = { updatedAt: new Date() };
      if (patch.name !== undefined) set.name = patch.name;
      if (patch.planId !== undefined) set.planId = patch.planId;
      if (patch.trialEndsAt !== undefined) set.trialEndsAt = patch.trialEndsAt ? new Date(patch.trialEndsAt) : null;
      const [after] = await tx.update(centers).set(set).where(eq(centers.id, id)).returning();
      const pick = (c: typeof before) => ({ name: c.name, planId: c.planId, trialEndsAt: c.trialEndsAt });
      await writeAudit(tx, {
        centerId: id,
        actorId: actor.id,
        action: 'center.edit',
        entity: 'center',
        entityId: id,
        before: pick(before),
        after: pick(after!),
        ip: client.ip,
      });
      return after!;
    });
  }

  /** Bloklash: holat o'zgaradi va markazning hamma sessiyasi yopiladi (qo'riqchi baribir har so'rovda tekshiradi). */
  async block(actor: AuthUser, id: string, reason: string, client: ClientInfo) {
    return this.db.withContext(inCenter(id), async (tx) => {
      const before = await this.load(tx, id);
      if (before.status === 'BLOCKED') {
        throw new ConflictException({ code: 'ALREADY_BLOCKED', message: 'Markaz allaqachon bloklangan' });
      }
      const now = new Date();
      const [after] = await tx
        .update(centers)
        .set({ status: 'BLOCKED', blockedAt: now, blockedReason: reason, updatedAt: now })
        .where(eq(centers.id, id))
        .returning();
      await tx.update(sessions).set({ revokedAt: now }).where(and(eq(sessions.centerId, id), isNull(sessions.revokedAt)));
      await writeAudit(tx, {
        centerId: id,
        actorId: actor.id,
        action: 'center.block',
        entity: 'center',
        entityId: id,
        before: { status: before.status },
        after: { status: 'BLOCKED', reason },
        ip: client.ip,
      });
      return after!;
    });
  }

  /** Blokdan chiqarish: sinov muddati tugamagan bo'lsa TRIAL'ga, aks holda ACTIVE'ga qaytadi. */
  async unblock(actor: AuthUser, id: string, client: ClientInfo) {
    return this.db.withContext(inCenter(id), async (tx) => {
      const before = await this.load(tx, id);
      if (before.status !== 'BLOCKED') {
        throw new ConflictException({ code: 'NOT_BLOCKED', message: 'Markaz bloklanmagan' });
      }
      const status = before.trialEndsAt && before.trialEndsAt.getTime() > Date.now() ? 'TRIAL' : 'ACTIVE';
      const [after] = await tx
        .update(centers)
        .set({ status, blockedAt: null, blockedReason: null, updatedAt: new Date() })
        .where(eq(centers.id, id))
        .returning();
      await writeAudit(tx, {
        centerId: id,
        actorId: actor.id,
        action: 'center.unblock',
        entity: 'center',
        entityId: id,
        before: { status: 'BLOCKED', reason: before.blockedReason },
        after: { status },
        ip: client.ip,
      });
      return after!;
    });
  }

  /** Rahbar parolini yo'qotsa faqat super admin tiklaydi: yangi vaqtinchalik parol, majburiy almashtirish, sessiyalar yopiladi. */
  async resetOwnerPassword(actor: AuthUser, centerId: string, userId: string | undefined, client: ClientInfo) {
    const temporaryPassword = generateTempPassword();
    const passwordHash = await hashPassword(temporaryPassword);
    return this.db.withContext(inCenter(centerId), async (tx) => {
      await this.load(tx, centerId);
      const [owner] = await tx
        .select({ id: users.id, login: users.login })
        .from(users)
        .where(and(eq(users.centerId, centerId), eq(users.role, 'OWNER'), userId ? eq(users.id, userId) : undefined))
        .orderBy(asc(users.createdAt))
        .limit(1);
      if (!owner) throw new NotFoundException({ code: 'OWNER_NOT_FOUND', message: 'Rahbar topilmadi' });

      const now = new Date();
      await tx.update(users).set({ passwordHash, mustChangePassword: true, updatedAt: now }).where(eq(users.id, owner.id));
      await tx.update(sessions).set({ revokedAt: now }).where(and(eq(sessions.userId, owner.id), isNull(sessions.revokedAt)));
      await writeAudit(tx, {
        centerId,
        actorId: actor.id,
        action: 'owner.reset_password',
        entity: 'owner',
        entityId: owner.id,
        ip: client.ip,
      });
      return { owner: { id: owner.id, login: owner.login }, temporaryPassword };
    });
  }

  private async load(tx: Tx, id: string) {
    const [center] = await tx.select().from(centers).where(eq(centers.id, id));
    if (!center) throw notFound();
    return center;
  }
}

