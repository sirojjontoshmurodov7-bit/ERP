import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, inArray, isNull, type SQL } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { hashPassword } from '../auth/password.js';
import { PermissionsService } from '../auth/permissions.service.js';
import { generateTempPassword } from '../auth/temp-password.js';
import { type BranchScope, branchScope, inScope } from '../common/branch-scope.js';
import { generateLogin, isLoginConflict, MAX_LOGIN_TRIES } from '../common/login.js';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { branches, sessions, teacherProfiles, userBranches, users } from '../db/schema.js';
import type { CreateStaffInput, ListStaffQuery, StaffRole, UpdateStaffInput } from './users.schemas.js';

const forbidden = (message = "Bu amal uchun ruxsat yo'q") => new ForbiddenException({ code: 'FORBIDDEN', message });
const userNotFound = () => new NotFoundException({ code: 'USER_NOT_FOUND', message: 'Foydalanuvchi topilmadi' });
const branchNotFound = () => new NotFoundException({ code: 'BRANCH_NOT_FOUND', message: 'Filial topilmadi' });

/** Rahbar admin, kassir va ustozni; admin faqat ustozni boshqaradi (ERD 4-bo'lim). */
const manageableRoles = (actor: AuthUser): readonly StaffRole[] => (actor.role === 'OWNER' ? ['ADMIN', 'CASHIER', 'TEACHER'] : ['TEACHER']);
const createCode = (role: StaffRole) => (role === 'TEACHER' ? 'teacher.create' : 'staff.create');
const editCode = (role: string) => (role === 'TEACHER' ? 'teacher.edit' : 'staff.create');

type UserRow = typeof users.$inferSelect;

@Injectable()
export class UsersService {
  constructor(
    private readonly db: DbService,
    private readonly perms: PermissionsService,
  ) {}

  private ctx(actor: AuthUser) {
    return contextOf(actor.centerId, actor.role);
  }

  /** Xodim yaratish. Login berilmasa `markaz-slug.ism` (band bo'lsa 2, 3, ... qo'shiladi). Parol javobda bir marta. */
  async create(actor: AuthUser, input: CreateStaffInput, client: ClientInfo) {
    if (!manageableRoles(actor).includes(input.role)) throw forbidden();
    const temporaryPassword = generateTempPassword();
    const passwordHash = await hashPassword(temporaryPassword);
    const branchIds = [...new Set(input.branchIds)];

    for (let attempt = 1; attempt <= MAX_LOGIN_TRIES; attempt++) {
      try {
        return await this.db.withContext(this.ctx(actor), async (tx) => {
          if (!(await this.perms.hasIn(tx, actor, createCode(input.role)))) throw forbidden();
          const scope = await branchScope(tx, actor);
          await this.assertBranches(tx, scope, branchIds);

          const loginName = input.login ?? (await generateLogin(tx, actor.centerId!, input.fullName, attempt));
          const [user] = await tx
            .insert(users)
            .values({
              centerId: actor.centerId!,
              role: input.role,
              login: loginName,
              passwordHash,
              mustChangePassword: true,
              fullName: input.fullName,
              phone: input.phone ?? null,
              createdBy: actor.id,
            })
            .returning();
          await tx.insert(userBranches).values(branchIds.map((branchId) => ({ userId: user!.id, branchId, centerId: actor.centerId! })));
          if (input.role === 'TEACHER') {
            await tx.insert(teacherProfiles).values({
              userId: user!.id,
              centerId: actor.centerId!,
              specialization: input.specialization ?? null,
              note: input.note ?? null,
            });
          }
          await writeAudit(tx, {
            centerId: actor.centerId,
            actorId: actor.id,
            action: input.role === 'TEACHER' ? 'teacher.create' : 'staff.create',
            entity: 'user',
            entityId: user!.id,
            after: { login: loginName, fullName: input.fullName, role: input.role, branchIds }, // parolsiz
            ip: client.ip,
          });
          return {
            user: { id: user!.id, login: loginName, fullName: user!.fullName, role: input.role, branchIds },
            temporaryPassword,
          };
        });
      } catch (e) {
        if (!isLoginConflict(e)) throw e;
        if (input.login || attempt === MAX_LOGIN_TRIES) {
          throw new ConflictException({ code: 'LOGIN_TAKEN', message: 'Bu login band, boshqasini kiriting' });
        }
        // avtomatik login band: keyingi nomzod bilan qayta urinamiz
      }
    }
    throw new ConflictException({ code: 'LOGIN_TAKEN', message: 'Bu login band, boshqasini kiriting' });
  }

  async list(actor: AuthUser, query: ListStaffQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      const scope = await branchScope(tx, actor);
      const allowed = manageableRoles(actor);
      if (query.role && !allowed.includes(query.role)) return { items: [], limit: query.limit, offset: query.offset };
      if (query.branchId && !inScope(scope, query.branchId)) return { items: [], limit: query.limit, offset: query.offset };

      const conds: (SQL | undefined)[] = [inArray(users.role, query.role ? [query.role] : [...allowed])];
      if (query.status) conds.push(eq(users.status, query.status));
      if (query.branchId) {
        conds.push(inArray(users.id, tx.select({ id: userBranches.userId }).from(userBranches).where(eq(userBranches.branchId, query.branchId))));
      } else if (!scope.all) {
        conds.push(
          inArray(
            users.id,
            tx
              .select({ id: userBranches.userId })
              .from(userBranches)
              .where(scope.branchIds.length ? inArray(userBranches.branchId, scope.branchIds) : undefined),
          ),
        );
        if (!scope.branchIds.length) return { items: [], limit: query.limit, offset: query.offset };
      }
      const rows = await tx
        .select()
        .from(users)
        .where(and(...conds))
        .orderBy(asc(users.createdAt))
        .limit(query.limit)
        .offset(query.offset);
      return { items: await this.present(tx, rows, scope), limit: query.limit, offset: query.offset };
    });
  }

  async get(actor: AuthUser, id: string) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      const scope = await branchScope(tx, actor);
      const user = await this.loadTarget(tx, actor, scope, id, manageableRoles(actor));
      const [item] = await this.present(tx, [user], scope);
      return item!;
    });
  }

  async update(actor: AuthUser, id: string, patch: UpdateStaffInput, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      const scope = await branchScope(tx, actor);
      const target = await this.loadTarget(tx, actor, scope, id, manageableRoles(actor));
      if (!(await this.perms.hasIn(tx, actor, editCode(target.role)))) throw forbidden();
      if ((patch.branchIds !== undefined || patch.status !== undefined) && actor.role !== 'OWNER') {
        throw forbidden("Filial biriktirish va holatni faqat rahbar o'zgartiradi");
      }
      const isTeacher = target.role === 'TEACHER';
      if (!isTeacher && (patch.specialization !== undefined || patch.note !== undefined)) {
        throw new BadRequestException({ code: 'NOT_A_TEACHER', message: "Mutaxassislik va izoh faqat ustoz uchun" });
      }

      const [beforeView] = await this.present(tx, [target], scope);
      const set: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
      if (patch.fullName !== undefined) set.fullName = patch.fullName;
      if (patch.phone !== undefined) set.phone = patch.phone;
      if (patch.status !== undefined) set.status = patch.status;
      await tx.update(users).set(set).where(eq(users.id, id));

      if (patch.branchIds) {
        const ids = [...new Set(patch.branchIds)];
        await this.assertBranches(tx, scope, ids);
        await tx.delete(userBranches).where(eq(userBranches.userId, id));
        await tx.insert(userBranches).values(ids.map((branchId) => ({ userId: id, branchId, centerId: actor.centerId! })));
      }
      if (isTeacher && (patch.specialization !== undefined || patch.note !== undefined)) {
        const profile: Partial<typeof teacherProfiles.$inferInsert> = {};
        if (patch.specialization !== undefined) profile.specialization = patch.specialization;
        if (patch.note !== undefined) profile.note = patch.note;
        await tx
          .insert(teacherProfiles)
          .values({ userId: id, centerId: actor.centerId!, ...profile })
          .onConflictDoUpdate({ target: teacherProfiles.userId, set: profile });
      }
      if (patch.status === 'SUSPENDED') {
        await tx.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, id), isNull(sessions.revokedAt)));
      }

      const [fresh] = await tx.select().from(users).where(eq(users.id, id));
      const [afterView] = await this.present(tx, [fresh!], scope);
      await writeAudit(tx, {
        centerId: actor.centerId,
        actorId: actor.id,
        action: patch.status === 'SUSPENDED' ? 'user.suspend' : patch.status === 'ACTIVE' && target.status !== 'ACTIVE' ? 'user.activate' : `${isTeacher ? 'teacher' : 'staff'}.edit`,
        entity: 'user',
        entityId: id,
        before: this.auditView(beforeView!),
        after: this.auditView(afterView!),
        ip: client.ip,
      });
      return afterView!;
    });
  }

  /**
   * Parolni tiklash (ERD 4-bo'lim): rahbar -> hamma quyi rol; admin -> o'z filialidagi ustoz/o'quvchi.
   * Rahbar parolini faqat super admin tiklaydi. Eski sessiyalar yopiladi, majburiy almashtirish qaytadi.
   */
  async resetPassword(actor: AuthUser, id: string, client: ClientInfo) {
    if (id === actor.id) {
      throw new BadRequestException({ code: 'USE_CHANGE_PASSWORD', message: "O'z parolingizni almashtirish uchun parol almashtirish amalidan foydalaning" });
    }
    const temporaryPassword = generateTempPassword();
    const passwordHash = await hashPassword(temporaryPassword);
    return this.db.withContext(this.ctx(actor), async (tx) => {
      const scope = await branchScope(tx, actor);
      const roles = actor.role === 'OWNER' ? (['ADMIN', 'CASHIER', 'TEACHER', 'STUDENT'] as const) : (['TEACHER', 'STUDENT'] as const);
      const target = await this.loadTarget(tx, actor, scope, id, roles);
      const now = new Date();
      await tx.update(users).set({ passwordHash, mustChangePassword: true, updatedAt: now }).where(eq(users.id, id));
      await tx.update(sessions).set({ revokedAt: now }).where(and(eq(sessions.userId, id), isNull(sessions.revokedAt)));
      await writeAudit(tx, {
        centerId: actor.centerId,
        actorId: actor.id,
        action: 'user.reset_password',
        entity: 'user',
        entityId: id,
        ip: client.ip,
      });
      return { user: { id: target.id, login: target.login, fullName: target.fullName, role: target.role }, temporaryPassword };
    });
  }

  // --- yordamchilar ---

  /** Maqsad foydalanuvchi: markaz ichida (RLS), ruxsat etilgan rollardan va (rahbar bo'lmasa) qamrovdagi filialda; aks holda 404. */
  private async loadTarget(tx: Tx, actor: AuthUser, scope: BranchScope, id: string, roles: readonly string[]): Promise<UserRow> {
    const [user] = await tx.select().from(users).where(and(eq(users.id, id), inArray(users.role, [...roles])));
    if (!user) throw userNotFound();
    if (!scope.all) {
      const links = await tx.select({ branchId: userBranches.branchId }).from(userBranches).where(eq(userBranches.userId, id));
      if (!links.some((l) => inScope(scope, l.branchId))) throw userNotFound();
    }
    return user;
  }

  /** Filiallar shu markazda mavjud, arxivlanmagan va (rahbar bo'lmasa) qamrovda bo'lishi kerak. */
  private async assertBranches(tx: Tx, scope: BranchScope, ids: string[]) {
    const rows = await tx.select({ id: branches.id }).from(branches).where(and(inArray(branches.id, ids), isNull(branches.archivedAt)));
    if (rows.length !== ids.length) throw branchNotFound();
    if (!ids.every((b) => inScope(scope, b))) throw forbidden("Bu filialga xodim biriktirish huquqingiz yo'q");
  }

  /** Foydalanuvchilarni filial ro'yxati (va ustoz profili) bilan boyitadi. Parol xeshi hech qachon chiqmaydi. */
  private async present(tx: Tx, rows: UserRow[], scope: BranchScope) {
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);
    const links = await tx.select({ userId: userBranches.userId, branchId: userBranches.branchId }).from(userBranches).where(inArray(userBranches.userId, ids));
    const profiles = await tx.select().from(teacherProfiles).where(inArray(teacherProfiles.userId, ids));
    return rows.map((u) => {
      const branchIds = links.filter((l) => l.userId === u.id).map((l) => l.branchId);
      const profile = profiles.find((p) => p.userId === u.id);
      return {
        id: u.id,
        login: u.login,
        fullName: u.fullName,
        phone: u.phone,
        role: u.role,
        status: u.status,
        mustChangePassword: u.mustChangePassword,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        // admin boshqa filialdagi biriktirishlarni ko'rmaydi
        branchIds: scope.all ? branchIds : branchIds.filter((b) => inScope(scope, b)),
        ...(profile ? { specialization: profile.specialization, note: profile.note } : {}),
      };
    });
  }

  private auditView(v: { fullName: string; phone: string | null; status: string; branchIds: string[]; specialization?: string | null; note?: string | null }) {
    return { fullName: v.fullName, phone: v.phone, status: v.status, branchIds: [...v.branchIds].sort(), specialization: v.specialization ?? null, note: v.note ?? null };
  }
}
