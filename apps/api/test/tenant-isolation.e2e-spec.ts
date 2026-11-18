// Tenant izolyatsiyasi test to'plami (Skelet 4-qadam). Haqiqiy migratsiyalar PGlite'da qo'llanadi va
// so'rovlar ilovaning o'zi ishlatadigan DbService.withContext orqali, RLS yoqilgan `erp_app` roli bilan yuboriladi.
import { sql, type SQL } from 'drizzle-orm';
import { PERMISSIONS } from '@erp/shared';
import { contextOf, DbService, NO_CONTEXT, type TenantContext } from '../src/db/db.service.js';
import { rowsOf } from '../src/db/rows.js';
import * as s from '../src/db/schema.js';
import { createTestDb } from './helpers/test-db.js';

// center_id ustuni bor har bir jadval shu ro'yxatda bo'lishi SHART (pastdagi meta-test buni majburlaydi),
// shunda keyin qo'shiladigan tenant jadvali izolyatsiya testisiz qolib ketmaydi.
const TENANT_TABLES = [
  'branches',
  'users',
  'user_branches',
  'center_role_permissions',
  'user_permissions',
  'sessions',
  'teacher_profiles',
  'student_profiles',
  'courses',
  'groups',
  'group_schedules',
  'group_teachers',
  'enrollments',
  'enrollment_discounts',
  'lessons',
  'attendance_records',
  'audit_logs',
] as const;
type TenantTable = (typeof TENANT_TABLES)[number];

interface Fixture {
  center: string;
  admin: string;
  owner: string;
  course: string;
  group: string;
  enrollment: string;
  lesson: string;
  branch1: string;
  branch2: string;
}

const errorText = (e: unknown): string => {
  const parts: string[] = [];
  for (let cur: any = e; cur; cur = cur.cause) parts.push(String(cur.message ?? cur));
  return parts.join(' | ');
};

describe('Tenant izolyatsiyasi (RLS + kompozit FK + triggerlar)', () => {
  let pg: Awaited<ReturnType<typeof createTestDb>>['pg'];
  let db: Awaited<ReturnType<typeof createTestDb>>['db'];
  let svc: DbService;
  let A: Fixture;
  let B: Fixture;
  let ctxA: TenantContext;
  let ctxB: TenantContext;
  const SUPER: TenantContext = contextOf(null, 'SUPER_ADMIN');

  /** Ilova yo'li bilan so'rov: tranzaksiya + RLS konteksti + erp_app roli. */
  const q = async <T = Record<string, any>>(ctx: TenantContext, query: SQL): Promise<T[]> =>
    svc.withContext(ctx, async (tx) => rowsOf<T>(await tx.execute(query)));
  const failure = async (p: Promise<unknown>): Promise<string | null> => {
    try {
      await p;
      return null;
    } catch (e) {
      return errorText(e);
    }
  };
  /** Egasi (superuser) ulanishi bilan hisoblash: RLS ta'sir qilmaydi, haqiqiy holatni ko'rsatadi. */
  const rawCount = async (table: string, centerId: string): Promise<number> =>
    Number(rowsOf<{ c: number }>(await db.execute(sql`select count(*)::int c from ${sql.raw(table)} where center_id = ${centerId}`))[0]!.c);

  const insertSql = (table: TenantTable, f: Fixture, n: string): SQL => {
    switch (table) {
      case 'branches':
        return sql`insert into branches (center_id, name) values (${f.center}, ${'br-' + n})`;
      case 'users':
        return sql`insert into users (center_id, role, login, password_hash, full_name) values (${f.center}, 'CASHIER', ${'u-' + n}, 'h', 'x')`;
      case 'user_branches':
        return sql`insert into user_branches (user_id, branch_id, center_id) values (${f.admin}, ${f.branch2}, ${f.center})`;
      case 'center_role_permissions':
        return sql`insert into center_role_permissions (center_id, role, permission_code, allowed) values (${f.center}, 'CASHIER', 'payment.view', true)`;
      case 'user_permissions':
        return sql`insert into user_permissions (user_id, center_id, permission_code, allowed) values (${f.admin}, ${f.center}, 'student.view', true)`;
      case 'sessions':
        return sql`insert into sessions (user_id, center_id, refresh_hash, expires_at) values (${f.admin}, ${f.center}, ${'h-' + n}, now() + interval '1 hour')`;
      case 'teacher_profiles':
        return sql`with u as (insert into users (center_id, role, login, password_hash, full_name) values (${f.center}, 'TEACHER', ${'tp-' + n}, 'h', 'x') returning id)
                   insert into teacher_profiles (user_id, center_id) select id, ${f.center}::uuid from u`;
      case 'student_profiles':
        return sql`with u as (insert into users (center_id, role, login, password_hash, full_name) values (${f.center}, 'STUDENT', ${'sp-' + n}, 'h', 'x') returning id)
                   insert into student_profiles (user_id, center_id) select id, ${f.center}::uuid from u`;
      case 'courses':
        return sql`insert into courses (center_id, name) values (${f.center}, ${'course-' + n})`;
      case 'groups':
        return sql`insert into groups (center_id, branch_id, course_id, name, price_monthly, billing_mode, billing_day)
                   values (${f.center}, ${f.branch1}, ${f.course}, ${'group-' + n}, 100000, 'GROUP_CYCLE', 5)`;
      case 'group_schedules':
        return sql`insert into group_schedules (group_id, center_id, weekday, start_time, end_time) values (${f.group}, ${f.center}, 2, '10:00', '11:00')`;
      case 'group_teachers':
        return sql`insert into group_teachers (group_id, teacher_id, center_id, kind) values (${f.group}, ${f.owner}, ${f.center}, 'ASSISTANT')`;
      case 'enrollments':
        return sql`insert into enrollments (group_id, student_id, center_id) values (${f.group}, ${f.owner}, ${f.center})`;
      case 'enrollment_discounts':
        return sql`insert into enrollment_discounts (enrollment_id, center_id, type) values (${f.enrollment}, ${f.center}, 'FREE')`;
      case 'lessons':
        return sql`insert into lessons (center_id, group_id, lesson_date) values (${f.center}, ${f.group}, '2026-02-02')`;
      case 'attendance_records':
        return sql`insert into attendance_records (lesson_id, student_id, center_id, status) values (${f.lesson}, ${f.owner}, ${f.center}, 'PRESENT')`;
      case 'audit_logs':
        return sql`insert into audit_logs (center_id, action, entity) values (${f.center}, 'test.insert', 'x')`;
    }
  };

  async function seedCenter(slug: string): Promise<Fixture> {
    const [c] = await db.insert(s.centers).values({ name: slug, slug, status: 'ACTIVE' }).returning();
    const [b1, b2] = await db
      .insert(s.branches)
      .values([
        { centerId: c!.id, name: 'Asosiy filial' },
        { centerId: c!.id, name: 'Filial 2' },
      ])
      .returning();
    const [owner, admin] = await db
      .insert(s.users)
      .values([
        { centerId: c!.id, role: 'OWNER', login: `${slug}.owner`, passwordHash: 'h', fullName: 'Owner' },
        { centerId: c!.id, role: 'ADMIN', login: `${slug}.admin`, passwordHash: 'h', fullName: 'Admin' },
      ])
      .returning();
    await db.insert(s.userBranches).values({ userId: admin!.id, branchId: b1!.id, centerId: c!.id });
    await db.insert(s.centerRolePermissions).values({ centerId: c!.id, role: 'OWNER', permissionCode: 'payment.create', allowed: true });
    await db.insert(s.userPermissions).values({ userId: admin!.id, centerId: c!.id, permissionCode: 'payment.create', allowed: true });
    await db.insert(s.teacherProfiles).values({ userId: admin!.id, centerId: c!.id });
    await db.insert(s.studentProfiles).values({ userId: admin!.id, centerId: c!.id });
    const [course] = await db.insert(s.courses).values({ centerId: c!.id, name: 'Ingliz tili', defaultPrice: 300000 }).returning();
    const [group] = await db
      .insert(s.groups)
      .values({ centerId: c!.id, branchId: b1!.id, courseId: course!.id, name: 'IELTS 1', priceMonthly: 300000, billingMode: 'GROUP_CYCLE', billingDay: 1 })
      .returning();
    await db.insert(s.groupSchedules).values({ groupId: group!.id, centerId: c!.id, weekday: 1, startTime: '09:00', endTime: '10:30' });
    await db.insert(s.groupTeachers).values({ groupId: group!.id, teacherId: admin!.id, centerId: c!.id, kind: 'MAIN' });
    const [enrollment] = await db.insert(s.enrollments).values({ groupId: group!.id, studentId: admin!.id, centerId: c!.id }).returning();
    await db.insert(s.enrollmentDiscounts).values({ enrollmentId: enrollment!.id, centerId: c!.id, type: 'PERCENT', value: 10 });
    const [lesson] = await db.insert(s.lessons).values({ centerId: c!.id, groupId: group!.id, lessonDate: '2026-01-01', teacherId: admin!.id }).returning();
    await db.insert(s.attendanceRecords).values({ lessonId: lesson!.id, studentId: admin!.id, centerId: c!.id, status: 'ABSENT' });
    await db.insert(s.sessions).values({
      userId: owner!.id,
      centerId: c!.id,
      refreshHash: `seed-${slug}`,
      expiresAt: new Date(Date.now() + 3600_000),
    });
    await db.insert(s.auditLogs).values({ centerId: c!.id, actorId: owner!.id, action: 'seed', entity: 'user' });
    return { center: c!.id, admin: admin!.id, owner: owner!.id, course: course!.id, group: group!.id, enrollment: enrollment!.id, lesson: lesson!.id, branch1: b1!.id, branch2: b2!.id };
  }

  beforeAll(async () => {
    ({ db, pg } = await createTestDb());
    svc = new DbService(db as never, { setRole: 'erp_app' });
    await db.insert(s.permissions).values(PERMISSIONS.map((p) => ({ ...p })));
    A = await seedCenter('a');
    B = await seedCenter('b');
    ctxA = contextOf(A.center, 'OWNER');
    ctxB = contextOf(B.center, 'OWNER');

    // Super admin va platforma yozuvlari
    const [root] = await db
      .insert(s.users)
      .values({ centerId: null, role: 'SUPER_ADMIN', login: 'root', passwordHash: 'h', fullName: 'Root' })
      .returning();
    await db.insert(s.sessions).values({ userId: root!.id, centerId: null, refreshHash: 'seed-root', expiresAt: new Date(Date.now() + 3600_000) });
    await db.insert(s.auditLogs).values([
      { centerId: null, actorId: root!.id, action: 'plan.create', entity: 'plan' },
      { centerId: A.center, actorId: root!.id, action: 'center.create', entity: 'center' },
      { centerId: A.center, actorId: root!.id, action: 'student.create', entity: 'student' },
    ]);
  });

  afterAll(async () => {
    await pg?.close();
  });

  describe('sxema meta-tekshiruvlari (yangi jadval RLS siz qolib ketmasin)', () => {
    it("public sxemadagi HAR jadvalda RLS yoqilgan", async () => {
      const rows = rowsOf<{ relname: string }>(
        await db.execute(sql`select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
                             where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`),
      );
      expect(rows.map((r) => r.relname)).toEqual([]);
    });

    it("center_id ustuni bor jadvallar to'plami TENANT_TABLES bilan bir xil va har birida siyosat bor", async () => {
      const withCenter = rowsOf<{ table_name: string }>(
        await db.execute(sql`select table_name from information_schema.columns
                             where table_schema = 'public' and column_name = 'center_id'`),
      ).map((r) => r.table_name);
      expect([...withCenter].sort()).toEqual([...TENANT_TABLES].sort());

      const withPolicy = rowsOf<{ tablename: string }>(
        await db.execute(sql`select distinct tablename from pg_policies where schemaname = 'public'`),
      ).map((r) => r.tablename);
      for (const t of [...TENANT_TABLES, 'centers', 'plans', 'permissions']) expect(withPolicy).toContain(t);
    });

    it("ilova roli superuser emas, RLS'ni chetlab o'tmaydi va jadval egasi emas", async () => {
      const [role] = rowsOf<{ rolsuper: boolean; rolbypassrls: boolean }>(
        await db.execute(sql`select rolsuper, rolbypassrls from pg_roles where rolname = 'erp_app'`),
      );
      expect(role).toEqual({ rolsuper: false, rolbypassrls: false });
      const owners = rowsOf<{ tableowner: string }>(await db.execute(sql`select distinct tableowner from pg_tables where schemaname = 'public'`));
      expect(owners.map((o) => o.tableowner)).not.toContain('erp_app');
    });

    it("o'chirish taqiqlangan jadvallarga DELETE, audit_logs'ga UPDATE/DELETE huquqi yo'q", async () => {
      const has = async (table: string, priv: string) =>
        rowsOf<{ ok: boolean }>(await db.execute(sql`select has_table_privilege('erp_app', ${table}, ${priv}) ok`))[0]!.ok;
      for (const t of ['users', 'centers', 'branches', 'plans']) expect(await has(t, 'DELETE')).toBe(false);
      for (const p of ['UPDATE', 'DELETE', 'TRUNCATE']) expect(await has('audit_logs', p)).toBe(false);
      for (const p of ['INSERT', 'UPDATE', 'DELETE']) expect(await has('permissions', p)).toBe(false);
    });
  });

  describe.each(TENANT_TABLES)('%s', (table) => {
    it("A markazi faqat o'z qatorlarini ko'radi", async () => {
      const rows = await q<{ center_id: string }>(ctxA, sql`select center_id from ${sql.raw(table)}`);
      expect(rows.length).toBeGreaterThan(0);
      expect(new Set(rows.map((r) => r.center_id))).toEqual(new Set([A.center]));
      const rowsB = await q<{ center_id: string }>(ctxB, sql`select center_id from ${sql.raw(table)}`);
      expect(new Set(rowsB.map((r) => r.center_id))).toEqual(new Set([B.center]));
    });

    it("B qatorini ID/shart bo'yicha so'rasa ham topilmaydi", async () => {
      const rows = await q(ctxA, sql`select 1 from ${sql.raw(table)} where center_id = ${B.center}`);
      expect(rows).toEqual([]);
    });

    it("kontekstsiz so'rov hech narsa ko'rmaydi", async () => {
      expect(await q(NO_CONTEXT, sql`select 1 from ${sql.raw(table)}`)).toEqual([]);
    });

    it("A markazi B qatorini o'zgartira/o'chira olmaydi (0 qator yoki huquq rad etiladi) va B o'zgarmaydi", async () => {
      const before = await rawCount(table, B.center);
      for (const stmt of [
        sql`update ${sql.raw(table)} set center_id = center_id where center_id = ${B.center} returning 1`,
        sql`delete from ${sql.raw(table)} where center_id = ${B.center} returning 1`,
      ]) {
        let affected = 0;
        try {
          affected = (await q(ctxA, stmt)).length;
        } catch (e) {
          expect(errorText(e)).toMatch(/permission denied|append-only|row-level security/);
        }
        expect(affected).toBe(0);
      }
      expect(await rawCount(table, B.center)).toBe(before);
    });

    it("A markazi B markaziga yoza olmaydi, o'z markaziga yoza oladi (nazorat)", async () => {
      expect(await failure(q(ctxA, insertSql(table, A, 'ctl-a')))).toBeNull();
      const err = await failure(q(ctxA, insertSql(table, B, 'evil-b')));
      expect(err).toMatch(/row-level security/);
      expect(await failure(q(NO_CONTEXT, insertSql(table, A, 'noctx')))).toMatch(/row-level security/);
    });
  });

  describe('boshqa markazga havola (kompozit FK)', () => {
    it("user_branches: A xodimini B filialiga bog'lab bo'lmaydi", async () => {
      const err = await failure(
        q(ctxA, sql`insert into user_branches (user_id, branch_id, center_id) values (${A.admin}, ${B.branch2}, ${A.center})`),
      );
      expect(err).toMatch(/foreign key/);
    });

    it("user_branches: B xodimini A filialiga bog'lab bo'lmaydi", async () => {
      const err = await failure(
        q(ctxA, sql`insert into user_branches (user_id, branch_id, center_id) values (${B.admin}, ${A.branch2}, ${A.center})`),
      );
      expect(err).toMatch(/foreign key/);
    });

    it("user_permissions va sessions: boshqa markaz foydalanuvchisiga yozib bo'lmaydi", async () => {
      const up = await failure(
        q(ctxA, sql`insert into user_permissions (user_id, center_id, permission_code, allowed) values (${B.admin}, ${A.center}, 'group.view', true)`),
      );
      expect(up).toMatch(/foreign key/);
      const se = await failure(
        q(ctxA, sql`insert into sessions (user_id, center_id, refresh_hash, expires_at) values (${B.admin}, ${A.center}, 'x-cross', now() + interval '1 hour')`),
      );
      expect(se).toMatch(/foreign key/);
    });

    it("groups: A guruhini B filiali yoki B kursiga bog'lab bo'lmaydi", async () => {
      const mk = (branch: string, course: string, n: string) =>
        sql`insert into groups (center_id, branch_id, course_id, name, price_monthly, billing_mode, billing_day)
            values (${A.center}, ${branch}, ${course}, ${n}, 1, 'GROUP_CYCLE', 1)`;
      expect(await failure(q(ctxA, mk(B.branch1, A.course, 'x-branch')))).toMatch(/foreign key/);
      expect(await failure(q(ctxA, mk(A.branch1, B.course, 'x-course')))).toMatch(/foreign key/);
    });

    it("group_schedules va group_teachers: boshqa markaz guruhi yoki ustoziga bog'lab bo'lmaydi", async () => {
      const sch = await failure(
        q(ctxA, sql`insert into group_schedules (group_id, center_id, weekday, start_time, end_time) values (${B.group}, ${A.center}, 3, '10:00', '11:00')`),
      );
      expect(sch).toMatch(/foreign key/);
      const t1 = await failure(q(ctxA, sql`insert into group_teachers (group_id, teacher_id, center_id, kind) values (${B.group}, ${A.admin}, ${A.center}, 'ASSISTANT')`));
      expect(t1).toMatch(/foreign key/);
      const t2 = await failure(q(ctxA, sql`insert into group_teachers (group_id, teacher_id, center_id, kind) values (${A.group}, ${B.admin}, ${A.center}, 'ASSISTANT')`));
      expect(t2).toMatch(/foreign key/);
    });

    it("guruh qoidalari bazada: bitta asosiy ustoz, billing_day faqat GROUP_CYCLE'da 1-28", async () => {
      const second = await failure(q(ctxA, sql`insert into group_teachers (group_id, teacher_id, center_id, kind) values (${A.group}, ${A.owner}, ${A.center}, 'MAIN')`));
      expect(second).toMatch(/group_teachers_one_main_uq|duplicate/);
      const bad = (mode: string, day: string) =>
        sql`insert into groups (center_id, branch_id, course_id, name, price_monthly, billing_mode, billing_day)
            values (${A.center}, ${A.branch1}, ${A.course}, ${'bad-' + mode + day}, 1, ${mode}, ${day === 'null' ? null : Number(day)})`;
      expect(await failure(q(ctxA, bad('GROUP_CYCLE', '29')))).toMatch(/groups_billing_day_chk/);
      expect(await failure(q(ctxA, bad('GROUP_CYCLE', 'null')))).toMatch(/groups_billing_day_chk/);
      expect(await failure(q(ctxA, bad('STUDENT_CYCLE', '5')))).toMatch(/groups_billing_day_chk/);
      expect(await failure(q(ctxA, bad('STUDENT_CYCLE', 'null')))).toBeNull();
    });

    it("enrollments: boshqa markaz guruhi/o'quvchisiga yozib bo'lmaydi; chegirma boshqa markaz yozilishiga bog'lanmaydi", async () => {
      const g = await failure(q(ctxA, sql`insert into enrollments (group_id, student_id, center_id) values (${B.group}, ${A.admin}, ${A.center})`));
      expect(g).toMatch(/foreign key/);
      const st = await failure(q(ctxA, sql`insert into enrollments (group_id, student_id, center_id) values (${A.group}, ${B.admin}, ${A.center})`));
      expect(st).toMatch(/foreign key/);
      const d = await failure(q(ctxA, sql`insert into enrollment_discounts (enrollment_id, center_id, type) values (${B.enrollment}, ${A.center}, 'FREE')`));
      expect(d).toMatch(/foreign key/);
    });

    it("yozilish qoidalari bazada: ochiq yozilish takrorlanmaydi, LEFT va sana mosligi, chegirma qiymati", async () => {
      const dup = await failure(q(ctxA, sql`insert into enrollments (group_id, student_id, center_id) values (${A.group}, ${A.admin}, ${A.center})`));
      expect(dup).toMatch(/enrollments_open_uq|duplicate/);
      const left = await failure(q(ctxA, sql`insert into enrollments (group_id, student_id, center_id, status) values (${A.group}, ${A.owner}, ${A.center}, 'LEFT')`));
      expect(left).toMatch(/enrollments_left_chk/);
      const ok = await failure(q(ctxA, sql`insert into enrollments (group_id, student_id, center_id, status, joined_at, left_at) values (${A.group}, ${A.admin}, ${A.center}, 'LEFT', '2026-01-01', '2026-02-01')`));
      expect(ok).toBeNull(); // tugallangan eski yozilish bilan yangisi yonma-yon yashaydi
      const early = await failure(q(ctxA, sql`insert into enrollments (group_id, student_id, center_id, status, joined_at, left_at) values (${A.group}, ${A.owner}, ${A.center}, 'LEFT', '2026-03-01', '2026-02-01')`));
      expect(early).toMatch(/enrollments_dates_chk/);
      const disc = (type: string, value: string) => sql`insert into enrollment_discounts (enrollment_id, center_id, type, value) values (${A.enrollment}, ${A.center}, ${type}, ${value === 'null' ? null : Number(value)})`;
      expect(await failure(q(ctxA, disc('PERCENT', '101')))).toMatch(/enrollment_discounts_value_chk/);
      expect(await failure(q(ctxA, disc('AMOUNT', 'null')))).toMatch(/enrollment_discounts_value_chk/);
      expect(await failure(q(ctxA, disc('FREE', '5')))).toMatch(/enrollment_discounts_value_chk/);
      expect(await failure(q(ctxA, disc('AMOUNT', '50000')))).toBeNull();
    });

    it("lessons va attendance_records: boshqa markaz guruhi, ustozi, darsi va o'quvchisiga bog'lab bo'lmaydi", async () => {
      const l1 = await failure(q(ctxA, sql`insert into lessons (center_id, group_id, lesson_date) values (${A.center}, ${B.group}, '2026-03-03')`));
      expect(l1).toMatch(/foreign key/);
      const l2 = await failure(q(ctxA, sql`insert into lessons (center_id, group_id, lesson_date, teacher_id) values (${A.center}, ${A.group}, '2026-03-03', ${B.admin})`));
      expect(l2).toMatch(/foreign key/);
      const a1 = await failure(q(ctxA, sql`insert into attendance_records (lesson_id, student_id, center_id, status) values (${B.lesson}, ${A.admin}, ${A.center}, 'PRESENT')`));
      expect(a1).toMatch(/foreign key/);
      const a2 = await failure(q(ctxA, sql`insert into attendance_records (lesson_id, student_id, center_id, status) values (${A.lesson}, ${B.admin}, ${A.center}, 'PRESENT')`));
      expect(a2).toMatch(/foreign key/);
    });

    it("dars va davomat qoidalari bazada: guruhda sana noyob, holatlar cheklangan, yozuv takrorlanmaydi", async () => {
      const dup = await failure(q(ctxA, sql`insert into lessons (center_id, group_id, lesson_date) values (${A.center}, ${A.group}, '2026-01-01')`));
      expect(dup).toMatch(/lessons_group_date_uq|duplicate/);
      const st = await failure(q(ctxA, sql`insert into lessons (center_id, group_id, lesson_date, status) values (${A.center}, ${A.group}, '2026-04-04', 'DONE')`));
      expect(st).toMatch(/lessons_status_chk/);
      const bad = await failure(q(ctxA, sql`insert into attendance_records (lesson_id, student_id, center_id, status) values (${A.lesson}, ${A.owner}, ${A.center}, 'SLEEPING')`));
      expect(bad).toMatch(/attendance_status_chk/);
      const twice = await failure(q(ctxA, sql`insert into attendance_records (lesson_id, student_id, center_id, status) values (${A.lesson}, ${A.admin}, ${A.center}, 'PRESENT')`));
      expect(twice).toMatch(/duplicate|attendance_records_pkey/);
    });

    it("superuser ulanishi bilan ham kross-markaz bog'lash rad etiladi (baza darajasida)", async () => {
      const err = await failure(
        db.execute(sql`insert into user_branches (user_id, branch_id, center_id) values (${A.admin}, ${B.branch2}, ${A.center})`).then(() => undefined),
      );
      expect(err).toMatch(/foreign key/);
    });
  });

  describe('huquqni kengaytirishga urinishlar', () => {
    it("A rahbari SUPER_ADMIN yoki boshqa markaz foydalanuvchisini yarata olmaydi", async () => {
      expect(
        await failure(q(ctxA, sql`insert into users (center_id, role, login, password_hash, full_name) values (null, 'SUPER_ADMIN', 'evil.root', 'h', 'x')`)),
      ).toMatch(/row-level security|violates/);
      expect(
        await failure(q(ctxA, sql`insert into users (center_id, role, login, password_hash, full_name) values (${B.center}, 'OWNER', 'evil.owner', 'h', 'x')`)),
      ).toMatch(/row-level security/);
    });

    it("A foydalanuvchisini B markaziga ko'chirib bo'lmaydi", async () => {
      const err = await failure(q(ctxA, sql`update users set center_id = ${B.center} where id = ${A.admin}`));
      expect(err).toMatch(/row-level security|violates/);
    });

    it("A rahbari o'z markazini ACTIVE/tarif/bloklash maydonlarini o'zgartira olmaydi, nom va sozlamani o'zgartira oladi", async () => {
      await db.update(s.centers).set({ status: 'TRIAL' }).where(sql`id = ${A.center}`);
      expect(await failure(q(ctxA, sql`update centers set status = 'ACTIVE' where id = ${A.center}`))).toMatch(/super admin only/);
      expect(await failure(q(ctxA, sql`update centers set blocked_at = null, blocked_reason = null where id = ${A.center}`))).toBeNull();
      expect(await failure(q(ctxA, sql`update centers set trial_ends_at = now() + interval '10 years' where id = ${A.center}`))).toMatch(/super admin only/);
      expect(await failure(q(ctxA, sql`update centers set name = 'Yangi nom', settings = '{"grace_days":3}'::jsonb where id = ${A.center}`))).toBeNull();
      const [c] = await q<{ status: string; name: string }>(ctxA, sql`select status, name from centers where id = ${A.center}`);
      expect(c).toEqual({ status: 'TRIAL', name: 'Yangi nom' });
    });

    it("A rahbari markaz yaratolmaydi va B markazini o'zgartira olmaydi", async () => {
      expect(await failure(q(ctxA, sql`insert into centers (name, slug) values ('x', 'evil')`))).toMatch(/row-level security/);
      expect(await q(ctxA, sql`update centers set name = 'hacked' where id = ${B.center} returning 1`)).toEqual([]);
      const [b] = await q<{ name: string }>(ctxB, sql`select name from centers`);
      expect(b!.name).toBe('b');
    });

    it("A markazi faqat o'z markazini ko'radi; tariflarni o'qiy oladi, yoza olmaydi", async () => {
      const centersSeen = await q<{ id: string }>(ctxA, sql`select id from centers`);
      expect(centersSeen.map((c) => c.id)).toEqual([A.center]);
      expect(await failure(q(ctxA, sql`insert into plans (name) values ('free-for-all')`))).toMatch(/row-level security/);
      expect(await q(ctxA, sql`select 1 from plans`)).toEqual([]); // hali tarif yo'q, lekin o'qish xatosiz
    });
  });

  describe('super admin', () => {
    it('barcha markazlarni ko\'radi va holatini o\'zgartira oladi', async () => {
      const seen = await q<{ id: string }>(SUPER, sql`select id from centers`);
      expect(new Set(seen.map((c) => c.id))).toEqual(new Set([A.center, B.center]));
      expect(await failure(q(SUPER, sql`update centers set status = 'BLOCKED', blocked_at = now() where id = ${B.center}`))).toBeNull();
      expect(await failure(q(SUPER, sql`update centers set status = 'ACTIVE', blocked_at = null where id = ${B.center}`))).toBeNull();
    });

    it("markaz ichki ma'lumotini (filial, bog'lanish, ruxsat) ko'rmaydi va yoza olmaydi", async () => {
      for (const t of ['branches', 'user_branches', 'center_role_permissions', 'user_permissions'] as const) {
        expect(await q(SUPER, sql`select 1 from ${sql.raw(t)}`)).toEqual([]);
      }
      expect(await failure(q(SUPER, sql`insert into branches (center_id, name) values (${A.center}, 'super-made')`))).toMatch(/row-level security/);
    });

    it("faqat SUPER_ADMIN va OWNER foydalanuvchilarini ko'radi (admin/kassir/ustoz/o'quvchini emas)", async () => {
      const roles = await q<{ role: string }>(SUPER, sql`select distinct role from users`);
      expect(new Set(roles.map((r) => r.role))).toEqual(new Set(['SUPER_ADMIN', 'OWNER']));
      expect(await q(SUPER, sql`update users set full_name = 'x' where role = 'ADMIN' returning 1`)).toEqual([]);
    });

    it("OWNER yarata oladi, ADMIN yarata olmaydi", async () => {
      expect(
        await failure(q(SUPER, sql`insert into users (center_id, role, login, password_hash, full_name) values (${A.center}, 'OWNER', 'a.owner2', 'h', 'x')`)),
      ).toBeNull();
      expect(
        await failure(q(SUPER, sql`insert into users (center_id, role, login, password_hash, full_name) values (${A.center}, 'ADMIN', 'a.admin2', 'h', 'x')`)),
      ).toMatch(/row-level security/);
    });

    it("audit jurnalidan faqat platforma yozuvlarini ko'radi", async () => {
      const rows = await q<{ action: string; entity: string }>(SUPER, sql`select action, entity from audit_logs`);
      expect(rows.map((r) => r.action).sort()).toEqual(['center.create', 'plan.create']);
      expect(rows.some((r) => r.entity === 'student')).toBe(false);
    });

    it('sessiyalaridan faqat markazsizlarini (o\'zinikini) ko\'radi', async () => {
      const rows = await q<{ center_id: string | null }>(SUPER, sql`select center_id from sessions`);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((r) => r.center_id === null)).toBe(true);
    });
  });

  describe('kontekst xavfsizligi', () => {
    it("tranzaksiya konteksti keyingi so'rovga sizib chiqmaydi", async () => {
      await q(ctxA, sql`select 1 from users`);
      const [setting] = await q<{ v: string | null }>(NO_CONTEXT, sql`select current_setting('app.center_id', true) as v`);
      expect(setting!.v ?? '').toBe('');
      expect(await q(NO_CONTEXT, sql`select 1 from users`)).toEqual([]);
    });

    it("buzuq markaz identifikatori so'rovni xato bilan to'xtatadi (yopiq tomonga yiqiladi)", async () => {
      const err = await failure(q({ centerId: 'not-a-uuid', isSuperAdmin: false }, sql`select 1 from users`));
      expect(err).toMatch(/invalid input syntax for type uuid/);
    });

    it('super admin bayrog\'i alohida o\'rnatilmasa, centerId bilan avtomatik berilmaydi', async () => {
      expect((await q<{ v: string }>(ctxA, sql`select current_setting('app.is_super_admin', true) as v`))[0]!.v).toBe('false');
    });

    it("login qidiruv funksiyasi kontekstsiz ishlaydi, lekin boshqa jadvalni ochmaydi", async () => {
      const rows = await q<{ login: string }>(NO_CONTEXT, sql`select login from app_auth_find_user('A.OWNER')`);
      expect(rows.map((r) => r.login)).toEqual(['a.owner']);
      expect(await q(NO_CONTEXT, sql`select 1 from users`)).toEqual([]);
    });
  });
});
