import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { PermissionsService } from '../auth/permissions.service.js';
import { branchScope, inScope } from '../common/branch-scope.js';
import { studentGroupIds, teacherGroupIds, teacherStudentIds } from '../common/group-access.js';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { rowsOf } from '../db/rows.js';
import { branches, enrollments, groups, ratingPoints, userBranches, users } from '../db/schema.js';
import { monthEndOf } from '../payroll/payroll-engine.js';
import type { AdjustRatingInput, RankingQuery, RatingEventsQuery } from './academic.schemas.js';

const forbidden = (message = "Bu amal uchun ruxsat yo'q") => new ForbiddenException({ code: 'FORBIDDEN', message });
const nf = (code: string, message: string) => new NotFoundException({ code, message });
const TZ = sql.raw("'Asia/Tashkent'");

/** Davomat balli (saqlanmaydi, attendance_records'dan hisoblanadi): kelgan 2, kech qolgan 1, kelmagan va sababli 0. */
export const ATTENDANCE_POINTS = { PRESENT: 2, LATE: 1, ABSENT: 0, EXCUSED: 0 } as const;

interface RankRow {
  studentId: string;
  studentName: string;
  total: number;
  homework: number;
  attendance: number;
  manual: number;
}

/**
 * Reyting: guruh, filial va butun markaz kesimida, oylik yoki umumiy. Ball = vazifa baholari + davomat (hisoblanadi) + qo'lda ball.
 * Ko'rish `rating.view`: rahbar hammasi; admin faqat o'z filiallari (markaz kesimi yo'q); ustoz faqat o'z guruhi;
 * o'quvchi o'z guruhi, o'z filiali va butun markaz (to'liq ism bilan, ERD 6.5). Qo'lda ball `rating.adjust` (rahbar, ustoz o'z guruhida).
 */
@Injectable()
export class RatingsService {
  constructor(
    private readonly db: DbService,
    private readonly perms: PermissionsService,
  ) {}

  private ctx(actor: AuthUser) {
    return contextOf(actor.centerId, actor.role);
  }

  // ------------------------------------------------------------------ qo'lda ball

  adjust(actor: AuthUser, input: AdjustRatingInput, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'rating.adjust'))) throw forbidden();
      const [g] = await tx
        .select()
        .from(groups)
        .where(and(eq(groups.id, input.groupId), actor.role === 'TEACHER' ? inArray(groups.id, teacherGroupIds(tx, actor.id)) : undefined));
      if (!g) throw nf('GROUP_NOT_FOUND', 'Guruh topilmadi');
      const [e] = await tx.select({ id: enrollments.id }).from(enrollments).where(and(eq(enrollments.groupId, g.id), eq(enrollments.studentId, input.studentId), sql`${enrollments.status} <> 'LEFT'`));
      if (!e) throw nf('STUDENT_NOT_IN_GROUP', "O'quvchi bu guruhda emas");
      const [p] = await tx
        .insert(ratingPoints)
        .values({ centerId: actor.centerId!, branchId: g.branchId, groupId: g.id, studentId: input.studentId, source: 'MANUAL', points: input.points, reason: input.reason, createdBy: actor.id })
        .returning();
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'rating.adjust', entity: 'rating', entityId: input.studentId, after: { eventId: p!.id, groupId: g.id, points: input.points, reason: input.reason }, ip: client.ip });
      return { id: p!.id, studentId: p!.studentId, groupId: p!.groupId, source: p!.source, points: p!.points, reason: p!.reason, at: p!.at };
    });
  }

  // ------------------------------------------------------------------ reyting jadvali

  ranking(actor: AuthUser, q: RankingQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'rating.view'))) throw forbidden();
      const { name } = await this.authorize(tx, actor, q);

      const f = q.month ? sql`${`${q.month}-01`}::date` : null;
      const t = q.month ? sql`${monthEndOf(`${q.month}-01`)}::date` : null;
      const evFilter: SQL[] = [];
      if (q.scope === 'group') evFilter.push(sql`ev.group_id = ${q.groupId}::uuid`);
      if (q.scope === 'branch') evFilter.push(sql`ev.branch_id = ${q.branchId}::uuid`);
      if (f && t) evFilter.push(sql`ev.d between ${f} and ${t}`);
      const base =
        q.scope === 'group'
          ? sql`select e.student_id from enrollments e where e.group_id = ${q.groupId}::uuid and e.status <> 'LEFT'`
          : q.scope === 'branch'
            ? sql`select ub.user_id from user_branches ub where ub.branch_id = ${q.branchId}::uuid`
            : sql`select id from users where role = 'STUDENT'`;

      const rows = rowsOf<RankRow>(
        await tx.execute(sql`
          with ev as (
            select rp.student_id, rp.branch_id, rp.group_id, rp.source, rp.points, (rp.at at time zone ${TZ})::date as d from rating_points rp
            union all
            select a.student_id, g.branch_id, l.group_id, 'ATTENDANCE',
                   case a.status when 'PRESENT' then ${ATTENDANCE_POINTS.PRESENT} when 'LATE' then ${ATTENDANCE_POINTS.LATE} else 0 end, l.lesson_date
            from attendance_records a join lessons l on l.id = a.lesson_id join groups g on g.id = l.group_id where l.status = 'HELD'
          )
          select u.id as "studentId", u.full_name as "studentName",
                 coalesce(sum(ev.points), 0)::int as total,
                 coalesce(sum(ev.points) filter (where ev.source = 'HOMEWORK'), 0)::int as homework,
                 coalesce(sum(ev.points) filter (where ev.source = 'ATTENDANCE'), 0)::int as attendance,
                 coalesce(sum(ev.points) filter (where ev.source = 'MANUAL'), 0)::int as manual
          from users u
          left join ev on ev.student_id = u.id ${evFilter.length ? sql`and ${sql.join(evFilter, sql` and `)}` : sql``}
          where u.role = 'STUDENT' and u.status = 'ACTIVE' and u.id in (${base})
          group by u.id, u.full_name
          order by total desc, u.full_name, u.id`),
      );
      // Musobaqa reytingi: teng ball bir xil o'rin
      let rank = 0;
      const ranked = rows.map((r, i) => {
        if (i === 0 || r.total !== rows[i - 1]!.total) rank = i + 1;
        return { rank, ...r };
      });
      const page = ranked.slice(q.offset, q.offset + q.limit);
      const links = page.length
        ? await tx.select({ userId: userBranches.userId, name: branches.name }).from(userBranches).innerJoin(branches, eq(branches.id, userBranches.branchId)).where(inArray(userBranches.userId, page.map((p) => p.studentId)))
        : [];
      const mine = actor.role === 'STUDENT' ? ranked.find((r) => r.studentId === actor.id) : undefined;
      return {
        scope: q.scope,
        scopeName: name,
        period: q.period,
        month: q.month ?? null,
        total: ranked.length,
        my: mine ? { rank: mine.rank, points: mine.total } : null,
        items: page.map((p) => ({ ...p, branches: links.filter((l) => l.userId === p.studentId).map((l) => l.name).sort((a, b) => a.localeCompare(b)) })),
        limit: q.limit,
        offset: q.offset,
      };
    });
  }

  /** O'quvchining ball voqealari (vazifa va qo'lda; davomat ballari alohida hisoblanadi). */
  events(actor: AuthUser, studentId: string, q: RatingEventsQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'rating.view'))) throw forbidden();
      const [st] = await tx.select({ id: users.id, fullName: users.fullName }).from(users).where(and(eq(users.id, studentId), eq(users.role, 'STUDENT')));
      if (!st) throw nf('STUDENT_NOT_FOUND', "O'quvchi topilmadi");
      if (actor.role === 'STUDENT') {
        if (actor.id !== studentId) throw nf('STUDENT_NOT_FOUND', "O'quvchi topilmadi");
      } else if (actor.role === 'TEACHER') {
        const [ok] = await tx.select({ id: users.id }).from(users).where(and(eq(users.id, studentId), inArray(users.id, teacherStudentIds(tx, actor.id))));
        if (!ok) throw nf('STUDENT_NOT_FOUND', "O'quvchi topilmadi");
      } else if (actor.role !== 'OWNER') {
        const scope = await branchScope(tx, actor);
        const links = await tx.select({ b: userBranches.branchId }).from(userBranches).where(eq(userBranches.userId, studentId));
        if (!links.some((l) => inScope(scope, l.b))) throw nf('STUDENT_NOT_FOUND', "O'quvchi topilmadi");
      }
      const teacherOnly = actor.role === 'TEACHER' ? inArray(ratingPoints.groupId, teacherGroupIds(tx, actor.id)) : undefined;
      const rows = await tx
        .select()
        .from(ratingPoints)
        .where(and(eq(ratingPoints.studentId, studentId), q.groupId ? eq(ratingPoints.groupId, q.groupId) : undefined, teacherOnly))
        .orderBy(desc(ratingPoints.at), desc(ratingPoints.id))
        .limit(q.limit)
        .offset(q.offset);
      const gs = rows.length ? await tx.select({ id: groups.id, name: groups.name }).from(groups).where(inArray(groups.id, [...new Set(rows.map((r) => r.groupId))])) : [];
      return {
        studentId,
        studentName: st.fullName,
        items: rows.map((r) => ({ id: r.id, groupId: r.groupId, groupName: gs.find((g) => g.id === r.groupId)?.name ?? null, source: r.source, sourceId: r.sourceId, points: r.points, reason: r.reason, at: r.at })),
        limit: q.limit,
        offset: q.offset,
      };
    });
  }

  // ------------------------------------------------------------------ yordamchilar

  /** Kesimga kirish huquqi va uning nomi. Ruxsatsiz kesim 403, ko'rinmaydigan guruh/filial 404. */
  private async authorize(tx: Tx, actor: AuthUser, q: RankingQuery): Promise<{ name: string }> {
    const scope = await branchScope(tx, actor);
    if (q.scope === 'center') {
      if (actor.role === 'TEACHER' || actor.role === 'ADMIN') throw forbidden("Markaz reytingi ustoz va adminga ko'rsatilmaydi");
      return { name: 'Markaz' };
    }
    if (q.scope === 'group') {
      if (actor.role === 'TEACHER') {
        const [g] = await tx.select({ name: groups.name }).from(groups).where(and(eq(groups.id, q.groupId!), inArray(groups.id, teacherGroupIds(tx, actor.id))));
        if (!g) throw nf('GROUP_NOT_FOUND', 'Guruh topilmadi');
        return { name: g.name };
      }
      if (actor.role === 'STUDENT') {
        const [g] = await tx.select({ name: groups.name }).from(groups).where(and(eq(groups.id, q.groupId!), inArray(groups.id, studentGroupIds(tx, actor.id))));
        if (!g) throw nf('GROUP_NOT_FOUND', 'Guruh topilmadi');
        return { name: g.name };
      }
      const [g] = await tx.select({ name: groups.name, branchId: groups.branchId }).from(groups).where(eq(groups.id, q.groupId!));
      if (!g || !inScope(scope, g.branchId)) throw nf('GROUP_NOT_FOUND', 'Guruh topilmadi');
      return { name: g.name };
    }
    // filial kesimi
    if (actor.role === 'TEACHER') throw forbidden("Filial reytingi ustozga ko'rsatilmaydi");
    const [b] = await tx.select({ name: branches.name }).from(branches).where(eq(branches.id, q.branchId!));
    if (!b) throw nf('BRANCH_NOT_FOUND', 'Filial topilmadi');
    if (actor.role === 'STUDENT') {
      const [l] = await tx.select({ b: userBranches.branchId }).from(userBranches).where(and(eq(userBranches.userId, actor.id), eq(userBranches.branchId, q.branchId!)));
      if (!l) throw nf('BRANCH_NOT_FOUND', 'Filial topilmadi');
    } else if (!inScope(scope, q.branchId!)) throw nf('BRANCH_NOT_FOUND', 'Filial topilmadi');
    return { name: b.name };
  }
}
