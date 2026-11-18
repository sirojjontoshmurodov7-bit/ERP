import { ForbiddenException, Injectable } from '@nestjs/common';
import { sql, type SQL } from 'drizzle-orm';
import type { AuthUser } from '../auth/auth.types.js';
import { PermissionsService } from '../auth/permissions.service.js';
import { branchScope, inScope } from '../common/branch-scope.js';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { rowsOf } from '../db/rows.js';
import type { ReportQuery } from './finance.schemas.js';

const forbidden = () => new ForbiddenException({ code: 'FORBIDDEN', message: "Bu amal uchun ruxsat yo'q" });
const num = (v: unknown): number => Number(v ?? 0);

/**
 * Moliyaviy hisobotlar (`finance.report`): faqat o'qiydi, hamma narsa SQL agregatsiya. Kassa (naqd pul harakati) asosida:
 * to'lov sanasi bo'yicha sof tushum (qaytarishlar o'z kunida manfiy), bekor qilinmagan xarajatlar, maosh to'lovlari (sof).
 * Sanalar Asia/Tashkent. Qamrov: rahbar hammasi; kassir/admin faqat o'z filiallari (maosh to'lovi filialga bog'lanmagan: faqat rahbarga).
 */
@Injectable()
export class FinanceReportService {
  constructor(
    private readonly db: DbService,
    private readonly perms: PermissionsService,
  ) {}

  private ctx(actor: AuthUser) {
    return contextOf(actor.centerId, actor.role);
  }

  /** Umumiy sharoit: ruxsat, qamrov va filial sharti (`alias` = filial ustunli jadval). */
  private async prepare(tx: Tx, actor: AuthUser, q: ReportQuery) {
    if (!(await this.perms.hasIn(tx, actor, 'finance.report'))) throw forbidden();
    const scope = await branchScope(tx, actor);
    if (q.branchId && !inScope(scope, q.branchId)) return { scope, empty: true as const, branch: (_col: string): SQL => sql`false` };
    const branch = (col: string): SQL => {
      const c = sql.raw(col);
      if (q.branchId) return sql`${c} = ${q.branchId}::uuid`;
      if (scope.all) return sql`true`;
      return scope.branchIds.length ? sql`${c} in (${sql.join(scope.branchIds.map((b) => sql`${b}::uuid`), sql`, `)})` : sql`false`;
    };
    return { scope, empty: false as const, branch };
  }

  summary(actor: AuthUser, q: ReportQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      const ctx = await this.prepare(tx, actor, q);
      const base = { from: q.from, to: q.to, branchId: q.branchId ?? null };
      if (ctx.empty) return { ...base, income: { total: 0, byMethod: [] }, expenses: { total: 0, byCategory: [] }, payouts: null, net: 0, byBranch: [], byGroup: [], unallocated: null };
      const { scope, branch } = ctx;
      const payDay = sql`(p.paid_at at time zone 'Asia/Tashkent')::date`;
      const allocDay = sql`(a.created_at at time zone 'Asia/Tashkent')::date`;
      const range = (day: SQL) => sql`${day} between ${q.from}::date and ${q.to}::date`;

      const byMethod = rowsOf<{ method: string; amount: string }>(
        await tx.execute(sql`select p.method, sum(p.amount) as amount from payments p where ${range(payDay)} and ${branch('p.branch_id')} group by p.method order by sum(p.amount) desc, p.method`),
      ).map((r) => ({ method: r.method, amount: num(r.amount) }));
      const incomeTotal = byMethod.reduce((s, r) => s + r.amount, 0);

      const byCategory = rowsOf<{ category: string; amount: string; count: number }>(
        await tx.execute(sql`select min(e.category) as category, sum(e.amount) as amount, count(*)::int as count from expenses e
          where e.status = 'ACTIVE' and e.spent_on between ${q.from}::date and ${q.to}::date and ${branch('e.branch_id')}
          group by lower(e.category) order by sum(e.amount) desc, min(e.category)`),
      ).map((r) => ({ category: r.category, amount: num(r.amount), count: r.count }));
      const expenseTotal = byCategory.reduce((s, r) => s + r.amount, 0);

      // Maosh to'lovlari filialga bog'lanmagan: faqat rahbar va filial filtrisiz
      const withPayouts = actor.role === 'OWNER' && !q.branchId;
      const payouts = withPayouts
        ? num(rowsOf<{ v: string | null }>(await tx.execute(sql`select sum(amount) as v from payroll_payouts where (paid_at at time zone 'Asia/Tashkent')::date between ${q.from}::date and ${q.to}::date`))[0]?.v)
        : null;

      const incomeByBranch = rowsOf<{ id: string; v: string }>(await tx.execute(sql`select p.branch_id as id, sum(p.amount) as v from payments p where ${range(payDay)} and ${branch('p.branch_id')} group by p.branch_id`));
      const expenseByBranch = rowsOf<{ id: string; v: string }>(
        await tx.execute(sql`select e.branch_id as id, sum(e.amount) as v from expenses e where e.status = 'ACTIVE' and e.spent_on between ${q.from}::date and ${q.to}::date and ${branch('e.branch_id')} group by e.branch_id`),
      );
      const branchRows = rowsOf<{ id: string; name: string }>(await tx.execute(sql`select b.id, b.name from branches b where ${branch('b.id')} order by b.name, b.id`));
      const byBranch = branchRows
        .map((b) => {
          const income = num(incomeByBranch.find((x) => x.id === b.id)?.v);
          const expenses = num(expenseByBranch.find((x) => x.id === b.id)?.v);
          return { branchId: b.id, branchName: b.name, income, expenses, net: income - expenses };
        })
        .filter((b) => b.income !== 0 || b.expenses !== 0);

      // Guruhlar bo'yicha tushum: oy ichida hisoblarga taqsimlangan sof summa (guruh filiali qamrovda)
      const byGroup = rowsOf<{ id: string; name: string; branch: string; v: string }>(
        await tx.execute(sql`select g.id, g.name, b.name as branch, sum(a.amount) as v from payment_allocations a
          join charges c on c.id = a.charge_id join groups g on g.id = c.group_id join branches b on b.id = g.branch_id
          where ${range(allocDay)} and ${branch('g.branch_id')}
          group by g.id, g.name, b.name having sum(a.amount) <> 0 order by sum(a.amount) desc, g.name, g.id`),
      ).map((r) => ({ groupId: r.id, groupName: r.name, branchName: r.branch, amount: num(r.v) }));
      // Taqsimlanmagan qism (avans o'zgarishi) faqat butun markaz uchun ma'noli: to'lov va guruh filiali farq qilishi mumkin
      const unallocated = scope.all && !q.branchId ? incomeTotal - byGroup.reduce((s, g) => s + g.amount, 0) : null;

      return { ...base, income: { total: incomeTotal, byMethod }, expenses: { total: expenseTotal, byCategory }, payouts, net: incomeTotal - expenseTotal - (payouts ?? 0), byBranch, byGroup, unallocated };
    });
  }

  /** Kassa kitobi: har kun bo'yicha tushum, xarajat va sof natija (bo'sh kunlar ham chiqadi). */
  daily(actor: AuthUser, q: ReportQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      const ctx = await this.prepare(tx, actor, q);
      const base = { from: q.from, to: q.to, branchId: q.branchId ?? null };
      if (ctx.empty) return { ...base, items: [], totals: { income: 0, expenses: 0, net: 0 } };
      const { branch } = ctx;
      const rows = rowsOf<{ day: string; income: string; expenses: string }>(
        await tx.execute(sql`select to_char(d.day, 'YYYY-MM-DD') as day,
            coalesce((select sum(p.amount) from payments p where (p.paid_at at time zone 'Asia/Tashkent')::date = d.day and ${branch('p.branch_id')}), 0) as income,
            coalesce((select sum(e.amount) from expenses e where e.status = 'ACTIVE' and e.spent_on = d.day and ${branch('e.branch_id')}), 0) as expenses
          from generate_series(${q.from}::date, ${q.to}::date, interval '1 day') as d(day) order by d.day`),
      );
      const items = rows.map((r) => ({ date: r.day, income: num(r.income), expenses: num(r.expenses), net: num(r.income) - num(r.expenses) }));
      const income = items.reduce((s, r) => s + r.income, 0);
      const expenses = items.reduce((s, r) => s + r.expenses, 0);
      return { ...base, items, totals: { income, expenses, net: income - expenses } };
    });
  }
}
