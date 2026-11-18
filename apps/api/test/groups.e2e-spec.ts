// 9-qadam: kurslar va guruhlar (jadval, ustozlar, narx/sikl sozlamalari). PGlite, RLS yoqilgan.
import { PERMISSIONS } from '@erp/shared';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { hashPassword } from '../src/auth/password.js';
import { APP_CONFIG, type AppConfig } from '../src/config/app-config.js';
import { DB, DB_OPTIONS } from '../src/db/db.service.js';
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
type Api = ReturnType<typeof makeApi>;
let httpFn: () => request.Agent;
const makeApi = (t: string) => ({
  get: (p: string) => httpFn().get(p).set({ Authorization: `Bearer ${t}` }),
  post: (p: string, b: object = {}) => httpFn().post(p).set({ Authorization: `Bearer ${t}` }).send(b),
  patch: (p: string, b: object) => httpFn().patch(p).set({ Authorization: `Bearer ${t}` }).send(b),
  put: (p: string, b: object) => httpFn().put(p).set({ Authorization: `Bearer ${t}` }).send(b),
});

describe('Kurslar va guruhlar (PGlite, RLS yoqilgan)', () => {
  let app: INestApplication;
  let db: Awaited<ReturnType<typeof createTestDb>>['db'];
  let pg: Awaited<ReturnType<typeof createTestDb>>['pg'];
  let rootToken: string;
  const http = () => request(app.getHttpServer());
  const login = (l: string, p: string) => http().post('/auth/login').send({ login: l, password: p });

  async function activate(l: string, temp: string) {
    const first = (await login(l, temp).expect(200)).body;
    await http().post('/auth/change-password').set({ Authorization: `Bearer ${first.accessToken}` }).send({ currentPassword: temp, newPassword: PW }).expect(204);
    return (await login(l, PW).expect(200)).body.accessToken as string;
  }
  interface Center {
    centerId: string;
    owner: Api;
    main: string;
    second: string;
    course: string;
  }
  async function newCenter(name: string): Promise<Center> {
    const res = await makeApi(rootToken).post('/admin/centers', { name, ownerFullName: 'Rahbar' }).expect(201);
    const owner = makeApi(await activate(res.body.owner.login, res.body.owner.temporaryPassword));
    const second = (await owner.post('/branches', { name: 'Ikkinchi filial' }).expect(201)).body.id as string;
    const course = (await owner.post('/courses', { name: 'Ingliz tili', defaultPrice: 400000 }).expect(201)).body.id as string;
    return { centerId: res.body.center.id, owner, main: res.body.branch.id, second, course };
  }
  async function staff(c: Center, role: 'ADMIN' | 'CASHIER' | 'TEACHER', fullName: string, branchIds: string[]) {
    const res = await c.owner.post('/staff', { role, fullName, branchIds }).expect(201);
    return { id: res.body.user.id as string, api: makeApi(await activate(res.body.user.login, res.body.temporaryPassword)) };
  }
  const group = async (c: Center, body: object) => (await c.owner.post('/groups', { courseId: c.course, branchId: c.main, ...body }).expect(201)).body;

  let A: Center;
  let B: Center;
  let admin1: Awaited<ReturnType<typeof staff>>; // faqat Asosiy filial
  let cashier1: Awaited<ReturnType<typeof staff>>;
  let teacher1: Awaited<ReturnType<typeof staff>>; // Asosiy
  let teacher2: Awaited<ReturnType<typeof staff>>; // Ikkinchi
  let student: Api;

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

    A = await newCenter('Guruh Markazi A');
    B = await newCenter('Guruh Markazi B');
    admin1 = await staff(A, 'ADMIN', 'Admin Bir', [A.main]);
    cashier1 = await staff(A, 'CASHIER', 'Kassir Bir', [A.main]);
    teacher1 = await staff(A, 'TEACHER', 'Ustoz Bir', [A.main]);
    teacher2 = await staff(A, 'TEACHER', 'Ustoz Ikki', [A.second]);
    const st = (await A.owner.post('/students', { fullName: 'Oquvchi Bir', branchId: A.main }).expect(201)).body;
    student = makeApi(await activate(st.student.login, st.temporaryPassword));
  });

  afterAll(async () => {
    await app?.close();
    await pg?.close();
  });

  describe('kurslar', () => {
    it("rahbar va admin yaratadi; nom (registrsiz) takrorlanmaydi; kassir, ustoz, o'quvchi yarata olmaydi", async () => {
      const c = (await A.owner.post('/courses', { name: 'Matematika', defaultPrice: 250000 }).expect(201)).body;
      expect(c).toMatchObject({ name: 'Matematika', defaultPrice: 250000, archivedAt: null });
      expect((await A.owner.post('/courses', { name: 'MATEMATIKA' }).expect(409)).body.code).toBe('COURSE_NAME_TAKEN');
      await admin1.api.post('/courses', { name: 'Fizika' }).expect(201);
      await cashier1.api.post('/courses', { name: 'Kimyo' }).expect(403);
      await teacher1.api.post('/courses', { name: 'Kimyo' }).expect(403);
      await student.post('/courses', { name: 'Kimyo' }).expect(403);
      await A.owner.post('/courses', { name: 'x' }).expect(400);
      await A.owner.post('/courses', { name: 'Manfiy narx', defaultPrice: -1 }).expect(400);
      await A.owner.post('/courses', { name: 'Kasr narx', defaultPrice: 10.5 }).expect(400);
    });

    it("ro'yxat va ko'rish: ustoz kurs narxini ko'rmaydi; boshqa markaz kursi 404; tokensiz 401", async () => {
      const list = (await teacher1.api.get('/courses').expect(200)).body.items as Record<string, unknown>[];
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((c) => !('defaultPrice' in c))).toBe(true);
      expect(((await cashier1.api.get('/courses').expect(200)).body.items as Record<string, unknown>[]).every((c) => 'defaultPrice' in c)).toBe(true);
      await B.owner.get(`/courses/${A.course}`).expect(404);
      await B.owner.patch(`/courses/${A.course}`, { name: 'Hack' }).expect(404);
      await B.owner.post(`/courses/${A.course}/archive`).expect(404);
      expect(((await B.owner.get('/courses').expect(200)).body.items as { id: string }[]).map((x) => x.id)).not.toContain(A.course);
      await student.get('/courses').expect(403);
      await httpFn().get('/courses').expect(401);
    });

    it("tahrirlash, arxivlash (faol guruh bo'lsa 409), qaytarish; audit", async () => {
      const c = (await A.owner.post('/courses', { name: 'Arxiv Kursi' }).expect(201)).body.id as string;
      expect((await A.owner.patch(`/courses/${c}`, { name: 'Arxiv Kursi 2', defaultPrice: 99000 }).expect(200)).body).toMatchObject({ name: 'Arxiv Kursi 2', defaultPrice: 99000 });
      expect((await A.owner.patch(`/courses/${c}`, { defaultPrice: null }).expect(200)).body.defaultPrice).toBeNull();
      await A.owner.patch(`/courses/${c}`, {}).expect(400);
      await A.owner.patch(`/courses/${c}`, { name: 'Ingliz tili' }).expect(409);

      const g = await group(A, { name: 'Kurs Sinov Guruhi', courseId: c, priceMonthly: 100000 });
      expect((await A.owner.post(`/courses/${c}/archive`).expect(409)).body.code).toBe('COURSE_IN_USE');
      await A.owner.post(`/groups/${g.id}/archive`).expect(200);
      expect((await A.owner.post(`/courses/${c}/archive`).expect(200)).body.archivedAt).not.toBeNull();
      await A.owner.post(`/courses/${c}/archive`).expect(409);
      expect(((await A.owner.get('/courses').expect(200)).body.items as { id: string }[]).map((x) => x.id)).not.toContain(c);
      expect(((await A.owner.get('/courses?includeArchived=true').expect(200)).body.items as { id: string }[]).map((x) => x.id)).toContain(c);
      await A.owner.post(`/courses/${c}/unarchive`).expect(200);
      await A.owner.post(`/courses/${c}/unarchive`).expect(409);

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, c));
      expect(audit.map((x) => x.action)).toEqual(expect.arrayContaining(['course.create', 'course.edit', 'course.archive', 'course.unarchive']));
    });
  });

  describe('guruh yaratish', () => {
    it("sukutlar: narx kursdan, rejim markaz sozlamasidan, to'lov kuni boshlanish sanasidan; jadval saqlanadi; audit", async () => {
      const g = await group(A, {
        name: 'Ingliz A1',
        startDate: '2026-09-17',
        schedule: [
          { weekday: 3, startTime: '14:00', endTime: '15:30', room: '101' },
          { weekday: 1, startTime: '09:00', endTime: '10:30' },
        ],
      });
      expect(g).toMatchObject({
        name: 'Ingliz A1',
        branchName: 'Asosiy filial',
        courseName: 'Ingliz tili',
        priceMonthly: 400000,
        billingMode: 'GROUP_CYCLE',
        billingDay: 17,
        graceDays: 0,
        status: 'PLANNED',
        startDate: '2026-09-17',
        teachers: [],
      });
      expect(g.schedule.map((x: { weekday: number; startTime: string }) => [x.weekday, x.startTime])).toEqual([[1, '09:00'], [3, '14:00']]); // kun bo'yicha tartiblangan
      expect(g.schedule[1]).toMatchObject({ endTime: '15:30', room: '101' });

      const late = await group(A, { name: 'Oxirgi Kun', startDate: '2026-09-30' });
      expect(late.billingDay).toBe(28); // 28 dan oshmaydi
      expect((await group(A, { name: 'Sanasiz' })).billingDay).toBe(1);

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, g.id));
      expect(audit.find((x) => x.action === 'group.create')?.after).toMatchObject({ name: 'Ingliz A1', priceMonthly: 400000 });
    });

    it("moliyaviy maydonlar faqat group.billing_settings bilan; admin uchun ○ yoqilsa ishlaydi", async () => {
      const c = await newCenter('Billing Ruxsati');
      const adm = await staff(c, 'ADMIN', 'Admin Billing', [c.main]);
      const body = { courseId: c.course, branchId: c.main };
      await adm.api.post('/groups', { ...body, name: 'Sukut Guruh' }).expect(201); // billing maydonlarisiz mumkin
      await adm.api.post('/groups', { ...body, name: 'Narxli', priceMonthly: 1 }).expect(403);
      await adm.api.post('/groups', { ...body, name: 'Rejimli', billingMode: 'STUDENT_CYCLE' }).expect(403);
      await adm.api.post('/groups', { ...body, name: 'Gracel', graceDays: 3 }).expect(403);

      await c.owner.put('/permissions/roles/ADMIN', { permissions: { 'group.billing_settings': true } }).expect(200);
      const g = (await adm.api.post('/groups', { ...body, name: 'Ruxsatli', priceMonthly: 555000, billingMode: 'GROUP_CYCLE', billingDay: 10, graceDays: 3 }).expect(201)).body;
      expect(g).toMatchObject({ priceMonthly: 555000, billingDay: 10, graceDays: 3 });
    });

    it("STUDENT_CYCLE'da to'lov kuni yo'q; kurs narxi ham, guruh narxi ham bo'lmasa 400; sana va jadval xatolari 400", async () => {
      const sc = await group(A, { name: 'Talaba Sikli', billingMode: 'STUDENT_CYCLE' });
      expect(sc).toMatchObject({ billingMode: 'STUDENT_CYCLE', billingDay: null });
      await A.owner.post('/groups', { courseId: A.course, branchId: A.main, name: 'Kunli', billingMode: 'STUDENT_CYCLE', billingDay: 5 }).expect(400);

      const free = (await A.owner.post('/courses', { name: 'Narxsiz Kurs' }).expect(201)).body.id as string;
      expect((await A.owner.post('/groups', { courseId: free, branchId: A.main, name: 'Narxsiz' }).expect(400)).body.code).toBe('PRICE_REQUIRED');
      await group(A, { name: 'Narxi Berilgan', courseId: free, priceMonthly: 0 }); // 0 = bepul, ruxsat etiladi

      const base = { courseId: A.course, branchId: A.main };
      expect((await A.owner.post('/groups', { ...base, name: 'Sana Xato', startDate: '2026-10-10', endDate: '2026-10-01' }).expect(400)).body.code).toBe('INVALID_DATES');
      await A.owner.post('/groups', { ...base, name: 'Kun Xato', billingDay: 29 }).expect(400);
      await A.owner.post('/groups', { ...base, name: 'Grace Xato', graceDays: 61 }).expect(400);
      await A.owner.post('/groups', { ...base, name: 'Vaqt Xato', schedule: [{ weekday: 1, startTime: '10:00', endTime: '09:00' }] }).expect(400);
      await A.owner.post('/groups', { ...base, name: 'Format Xato', schedule: [{ weekday: 1, startTime: '9:00', endTime: '10:00' }] }).expect(400);
      await A.owner.post('/groups', { ...base, name: 'Kun 8', schedule: [{ weekday: 8, startTime: '09:00', endTime: '10:00' }] }).expect(400);
      await A.owner.post('/groups', { ...base, name: 'Kesishuv', schedule: [{ weekday: 1, startTime: '09:00', endTime: '10:30' }, { weekday: 1, startTime: '10:00', endTime: '11:00' }] }).expect(400);
      await A.owner.post('/groups', { ...base, name: 'Ketma-ket', schedule: [{ weekday: 1, startTime: '09:00', endTime: '10:00' }, { weekday: 1, startTime: '10:00', endTime: '11:00' }] }).expect(201);
    });

    it("guruh nomi filial ichida noyob (registrsiz), boshqa filialda takrorlanishi mumkin; xatoda yarim holda hech narsa qolmaydi", async () => {
      await group(A, { name: 'Noyob Nom' });
      expect((await A.owner.post('/groups', { courseId: A.course, branchId: A.main, name: 'NOYOB nom' }).expect(409)).body.code).toBe('GROUP_NAME_TAKEN');
      await group(A, { name: 'Noyob Nom', branchId: A.second });

      const before = (await db.select().from(s.groups).where(eq(s.groups.centerId, A.centerId))).length;
      await A.owner.post('/groups', { courseId: A.course, branchId: A.main, name: 'Rollback', schedule: [{ weekday: 1, startTime: '09:00', endTime: '10:00' }, { weekday: 1, startTime: '09:00', endTime: '10:00' }] }).expect(400);
      expect((await db.select().from(s.groups).where(eq(s.groups.centerId, A.centerId))).length).toBe(before);
    });

    it("filial va kurs: noma'lum, arxivlangan va boshqa markaz 404; admin faqat o'z filialida; boshqa rollar 403", async () => {
      const base = { name: 'Ref Test' };
      await A.owner.post('/groups', { ...base, courseId: A.course, branchId: NOPE }).expect(404);
      await A.owner.post('/groups', { ...base, courseId: NOPE, branchId: A.main }).expect(404);
      await A.owner.post('/groups', { ...base, courseId: A.course, branchId: B.main }).expect(404);
      await A.owner.post('/groups', { ...base, courseId: B.course, branchId: A.main }).expect(404);
      const tmpBranch = (await A.owner.post('/branches', { name: 'Yopiq Filial' }).expect(201)).body.id as string;
      await A.owner.post(`/branches/${tmpBranch}/archive`).expect(200);
      await A.owner.post('/groups', { ...base, courseId: A.course, branchId: tmpBranch }).expect(404);
      const tmpCourse = (await A.owner.post('/courses', { name: 'Yopiq Kurs', defaultPrice: 1 }).expect(201)).body.id as string;
      await A.owner.post(`/courses/${tmpCourse}/archive`).expect(200);
      await A.owner.post('/groups', { ...base, courseId: tmpCourse, branchId: A.main }).expect(404);

      await admin1.api.post('/groups', { ...base, name: 'Admin Guruhi', courseId: A.course, branchId: A.main }).expect(201);
      await admin1.api.post('/groups', { ...base, name: 'Begona Filial', courseId: A.course, branchId: A.second }).expect(403);
      for (const api of [cashier1.api, teacher1.api, student]) await api.post('/groups', { ...base, courseId: A.course, branchId: A.main }).expect(403);
      await httpFn().post('/groups').send({}).expect(401);
    });
  });

  describe("ro'yxat, ko'rish va qamrov", () => {
    let g1: { id: string }; // Asosiy filial, teacher1
    let g2: { id: string }; // Ikkinchi filial, teacher2
    let g3: { id: string }; // Asosiy filial, ustozsiz
    beforeAll(async () => {
      g1 = await group(A, { name: 'Qamrov 1', status: 'ACTIVE' });
      g2 = await group(A, { name: 'Qamrov 2', branchId: A.second });
      g3 = await group(A, { name: 'Qamrov 3' });
      await A.owner.post(`/groups/${g1.id}/teachers`, { teacherId: teacher1.id }).expect(200);
      await A.owner.post(`/groups/${g2.id}/teachers`, { teacherId: teacher2.id }).expect(200);
    });
    const ids = async (api: Api, qs = '') => ((await api.get(`/groups?limit=200${qs}`).expect(200)).body.items as { id: string }[]).map((x) => x.id);

    it("rahbar hammasini, admin va kassir faqat o'z filialini, ustoz faqat o'z guruhlarini ko'radi", async () => {
      expect(await ids(A.owner)).toEqual(expect.arrayContaining([g1.id, g2.id, g3.id]));
      for (const api of [admin1.api, cashier1.api]) {
        const seen = await ids(api);
        expect(seen).toEqual(expect.arrayContaining([g1.id, g3.id]));
        expect(seen).not.toContain(g2.id);
      }
      expect((await ids(teacher1.api)).sort()).toEqual([g1.id]);
      expect((await ids(teacher2.api)).sort()).toEqual([g2.id]);
      expect((await student.get('/groups').expect(200)).body.items).toEqual([]); // yozilmagan o'quvchi guruh ko'rmaydi (yozilganlari enrollments testida)
      await student.get(`/groups/${g1.id}`).expect(404);
    });

    it("filtrlar: filial, kurs, holat, ustoz, nom bo'yicha qidiruv, arxiv; qamrovdan tashqari filial filtri bo'sh", async () => {
      expect(await ids(A.owner, `&branchId=${A.second}`)).toContain(g2.id);
      expect(await ids(A.owner, `&branchId=${A.second}`)).not.toContain(g1.id);
      expect(await ids(A.owner, '&status=ACTIVE')).toContain(g1.id);
      expect(await ids(A.owner, '&status=ACTIVE')).not.toContain(g3.id);
      expect(await ids(A.owner, `&teacherId=${teacher1.id}`)).toEqual([g1.id]);
      expect(await ids(A.owner, '&q=qamrov 2')).toEqual([g2.id]);
      expect(await ids(A.owner, `&q=${encodeURIComponent('%')}`)).toEqual([]);
      expect(await ids(A.owner, `&courseId=${B.course}`)).toEqual([]);
      expect(await ids(admin1.api, `&branchId=${A.second}`)).toEqual([]);
      expect((await A.owner.get('/groups?limit=1').expect(200)).body.items).toHaveLength(1);
      await A.owner.get('/groups?status=BAD').expect(400);
      await A.owner.get('/groups?limit=0').expect(400);

      const arch = await group(A, { name: 'Arxiv Filtr' });
      await A.owner.post(`/groups/${arch.id}/archive`).expect(200);
      expect(await ids(A.owner)).not.toContain(arch.id);
      expect(await ids(A.owner, '&includeArchived=true')).toContain(arch.id);
    });

    it("ustoz narx va sikl sozlamasini ko'rmaydi; kassir ko'radi; ustoz va jadval/ustozlar ma'lumoti ko'rinadi", async () => {
      const t = (await teacher1.api.get(`/groups/${g1.id}`).expect(200)).body;
      for (const k of ['priceMonthly', 'billingMode', 'billingDay', 'graceDays']) expect(t).not.toHaveProperty(k);
      expect(t.teachers).toEqual([expect.objectContaining({ teacherId: teacher1.id, fullName: 'Ustoz Bir', kind: 'MAIN' })]);
      const c = (await cashier1.api.get(`/groups/${g1.id}`).expect(200)).body;
      expect(c).toMatchObject({ priceMonthly: 400000, billingMode: 'GROUP_CYCLE' });
    });

    it("ko'rish: qamrovdan tashqari, biriktirilmagan ustoz, boshqa markaz va noma'lum guruh 404", async () => {
      await admin1.api.get(`/groups/${g2.id}`).expect(404);
      await cashier1.api.get(`/groups/${g2.id}`).expect(404);
      await teacher1.api.get(`/groups/${g2.id}`).expect(404);
      await teacher1.api.get(`/groups/${g3.id}`).expect(404);
      await B.owner.get(`/groups/${g1.id}`).expect(404);
      await A.owner.get(`/groups/${NOPE}`).expect(404);
      await A.owner.get('/groups/not-a-uuid').expect(400);
      expect(await ids(B.owner)).not.toContain(g1.id);
    });
  });

  describe('tahrirlash', () => {
    it("nom, kurs, sana, holat o'zgaradi; moliya maydonlari ruxsat talab qiladi; admin o'z qamrovida; audit before/after", async () => {
      const g = await group(A, { name: 'Tahrir Guruhi' });
      const other = (await A.owner.post('/courses', { name: 'Boshqa Kurs', defaultPrice: 1 }).expect(201)).body.id as string;
      const upd = (await A.owner.patch(`/groups/${g.id}`, { name: 'Tahrir Yangi', courseId: other, status: 'ACTIVE', startDate: '2026-10-01', endDate: '2026-12-31' }).expect(200)).body;
      expect(upd).toMatchObject({ name: 'Tahrir Yangi', courseId: other, courseName: 'Boshqa Kurs', status: 'ACTIVE', startDate: '2026-10-01', endDate: '2026-12-31' });
      expect((await A.owner.patch(`/groups/${g.id}`, { endDate: null }).expect(200)).body.endDate).toBeNull();

      await admin1.api.patch(`/groups/${g.id}`, { name: 'Admin Tahrir' }).expect(200);
      await admin1.api.patch(`/groups/${g.id}`, { priceMonthly: 1 }).expect(403);
      await admin1.api.patch(`/groups/${g.id}`, { graceDays: 2 }).expect(403);
      await cashier1.api.patch(`/groups/${g.id}`, { name: 'Hack' }).expect(403);
      await teacher1.api.patch(`/groups/${g.id}`, { name: 'Hack' }).expect(403);
      await B.owner.patch(`/groups/${g.id}`, { name: 'Hack' }).expect(404);

      await A.owner.patch(`/groups/${g.id}`, {}).expect(400);
      await A.owner.patch(`/groups/${g.id}`, { courseId: NOPE }).expect(404);
      await A.owner.patch(`/groups/${g.id}`, { name: 'Ingliz A1' }).expect(409);

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, g.id));
      const edit = audit.find((x) => x.action === 'group.edit')!;
      expect(edit.before).toMatchObject({ name: 'Tahrir Guruhi', status: 'PLANNED' });
      expect(edit.after).toMatchObject({ name: 'Tahrir Yangi', status: 'ACTIVE' });
    });

    it("filial o'zgarmaydi (maydon e'tiborsiz); sana tartibi tekshiriladi", async () => {
      const g = await group(A, { name: 'Filial Qotgan' });
      const res = (await A.owner.patch(`/groups/${g.id}`, { name: 'Filial Qotgan 2', branchId: A.second } as never).expect(200)).body;
      expect(res.branchId).toBe(A.main);
      await A.owner.patch(`/groups/${g.id}`, { startDate: '2026-05-10', endDate: '2026-05-01' }).expect(400);
    });

    it("sikl rejimi: GROUP_CYCLE <-> STUDENT_CYCLE qoidalari", async () => {
      const g = await group(A, { name: 'Rejim Guruhi', billingDay: 12 });
      expect(g).toMatchObject({ billingMode: 'GROUP_CYCLE', billingDay: 12 });
      expect((await A.owner.patch(`/groups/${g.id}`, { billingDay: 20 }).expect(200)).body.billingDay).toBe(20);
      const toStudent = (await A.owner.patch(`/groups/${g.id}`, { billingMode: 'STUDENT_CYCLE' }).expect(200)).body;
      expect(toStudent).toMatchObject({ billingMode: 'STUDENT_CYCLE', billingDay: null });
      expect((await A.owner.patch(`/groups/${g.id}`, { billingDay: 5 }).expect(400)).body.code).toBe('BILLING_DAY_NOT_ALLOWED');
      expect((await A.owner.patch(`/groups/${g.id}`, { billingMode: 'GROUP_CYCLE' }).expect(400)).body.code).toBe('BILLING_DAY_REQUIRED');
      expect((await A.owner.patch(`/groups/${g.id}`, { billingMode: 'GROUP_CYCLE', billingDay: 3 }).expect(200)).body).toMatchObject({ billingMode: 'GROUP_CYCLE', billingDay: 3 });
    });

    it("arxivlash va qaytarish; arxivlangan guruhga ustoz biriktirib bo'lmaydi", async () => {
      const g = await group(A, { name: 'Arxivlanadigan' });
      expect((await A.owner.post(`/groups/${g.id}/archive`).expect(200)).body.archivedAt).not.toBeNull();
      await A.owner.post(`/groups/${g.id}/archive`).expect(409);
      expect((await A.owner.post(`/groups/${g.id}/teachers`, { teacherId: teacher1.id }).expect(409)).body.code).toBe('GROUP_ARCHIVED');
      await cashier1.api.post(`/groups/${g.id}/archive`).expect(403);
      await B.owner.post(`/groups/${g.id}/unarchive`).expect(404);
      await A.owner.post(`/groups/${g.id}/unarchive`).expect(200);
      await A.owner.post(`/groups/${g.id}/unarchive`).expect(409);
    });
  });

  describe('dars jadvali', () => {
    it("PUT jadvalni to'liq almashtiradi, bo'sh ro'yxat tozalaydi; kesishuv 400 va eski jadval saqlanadi; audit", async () => {
      const g = await group(A, { name: 'Jadval Guruhi', schedule: [{ weekday: 2, startTime: '10:00', endTime: '11:00' }] });
      const next = (await A.owner.put(`/groups/${g.id}/schedule`, { schedule: [{ weekday: 4, startTime: '16:00', endTime: '17:30', room: 'A-2' }, { weekday: 6, startTime: '10:00', endTime: '12:00' }] }).expect(200)).body;
      expect(next.schedule.map((x: { weekday: number }) => x.weekday)).toEqual([4, 6]);
      expect(next.schedule[0]).toMatchObject({ startTime: '16:00', endTime: '17:30', room: 'A-2' });

      await A.owner.put(`/groups/${g.id}/schedule`, { schedule: [{ weekday: 1, startTime: '09:00', endTime: '10:00' }, { weekday: 1, startTime: '09:30', endTime: '10:30' }] }).expect(400);
      expect(((await A.owner.get(`/groups/${g.id}`).expect(200)).body.schedule as unknown[]).length).toBe(2); // o'zgarmagan

      expect((await A.owner.put(`/groups/${g.id}/schedule`, { schedule: [] }).expect(200)).body.schedule).toEqual([]);
      await admin1.api.put(`/groups/${g.id}/schedule`, { schedule: [{ weekday: 5, startTime: '08:00', endTime: '09:00' }] }).expect(200);
      await cashier1.api.put(`/groups/${g.id}/schedule`, { schedule: [] }).expect(403);
      await teacher1.api.put(`/groups/${g.id}/schedule`, { schedule: [] }).expect(403);
      await B.owner.put(`/groups/${g.id}/schedule`, { schedule: [] }).expect(404);
      await A.owner.put(`/groups/${g.id}/schedule`, {}).expect(400);

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, g.id));
      expect(audit.filter((x) => x.action === 'group.schedule_update').length).toBe(3);
    });
  });

  describe('ustozlar', () => {
    it("asosiy ustoz bitta; yordamchi qo'shiladi; takror va noto'g'ri ustoz rad etiladi", async () => {
      const g = await group(A, { name: 'Ustozli Guruh' });
      const a = (await A.owner.post(`/groups/${g.id}/teachers`, { teacherId: teacher1.id }).expect(200)).body;
      expect(a.teachers).toEqual([expect.objectContaining({ teacherId: teacher1.id, kind: 'MAIN', toDate: null })]);

      const t3 = await staff(A, 'TEACHER', 'Ustoz Uch', [A.main]);
      expect((await A.owner.post(`/groups/${g.id}/teachers`, { teacherId: t3.id, kind: 'MAIN' }).expect(409)).body.code).toBe('MAIN_TEACHER_EXISTS');
      const b = (await A.owner.post(`/groups/${g.id}/teachers`, { teacherId: t3.id, kind: 'ASSISTANT' }).expect(200)).body;
      expect(b.teachers.map((x: { kind: string }) => x.kind)).toEqual(['ASSISTANT', 'MAIN']);
      expect((await A.owner.post(`/groups/${g.id}/teachers`, { teacherId: t3.id, kind: 'ASSISTANT' }).expect(409)).body.code).toBe('TEACHER_ALREADY_ASSIGNED');

      expect((await A.owner.post(`/groups/${g.id}/teachers`, { teacherId: teacher2.id }).expect(400)).body.code).toBe('TEACHER_NOT_IN_BRANCH'); // boshqa filial ustozi
      await A.owner.post(`/groups/${g.id}/teachers`, { teacherId: admin1.id, kind: 'ASSISTANT' }).expect(404); // ustoz emas
      await A.owner.post(`/groups/${g.id}/teachers`, { teacherId: NOPE }).expect(404);
      await A.owner.post(`/groups/${g.id}/teachers`, { teacherId: teacher1.id, kind: 'BOSS' }).expect(400);

      const bt = await staff(B, 'TEACHER', 'Begona Ustoz', [B.main]);
      await A.owner.post(`/groups/${g.id}/teachers`, { teacherId: bt.id }).expect(404); // boshqa markaz
      await cashier1.api.post(`/groups/${g.id}/teachers`, { teacherId: t3.id }).expect(403);
      await B.owner.post(`/groups/${g.id}/teachers`, { teacherId: bt.id }).expect(404);
    });

    it("to'xtatilgan ustozni biriktirib bo'lmaydi", async () => {
      const g = await group(A, { name: 'Toxtagan Ustoz' });
      const t = await staff(A, 'TEACHER', 'Toxtagan', [A.main]);
      await A.owner.patch(`/staff/${t.id}`, { status: 'SUSPENDED' }).expect(200);
      expect((await A.owner.post(`/groups/${g.id}/teachers`, { teacherId: t.id }).expect(409)).body.code).toBe('TEACHER_INACTIVE');
    });

    it("ustozni olib tashlash: guruhdan chiqadi, kirish huquqi yo'qoladi, tarix saqlanadi; asosiy ustoz qayta tayinlanadi", async () => {
      const g = await group(A, { name: 'Almashuv Guruhi' });
      const t = await staff(A, 'TEACHER', 'Almashadigan', [A.main]);
      await A.owner.post(`/groups/${g.id}/teachers`, { teacherId: t.id }).expect(200);
      await t.api.get(`/groups/${g.id}`).expect(200);

      const ended = (await A.owner.post(`/groups/${g.id}/teachers/${t.id}/end`, { toDate: '2020-01-01' }).expect(400)).body; // boshlanishdan oldin
      expect(ended.code).toBe('INVALID_DATES');
      const res = (await A.owner.post(`/groups/${g.id}/teachers/${t.id}/end`).expect(200)).body;
      expect(res.teachers).toEqual([expect.objectContaining({ teacherId: t.id })]); // bugun tugaydi: bugun hali amalda
      await A.owner.post(`/groups/${g.id}/teachers/${t.id}/end`).expect(404); // allaqachon tugagan

      // Tarix saqlangan, yangi asosiy ustoz endi biriktiriladi
      const rows = await db.select().from(s.groupTeachers).where(eq(s.groupTeachers.groupId, g.id));
      expect(rows).toHaveLength(1);
      expect(rows[0]!.toDate).not.toBeNull();
      await A.owner.post(`/groups/${g.id}/teachers`, { teacherId: teacher1.id }).expect(200);

      await A.owner.post(`/groups/${g.id}/teachers/${NOPE}/end`).expect(404);
      await cashier1.api.post(`/groups/${g.id}/teachers/${teacher1.id}/end`).expect(403);
      await B.owner.post(`/groups/${g.id}/teachers/${teacher1.id}/end`).expect(404);
    });

    it("o'tmishdagi sana bilan tugatilgan ustoz guruhni ko'rmaydi", async () => {
      const g = await group(A, { name: 'Otgan Ustoz', startDate: '2020-01-01' });
      const t = await staff(A, 'TEACHER', 'Otgan Ustozi', [A.main]);
      await A.owner.post(`/groups/${g.id}/teachers`, { teacherId: t.id, fromDate: '2020-01-01' }).expect(200);
      await A.owner.post(`/groups/${g.id}/teachers/${t.id}/end`, { toDate: '2020-06-01' }).expect(200);
      await t.api.get(`/groups/${g.id}`).expect(404);
      expect(((await A.owner.get(`/groups/${g.id}`).expect(200)).body.teachers as unknown[]).length).toBe(0);
    });
  });
});
