import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { PermissionsService } from '../auth/permissions.service.js';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { payrollPayouts, payrollPeriods, users } from '../db/schema.js';
import { PayrollRulesService } from './payroll-rules.service.js';
import { PayrollService } from './payroll.service.js';
import type { CreatePayoutInput, ListPayoutsQuery } from './payroll.schemas.js';

const forbidden = () => new ForbiddenException({ code: 'FORBIDDEN', message: "Bu amal uchun ruxsat yo'q" });
const payoutNotFound = () => new NotFoundException({ code: 'PAYOUT_NOT_FOUND', message: "Maosh to'lovi topilmadi" });

type PayoutRow = typeof payrollPayouts.$inferSelect;
const audited = (p: PayoutRow, month: string) => ({ month, employeeId: p.employeeId, amount: p.amount, method: p.method, status: p.status, reversesPayoutId: p.reversesPayoutId });

/**
 * Maosh to'lovi: `payroll.pay` (rahbar, kassir ○). Faqat tasdiqlangan davr, qoldiqdan oshmaydi. Append-only: xato teskari yozuv bilan
 * tuzatiladi (`payroll.approve` egasi, ya'ni rahbar). Hamma to'langach davr PAID, qaytarilsa yana APPROVED.
 */
@Injectable()
export class PayoutsService {
  constructor(
    private readonly db: DbService,
    private readonly perms: PermissionsService,
    private readonly payroll: PayrollService,
  ) {}

  private ctx(actor: AuthUser) {
    return contextOf(actor.centerId, actor.role);
  }

  create(actor: AuthUser, input: CreatePayoutInput, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'payroll.pay'))) throw forbidden();
      const monthStart = `${input.month}-01`;
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${'payroll:' + actor.centerId + ':' + monthStart}, 0))`);
      const [period] = await tx.select().from(payrollPeriods).where(eq(payrollPeriods.month, monthStart));
      if (!period) throw new NotFoundException({ code: 'PERIOD_NOT_FOUND', message: 'Maosh davri topilmadi' });
      if (period.status === 'DRAFT') throw new ConflictException({ code: 'PERIOD_NOT_APPROVED', message: "Avval davrni tasdiqlang" });
      await PayrollRulesService.assertEmployee(tx, input.employeeId);
      const t = (await this.payroll.totals(tx, period.id, input.employeeId)).get(input.employeeId);
      const remaining = t?.remaining ?? 0;
      if (input.amount > remaining) {
        throw new ConflictException({ code: 'PAYOUT_EXCEEDS_REMAINING', message: `To'lanadigan qoldiq ${remaining} so'm: undan ko'p to'lab bo'lmaydi` });
      }
      const [p] = await tx.insert(payrollPayouts).values({ centerId: actor.centerId!, periodId: period.id, employeeId: input.employeeId, amount: input.amount, method: input.method, note: input.note ?? null, paidBy: actor.id }).returning();
      const after = await this.payroll.syncStatus(tx, period.id);
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'payroll.pay', entity: 'payroll_payout', entityId: p!.id, after: { ...audited(p!, input.month), periodStatus: after.status }, ip: client.ip });
      return (await this.present(tx, [p!]))[0]!;
    });
  }

  reverse(actor: AuthUser, id: string, reason: string, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'payroll.approve'))) throw forbidden();
      const [found] = await tx.select().from(payrollPayouts).where(eq(payrollPayouts.id, id));
      if (!found) throw payoutNotFound();
      const [period] = await tx.select().from(payrollPeriods).where(eq(payrollPeriods.id, found.periodId));
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${'payroll:' + actor.centerId + ':' + period!.month}, 0))`);
      const [p] = await tx.select().from(payrollPayouts).where(eq(payrollPayouts.id, id));
      if (p!.reversesPayoutId) throw new ConflictException({ code: 'NOT_REVERSIBLE', message: "Qaytarish yozuvini qaytarib bo'lmaydi" });
      if (p!.status === 'REVERSED') throw new ConflictException({ code: 'ALREADY_REVERSED', message: "To'lov allaqachon qaytarilgan" });
      const [rev] = await tx.insert(payrollPayouts).values({ centerId: actor.centerId!, periodId: p!.periodId, employeeId: p!.employeeId, amount: -p!.amount, method: p!.method, status: 'CONFIRMED', reversesPayoutId: id, note: reason, paidBy: actor.id }).returning();
      await tx.update(payrollPayouts).set({ status: 'REVERSED' }).where(eq(payrollPayouts.id, id));
      const after = await this.payroll.syncStatus(tx, p!.periodId);
      const month = period!.month.slice(0, 7);
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'payroll.pay_reverse', entity: 'payroll_payout', entityId: id, before: audited(p!, month), after: { ...audited({ ...p!, status: 'REVERSED' }, month), reason, reversalId: rev!.id, periodStatus: after.status }, ip: client.ip });
      return (await this.present(tx, [{ ...p!, status: 'REVERSED' }]))[0]!;
    });
  }

  list(actor: AuthUser, q: ListPayoutsQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'payroll.view_all'))) throw forbidden();
      const conds: (SQL | undefined)[] = [
        q.employeeId ? eq(payrollPayouts.employeeId, q.employeeId) : undefined,
        q.month ? inArray(payrollPayouts.periodId, tx.select({ id: payrollPeriods.id }).from(payrollPeriods).where(eq(payrollPeriods.month, `${q.month}-01`))) : undefined,
      ];
      const rows = await tx.select().from(payrollPayouts).where(and(...conds)).orderBy(desc(payrollPayouts.paidAt), desc(payrollPayouts.id)).limit(q.limit).offset(q.offset);
      return { items: await this.present(tx, rows), limit: q.limit, offset: q.offset };
    });
  }

  private async present(tx: Tx, rows: PayoutRow[]) {
    if (!rows.length) return [];
    const ids = [...new Set(rows.flatMap((r) => [r.employeeId, r.paidBy].filter((x): x is string => !!x)))];
    const us = await tx.select({ id: users.id, fullName: users.fullName }).from(users).where(inArray(users.id, ids));
    const ps = await tx.select({ id: payrollPeriods.id, month: payrollPeriods.month }).from(payrollPeriods).where(inArray(payrollPeriods.id, [...new Set(rows.map((r) => r.periodId))]));
    return rows.map((r) => ({
      id: r.id,
      month: ps.find((p) => p.id === r.periodId)?.month.slice(0, 7) ?? null,
      employeeId: r.employeeId,
      employeeName: us.find((u) => u.id === r.employeeId)?.fullName ?? null,
      amount: r.amount,
      method: r.method,
      status: r.status,
      reversesPayoutId: r.reversesPayoutId,
      note: r.note,
      paidBy: r.paidBy,
      paidByName: us.find((u) => u.id === r.paidBy)?.fullName ?? null,
      paidAt: r.paidAt,
    }));
  }
}
