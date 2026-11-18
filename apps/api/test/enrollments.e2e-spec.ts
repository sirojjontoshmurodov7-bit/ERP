// 10-qadam: yozilish (qo'shish, muzlatish, chiqarish, ko'chirish) va ustoz/o'quvchi qamrovi. PGlite, RLS yoqilgan.
import { PERMISSIONS } from '@erp/shared';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { and, eq } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { addDays, todayLocal } from '../src/common/dates.js';
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
const TODAY = todayLocal();
type Api = ReturnType<typeof makeApi>;
let httpFn: () => request.Agent;
const makeApi = (t: string) => ({
  get: (p: string) => httpFn().get(p).set({ Authorization: `Bearer ${t}` }),
  post: (p: string, b: object = {}) => httpFn().post(p).set({ Authorization: `Bearer ${t}` }).send(b),
  put: (p: string, b: object) => httpFn().put(p).set({ Authorization: `Bearer ${t}` }).send(b),
});

describe('Yozilish (PGlite, RLS yoqilgan)', () => {
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
  async function mkStudent(c: Center, fullName: string, branchId: string) {
    const res = await c.owner.post('/students', { fullName, branchId }).expect(201);
    const login = res.body.student.login as string;
    let cached: Promise<Api> | undefined; // vaqtinchalik parol bir marta ishlaydi: token keshlanadi
    return { id: res.body.student.id as string, login, temp: res.body.temporaryPassword as string, api: () => (cached ??= activate(login, res.body.temporaryPassword).then(makeApi)) };
  }
  const mkGroup = async (c: Center, name: string, extra: object = {}) =>
    (await c.owner.post('/groups', { name, courseId: c.course, branchId: c.main, ...extra }).expect(201)).body as { id: string };
  const enroll = (c: Center, groupId: string, studentId: string, extra: object = {}) => c.owner.post('/enrollments', { groupId, studentId, ...extra });
  const enrollId = async (c: Center, groupId: string, studentId: string, extra: object = {}) => (await enroll(c, groupId, studentId, extra).expect(201)).body.id as string;

  let A: Center;
  let B: Center;
  let admin1: Awaited<ReturnType<typeof staff>>; // faqat Asosiy filial
  let cashier1: Awaited<ReturnType<typeof staff>>;
  let teacher1: Awaited<ReturnType<typeof staff>>; // Asosiy
  let teacher2: Awaited<ReturnType<typeof staff>>; // Ikkinchi

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

    A = await newCenter('Yozilish Markazi A');
    B = await newCenter('Yozilish Markazi B');
    admin1 = await staff(A, 'ADMIN', 'Admin Bir', [A.main]);
    cashier1 = await staff(A, 'CASHIER', 'Kassir Bir', [A.main]);
    teacher1 = await staff(A, 'TEACHER', 'Ustoz Bir', [A.main]);
    teacher2 = await staff(A, 'TEACHER', 'Ustoz Ikki', [A.second]);
  });

  afterAll(async () => {
    await app?.close();
    await pg?.close();
  });

  describe("qo'shish", () => {
    it("rahbar yozadi: sukut sana bugun, billing_anchor GROUP_CYCLE'da yo'q, STUDENT_CYCLE'da yozilgan sana; audit", async () => {
      const g = await mkGroup(A, 'Qoshish 1');
      const st = await mkStudent(A, 'Qoshiladigan Bir', A.main);
      const res = (await enroll(A, g.id, st.id).expect(201)).body;
      expect(res).toMatchObject({ groupId: g.id, groupName: 'Qoshish 1', branchName: 'Asosiy filial', courseName: 'Ingliz tili', studentId: st.id, studentName: 'Qoshiladigan Bir', status: 'ACTIVE', joinedAt: TODAY, leftAt: null, billingAnchor: null, priceOverride: null });

      const sc = await mkGroup(A, 'Qoshish Talaba Sikli', { billingMode: 'STUDENT_CYCLE' });
      const st2 = await mkStudent(A, 'Qoshiladigan Ikki', A.main);
      const e2 = (await enroll(A, sc.id, st2.id, { joinedAt: '2026-03-15' }).expect(201)).body;
      expect(e2).toMatchObject({ joinedAt: '2026-03-15', billingAnchor: '2026-03-15' });

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, res.id));
      expect(audit.find((x) => x.action === 'enrollment.create')?.after).toMatchObject({ groupId: g.id, studentId: st.id, status: 'ACTIVE' });
    });

    it("takror yozilish 409; chiqqandan keyin qayta yozilish mumkin; boshqa guruhga bir vaqtda yozilish mumkin", async () => {
      const g1 = await mkGroup(A, 'Takror 1');
      const g2 = await mkGroup(A, 'Takror 2');
      const st = await mkStudent(A, 'Takror Oquvchi', A.main);
      const id = await enrollId(A, g1.id, st.id);
      expect((await enroll(A, g1.id, st.id).expect(409)).body.code).toBe('ALREADY_ENROLLED');
      await enrollId(A, g2.id, st.id);

      await A.owner.post(`/enrollments/${id}/freeze`).expect(200);
      expect((await enroll(A, g1.id, st.id).expect(409)).body.code).toBe('ALREADY_ENROLLED'); // muzlatilgan ham ochiq yozilish
      await A.owner.post(`/enrollments/${id}/leave`).expect(200);
      await enrollId(A, g1.id, st.id); // endi mumkin: eski qator tarixda qoladi
      const rows = await db.select().from(s.enrollments).where(and(eq(s.enrollments.groupId, g1.id), eq(s.enrollments.studentId, st.id)));
      expect(rows.map((r) => r.status).sort()).toEqual(['ACTIVE', 'LEFT']);
    });

    it("arxivlangan va tugagan guruhga, arxivlangan o'quvchiga yozib bo'lmaydi", async () => {
      const st = await mkStudent(A, 'Cheklov Oquvchi', A.main);
      const arch = await mkGroup(A, 'Arxiv Cheklov');
      await A.owner.post(`/groups/${arch.id}/archive`).expect(200);
      expect((await enroll(A, arch.id, st.id).expect(409)).body.code).toBe('GROUP_ARCHIVED');
      const fin = await mkGroup(A, 'Tugagan Cheklov', { status: 'ACTIVE' });
      await db.update(s.groups).set({ status: 'FINISHED' }).where(eq(s.groups.id, fin.id));
      expect((await enroll(A, fin.id, st.id).expect(409)).body.code).toBe('GROUP_FINISHED');

      const g = await mkGroup(A, 'Arxiv Oquvchi Guruhi');
      const gone = await mkStudent(A, 'Arxiv Oquvchi', A.main);
      await A.owner.post(`/students/${gone.id}/archive`).expect(200);
      expect((await enroll(A, g.id, gone.id).expect(409)).body.code).toBe('STUDENT_INACTIVE');
    });

    it("noto'g'ri kiritish 400, noma'lum va boshqa markaz yozuvlari 404", async () => {
      const g = await mkGroup(A, 'Tekshiruv Guruhi');
      const st = await mkStudent(A, 'Tekshiruv Oquvchi', A.main);
      await A.owner.post('/enrollments', {}).expect(400);
      await enroll(A, g.id, st.id, { joinedAt: '15.03.2026' }).expect(400);
      await enroll(A, g.id, st.id, { priceOverride: -5 }).expect(400);
      await enroll(A, NOPE, st.id).expect(404);
      await enroll(A, g.id, NOPE).expect(404);
      const bGroup = await mkGroup(B, 'Begona Guruh');
      const bStudent = await mkStudent(B, 'Begona Oquvchi', B.main);
      await enroll(A, bGroup.id, st.id).expect(404);
      await enroll(A, g.id, bStudent.id).expect(404);
      const staffId = teacher1.id; // xodim o'quvchi emas
      await enroll(A, g.id, staffId).expect(404);
    });

    it("individual narx (price_override) faqat group.billing_settings bilan", async () => {
      const c = await newCenter('Narx Ruxsati');
      const adm = await staff(c, 'ADMIN', 'Admin Narx', [c.main]);
      const g = await mkGroup(c, 'Narx Guruhi');
      const a = await mkStudent(c, 'Narx Bir', c.main);
      const b = await mkStudent(c, 'Narx Ikki', c.main);
      await adm.api.post('/enrollments', { groupId: g.id, studentId: a.id, priceOverride: 100000 }).expect(403);
      expect((await enroll(c, g.id, b.id, { priceOverride: 150000 }).expect(201)).body.priceOverride).toBe(150000);
      await c.owner.put('/permissions/roles/ADMIN', { permissions: { 'group.billing_settings': true } }).expect(200);
      expect((await adm.api.post('/enrollments', { groupId: g.id, studentId: a.id, priceOverride: 100000 }).expect(201)).body.priceOverride).toBe(100000);
    });

    it("admin faqat o'z filialida va o'z filiali o'quvchisini yozadi; kassir, ustoz, o'quvchi va tokensiz rad etiladi", async () => {
      const gMain = await mkGroup(A, 'Admin Guruhi');
      const gSecond = await mkGroup(A, 'Admin Begona Guruh', { branchId: A.second });
      const sMain = await mkStudent(A, 'Admin Oquvchisi', A.main);
      const sSecond = await mkStudent(A, 'Begona Filial Oquvchisi', A.second);
      await admin1.api.post('/enrollments', { groupId: gMain.id, studentId: sMain.id }).expect(201);
      await admin1.api.post('/enrollments', { groupId: gSecond.id, studentId: sMain.id }).expect(404); // guruh qamrovdan tashqari
      await admin1.api.post('/enrollments', { groupId: gMain.id, studentId: sSecond.id }).expect(404); // o'quvchi qamrovdan tashqari
      for (const api of [cashier1.api, teacher1.api]) await api.post('/enrollments', { groupId: gMain.id, studentId: sMain.id }).expect(403);
      const st = await sMain.api();
      await st.post('/enrollments', { groupId: gMain.id, studentId: sMain.id }).expect(403);
      await httpFn().post('/enrollments').send({}).expect(401);
    });

    it("boshqa filial guruhiga yozilsa o'quvchiga o'sha filial avtomatik biriktiriladi", async () => {
      const gSecond = await mkGroup(A, 'Filial Almashuv', { branchId: A.second });
      const st = await mkStudent(A, 'Ikki Filialli', A.main);
      await enroll(A, gSecond.id, st.id).expect(201);
      const links = await db.select().from(s.userBranches).where(eq(s.userBranches.userId, st.id));
      expect(links.map((l) => l.branchId).sort()).toEqual([A.main, A.second].sort());
      // endi ikkinchi filial admini (yo'q) emas, lekin o'quvchi ikkala filialda ko'rinadi
      const inSecond = (await A.owner.get(`/students?branchId=${A.second}&limit=200`).expect(200)).body.items as { id: string }[];
      expect(inSecond.map((x) => x.id)).toContain(st.id);
    });
  });

  describe("muzlatish, chiqarish", () => {
    it("muzlatish/qaytarish/chiqarish holat qoidalari va sanalar", async () => {
      const g = await mkGroup(A, 'Holat Guruhi');
      const st = await mkStudent(A, 'Holat Oquvchi', A.main);
      const id = await enrollId(A, g.id, st.id, { joinedAt: '2026-01-10' });

      await A.owner.post(`/enrollments/${id}/unfreeze`).expect(409); // muzlatilmagan
      expect((await A.owner.post(`/enrollments/${id}/freeze`).expect(200)).body.status).toBe('FROZEN');
      expect((await A.owner.post(`/enrollments/${id}/freeze`).expect(409)).body.code).toBe('ALREADY_FROZEN');
      expect((await A.owner.post(`/enrollments/${id}/unfreeze`).expect(200)).body.status).toBe('ACTIVE');

      expect((await A.owner.post(`/enrollments/${id}/leave`, { leftAt: '2026-01-01' }).expect(400)).body.code).toBe('INVALID_DATES');
      await A.owner.post(`/enrollments/${id}/leave`, { reason: '' }).expect(400);
      const left = (await A.owner.post(`/enrollments/${id}/leave`, { reason: "Ko'chib ketdi", leftAt: '2026-02-01' }).expect(200)).body;
      expect(left).toMatchObject({ status: 'LEFT', leftAt: '2026-02-01', leftReason: "Ko'chib ketdi" });
      expect((await A.owner.post(`/enrollments/${id}/leave`).expect(409)).body.code).toBe('ALREADY_LEFT');
      expect((await A.owner.post(`/enrollments/${id}/freeze`).expect(409)).body.code).toBe('ALREADY_LEFT');
      expect((await A.owner.post(`/enrollments/${id}/unfreeze`).expect(409)).body.code).toBe('ALREADY_LEFT');

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, id));
      expect(audit.map((x) => x.action)).toEqual(expect.arrayContaining(['enrollment.create', 'enrollment.freeze', 'enrollment.unfreeze', 'enrollment.leave']));
      expect(audit.find((x) => x.action === 'enrollment.leave')?.before).toMatchObject({ status: 'ACTIVE' });
    });

    it("sanasiz chiqarish bugun; kelajak sanali yozilishda chiqish yozilish sanasidan oldin bo'lmaydi", async () => {
      const g = await mkGroup(A, 'Sana Guruhi');
      const st = await mkStudent(A, 'Kelajak Oquvchi', A.main);
      const future = addDays(TODAY, 10);
      const id = await enrollId(A, g.id, st.id, { joinedAt: future });
      expect((await A.owner.post(`/enrollments/${id}/leave`).expect(200)).body.leftAt).toBe(future);
      const st2 = await mkStudent(A, 'Bugun Oquvchi', A.main);
      const id2 = await enrollId(A, g.id, st2.id);
      expect((await A.owner.post(`/enrollments/${id2}/leave`).expect(200)).body.leftAt).toBe(TODAY);
    });

    it("admin faqat o'z filialida; kassir/ustoz/o'quvchi 403; boshqa markaz va noma'lum 404", async () => {
      const gMain = await mkGroup(A, 'Holat Ruxsat 1');
      const gSecond = await mkGroup(A, 'Holat Ruxsat 2', { branchId: A.second });
      const sMain = await mkStudent(A, 'Ruxsat Bir', A.main);
      const sSecond = await mkStudent(A, 'Ruxsat Ikki', A.second);
      const idMain = await enrollId(A, gMain.id, sMain.id);
      const idSecond = await enrollId(A, gSecond.id, sSecond.id);

      expect((await admin1.api.post(`/enrollments/${idMain}/freeze`).expect(200)).body.status).toBe('FROZEN');
      await admin1.api.post(`/enrollments/${idSecond}/freeze`).expect(404);
      await admin1.api.post(`/enrollments/${idSecond}/leave`).expect(404);
      for (const api of [cashier1.api, teacher1.api, await sMain.api()]) {
        await api.post(`/enrollments/${idMain}/unfreeze`).expect(403);
        await api.post(`/enrollments/${idMain}/leave`).expect(403);
      }
      await B.owner.post(`/enrollments/${idMain}/leave`).expect(404);
      await A.owner.post(`/enrollments/${NOPE}/leave`).expect(404);
      await A.owner.post('/enrollments/not-a-uuid/freeze').expect(400);
    });
  });

  describe("ko'chirish", () => {
    it("eski yozilish LEFT (TRANSFER) bilan yopiladi, yangi guruhda yangi qator ochiladi; tarix saqlanadi; audit", async () => {
      const from = await mkGroup(A, "Kochirish Eski");
      const to = await mkGroup(A, 'Kochirish Yangi', { billingMode: 'STUDENT_CYCLE' });
      const st = await mkStudent(A, 'Kochadigan Oquvchi', A.main);
      const id = await enrollId(A, from.id, st.id, { joinedAt: '2026-01-05', priceOverride: 100000 });
      await A.owner.post(`/enrollments/${id}/freeze`).expect(200);

      const res = (await A.owner.post(`/enrollments/${id}/transfer`, { toGroupId: to.id, reason: 'Vaqt mos emas', transferDate: '2026-02-01' }).expect(200)).body;
      expect(res.from).toMatchObject({ id, groupId: from.id, status: 'LEFT', leftAt: '2026-02-01', leftReason: 'TRANSFER: Vaqt mos emas' });
      expect(res.to).toMatchObject({ groupId: to.id, studentId: st.id, status: 'ACTIVE', joinedAt: '2026-02-01', billingAnchor: '2026-02-01', priceOverride: null }); // eski individual narx ko'chmaydi
      expect(res.to.id).not.toBe(id);

      const rows = await db.select().from(s.enrollments).where(eq(s.enrollments.studentId, st.id));
      expect(rows).toHaveLength(2);
      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, id));
      expect(audit.find((x) => x.action === 'enrollment.transfer')?.after).toMatchObject({ toEnrollmentId: res.to.id });
    });

    it("sababsiz ko'chirish 'TRANSFER'; teng guruh, tugagan yozilish, band/arxivlangan guruh rad etiladi; xato bo'lsa hech narsa o'zgarmaydi", async () => {
      const g1 = await mkGroup(A, 'Kochirish Xato 1');
      const g2 = await mkGroup(A, 'Kochirish Xato 2');
      const arch = await mkGroup(A, 'Kochirish Arxiv');
      await A.owner.post(`/groups/${arch.id}/archive`).expect(200);
      const st = await mkStudent(A, 'Kochirish Xato Oquvchi', A.main);
      const id = await enrollId(A, g1.id, st.id, { joinedAt: '2026-04-10' });

      expect((await A.owner.post(`/enrollments/${id}/transfer`, { toGroupId: g1.id }).expect(400)).body.code).toBe('SAME_GROUP');
      expect((await A.owner.post(`/enrollments/${id}/transfer`, { toGroupId: arch.id }).expect(409)).body.code).toBe('GROUP_ARCHIVED');
      expect((await A.owner.post(`/enrollments/${id}/transfer`, { toGroupId: g2.id, transferDate: '2026-04-01' }).expect(400)).body.code).toBe('INVALID_DATES');
      await A.owner.post(`/enrollments/${id}/transfer`, { toGroupId: NOPE }).expect(404);
      await A.owner.post(`/enrollments/${id}/transfer`, {}).expect(400);

      await enrollId(A, g2.id, st.id); // allaqachon g2 da
      expect((await A.owner.post(`/enrollments/${id}/transfer`, { toGroupId: g2.id }).expect(409)).body.code).toBe('ALREADY_ENROLLED');
      const stillOpen = (await A.owner.get(`/enrollments/${id}`).expect(200)).body;
      expect(stillOpen.status).toBe('ACTIVE'); // tranzaksiya orqaga qaytdi: eski yozilish yopilmagan

      const g3 = await mkGroup(A, 'Kochirish Xato 3');
      const t = (await A.owner.post(`/enrollments/${id}/transfer`, { toGroupId: g3.id }).expect(200)).body;
      expect(t.from.leftReason).toBe('TRANSFER');
      expect((await A.owner.post(`/enrollments/${id}/transfer`, { toGroupId: g2.id }).expect(409)).body.code).toBe('ALREADY_LEFT');
    });

    it("boshqa filialga ko'chirilsa filial biriktiriladi; admin faqat qamrov ichida; narx ruxsati; ruxsatsiz rollar", async () => {
      const gMain = await mkGroup(A, 'Kochirish Filial 1');
      const gMain2 = await mkGroup(A, 'Kochirish Filial 1b');
      const gSecond = await mkGroup(A, 'Kochirish Filial 2', { branchId: A.second });
      const st = await mkStudent(A, 'Filial Kochadi', A.main);
      const id = await enrollId(A, gMain.id, st.id);

      await admin1.api.post(`/enrollments/${id}/transfer`, { toGroupId: gSecond.id }).expect(404); // maqsad guruh qamrovdan tashqari
      await admin1.api.post(`/enrollments/${id}/transfer`, { toGroupId: gMain2.id, priceOverride: 5 }).expect(403);
      for (const api of [cashier1.api, teacher1.api]) await api.post(`/enrollments/${id}/transfer`, { toGroupId: gMain2.id }).expect(403);
      await B.owner.post(`/enrollments/${id}/transfer`, { toGroupId: gMain2.id }).expect(404);

      await A.owner.post(`/enrollments/${id}/transfer`, { toGroupId: gSecond.id }).expect(200);
      const links = await db.select().from(s.userBranches).where(eq(s.userBranches.userId, st.id));
      expect(links.map((l) => l.branchId).sort()).toEqual([A.main, A.second].sort());
      const adminMove = await mkStudent(A, 'Admin Kochiradi', A.main);
      const id2 = await enrollId(A, gMain.id, adminMove.id);
      expect((await admin1.api.post(`/enrollments/${id2}/transfer`, { toGroupId: gMain2.id }).expect(200)).body.to.groupId).toBe(gMain2.id);
    });
  });

  describe("ko'rish va qamrov", () => {
    let gMain: { id: string };
    let gSecond: { id: string };
    let sMain: Awaited<ReturnType<typeof mkStudent>>;
    let sSecond: Awaited<ReturnType<typeof mkStudent>>;
    let eMain: string;
    let eSecond: string;
    beforeAll(async () => {
      gMain = await mkGroup(A, 'Qamrov Asosiy');
      gSecond = await mkGroup(A, 'Qamrov Ikkinchi', { branchId: A.second });
      await A.owner.post(`/groups/${gMain.id}/teachers`, { teacherId: teacher1.id }).expect(200);
      await A.owner.post(`/groups/${gSecond.id}/teachers`, { teacherId: teacher2.id }).expect(200);
      sMain = await mkStudent(A, 'Qamrov Oquvchi Bir', A.main);
      sSecond = await mkStudent(A, 'Qamrov Oquvchi Ikki', A.second);
      eMain = await enrollId(A, gMain.id, sMain.id, { priceOverride: 200000 });
      eSecond = await enrollId(A, gSecond.id, sSecond.id);
    });
    const ids = async (api: Api, qs = '') => ((await api.get(`/enrollments?limit=200${qs}`).expect(200)).body.items as { id: string }[]).map((x) => x.id);

    it("rahbar hammasini, admin va kassir guruh filiali bo'yicha, ustoz o'z guruhini, o'quvchi o'zinikini ko'radi", async () => {
      expect(await ids(A.owner)).toEqual(expect.arrayContaining([eMain, eSecond]));
      for (const api of [admin1.api, cashier1.api]) {
        const seen = await ids(api);
        expect(seen).toContain(eMain);
        expect(seen).not.toContain(eSecond);
      }
      expect(await ids(teacher1.api)).toEqual([eMain]);
      expect(await ids(teacher2.api)).toEqual([eSecond]);
      expect(await ids(await sMain.api())).toEqual([eMain]);
      expect(await ids(await sSecond.api())).toEqual([eSecond]);
    });

    it("individual narx ustozga ko'rsatilmaydi, kassir va o'quvchiga ko'rsatiladi", async () => {
      expect(await teacher1.api.get(`/enrollments/${eMain}`).expect(200).then((r) => r.body)).not.toHaveProperty('priceOverride');
      expect((await cashier1.api.get(`/enrollments/${eMain}`).expect(200)).body.priceOverride).toBe(200000);
      expect((await (await sMain.api()).get(`/enrollments/${eMain}`).expect(200)).body.priceOverride).toBe(200000);
    });

    it("filtrlar: guruh, o'quvchi, filial, holat, sahifalash", async () => {
      expect(await ids(A.owner, `&groupId=${gMain.id}`)).toEqual([eMain]);
      expect(await ids(A.owner, `&studentId=${sSecond.id}`)).toEqual([eSecond]);
      expect(await ids(A.owner, `&branchId=${A.second}`)).toContain(eSecond);
      expect(await ids(A.owner, `&branchId=${A.second}`)).not.toContain(eMain);
      expect(await ids(admin1.api, `&branchId=${A.second}`)).toEqual([]);
      expect((await A.owner.get('/enrollments?status=LEFT&limit=200').expect(200)).body.items.every((x: { status: string }) => x.status === 'LEFT')).toBe(true);
      expect((await A.owner.get('/enrollments?limit=1').expect(200)).body.items).toHaveLength(1);
      await A.owner.get('/enrollments?status=BAD').expect(400);
      await A.owner.get('/enrollments?groupId=nope').expect(400);
    });

    it("ko'rish: qamrovdan tashqari, boshqa o'quvchi, boshqa markaz va noma'lum yozilish 404", async () => {
      await admin1.api.get(`/enrollments/${eSecond}`).expect(404);
      await cashier1.api.get(`/enrollments/${eSecond}`).expect(404);
      await teacher1.api.get(`/enrollments/${eSecond}`).expect(404);
      await (await sMain.api()).get(`/enrollments/${eSecond}`).expect(404);
      await B.owner.get(`/enrollments/${eMain}`).expect(404);
      await A.owner.get(`/enrollments/${NOPE}`).expect(404);
      expect(await ids(B.owner)).not.toContain(eMain);
      await httpFn().get('/enrollments').expect(401);
    });
  });

  describe("ustoz va o'quvchi: boshqa modullarda yozilish orqali ko'rinish", () => {
    it("ustoz faqat o'z guruhidagi o'quvchilarni ko'radi; chiqqach ko'rinmaydi", async () => {
      const c = await newCenter('Ustoz Korish');
      const t = await staff(c, 'TEACHER', 'Ustoz Korish', [c.main]);
      const g = await mkGroup(c, 'Ustoz Guruhi');
      const other = await mkGroup(c, 'Boshqa Guruh');
      await c.owner.post(`/groups/${g.id}/teachers`, { teacherId: t.id }).expect(200);
      const mine = await mkStudent(c, 'Mening Oquvchim', c.main);
      const theirs = await mkStudent(c, 'Begona Oquvchi', c.main);
      const none = await mkStudent(c, 'Guruhsiz Oquvchi', c.main);
      const e = await enrollId(c, g.id, mine.id);
      await enrollId(c, other.id, theirs.id);

      const list = (await t.api.get('/students?limit=200').expect(200)).body.items as { id: string }[];
      expect(list.map((x) => x.id)).toEqual([mine.id]);
      await t.api.get(`/students/${mine.id}`).expect(200);
      await t.api.get(`/students/${theirs.id}`).expect(404);
      await t.api.get(`/students/${none.id}`).expect(404);
      await t.api.post('/students', { fullName: 'Ustoz Yaratdi', branchId: c.main }).expect(403);
      await t.api.post(`/students/${mine.id}/archive`).expect(403);

      await c.owner.post(`/enrollments/${e}/freeze`).expect(200);
      await t.api.get(`/students/${mine.id}`).expect(200); // muzlatilgan ham guruh a'zosi
      await c.owner.post(`/enrollments/${e}/leave`).expect(200);
      await t.api.get(`/students/${mine.id}`).expect(404);
      expect((await t.api.get('/students').expect(200)).body.items).toEqual([]);
    });

    it("o'quvchi faqat yozilgan guruhini ko'radi (o'z narxi bilan, o'quvchilar sonisiz); chiqqach ko'rmaydi", async () => {
      const c = await newCenter('Oquvchi Korish');
      const g = await mkGroup(c, 'Mening Guruhim', { schedule: [{ weekday: 2, startTime: '10:00', endTime: '11:30' }] });
      const other = await mkGroup(c, 'Begona Guruh');
      const me = await mkStudent(c, 'Men Oquvchi', c.main);
      const e = await enrollId(c, g.id, me.id);
      const api = await me.api();

      const list = (await api.get('/groups').expect(200)).body.items as Record<string, unknown>[];
      expect(list.map((x) => x.id)).toEqual([g.id]);
      expect(list[0]).toMatchObject({ priceMonthly: 400000, billingMode: 'GROUP_CYCLE' });
      expect(list[0]).not.toHaveProperty('studentCount');
      expect((list[0]!.schedule as unknown[]).length).toBe(1);
      await api.get(`/groups/${other.id}`).expect(404);
      await api.post('/groups', { name: 'Hack', courseId: c.course, branchId: c.main }).expect(403);
      await api.get('/courses').expect(403);

      await c.owner.post(`/enrollments/${e}/leave`).expect(200);
      expect((await api.get('/groups').expect(200)).body.items).toEqual([]);
    });

    it("guruhda o'quvchilar soni (studentCount) hisoblanadi; tugallanmagan yozilishli guruhni arxivlab bo'lmaydi", async () => {
      const g = await mkGroup(A, 'Soni Guruhi');
      const a = await mkStudent(A, 'Son Bir', A.main);
      const b = await mkStudent(A, 'Son Ikki', A.main);
      const ea = await enrollId(A, g.id, a.id);
      const eb = await enrollId(A, g.id, b.id);
      expect((await A.owner.get(`/groups/${g.id}`).expect(200)).body.studentCount).toBe(2);
      await A.owner.post(`/enrollments/${eb}/freeze`).expect(200);
      expect((await A.owner.get(`/groups/${g.id}`).expect(200)).body.studentCount).toBe(2); // muzlatilgan ham a'zo
      expect((await A.owner.post(`/groups/${g.id}/archive`).expect(409)).body.code).toBe('GROUP_HAS_STUDENTS');
      await A.owner.post(`/enrollments/${ea}/leave`).expect(200);
      await A.owner.post(`/enrollments/${eb}/leave`).expect(200);
      expect((await A.owner.get(`/groups/${g.id}`).expect(200)).body.studentCount).toBe(0);
      await A.owner.post(`/groups/${g.id}/archive`).expect(200);
    });
  });

  describe("o'quvchi arxivlanganda", () => {
    it("tugallanmagan yozilishlari LEFT (STUDENT_ARCHIVED) bo'ladi; tarix va audit saqlanadi; qaytarilganda tiklanmaydi", async () => {
      const g1 = await mkGroup(A, 'Arxiv Oquvchi G1');
      const g2 = await mkGroup(A, 'Arxiv Oquvchi G2');
      const st = await mkStudent(A, 'Arxivlanadigan Oquvchi', A.main);
      const e1 = await enrollId(A, g1.id, st.id);
      const e2 = await enrollId(A, g2.id, st.id);
      await A.owner.post(`/enrollments/${e2}/freeze`).expect(200);
      const done = await enrollId(A, (await mkGroup(A, 'Arxiv Oquvchi G3')).id, st.id);
      await A.owner.post(`/enrollments/${done}/leave`, { reason: 'Oldin chiqqan' }).expect(200);

      await A.owner.post(`/students/${st.id}/archive`).expect(200);
      const rows = await db.select().from(s.enrollments).where(eq(s.enrollments.studentId, st.id));
      expect(rows).toHaveLength(3);
      expect(rows.every((r) => r.status === 'LEFT' && r.leftAt !== null)).toBe(true);
      expect(rows.find((r) => r.id === e1)?.leftReason).toBe('STUDENT_ARCHIVED');
      expect(rows.find((r) => r.id === e2)?.leftReason).toBe('STUDENT_ARCHIVED');
      expect(rows.find((r) => r.id === done)?.leftReason).toBe('Oldin chiqqan'); // oldin yopilgani o'zgarmaydi

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, st.id));
      expect(audit.find((x) => x.action === 'student.archive')?.after).toMatchObject({ status: 'ARCHIVED', closedEnrollments: 2 });

      await A.owner.post(`/students/${st.id}/unarchive`).expect(200);
      expect((await db.select().from(s.enrollments).where(eq(s.enrollments.studentId, st.id))).every((r) => r.status === 'LEFT')).toBe(true);
      expect((await A.owner.get(`/groups/${g1.id}`).expect(200)).body.studentCount).toBe(0);
    });
  });
});
