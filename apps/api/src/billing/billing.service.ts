import { Injectable } from '@nestjs/common';
import { and, eq, inArray, isNull, sql, type SQL } from 'drizzle-orm';
import { todayLocal } from '../common/dates.js';
import type { Tx } from '../db/db.service.js';
import { centers, charges, enrollmentDiscounts, enrollmentFreezes, enrollments, groups, groupSchedules } from '../db/schema.js';
import { type BillingMode, type ChargeDraft, type EngineDiscount, type JoinProration, planCharges } from './billing-engine.js';

export interface GenerateOptions {
  /** Hisoblash sanasi (sukut: biznes bugun). */
  asOf?: string;
  /** Faqat shu yozilishlar / guruh / o'quvchi uchun; hech biri berilmasa markazdagi hamma faol yozilish. */
  enrollmentIds?: string[];
  groupId?: string;
  studentId?: string;
  /** Chiqish/ko'chirish sanasi: shu kun va undan keyingi davrlar yaratilmaydi. */
  leftAt?: string | null;
}

const CHUNK = 1000;
const chunks = <T>(xs: T[]): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += CHUNK) out.push(xs.slice(i, i + CHUNK));
  return out;
};

/**
 * Hisob-kitob (charges) yaratish: motor (`billing-engine.ts`) DB ma'lumoti bilan oziqlanadi. Takroriy chaqirish xavfsiz
 * (davr boshiga unikal indeks). Faqat chaqiruvchining tranzaksiyasi ichida ishlaydi (RLS konteksti tashqaridan).
 * Faqat `ACTIVE` yozilishlar hisoblanadi: muzlatish/chiqishdan OLDIN chaqiruvchi shu yozilish uchun `generate` ni ishga tushiradi.
 */
@Injectable()
export class BillingService {
  /** Yaratilgan charge'lar soni. */
  async generate(tx: Tx, centerId: string, opts: GenerateOptions = {}): Promise<number> {
    const asOf = opts.asOf ?? todayLocal();
    const conds: (SQL | undefined)[] = [
      eq(enrollments.status, 'ACTIVE'),
      opts.enrollmentIds ? inArray(enrollments.id, opts.enrollmentIds) : undefined,
      opts.groupId ? eq(enrollments.groupId, opts.groupId) : undefined,
      opts.studentId ? eq(enrollments.studentId, opts.studentId) : undefined,
    ];
    const rows = await tx
      .select({ e: enrollments, g: groups })
      .from(enrollments)
      .innerJoin(groups, eq(groups.id, enrollments.groupId))
      .where(and(...conds));
    if (!rows.length) return 0;

    const [center] = await tx.select({ settings: centers.settings }).from(centers).where(eq(centers.id, centerId));
    const joinProration: JoinProration = (center?.settings as { join_proration?: string } | undefined)?.join_proration === 'REMAINING_LESSONS' ? 'REMAINING_LESSONS' : 'FULL_MONTH';

    const enrollmentIds = rows.map((r) => r.e.id);
    const groupIds = [...new Set(rows.map((r) => r.g.id))];
    const existing = new Map<string, Set<string>>();
    const freezes = new Map<string, { from: string; to: string | null }[]>();
    const discounts = new Map<string, EngineDiscount[]>();
    const schedules = new Map<string, number[]>();

    for (const ids of chunks(enrollmentIds)) {
      for (const c of await tx
        .select({ enrollmentId: charges.enrollmentId, periodStart: charges.periodStart })
        .from(charges)
        .where(and(inArray(charges.enrollmentId, ids), inArray(charges.kind, ['REGULAR', 'FIRST_PRORATED'])))) {
        (existing.get(c.enrollmentId) ?? existing.set(c.enrollmentId, new Set()).get(c.enrollmentId)!).add(c.periodStart);
      }
      for (const f of await tx.select().from(enrollmentFreezes).where(inArray(enrollmentFreezes.enrollmentId, ids))) {
        (freezes.get(f.enrollmentId) ?? freezes.set(f.enrollmentId, []).get(f.enrollmentId)!).push({ from: f.fromDate, to: f.toDate });
      }
      for (const d of await tx.select().from(enrollmentDiscounts).where(inArray(enrollmentDiscounts.enrollmentId, ids))) {
        (discounts.get(d.enrollmentId) ?? discounts.set(d.enrollmentId, []).get(d.enrollmentId)!).push({
          type: d.type as EngineDiscount['type'],
          value: d.value,
          fromDate: d.fromDate,
          toDate: d.toDate,
        });
      }
    }
    for (const s of await tx.select({ groupId: groupSchedules.groupId, weekday: groupSchedules.weekday }).from(groupSchedules).where(inArray(groupSchedules.groupId, groupIds))) {
      (schedules.get(s.groupId) ?? schedules.set(s.groupId, []).get(s.groupId)!).push(s.weekday);
    }

    const inserts: (typeof charges.$inferInsert)[] = [];
    for (const { e, g } of rows) {
      const drafts: ChargeDraft[] = planCharges(
        { joinedAt: e.joinedAt, billingAnchor: e.billingAnchor, priceOverride: e.priceOverride },
        {
          priceMonthly: g.priceMonthly,
          billingMode: g.billingMode as BillingMode,
          billingDay: g.billingDay,
          startDate: g.startDate,
          endDate: g.endDate,
          status: g.status as 'PLANNED' | 'ACTIVE' | 'FINISHED',
          archived: g.archivedAt !== null,
          scheduleWeekdays: schedules.get(g.id) ?? [],
        },
        { asOf, joinProration, existingPeriodStarts: existing.get(e.id) ?? new Set(), freezes: freezes.get(e.id) ?? [], discounts: discounts.get(e.id) ?? [], leftAt: opts.leftAt },
      );
      for (const d of drafts) {
        inserts.push({
          centerId,
          enrollmentId: e.id,
          studentId: e.studentId,
          groupId: e.groupId,
          periodStart: d.periodStart,
          periodEnd: d.periodEnd,
          dueDate: d.dueDate,
          baseAmount: d.baseAmount,
          discountAmount: d.discountAmount,
          amount: d.amount,
          status: d.amount === 0 ? 'PAID' : 'OPEN',
          kind: d.kind,
        });
      }
    }

    let created = 0;
    for (const part of chunks(inserts)) {
      const res = await tx.insert(charges).values(part).onConflictDoNothing().returning({ id: charges.id });
      created += res.length;
    }
    return created;
  }

  /** Muzlatishni boshlaydi (yozilish holati chaqiruvchi tomonidan o'zgartiriladi). Avval shu kungacha bo'lgan charge'lar yaratilgan bo'lishi kerak. */
  async openFreeze(tx: Tx, centerId: string, enrollmentId: string, fromDate: string, actorId: string): Promise<void> {
    await tx.insert(enrollmentFreezes).values({ centerId, enrollmentId, fromDate, createdBy: actorId });
  }

  /** Ochiq muzlatishni yopadi (qaytarish/chiqish/arxivlash). `to_date` boshlanish sanasidan oldin bo'lib qolmasligi uchun kattasi olinadi. */
  async closeOpenFreezes(tx: Tx, target: { enrollmentIds?: string[]; studentId?: string }, toDate: string): Promise<void> {
    const ids = target.enrollmentIds
      ? inArray(enrollmentFreezes.enrollmentId, target.enrollmentIds)
      : inArray(enrollmentFreezes.enrollmentId, tx.select({ id: enrollments.id }).from(enrollments).where(eq(enrollments.studentId, target.studentId!)));
    await tx
      .update(enrollmentFreezes)
      .set({ toDate: sql`greatest(${enrollmentFreezes.fromDate}, ${toDate}::date)` })
      .where(and(ids, isNull(enrollmentFreezes.toDate)));
  }

  /** Guruhda (bekor qilinmagan) hisob-kitob bormi: sikl rejimi/kunini o'zgartirishni taqiqlash uchun. */
  async groupHasCharges(tx: Tx, groupId: string): Promise<boolean> {
    const [row] = await tx.select({ id: charges.id }).from(charges).where(and(eq(charges.groupId, groupId), inArray(charges.kind, ['REGULAR', 'FIRST_PRORATED']))).limit(1);
    return !!row;
  }
}
