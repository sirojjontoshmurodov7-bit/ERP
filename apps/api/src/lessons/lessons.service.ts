import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, desc, eq, gte, inArray, isNull, lte, or, sql, type SQL } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { PermissionsService } from '../auth/permissions.service.js';
import { branchScope, type BranchScope } from '../common/branch-scope.js';
import { daysBetween, todayLocal } from '../common/dates.js';
import { currentTeacher, groupVisibility } from '../common/group-access.js';
import { uniqueViolation } from '../common/pg-errors.js';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { attendanceRecords, centers, enrollments, groups, groupTeachers, lessons, users } from '../db/schema.js';
import type { AttendanceQuery, CreateLessonInput, ListLessonsQuery, MarkAttendanceInput, UpdateLessonInput } from './lessons.schemas.js';

const forbidden = (message = "Bu amal uchun ruxsat yo'q") => new ForbiddenException({ code: 'FORBIDDEN', message });
const conflict = (code: string, message: string) => new ConflictException({ code, message });
const bad = (code: string, message: string) => new BadRequestException({ code, message });
const groupNotFound = () => new NotFoundException({ code: 'GROUP_NOT_FOUND', message: 'Guruh topilmadi' });
const lessonNotFound = () => new NotFoundException({ code: 'LESSON_NOT_FOUND', message: 'Dars topilmadi' });
const today = todayLocal;

/** Markaz sozlamasi `attendance_lock_days` yo'q bo'lsa: dars sanasidan keyin shuncha kun davomat tuzatiladi. */
export const DEFAULT_ATTENDANCE_LOCK_DAYS = 3;
const rate = (present: number, late: number, absent: number) => (present + late + absent > 0 ? Math.round(((present + late) / (present + late + absent)) * 1000) / 10 : null);

type LessonRow = typeof lessons.$inferSelect;
type GroupRow = typeof groups.$inferSelect;

/**
 * Dars va davomat. Dars qo'lda ochiladi (jadvaldan avtomatik emas: dars ko'chishi mumkin), bir guruhda bir sanada bitta.
 * Belgilash `attendance.mark` (ustoz o'z guruhida, admin ○ o'z filialida, rahbar), ko'rish `attendance.view`
 * (o'quvchi faqat o'zinikini). Davomat yozuvi o'chirilmaydi: tuzatish audit jurnaliga before/after bilan yoziladi.
 * Qulf: dars sanasidan `attendance_lock_days` kun o'tgach (yoki `locked_at` qo'yilgan bo'lsa) dars qulflanadi; qulflangan darsni
 * faqat `attendance.edit_past` egasi tuzatadi (alohida audit amali bilan).
 */
@Injectable()
export class LessonsService {
  constructor(
    private readonly db: DbService,
    private readonly perms: PermissionsService,
  ) {}

  private ctx(actor: AuthUser) {
    return contextOf(actor.centerId, actor.role);
  }

  // ------------------------------------------------------------------ dars ochish

  async createLesson(actor: AuthUser, groupId: string, input: CreateLessonInput, client: ClientInfo) {
    try {
      return await this.db.withContext(this.ctx(actor), async (tx) => {
        if (!(await this.perms.hasIn(tx, actor, 'attendance.mark'))) throw forbidden();
        const group = await this.visibleGroup(tx, actor, await branchScope(tx, actor), groupId);
        if (group.archivedAt) throw conflict('GROUP_ARCHIVED', 'Guruh arxivlangan');
        if (input.lessonDate > today()) throw bad('LESSON_IN_FUTURE', "Kelajakdagi dars uchun davomat ochib bo'lmaydi");
        // Qulf muddatidan eski sanaga dars ochish ham o'tmishni tuzatish hisoblanadi (qulfni aylanib o'tish yo'li yopiq)
        if (daysBetween(input.lessonDate, today()) > (await this.lockDays(tx, actor.centerId!)) && !(await this.perms.hasIn(tx, actor, 'attendance.edit_past'))) {
          throw new ForbiddenException({ code: 'LESSON_LOCKED', message: 'Bu sana qulflangan: eski sanaga dars ochish uchun attendance.edit_past ruxsati kerak' });
        }

        let teacherId: string | null;
        if (actor.role === 'TEACHER') {
          if (input.teacherId && input.teacherId !== actor.id) throw forbidden("Darsni faqat o'z nomingizdan ochasiz");
          teacherId = actor.id;
        } else if (input.teacherId) {
          await this.assertGroupTeacher(tx, groupId, input.teacherId);
          teacherId = input.teacherId;
        } else {
          const [main] = await tx
            .select({ teacherId: groupTeachers.teacherId })
            .from(groupTeachers)
            .where(and(eq(groupTeachers.groupId, groupId), eq(groupTeachers.kind, 'MAIN'), isNull(groupTeachers.toDate)));
          teacherId = main?.teacherId ?? null;
        }

        const [l] = await tx
          .insert(lessons)
          .values({ centerId: actor.centerId!, groupId, lessonDate: input.lessonDate, teacherId, topic: input.topic ?? null, createdBy: actor.id })
          .returning();
        await this.audit(tx, actor, client, 'lesson.create', l!.id, undefined, this.auditView(l!));
        return (await this.present(tx, actor, [l!], group))[0]!;
      });
    } catch (e) {
      if (uniqueViolation(e)?.includes('lessons_group_date')) throw conflict('LESSON_EXISTS', 'Bu sanada guruhning darsi allaqachon ochilgan');
      throw e;
    }
  }

  // ------------------------------------------------------------ ro'yxat va ko'rish

  listLessons(actor: AuthUser, groupId: string, q: ListLessonsQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'attendance.view'))) throw forbidden();
      const group = await this.visibleGroup(tx, actor, await branchScope(tx, actor), groupId);
      const conds: (SQL | undefined)[] = [
        eq(lessons.groupId, groupId),
        q.from ? gte(lessons.lessonDate, q.from) : undefined,
        q.to ? lte(lessons.lessonDate, q.to) : undefined,
        q.status ? eq(lessons.status, q.status) : undefined,
      ];
      const rows = await tx.select().from(lessons).where(and(...conds)).orderBy(desc(lessons.lessonDate)).limit(q.limit).offset(q.offset);
      return { items: await this.present(tx, actor, rows, group), limit: q.limit, offset: q.offset };
    });
  }

  /** Dars va qatnashchilar ro'yxati (dars kuni guruhda bo'lganlar). O'quvchi faqat o'z qatorini ko'radi. */
  getLesson(actor: AuthUser, id: string) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'attendance.view'))) throw forbidden();
      return this.detail(tx, actor, await this.loadLesson(tx, actor, await branchScope(tx, actor), id));
    });
  }

  // ------------------------------------------------------------------ tahrirlash

  updateLesson(actor: AuthUser, id: string, patch: UpdateLessonInput, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'attendance.mark'))) throw forbidden();
      const before = await this.loadLesson(tx, actor, await branchScope(tx, actor), id);
      const pastEdit = await this.assertEditable(tx, actor, before);
      if (patch.teacherId !== undefined && actor.role === 'TEACHER') throw forbidden("Dars ustozini faqat rahbar yoki admin o'zgartiradi");
      if (patch.teacherId) await this.assertGroupTeacher(tx, before.groupId, patch.teacherId);
      if (patch.status === 'CANCELLED' && before.status !== 'CANCELLED') {
        const [{ n } = { n: 0 }] = await tx.select({ n: count() }).from(attendanceRecords).where(eq(attendanceRecords.lessonId, id));
        if (Number(n) > 0) throw conflict('LESSON_HAS_ATTENDANCE', "Davomat belgilangan darsni bekor qilib bo'lmaydi");
      }
      const set: Partial<typeof lessons.$inferInsert> = { updatedAt: new Date() };
      if (patch.topic !== undefined) set.topic = patch.topic;
      if (patch.teacherId !== undefined) set.teacherId = patch.teacherId;
      if (patch.status !== undefined) set.status = patch.status;
      const [after] = await tx.update(lessons).set(set).where(eq(lessons.id, id)).returning();
      await this.audit(tx, actor, client, pastEdit ? 'lesson.edit_past' : 'lesson.edit', id, this.auditView(before), this.auditView(after!));
      return this.detail(tx, actor, after!);
    });
  }

  // ------------------------------------------------------------ davomat belgilash

  /**
   * Bir so'rovda ko'p o'quvchini belgilaydi; qayta yuborilsa yangilaydi (yuborilmaganlar o'zgarmaydi).
   * Faqat dars kuni guruhda bo'lgan o'quvchilar: yozilgan sanasi <= dars sanasi va (ACTIVE yoki dars kunidan keyin chiqqan).
   */
  markAttendance(actor: AuthUser, id: string, input: MarkAttendanceInput, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'attendance.mark'))) throw forbidden();
      const lesson = await this.loadLesson(tx, actor, await branchScope(tx, actor), id);
      if (lesson.status !== 'HELD') throw conflict('LESSON_CANCELLED', 'Bekor qilingan darsga davomat belgilanmaydi');
      const pastEdit = await this.assertEditable(tx, actor, lesson);

      const ids = input.records.map((r) => r.studentId);
      if (new Set(ids).size !== ids.length) throw bad('DUPLICATE_STUDENT', "Bir o'quvchi so'rovda ikki marta berilgan");
      const eligible = new Set((await this.eligible(tx, lesson)).map((s) => s.id));
      const outside = ids.filter((s) => !eligible.has(s));
      if (outside.length) {
        throw new BadRequestException({ code: 'STUDENT_NOT_IN_LESSON', message: "Ba'zi o'quvchilar dars kuni guruhda bo'lmagan", studentIds: outside });
      }

      const existing = await tx
        .select()
        .from(attendanceRecords)
        .where(and(eq(attendanceRecords.lessonId, id), inArray(attendanceRecords.studentId, ids)));
      const before: Record<string, { status: string; note: string | null }> = {};
      for (const r of existing) before[r.studentId] = { status: r.status, note: r.note };

      const now = new Date();
      for (const r of input.records) {
        await tx
          .insert(attendanceRecords)
          .values({ lessonId: id, studentId: r.studentId, centerId: actor.centerId!, status: r.status, note: r.note ?? null, markedBy: actor.id, markedAt: now })
          .onConflictDoUpdate({
            target: [attendanceRecords.lessonId, attendanceRecords.studentId],
            set: { status: r.status, note: r.note ?? null, markedBy: actor.id, markedAt: now },
          });
      }
      const after: Record<string, { status: string; note: string | null }> = {};
      for (const r of input.records) after[r.studentId] = { status: r.status, note: r.note ?? null };
      await this.audit(tx, actor, client, pastEdit ? 'attendance.edit_past' : 'attendance.mark', id, { records: before }, { records: after });
      return this.detail(tx, actor, lesson);
    });
  }

  // ------------------------------------------------- davomatni ko'rish va yig'ma

  /** Davomat yozuvlari (qamrov bo'yicha): guruh, o'quvchi, sana oralig'i, holat. O'quvchi faqat o'zinikini ko'radi. */
  listAttendance(actor: AuthUser, q: AttendanceQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'attendance.view'))) throw forbidden();
      const scope = await branchScope(tx, actor);
      const rows = await tx
        .select({
          lessonId: lessons.id,
          lessonDate: lessons.lessonDate,
          groupId: groups.id,
          groupName: groups.name,
          studentId: attendanceRecords.studentId,
          studentName: users.fullName,
          status: attendanceRecords.status,
          note: attendanceRecords.note,
          markedAt: attendanceRecords.markedAt,
        })
        .from(attendanceRecords)
        .innerJoin(lessons, eq(lessons.id, attendanceRecords.lessonId))
        .innerJoin(groups, eq(groups.id, lessons.groupId))
        .innerJoin(users, eq(users.id, attendanceRecords.studentId))
        .where(and(...this.filters(tx, actor, scope, q), q.status ? eq(attendanceRecords.status, q.status) : undefined))
        .orderBy(desc(lessons.lessonDate), asc(users.fullName), asc(groups.name))
        .limit(q.limit)
        .offset(q.offset);
      return { items: rows, limit: q.limit, offset: q.offset };
    });
  }

  /**
   * Yig'ma: jami holatlar; guruh ko'rsatilsa o'quvchilar kesimida, aks holda guruhlar kesimida (o'quvchi uchun faqat o'zi).
   * `rate` = (kelgan + kech qolgan) / (kelgan + kech qolgan + kelmagan) * 100; sababli (EXCUSED) hisobga olinmaydi, maxraj 0 bo'lsa null.
   */
  attendanceSummary(actor: AuthUser, q: AttendanceQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'attendance.view'))) throw forbidden();
      const scope = await branchScope(tx, actor);
      const counts = {
        present: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'PRESENT')::int`,
        absent: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'ABSENT')::int`,
        late: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'LATE')::int`,
        excused: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'EXCUSED')::int`,
      };
      const where = and(...this.filters(tx, actor, scope, q));
      const shape = <T extends { present: number; absent: number; late: number; excused: number }>(r: T) => ({
        ...r,
        total: r.present + r.absent + r.late + r.excused,
        rate: rate(r.present, r.late, r.absent),
      });
      const [totals] = await tx
        .select(counts)
        .from(attendanceRecords)
        .innerJoin(lessons, eq(lessons.id, attendanceRecords.lessonId))
        .innerJoin(groups, eq(groups.id, lessons.groupId))
        .where(where);
      const result: Record<string, unknown> = { totals: shape(totals ?? { present: 0, absent: 0, late: 0, excused: 0 }) };
      if (q.groupId && actor.role !== 'STUDENT') {
        const rows = await tx
          .select({ studentId: attendanceRecords.studentId, fullName: users.fullName, ...counts })
          .from(attendanceRecords)
          .innerJoin(lessons, eq(lessons.id, attendanceRecords.lessonId))
          .innerJoin(groups, eq(groups.id, lessons.groupId))
          .innerJoin(users, eq(users.id, attendanceRecords.studentId))
          .where(where)
          .groupBy(attendanceRecords.studentId, users.fullName)
          .orderBy(asc(users.fullName));
        result.byStudent = rows.map(shape);
      } else {
        const rows = await tx
          .select({ groupId: groups.id, groupName: groups.name, ...counts })
          .from(attendanceRecords)
          .innerJoin(lessons, eq(lessons.id, attendanceRecords.lessonId))
          .innerJoin(groups, eq(groups.id, lessons.groupId))
          .where(where)
          .groupBy(groups.id, groups.name)
          .orderBy(asc(groups.name));
        result.byGroup = rows.map(shape);
      }
      return result;
    });
  }

  /** Umumiy shartlar: guruh qamrovi, o'quvchi faqat o'zi, guruh/o'quvchi/sana filtrlari. */
  private filters(tx: Tx, actor: AuthUser, scope: BranchScope, q: AttendanceQuery): (SQL | undefined)[] {
    return [
      groupVisibility(tx, actor, scope),
      actor.role === 'STUDENT' ? eq(attendanceRecords.studentId, actor.id) : q.studentId ? eq(attendanceRecords.studentId, q.studentId) : undefined,
      q.groupId ? eq(groups.id, q.groupId) : undefined,
      q.from ? gte(lessons.lessonDate, q.from) : undefined,
      q.to ? lte(lessons.lessonDate, q.to) : undefined,
    ];
  }

  // ---------------------------------------------------------------- yordamchilar

  /** Markazning davomat qulfi muddati (kun). */
  private async lockDays(tx: Tx, centerId: string): Promise<number> {
    const [c] = await tx.select({ settings: centers.settings }).from(centers).where(eq(centers.id, centerId));
    const v = (c?.settings as { attendance_lock_days?: unknown } | undefined)?.attendance_lock_days;
    return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 365 ? v : DEFAULT_ATTENDANCE_LOCK_DAYS;
  }

  private isLocked(l: LessonRow, lockDays: number): boolean {
    return l.lockedAt !== null || daysBetween(l.lessonDate, today()) > lockDays;
  }

  /** Qulflangan darsni faqat `attendance.edit_past` egasi o'zgartiradi. Qaytaradi: tuzatish qulflangan darsgami (audit amali uchun). */
  private async assertEditable(tx: Tx, actor: AuthUser, lesson: LessonRow): Promise<boolean> {
    if (!this.isLocked(lesson, await this.lockDays(tx, actor.centerId!))) return false;
    if (!(await this.perms.hasIn(tx, actor, 'attendance.edit_past'))) {
      throw new ForbiddenException({ code: 'LESSON_LOCKED', message: 'Dars qulflangan: tuzatish uchun attendance.edit_past ruxsati kerak' });
    }
    return true;
  }

  /** Guruh qamrovda (rahbar hammasi, admin filiali, ustoz o'z guruhi, o'quvchi yozilgan guruhi); aks holda 404. */
  private async visibleGroup(tx: Tx, actor: AuthUser, scope: BranchScope, groupId: string): Promise<GroupRow> {
    const [g] = await tx.select().from(groups).where(and(eq(groups.id, groupId), groupVisibility(tx, actor, scope)));
    if (!g) throw groupNotFound();
    return g;
  }

  /** Dars: markaz ichida (RLS) va guruhi qamrovda; aks holda 404. */
  private async loadLesson(tx: Tx, actor: AuthUser, scope: BranchScope, id: string): Promise<LessonRow> {
    const [l] = await tx
      .select()
      .from(lessons)
      .where(and(eq(lessons.id, id), inArray(lessons.groupId, tx.select({ id: groups.id }).from(groups).where(groupVisibility(tx, actor, scope)))));
    if (!l) throw lessonNotFound();
    return l;
  }

  /** Ustoz guruhga amalda biriktirilgan bo'lishi kerak. */
  private async assertGroupTeacher(tx: Tx, groupId: string, teacherId: string) {
    const [row] = await tx
      .select({ id: groupTeachers.teacherId })
      .from(groupTeachers)
      .where(and(eq(groupTeachers.groupId, groupId), eq(groupTeachers.teacherId, teacherId), currentTeacher()));
    if (!row) throw bad('TEACHER_NOT_IN_GROUP', 'Ustoz bu guruhga biriktirilmagan');
  }

  /** Dars kuni guruhda bo'lgan o'quvchilar (muzlatilganlar chiqarib tashlanadi). */
  private async eligible(tx: Tx, lesson: LessonRow) {
    const rows = await tx
      .select({ id: users.id, fullName: users.fullName })
      .from(enrollments)
      .innerJoin(users, eq(users.id, enrollments.studentId))
      .where(
        and(
          eq(enrollments.groupId, lesson.groupId),
          lte(enrollments.joinedAt, lesson.lessonDate),
          or(eq(enrollments.status, 'ACTIVE'), and(eq(enrollments.status, 'LEFT'), gte(enrollments.leftAt, lesson.lessonDate))),
        ),
      )
      .orderBy(asc(users.fullName));
    return [...new Map(rows.map((r) => [r.id, r])).values()]; // chiqib qayta yozilgan o'quvchi bir marta
  }

  private async detail(tx: Tx, actor: AuthUser, lesson: LessonRow) {
    const [group] = await tx.select().from(groups).where(eq(groups.id, lesson.groupId));
    const [view] = await this.present(tx, actor, [lesson], group!);
    const records = await tx
      .select({ studentId: attendanceRecords.studentId, status: attendanceRecords.status, note: attendanceRecords.note, markedAt: attendanceRecords.markedAt, markedBy: attendanceRecords.markedBy, fullName: users.fullName })
      .from(attendanceRecords)
      .innerJoin(users, eq(users.id, attendanceRecords.studentId))
      .where(and(eq(attendanceRecords.lessonId, lesson.id), actor.role === 'STUDENT' ? eq(attendanceRecords.studentId, actor.id) : undefined));
    const people = new Map<string, string>();
    for (const e of await this.eligible(tx, lesson)) people.set(e.id, e.fullName);
    for (const r of records) people.set(r.studentId, r.fullName); // keyin guruhdan chiqqan/muzlatilgan bo'lsa ham yozuvi ko'rinadi
    if (actor.role === 'STUDENT') {
      const mine = people.get(actor.id);
      people.clear();
      if (mine !== undefined) people.set(actor.id, mine);
    }

    const roster = [...people.entries()]
      .map(([studentId, fullName]) => {
        const r = records.find((x) => x.studentId === studentId);
        return {
          studentId,
          fullName,
          status: r?.status ?? null,
          note: r?.note ?? null,
          markedAt: r?.markedAt ?? null,
          ...(actor.role === 'STUDENT' ? {} : { markedBy: r?.markedBy ?? null }),
        };
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
    return { ...view!, roster };
  }

  /** Dars ko'rinishi: guruh va ustoz nomi; xodimga holatlar yig'masi, o'quvchiga faqat o'z holati. */
  private async present(tx: Tx, actor: AuthUser, rows: LessonRow[], group: GroupRow) {
    if (!rows.length) return [];
    const ids = rows.map((l) => l.id);
    const lockDays = await this.lockDays(tx, actor.centerId!);
    const teacherIds = [...new Set(rows.map((l) => l.teacherId).filter((x): x is string => !!x))];
    const [teachers, recs] = await Promise.all([
      teacherIds.length ? tx.select({ id: users.id, fullName: users.fullName }).from(users).where(inArray(users.id, teacherIds)) : Promise.resolve([]),
      tx
        .select({ lessonId: attendanceRecords.lessonId, studentId: attendanceRecords.studentId, status: attendanceRecords.status })
        .from(attendanceRecords)
        .where(and(inArray(attendanceRecords.lessonId, ids), actor.role === 'STUDENT' ? eq(attendanceRecords.studentId, actor.id) : undefined)),
    ]);
    return rows.map((l) => {
      const mine = recs.filter((r) => r.lessonId === l.id);
      const tally = (s: string) => mine.filter((r) => r.status === s).length;
      return {
        id: l.id,
        groupId: l.groupId,
        groupName: group.name,
        lessonDate: l.lessonDate,
        teacherId: l.teacherId,
        teacherName: teachers.find((t) => t.id === l.teacherId)?.fullName ?? null,
        topic: l.topic,
        status: l.status,
        lockedAt: l.lockedAt,
        locked: this.isLocked(l, lockDays),
        createdAt: l.createdAt,
        ...(actor.role === 'STUDENT'
          ? { myStatus: mine[0]?.status ?? null }
          : { summary: { present: tally('PRESENT'), absent: tally('ABSENT'), late: tally('LATE'), excused: tally('EXCUSED') } }),
      };
    });
  }

  private auditView(l: LessonRow) {
    return { groupId: l.groupId, lessonDate: l.lessonDate, teacherId: l.teacherId, topic: l.topic, status: l.status };
  }

  private audit(tx: Tx, actor: AuthUser, client: ClientInfo, action: string, id: string, before: unknown, after: unknown) {
    return writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action, entity: 'lesson', entityId: id, before, after, ip: client.ip });
  }
}
