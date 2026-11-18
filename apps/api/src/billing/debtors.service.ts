import { ForbiddenException, Injectable } from '@nestjs/common';
import { sql, type SQL } from 'drizzle-orm';
import type { AuthUser } from '../auth/auth.types.js';
import { PermissionsService } from '../auth/permissions.service.js';
import { branchScope, inScope } from '../common/branch-scope.js';
import { todayLocal } from '../common/dates.js';
import { contextOf, DbService } from '../db/db.service.js';
import { rowsOf } from '../db/rows.js';
import { BillingService } from './billing.service.js';
import type { ListDebtorsQuery } from './discounts.schemas.js';

const forbidden = () => new ForbiddenException({ code: 'FORBIDDEN', message: "Bu amal uchun ruxsat yo'q" });

interface DebtorRow {
  studentId: string;
  studentName: string;
  phone: string | null;
  debt: string;
  overdueCharges: number;
  oldestDue: string;
  total: string;
  totalDebt: string;
}
interface GroupRow {
  studentId: string;
  groupId: string;
  groupName: string;
  debt: string;
  overdueCharges: number;
}

/**
 * Qarzdorlar (`debtors.view`): qarz saqlanmaydi, hisoblanadi: to'lanmagan (OPEN/PARTIAL) hisob, `bugun > due_date + grace_days`.
 * Rahbar hammasi; admin (○) / kassir filial bo'yicha; o'quvchi faqat o'zi; ustoz (○) faqat o'z guruhida "qarz bor" (summasiz).
 */
@Injectable()
export class DebtorsService {
  constructor(
    private readonly db: DbService,
    private readonly perms: PermissionsService,
    private readonly billing: BillingService,
  ) {}

  list(actor: AuthUser, q: ListDebtorsQuery) {
    return this.db.withContext(contextOf(actor.centerId, actor.role), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'debtors.view'))) throw forbidden();
      const today = todayLocal();
      const teacher = actor.role === 'TEACHER';
      const empty = { items: [], total: 0, totalDebt: teacher ? undefined : 0, limit: q.limit, offset: q.offset };
      const scope = await branchScope(tx, actor);
      if (q.branchId && actor.role !== 'STUDENT' && !teacher && !inScope(scope, q.branchId)) return empty;
      await this.billing.generate(tx, actor.centerId!);

      const where: SQL[] = [sql`c.status in ('OPEN','PARTIAL')`, sql`${today}::date > c.due_date + g.grace_days`];
      if (actor.role === 'STUDENT') where.push(sql`c.student_id = ${actor.id}`);
      else if (teacher) {
        where.push(sql`g.id in (select gt.group_id from group_teachers gt where gt.teacher_id = ${actor.id} and (gt.to_date is null or gt.to_date >= ${today}::date))`);
      } else if (!scope.all) {
        if (!scope.branchIds.length) return empty;
        where.push(sql`g.branch_id in (${sql.join(scope.branchIds.map((b) => sql`${b}::uuid`), sql`, `)})`);
      }
      if (q.branchId) where.push(sql`g.branch_id = ${q.branchId}::uuid`);
      if (q.groupId) where.push(sql`g.id = ${q.groupId}::uuid`);
      if (q.q) {
        const like = `%${q.q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
        where.push(sql`(u.full_name ilike ${like} or u.login ilike ${like} or u.phone ilike ${like})`);
      }
      const remaining = sql`(c.amount - coalesce(p.paid, 0))`;
      const having = q.minDebt && !teacher ? sql`having sum(${remaining}) >= ${q.minDebt}` : sql``;
      const order = teacher ? sql`order by u.full_name, c.student_id` : sql`order by debt desc, oldest_due asc, c.student_id`;

      const rows = rowsOf<DebtorRow>(
        await tx.execute(sql`
          select c.student_id as "studentId", u.full_name as "studentName", u.phone as "phone",
                 sum(${remaining}) as debt, count(*)::int as "overdueCharges", min(c.due_date)::text as "oldestDue",
                 count(*) over () as total, sum(sum(${remaining})) over () as "totalDebt", min(c.due_date) as oldest_due
          from charges c
          join groups g on g.id = c.group_id
          join users u on u.id = c.student_id
          left join (select charge_id, sum(amount) as paid from payment_allocations group by charge_id) p on p.charge_id = c.id
          where ${sql.join(where, sql` and `)}
          group by c.student_id, u.full_name, u.phone
          ${having}
          ${order}
          limit ${q.limit} offset ${q.offset}`),
      );
      if (!rows.length) return { ...empty, items: [] };

      const ids = rows.map((r) => sql`${r.studentId}::uuid`);
      const groupRows = rowsOf<GroupRow>(
        await tx.execute(sql`
          select c.student_id as "studentId", g.id as "groupId", g.name as "groupName", sum(${remaining}) as debt, count(*)::int as "overdueCharges"
          from charges c
          join groups g on g.id = c.group_id
          join users u on u.id = c.student_id
          left join (select charge_id, sum(amount) as paid from payment_allocations group by charge_id) p on p.charge_id = c.id
          where ${sql.join([...where, sql`c.student_id in (${sql.join(ids, sql`, `)})`], sql` and `)}
          group by c.student_id, g.id, g.name
          order by g.name, g.id`),
      );

      const total = Number(rows[0]!.total);
      const items = rows.map((r) => {
        const groups = groupRows.filter((g) => g.studentId === r.studentId);
        if (teacher) return { studentId: r.studentId, studentName: r.studentName, hasDebt: true, groups: groups.map((g) => ({ groupId: g.groupId, groupName: g.groupName })) };
        return {
          studentId: r.studentId,
          studentName: r.studentName,
          phone: r.phone,
          debt: Number(r.debt),
          overdueCharges: r.overdueCharges,
          oldestDueDate: r.oldestDue,
          daysOverdue: Math.round((Date.parse(today) - Date.parse(r.oldestDue)) / 86_400_000),
          groups: groups.map((g) => ({ groupId: g.groupId, groupName: g.groupName, debt: Number(g.debt), overdueCharges: g.overdueCharges })),
        };
      });
      return { items, total, totalDebt: teacher ? undefined : Number(rows[0]!.totalDebt), limit: q.limit, offset: q.offset };
    });
  }
}
