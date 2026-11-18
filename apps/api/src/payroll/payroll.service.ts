import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { PermissionsService } from '../auth/permissions.service.js';
import { BillingService } from '../billing/billing.service.js';
import { todayLocal } from '../common/dates.js';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { rowsOf } from '../db/rows.js';
import { groupTeachers, groups, lessons, payrollAdjustments, payrollItems, payrollPayouts, payrollPeriods, payrollRules, users } from '../db/schema.js';
import { type EngineRule, type GroupBase, monthEndOf, planPayroll, ruleActiveIn } from './payroll-engine.js';
import { PayrollRulesService } from './payroll-rules.service.js';
import type { CreateAdjustmentInput, ListPeriodsQuery } from './payroll.schemas.js';

const forbidden = () => new ForbiddenException({ code: 'FORBIDDEN', message: "Bu amal uchun ruxsat yo'q" });
const periodNotFound = () => new NotFoundException({ code: 'PERIOD_NOT_FOUND', message: 'Maosh davri topilmadi' });
const locked = () => new ConflictException({ code: 'PERIOD_LOCKED', message: "Davr tasdiqlangan: o'zgartirib bo'lmaydi (tuzatishni keyingi davrda kiriting)" });

type PeriodRow = typeof payrollPeriods.$inferSelect;
const periodView = (p: PeriodRow) => ({ id: p.id, month: p.month.slice(0, 7), status: p.status, calculatedAt: p.calculatedAt, approvedBy: p.approvedBy, approvedAt: p.approvedAt });

export interface EmployeeTotals {
  gross: number;
  adjustmentsTotal: number;
  total: number;
  paid: number;
  remaining: number;
}

/**
 * Maosh davri: hisoblash (`payroll.calculate`), tasdiqlash (`payroll.approve`, rahbar), bonus/jarima, ko'rish
 * (`payroll.view_all`: rahbar va kassir; `payroll.view_own`: o'z maoshi). DRAFT davr qayta hisoblanadi; tasdiqlangach qulflanadi
 * (trigger), tuzatish keyingi davrda bonus/jarima bilan kiritiladi.
 */
@Injectable()
export class PayrollService {
  constructor(
    private readonly db: DbService,
    private readonly perms: PermissionsService,
    private readonly billing: BillingService,
  ) {}

  private ctx(actor: AuthUser) {
    return contextOf(actor.centerId, actor.role);
  }

  // ------------------------------------------------------------------ hisoblash

  calculate(actor: AuthUser, month: string, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'payroll.calculate'))) throw forbidden();
      const monthStart = `${month}-01`;
      if (monthStart > todayLocal()) throw new BadRequestException({ code: 'MONTH_IN_FUTURE', message: "Kelajak oyi uchun maosh hisoblab bo'lmaydi" });
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${'payroll:' + actor.centerId + ':' + monthStart}, 0))`);
      let [period] = await tx.select().from(payrollPeriods).where(eq(payrollPeriods.month, monthStart));
      if (period && period.status !== 'DRAFT') throw locked();
      period ??= (await tx.insert(payrollPeriods).values({ centerId: actor.centerId!, month: monthStart }).returning())[0]!;

      await this.billing.generate(tx, actor.centerId!); // "hisoblangan" asosi uchun hisoblar yangilanadi
      const ruleRows = await tx.select().from(payrollRules);
      const rules: EngineRule[] = ruleRows
        .filter((r) => ruleActiveIn(r, monthStart))
        .map((r) => ({ ...r, type: r.type as EngineRule['type'], percent: r.percent === null ? null : Number(r.percent), percentBase: r.percentBase as EngineRule['percentBase'], teacherKind: r.teacherKind as EngineRule['teacherKind'] }));
      const monthEnd = monthEndOf(monthStart);

      const attachments = (await tx.select().from(groupTeachers).where(sql`${groupTeachers.fromDate} <= ${monthEnd}::date and (${groupTeachers.toDate} is null or ${groupTeachers.toDate} >= ${monthStart}::date)`)).map((a) => ({
        employeeId: a.teacherId,
        groupId: a.groupId,
        kind: a.kind as 'MAIN' | 'ASSISTANT',
        from: a.fromDate,
        to: a.toDate,
      }));
      const lessonRows = await tx
        .select({ employeeId: lessons.teacherId, groupId: lessons.groupId, count: sql<number>`count(*)::int` })
        .from(lessons)
        .where(and(eq(lessons.status, 'HELD'), sql`${lessons.teacherId} is not null`, sql`${lessons.lessonDate} between ${monthStart}::date and ${monthEnd}::date`))
        .groupBy(lessons.teacherId, lessons.groupId);
      const bases = new Map<string, GroupBase>();
      if (rules.some((r) => r.type === 'PERCENT')) {
        const get = (g: string) => bases.get(g) ?? bases.set(g, { paid: 0, charged: 0 }).get(g)!;
        for (const r of rowsOf<{ groupId: string; v: string }>(
          await tx.execute(sql`select c.group_id as "groupId", sum(a.amount) as v from payment_allocations a join charges c on c.id = a.charge_id
            where (a.created_at at time zone 'Asia/Tashkent')::date between ${monthStart}::date and ${monthEnd}::date group by c.group_id`),
        )) get(r.groupId).paid = Number(r.v);
        for (const r of rowsOf<{ groupId: string; v: string }>(
          await tx.execute(sql`select group_id as "groupId", sum(amount) as v from charges
            where status <> 'CANCELLED' and due_date between ${monthStart}::date and ${monthEnd}::date group by group_id`),
        )) get(r.groupId).charged = Number(r.v);
      }

      const drafts = planPayroll({ month: monthStart, rules, attachments, lessons: lessonRows.map((l) => ({ employeeId: l.employeeId!, groupId: l.groupId, count: l.count })), bases });
      await tx.delete(payrollItems).where(eq(payrollItems.periodId, period.id));
      if (drafts.length) {
        await tx.insert(payrollItems).values(drafts.map((d) => ({ centerId: actor.centerId!, periodId: period.id, employeeId: d.employeeId, ruleId: d.ruleId, groupId: d.groupId, baseAmount: d.baseAmount, amount: d.amount, description: d.description })));
      }
      await tx.update(payrollPeriods).set({ calculatedAt: new Date() }).where(eq(payrollPeriods.id, period.id));
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'payroll.calculate', entity: 'payroll_period', entityId: period.id, after: { month, items: drafts.length, total: drafts.reduce((s, d) => s + d.amount, 0) }, ip: client.ip });
      return this.detail(tx, (await tx.select().from(payrollPeriods).where(eq(payrollPeriods.id, period.id)))[0]!);
    });
  }

  approve(actor: AuthUser, month: string, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'payroll.approve'))) throw forbidden();
      const [period] = await tx.select().from(payrollPeriods).where(eq(payrollPeriods.month, `${month}-01`));
      if (!period) throw periodNotFound();
      if (period.status !== 'DRAFT') throw new ConflictException({ code: 'ALREADY_APPROVED', message: 'Davr allaqachon tasdiqlangan' });
      if (!period.calculatedAt) throw new ConflictException({ code: 'NOT_CALCULATED', message: 'Avval maoshni hisoblang' });
      const now = new Date();
      const [after] = await tx.update(payrollPeriods).set({ status: 'APPROVED', approvedBy: actor.id, approvedAt: now }).where(eq(payrollPeriods.id, period.id)).returning();
      const t = await this.totals(tx, period.id);
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'payroll.approve', entity: 'payroll_period', entityId: period.id, before: { status: 'DRAFT' }, after: { status: 'APPROVED', month, total: [...t.values()].reduce((s, x) => s + Math.max(0, x.total), 0) }, ip: client.ip });
      return this.detail(tx, after!);
    });
  }

  // ------------------------------------------------------------------ bonus / jarima

  addAdjustment(actor: AuthUser, month: string, input: CreateAdjustmentInput, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'payroll.calculate'))) throw forbidden();
      const [period] = await tx.select().from(payrollPeriods).where(eq(payrollPeriods.month, `${month}-01`));
      if (!period) throw periodNotFound();
      if (period.status !== 'DRAFT') throw locked();
      await PayrollRulesService.assertEmployee(tx, input.employeeId);
      const [a] = await tx.insert(payrollAdjustments).values({ centerId: actor.centerId!, periodId: period.id, employeeId: input.employeeId, amount: input.amount, reason: input.reason, createdBy: actor.id }).returning();
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'payroll.adjust', entity: 'payroll_adjustment', entityId: a!.id, after: { month, employeeId: a!.employeeId, amount: a!.amount, reason: a!.reason }, ip: client.ip });
      return { id: a!.id, periodId: a!.periodId, month, employeeId: a!.employeeId, amount: a!.amount, reason: a!.reason, createdAt: a!.createdAt };
    });
  }

  removeAdjustment(actor: AuthUser, id: string, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'payroll.calculate'))) throw forbidden();
      const [a] = await tx.select().from(payrollAdjustments).where(eq(payrollAdjustments.id, id));
      if (!a) throw new NotFoundException({ code: 'ADJUSTMENT_NOT_FOUND', message: 'Tuzatish topilmadi' });
      const [period] = await tx.select().from(payrollPeriods).where(eq(payrollPeriods.id, a.periodId));
      if (period!.status !== 'DRAFT') throw locked();
      await tx.delete(payrollAdjustments).where(eq(payrollAdjustments.id, id));
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'payroll.adjust_remove', entity: 'payroll_adjustment', entityId: id, before: { month: period!.month.slice(0, 7), employeeId: a.employeeId, amount: a.amount, reason: a.reason }, ip: client.ip });
      return { id, removed: true };
    });
  }

  // ------------------------------------------------------------------ ko'rish

  list(actor: AuthUser, q: ListPeriodsQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'payroll.view_all'))) throw forbidden();
      const rows = await tx.select().from(payrollPeriods).orderBy(desc(payrollPeriods.month)).limit(q.limit).offset(q.offset);
      const items = [];
      for (const p of rows) {
        const t = [...(await this.totals(tx, p.id)).values()];
        items.push({ ...periodView(p), employees: t.length, total: t.reduce((s, x) => s + Math.max(0, x.total), 0), paid: t.reduce((s, x) => s + x.paid, 0), remaining: t.reduce((s, x) => s + x.remaining, 0) });
      }
      return { items, limit: q.limit, offset: q.offset };
    });
  }

  get(actor: AuthUser, month: string) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'payroll.view_all'))) throw forbidden();
      const [period] = await tx.select().from(payrollPeriods).where(eq(payrollPeriods.month, `${month}-01`));
      if (!period) throw periodNotFound();
      return this.detail(tx, period);
    });
  }

  /** O'z maoshi (`payroll.view_own`): faqat tasdiqlangan/to'langan davrlar, faqat o'zining qatorlari. */
  me(actor: AuthUser, q: ListPeriodsQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'payroll.view_own'))) throw forbidden();
      const rows = await tx.select().from(payrollPeriods).where(ne(payrollPeriods.status, 'DRAFT')).orderBy(desc(payrollPeriods.month)).limit(q.limit).offset(q.offset);
      const periods = [];
      for (const p of rows) {
        const d = await this.detail(tx, p, actor.id);
        const mine = d.employees[0];
        if (mine) periods.push({ ...d.period, ...mine });
      }
      return { items: periods, limit: q.limit, offset: q.offset };
    });
  }

  // ------------------------------------------------------------------ umumiy (to'lovlar servisi ham ishlatadi)

  /** Xodimlar bo'yicha jami: hisoblangan + tuzatish = jami, to'langan (asl + manfiy qaytarish yozuvlari yig'indisi), qoldiq (manfiy jami to'lanmaydi). */
  async totals(tx: Tx, periodId: string, employeeId?: string): Promise<Map<string, EmployeeTotals>> {
    const out = new Map<string, EmployeeTotals>();
    const row = (id: string) => out.get(id) ?? out.set(id, { gross: 0, adjustmentsTotal: 0, total: 0, paid: 0, remaining: 0 }).get(id)!;
    const only = (col: AnyPgColumn) => (employeeId ? eq(col, employeeId) : undefined);
    for (const r of await tx.select({ id: payrollItems.employeeId, v: sql<string>`sum(${payrollItems.amount})` }).from(payrollItems).where(and(eq(payrollItems.periodId, periodId), only(payrollItems.employeeId))).groupBy(payrollItems.employeeId)) row(r.id).gross = Number(r.v);
    for (const r of await tx.select({ id: payrollAdjustments.employeeId, v: sql<string>`sum(${payrollAdjustments.amount})` }).from(payrollAdjustments).where(and(eq(payrollAdjustments.periodId, periodId), only(payrollAdjustments.employeeId))).groupBy(payrollAdjustments.employeeId)) row(r.id).adjustmentsTotal = Number(r.v);
    for (const r of await tx.select({ id: payrollPayouts.employeeId, v: sql<string>`sum(${payrollPayouts.amount})` }).from(payrollPayouts).where(and(eq(payrollPayouts.periodId, periodId), only(payrollPayouts.employeeId))).groupBy(payrollPayouts.employeeId)) row(r.id).paid = Number(r.v);
    for (const t of out.values()) {
      t.total = t.gross + t.adjustmentsTotal;
      t.remaining = Math.max(0, t.total) - t.paid;
    }
    return out;
  }

  /** Davr holatini to'lovlarga moslaydi: hamma to'langach PAID, qaytarishdan keyin yana APPROVED. */
  async syncStatus(tx: Tx, periodId: string): Promise<PeriodRow> {
    const [p] = await tx.select().from(payrollPeriods).where(eq(payrollPeriods.id, periodId));
    if (p!.status === 'DRAFT') return p!;
    const t = [...(await this.totals(tx, periodId)).values()];
    const allPaid = t.some((x) => x.total > 0) && t.every((x) => x.total <= 0 || x.remaining <= 0);
    const next = allPaid ? 'PAID' : 'APPROVED';
    if (next === p!.status) return p!;
    return (await tx.update(payrollPeriods).set({ status: next }).where(eq(payrollPeriods.id, periodId)).returning())[0]!;
  }

  /** Davr tafsiloti; `onlyEmployee` berilsa faqat shu xodim (o'z maoshi). */
  async detail(tx: Tx, p: PeriodRow, onlyEmployee?: string) {
    const eq1 = (col: AnyPgColumn, emp: AnyPgColumn) => and(eq(col, p.id), onlyEmployee ? eq(emp, onlyEmployee) : undefined);
    const items = await tx.select().from(payrollItems).where(eq1(payrollItems.periodId, payrollItems.employeeId)).orderBy(asc(payrollItems.createdAt), asc(payrollItems.id));
    const adjs = await tx.select().from(payrollAdjustments).where(eq1(payrollAdjustments.periodId, payrollAdjustments.employeeId)).orderBy(asc(payrollAdjustments.createdAt), asc(payrollAdjustments.id));
    const pays = await tx.select().from(payrollPayouts).where(eq1(payrollPayouts.periodId, payrollPayouts.employeeId)).orderBy(asc(payrollPayouts.paidAt), asc(payrollPayouts.id));
    const totals = await this.totals(tx, p.id, onlyEmployee);
    const ids = [...new Set([...items.map((i) => i.employeeId), ...adjs.map((a) => a.employeeId), ...pays.map((x) => x.employeeId)])];
    const people = ids.length ? await tx.select({ id: users.id, fullName: users.fullName, role: users.role }).from(users).where(inArray(users.id, ids)) : [];
    const gids = [...new Set(items.flatMap((i) => (i.groupId ? [i.groupId] : [])))];
    const gs = gids.length ? await tx.select({ id: groups.id, name: groups.name }).from(groups).where(inArray(groups.id, gids)) : [];
    const employees = ids
      .map((id) => {
        const u = people.find((x) => x.id === id);
        return {
          employeeId: id,
          employeeName: u?.fullName ?? null,
          role: u?.role ?? null,
          items: items.filter((i) => i.employeeId === id).map((i) => ({ id: i.id, ruleId: i.ruleId, groupId: i.groupId, groupName: gs.find((g) => g.id === i.groupId)?.name ?? null, baseAmount: i.baseAmount, amount: i.amount, description: i.description })),
          adjustments: adjs.filter((a) => a.employeeId === id).map((a) => ({ id: a.id, amount: a.amount, reason: a.reason, createdAt: a.createdAt })),
          payouts: pays.filter((x) => x.employeeId === id).map((x) => ({ id: x.id, amount: x.amount, method: x.method, status: x.status, reversesPayoutId: x.reversesPayoutId, note: x.note, paidAt: x.paidAt })),
          ...(totals.get(id) ?? { gross: 0, adjustmentsTotal: 0, total: 0, paid: 0, remaining: 0 }),
        };
      })
      .sort((a, b) => (a.employeeName ?? '').localeCompare(b.employeeName ?? '') || a.employeeId.localeCompare(b.employeeId));
    const all = employees.map((e) => e);
    return {
      period: periodView(p),
      employees,
      totals: { total: all.reduce((s, e) => s + Math.max(0, e.total), 0), paid: all.reduce((s, e) => s + e.paid, 0), remaining: all.reduce((s, e) => s + e.remaining, 0) },
    };
  }
}
