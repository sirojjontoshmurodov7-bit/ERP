// 16-qadam: maosh. Qoidalar, hisoblash (FIXED, PERCENT, PER_GROUP, PER_LESSON), bonus/jarima, tasdiq qulfi, to'lov, qaytarish, o'z maoshi.
// PGlite, RLS yoqilgan. Hamma ma'lumot joriy oyda yaratiladi (to'lov va dars bugun), shuning uchun kutilgan summalar aniq.
import { PERMISSIONS } from '@erp/shared';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { hashPassword } from '../src/auth/password.js';
import { clampedDate, monthOf, todayLocal, yearOf } from '../src/common/dates.js';
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
const M = TODAY.slice(0, 7);
const PREV = clampedDate(yearOf(TODAY), monthOf(TODAY) - 1, 1).slice(0, 7);
const NEXT = clampedDate(yearOf(TODAY), monthOf(TODAY) + 1, 1).slice(0, 7);
type Api = ReturnType<typeof makeApi>;
let httpFn: () => request.Agent;
const makeApi = (t: string) => ({
  get: (p: string) => httpFn().get(p).set({ Authorization: `Bearer ${t}` }),
  post: (p: string, b: object = {}) => httpFn().post(p).set({ Authorization: `Bearer ${t}` }).send(b),
  patch: (p: string, b: object) => httpFn().patch(p).set({ Authorization: `Bearer ${t}` }).send(b),
  put: (p: string, b: object) => httpFn().put(p).set({ Authorization: `Bearer ${t}` }).send(b),
  del: (p: string) => httpFn().delete(p).set({ Authorization: `Bearer ${t}` }),
});

describe('Maosh (PGlite, RLS yoqilgan)', () => {
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
    course: string;
  }
  async function newCenter(name: string): Promise<Center> {
    const res = await makeApi(rootToken).post('/admin/centers', { name, ownerFullName: 'Rahbar' }).expect(201);
    const owner = makeApi(await activate(res.body.owner.login, res.body.owner.temporaryPassword));
    const course = (await owner.post('/courses', { name: 'Ingliz tili', defaultPrice: 400000 }).expect(201)).body.id as string;
    return { centerId: res.body.center.id, owner, main: res.body.branch.id, course };
  }
  async function staff(c: Center, role: 'ADMIN' | 'CASHIER' | 'TEACHER', fullName: string) {
    const res = await c.owner.post('/staff', { role, fullName, branchIds: [c.main] }).expect(201);
    return { id: res.body.user.id as string, name: fullName, api: makeApi(await activate(res.body.user.login, res.body.temporaryPassword)) };
  }
  let n = 0;
  async function mkStudent(c: Center) {
    const res = await c.owner.post('/students', { fullName: `Talaba${++n} Oylik`, branchId: c.main }).expect(201);
    return res.body.student.id as string;
  }
  const mkGroup = async (c: Center, name: string) =>
    (await c.owner.post('/groups', { name, courseId: c.course, branchId: c.main, priceMonthly: 400000, billingMode: 'STUDENT_CYCLE', status: 'ACTIVE' }).expect(201)).body.id as string;
  const rule = (c: Center, body: object) => c.owner.post('/payroll/rules', body);
  const periodOf = async (api: Api, month: string) => (await api.get(`/payroll/periods/${month}`).expect(200)).body;
  const emp = (period: { employees: any[] }, id: string) => period.employees.find((e) => e.employeeId === id)!;
  const enable = (c: Center, userId: string, codes: Record<string, boolean | null>) => c.owner.put(`/permissions/users/${userId}`, { permissions: codes }).expect(200);
  const actions = async (entityId: string) => (await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, entityId))).map((x) => x.action);

  let A: Center;
  let B: Center;
  let admin1: Awaited<ReturnType<typeof staff>>;
  let cashier1: Awaited<ReturnType<typeof staff>>;
  let teacher1: Awaited<ReturnType<typeof staff>>;
  let teacher2: Awaited<ReturnType<typeof staff>>;
  let g1: string;
  let g2: string;

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

    A = await newCenter('Maosh Markazi A');
    B = await newCenter('Maosh Markazi B');
    admin1 = await staff(A, 'ADMIN', 'Admin Bir');
    cashier1 = await staff(A, 'CASHIER', 'Kassir Bir');
    teacher1 = await staff(A, 'TEACHER', 'Ustoz Bir');
    teacher2 = await staff(A, 'TEACHER', 'Ustoz Ikki');

    // Ma'lumot: 2 guruh, ustoz1 ikkalasida asosiy, ustoz2 g1 da yordamchi; g1 da 3 o'quvchi (3 x 400 000 hisob), to'lovlar, bugun 2 dars
    g1 = await mkGroup(A, 'Maosh g1');
    g2 = await mkGroup(A, 'Maosh g2');
    await A.owner.post(`/groups/${g1}/teachers`, { teacherId: teacher1.id, kind: 'MAIN' }).expect(200);
    await A.owner.post(`/groups/${g2}/teachers`, { teacherId: teacher1.id, kind: 'MAIN' }).expect(200);
    await A.owner.post(`/groups/${g1}/teachers`, { teacherId: teacher2.id, kind: 'ASSISTANT' }).expect(200);
    const studs = [await mkStudent(A), await mkStudent(A), await mkStudent(A)];
    for (const st of studs) await A.owner.post('/enrollments', { groupId: g1, studentId: st }).expect(201);
    await A.owner.post('/payments', { studentId: studs[0], amount: 400000, method: 'CASH' }).expect(201);
    await A.owner.post('/payments', { studentId: studs[1], amount: 100000, method: 'CASH' }).expect(201);
    const tmp = (await A.owner.post('/payments', { studentId: studs[2], amount: 50000, method: 'CASH' }).expect(201)).body;
    await A.owner.post(`/payments/${tmp.id}/reverse`, { reason: 'Xato' }).expect(200); // sof ta'sir 0
    await A.owner.post(`/groups/${g1}/lessons`, { lessonDate: TODAY }).expect(201);
    await A.owner.post(`/groups/${g2}/lessons`, { lessonDate: TODAY }).expect(201);
  });

  afterAll(async () => {
    await app?.close();
    await pg?.close();
  });

  describe('qoidalar', () => {
    it("yaratish: har tur, qiymat qoidalari va xodim/guruh tekshiruvi", async () => {
      const bad = async (body: object, status = 400) => (await rule(A, body).expect(status)).body;
      await bad({ employeeId: teacher1.id, type: 'FIXED' }); // summa yo'q
      await bad({ employeeId: teacher1.id, type: 'FIXED', amount: 0 });
      await bad({ employeeId: teacher1.id, type: 'PERCENT', percentBase: 'PAID' }); // foiz yo'q
      await bad({ employeeId: teacher1.id, type: 'PERCENT', percent: 10 }); // asos yo'q
      await bad({ employeeId: teacher1.id, type: 'PERCENT', percent: 0, percentBase: 'PAID' });
      await bad({ employeeId: teacher1.id, type: 'PERCENT', percent: 100.5, percentBase: 'PAID' });
      await bad({ employeeId: teacher1.id, type: 'PERCENT', percent: 10, percentBase: 'PAID', amount: 5 });
      await bad({ employeeId: teacher1.id, type: 'FIXED', amount: 5, percent: 10 });
      await bad({ employeeId: teacher1.id, type: 'WEIRD', amount: 5 });
      await bad({ employeeId: teacher1.id, type: 'FIXED', amount: 5, validFrom: '2026-05-01', validTo: '2026-04-01' });
      expect((await bad({ employeeId: A.owner === cashier1.api ? NOPE : (await ownerId(A))!, type: 'FIXED', amount: 5 })).code).toBe('INVALID_EMPLOYEE'); // rahbar maosh olmaydi
      expect((await bad({ employeeId: await mkStudent(A), type: 'FIXED', amount: 5 })).code).toBe('INVALID_EMPLOYEE');
      expect((await bad({ employeeId: NOPE, type: 'FIXED', amount: 5 }, 404)).code).toBe('EMPLOYEE_NOT_FOUND');
      expect((await bad({ employeeId: teacher1.id, type: 'PER_GROUP', amount: 5, groupId: NOPE }, 404)).code).toBe('GROUP_NOT_FOUND');
      await B.owner.post('/payroll/rules', { employeeId: teacher1.id, type: 'FIXED', amount: 5 }).expect(404); // boshqa markaz xodimi
    });

    it("ruxsat: faqat rahbar yozadi; kassir ko'radi (view_all); admin/ustoz ko'rmaydi; boshqa markaz bo'sh", async () => {
      const body = { employeeId: teacher2.id, type: 'FIXED', amount: 1, validFrom: '2020-01-01', validTo: '2020-12-31' }; // hisobga ta'sir qilmaydi
      await cashier1.api.post('/payroll/rules', body).expect(403);
      await admin1.api.post('/payroll/rules', body).expect(403);
      await teacher1.api.post('/payroll/rules', body).expect(403);
      await httpFn().post('/payroll/rules').send(body).expect(401);
      const r = (await rule(A, body).expect(201)).body;
      expect(r).toMatchObject({ employeeId: teacher2.id, employeeName: 'Ustoz Ikki', employeeRole: 'TEACHER', type: 'FIXED', amount: 1, percent: null, validFrom: '2020-01-01', validTo: '2020-12-31' });
      expect((await cashier1.api.get(`/payroll/rules?employeeId=${teacher2.id}`).expect(200)).body.items.length).toBe(1);
      await admin1.api.get('/payroll/rules').expect(403);
      await teacher1.api.get('/payroll/rules').expect(403);
      expect((await B.owner.get('/payroll/rules').expect(200)).body.items).toEqual([]);
      await cashier1.api.patch(`/payroll/rules/${r.id}`, { amount: 2 }).expect(403);
      await B.owner.patch(`/payroll/rules/${r.id}`, { amount: 2 }).expect(404);
      await B.owner.post(`/payroll/rules/${r.id}/end`, {}).expect(404);
      expect(await actions(r.id)).toContain('payroll.rule_create');
    });

    it("o'zgartirish va tugatish: tur maydonlari, sanalar, takror tugatish; filtrlar", async () => {
      const r = (await rule(A, { employeeId: admin1.id, type: 'FIXED', amount: 100, validFrom: '2021-01-01' }).expect(201)).body;
      const p = (await rule(A, { employeeId: admin1.id, type: 'PERCENT', percent: 5, percentBase: 'PAID', validFrom: '2021-01-01', validTo: '2021-12-31' }).expect(201)).body;
      expect((await A.owner.patch(`/payroll/rules/${r.id}`, { amount: 250 }).expect(200)).body.amount).toBe(250);
      expect((await A.owner.patch(`/payroll/rules/${p.id}`, { percent: 7.5, percentBase: 'CHARGED' }).expect(200)).body).toMatchObject({ percent: 7.5, percentBase: 'CHARGED' });
      expect((await A.owner.patch(`/payroll/rules/${r.id}`, { percent: 5 }).expect(400)).body.code).toBe('RULE_FIELD_INVALID');
      expect((await A.owner.patch(`/payroll/rules/${p.id}`, { amount: 5 }).expect(400)).body.code).toBe('RULE_FIELD_INVALID');
      await A.owner.patch(`/payroll/rules/${r.id}`, {}).expect(400);
      await A.owner.patch(`/payroll/rules/${r.id}`, { validTo: '2020-01-01' }).expect(400);
      await A.owner.patch(`/payroll/rules/${NOPE}`, { amount: 1 }).expect(404);

      const active = (await A.owner.get(`/payroll/rules?employeeId=${admin1.id}&active=true`).expect(200)).body.items;
      expect(active.map((x: { id: string }) => x.id)).toEqual([r.id]); // p 2021 yilda tugagan
      expect((await A.owner.post(`/payroll/rules/${r.id}/end`, { validTo: '2020-06-01' }).expect(400)).body.code).toBe('INVALID_DATES');
      // o'tgan sanada tugatiladi: joriy oy hisobiga ta'sir qilmasin
      const ended = (await A.owner.post(`/payroll/rules/${r.id}/end`, { validTo: '2021-06-30' }).expect(200)).body;
      expect(ended.validTo).toBe('2021-06-30');
      expect((await A.owner.post(`/payroll/rules/${r.id}/end`, {}).expect(409)).body.code).toBe('ALREADY_ENDED');
      expect((await A.owner.post(`/payroll/rules/${r.id}/end`, { validTo: '2021-06-30' }).expect(409)).body.code).toBe('ALREADY_ENDED');
      const inactive = (await A.owner.get(`/payroll/rules?employeeId=${admin1.id}&active=false`).expect(200)).body.items;
      const byText = (a: string, b: string) => a.localeCompare(b);
      expect(inactive.map((x: { id: string }) => x.id).sort(byText)).toEqual([r.id, p.id].sort(byText));
      expect(await actions(r.id)).toEqual(expect.arrayContaining(['payroll.rule_edit', 'payroll.rule_end']));
    });
  });

  // owner id'sini bazadan olish (rahbar maosh olmasligini tekshirish uchun)
  const ownerId = async (c: Center) => (await db.select().from(s.users).where(eq(s.users.centerId, c.centerId))).find((u) => u.role === 'OWNER')?.id;

  describe('hisoblash, tuzatish, tasdiq', () => {
    beforeAll(async () => {
      // admin1 ning oldingi qoidalari ta'sir qilmasin: ular 2021 yoki bugun tugagan
      await rule(A, { employeeId: teacher1.id, type: 'PERCENT', percent: 30, percentBase: 'PAID' }).expect(201);
      await rule(A, { employeeId: teacher1.id, type: 'PER_LESSON', amount: 50000 }).expect(201);
      await rule(A, { employeeId: teacher2.id, type: 'PER_GROUP', amount: 100000, teacherKind: 'ASSISTANT' }).expect(201);
      await rule(A, { employeeId: cashier1.id, type: 'FIXED', amount: 2_000_000 }).expect(201);
      await rule(A, { employeeId: admin1.id, type: 'PERCENT', percent: 10, percentBase: 'CHARGED', groupId: g1 }).expect(201);
    });

    it("kelajak oyi 400, noto'g'ri oy formati 400, ruxsat: kassir (○ yoqilmagan), admin, ustoz 403", async () => {
      expect((await A.owner.post(`/payroll/periods/${NEXT}/calculate`).expect(400)).body.code).toBe('MONTH_IN_FUTURE');
      await A.owner.post('/payroll/periods/2026-13/calculate').expect(400);
      await A.owner.get('/payroll/periods/abc').expect(400);
      await cashier1.api.post(`/payroll/periods/${M}/calculate`).expect(403);
      await admin1.api.post(`/payroll/periods/${M}/calculate`).expect(403);
      await teacher1.api.post(`/payroll/periods/${M}/calculate`).expect(403);
      await B.owner.get(`/payroll/periods/${M}`).expect(404); // boshqa markazda davr yo'q
      await A.owner.get(`/payroll/periods/${M}`).expect(404); // hali hisoblanmagan
    });

    it("hisoblash: qoidalar bo'yicha summalar (foiz, dars, guruh, qat'iy, hisoblangan asos); qaytarilgan to'lov asosga ta'sir qilmaydi", async () => {
      const res = (await A.owner.post(`/payroll/periods/${M}/calculate`).expect(200)).body;
      expect(res.period).toMatchObject({ month: M, status: 'DRAFT' });
      expect(res.period.calculatedAt).not.toBeNull();
      const t1 = emp(res, teacher1.id);
      expect(t1).toMatchObject({ employeeName: 'Ustoz Bir', role: 'TEACHER', gross: 250000, adjustmentsTotal: 0, total: 250000, paid: 0, remaining: 250000 });
      // ustoz1: g1 to'langan 500 000 ning 30% = 150 000; g2 to'lov yo'q; 2 ta dars x 50 000 (g1 va g2)
      expect(t1.items.map((i: { description: string; amount: number }) => [i.description, i.amount]).sort((a: (string | number)[], b: (string | number)[]) => Number(a[1]) - Number(b[1]))).toEqual([
        ['1 dars x 50 000', 50000],
        ['1 dars x 50 000', 50000],
        ["To'langan 500 000 ning 30%", 150000],
      ]);
      expect(t1.items.find((i: { amount: number }) => i.amount === 150000)).toMatchObject({ groupId: g1, groupName: 'Maosh g1', baseAmount: 500000 });
      expect(emp(res, teacher2.id)).toMatchObject({ gross: 100000, items: [expect.objectContaining({ groupId: g1, description: 'Guruh uchun', amount: 100000 })] });
      expect(emp(res, cashier1.id)).toMatchObject({ gross: 2_000_000, items: [expect.objectContaining({ groupId: null, description: "Qat'iy oylik" })] });
      expect(emp(res, admin1.id)).toMatchObject({ gross: 120000, items: [expect.objectContaining({ description: 'Hisoblangan 1 200 000 ning 10%', baseAmount: 1_200_000 })] }); // 3 x 400 000
      expect(res.totals).toEqual({ total: 250000 + 100000 + 2_000_000 + 120000, paid: 0, remaining: 2_470_000 });
      expect(res.employees).toHaveLength(4); // 2020-yil qoidasi hisobga olinmadi
      expect(await actions(res.period.id)).toContain('payroll.calculate');
    });

    it("qayta hisoblash: qatorlar almashadi (ko'payib ketmaydi), tuzatishlar saqlanadi; kassir ○ yoqilgach hisoblay oladi", async () => {
      const before = await periodOf(A.owner, M);
      const again = (await A.owner.post(`/payroll/periods/${M}/calculate`).expect(200)).body;
      expect(again.employees.map((e: { items: unknown[] }) => e.items.length)).toEqual(before.employees.map((e: { items: unknown[] }) => e.items.length));
      expect(again.totals.total).toBe(before.totals.total);

      await enable(A, cashier1.id, { 'payroll.calculate': true });
      expect((await cashier1.api.post(`/payroll/periods/${M}/calculate`).expect(200)).body.totals.total).toBe(before.totals.total);
      await cashier1.api.post(`/payroll/periods/${M}/approve`).expect(403); // tasdiqlash faqat rahbarda
      await enable(A, cashier1.id, { 'payroll.calculate': null });
      await cashier1.api.post(`/payroll/periods/${M}/calculate`).expect(403);
    });

    it("bonus va jarima: xodim jami, kassir ko'ra oladi, o'chirish, qayta hisoblashda saqlanadi; qiymat tekshiruvi", async () => {
      const bonus = (await A.owner.post(`/payroll/periods/${M}/adjustments`, { employeeId: teacher1.id, amount: 20000, reason: 'Bonus' }).expect(201)).body;
      expect(bonus).toMatchObject({ month: M, employeeId: teacher1.id, amount: 20000, reason: 'Bonus' });
      await A.owner.post(`/payroll/periods/${M}/adjustments`, { employeeId: teacher2.id, amount: -5000, reason: 'Kechikish jarimasi' }).expect(201);
      await A.owner.post(`/payroll/periods/${M}/adjustments`, { employeeId: admin1.id, amount: -200000, reason: 'Katta jarima' }).expect(201);
      const wrong = await A.owner.post(`/payroll/periods/${M}/adjustments`, { employeeId: teacher1.id, amount: 1000, reason: 'Vaqtinchalik' }).expect(201);
      await A.owner.del(`/payroll/adjustments/${wrong.body.id}`).expect(200);
      await A.owner.del(`/payroll/adjustments/${wrong.body.id}`).expect(404);

      await A.owner.post(`/payroll/periods/${M}/adjustments`, { employeeId: teacher1.id, amount: 0, reason: 'x' }).expect(400);
      await A.owner.post(`/payroll/periods/${M}/adjustments`, { employeeId: teacher1.id, amount: 5.5, reason: 'x' }).expect(400);
      await A.owner.post(`/payroll/periods/${M}/adjustments`, { employeeId: teacher1.id, amount: 5 }).expect(400);
      await A.owner.post(`/payroll/periods/${PREV}/adjustments`, { employeeId: teacher1.id, amount: 5, reason: 'x' }).expect(404); // davr yo'q
      await A.owner.post(`/payroll/periods/${M}/adjustments`, { employeeId: await ownerId(A), amount: 5, reason: 'x' }).expect(400);
      await cashier1.api.post(`/payroll/periods/${M}/adjustments`, { employeeId: teacher1.id, amount: 5, reason: 'x' }).expect(403);
      await B.owner.del(`/payroll/adjustments/${bonus.id}`).expect(404);

      await A.owner.post(`/payroll/periods/${M}/calculate`).expect(200); // tuzatishlar saqlanadi
      const p = await periodOf(cashier1.api, M);
      expect(emp(p, teacher1.id)).toMatchObject({ gross: 250000, adjustmentsTotal: 20000, total: 270000, remaining: 270000 });
      expect(emp(p, teacher1.id).adjustments).toEqual([expect.objectContaining({ amount: 20000, reason: 'Bonus' })]);
      expect(emp(p, teacher2.id)).toMatchObject({ total: 95000 });
      expect(emp(p, admin1.id)).toMatchObject({ gross: 120000, adjustmentsTotal: -200000, total: -80000, remaining: 0 }); // manfiy jami to'lanmaydi
      expect(p.totals).toEqual({ total: 270000 + 95000 + 2_000_000, paid: 0, remaining: 270000 + 95000 + 2_000_000 });
      expect(await actions(bonus.id)).toContain('payroll.adjust');
    });

    it("ko'rish ruxsatlari: kassir ko'radi, admin/ustoz ko'rmaydi; ro'yxat jamilar; DRAFT davr 'me' da ko'rinmaydi", async () => {
      const list = (await cashier1.api.get('/payroll/periods').expect(200)).body.items;
      expect(list[0]).toMatchObject({ month: M, status: 'DRAFT', employees: 4, total: 2_365_000, paid: 0 });
      await admin1.api.get('/payroll/periods').expect(403);
      await teacher1.api.get('/payroll/periods').expect(403);
      await teacher1.api.get(`/payroll/periods/${M}`).expect(403);
      await admin1.api.get('/payroll/payouts').expect(403);
      expect((await teacher1.api.get('/payroll/me').expect(200)).body.items).toEqual([]); // tasdiqlanmagan
      await cashier1.api.get('/payroll/me').expect(403); // view_own faqat ustozda
      expect((await B.owner.get('/payroll/periods').expect(200)).body.items).toEqual([]);
    });

    it("to'lov tasdiqdan oldin mumkin emas; tasdiqlash: faqat rahbar, takror 409, hisoblanmagan davr 409", async () => {
      const pay = (body: object) => A.owner.post('/payroll/payouts', { month: M, employeeId: teacher1.id, amount: 1000, method: 'CASH', ...body });
      expect((await pay({}).expect(409)).body.code).toBe('PERIOD_NOT_APPROVED');
      expect((await A.owner.post(`/payroll/periods/${PREV}/approve`).expect(404)).body.code).toBe('PERIOD_NOT_FOUND');
      await db.insert(s.payrollPeriods).values({ centerId: A.centerId, month: `${PREV}-01` }); // hisoblanmagan davr
      expect((await A.owner.post(`/payroll/periods/${PREV}/approve`).expect(409)).body.code).toBe('NOT_CALCULATED');

      await cashier1.api.post(`/payroll/periods/${M}/approve`).expect(403);
      await admin1.api.post(`/payroll/periods/${M}/approve`).expect(403);
      const ok = (await A.owner.post(`/payroll/periods/${M}/approve`).expect(200)).body;
      expect(ok.period).toMatchObject({ status: 'APPROVED' });
      expect(ok.period.approvedAt).not.toBeNull();
      expect((await A.owner.post(`/payroll/periods/${M}/approve`).expect(409)).body.code).toBe('ALREADY_APPROVED');
      expect(await actions(ok.period.id)).toEqual(expect.arrayContaining(['payroll.calculate', 'payroll.approve']));
    });

    it("tasdiqlangan davr qulflanadi: hisoblash, tuzatish qo'shish/o'chirish 409", async () => {
      expect((await A.owner.post(`/payroll/periods/${M}/calculate`).expect(409)).body.code).toBe('PERIOD_LOCKED');
      expect((await A.owner.post(`/payroll/periods/${M}/adjustments`, { employeeId: teacher1.id, amount: 5, reason: 'x' }).expect(409)).body.code).toBe('PERIOD_LOCKED');
      const adj = (await periodOf(A.owner, M)).employees.find((e: { employeeId: string }) => e.employeeId === teacher1.id).adjustments[0];
      expect((await A.owner.del(`/payroll/adjustments/${adj.id}`).expect(409)).body.code).toBe('PERIOD_LOCKED');
      // bazaning o'zi ham rad etadi (servisni chetlab o'tganda)
      await expect(db.delete(s.payrollItems).where(eq(s.payrollItems.employeeId, teacher1.id))).rejects.toThrow();
    });

    it("o'z maoshi: ustoz faqat o'zinikini ko'radi (qatorlar, tuzatish, jami), boshqa xodim ma'lumoti yo'q", async () => {
      const mine = (await teacher1.api.get('/payroll/me').expect(200)).body.items;
      expect(mine).toHaveLength(1);
      expect(mine[0]).toMatchObject({ month: M, status: 'APPROVED', total: 270000, paid: 0, remaining: 270000 });
      expect(mine[0].employees ?? []).toEqual([]);
      expect(mine[0].items).toHaveLength(3);
      expect(mine[0].adjustments).toEqual([expect.objectContaining({ amount: 20000 })]);
      expect(JSON.stringify(mine)).not.toMatch(new RegExp(teacher2.id));
      const t2 = (await teacher2.api.get('/payroll/me').expect(200)).body.items[0];
      expect(t2).toMatchObject({ total: 95000 });
      expect(JSON.stringify(t2)).not.toMatch(new RegExp(teacher1.id));
      await httpFn().get('/payroll/me').expect(401);
    });
  });

  describe("maosh to'lovi", () => {
    let t1Payout: string;
    it("to'lov: qoldiqdan oshmaydi, usul/summa tekshiruvi, ruxsat (kassir ○), manfiy jamiga to'lanmaydi", async () => {
      const pay = (api: Api, body: object) => api.post('/payroll/payouts', { month: M, employeeId: teacher1.id, amount: 100000, method: 'CASH', ...body });
      await pay(cashier1.api, {}).expect(403); // payroll.pay ○ yoqilmagan
      await pay(admin1.api, {}).expect(403);
      await pay(teacher1.api, {}).expect(403);
      await pay(A.owner, { amount: 0 }).expect(400);
      await pay(A.owner, { method: 'CLICK' }).expect(400);
      await pay(A.owner, { month: 'x' }).expect(400);
      expect((await pay(A.owner, { amount: 270001 }).expect(409)).body.code).toBe('PAYOUT_EXCEEDS_REMAINING');
      expect((await pay(A.owner, { employeeId: admin1.id, amount: 1 }).expect(409)).body.code).toBe('PAYOUT_EXCEEDS_REMAINING'); // jami manfiy
      expect((await pay(A.owner, { month: PREV }).expect(409)).body.code).toBe('PERIOD_NOT_APPROVED');
      await pay(A.owner, { month: NEXT }).expect(404);
      await pay(A.owner, { employeeId: NOPE }).expect(404);
      await pay(B.owner, {}).expect(404);

      const p = (await pay(A.owner, { note: 'Avans' }).expect(201)).body;
      t1Payout = p.id;
      expect(p).toMatchObject({ month: M, employeeId: teacher1.id, employeeName: 'Ustoz Bir', amount: 100000, method: 'CASH', status: 'CONFIRMED', note: 'Avans' });
      expect(emp(await periodOf(A.owner, M), teacher1.id)).toMatchObject({ paid: 100000, remaining: 170000 });
      expect((await pay(A.owner, { amount: 170001 }).expect(409)).body.code).toBe('PAYOUT_EXCEEDS_REMAINING');
      await enable(A, cashier1.id, { 'payroll.pay': true });
      await pay(cashier1.api, { amount: 170000, method: 'TRANSFER' }).expect(201);
      expect(emp(await periodOf(A.owner, M), teacher1.id)).toMatchObject({ paid: 270000, remaining: 0 });
      expect(await actions(p.id)).toContain('payroll.pay');
    });

    it("hamma to'langach davr PAID; to'lov qaytarilsa yana APPROVED, qoldiq tiklanadi; qaytarish faqat rahbar, takror 409", async () => {
      const pay = (employeeId: string, amount: number) => A.owner.post('/payroll/payouts', { month: M, employeeId, amount, method: 'CASH' }).expect(201);
      await pay(teacher2.id, 95000);
      expect((await periodOf(A.owner, M)).period.status).toBe('APPROVED'); // kassir hali to'lanmagan
      const last = (await pay(cashier1.id, 2_000_000)).body;
      expect((await periodOf(A.owner, M)).period.status).toBe('PAID'); // admin jami manfiy: to'lov kerak emas
      expect((await periodOf(A.owner, M)).totals).toMatchObject({ remaining: 0, paid: 2_365_000 });
      expect((await A.owner.post('/payroll/payouts', { month: M, employeeId: cashier1.id, amount: 1, method: 'CASH' }).expect(409)).body.code).toBe('PAYOUT_EXCEEDS_REMAINING');

      await cashier1.api.post(`/payroll/payouts/${last.id}/reverse`, { reason: 'Xato' }).expect(403);
      await A.owner.post(`/payroll/payouts/${last.id}/reverse`, {}).expect(400);
      await A.owner.post(`/payroll/payouts/${NOPE}/reverse`, { reason: 'x' }).expect(404);
      await B.owner.post(`/payroll/payouts/${last.id}/reverse`, { reason: 'x' }).expect(404);
      const rev = (await A.owner.post(`/payroll/payouts/${last.id}/reverse`, { reason: "Noto'g'ri kiritilgan" }).expect(200)).body;
      expect(rev).toMatchObject({ id: last.id, status: 'REVERSED' });
      const p = await periodOf(A.owner, M);
      expect(p.period.status).toBe('APPROVED');
      expect(emp(p, cashier1.id)).toMatchObject({ paid: 0, remaining: 2_000_000 });
      expect(emp(p, cashier1.id).payouts).toEqual(expect.arrayContaining([expect.objectContaining({ amount: -2_000_000, status: 'CONFIRMED', reversesPayoutId: last.id, note: "Noto'g'ri kiritilgan" })]));
      expect((await A.owner.post(`/payroll/payouts/${last.id}/reverse`, { reason: 'Yana' }).expect(409)).body.code).toBe('ALREADY_REVERSED');
      const list = (await A.owner.get(`/payroll/payouts?month=${M}&employeeId=${cashier1.id}`).expect(200)).body.items as { id: string; amount: number; reversesPayoutId: string | null }[];
      const reversal = list.find((x) => x.reversesPayoutId === last.id)!;
      expect(reversal.amount).toBe(-2_000_000);
      expect((await A.owner.post(`/payroll/payouts/${reversal.id}/reverse`, { reason: 'Qaytarishni' }).expect(409)).body.code).toBe('NOT_REVERSIBLE');
      expect(await actions(last.id)).toContain('payroll.pay_reverse');

      await pay(cashier1.id, 2_000_000); // qayta to'lash mumkin
      expect((await periodOf(A.owner, M)).period.status).toBe('PAID');
    });

    it("to'lovlar ro'yxati: filtrlar va ruxsat; DB to'lovni o'zgartirishga/o'chirishga yo'l qo'ymaydi", async () => {
      expect((await cashier1.api.get(`/payroll/payouts?employeeId=${teacher1.id}`).expect(200)).body.items).toHaveLength(2);
      expect((await A.owner.get(`/payroll/payouts?month=${PREV}`).expect(200)).body.items).toEqual([]);
      expect((await A.owner.get('/payroll/payouts?limit=1').expect(200)).body.items).toHaveLength(1);
      expect((await B.owner.get('/payroll/payouts').expect(200)).body.items).toEqual([]);
      expect((await teacher1.api.get('/payroll/payouts').expect(403)).body.code).toBe('FORBIDDEN');
      await expect(db.update(s.payrollPayouts).set({ amount: 1 }).where(eq(s.payrollPayouts.id, t1Payout))).rejects.toThrow();
      const mine = (await teacher1.api.get('/payroll/me').expect(200)).body.items[0];
      expect(mine).toMatchObject({ status: 'PAID', paid: 270000, remaining: 0 });
    });
  });
});
