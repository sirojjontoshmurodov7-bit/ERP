import { Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import type { Tx } from '../db/db.service.js';
import { charges, paymentAllocations, payments } from '../db/schema.js';

/**
 * To'lovlarni hisob-kitoblarga taqsimlash (FIFO) va avans. Hamma yozuv chaqiruvchining tranzaksiyasida.
 *
 * Model: taqsimot qatorlari faqat qo'shiladi (musbat = taqsimlash, manfiy = qaytarish). Hisobning to'langani = uning taqsimotlari yig'indisi.
 * "Havza" (pool) = asl (qaytarilmagan, CONFIRMED) to'lovlar; ularning taqsimlanmagan qoldig'i = avans.
 * Invariant: o'quvchida avans va ochiq hisob bir vaqtda bo'lmaydi (har o'zgarishdan keyin `allocate` chaqiriladi).
 */
@Injectable()
export class AllocatorService {
  /** O'quvchi bo'yicha pul amallarini ketma-ketlashtiradi (bitta tranzaksiya oxirigacha). */
  async lockStudent(tx: Tx, studentId: string): Promise<void> {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${'stud:' + studentId}, 0))`);
  }

  /** Markaz bo'yicha ketma-ket chek raqami (markaz kaliti bo'yicha qulf + eng kattasi + 1; unikal indeks himoya qiladi). */
  async nextReceiptNo(tx: Tx, centerId: string): Promise<number> {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${'rcpt:' + centerId}, 0))`);
    const [r] = await tx.select({ n: sql<string>`coalesce(max(${payments.receiptNo}), 0) + 1` }).from(payments).where(eq(payments.centerId, centerId));
    return Number(r!.n);
  }

  /** Hisoblarning to'langan summasi (taqsimotlar yig'indisi). */
  async paidByCharge(tx: Tx, chargeIds: string[]): Promise<Map<string, number>> {
    const out = new Map<string, number>();
    if (!chargeIds.length) return out;
    const rows = await tx
      .select({ id: paymentAllocations.chargeId, paid: sql<string>`sum(${paymentAllocations.amount})` })
      .from(paymentAllocations)
      .where(inArray(paymentAllocations.chargeId, chargeIds))
      .groupBy(paymentAllocations.chargeId);
    for (const r of rows) out.set(r.id, Number(r.paid));
    return out;
  }

  /** Asl to'lovlarning taqsimlanmagan qoldig'i (eskisi birinchi). Faqat qoldig'i > 0 qaytadi. */
  async pools(tx: Tx, studentId: string): Promise<{ id: string; remaining: number }[]> {
    const pays = await tx
      .select({ id: payments.id, amount: payments.amount })
      .from(payments)
      .where(and(eq(payments.studentId, studentId), eq(payments.status, 'CONFIRMED'), sql`${payments.reversesPaymentId} is null`))
      .orderBy(asc(payments.paidAt), asc(payments.createdAt), asc(payments.id));
    if (!pays.length) return [];
    const used = await tx
      .select({ id: paymentAllocations.paymentId, used: sql<string>`sum(${paymentAllocations.amount})` })
      .from(paymentAllocations)
      .where(inArray(paymentAllocations.paymentId, pays.map((p) => p.id)))
      .groupBy(paymentAllocations.paymentId);
    const usedBy = new Map(used.map((u) => [u.id, Number(u.used)]));
    return pays.map((p) => ({ id: p.id, remaining: p.amount - (usedBy.get(p.id) ?? 0) })).filter((p) => p.remaining > 0);
  }

  /** Hisob holatini taqsimotlardan qayta hisoblaydi (CANCELLED tegilmaydi). */
  async syncStatuses(tx: Tx, chargeIds: string[]): Promise<void> {
    const ids = [...new Set(chargeIds)];
    if (!ids.length) return;
    const rows = await tx.select().from(charges).where(and(inArray(charges.id, ids), sql`${charges.status} <> 'CANCELLED'`));
    const paid = await this.paidByCharge(tx, rows.map((c) => c.id));
    for (const c of rows) {
      const p = paid.get(c.id) ?? 0;
      const status = p >= c.amount ? 'PAID' : p > 0 ? 'PARTIAL' : 'OPEN';
      if (status !== c.status) await tx.update(charges).set({ status, updatedAt: new Date() }).where(eq(charges.id, c.id));
    }
  }

  /**
   * Avansni o'quvchining ochiq hisoblariga eng eskisidan boshlab taqsimlaydi. Ish bo'lmasa hech narsa yozmaydi.
   * Chaqiruvchi avval `lockStudent` qilgan bo'lishi shart (generate/charge amallari ichida shu yerda qulflanadi).
   */
  async allocate(tx: Tx, centerId: string, studentId: string): Promise<number> {
    await this.lockStudent(tx, studentId);
    const pools = await this.pools(tx, studentId);
    if (!pools.length) return 0;
    const open = await tx
      .select()
      .from(charges)
      .where(and(eq(charges.studentId, studentId), inArray(charges.status, ['OPEN', 'PARTIAL'])))
      .orderBy(asc(charges.dueDate), asc(charges.periodStart), asc(charges.createdAt), asc(charges.id));
    if (!open.length) return 0;
    const paid = await this.paidByCharge(tx, open.map((c) => c.id));

    const rows: (typeof paymentAllocations.$inferInsert)[] = [];
    const touched: string[] = [];
    let pi = 0;
    for (const c of open) {
      let need = c.amount - (paid.get(c.id) ?? 0);
      while (need > 0 && pi < pools.length) {
        const pool = pools[pi]!;
        const take = Math.min(need, pool.remaining);
        rows.push({ centerId, paymentId: pool.id, chargeId: c.id, amount: take });
        touched.push(c.id);
        need -= take;
        pool.remaining -= take;
        if (pool.remaining === 0) pi++;
      }
      if (pi >= pools.length) break;
    }
    if (!rows.length) return 0;
    await tx.insert(paymentAllocations).values(rows);
    await this.syncStatuses(tx, touched);
    return rows.reduce((s, r) => s + r.amount, 0);
  }

  /** Bir nechta o'quvchi uchun (hisob yaratilgandan keyin). */
  async allocateMany(tx: Tx, centerId: string, studentIds: string[]): Promise<void> {
    for (const id of [...new Set(studentIds)].sort()) await this.allocate(tx, centerId, id);
  }
}
