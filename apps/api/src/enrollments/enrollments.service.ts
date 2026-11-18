import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, inArray, type SQL } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { PermissionsService } from '../auth/permissions.service.js';
import { type BranchScope, branchFilter, branchScope, inScope } from '../common/branch-scope.js';
import { todayLocal } from '../common/dates.js';
import { teacherGroupIds } from '../common/group-access.js';
import { BillingService } from '../billing/billing.service.js';
import { pgErrorInfo } from '../common/pg-errors.js';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { branches, courses, enrollments, groups, userBranches, users } from '../db/schema.js';
import type {
  CreateEnrollmentInput,
  LeaveEnrollmentInput,
  ListEnrollmentsQuery,
  TransferEnrollmentInput,
} from './enrollments.schemas.js';

const forbidden = (message = "Bu amal uchun ruxsat yo'q") => new ForbiddenException({ code: 'FORBIDDEN', message });
const conflict = (code: string, message: string) => new ConflictException({ code, message });
const bad = (code: string, message: string) => new BadRequestException({ code, message });
const enrollmentNotFound = () => new NotFoundException({ code: 'ENROLLMENT_NOT_FOUND', message: 'Yozilish topilmadi' });
const groupNotFound = () => new NotFoundException({ code: 'GROUP_NOT_FOUND', message: 'Guruh topilmadi' });
const studentNotFound = () => new NotFoundException({ code: 'STUDENT_NOT_FOUND', message: "O'quvchi topilmadi" });
const today = todayLocal;

type EnrollmentRow = typeof enrollments.$inferSelect;
type GroupRow = typeof groups.$inferSelect;

/**
 * Yozilish: o'quvchining guruhdagi a'zoligi. Hech qachon o'chirilmaydi: chiqish yoki ko'chirish `LEFT` bilan yopiladi
 * (eski to'lov va davomat tarixi saqlanadi). Boshqarish `enrollment.manage` + filial qamrovi; ko'rish `group.view` + qamrov
 * (ustoz o'z guruhi, o'quvchi o'zi).
 */
@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly db: DbService,
    private readonly perms: PermissionsService,
    private readonly billing: BillingService,
  ) {}

  private ctx(actor: AuthUser) {
    return contextOf(actor.centerId, actor.role);
  }

  // ------------------------------------------------------------------ qo'shish

  create(actor: AuthUser, input: CreateEnrollmentInput, client: ClientInfo) {
    return this.guard(() =>
      this.db.withContext(this.ctx(actor), async (tx) => {
        await this.assertManage(tx, actor, input.priceOverride !== undefined);
        const scope = await branchScope(tx, actor);
        const group = await this.manageableGroup(tx, scope, input.groupId);
        const student = await this.manageableStudent(tx, scope, input.studentId);
        if (student.status !== 'ACTIVE') throw conflict('STUDENT_INACTIVE', "O'quvchi faol emas");

        const joinedAt = input.joinedAt ?? today();
        const [e] = await tx
          .insert(enrollments)
          .values({
            centerId: actor.centerId!,
            groupId: group.id,
            studentId: student.id,
            joinedAt,
            billingAnchor: group.billingMode === 'STUDENT_CYCLE' ? joinedAt : null,
            priceOverride: input.priceOverride ?? null,
            createdBy: actor.id,
          })
          .returning();
        await this.linkStudentToBranch(tx, actor, student.id, group.branchId);
        await this.billing.generate(tx, actor.centerId!, { enrollmentIds: [e!.id] }); // birinchi davr hisobi
        await this.audit(tx, actor, client, 'enrollment.create', e!.id, undefined, this.auditView(e!));
        return (await this.present(tx, actor, [e!]))[0]!;
      }),
    );
  }

  // --------------------------------------------------- muzlatish, chiqarish, ko'chirish

  freeze(actor: AuthUser, id: string, client: ClientInfo) {
    return this.transition(actor, id, client, 'enrollment.freeze', (e) => {
      if (e.status === 'FROZEN') throw conflict('ALREADY_FROZEN', 'Yozilish allaqachon muzlatilgan');
      if (e.status === 'LEFT') throw conflict('ALREADY_LEFT', 'Yozilish tugagan');
      return { status: 'FROZEN' };
    }, {
      // Muzlatishdan oldingi davrlar hisobdan tushib qolmasligi uchun avval shu kungacha hisoblanadi, keyin muzlatish davri ochiladi
      before: (tx, e) => this.billing.generate(tx, e.centerId, { enrollmentIds: [e.id] }).then(() => undefined),
      after: (tx, e) => this.billing.openFreeze(tx, e.centerId, e.id, today(), actor.id),
    });
  }

  unfreeze(actor: AuthUser, id: string, client: ClientInfo) {
    return this.transition(actor, id, client, 'enrollment.unfreeze', (e) => {
      if (e.status === 'LEFT') throw conflict('ALREADY_LEFT', 'Yozilish tugagan');
      if (e.status !== 'FROZEN') throw conflict('NOT_FROZEN', 'Yozilish muzlatilmagan');
      return { status: 'ACTIVE' };
    }, {
      after: async (tx, e) => {
        await this.billing.closeOpenFreezes(tx, { enrollmentIds: [e.id] }, today());
        await this.billing.generate(tx, e.centerId, { enrollmentIds: [e.id] }); // qaytgan kundan boshlangan davr
      },
    });
  }

  leave(actor: AuthUser, id: string, input: LeaveEnrollmentInput, client: ClientInfo) {
    return this.transition(actor, id, client, 'enrollment.leave', (e) => {
      if (e.status === 'LEFT') throw conflict('ALREADY_LEFT', 'Yozilish allaqachon tugagan');
      const leftAt = input.leftAt ?? (today() < e.joinedAt ? e.joinedAt : today());
      if (leftAt < e.joinedAt) throw bad('INVALID_DATES', "Chiqish sanasi yozilish sanasidan oldin bo'lishi mumkin emas");
      return { status: 'LEFT', leftAt, leftReason: input.reason ?? null };
    }, {
      before: async (tx, e, set) => {
        const leftAt = set.leftAt!;
        if (e.status === 'ACTIVE') await this.billing.generate(tx, e.centerId, { enrollmentIds: [e.id], leftAt });
        else await this.billing.closeOpenFreezes(tx, { enrollmentIds: [e.id] }, leftAt); // muzlatilgan holatda chiqdi
      },
    });
  }

  /** Eski yozilish `LEFT` bilan yopiladi, yangi guruhda yangi qator ochiladi (bitta tranzaksiya). */
  transfer(actor: AuthUser, id: string, input: TransferEnrollmentInput, client: ClientInfo) {
    return this.guard(() =>
      this.db.withContext(this.ctx(actor), async (tx) => {
        await this.assertManage(tx, actor, input.priceOverride !== undefined);
        const scope = await branchScope(tx, actor);
        const old = await this.manageableEnrollment(tx, scope, id);
        if (old.status === 'LEFT') throw conflict('ALREADY_LEFT', 'Yozilish tugagan');
        if (old.groupId === input.toGroupId) throw bad('SAME_GROUP', "O'quvchi allaqachon shu guruhda");
        const target = await this.manageableGroup(tx, scope, input.toGroupId);

        const date = input.transferDate ?? (today() < old.joinedAt ? old.joinedAt : today());
        if (date < old.joinedAt) throw bad('INVALID_DATES', "Ko'chirish sanasi yozilish sanasidan oldin bo'lishi mumkin emas");

        if (old.status === 'ACTIVE') await this.billing.generate(tx, actor.centerId!, { enrollmentIds: [old.id], leftAt: date });
        else await this.billing.closeOpenFreezes(tx, { enrollmentIds: [old.id] }, date);
        const [closed] = await tx
          .update(enrollments)
          .set({ status: 'LEFT', leftAt: date, leftReason: input.reason ? `TRANSFER: ${input.reason}` : 'TRANSFER', updatedAt: new Date() })
          .where(eq(enrollments.id, id))
          .returning();
        const [opened] = await tx
          .insert(enrollments)
          .values({
            centerId: actor.centerId!,
            groupId: target.id,
            studentId: old.studentId,
            joinedAt: date,
            billingAnchor: target.billingMode === 'STUDENT_CYCLE' ? date : null,
            priceOverride: input.priceOverride ?? null,
            createdBy: actor.id,
          })
          .returning();
        await this.linkStudentToBranch(tx, actor, old.studentId, target.branchId);
        await this.billing.generate(tx, actor.centerId!, { enrollmentIds: [opened!.id] });
        await this.audit(tx, actor, client, 'enrollment.transfer', id, this.auditView(old), { from: this.auditView(closed!), toEnrollmentId: opened!.id, to: this.auditView(opened!) });
        const [from, to] = await this.present(tx, actor, [closed!, opened!]);
        return { from: from!, to: to! };
      }),
    );
  }

  // ------------------------------------------------------------ ro'yxat va ko'rish

  list(actor: AuthUser, q: ListEnrollmentsQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'group.view'))) throw forbidden();
      const scope = await branchScope(tx, actor);
      const empty = { items: [], limit: q.limit, offset: q.offset };
      if (q.branchId && actor.role !== 'TEACHER' && actor.role !== 'STUDENT' && !inScope(scope, q.branchId)) return empty;

      const conds: (SQL | undefined)[] = [
        this.visibility(tx, actor, scope),
        q.groupId ? eq(enrollments.groupId, q.groupId) : undefined,
        q.studentId ? eq(enrollments.studentId, q.studentId) : undefined,
        q.status ? eq(enrollments.status, q.status) : undefined,
        q.branchId ? inArray(enrollments.groupId, tx.select({ id: groups.id }).from(groups).where(eq(groups.branchId, q.branchId))) : undefined,
      ];
      const rows = await tx
        .select()
        .from(enrollments)
        .where(and(...conds))
        .orderBy(desc(enrollments.joinedAt), desc(enrollments.createdAt), desc(enrollments.id))
        .limit(q.limit)
        .offset(q.offset);
      return { items: await this.present(tx, actor, rows), limit: q.limit, offset: q.offset };
    });
  }

  get(actor: AuthUser, id: string) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'group.view'))) throw forbidden();
      const scope = await branchScope(tx, actor);
      const [e] = await tx
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.id, id), this.visibility(tx, actor, scope)));
      if (!e) throw enrollmentNotFound();
      return (await this.present(tx, actor, [e]))[0]!;
    });
  }

  // ---------------------------------------------------------------- yordamchilar

  /** Holat o'tishi: ruxsat, qamrov, yozilishni yuklash, `change` qoidasi, yangilash va audit bitta tranzaksiyada. */
  private transition(
    actor: AuthUser,
    id: string,
    client: ClientInfo,
    action: string,
    change: (e: EnrollmentRow) => Partial<typeof enrollments.$inferInsert>,
    hooks?: {
      /** Holat o'zgargunga qadar (yangi qiymatlar `set` da). */
      before?: (tx: Tx, e: EnrollmentRow, set: Partial<typeof enrollments.$inferInsert>) => Promise<unknown>;
      after?: (tx: Tx, e: EnrollmentRow) => Promise<unknown>;
    },
  ) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      await this.assertManage(tx, actor, false);
      const before = await this.manageableEnrollment(tx, await branchScope(tx, actor), id);
      const set = change(before);
      await hooks?.before?.(tx, before, set);
      const [after] = await tx
        .update(enrollments)
        .set({ ...set, updatedAt: new Date() })
        .where(eq(enrollments.id, id))
        .returning();
      await hooks?.after?.(tx, after!);
      await this.audit(tx, actor, client, action, id, this.auditView(before), this.auditView(after!));
      return (await this.present(tx, actor, [after!]))[0]!;
    });
  }

  private async assertManage(tx: Tx, actor: AuthUser, touchesPrice: boolean) {
    if (!(await this.perms.hasIn(tx, actor, 'enrollment.manage'))) throw forbidden();
    if (touchesPrice && !(await this.perms.hasIn(tx, actor, 'group.billing_settings'))) {
      throw forbidden("Individual narxni belgilash huquqingiz yo'q");
    }
  }

  /** Yozilishlarni ko'rish qamrovi: rahbar hammasi; admin/kassir guruh filiali bo'yicha; ustoz o'z guruhlari; o'quvchi o'zi. */
  private visibility(tx: Tx, actor: AuthUser, scope: BranchScope): SQL | undefined {
    if (actor.role === 'STUDENT') return eq(enrollments.studentId, actor.id);
    if (actor.role === 'TEACHER') return inArray(enrollments.groupId, teacherGroupIds(tx, actor.id));
    if (scope.all) return undefined;
    return inArray(enrollments.groupId, tx.select({ id: groups.id }).from(groups).where(branchFilter(groups.branchId, scope)));
  }

  /** Boshqariladigan yozilish: markaz ichida (RLS) va guruhi filial qamrovida; aks holda 404. */
  private async manageableEnrollment(tx: Tx, scope: BranchScope, id: string): Promise<EnrollmentRow> {
    const [e] = await tx
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.id, id), scope.all ? undefined : inArray(enrollments.groupId, tx.select({ id: groups.id }).from(groups).where(branchFilter(groups.branchId, scope)))));
    if (!e) throw enrollmentNotFound();
    return e;
  }

  /** Guruh qamrovda, arxivlanmagan va tugallanmagan bo'lishi kerak. */
  private async manageableGroup(tx: Tx, scope: BranchScope, id: string): Promise<GroupRow> {
    const [g] = await tx.select().from(groups).where(and(eq(groups.id, id), branchFilter(groups.branchId, scope)));
    if (!g) throw groupNotFound();
    if (g.archivedAt) throw conflict('GROUP_ARCHIVED', 'Guruh arxivlangan');
    if (g.status === 'FINISHED') throw conflict('GROUP_FINISHED', 'Guruh tugagan');
    return g;
  }

  /** O'quvchi: markaz ichida (RLS), STUDENT roli va (rahbar bo'lmasa) qamrovdagi filialda; aks holda 404. */
  private async manageableStudent(tx: Tx, scope: BranchScope, id: string) {
    const [s] = await tx.select().from(users).where(and(eq(users.id, id), eq(users.role, 'STUDENT')));
    if (!s) throw studentNotFound();
    if (!scope.all) {
      const links = await tx.select({ branchId: userBranches.branchId }).from(userBranches).where(eq(userBranches.userId, id));
      if (!links.some((l) => inScope(scope, l.branchId))) throw studentNotFound();
    }
    return s;
  }

  /** O'quvchi boshqa filial guruhiga yozilsa, o'sha filial unga avtomatik biriktiriladi. */
  private async linkStudentToBranch(tx: Tx, actor: AuthUser, studentId: string, branchId: string) {
    await tx.insert(userBranches).values({ userId: studentId, branchId, centerId: actor.centerId! }).onConflictDoNothing();
  }

  private async guard<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      const { code, constraint } = pgErrorInfo(e);
      if (code === '23505' && constraint?.includes('enrollments_open')) throw conflict('ALREADY_ENROLLED', "O'quvchi bu guruhga allaqachon yozilgan");
      if (code === '23514') throw bad('INVALID_ENROLLMENT', "Yozilish ma'lumotlari cheklovlarga mos emas");
      throw e;
    }
  }

  /** Guruh va o'quvchi nomlari bilan. Ustozga individual narx ko'rsatilmaydi. */
  private async present(tx: Tx, actor: AuthUser, rows: EnrollmentRow[]) {
    if (!rows.length) return [];
    const [studentRows, groupRows] = await Promise.all([
      tx.select({ id: users.id, fullName: users.fullName }).from(users).where(inArray(users.id, [...new Set(rows.map((e) => e.studentId))])),
      tx
        .select({ id: groups.id, name: groups.name, branchId: groups.branchId, courseId: groups.courseId, branchName: branches.name, courseName: courses.name })
        .from(groups)
        .innerJoin(branches, eq(branches.id, groups.branchId))
        .innerJoin(courses, eq(courses.id, groups.courseId))
        .where(inArray(groups.id, [...new Set(rows.map((e) => e.groupId))])),
    ]);
    return rows.map((e) => {
      const g = groupRows.find((x) => x.id === e.groupId);
      return {
        id: e.id,
        groupId: e.groupId,
        groupName: g?.name ?? null,
        branchId: g?.branchId ?? null,
        branchName: g?.branchName ?? null,
        courseName: g?.courseName ?? null,
        studentId: e.studentId,
        studentName: studentRows.find((s) => s.id === e.studentId)?.fullName ?? null,
        status: e.status,
        joinedAt: e.joinedAt,
        leftAt: e.leftAt,
        leftReason: e.leftReason,
        billingAnchor: e.billingAnchor,
        ...(actor.role === 'TEACHER' ? {} : { priceOverride: e.priceOverride }),
        createdAt: e.createdAt,
      };
    });
  }

  private auditView(e: EnrollmentRow) {
    return { groupId: e.groupId, studentId: e.studentId, status: e.status, joinedAt: e.joinedAt, leftAt: e.leftAt, leftReason: e.leftReason, billingAnchor: e.billingAnchor, priceOverride: e.priceOverride };
  }

  private audit(tx: Tx, actor: AuthUser, client: ClientInfo, action: string, id: string, before: unknown, after: unknown) {
    return writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action, entity: 'enrollment', entityId: id, before, after, ip: client.ip });
  }
}
