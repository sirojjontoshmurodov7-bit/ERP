import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, gte, isNull, lte, sql, sum, type SQL } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { PermissionsService } from '../auth/permissions.service.js';
import { type BranchScope, branchFilter, branchScope, inScope } from '../common/branch-scope.js';
import { todayLocal } from '../common/dates.js';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { branches, expenses, users } from '../db/schema.js';
import type { CreateExpenseInput, ListExpensesQuery } from './finance.schemas.js';

const forbidden = (message = "Bu amal uchun ruxsat yo'q") => new ForbiddenException({ code: 'FORBIDDEN', message });
const notFound = () => new NotFoundException({ code: 'EXPENSE_NOT_FOUND', message: 'Xarajat topilmadi' });

type ExpenseRow = typeof expenses.$inferSelect;
const audited = (e: ExpenseRow) => ({ branchId: e.branchId, category: e.category, amount: e.amount, note: e.note, spentOn: e.spentOn, status: e.status });

/**
 * Xarajat: yozish `expense.manage` (rahbar, kassir ○ o'z filialida), ko'rish `expense.manage` yoki `finance.report` + filial qamrovi.
 * Append-only: xato `VOIDED` (sabab bilan) orqali tuzatiladi; summa va kategoriya o'zgarmaydi.
 */
@Injectable()
export class ExpensesService {
  constructor(
    private readonly db: DbService,
    private readonly perms: PermissionsService,
  ) {}

  private ctx(actor: AuthUser) {
    return contextOf(actor.centerId, actor.role);
  }

  private async mayView(tx: Tx, actor: AuthUser): Promise<boolean> {
    return (await this.perms.hasIn(tx, actor, 'expense.manage')) || (await this.perms.hasIn(tx, actor, 'finance.report'));
  }

  create(actor: AuthUser, input: CreateExpenseInput, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'expense.manage'))) throw forbidden();
      const spentOn = input.spentOn ?? todayLocal();
      if (spentOn > todayLocal()) throw new BadRequestException({ code: 'DATE_IN_FUTURE', message: "Xarajat sanasi kelajakda bo'lishi mumkin emas" });
      const branchId = await this.pickBranch(tx, await branchScope(tx, actor), input.branchId);
      const [e] = await tx.insert(expenses).values({ centerId: actor.centerId!, branchId, category: input.category, amount: input.amount, note: input.note ?? null, spentOn, createdBy: actor.id }).returning();
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'expense.create', entity: 'expense', entityId: e!.id, after: audited(e!), ip: client.ip });
      return (await this.present(tx, [e!]))[0]!;
    });
  }

  voidExpense(actor: AuthUser, id: string, reason: string, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'expense.manage'))) throw forbidden();
      const before = await this.load(tx, actor, id);
      if (before.status === 'VOIDED') throw new ConflictException({ code: 'ALREADY_VOIDED', message: 'Xarajat allaqachon bekor qilingan' });
      const [after] = await tx.update(expenses).set({ status: 'VOIDED', voidReason: reason, voidedBy: actor.id, voidedAt: new Date() }).where(eq(expenses.id, id)).returning();
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'expense.void', entity: 'expense', entityId: id, before: audited(before), after: { ...audited(after!), reason }, ip: client.ip });
      return (await this.present(tx, [after!]))[0]!;
    });
  }

  list(actor: AuthUser, q: ListExpensesQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.mayView(tx, actor))) throw forbidden();
      const scope = await branchScope(tx, actor);
      if (q.branchId && !inScope(scope, q.branchId)) return { items: [], limit: q.limit, offset: q.offset };
      const conds: (SQL | undefined)[] = [
        branchFilter(expenses.branchId, scope),
        q.branchId ? eq(expenses.branchId, q.branchId) : undefined,
        q.category ? sql`lower(${expenses.category}) = lower(${q.category})` : undefined,
        q.status ? eq(expenses.status, q.status) : undefined,
        q.from ? gte(expenses.spentOn, q.from) : undefined,
        q.to ? lte(expenses.spentOn, q.to) : undefined,
      ];
      const rows = await tx.select().from(expenses).where(and(...conds)).orderBy(desc(expenses.spentOn), desc(expenses.createdAt), desc(expenses.id)).limit(q.limit).offset(q.offset);
      return { items: await this.present(tx, rows), limit: q.limit, offset: q.offset };
    });
  }

  get(actor: AuthUser, id: string) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.mayView(tx, actor))) throw forbidden();
      return (await this.present(tx, [await this.load(tx, actor, id)]))[0]!;
    });
  }

  /** Markazda ishlatilgan kategoriyalar (avtotaklif): faqat qamrovdagi filiallar, bekor qilinmagan xarajatlar. */
  categories(actor: AuthUser) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.mayView(tx, actor))) throw forbidden();
      const scope = await branchScope(tx, actor);
      const rows = await tx
        .select({ category: sql<string>`min(${expenses.category})`, count: count(), amount: sum(expenses.amount) })
        .from(expenses)
        .where(and(eq(expenses.status, 'ACTIVE'), branchFilter(expenses.branchId, scope)))
        .groupBy(sql`lower(${expenses.category})`)
        .orderBy(desc(count()), sql`min(${expenses.category})`);
      return { items: rows.map((r) => ({ category: r.category, count: Number(r.count), amount: Number(r.amount ?? 0) })) };
    });
  }

  // --------------------------------------------------------------- yordamchilar

  private async load(tx: Tx, actor: AuthUser, id: string): Promise<ExpenseRow> {
    const scope = await branchScope(tx, actor);
    const [e] = await tx.select().from(expenses).where(and(eq(expenses.id, id), branchFilter(expenses.branchId, scope)));
    if (!e) throw notFound();
    return e;
  }

  /** Xarajat filiali: berilgan bo'lsa tekshiriladi, aks holda qamrovdagi yagona faol filial. */
  private async pickBranch(tx: Tx, scope: BranchScope, requested?: string): Promise<string> {
    if (requested) {
      const [b] = await tx.select({ id: branches.id }).from(branches).where(and(eq(branches.id, requested), isNull(branches.archivedAt)));
      if (!b) throw new NotFoundException({ code: 'BRANCH_NOT_FOUND', message: 'Filial topilmadi' });
      if (!inScope(scope, requested)) throw forbidden("Bu filialga xarajat yozish huquqingiz yo'q");
      return requested;
    }
    const active = (await tx.select({ id: branches.id }).from(branches).where(isNull(branches.archivedAt))).map((b) => b.id);
    const cands = scope.all ? active : active.filter((b) => scope.branchIds.includes(b));
    if (cands.length !== 1) throw new BadRequestException({ code: 'BRANCH_REQUIRED', message: 'Filialni (branchId) ko\'rsating' });
    return cands[0]!;
  }

  private async present(tx: Tx, rows: ExpenseRow[]) {
    if (!rows.length) return [];
    const ids = [...new Set(rows.flatMap((e) => [e.createdBy, e.voidedBy].filter((x): x is string => !!x)))];
    const us = ids.length ? await tx.select({ id: users.id, fullName: users.fullName }).from(users).where(sql`${users.id} in (${sql.join(ids.map((i) => sql`${i}::uuid`), sql`, `)})`) : [];
    const bs = await tx.select({ id: branches.id, name: branches.name }).from(branches);
    return rows.map((e) => ({
      id: e.id,
      branchId: e.branchId,
      branchName: bs.find((b) => b.id === e.branchId)?.name ?? null,
      category: e.category,
      amount: e.amount,
      note: e.note,
      spentOn: e.spentOn,
      status: e.status,
      voidReason: e.voidReason,
      voidedBy: e.voidedBy,
      voidedByName: us.find((u) => u.id === e.voidedBy)?.fullName ?? null,
      voidedAt: e.voidedAt,
      createdBy: e.createdBy,
      createdByName: us.find((u) => u.id === e.createdBy)?.fullName ?? null,
      createdAt: e.createdAt,
    }));
  }
}
