import { ForbiddenException, Injectable } from '@nestjs/common';
import { sql, type SQL } from 'drizzle-orm';
import type { AuthUser } from '../auth/auth.types.js';
import { PermissionsService } from '../auth/permissions.service.js';
import { BillingService } from '../billing/billing.service.js';
import { todayLocal } from '../common/dates.js';
import { contextOf, DbService } from '../db/db.service.js';
import { rowsOf } from '../db/rows.js';
import type { BranchesQuery, OverviewQuery } from './reports.schemas.js';

const forbidden = () => new ForbiddenException({ code: 'FORBIDDEN', message: "Bu amal uchun ruxsat yo'q" });
const num = (v: unknown): number => Number(v ?? 0);
const TZ = sql.raw("'Asia/Tashkent'");

export interface AttendanceCounts {
  present: number;
  absent: number;
  late: number;
  excused: number;
}
/** Davomat ko'rsatkichi: (kelgan + kech qolgan) / (kelgan + kech qolgan + kelmagan) * 100, 1 xona; sababli hisobga olinmaydi; maxraj 0 bo'lsa null. */
export const attendanceStats = (c: AttendanceCounts) => {
  const denom = c.present + c.late + c.absent;
  return { ...c, total: c.present + c.absent + c.late + c.excused, rate: denom === 0 ? null : Math.round(((c.present + c.late) / denom) * 1000) / 10 };
};

/**
 * Umumiy hisobotlar (faqat rahbar): markaz ko'rsatkichlari (`report.overview`) va filiallarni solishtirish (`report.branch_compare`).
 * Faqat o'qiydi (SQL agregatsiya). Sanalar Asia/Tashkent. Atributsiya: o'quvchi, guruh, yozilish, davomat va qarz guruh filialiga;
 * tushum to'lov qabul qilingan filialga; xarajat o'z filialiga; o'quvchi soni `user_branches` bo'yicha (ikki filialli o'quvchi ikkalasida sanaladi).
 */
@Injectable()
export class ReportsService {
  constructor(
    private readonly db: DbService,
    private readonly perms: PermissionsService,
    private readonly billing: BillingService,
  ) {}

  private ctx(actor: AuthUser) {
    return contextOf(actor.centerId, actor.role);
  }

  // ------------------------------------------------------------------ markaz umumiy ko'rsatkichlari

  overview(actor: AuthUser, q: OverviewQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'report.overview'))) throw forbidden();
      await this.billing.generate(tx, actor.centerId!);
      const f = sql`${q.from}::date`;
      const t = sql`${q.to}::date`;
      const day = (col: string) => sql`(${sql.raw(col)} at time zone ${TZ})::date between ${f} and ${t}`;
      const one = async <T>(query: SQL): Promise<T> => rowsOf<T>(await tx.execute(query))[0]!;

      const students = await one<{ active: number; archived: number; fresh: number }>(sql`
        select count(*) filter (where status = 'ACTIVE')::int as active, count(*) filter (where status = 'ARCHIVED')::int as archived,
               count(*) filter (where ${day('created_at')})::int as fresh from users where role = 'STUDENT'`);
      const staffRows = rowsOf<{ role: string; n: number }>(await tx.execute(sql`select role, count(*)::int as n from users where role in ('ADMIN','CASHIER','TEACHER') and status = 'ACTIVE' group by role`));
      const groups = await one<{ active: number; planned: number; finished: number }>(sql`
        select count(*) filter (where status = 'ACTIVE' and archived_at is null)::int as active, count(*) filter (where status = 'PLANNED' and archived_at is null)::int as planned,
               count(*) filter (where status = 'FINISHED' and archived_at is null)::int as finished from groups`);
      const enr = await one<{ active: number; frozen: number; joined: number; left: number }>(sql`
        select count(*) filter (where status = 'ACTIVE')::int as active, count(*) filter (where status = 'FROZEN')::int as frozen,
               count(*) filter (where joined_at between ${f} and ${t})::int as joined,
               count(*) filter (where status = 'LEFT' and left_at between ${f} and ${t})::int as "left" from enrollments`);
      const att = rowsOf<{ status: string; n: number }>(
        await tx.execute(sql`select a.status, count(*)::int as n from attendance_records a join lessons l on l.id = a.lesson_id
          where l.status = 'HELD' and l.lesson_date between ${f} and ${t} group by a.status`),
      );
      const lessonCount = (await one<{ n: number }>(sql`select count(*)::int as n from lessons where status = 'HELD' and lesson_date between ${f} and ${t}`)).n;
      const income = num((await one<{ v: string | null }>(sql`select sum(amount) as v from payments p where ${day('p.paid_at')}`)).v);
      const expenses = num((await one<{ v: string | null }>(sql`select sum(amount) as v from expenses where status = 'ACTIVE' and spent_on between ${f} and ${t}`)).v);
      const payouts = num((await one<{ v: string | null }>(sql`select sum(amount) as v from payroll_payouts p where ${day('p.paid_at')}`)).v);
      const debt = await one<{ amount: string | null; students: number; charges: number }>(sql`
        select sum(c.amount - coalesce(p.paid, 0)) as amount, count(distinct c.student_id)::int as students, count(*)::int as charges
        from charges c join groups g on g.id = c.group_id
        left join (select charge_id, sum(amount) as paid from payment_allocations group by charge_id) p on p.charge_id = c.id
        where c.status in ('OPEN','PARTIAL') and ${todayLocal()}::date > c.due_date + g.grace_days`);
      const count = (s: string) => att.find((a) => a.status === s)?.n ?? 0;

      return {
        from: q.from,
        to: q.to,
        students: { active: students.active, archived: students.archived, new: students.fresh },
        staff: { admins: staffRows.find((r) => r.role === 'ADMIN')?.n ?? 0, cashiers: staffRows.find((r) => r.role === 'CASHIER')?.n ?? 0, teachers: staffRows.find((r) => r.role === 'TEACHER')?.n ?? 0 },
        groups,
        enrollments: { active: enr.active, frozen: enr.frozen, joined: enr.joined, left: enr.left },
        attendance: { lessons: lessonCount, ...attendanceStats({ present: count('PRESENT'), absent: count('ABSENT'), late: count('LATE'), excused: count('EXCUSED') }) },
        finance: { income, expenses, payouts, net: income - expenses - payouts },
        debt: { amount: num(debt.amount), debtors: debt.students, overdueCharges: debt.charges },
      };
    });
  }

  // ------------------------------------------------------------------ filiallarni solishtirish

  branches(actor: AuthUser, q: BranchesQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'report.branch_compare'))) throw forbidden();
      await this.billing.generate(tx, actor.centerId!);
      const f = sql`${q.from}::date`;
      const t = sql`${q.to}::date`;
      const day = (col: string) => sql`(${sql.raw(col)} at time zone ${TZ})::date between ${f} and ${t}`;
      const byBranch = async <V extends Record<string, unknown>>(query: SQL) => new Map(rowsOf<{ id: string } & V>(await tx.execute(query)).map((r) => [r.id, r]));

      const studentsBy = await byBranch<{ n: number }>(sql`select ub.branch_id as id, count(distinct ub.user_id)::int as n from user_branches ub join users u on u.id = ub.user_id where u.role = 'STUDENT' and u.status = 'ACTIVE' group by ub.branch_id`);
      const groupsBy = await byBranch<{ n: number }>(sql`select branch_id as id, count(*)::int as n from groups where status = 'ACTIVE' and archived_at is null group by branch_id`);
      const enrBy = await byBranch<{ active: number; joined: number; left: number }>(sql`
        select g.branch_id as id, count(*) filter (where e.status = 'ACTIVE')::int as active, count(*) filter (where e.joined_at between ${f} and ${t})::int as joined,
               count(*) filter (where e.status = 'LEFT' and e.left_at between ${f} and ${t})::int as "left"
        from enrollments e join groups g on g.id = e.group_id group by g.branch_id`);
      const attBy = rowsOf<{ id: string; status: string; n: number }>(
        await tx.execute(sql`select g.branch_id as id, a.status, count(*)::int as n from attendance_records a join lessons l on l.id = a.lesson_id join groups g on g.id = l.group_id
          where l.status = 'HELD' and l.lesson_date between ${f} and ${t} group by g.branch_id, a.status`),
      );
      const incomeBy = await byBranch<{ v: string }>(sql`select p.branch_id as id, sum(p.amount) as v from payments p where ${day('p.paid_at')} group by p.branch_id`);
      const expenseBy = await byBranch<{ v: string }>(sql`select branch_id as id, sum(amount) as v from expenses where status = 'ACTIVE' and spent_on between ${f} and ${t} group by branch_id`);
      const debtBy = await byBranch<{ v: string; n: number }>(sql`
        select g.branch_id as id, sum(c.amount - coalesce(p.paid, 0)) as v, count(distinct c.student_id)::int as n
        from charges c join groups g on g.id = c.group_id
        left join (select charge_id, sum(amount) as paid from payment_allocations group by charge_id) p on p.charge_id = c.id
        where c.status in ('OPEN','PARTIAL') and ${todayLocal()}::date > c.due_date + g.grace_days group by g.branch_id`);
      const branchRows = rowsOf<{ id: string; name: string; archived: boolean }>(await tx.execute(sql`select id, name, archived_at is not null as archived from branches order by name, id`));

      const items = branchRows.map((b) => {
        const a = (s: string) => attBy.find((r) => r.id === b.id && r.status === s)?.n ?? 0;
        const income = num(incomeBy.get(b.id)?.v);
        const expenses = num(expenseBy.get(b.id)?.v);
        return {
          branchId: b.id,
          branchName: b.name,
          archived: b.archived,
          students: studentsBy.get(b.id)?.n ?? 0,
          groups: groupsBy.get(b.id)?.n ?? 0,
          enrollments: { active: enrBy.get(b.id)?.active ?? 0, joined: enrBy.get(b.id)?.joined ?? 0, left: enrBy.get(b.id)?.left ?? 0 },
          attendance: attendanceStats({ present: a('PRESENT'), absent: a('ABSENT'), late: a('LATE'), excused: a('EXCUSED') }),
          income,
          expenses,
          net: income - expenses,
          debt: num(debtBy.get(b.id)?.v),
          debtors: debtBy.get(b.id)?.n ?? 0,
        };
      });
      // Faol bo'lmagan (arxivlangan va hech qanday ko'rsatkichsiz) filial ro'yxatda chiqmaydi
      const shown = items.filter((i) => !i.archived || i.students || i.groups || i.enrollments.active || i.income || i.expenses || i.debt || i.attendance.total);
      const sortKey: Record<string, (i: (typeof shown)[number]) => number> = {
        income: (i) => i.income,
        net: (i) => i.net,
        students: (i) => i.students,
        groups: (i) => i.groups,
        debt: (i) => i.debt,
        attendance: (i) => i.attendance.rate ?? -1,
      };
      if (q.sort !== 'name') shown.sort((x, y) => sortKey[q.sort]!(y) - sortKey[q.sort]!(x) || x.branchName.localeCompare(y.branchName));

      const att = shown.reduce((s, i) => ({ present: s.present + i.attendance.present, absent: s.absent + i.attendance.absent, late: s.late + i.attendance.late, excused: s.excused + i.attendance.excused }), { present: 0, absent: 0, late: 0, excused: 0 });
      const income = shown.reduce((s, i) => s + i.income, 0);
      const expenses = shown.reduce((s, i) => s + i.expenses, 0);
      const distinctStudents = num((rowsOf<{ n: number }>(await tx.execute(sql`select count(distinct ub.user_id)::int as n from user_branches ub join users u on u.id = ub.user_id where u.role = 'STUDENT' and u.status = 'ACTIVE'`))[0]!).n);
      return {
        from: q.from,
        to: q.to,
        sort: q.sort,
        items: shown,
        totals: {
          students: distinctStudents, // ikki filialli o'quvchi bir marta
          groups: shown.reduce((s, i) => s + i.groups, 0),
          enrollments: { active: shown.reduce((s, i) => s + i.enrollments.active, 0), joined: shown.reduce((s, i) => s + i.enrollments.joined, 0), left: shown.reduce((s, i) => s + i.enrollments.left, 0) },
          attendance: attendanceStats(att),
          income,
          expenses,
          net: income - expenses,
          debt: shown.reduce((s, i) => s + i.debt, 0),
        },
      };
    });
  }
}
