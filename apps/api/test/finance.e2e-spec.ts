// 17-qadam: xarajatlar (expenses) va moliyaviy hisobotlar (summary, daily). PGlite, RLS yoqilgan.
// Hamma to'lov bugun yaratiladi, xarajatlar bugun va 2 kun oldin; hisobot summalari qo'lda hisoblangan.
import { PERMISSIONS } from '@erp/shared';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { hashPassword } from '../src/auth/password.js';
import { addDays, todayLocal } from '../src/common/dates.js';
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
const D2 = addDays(TODAY, -2);
const RANGE = `from=${addDays(TODAY, -5)}&to=${TODAY}`;
type Api = ReturnType<typeof makeApi>;
let httpFn: () => request.Agent;
const makeApi = (t: string) => ({
  get: (p: string) => httpFn().get(p).set({ Authorization: `Bearer ${t}` }),
  post: (p: string, b: object = {}) => httpFn().post(p).set({ Authorization: `Bearer ${t}` }).send(b),
  put: (p: string, b: object) => httpFn().put(p).set({ Authorization: `Bearer ${t}` }).send(b),
});

describe('Xarajatlar va moliyaviy hisobotlar (PGlite, RLS yoqilgan)', () => {
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
  async function newCenter(name: string, withSecond = true): Promise<Center> {
    const res = await makeApi(rootToken).post('/admin/centers', { name, ownerFullName: 'Rahbar' }).expect(201);
    const owner = makeApi(await activate(res.body.owner.login, res.body.owner.temporaryPassword));
    const second = withSecond ? ((await owner.post('/branches', { name: 'Ikkinchi filial' }).expect(201)).body.id as string) : '';
    const course = (await owner.post('/courses', { name: 'Ingliz tili', defaultPrice: 400000 }).expect(201)).body.id as string;
    return { centerId: res.body.center.id, owner, main: res.body.branch.id, second, course };
  }
  async function staff(c: Center, role: 'ADMIN' | 'CASHIER' | 'TEACHER', fullName: string, branchId: string) {
    const res = await c.owner.post('/staff', { role, fullName, branchIds: [branchId] }).expect(201);
    return { id: res.body.user.id as string, api: makeApi(await activate(res.body.user.login, res.body.temporaryPassword)) };
  }
  let n = 0;
  async function mkStudent(c: Center, branchId: string) {
    const res = await c.owner.post('/students', { fullName: `Talaba${++n} Moliya`, branchId }).expect(201);
    let cached: Promise<Api> | undefined;
    const login = res.body.student.login as string;
    return { id: res.body.student.id as string, api: () => (cached ??= activate(login, res.body.temporaryPassword).then(makeApi)) };
  }
  const mkGroup = async (c: Center, name: string, branchId: string, price: number) =>
    (await c.owner.post('/groups', { name, courseId: c.course, branchId, priceMonthly: price, billingMode: 'STUDENT_CYCLE', status: 'ACTIVE' }).expect(201)).body.id as string;
  const enable = (c: Center, userId: string, codes: Record<string, boolean | null>) => c.owner.put(`/permissions/users/${userId}`, { permissions: codes }).expect(200);
  const actions = async (entityId: string) => (await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, entityId))).map((x) => x.action);
  const summary = async (api: Api, qs = RANGE) => (await api.get(`/reports/finance/summary?${qs}`).expect(200)).body;

  let A: Center;
  let B: Center;
  let admin1: Awaited<ReturnType<typeof staff>>;
  let cashier1: Awaited<ReturnType<typeof staff>>;
  let cashier2: Awaited<ReturnType<typeof staff>>;
  let teacher1: Awaited<ReturnType<typeof staff>>;
  let voided: string;
  let mainExpense: string;
  let secondExpense: string;

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

    A = await newCenter('Moliya Markazi A');
    B = await newCenter('Moliya Markazi B', false);
    admin1 = await staff(A, 'ADMIN', 'Admin Bir', A.main);
    cashier1 = await staff(A, 'CASHIER', 'Kassir Bir', A.main);
    cashier2 = await staff(A, 'CASHIER', 'Kassir Ikki', A.second);
    teacher1 = await staff(A, 'TEACHER', 'Ustoz Bir', A.main);
  });

  afterAll(async () => {
    await app?.close();
    await pg?.close();
  });

  describe('xarajat yaratish va ruxsat', () => {
    it("tekshiruvlar: summa, kategoriya, sana, filial (rahbarda ikki filial: majburiy), boshqa markaz filiali", async () => {
      const post = (body: object) => A.owner.post('/expenses', body);
      await post({ branchId: A.main, category: 'Ijara', amount: 0 }).expect(400);
      await post({ branchId: A.main, category: 'Ijara', amount: -5 }).expect(400);
      await post({ branchId: A.main, category: 'Ijara', amount: 10.5 }).expect(400);
      await post({ branchId: A.main, category: '   ', amount: 5 }).expect(400);
      await post({ branchId: A.main, category: 'x'.repeat(61), amount: 5 }).expect(400);
      await post({ branchId: A.main, amount: 5 }).expect(400);
      expect((await post({ branchId: A.main, category: 'Ijara', amount: 5, spentOn: addDays(TODAY, 1) }).expect(400)).body.code).toBe('DATE_IN_FUTURE');
      expect((await post({ category: 'Ijara', amount: 5 }).expect(400)).body.code).toBe('BRANCH_REQUIRED');
      expect((await post({ branchId: NOPE, category: 'Ijara', amount: 5 }).expect(404)).body.code).toBe('BRANCH_NOT_FOUND');
      await B.owner.post('/expenses', { branchId: A.main, category: 'Ijara', amount: 5 }).expect(404);
      const single = (await B.owner.post('/expenses', { category: 'Ijara', amount: 5, note: 'Yagona filial' }).expect(201)).body; // markazda bitta filial: avtomatik
      expect(single).toMatchObject({ branchId: B.main, category: 'Ijara', amount: 5, note: 'Yagona filial', status: 'ACTIVE', spentOn: TODAY });
    });

    it("ruxsat: kassir ○ (yoqilmaguncha 403), admin/ustoz/o'quvchi yozolmaydi, filial qamrovi", async () => {
      const body = { branchId: A.main, category: 'Ijara', amount: 1000 };
      await cashier1.api.post('/expenses', body).expect(403);
      await admin1.api.post('/expenses', body).expect(403);
      await teacher1.api.post('/expenses', body).expect(403);
      await httpFn().post('/expenses').send(body).expect(401);
      await enable(A, cashier1.id, { 'expense.manage': true });
      await enable(A, cashier2.id, { 'expense.manage': true });
      await cashier1.api.post('/expenses', { ...body, branchId: A.second }).expect(403); // boshqa filial
      const own = (await cashier1.api.post('/expenses', { category: 'Ijara', amount: 1000 }).expect(201)).body; // yagona filiali avtomatik
      expect(own).toMatchObject({ branchId: A.main, createdBy: cashier1.id, createdByName: 'Kassir Bir', branchName: expect.any(String) });
      await db.delete(s.expenses).where(eq(s.expenses.id, own.id)); // keyingi hisobot testlarini buzmasin (superuser ulanishi)
    });
  });

  describe('hisobot ma\'lumoti', () => {
    beforeAll(async () => {
      const gMain = await mkGroup(A, 'Moliya asosiy', A.main, 400000);
      const gSecond = await mkGroup(A, 'Moliya ikkinchi', A.second, 200000);
      const s1 = await mkStudent(A, A.main);
      const s2 = await mkStudent(A, A.second);
      const s3 = await mkStudent(A, A.main); // guruhsiz: avans
      await A.owner.post('/enrollments', { groupId: gMain, studentId: s1.id }).expect(201);
      await A.owner.post('/enrollments', { groupId: gSecond, studentId: s2.id }).expect(201);
      const pay = (api: Api, studentId: string, amount: number, method: string) => api.post('/payments', { studentId, amount, method }).expect(201);
      await pay(cashier1.api, s1.id, 300000, 'CASH');
      await pay(cashier1.api, s1.id, 100000, 'CARD'); // hisob (400 000) to'liq yopildi
      const tmp = (await pay(cashier1.api, s1.id, 50000, 'CASH')).body; // avans, keyin qaytariladi: sof 0
      await A.owner.post(`/payments/${tmp.id}/reverse`, { reason: 'Xato' }).expect(200);
      await pay(cashier2.api, s2.id, 150000, 'TRANSFER');
      await pay(cashier1.api, s3.id, 70000, 'CASH'); // taqsimlanmagan avans

      const ex = async (api: Api, body: object) => (await api.post('/expenses', body).expect(201)).body.id as string;
      mainExpense = await ex(cashier1.api, { category: 'Ijara', amount: 200000, note: 'Oylik ijara' });
      await ex(cashier1.api, { category: 'ijara', amount: 50000 }); // kategoriya registrsiz birlashadi
      await ex(cashier1.api, { category: 'Kommunal', amount: 80000, spentOn: D2 });
      voided = await ex(cashier1.api, { category: 'Xato', amount: 999999 });
      secondExpense = await ex(cashier2.api, { category: 'Ijara', amount: 120000 });
      await A.owner.post(`/expenses/${voided}/void`, { reason: 'Noto\'g\'ri kiritilgan' }).expect(200);

      // maosh to'lovi (faqat rahbar hisobotida): qat'iy 1 000 000, 300 000 to'langan
      await A.owner.post('/payroll/rules', { employeeId: teacher1.id, type: 'FIXED', amount: 1_000_000 }).expect(201);
      await A.owner.post(`/payroll/periods/${TODAY.slice(0, 7)}/calculate`).expect(200);
      await A.owner.post(`/payroll/periods/${TODAY.slice(0, 7)}/approve`).expect(200);
      await A.owner.post('/payroll/payouts', { month: TODAY.slice(0, 7), employeeId: teacher1.id, amount: 300000, method: 'CASH' }).expect(201);
    });

    it("rahbar: tushum (usul bo'yicha, qaytarish ayirilgan), xarajat (kategoriya birlashgan, bekor qilingani yo'q), maosh, sof natija", async () => {
      const r = await summary(A.owner);
      expect(r).toMatchObject({ from: addDays(TODAY, -5), to: TODAY, branchId: null });
      expect(r.income).toEqual({
        total: 620000,
        byMethod: [{ method: 'CASH', amount: 370000 }, { method: 'TRANSFER', amount: 150000 }, { method: 'CARD', amount: 100000 }],
      });
      expect(r.expenses).toEqual({
        total: 450000,
        byCategory: [{ category: expect.stringMatching(/^[Ii]jara$/), amount: 370000, count: 3 }, { category: 'Kommunal', amount: 80000, count: 1 }],
      });
      expect(r.payouts).toBe(300000);
      expect(r.net).toBe(620000 - 450000 - 300000);
    });

    it("filiallar kesimi va guruhlar bo'yicha tushum; taqsimlanmagan avans", async () => {
      const r = await summary(A.owner);
      expect(r.byBranch).toEqual([
        { branchId: A.main, branchName: expect.any(String), income: 470000, expenses: 330000, net: 140000 },
        { branchId: A.second, branchName: 'Ikkinchi filial', income: 150000, expenses: 120000, net: 30000 },
      ].sort((a, b) => a.branchName.localeCompare(b.branchName)));
      expect(r.byGroup).toEqual([
        { groupId: expect.any(String), groupName: 'Moliya asosiy', branchName: expect.any(String), amount: 400000 },
        { groupId: expect.any(String), groupName: 'Moliya ikkinchi', branchName: 'Ikkinchi filial', amount: 150000 },
      ]);
      expect(r.unallocated).toBe(70000); // 620 000 - 550 000
    });

    it("filial filtri: rahbar bitta filialni ko'radi (maosh va taqsimlanmagan ko'rsatilmaydi); kassir faqat o'z filiali", async () => {
      const second = await summary(A.owner, `${RANGE}&branchId=${A.second}`);
      expect(second).toMatchObject({ branchId: A.second, income: { total: 150000 }, expenses: { total: 120000 }, payouts: null, net: 30000, unallocated: null });
      expect(second.byBranch).toHaveLength(1);

      const c1 = await summary(cashier1.api);
      expect(c1).toMatchObject({ income: { total: 470000 }, expenses: { total: 330000 }, payouts: null, net: 140000, unallocated: null });
      expect(c1.byBranch.map((b: { branchId: string }) => b.branchId)).toEqual([A.main]);
      expect(c1.byGroup.map((g: { amount: number }) => g.amount)).toEqual([400000]);
      const c2 = await summary(cashier2.api);
      expect(c2).toMatchObject({ income: { total: 150000, byMethod: [{ method: 'TRANSFER', amount: 150000 }] }, expenses: { total: 120000 }, net: 30000 });
      expect(c2.byGroup.map((g: { groupName: string }) => g.groupName)).toEqual(['Moliya ikkinchi']);
      // qamrovdan tashqari filial filtri: bo'sh natija (ma'lumot sizmaydi)
      expect(await summary(cashier1.api, `${RANGE}&branchId=${A.second}`)).toMatchObject({ income: { total: 0, byMethod: [] }, expenses: { total: 0 }, net: 0, byBranch: [], byGroup: [] });
    });

    it("sana oralig'i: boshqa kun bo'sh, sukut shu oyning boshidan; noto'g'ri oraliq 400", async () => {
      const y = addDays(TODAY, -1);
      expect(await summary(A.owner, `from=${addDays(TODAY, -10)}&to=${y}`)).toMatchObject({ income: { total: 0 }, expenses: { total: 80000, byCategory: [{ category: 'Kommunal', amount: 80000, count: 1 }] }, payouts: 0, net: -80000 });
      expect((await summary(A.owner, `from=${D2}&to=${D2}`)).expenses.total).toBe(80000);
      const def = await summary(A.owner, '');
      expect(def).toMatchObject({ from: `${TODAY.slice(0, 7)}-01`, to: TODAY });
      await A.owner.get(`/reports/finance/summary?from=${TODAY}&to=${y}`).expect(400);
      await A.owner.get('/reports/finance/summary?from=2020-01-01&to=2026-01-01').expect(400); // 366 kundan ortiq
      await A.owner.get('/reports/finance/summary?from=abc').expect(400);
      await A.owner.get('/reports/finance/summary?branchId=xyz').expect(400);
    });

    it("kassa kitobi (daily): har kun, bo'sh kunlar ham, jami summary bilan mos", async () => {
      const r = (await A.owner.get(`/reports/finance/daily?${RANGE}`).expect(200)).body;
      expect(r.items).toHaveLength(6);
      expect(r.items.map((i: { date: string }) => i.date)).toEqual(Array.from({ length: 6 }, (_, i) => addDays(TODAY, i - 5)));
      expect(r.items.find((i: { date: string }) => i.date === D2)).toEqual({ date: D2, income: 0, expenses: 80000, net: -80000 });
      expect(r.items.at(-1)).toEqual({ date: TODAY, income: 620000, expenses: 370000, net: 250000 });
      expect(r.totals).toEqual({ income: 620000, expenses: 450000, net: 170000 }); // maoshsiz
      const c1 = (await cashier1.api.get(`/reports/finance/daily?${RANGE}`).expect(200)).body;
      expect(c1.totals).toEqual({ income: 470000, expenses: 330000, net: 140000 });
      expect((await cashier1.api.get(`/reports/finance/daily?${RANGE}&branchId=${A.second}`).expect(200)).body).toMatchObject({ items: [], totals: { income: 0, expenses: 0, net: 0 } });
      expect((await B.owner.get(`/reports/finance/daily?${RANGE}`).expect(200)).body.totals.income).toBe(0);
    });

    it("ruxsatlar: kassir ✔, admin ○ (yoqilgach o'z filiali), ustoz/o'quvchi 403, boshqa markaz faqat o'ziniki", async () => {
      await admin1.api.get(`/reports/finance/summary?${RANGE}`).expect(403);
      await teacher1.api.get(`/reports/finance/summary?${RANGE}`).expect(403);
      await teacher1.api.get(`/reports/finance/daily?${RANGE}`).expect(403);
      const st = await mkStudent(A, A.main);
      await (await st.api()).get(`/reports/finance/summary?${RANGE}`).expect(403);
      await httpFn().get('/reports/finance/summary').expect(401);
      await enable(A, admin1.id, { 'finance.report': true });
      expect(await summary(admin1.api)).toMatchObject({ income: { total: 470000 }, expenses: { total: 330000 }, payouts: null });
      await enable(A, admin1.id, { 'finance.report': null });
      await admin1.api.get(`/reports/finance/summary?${RANGE}`).expect(403);
      expect(await summary(B.owner)).toMatchObject({ income: { total: 0 }, expenses: { total: 5 }, payouts: 0, net: -5 }); // B ning o'zining 5 so'mlik xarajati
    });
  });

  describe("xarajat ro'yxati, bekor qilish, kategoriyalar", () => {
    it("ro'yxat: filtrlar (kategoriya registrsiz, holat, sana, filial), tartib, sahifalash; kassir o'z filiali", async () => {
      const all = (await A.owner.get('/expenses?limit=100').expect(200)).body.items as { id: string; amount: number; category: string; spentOn: string; status: string }[];
      expect(all).toHaveLength(5);
      expect(all.map((x) => x.spentOn)).toEqual(all.map((x) => x.spentOn).sort((p, q) => q.localeCompare(p))); // yangi sana birinchi
      expect((await A.owner.get('/expenses?category=IJARA').expect(200)).body.items).toHaveLength(3);
      expect((await A.owner.get('/expenses?status=VOIDED').expect(200)).body.items.map((x: { id: string }) => x.id)).toEqual([voided]);
      expect((await A.owner.get('/expenses?status=ACTIVE').expect(200)).body.items).toHaveLength(4);
      expect((await A.owner.get(`/expenses?from=${D2}&to=${D2}`).expect(200)).body.items.map((x: { category: string }) => x.category)).toEqual(['Kommunal']);
      expect((await A.owner.get(`/expenses?branchId=${A.second}`).expect(200)).body.items.map((x: { id: string }) => x.id)).toEqual([secondExpense]);
      expect((await A.owner.get('/expenses?limit=2&offset=4').expect(200)).body.items).toHaveLength(1);
      expect((await cashier1.api.get('/expenses').expect(200)).body.items).toHaveLength(4); // faqat asosiy filial
      expect((await cashier2.api.get('/expenses').expect(200)).body.items.map((x: { id: string }) => x.id)).toEqual([secondExpense]);
      expect((await cashier1.api.get(`/expenses?branchId=${A.second}`).expect(200)).body.items).toEqual([]);
      await admin1.api.get('/expenses').expect(403);
      await teacher1.api.get('/expenses').expect(403);
      await A.owner.get('/expenses?limit=0').expect(400);
    });

    it("bitta xarajat: qamrov (boshqa filial va boshqa markaz 404); kassir finance.report bilan ham ko'ra oladi", async () => {
      const e = (await cashier1.api.get(`/expenses/${mainExpense}`).expect(200)).body;
      expect(e).toMatchObject({ id: mainExpense, category: 'Ijara', amount: 200000, note: 'Oylik ijara', status: 'ACTIVE', voidReason: null });
      await cashier1.api.get(`/expenses/${secondExpense}`).expect(404);
      await B.owner.get(`/expenses/${mainExpense}`).expect(404);
      await A.owner.get(`/expenses/${NOPE}`).expect(404);
      await A.owner.get('/expenses/not-a-uuid').expect(400);
      await enable(A, cashier1.id, { 'expense.manage': null }); // faqat finance.report (✔ sukut) qoladi
      await cashier1.api.get(`/expenses/${mainExpense}`).expect(200);
      await cashier1.api.post('/expenses', { category: 'Ijara', amount: 5 }).expect(403);
      await enable(A, cashier1.id, { 'expense.manage': true });
    });

    it("bekor qilish: sabab majburiy, holat VOIDED va kim/qachon; takror 409; qamrov va ruxsat; hisobotdan chiqadi; DB o'zgartirishga yo'l qo'ymaydi", async () => {
      const v = (await A.owner.get(`/expenses/${voided}`).expect(200)).body;
      expect(v).toMatchObject({ status: 'VOIDED', voidReason: "Noto'g'ri kiritilgan", voidedBy: expect.any(String), voidedByName: 'Rahbar' });
      expect(v.voidedAt).not.toBeNull();
      expect((await A.owner.post(`/expenses/${voided}/void`, { reason: 'Yana' }).expect(409)).body.code).toBe('ALREADY_VOIDED');
      await A.owner.post(`/expenses/${mainExpense}/void`, {}).expect(400);
      await cashier2.api.post(`/expenses/${mainExpense}/void`, { reason: 'Boshqa filial' }).expect(404);
      await admin1.api.post(`/expenses/${mainExpense}/void`, { reason: 'x' }).expect(403);
      await B.owner.post(`/expenses/${mainExpense}/void`, { reason: 'x' }).expect(404);
      await A.owner.post(`/expenses/${NOPE}/void`, { reason: 'x' }).expect(404);
      expect(await actions(voided)).toEqual(expect.arrayContaining(['expense.create', 'expense.void']));

      // bekor qilinganda hisobotdan chiqadi; qaytib tiklanmaydi
      const extra = (await cashier1.api.post('/expenses', { category: 'Vaqtinchalik', amount: 12345 }).expect(201)).body.id as string;
      expect((await summary(cashier1.api)).expenses.total).toBe(330000 + 12345);
      await cashier1.api.post(`/expenses/${extra}/void`, { reason: 'Xato' }).expect(200);
      expect((await summary(cashier1.api)).expenses.total).toBe(330000);
      await expect(db.update(s.expenses).set({ amount: 1 }).where(eq(s.expenses.id, mainExpense))).rejects.toThrow();
      await expect(db.update(s.expenses).set({ status: 'ACTIVE', voidedAt: null, voidReason: null }).where(eq(s.expenses.id, voided))).rejects.toThrow();
    });

    it("kategoriyalar: registrsiz birlashadi, faqat bekor qilinmagan, qamrov bo'yicha", async () => {
      const all = (await A.owner.get('/expenses/categories').expect(200)).body.items;
      expect(all.map((x: { category: string; count: number; amount: number }) => [x.category.toLowerCase(), x.count, x.amount])).toEqual([['ijara', 3, 370000], ['kommunal', 1, 80000]]);
      expect((await cashier2.api.get('/expenses/categories').expect(200)).body.items.map((x: { amount: number }) => x.amount)).toEqual([120000]);
      await admin1.api.get('/expenses/categories').expect(403);
    });
  });
});
