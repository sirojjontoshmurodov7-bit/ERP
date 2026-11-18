import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, eq, ilike, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { hashPassword } from '../auth/password.js';
import { PermissionsService } from '../auth/permissions.service.js';
import { generateTempPassword } from '../auth/temp-password.js';
import { type BranchScope, branchScope, inScope } from '../common/branch-scope.js';
import { todayLocal } from '../common/dates.js';
import { BillingService } from '../billing/billing.service.js';
import { teacherStudentIds } from '../common/group-access.js';
import { generateLogin, isLoginConflict, MAX_LOGIN_TRIES } from '../common/login.js';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { branches, centers, enrollments, plans, sessions, studentProfiles, userBranches, users } from '../db/schema.js';
import type { CreateStudentInput, ListStudentsQuery, UpdateStudentInput } from './students.schemas.js';

const forbidden = (message = "Bu amal uchun ruxsat yo'q") => new ForbiddenException({ code: 'FORBIDDEN', message });
const notFound = () => new NotFoundException({ code: 'STUDENT_NOT_FOUND', message: "O'quvchi topilmadi" });
const branchNotFound = () => new NotFoundException({ code: 'BRANCH_NOT_FOUND', message: 'Filial topilmadi' });

type UserRow = typeof users.$inferSelect;
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

@Injectable()
export class StudentsService {
  constructor(
    private readonly db: DbService,
    private readonly perms: PermissionsService,
    private readonly billing: BillingService,
  ) {}

  private ctx(actor: AuthUser) {
    return contextOf(actor.centerId, actor.role);
  }

  /** O'quvchi yaratish: akkaunt (vaqtinchalik parol bir marta), profil va birinchi filial biriktirilishi bitta tranzaksiyada. */
  async create(actor: AuthUser, input: CreateStudentInput, client: ClientInfo) {
    const temporaryPassword = generateTempPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    for (let attempt = 1; attempt <= MAX_LOGIN_TRIES; attempt++) {
      try {
        return await this.db.withContext(this.ctx(actor), async (tx) => {
          if (!(await this.perms.hasIn(tx, actor, 'student.create'))) throw forbidden();
          const scope = await branchScope(tx, actor);
          await this.assertBranch(tx, scope, input.branchId);
          await this.assertWithinPlanLimit(tx, actor.centerId!);

          const loginName = input.login ?? (await generateLogin(tx, actor.centerId!, input.fullName, attempt, 'oquvchi'));
          const [user] = await tx
            .insert(users)
            .values({
              centerId: actor.centerId!,
              role: 'STUDENT',
              login: loginName,
              passwordHash,
              mustChangePassword: true,
              fullName: input.fullName,
              phone: input.phone ?? null,
              createdBy: actor.id,
            })
            .returning();
          await tx.insert(userBranches).values({ userId: user!.id, branchId: input.branchId, centerId: actor.centerId! });
          await tx.insert(studentProfiles).values({
            userId: user!.id,
            centerId: actor.centerId!,
            birthDate: input.birthDate ?? null,
            parentName: input.parentName ?? null,
            parentPhone: input.parentPhone ?? null,
            note: input.note ?? null,
          });
          await writeAudit(tx, {
            centerId: actor.centerId,
            actorId: actor.id,
            action: 'student.create',
            entity: 'student',
            entityId: user!.id,
            after: { login: loginName, fullName: input.fullName, branchId: input.branchId }, // parolsiz
            ip: client.ip,
          });
          const [item] = await this.present(tx, [user!], scope);
          return { student: item!, temporaryPassword };
        });
      } catch (e) {
        if (!isLoginConflict(e)) throw e;
        if (input.login || attempt === MAX_LOGIN_TRIES) {
          throw new ConflictException({ code: 'LOGIN_TAKEN', message: 'Bu login band, boshqasini kiriting' });
        }
      }
    }
    throw new ConflictException({ code: 'LOGIN_TAKEN', message: 'Bu login band, boshqasini kiriting' });
  }

  list(actor: AuthUser, query: ListStudentsQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'student.view'))) throw forbidden();
      const scope = await branchScope(tx, actor);
      const empty = { items: [], limit: query.limit, offset: query.offset };
      if (query.branchId && actor.role !== 'TEACHER' && !inScope(scope, query.branchId)) return empty;

      const conds: (SQL | undefined)[] = [eq(users.role, 'STUDENT')];
      if (query.status) conds.push(eq(users.status, query.status));
      if (query.q) {
        const like = `%${escapeLike(query.q)}%`;
        conds.push(or(ilike(users.fullName, like), ilike(users.login, like), ilike(users.phone, like)));
      }
      if (actor.role === 'TEACHER') {
        // Ustoz faqat o'z guruhlaridagi (tugallanmagan yozilishli) o'quvchilarni ko'radi
        conds.push(inArray(users.id, teacherStudentIds(tx, actor.id)));
        if (query.branchId) conds.push(inArray(users.id, tx.select({ id: userBranches.userId }).from(userBranches).where(eq(userBranches.branchId, query.branchId))));
      } else if (query.branchId) {
        conds.push(inArray(users.id, tx.select({ id: userBranches.userId }).from(userBranches).where(eq(userBranches.branchId, query.branchId))));
      } else if (!scope.all) {
        if (!scope.branchIds.length) return empty;
        conds.push(inArray(users.id, tx.select({ id: userBranches.userId }).from(userBranches).where(inArray(userBranches.branchId, scope.branchIds))));
      }
      const rows = await tx
        .select()
        .from(users)
        .where(and(...conds))
        .orderBy(asc(users.fullName), asc(users.id))
        .limit(query.limit)
        .offset(query.offset);
      return { items: await this.present(tx, rows, scope), limit: query.limit, offset: query.offset };
    });
  }

  /** O'quvchi faqat o'zini ko'radi (`student.view`: o); xodim ruxsat va filial qamrovi bo'yicha. */
  get(actor: AuthUser, id: string) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'student.view'))) throw forbidden();
      const scope = await branchScope(tx, actor);
      const user =
        actor.role === 'STUDENT' ? await this.loadSelf(tx, actor, id) : actor.role === 'TEACHER' ? await this.loadForTeacher(tx, actor, id) : await this.loadTarget(tx, scope, id);
      const [item] = await this.present(tx, [user], scope);
      return item!;
    });
  }

  update(actor: AuthUser, id: string, patch: UpdateStudentInput, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'student.edit'))) throw forbidden();
      const scope = await branchScope(tx, actor);
      const target = await this.loadTarget(tx, scope, id);
      const [before] = await this.present(tx, [target], scope);

      const set: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
      if (patch.fullName !== undefined) set.fullName = patch.fullName;
      if (patch.phone !== undefined) set.phone = patch.phone;
      await tx.update(users).set(set).where(eq(users.id, id));

      const profile: Partial<typeof studentProfiles.$inferInsert> = {};
      if (patch.birthDate !== undefined) profile.birthDate = patch.birthDate;
      if (patch.parentName !== undefined) profile.parentName = patch.parentName;
      if (patch.parentPhone !== undefined) profile.parentPhone = patch.parentPhone;
      if (patch.note !== undefined) profile.note = patch.note;
      if (Object.keys(profile).length) {
        await tx
          .insert(studentProfiles)
          .values({ userId: id, centerId: actor.centerId!, ...profile })
          .onConflictDoUpdate({ target: studentProfiles.userId, set: profile });
      }

      const [fresh] = await tx.select().from(users).where(eq(users.id, id));
      const [after] = await this.present(tx, [fresh!], scope);
      await writeAudit(tx, {
        centerId: actor.centerId,
        actorId: actor.id,
        action: 'student.edit',
        entity: 'student',
        entityId: id,
        before: this.auditView(before!),
        after: this.auditView(after!),
        ip: client.ip,
      });
      return after!;
    });
  }

  /** Arxivlash yumshoq o'chirish: akkaunt yopiladi (sessiyalar bekor), ma'lumot saqlanadi. */
  archive(actor: AuthUser, id: string, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'student.archive'))) throw forbidden();
      const scope = await branchScope(tx, actor);
      const target = await this.loadTarget(tx, scope, id);
      if (target.status === 'ARCHIVED') throw new ConflictException({ code: 'ALREADY_ARCHIVED', message: "O'quvchi allaqachon arxivlangan" });
      const now = new Date();
      await tx.update(users).set({ status: 'ARCHIVED', updatedAt: now }).where(eq(users.id, id));
      await tx.update(sessions).set({ revokedAt: now }).where(and(eq(sessions.userId, id), isNull(sessions.revokedAt)));
      // Yozilishlar yopilishidan oldin shu kungacha hisob-kitob yaratiladi va muzlatishlar yopiladi
      await this.billing.generate(tx, actor.centerId!, { studentId: id, leftAt: todayLocal() });
      await this.billing.closeOpenFreezes(tx, { studentId: id }, todayLocal());
      // Arxivlangan o'quvchining tugallanmagan yozilishlari yopiladi (tarix saqlanadi; qarz ma'lumoti hisob-kitobda qoladi)
      const closed = await tx
        .update(enrollments)
        .set({ status: 'LEFT', leftAt: sql`greatest(${enrollments.joinedAt}, ${todayLocal()}::date)`, leftReason: 'STUDENT_ARCHIVED', updatedAt: now })
        .where(and(eq(enrollments.studentId, id), sql`${enrollments.status} <> 'LEFT'`))
        .returning({ id: enrollments.id });
      await writeAudit(tx, {
        centerId: actor.centerId,
        actorId: actor.id,
        action: 'student.archive',
        entity: 'student',
        entityId: id,
        before: { status: target.status },
        after: { status: 'ARCHIVED', closedEnrollments: closed.length },
        ip: client.ip,
      });
      const [fresh] = await tx.select().from(users).where(eq(users.id, id));
      return (await this.present(tx, [fresh!], scope))[0]!;
    });
  }

  unarchive(actor: AuthUser, id: string, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'student.archive'))) throw forbidden();
      const scope = await branchScope(tx, actor);
      const target = await this.loadTarget(tx, scope, id);
      if (target.status !== 'ARCHIVED') throw new ConflictException({ code: 'NOT_ARCHIVED', message: "O'quvchi arxivlanmagan" });
      await this.assertWithinPlanLimit(tx, actor.centerId!);
      await tx.update(users).set({ status: 'ACTIVE', updatedAt: new Date() }).where(eq(users.id, id));
      await writeAudit(tx, {
        centerId: actor.centerId,
        actorId: actor.id,
        action: 'student.unarchive',
        entity: 'student',
        entityId: id,
        before: { status: 'ARCHIVED' },
        after: { status: 'ACTIVE' },
        ip: client.ip,
      });
      const [fresh] = await tx.select().from(users).where(eq(users.id, id));
      return (await this.present(tx, [fresh!], scope))[0]!;
    });
  }

  // --- yordamchilar ---

  /** Tarifda `max_students` bo'lsa faol o'quvchilar soni undan oshmasligi kerak; tarif yo'q yoki NULL = cheksiz. */
  private async assertWithinPlanLimit(tx: Tx, centerId: string) {
    const [row] = await tx.select({ max: plans.maxStudents }).from(centers).leftJoin(plans, eq(plans.id, centers.planId)).where(eq(centers.id, centerId));
    const max = row?.max;
    if (max === null || max === undefined) return;
    const [{ active } = { active: 0 }] = await tx.select({ active: count() }).from(users).where(and(eq(users.role, 'STUDENT'), eq(users.status, 'ACTIVE')));
    if (Number(active) >= max) {
      throw new ForbiddenException({ code: 'PLAN_STUDENT_LIMIT', message: `Tarifingizda ${max} tagacha faol o'quvchi mumkin` });
    }
  }

  private async assertBranch(tx: Tx, scope: BranchScope, branchId: string) {
    const [b] = await tx.select({ id: branches.id }).from(branches).where(and(eq(branches.id, branchId), isNull(branches.archivedAt)));
    if (!b) throw branchNotFound();
    if (!inScope(scope, branchId)) throw forbidden("Bu filialga o'quvchi qo'shish huquqingiz yo'q");
  }

  /** O'quvchi: markaz ichida (RLS), role=STUDENT va (rahbar bo'lmasa) qamrovdagi filialda; aks holda 404. */
  private async loadTarget(tx: Tx, scope: BranchScope, id: string): Promise<UserRow> {
    const [user] = await tx.select().from(users).where(and(eq(users.id, id), eq(users.role, 'STUDENT')));
    if (!user) throw notFound();
    if (!scope.all) {
      const links = await tx.select({ branchId: userBranches.branchId }).from(userBranches).where(eq(userBranches.userId, id));
      if (!links.some((l) => inScope(scope, l.branchId))) throw notFound();
    }
    return user;
  }

  /** Ustoz: o'quvchi uning amaldagi guruhida tugallanmagan yozilishga ega bo'lsa; aks holda 404. */
  private async loadForTeacher(tx: Tx, actor: AuthUser, id: string): Promise<UserRow> {
    const [user] = await tx
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, 'STUDENT'), inArray(users.id, teacherStudentIds(tx, actor.id))));
    if (!user) throw notFound();
    return user;
  }

  private async loadSelf(tx: Tx, actor: AuthUser, id: string): Promise<UserRow> {
    if (id !== actor.id) throw notFound(); // boshqa o'quvchining mavjudligi sezilmasin
    const [user] = await tx.select().from(users).where(eq(users.id, id));
    if (!user) throw notFound();
    return user;
  }

  private async present(tx: Tx, rows: UserRow[], scope: BranchScope) {
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);
    const links = await tx.select({ userId: userBranches.userId, branchId: userBranches.branchId }).from(userBranches).where(inArray(userBranches.userId, ids));
    const profiles = await tx.select().from(studentProfiles).where(inArray(studentProfiles.userId, ids));
    return rows.map((u) => {
      const p = profiles.find((x) => x.userId === u.id);
      const branchIds = links.filter((l) => l.userId === u.id).map((l) => l.branchId);
      return {
        id: u.id,
        login: u.login,
        fullName: u.fullName,
        phone: u.phone,
        status: u.status,
        mustChangePassword: u.mustChangePassword,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        branchIds: scope.all ? branchIds : branchIds.filter((b) => inScope(scope, b)),
        birthDate: p?.birthDate ?? null,
        parentName: p?.parentName ?? null,
        parentPhone: p?.parentPhone ?? null,
        note: p?.note ?? null,
      };
    });
  }

  private auditView(v: { fullName: string; phone: string | null; birthDate: string | null; parentName: string | null; parentPhone: string | null; note: string | null }) {
    return { fullName: v.fullName, phone: v.phone, birthDate: v.birthDate, parentName: v.parentName, parentPhone: v.parentPhone, note: v.note };
  }
}
