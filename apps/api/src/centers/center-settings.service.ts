import { Injectable, NotFoundException } from '@nestjs/common';
import { DEFAULT_CENTER_SETTINGS } from '@erp/shared';
import { eq } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { centers, plans } from '../db/schema.js';
import { DEFAULT_ATTENDANCE_LOCK_DAYS } from '../lessons/lessons.service.js';
import type { UpdateCenterSettingsInput } from './center-settings.schemas.js';

/** Bazadagi (snake_case, qisman) sozlamalardan to'liq, tekshirilgan ko'rinish; noto'g'ri/yo'q qiymat o'rniga sukut. */
export function effectiveSettings(raw: unknown) {
  const s = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const int = (v: unknown, min: number, max: number, dflt: number) => (typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : dflt);
  const oneOf = <T extends string>(v: unknown, allowed: readonly T[], dflt: T): T => (allowed.includes(v as T) ? (v as T) : dflt);
  return {
    billingMode: oneOf<'GROUP_CYCLE' | 'STUDENT_CYCLE'>(s.billing_mode, ['GROUP_CYCLE', 'STUDENT_CYCLE'], 'GROUP_CYCLE'),
    graceDays: int(s.grace_days, 0, 60, DEFAULT_CENTER_SETTINGS.grace_days),
    joinProration: oneOf<'FULL_MONTH' | 'REMAINING_LESSONS'>(s.join_proration, ['FULL_MONTH', 'REMAINING_LESSONS'], 'FULL_MONTH'),
    attendanceLockDays: int(s.attendance_lock_days, 0, 365, DEFAULT_ATTENDANCE_LOCK_DAYS),
    locale: oneOf<'uz' | 'ru' | 'en'>(s.locale, ['uz', 'ru', 'en'], 'uz'),
  };
}

const KEYS = { billingMode: 'billing_mode', graceDays: 'grace_days', joinProration: 'join_proration', attendanceLockDays: 'attendance_lock_days', locale: 'locale' } as const;

/**
 * Markaz sozlamalari (`centers.settings`): o'qish rahbar va admin, o'zgartirish faqat rahbar.
 * Faqat yangi yaratiladigan guruhlar (sukut sikl va grace) va kelajakdagi hisoblar/davomat qulfiga ta'sir qiladi;
 * mavjud guruhlar va yaratilgan hisoblar o'zgarmaydi.
 */
@Injectable()
export class CenterSettingsService {
  constructor(private readonly db: DbService) {}

  private async view(tx: Tx, centerId: string) {
    const [row] = await tx
      .select({ name: centers.name, status: centers.status, trialEndsAt: centers.trialEndsAt, settings: centers.settings, planName: plans.name, maxStudents: plans.maxStudents, maxBranches: plans.maxBranches })
      .from(centers)
      .leftJoin(plans, eq(plans.id, centers.planId))
      .where(eq(centers.id, centerId));
    if (!row) throw new NotFoundException({ code: 'CENTER_NOT_FOUND', message: 'Markaz topilmadi' });
    return {
      name: row.name,
      status: row.status,
      trialEndsAt: row.trialEndsAt,
      plan: row.planName ? { name: row.planName, maxStudents: row.maxStudents, maxBranches: row.maxBranches } : null,
      settings: effectiveSettings(row.settings),
      raw: row.settings as Record<string, unknown>,
    };
  }

  async get(actor: AuthUser) {
    const { raw: _raw, ...v } = await this.db.withContext(contextOf(actor.centerId, actor.role), (tx) => this.view(tx, actor.centerId!));
    return v;
  }

  update(actor: AuthUser, patch: UpdateCenterSettingsInput, client: ClientInfo) {
    return this.db.withContext(contextOf(actor.centerId, actor.role), async (tx) => {
      const before = await this.view(tx, actor.centerId!);
      const merged: Record<string, unknown> = { ...before.raw };
      for (const k of Object.keys(patch) as (keyof typeof KEYS)[]) merged[KEYS[k]] = patch[k];
      await tx.update(centers).set({ settings: merged, updatedAt: new Date() }).where(eq(centers.id, actor.centerId!));
      const { raw: _r, ...after } = await this.view(tx, actor.centerId!);
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'center.settings', entity: 'center', entityId: actor.centerId, before: before.settings, after: after.settings, ip: client.ip });
      return after;
    });
  }
}
