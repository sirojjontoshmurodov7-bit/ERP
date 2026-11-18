import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, eq, ilike, inArray, isNull, notInArray, sql, type SQL } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { PermissionsService } from '../auth/permissions.service.js';
import { BillingService } from '../billing/billing.service.js';
import { type BranchScope, branchScope, inScope } from '../common/branch-scope.js';
import { currentTeacher, groupVisibility } from '../common/group-access.js';
import { todayLocal } from '../common/dates.js';
import { pgErrorInfo } from '../common/pg-errors.js';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { branches, centers, courses, enrollments, groupSchedules, groups, groupTeachers, userBranches, users } from '../db/schema.js';
import {
  type AssignTeacherInput,
  BILLING_KEYS,
  type CreateGroupInput,
  type ListGroupsQuery,
  type ScheduleItem,
  type UpdateGroupInput,
} from './groups.schemas.js';

const forbidden = (message = "Bu amal uchun ruxsat yo'q") => new ForbiddenException({ code: 'FORBIDDEN', message });
const groupNotFound = () => new NotFoundException({ code: 'GROUP_NOT_FOUND', message: 'Guruh topilmadi' });
const bad = (code: string, message: string) => new BadRequestException({ code, message });
const conflict = (code: string, message: string) => new ConflictException({ code, message });
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);
const today = todayLocal;

type GroupRow = typeof groups.$inferSelect;
@Injectable()
export class GroupsService {
  constructor(
    private readonly db: DbService,
    private readonly perms: PermissionsService,
    private readonly billing: BillingService,
  ) {}

  private ctx(actor: AuthUser) {
    return contextOf(actor.centerId, actor.role);
  }

  // ---------------------------------------------------------------- yaratish

  async create(actor: AuthUser, input: CreateGroupInput, client: ClientInfo) {
    return this.guard(() =>
      this.db.withContext(this.ctx(actor), async (tx) => {
        if (!(await this.perms.hasIn(tx, actor, 'group.create'))) throw forbidden();
        if (BILLING_KEYS.some((k) => input[k] !== undefined) && !(await this.perms.hasIn(tx, actor, 'group.billing_settings'))) {
          throw forbidden("Narx, sikl rejimi va grace sozlamasini o'zgartirish huquqingiz yo'q");
        }
        const scope = await branchScope(tx, actor);
        await this.assertBranch(tx, scope, input.branchId);
        const course = await this.activeCourse(tx, input.courseId);
        this.assertDates(input.startDate, input.endDate);

        const [center] = await tx.select({ settings: centers.settings }).from(centers).where(eq(centers.id, actor.centerId!));
        const settings = (center?.settings ?? {}) as { billing_mode?: string; grace_days?: number };
        const billingMode = input.billingMode ?? (settings.billing_mode === 'STUDENT_CYCLE' ? 'STUDENT_CYCLE' : 'GROUP_CYCLE');
        const priceMonthly = input.priceMonthly ?? course.defaultPrice;
        if (priceMonthly === null) throw bad('PRICE_REQUIRED', "Guruh narxini kiriting (kursda sukut narx yo'q)");
        if (billingMode === 'STUDENT_CYCLE' && input.billingDay !== undefined) {
          throw bad('BILLING_DAY_NOT_ALLOWED', "To'lov kuni faqat GROUP_CYCLE rejimida bo'ladi");
        }
        const billingDay = billingMode === 'GROUP_CYCLE' ? (input.billingDay ?? this.dayOf(input.startDate)) : null;

        const [g] = await tx
          .insert(groups)
          .values({
            centerId: actor.centerId!,
            branchId: input.branchId,
            courseId: input.courseId,
            name: input.name,
            priceMonthly,
            billingMode,
            billingDay,
            graceDays: input.graceDays ?? Number(settings.grace_days ?? 0),
            startDate: input.startDate ?? null,
            endDate: input.endDate ?? null,
            status: input.status ?? 'PLANNED',
          })
          .returning();
        if (input.schedule?.length) await this.insertSchedule(tx, actor, g!.id, input.schedule);
        await this.audit(tx, actor, client, 'group.create', g!.id, undefined, this.auditView(g!));
        return (await this.present(tx, actor, [g!]))[0]!;
      }),
    );
  }

  // -------------------------------------------------------- ro'yxat va ko'rish

  list(actor: AuthUser, q: ListGroupsQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'group.view'))) throw forbidden();
      const scope = await branchScope(tx, actor);
      const empty = { items: [], limit: q.limit, offset: q.offset };
      if (q.branchId && actor.role !== 'TEACHER' && actor.role !== 'STUDENT' && !inScope(scope, q.branchId)) return empty;

      const conds: (SQL | undefined)[] = [
        groupVisibility(tx, actor, scope),
        q.includeArchived ? undefined : isNull(groups.archivedAt),
        q.branchId ? eq(groups.branchId, q.branchId) : undefined,
        q.courseId ? eq(groups.courseId, q.courseId) : undefined,
        q.status ? eq(groups.status, q.status) : undefined,
        q.q ? ilike(groups.name, `%${escapeLike(q.q)}%`) : undefined,
        q.billingMode ? eq(groups.billingMode, q.billingMode) : undefined,
        q.noTeacher === undefined
          ? undefined
          : (q.noTeacher ? notInArray : inArray)(groups.id, tx.select({ id: groupTeachers.groupId }).from(groupTeachers).where(and(eq(groupTeachers.kind, 'MAIN'), currentTeacher()))),
        q.teacherId
          ? inArray(groups.id, tx.select({ id: groupTeachers.groupId }).from(groupTeachers).where(and(eq(groupTeachers.teacherId, q.teacherId), currentTeacher())))
          : undefined,
      ];
      const rows = await tx.select().from(groups).where(and(...conds)).orderBy(asc(groups.name), asc(groups.id)).limit(q.limit).offset(q.offset);
      return { items: await this.present(tx, actor, rows), limit: q.limit, offset: q.offset };
    });
  }

  get(actor: AuthUser, id: string) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'group.view'))) throw forbidden();
      const g = await this.load(tx, actor, await branchScope(tx, actor), id);
      return (await this.present(tx, actor, [g]))[0]!;
    });
  }

  // ------------------------------------------------------------- tahrirlash

  update(actor: AuthUser, id: string, patch: UpdateGroupInput, client: ClientInfo) {
    return this.guard(() =>
      this.db.withContext(this.ctx(actor), async (tx) => {
        if (!(await this.perms.hasIn(tx, actor, 'group.edit'))) throw forbidden();
        if (BILLING_KEYS.some((k) => patch[k] !== undefined) && !(await this.perms.hasIn(tx, actor, 'group.billing_settings'))) {
          throw forbidden("Narx, sikl rejimi va grace sozlamasini o'zgartirish huquqingiz yo'q");
        }
        const before = await this.load(tx, actor, await branchScope(tx, actor), id);
        if (patch.courseId) await this.activeCourse(tx, patch.courseId);
        this.assertDates(patch.startDate === undefined ? before.startDate : patch.startDate, patch.endDate === undefined ? before.endDate : patch.endDate);

        // Narx o'zgarishi yoki guruh tugashidan oldin kelgan davrlar eski qiymatda hisoblanadi
        if ((patch.priceMonthly !== undefined && patch.priceMonthly !== before.priceMonthly) || (patch.status === 'FINISHED' && before.status !== 'FINISHED')) {
          await this.billing.generate(tx, actor.centerId!, { groupId: id });
        }
        const set: Partial<typeof groups.$inferInsert> = { updatedAt: new Date() };
        if (patch.name !== undefined) set.name = patch.name;
        if (patch.courseId !== undefined) set.courseId = patch.courseId;
        if (patch.priceMonthly !== undefined) set.priceMonthly = patch.priceMonthly;
        if (patch.graceDays !== undefined) set.graceDays = patch.graceDays;
        if (patch.startDate !== undefined) set.startDate = patch.startDate;
        if (patch.endDate !== undefined) set.endDate = patch.endDate;
        if (patch.status !== undefined) set.status = patch.status;

        const mode = patch.billingMode ?? before.billingMode;
        if (patch.billingMode !== undefined || patch.billingDay !== undefined) {
          if (mode === 'STUDENT_CYCLE') {
            if (patch.billingDay !== undefined) throw bad('BILLING_DAY_NOT_ALLOWED', "To'lov kuni faqat GROUP_CYCLE rejimida bo'ladi");
            set.billingMode = 'STUDENT_CYCLE';
            set.billingDay = null;
          } else {
            const day = patch.billingDay ?? before.billingDay;
            if (day === null) throw bad('BILLING_DAY_REQUIRED', "GROUP_CYCLE rejimi uchun to'lov kuni (1-28) kerak");
            set.billingMode = 'GROUP_CYCLE';
            set.billingDay = day;
          }
        }

        if ((set.billingMode !== undefined && (set.billingMode !== before.billingMode || set.billingDay !== before.billingDay)) && (await this.billing.groupHasCharges(tx, id))) {
          throw conflict('BILLING_HAS_CHARGES', "Guruhda hisob-kitob bor: sikl rejimi va to'lov kunini o'zgartirib bo'lmaydi");
        }
        const [after] = await tx.update(groups).set(set).where(eq(groups.id, id)).returning();
        await this.audit(tx, actor, client, 'group.edit', id, this.auditView(before), this.auditView(after!));
        return (await this.present(tx, actor, [after!]))[0]!;
      }),
    );
  }

  /** Arxivlash yumshoq o'chirish. Tugallanmagan yozilishi bo'lgan guruh arxivlanmaydi. */
  archive(actor: AuthUser, id: string, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'group.edit'))) throw forbidden();
      const before = await this.load(tx, actor, await branchScope(tx, actor), id);
      if (before.archivedAt) throw conflict('ALREADY_ARCHIVED', 'Guruh allaqachon arxivlangan');
      const [{ open } = { open: 0 }] = await tx.select({ open: count() }).from(enrollments).where(and(eq(enrollments.groupId, id), sql`${enrollments.status} <> 'LEFT'`));
      if (Number(open) > 0) throw conflict('GROUP_HAS_STUDENTS', `Guruhda ${open} ta faol o'quvchi bor: avval ularni chiqaring yoki ko'chiring`);
      const [after] = await tx.update(groups).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(groups.id, id)).returning();
      await this.audit(tx, actor, client, 'group.archive', id, this.auditView(before), this.auditView(after!));
      return (await this.present(tx, actor, [after!]))[0]!;
    });
  }

  unarchive(actor: AuthUser, id: string, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'group.edit'))) throw forbidden();
      const before = await this.load(tx, actor, await branchScope(tx, actor), id);
      if (!before.archivedAt) throw conflict('NOT_ARCHIVED', 'Guruh arxivlanmagan');
      const [branch] = await tx.select({ archivedAt: branches.archivedAt }).from(branches).where(eq(branches.id, before.branchId));
      if (branch?.archivedAt) throw conflict('BRANCH_ARCHIVED', 'Guruh filiali arxivlangan');
      await this.activeCourse(tx, before.courseId).catch(() => {
        throw conflict('COURSE_ARCHIVED', 'Guruh kursi arxivlangan');
      });
      const [after] = await tx.update(groups).set({ archivedAt: null, updatedAt: new Date() }).where(eq(groups.id, id)).returning();
      await this.audit(tx, actor, client, 'group.unarchive', id, this.auditView(before), this.auditView(after!));
      return (await this.present(tx, actor, [after!]))[0]!;
    });
  }

  // ------------------------------------------------------------- dars jadvali

  setSchedule(actor: AuthUser, id: string, schedule: ScheduleItem[], client: ClientInfo) {
    return this.guard(() =>
      this.db.withContext(this.ctx(actor), async (tx) => {
        if (!(await this.perms.hasIn(tx, actor, 'group.edit'))) throw forbidden();
        const g = await this.load(tx, actor, await branchScope(tx, actor), id);
        const [before] = await this.present(tx, actor, [g]);
        await tx.delete(groupSchedules).where(eq(groupSchedules.groupId, id));
        if (schedule.length) await this.insertSchedule(tx, actor, id, schedule);
        const [after] = await this.present(tx, actor, [g]);
        await this.audit(tx, actor, client, 'group.schedule_update', id, { schedule: before!.schedule }, { schedule: after!.schedule });
        return after!;
      }),
    );
  }

  // ----------------------------------------------------------------- ustozlar

  /** Ustoz faol, TEACHER roli va guruh filialiga biriktirilgan bo'lishi kerak. Bir vaqtda bitta asosiy ustoz. */
  assignTeacher(actor: AuthUser, id: string, input: AssignTeacherInput, client: ClientInfo) {
    return this.guard(() =>
      this.db.withContext(this.ctx(actor), async (tx) => {
        if (!(await this.perms.hasIn(tx, actor, 'group.edit'))) throw forbidden();
        const g = await this.load(tx, actor, await branchScope(tx, actor), id);
        if (g.archivedAt) throw conflict('GROUP_ARCHIVED', 'Arxivlangan guruhga ustoz biriktirib bo\'lmaydi');

        const [teacher] = await tx.select().from(users).where(and(eq(users.id, input.teacherId), eq(users.role, 'TEACHER')));
        if (!teacher) throw new NotFoundException({ code: 'TEACHER_NOT_FOUND', message: 'Ustoz topilmadi' });
        if (teacher.status !== 'ACTIVE') throw conflict('TEACHER_INACTIVE', 'Ustoz faol emas');
        const [link] = await tx
          .select({ branchId: userBranches.branchId })
          .from(userBranches)
          .where(and(eq(userBranches.userId, teacher.id), eq(userBranches.branchId, g.branchId)));
        if (!link) throw bad('TEACHER_NOT_IN_BRANCH', "Ustoz bu guruh filialiga biriktirilmagan");

        const active = await tx
          .select()
          .from(groupTeachers)
          .where(and(eq(groupTeachers.groupId, id), isNull(groupTeachers.toDate)));
        if (active.some((a) => a.teacherId === teacher.id)) throw conflict('TEACHER_ALREADY_ASSIGNED', 'Ustoz bu guruhga allaqachon biriktirilgan');
        if (input.kind === 'MAIN' && active.some((a) => a.kind === 'MAIN')) {
          throw conflict('MAIN_TEACHER_EXISTS', "Guruhda asosiy ustoz bor: avval uni olib tashlang");
        }

        await tx.insert(groupTeachers).values({
          groupId: id,
          teacherId: teacher.id,
          centerId: actor.centerId!,
          kind: input.kind,
          fromDate: input.fromDate ?? today(),
        });
        await this.audit(tx, actor, client, 'group.teacher_assign', id, undefined, { teacherId: teacher.id, kind: input.kind, fromDate: input.fromDate ?? today() });
        return (await this.present(tx, actor, [g]))[0]!;
      }),
    );
  }

  endTeacher(actor: AuthUser, id: string, teacherId: string, toDate: string | undefined, client: ClientInfo) {
    return this.guard(() =>
      this.db.withContext(this.ctx(actor), async (tx) => {
        if (!(await this.perms.hasIn(tx, actor, 'group.edit'))) throw forbidden();
        const g = await this.load(tx, actor, await branchScope(tx, actor), id);
        const [row] = await tx
          .select()
          .from(groupTeachers)
          .where(and(eq(groupTeachers.groupId, id), eq(groupTeachers.teacherId, teacherId), isNull(groupTeachers.toDate)));
        if (!row) throw new NotFoundException({ code: 'TEACHER_NOT_ASSIGNED', message: 'Ustoz bu guruhga biriktirilmagan' });
        const end = toDate ?? today();
        if (end < row.fromDate) throw bad('INVALID_DATES', "Tugash sanasi boshlanish sanasidan oldin bo'lishi mumkin emas");
        await tx
          .update(groupTeachers)
          .set({ toDate: end })
          .where(and(eq(groupTeachers.groupId, id), eq(groupTeachers.teacherId, teacherId), eq(groupTeachers.fromDate, row.fromDate)));
        await this.audit(tx, actor, client, 'group.teacher_end', id, { teacherId, kind: row.kind, fromDate: row.fromDate }, { toDate: end });
        return (await this.present(tx, actor, [g]))[0]!;
      }),
    );
  }

  // --------------------------------------------------------------- yordamchilar

  /** DB cheklov xatolarini (kutilmagan holatlar) tushunarli javobga aylantiradi. */
  private async guard<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      const { code, constraint } = pgErrorInfo(e);
      if (code === '23505') {
        if (constraint?.includes('groups_branch_name')) throw conflict('GROUP_NAME_TAKEN', 'Bu filialda shu nomli guruh bor');
        if (constraint?.includes('one_main')) throw conflict('MAIN_TEACHER_EXISTS', 'Guruhda asosiy ustoz bor: avval uni olib tashlang');
        if (constraint?.includes('group_teachers')) throw conflict('TEACHER_ALREADY_ASSIGNED', 'Bu ustoz shu sanada allaqachon biriktirilgan');
        throw conflict('ALREADY_EXISTS', 'Bunday yozuv allaqachon bor');
      }
      if (code === '23514') throw bad('INVALID_GROUP', "Guruh ma'lumotlari cheklovlarga mos emas");
      throw e;
    }
  }

  private assertDates(start: string | null | undefined, end: string | null | undefined) {
    if (start && end && end < start) throw bad('INVALID_DATES', "Tugash sanasi boshlanish sanasidan oldin bo'lishi mumkin emas");
  }

  /** To'lov kuni sukuti: boshlanish sanasining kuni (28 dan oshmasin), sana yo'q bo'lsa 1. */
  private dayOf(startDate: string | undefined): number {
    return startDate ? Math.min(Number(startDate.slice(8, 10)), 28) : 1;
  }

  private async assertBranch(tx: Tx, scope: BranchScope, branchId: string) {
    const [b] = await tx.select({ id: branches.id }).from(branches).where(and(eq(branches.id, branchId), isNull(branches.archivedAt)));
    if (!b) throw new NotFoundException({ code: 'BRANCH_NOT_FOUND', message: 'Filial topilmadi' });
    if (!inScope(scope, branchId)) throw forbidden("Bu filialda guruh ochish huquqingiz yo'q");
  }

  private async activeCourse(tx: Tx, courseId: string) {
    const [c] = await tx.select().from(courses).where(and(eq(courses.id, courseId), isNull(courses.archivedAt)));
    if (!c) throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: 'Kurs topilmadi' });
    return c;
  }

  /** Guruh: markaz ichida (RLS); rahbar bo'lmasa filial qamrovida, ustoz bo'lsa o'z guruhi; aks holda 404. */
  private async load(tx: Tx, actor: AuthUser, scope: BranchScope, id: string): Promise<GroupRow> {
    const [g] = await tx
      .select()
      .from(groups)
      .where(
        and(
          eq(groups.id, id),
          groupVisibility(tx, actor, scope),
        ),
      );
    if (!g) throw groupNotFound();
    return g;
  }

  private async insertSchedule(tx: Tx, actor: AuthUser, groupId: string, items: ScheduleItem[]) {
    await tx.insert(groupSchedules).values(
      items.map((i) => ({ groupId, centerId: actor.centerId!, weekday: i.weekday, startTime: i.startTime, endTime: i.endTime, room: i.room ?? null })),
    );
  }

  /** Kurs, filial nomi, jadval va amaldagi ustozlar bilan. Ustozga moliyaviy maydonlar (narx, sikl) ko'rsatilmaydi. */
  private async present(tx: Tx, actor: AuthUser, rows: GroupRow[]) {
    if (!rows.length) return [];
    const ids = rows.map((g) => g.id);
    const [courseRows, branchRows, scheduleRows, teacherRows, countRows] = await Promise.all([
      tx.select({ id: courses.id, name: courses.name }).from(courses).where(inArray(courses.id, [...new Set(rows.map((g) => g.courseId))])),
      tx.select({ id: branches.id, name: branches.name }).from(branches).where(inArray(branches.id, [...new Set(rows.map((g) => g.branchId))])),
      tx.select().from(groupSchedules).where(inArray(groupSchedules.groupId, ids)).orderBy(asc(groupSchedules.weekday), asc(groupSchedules.startTime)),
      tx
        .select({ groupId: groupTeachers.groupId, teacherId: groupTeachers.teacherId, kind: groupTeachers.kind, fromDate: groupTeachers.fromDate, toDate: groupTeachers.toDate, fullName: users.fullName })
        .from(groupTeachers)
        .innerJoin(users, eq(users.id, groupTeachers.teacherId))
        .where(and(inArray(groupTeachers.groupId, ids), currentTeacher()))
        .orderBy(asc(groupTeachers.kind), asc(users.fullName)),
      tx
        .select({ groupId: enrollments.groupId, n: count() })
        .from(enrollments)
        .where(and(inArray(enrollments.groupId, ids), sql`${enrollments.status} <> 'LEFT'`))
        .groupBy(enrollments.groupId),
    ]);
    const hideBilling = actor.role === 'TEACHER';
    return rows.map((g) => ({
      id: g.id,
      name: g.name,
      branchId: g.branchId,
      branchName: branchRows.find((b) => b.id === g.branchId)?.name ?? null,
      courseId: g.courseId,
      courseName: courseRows.find((c) => c.id === g.courseId)?.name ?? null,
      ...(hideBilling ? {} : { priceMonthly: g.priceMonthly, billingMode: g.billingMode, billingDay: g.billingDay, graceDays: g.graceDays }),
      startDate: g.startDate,
      endDate: g.endDate,
      status: g.status,
      archivedAt: g.archivedAt,
      createdAt: g.createdAt,
      ...(actor.role === 'STUDENT' ? {} : { studentCount: Number(countRows.find((c) => c.groupId === g.id)?.n ?? 0) }),
      schedule: scheduleRows
        .filter((s) => s.groupId === g.id)
        .map((s) => ({ id: s.id, weekday: s.weekday, startTime: s.startTime.slice(0, 5), endTime: s.endTime.slice(0, 5), room: s.room })),
      teachers: teacherRows
        .filter((t) => t.groupId === g.id)
        .map((t) => ({ teacherId: t.teacherId, fullName: t.fullName, kind: t.kind, fromDate: t.fromDate, toDate: t.toDate })),
    }));
  }

  private auditView(g: GroupRow) {
    return {
      name: g.name,
      courseId: g.courseId,
      branchId: g.branchId,
      priceMonthly: g.priceMonthly,
      billingMode: g.billingMode,
      billingDay: g.billingDay,
      graceDays: g.graceDays,
      startDate: g.startDate,
      endDate: g.endDate,
      status: g.status,
      archived: g.archivedAt !== null,
    };
  }

  private audit(tx: Tx, actor: AuthUser, client: ClientInfo, action: string, id: string, before: unknown, after: unknown) {
    return writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action, entity: 'group', entityId: id, before, after, ip: client.ip });
  }
}
