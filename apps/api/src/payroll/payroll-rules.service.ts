import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, gt, gte, inArray, isNull, lt, lte, or, type SQL } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { PermissionsService } from '../auth/permissions.service.js';
import { todayLocal } from '../common/dates.js';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { groups, payrollRules, users } from '../db/schema.js';
import type { CreateRuleInput, ListRulesQuery, UpdateRuleInput } from './payroll.schemas.js';

const forbidden = () => new ForbiddenException({ code: 'FORBIDDEN', message: "Bu amal uchun ruxsat yo'q" });
const ruleNotFound = () => new NotFoundException({ code: 'RULE_NOT_FOUND', message: 'Maosh qoidasi topilmadi' });
const bad = (code: string, message: string) => new BadRequestException({ code, message });

/** Maosh oladigan xodim roli (rahbar va o'quvchi emas). */
export const PAYROLL_ROLES = ['ADMIN', 'CASHIER', 'TEACHER'] as const;

type RuleRow = typeof payrollRules.$inferSelect;
const audited = (r: RuleRow) => ({ employeeId: r.employeeId, groupId: r.groupId, type: r.type, amount: r.amount, percent: r.percent, percentBase: r.percentBase, teacherKind: r.teacherKind, validFrom: r.validFrom, validTo: r.validTo });

/** Maosh qoidalari: boshqarish `payroll.rules.manage` (rahbar), ko'rish `payroll.view_all` yoki `payroll.rules.manage`. */
@Injectable()
export class PayrollRulesService {
  constructor(
    private readonly db: DbService,
    private readonly perms: PermissionsService,
  ) {}

  private ctx(actor: AuthUser) {
    return contextOf(actor.centerId, actor.role);
  }

  /** Maosh motori uchun xodim tekshiruvi: markazdagi ADMIN/CASHIER/TEACHER. */
  static async assertEmployee(tx: Tx, employeeId: string): Promise<void> {
    const [u] = await tx.select({ role: users.role }).from(users).where(eq(users.id, employeeId));
    if (!u) throw new NotFoundException({ code: 'EMPLOYEE_NOT_FOUND', message: 'Xodim topilmadi' });
    if (!(PAYROLL_ROLES as readonly string[]).includes(u.role)) throw bad('INVALID_EMPLOYEE', "Maosh faqat admin, kassir va ustozga hisoblanadi");
  }

  create(actor: AuthUser, input: CreateRuleInput, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'payroll.rules.manage'))) throw forbidden();
      await PayrollRulesService.assertEmployee(tx, input.employeeId);
      if (input.groupId) {
        const [g] = await tx.select({ id: groups.id }).from(groups).where(eq(groups.id, input.groupId));
        if (!g) throw new NotFoundException({ code: 'GROUP_NOT_FOUND', message: 'Guruh topilmadi' });
      }
      const [r] = await tx
        .insert(payrollRules)
        .values({
          centerId: actor.centerId!,
          employeeId: input.employeeId,
          groupId: input.groupId ?? null,
          type: input.type,
          amount: input.amount ?? null,
          percent: input.percent === undefined ? null : input.percent.toFixed(2),
          percentBase: input.percentBase ?? null,
          teacherKind: input.teacherKind ?? null,
          validFrom: input.validFrom ?? `${todayLocal().slice(0, 7)}-01`,
          validTo: input.validTo ?? null,
          createdBy: actor.id,
        })
        .returning();
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'payroll.rule_create', entity: 'payroll_rule', entityId: r!.id, after: audited(r!), ip: client.ip });
      return this.present(tx, [r!]).then((x) => x[0]!);
    });
  }

  update(actor: AuthUser, id: string, input: UpdateRuleInput, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'payroll.rules.manage'))) throw forbidden();
      const [before] = await tx.select().from(payrollRules).where(eq(payrollRules.id, id));
      if (!before) throw ruleNotFound();
      const isPercent = before.type === 'PERCENT';
      if (isPercent && input.amount !== undefined) throw bad('RULE_FIELD_INVALID', "Foizli qoidada summa o'zgartirilmaydi");
      if (!isPercent && (input.percent !== undefined || input.percentBase !== undefined)) throw bad('RULE_FIELD_INVALID', "Foiz faqat PERCENT qoidasida");
      const from = input.validFrom ?? before.validFrom;
      const to = input.validTo === undefined ? before.validTo : input.validTo;
      if (to && to < from) throw bad('INVALID_DATES', "Tugash sanasi boshlanishdan oldin bo'lishi mumkin emas");
      const set: Partial<typeof payrollRules.$inferInsert> = {};
      if (input.amount !== undefined) set.amount = input.amount;
      if (input.percent !== undefined) set.percent = input.percent.toFixed(2);
      if (input.percentBase !== undefined) set.percentBase = input.percentBase;
      if (input.teacherKind !== undefined) set.teacherKind = input.teacherKind;
      if (input.validFrom !== undefined) set.validFrom = input.validFrom;
      if (input.validTo !== undefined) set.validTo = input.validTo;
      const [after] = await tx.update(payrollRules).set(set).where(eq(payrollRules.id, id)).returning();
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'payroll.rule_edit', entity: 'payroll_rule', entityId: id, before: audited(before), after: audited(after!), ip: client.ip });
      return (await this.present(tx, [after!]))[0]!;
    });
  }

  end(actor: AuthUser, id: string, validTo: string | undefined, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'payroll.rules.manage'))) throw forbidden();
      const [before] = await tx.select().from(payrollRules).where(eq(payrollRules.id, id));
      if (!before) throw ruleNotFound();
      const to = validTo ?? todayLocal();
      if (to < before.validFrom) throw bad('INVALID_DATES', "Tugash sanasi boshlanishdan oldin bo'lishi mumkin emas");
      if (before.validTo && before.validTo <= to) throw new ConflictException({ code: 'ALREADY_ENDED', message: 'Qoida allaqachon tugagan' });
      const [after] = await tx.update(payrollRules).set({ validTo: to }).where(eq(payrollRules.id, id)).returning();
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'payroll.rule_end', entity: 'payroll_rule', entityId: id, before: audited(before), after: audited(after!), ip: client.ip });
      return (await this.present(tx, [after!]))[0]!;
    });
  }

  list(actor: AuthUser, q: ListRulesQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      const may = (await this.perms.hasIn(tx, actor, 'payroll.view_all')) || (await this.perms.hasIn(tx, actor, 'payroll.rules.manage'));
      if (!may) throw forbidden();
      const today = todayLocal();
      const conds: (SQL | undefined)[] = [
        q.employeeId ? eq(payrollRules.employeeId, q.employeeId) : undefined,
        q.groupId ? eq(payrollRules.groupId, q.groupId) : undefined,
        q.active === 'true' ? and(lte(payrollRules.validFrom, today), or(isNull(payrollRules.validTo), gte(payrollRules.validTo, today))) : undefined,
        q.active === 'false' ? or(gt(payrollRules.validFrom, today), lt(payrollRules.validTo, today)) : undefined,
      ];
      const rows = await tx.select().from(payrollRules).where(and(...conds)).orderBy(asc(payrollRules.employeeId), asc(payrollRules.validFrom), asc(payrollRules.id)).limit(q.limit).offset(q.offset);
      return { items: await this.present(tx, rows), limit: q.limit, offset: q.offset };
    });
  }

  private async present(tx: Tx, rows: RuleRow[]) {
    if (!rows.length) return [];
    const names = await tx.select({ id: users.id, fullName: users.fullName, role: users.role }).from(users).where(inArray(users.id, [...new Set(rows.map((r) => r.employeeId))]));
    const gids = [...new Set(rows.flatMap((r) => (r.groupId ? [r.groupId] : [])))];
    const gs = gids.length ? await tx.select({ id: groups.id, name: groups.name }).from(groups).where(inArray(groups.id, gids)) : [];
    return rows.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: names.find((u) => u.id === r.employeeId)?.fullName ?? null,
      employeeRole: names.find((u) => u.id === r.employeeId)?.role ?? null,
      groupId: r.groupId,
      groupName: gs.find((g) => g.id === r.groupId)?.name ?? null,
      type: r.type,
      amount: r.amount,
      percent: r.percent === null ? null : Number(r.percent),
      percentBase: r.percentBase,
      teacherKind: r.teacherKind,
      validFrom: r.validFrom,
      validTo: r.validTo,
      createdAt: r.createdAt,
    }));
  }
}
