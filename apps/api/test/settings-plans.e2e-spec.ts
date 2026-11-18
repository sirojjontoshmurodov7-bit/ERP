// 22-qadam: markaz sozlamalari, tariflar, davomatni qo'lda qulflash, ro'yxat filtrlari, bazadagi login cheklovi. PGlite, RLS yoqilgan.
import { PERMISSIONS } from '@erp/shared';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq, sql } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { hashPassword } from '../src/auth/password.js';
import { addDays, todayLocal } from '../src/common/dates.js';
import { APP_CONFIG, type AppConfig } from '../src/config/app-config.js';
import { DB, DB_OPTIONS } from '../src/db/db.service.js';
import { rowsOf } from '../src/db/rows.js';
import * as s from '../src/db/schema.js';
import { createTestDb } from './helpers/test-db.js';

const config: AppConfig = {
  databaseUrl: 'unused',
  port: 0,
  accessSecret: 'test-access-secret-0123456789',
  refreshSecret: 'test-refresh-secret-0123456789',
  accessTtlSeconds: 900,
  refreshTtlSeconds: 3600,
};
const ROOT_PW = 'Root-Password-1';
const PW = 'User-Password-9';
const NOPE = '00000000-0000-4000-8000-000000000000';
const TODAY = todayLocal();
type Api = ReturnType<typeof makeApi>;
let httpFn: () => request.Agent;
const makeApi = (t: string) => ({
  get: (p: string) => httpFn().get(p).set({ Authorization: `Bearer ${t}` }),
  post: (p: string, b: object = {}) => httpFn().post(p).set({ Authorization: `Bearer ${t}` }).send(b),
  patch: (p: string, b: object) => httpFn().patch(p).set({ Authorization: `Bearer ${t}` }).send(b),
  put: (p: string, b: object) => httpFn().put(p).set({ Authorization: `Bearer ${t}` }).send(b),
});

describe('Sozlamalar, tariflar, qulf, filtrlar, login cheklovi (PGlite, RLS yoqilgan)', () => {
  let app: INestApplication;
  let db: Awaited<ReturnType<typeof createTestDb>>['db'];
  let pg: Awaited<ReturnType<typeof createTestDb>>['pg'];
  let rootToken: string;
  let root: Api;
  const http = () => request(app.getHttpServer());
  const login = (l: string, p: string) => http().post('/auth/login').send({ login: l, password: p });

  async function activate(l: string, temp: string) {
    const first = (await login(l, temp).expect(200)).body;
    await http().post('/auth/change-password').set({ Authorization: `Bearer ${first.accessToken}` }).send({ currentPassword: temp, newPassword: PW }).expect(204);
    return (await login(l, PW).expect(200)).body.accessToken as string;
  }
  interface Center {
    id: string;
    owner: Api;
    main: string;
    second: string;
    course: string;
  }
  async function newCenter(name: string, body: object = {}): Promise<Center> {
    const res = await root.post('/admin/centers', { name, ownerFullName: 'Rahbar', ...body }).expect(201);
    const owner = makeApi(await activate(res.body.owner.login, res.body.owner.temporaryPassword));
    const second = (await owner.post('/branches', { name: 'Ikkinchi filial' }).expect(201)).body.id as string;
    const course = (await owner.post('/courses', { name: 'Ingliz tili', defaultPrice: 400000 }).expect(201)).body.id as string;
    return { id: res.body.center.id, owner, main: res.body.branch.id, second, course };
  }
  async function staff(c: Center, role: 'ADMIN' | 'CASHIER' | 'TEACHER', fullName: string, branchId: string) {
    const res = await c.owner.post('/staff', { role, fullName, branchIds: [branchId] }).expect(201);
    return { id: res.body.user.id as string, api: makeApi(await activate(res.body.user.login, res.body.temporaryPassword)) };
  }
  let n = 0;
  async function mkStudent(c: Center, branchId: string, name = `Talaba${++n} Sozlama`) {
    const res = await c.owner.post('/students', { fullName: name, branchId }).expect(201);
    const lg = res.body.student.login as string;
    let cached: Promise<Api> | undefined;
    return { id: res.body.student.id as string, api: () => (cached ??= activate(lg, res.body.temporaryPassword).then(makeApi)) };
  }
  const mkGroup = async (c: Center, name: string, extra: object = {}) =>
    (await c.owner.post('/groups', { name, courseId: c.course, branchId: c.main, priceMonthly: 100000, billingMode: 'STUDENT_CYCLE', status: 'ACTIVE', ...extra }).expect(201)).body as { id: string };
  const settingsOf = async (c: Center) => (await db.select({ s: s.centers.settings }).from(s.centers).where(eq(s.centers.id, c.id)))[0]!.s as Record<string, unknown>;
  const actionsOf = async (entityId: string) => (await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, entityId))).map((x) => x.action);

  let A: Center;
  let B: Center;
  let admin1: Awaited<ReturnType<typeof staff>>;
  let cashier1: Awaited<ReturnType<typeof staff>>;
  let teacher1: Awaited<ReturnType<typeof staff>>;

  beforeAll(async () => {
    ({ db, pg } = await createTestDb());
    await db.insert(s.permissions).values(PERMISSIONS.map((p) => ({ ...p })));
    await db.insert(s.users).values({ centerId: null, role: 'SUPER_ADMIN', login: 'root', fullName: 'Root', passwordHash: await hashPassword(ROOT_PW), mustChangePassword: false });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(APP_CONFIG).useValue(config)
      .overrideProvider(DB).useValue(db)
      .overrideProvider(DB_OPTIONS).useValue({ setRole: 'erp_app' })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
    httpFn = http as never;
    rootToken = (await login('root', ROOT_PW).expect(200)).body.accessToken;
    root = makeApi(rootToken);
    A = await newCenter('Sozlama Markazi A');
    B = await newCenter('Sozlama Markazi B');
    admin1 = await staff(A, 'ADMIN', 'Admin Bir', A.main);
    cashier1 = await staff(A, 'CASHIER', 'Kassir Bir', A.main);
    teacher1 = await staff(A, 'TEACHER', 'Ustoz Bir', A.main);
  });

  afterAll(async () => {
    await app?.close();
    await pg?.close();
  });

  describe('markaz sozlamalari', () => {
    it("sukut qiymatlar, reja ma'lumoti; rahbar va admin o'qiydi, boshqalar 403, tokensiz 401", async () => {
      const res = await A.owner.get('/center/settings').expect(200);
      expect(res.body).toMatchObject({ name: 'Sozlama Markazi A', status: 'TRIAL', plan: null, settings: { billingMode: 'GROUP_CYCLE', graceDays: 0, joinProration: 'FULL_MONTH', attendanceLockDays: 3, locale: 'uz' } });
      expect(res.body).not.toHaveProperty('raw');
      expect((await admin1.api.get('/center/settings').expect(200)).body.settings.graceDays).toBe(0);
      await cashier1.api.get('/center/settings').expect(403);
      await teacher1.api.get('/center/settings').expect(403);
      await (await (await mkStudent(A, A.main)).api()).get('/center/settings').expect(403);
      await httpFn().get('/center/settings').expect(401);
      await root.get('/center/settings').expect(403);
    });

    it("o'zgartirish faqat rahbarda; qisman yangilash, mavjud kalitlar saqlanadi, audit before/after bilan", async () => {
      await admin1.api.patch('/center/settings', { graceDays: 2 }).expect(403);
      await cashier1.api.patch('/center/settings', { graceDays: 2 }).expect(403);
      await teacher1.api.patch('/center/settings', { graceDays: 2 }).expect(403);
      const res = await A.owner.patch('/center/settings', { graceDays: 2, attendanceLockDays: 10, locale: 'ru' }).expect(200);
      expect(res.body.settings).toEqual({ billingMode: 'GROUP_CYCLE', graceDays: 2, joinProration: 'FULL_MONTH', attendanceLockDays: 10, locale: 'ru' });
      expect(await settingsOf(A)).toMatchObject({ rounding: 'NONE', billing_mode: 'GROUP_CYCLE', grace_days: 2, attendance_lock_days: 10, locale: 'ru' }); // rounding tegilmagan
      const [log] = (await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, A.id))).filter((x) => x.action === 'center.settings');
      expect(log).toMatchObject({ before: { graceDays: 0, attendanceLockDays: 3 }, after: { graceDays: 2, attendanceLockDays: 10 } });
      expect((await B.owner.get('/center/settings').expect(200)).body.settings.graceDays).toBe(0); // boshqa markaz o'zgarmagan
    });

    it("tekshiruvlar: bo'sh tana, noma'lum kalit, chegaradan tashqari va noto'g'ri qiymat 400", async () => {
      for (const body of [{}, { foo: 1 }, { graceDays: -1 }, { graceDays: 61 }, { graceDays: 1.5 }, { attendanceLockDays: 366 }, { billingMode: 'X' }, { joinProration: 'BY_DAYS' }, { locale: 'de' }, { rounding: 'NONE' }]) {
        await A.owner.patch('/center/settings', body).expect(400);
      }
      expect((await A.owner.get('/center/settings').expect(200)).body.settings.graceDays).toBe(2);
    });

    it("buzilgan qiymat bazada bo'lsa sukut ko'rsatiladi", async () => {
      await db.update(s.centers).set({ settings: { grace_days: 'x', billing_mode: 'WEIRD' } }).where(eq(s.centers.id, B.id));
      expect((await B.owner.get('/center/settings').expect(200)).body.settings).toMatchObject({ graceDays: 0, billingMode: 'GROUP_CYCLE', attendanceLockDays: 3 });
      await db.update(s.centers).set({ settings: { billing_mode: 'GROUP_CYCLE', grace_days: 0, join_proration: 'FULL_MONTH', rounding: 'NONE', locale: 'uz' } }).where(eq(s.centers.id, B.id));
    });

    it("yangi guruhga sukut sikl va grace qo'llanadi; mavjud guruh o'zgarmaydi; davomat qulfi muddati o'zgaradi", async () => {
      const before = (await A.owner.post('/groups', { name: 'Eski sozlama', courseId: A.course, branchId: A.main, priceMonthly: 1000 }).expect(201)).body;
      await A.owner.patch('/center/settings', { billingMode: 'STUDENT_CYCLE', graceDays: 5 }).expect(200);
      const created = (await A.owner.post('/groups', { name: 'Yangi sozlama', courseId: A.course, branchId: A.main, priceMonthly: 1000 }).expect(201)).body;
      expect(created).toMatchObject({ billingMode: 'STUDENT_CYCLE', graceDays: 5 });
      expect((await A.owner.get(`/groups/${before.id}`).expect(200)).body).toMatchObject({ billingMode: 'GROUP_CYCLE', graceDays: 2 });

      // qulf muddati: 10 kun oldingi dars hali qulflanmagan, 0 kunda esa qulflangan
      const g = await mkGroup(A, 'Qulf muddati');
      await A.owner.post(`/groups/${g.id}/teachers`, { teacherId: teacher1.id, kind: 'MAIN', fromDate: addDays(TODAY, -100) }).expect(200);
      const old = (await teacher1.api.post(`/groups/${g.id}/lessons`, { lessonDate: addDays(TODAY, -5) }).expect(201)).body;
      expect(old.locked).toBe(false); // 10 kun
      await A.owner.patch('/center/settings', { attendanceLockDays: 0 }).expect(200);
      expect((await teacher1.api.get(`/lessons/${old.id}`).expect(200)).body.locked).toBe(true);
      await teacher1.api.patch(`/lessons/${old.id}`, { topic: 'x' }).expect(403);
      await A.owner.patch('/center/settings', { attendanceLockDays: 3, graceDays: 0, billingMode: 'GROUP_CYCLE' }).expect(200);
    });
  });

  describe('tariflar (super admin)', () => {
    let basic: { id: string };
    it("yaratish: sukut qiymatlar, takror nom 409, tekshiruvlar, audit; rahbar/kassir 403", async () => {
      const res = await root.post('/admin/plans', { name: 'Boshlang\'ich', priceMonthly: 99000, maxStudents: 2, maxBranches: 1, features: { telegram: true, support: 'email' } }).expect(201);
      basic = res.body;
      expect(res.body).toMatchObject({ name: "Boshlang'ich", priceMonthly: 99000, maxStudents: 2, maxBranches: 1, features: { telegram: true, support: 'email' }, centers: 0 });
      const free = (await root.post('/admin/plans', { name: 'Cheksiz' }).expect(201)).body;
      expect(free).toMatchObject({ priceMonthly: 0, maxStudents: null, maxBranches: null, features: {} });
      await root.post('/admin/plans', { name: "Boshlang'ich" }).expect(409).expect((r) => expect(r.body.code).toBe('PLAN_NAME_TAKEN'));
      for (const body of [{}, { name: 'a' }, { name: 'Yaxshi', priceMonthly: -1 }, { name: 'Yaxshi', maxStudents: 0 }, { name: 'Yaxshi', features: { 'Bad Key': true } }, { name: 'Yaxshi', features: { x: [1] } }]) {
        await root.post('/admin/plans', body).expect(400);
      }
      expect(await actionsOf(res.body.id)).toEqual(['plan.create']);
      await A.owner.post('/admin/plans', { name: 'Hack' }).expect(403);
      await cashier1.api.get('/admin/plans').expect(403);
      await httpFn().get('/admin/plans').expect(401);
    });

    it("ro'yxat (narx bo'yicha, markazlar soni), bitta tarif, tahrirlash (qisman, nom takrori 409, chegarani bekor qilish), audit before/after", async () => {
      const list = (await root.get('/admin/plans').expect(200)).body.items as { name: string; centers: number }[];
      expect(list.map((p) => p.name)).toEqual(['Cheksiz', "Boshlang'ich"]);
      expect((await root.get(`/admin/plans/${basic.id}`).expect(200)).body.name).toBe("Boshlang'ich");
      await root.get(`/admin/plans/${NOPE}`).expect(404);
      await root.get('/admin/plans/abc').expect(400);
      const upd = await root.patch(`/admin/plans/${basic.id}`, { priceMonthly: 120000, maxBranches: null }).expect(200);
      expect(upd.body).toMatchObject({ priceMonthly: 120000, maxBranches: null, maxStudents: 2 });
      await root.patch(`/admin/plans/${basic.id}`, { name: 'Cheksiz' }).expect(409);
      await root.patch(`/admin/plans/${basic.id}`, {}).expect(400);
      await root.patch(`/admin/plans/${basic.id}`, { centers: 5 }).expect(400); // strict
      await root.patch(`/admin/plans/${NOPE}`, { priceMonthly: 1 }).expect(404);
      const log = (await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, basic.id))).find((x) => x.action === 'plan.edit');
      expect(log).toMatchObject({ before: { priceMonthly: 99000, maxBranches: 1 }, after: { priceMonthly: 120000, maxBranches: null } });
      expect(log!.centerId).toBeNull();
    });

    it("markazga biriktirish: markaz sozlamalarida ko'rinadi; o'quvchi chegarasi yangi qo'shishni to'sadi, chegarani oshirish ochadi; markazlar soni", async () => {
      const C = await newCenter('Tarif Markazi', { planId: basic.id });
      expect((await C.owner.get('/center/settings').expect(200)).body.plan).toEqual({ name: "Boshlang'ich", maxStudents: 2, maxBranches: null });
      expect((await root.get(`/admin/plans/${basic.id}`).expect(200)).body.centers).toBe(1);
      await mkStudent(C, C.main);
      await mkStudent(C, C.main);
      await C.owner.post('/students', { fullName: 'Uchinchi Talaba', branchId: C.main }).expect(403).expect((r) => expect(r.body.code).toBe('PLAN_STUDENT_LIMIT'));
      await root.patch(`/admin/plans/${basic.id}`, { maxStudents: 3 }).expect(200);
      await C.owner.post('/students', { fullName: 'Uchinchi Talaba', branchId: C.main }).expect(201);
      // pasaytirish mavjudiga tegmaydi, faqat yangisini to'sadi
      await root.patch(`/admin/plans/${basic.id}`, { maxStudents: 1 }).expect(200);
      expect((await C.owner.get('/students').expect(200)).body.items).toHaveLength(3);
      await C.owner.post('/students', { fullName: 'To\'rtinchi Talaba', branchId: C.main }).expect(403);
      // boshqa markazga biriktirish va olib tashlash
      await root.patch(`/admin/centers/${B.id}`, { planId: basic.id }).expect(200);
      expect((await root.get(`/admin/plans/${basic.id}`).expect(200)).body.centers).toBe(2);
      await root.patch(`/admin/centers/${B.id}`, { planId: null }).expect(200);
      await root.patch(`/admin/centers/${B.id}`, { planId: NOPE }).expect(404);
    });
  });

  describe("davomatni qo'lda qulflash", () => {
    let g: { id: string };
    let l: { id: string };
    let admin2: Awaited<ReturnType<typeof staff>>;
    beforeAll(async () => {
      g = await mkGroup(A, 'Qo\'lda qulf');
      await A.owner.post(`/groups/${g.id}/teachers`, { teacherId: teacher1.id, kind: 'MAIN', fromDate: addDays(TODAY, -100) }).expect(200);
      l = (await teacher1.api.post(`/groups/${g.id}/lessons`, { lessonDate: TODAY }).expect(201)).body;
      admin2 = await staff(A, 'ADMIN', 'Admin Ikki', A.main);
    });

    it("ustoz o'z darsini qulflaydi: keyin tahrir 403 (LESSON_LOCKED), qayta qulflash 409; ruxsatsiz ochib bo'lmaydi", async () => {
      const res = await teacher1.api.post(`/lessons/${l.id}/lock`).expect(200);
      expect(res.body).toMatchObject({ id: l.id, locked: true });
      expect((await db.select().from(s.lessons).where(eq(s.lessons.id, l.id)))[0]!.lockedAt).not.toBeNull();
      expect((await teacher1.api.patch(`/lessons/${l.id}`, { topic: 'x' }).expect(403)).body.code).toBe('LESSON_LOCKED');
      expect((await teacher1.api.post(`/lessons/${l.id}/lock`).expect(409)).body.code).toBe('ALREADY_LOCKED');
      await teacher1.api.post(`/lessons/${l.id}/unlock`).expect(403); // attendance.edit_past yo'q
      await admin2.api.post(`/lessons/${l.id}/unlock`).expect(403);
      expect(await actionsOf(l.id)).toEqual(expect.arrayContaining(['lesson.create', 'lesson.lock']));
    });

    it("attendance.edit_past egasi qulfni ochadi (rahbar); qulflanmagan 409; keyin qayta tahrirlanadi; audit", async () => {
      const res = await A.owner.post(`/lessons/${l.id}/unlock`).expect(200);
      expect(res.body).toMatchObject({ id: l.id, locked: false });
      expect((await A.owner.post(`/lessons/${l.id}/unlock`).expect(409)).body.code).toBe('NOT_LOCKED');
      await teacher1.api.patch(`/lessons/${l.id}`, { topic: 'qayta ochildi' }).expect(200);
      expect(await actionsOf(l.id)).toEqual(expect.arrayContaining(['lesson.unlock']));
      await A.owner.put(`/permissions/users/${admin2.id}`, { permissions: { 'attendance.edit_past': true, 'attendance.mark': true } }).expect(200);
      await admin2.api.post(`/lessons/${l.id}/lock`).expect(200);
      await admin2.api.post(`/lessons/${l.id}/unlock`).expect(200);
    });

    it("muddati bo'yicha qulfni olib bo'lmaydi (LOCKED_BY_DATE); muddati o'tganni qulflash 409; ruxsat va qamrov", async () => {
      const old = (await A.owner.post(`/groups/${g.id}/lessons`, { lessonDate: addDays(TODAY, -20) }).expect(201)).body;
      expect(old.locked).toBe(true);
      await db.update(s.lessons).set({ lockedAt: new Date() }).where(eq(s.lessons.id, old.id));
      expect((await A.owner.post(`/lessons/${old.id}/unlock`).expect(409)).body.code).toBe('LOCKED_BY_DATE');
      await db.update(s.lessons).set({ lockedAt: null }).where(eq(s.lessons.id, old.id));
      expect((await A.owner.post(`/lessons/${old.id}/lock`).expect(409)).body.code).toBe('ALREADY_LOCKED');
      await cashier1.api.post(`/lessons/${l.id}/lock`).expect(403);
      await (await (await mkStudent(A, A.main)).api()).post(`/lessons/${l.id}/lock`).expect(403);
      await B.owner.post(`/lessons/${l.id}/lock`).expect(404); // boshqa markaz darsi
      await A.owner.post(`/lessons/${NOPE}/lock`).expect(404);
      await httpFn().post(`/lessons/${l.id}/lock`).expect(401);
    });
  });

  describe("ro'yxat filtrlari", () => {
    it("o'quvchilar: groupId, enrolled, sana oralig'i va tartib; ruxsat/qamrov saqlanadi", async () => {
      const C = await newCenter('Filtr Markazi');
      const gx = await mkGroup(C, 'Filtr X');
      const gy = await mkGroup(C, 'Filtr Y');
      const a = await mkStudent(C, C.main, 'Aziz Birinchi');
      const b = await mkStudent(C, C.main, 'Botir Ikkinchi');
      const c = await mkStudent(C, C.second, 'Cobir Uchinchi');
      const e1 = (await C.owner.post('/enrollments', { groupId: gx.id, studentId: a.id }).expect(201)).body.id as string;
      await C.owner.post('/enrollments', { groupId: gy.id, studentId: b.id }).expect(201);
      const ids = (r: request.Response) => (r.body.items as { id: string }[]).map((x) => x.id);

      expect(ids(await C.owner.get(`/students?groupId=${gx.id}`).expect(200))).toEqual([a.id]);
      expect(ids(await C.owner.get('/students?enrolled=true').expect(200))).toEqual([a.id, b.id]);
      expect(ids(await C.owner.get('/students?enrolled=false').expect(200))).toEqual([c.id]);
      await C.owner.post(`/enrollments/${e1}/leave`, {}).expect(200); // chiqqan yozilish hisoblanmaydi
      expect(ids(await C.owner.get(`/students?groupId=${gx.id}`).expect(200))).toEqual([]);
      expect(ids(await C.owner.get('/students?enrolled=false').expect(200))).toEqual([a.id, c.id]);
      expect(ids(await C.owner.get(`/students?enrolled=false&branchId=${C.second}`).expect(200))).toEqual([c.id]);

      expect((await C.owner.get(`/students?createdFrom=${TODAY}&createdTo=${TODAY}`).expect(200)).body.items).toHaveLength(3);
      expect((await C.owner.get(`/students?createdTo=${addDays(TODAY, -1)}`).expect(200)).body.items).toHaveLength(0);
      expect((await C.owner.get(`/students?createdFrom=${addDays(TODAY, 1)}`).expect(200)).body.items).toHaveLength(0);
      await db.update(s.users).set({ createdAt: new Date(Date.now() - 5 * 86_400_000) }).where(eq(s.users.id, a.id));
      expect(ids(await C.owner.get(`/students?createdTo=${addDays(TODAY, -1)}`).expect(200))).toEqual([a.id]);
      expect(ids(await C.owner.get('/students?sort=newest').expect(200)).at(-1)).toBe(a.id);
      expect(ids(await C.owner.get('/students?sort=name').expect(200))).toEqual([a.id, b.id, c.id]);
      for (const q of ['groupId=abc', 'enrolled=maybe', 'createdFrom=2026-13-01', 'sort=zzz']) await C.owner.get(`/students?${q}`).expect(400);

      // admin faqat o'z filialidagilarni ko'radi, filtr qamrovdan chiqarmaydi
      const adm = await staff(C, 'ADMIN', 'Filtr Admin', C.main);
      expect(ids(await adm.api.get('/students?enrolled=false').expect(200))).toEqual([a.id]);
      expect(ids(await B.owner.get(`/students?groupId=${gx.id}`).expect(200))).toEqual([]); // boshqa markaz
    });

    it("guruhlar: billingMode va noTeacher (true: asosiy ustozi yo'q, false: bor)", async () => {
      const C = await newCenter('Guruh Filtr Markazi');
      const t = await staff(C, 'TEACHER', 'Ustoz Filtr', C.main);
      const g1 = await mkGroup(C, 'G1', { billingMode: 'STUDENT_CYCLE' });
      const g2 = await mkGroup(C, 'G2', { billingMode: 'GROUP_CYCLE', billingDay: 5 });
      const g3 = await mkGroup(C, 'G3', { billingMode: 'GROUP_CYCLE', billingDay: 5 });
      await C.owner.post(`/groups/${g1.id}/teachers`, { teacherId: t.id, kind: 'MAIN' }).expect(200);
      await C.owner.post(`/groups/${g2.id}/teachers`, { teacherId: t.id, kind: 'ASSISTANT' }).expect(200); // yordamchi asosiy hisoblanmaydi
      const names = (r: request.Response) => (r.body.items as { name: string }[]).map((x) => x.name);
      expect(names(await C.owner.get('/groups?billingMode=GROUP_CYCLE').expect(200))).toEqual(['G2', 'G3']);
      expect(names(await C.owner.get('/groups?billingMode=STUDENT_CYCLE').expect(200))).toEqual(['G1']);
      expect(names(await C.owner.get('/groups?noTeacher=true').expect(200))).toEqual(['G2', 'G3']);
      expect(names(await C.owner.get('/groups?noTeacher=false').expect(200))).toEqual(['G1']);
      expect(names(await C.owner.get('/groups?noTeacher=true&billingMode=STUDENT_CYCLE').expect(200))).toEqual([]);
      await C.owner.get('/groups?billingMode=X').expect(400);
      await C.owner.get('/groups?noTeacher=1').expect(400);
      expect(names(await t.api.get('/groups').expect(200))).toEqual(['G1', 'G2']); // ustoz qamrovi o'zgarmaydi
      await C.owner.post(`/groups/${g3.id}/teachers`, { teacherId: t.id, kind: 'MAIN' }).expect(200);
      expect(names(await C.owner.get('/groups?noTeacher=true').expect(200))).toEqual(['G2']);
    });
  });

  describe('login cheklovi (bazada)', () => {
    const attempts = (l: string, n2: number) => Promise.all(Array.from({ length: n2 }, () => login(l, 'xato-parol-1').then((r) => r.status)));

    it("5 xatodan keyin 429, holat bazada (xom login yo'q), boshqa login ta'sirlanmaydi", async () => {
      const lg = 'cheklov.bir';
      for (let i = 0; i < 5; i++) await login(lg, 'xato-parol-1').expect(401);
      expect((await login(lg, 'xato-parol-1').expect(429)).body.code).toBe('TOO_MANY_ATTEMPTS');
      const list = rowsOf<{ key: string; failures: number }>(await db.execute(sql`select key, failures from login_throttle`));
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((r) => /^[0-9a-f]{64}$/.test(r.key))).toBe(true);
      expect(JSON.stringify(list)).not.toContain(lg);
      await login('cheklov.ikki', 'xato-parol-1').expect(401); // boshqa login bloklanmagan
    });

    it("ikkinchi nusxa (boshqa jarayon) ham bir xil bazadan bloklaydi; oyna tugagach ochiladi; muvaffaqiyatli kirish nolga tushiradi", async () => {
      const second = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(APP_CONFIG).useValue(config)
        .overrideProvider(DB).useValue(db)
        .overrideProvider(DB_OPTIONS).useValue({ setRole: 'erp_app' })
        .compile();
      const app2 = second.createNestApplication();
      await app2.init();
      try {
        expect((await request(app2.getHttpServer()).post('/auth/login').send({ login: 'cheklov.bir', password: 'xato-parol-1' })).status).toBe(429);
        // oyna tugadi (eski yozuv)
        await db.execute(sql`update login_throttle set window_start = now() - interval '16 minutes'`);
        expect((await request(app2.getHttpServer()).post('/auth/login').send({ login: 'cheklov.bir', password: 'xato-parol-1' })).status).toBe(401);
        expect((await login('cheklov.bir', 'xato-parol-1')).status).toBe(401); // hisoblagich qaytadan boshlandi (2)
        const [r] = rowsOf<{ failures: number }>(await db.execute(sql`select failures from login_throttle order by failures desc limit 1`));
        expect(r!.failures).toBe(2);
      } finally {
        await app2.close();
      }
    });

    it("to'g'ri parol bilan kirish hisoblagichni nolga tushiradi; 4 xato + muvaffaqiyat + 4 xato bloklamaydi", async () => {
      const centerOwner = await root.post('/admin/centers', { name: 'Cheklov Markazi', ownerFullName: 'Rahbar', ownerLogin: 'cheklov.rahbar' }).expect(201);
      const lg = 'cheklov.rahbar';
      const pw = centerOwner.body.owner.temporaryPassword as string;
      for (let i = 0; i < 4; i++) await login(lg, 'xato-parol-1').expect(401);
      await login(lg, pw).expect(200);
      for (let i = 0; i < 4; i++) await login(lg, 'xato-parol-1').expect(401);
      await login(lg, pw).expect(200);
    });

    it("parallel urinishlar yo'qolmaydi: 8 ta parallel xato so'rovdan keyin bloklangan", async () => {
      const statuses = await attempts('cheklov.parallel', 8);
      expect(statuses.filter((x) => x === 401).length).toBeGreaterThanOrEqual(5);
      expect((await login('cheklov.parallel', 'xato-parol-1')).status).toBe(429);
    });
  });
});
