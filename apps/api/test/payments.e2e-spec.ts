// 14-qadam: to'lovlar (payments): qabul qilish, FIFO taqsimlash, avans, qaytarish, to'langan hisobni bekor qilish, balans, ruxsat va qamrov.
// PGlite, RLS yoqilgan. Bir oylik (bitta hisobli) o'quvchi = bugun yozilgan; ko'p oylik = o'tmishda yozilgan.
import { PERMISSIONS } from '@erp/shared';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq, sql } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { hashPassword } from '../src/auth/password.js';
import { addDays, dayOf, todayLocal } from '../src/common/dates.js';
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
const pastDay = (min: number) => {
  for (let n = min; ; n++) {
    const d = addDays(TODAY, -n);
    if (dayOf(d) <= 28) return d;
  }
};
type Api = ReturnType<typeof makeApi>;
let httpFn: () => request.Agent;
const makeApi = (t: string) => ({
  get: (p: string) => httpFn().get(p).set({ Authorization: `Bearer ${t}` }),
  post: (p: string, b: object = {}) => httpFn().post(p).set({ Authorization: `Bearer ${t}` }).send(b),
  put: (p: string, b: object) => httpFn().put(p).set({ Authorization: `Bearer ${t}` }).send(b),
});

describe("To'lovlar (payments) (PGlite, RLS yoqilgan)", () => {
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
    const res = await c.owner.post('/students', { fullName, branchId });
    if (res.status !== 201) throw new Error('mkStudent ' + res.status + ' ' + JSON.stringify(res.body));
    const login = res.body.student.login as string;
    let cached: Promise<Api> | undefined;
    return { id: res.body.student.id as string, api: () => (cached ??= activate(login, res.body.temporaryPassword).then(makeApi)) };
  }
  const mkGroup = async (c: Center, name: string, extra: Record<string, unknown> = {}) =>
    (await c.owner.post('/groups', { name, courseId: c.course, branchId: c.main, priceMonthly: 400000, billingMode: 'GROUP_CYCLE', billingDay: 5, status: 'ACTIVE', ...extra }).expect(201)).body.id as string;
  const enroll = async (c: Center, groupId: string, studentId: string, extra: Record<string, unknown> = {}) =>
    (await c.owner.post('/enrollments', { groupId, studentId, ...extra }).expect(201)).body.id as string;

  interface ChargeView {
    id: string;
    amount: number;
    status: string;
    periodStart: string;
  }
  const chargesOf = async (api: Api, studentId: string) =>
    ((await api.get(`/charges?limit=200&studentId=${studentId}`).expect(200)).body.items as ChargeView[]).sort((a, b) => a.periodStart.localeCompare(b.periodStart));
  const balance = async (api: Api, studentId: string) => (await api.get(`/students/${studentId}/balance`).expect(200)).body;
  const pay = (api: Api, studentId: string, amount: number, extra: Record<string, unknown> = {}) => api.post('/payments', { studentId, amount, method: 'CASH', ...extra });
  const actions = async (entityId: string) => (await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, entityId))).map((x) => x.action);

  let A: Center;
  let B: Center;
  let groupMain: string;
  let admin1: Awaited<ReturnType<typeof staff>>;
  let cashier1: Awaited<ReturnType<typeof staff>>;
  let cashier2: Awaited<ReturnType<typeof staff>>;
  let teacher1: Awaited<ReturnType<typeof staff>>;
  let n = 0;
  /** Bugun yozilgan, bitta hisobli (400 000) o'quvchi. */
  const single = async () => {
    const st = await mkStudent(A, `Talaba${++n} Oylik`, A.main);
    await enroll(A, groupMain, st.id);
    return st;
  };

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

    A = await newCenter("To'lov Markazi A");
    B = await newCenter("To'lov Markazi B");
    groupMain = await mkGroup(A, 'Asosiy guruh');
    admin1 = await staff(A, 'ADMIN', 'Admin Bir', [A.main]);
    cashier1 = await staff(A, 'CASHIER', 'Kassir Bir', [A.main]);
    cashier2 = await staff(A, 'CASHIER', 'Kassir Ikki', [A.second]);
    teacher1 = await staff(A, 'TEACHER', 'Ustoz Bir', [A.main]);
  });

  afterAll(async () => {
    await app?.close();
    await pg?.close();
  });

  describe("qabul qilish va FIFO taqsimlash", () => {
    it("to'lov eng eski hisobdan boshlab taqsimlanadi: to'liq yopilgan PAID, qisman PARTIAL; chek raqami ketma-ket", async () => {
      const st = await mkStudent(A, "Ko'p Oylik", A.main);
      await enroll(A, groupMain, st.id, { joinedAt: pastDay(70) });
      const before = await chargesOf(A.owner, st.id);
      expect(before.length).toBeGreaterThanOrEqual(2);
      expect(before.every((c) => c.status === 'OPEN')).toBe(true);

      const p1 = (await pay(cashier1.api, st.id, 500000).expect(201)).body;
      expect(p1).toMatchObject({ amount: 500000, method: 'CASH', status: 'CONFIRMED', studentId: st.id, branchId: A.main, allocated: 500000, unallocated: 0, receivedBy: cashier1.id });
      expect(p1.allocations.map((a: { amount: number }) => a.amount)).toEqual([400000, 100000]);
      const after = await chargesOf(A.owner, st.id);
      expect(after[0]).toMatchObject({ status: 'PAID' });
      expect(after[1]).toMatchObject({ status: 'PARTIAL' });
      expect(after.slice(2).every((c) => c.status === 'OPEN')).toBe(true);

      const p2 = (await pay(cashier1.api, st.id, 300000, { method: 'CARD' }).expect(201)).body;
      expect(p2.receiptNo).toBe(p1.receiptNo + 1);
      expect((await chargesOf(A.owner, st.id))[1]).toMatchObject({ status: 'PAID' }); // 100 000 + 300 000 = 400 000

      const bal = await balance(A.owner, st.id);
      expect(bal).toMatchObject({ charged: 400000 * before.length, allocated: 800000, debt: 400000 * before.length - 800000, advance: 0, paymentsTotal: 800000 });
    });

    it("bir to'lov bilan bir necha oy yopiladi, ortiqcha summa avans bo'ladi", async () => {
      const st = await mkStudent(A, 'Avansli', A.main);
      await enroll(A, groupMain, st.id, { joinedAt: pastDay(40) });
      const cs = await chargesOf(A.owner, st.id);
      const total = cs.length * 400000;
      const p = (await pay(cashier1.api, st.id, total + 150000).expect(201)).body;
      expect(p).toMatchObject({ allocated: total, unallocated: 150000 });
      expect((await chargesOf(A.owner, st.id)).every((c) => c.status === 'PAID')).toBe(true);
      expect(await balance(A.owner, st.id)).toMatchObject({ debt: 0, advance: 150000, openCharges: [] });
    });

    it("avans qo'lda hisobga avtomatik o'tadi (qolgani avans bo'lib qoladi)", async () => {
      const st = await single();
      await pay(cashier1.api, st.id, 500000).expect(201); // 400 000 hisob + 100 000 avans
      const e = (await A.owner.get(`/enrollments?studentId=${st.id}`).expect(200)).body.items[0].id as string;
      const m = (await A.owner.post('/charges', { enrollmentId: e, amount: 60000, note: "Qo'shimcha" }).expect(201)).body;
      expect(m.status).toBe('PAID');
      expect(await balance(A.owner, st.id)).toMatchObject({ debt: 0, advance: 40000 });
      const big = (await A.owner.post('/charges', { enrollmentId: e, amount: 100000, note: 'Yana' }).expect(201)).body;
      expect(big.status).toBe('PARTIAL');
      expect(await balance(A.owner, st.id)).toMatchObject({ debt: 60000, advance: 0 });
    });

    it("hisob yaratilishidan oldingi to'lov (avans) yozilganda birinchi hisobga avtomatik taqsimlanadi", async () => {
      const st = await mkStudent(A, 'Oldindan', A.main);
      const p = (await pay(cashier1.api, st.id, 100000).expect(201)).body;
      expect(p).toMatchObject({ allocated: 0, unallocated: 100000 });
      await enroll(A, groupMain, st.id);
      expect((await chargesOf(A.owner, st.id))[0]).toMatchObject({ status: 'PARTIAL' });
      expect(await balance(A.owner, st.id)).toMatchObject({ debt: 300000, advance: 0, paymentsTotal: 100000 });
      expect((await A.owner.get(`/payments/${p.id}`).expect(200)).body).toMatchObject({ allocated: 100000, unallocated: 0 });
    });

    it("bir vaqtdagi ikki to'lov: chek raqamlari takrorlanmaydi, ortiqcha taqsimlanmaydi", async () => {
      const st = await single();
      const [r1, r2] = await Promise.all([pay(cashier1.api, st.id, 300000), pay(A.owner, st.id, 300000)]);
      expect([r1.status, r2.status]).toEqual([201, 201]);
      expect(r1.body.receiptNo).not.toBe(r2.body.receiptNo);
      expect(await balance(A.owner, st.id)).toMatchObject({ allocated: 400000, debt: 0, advance: 200000, paymentsTotal: 600000 });
    });

    it("chek raqami markaz bo'yicha mustaqil", async () => {
      const first = (await B.owner.get('/payments').expect(200)).body.items;
      expect(first).toEqual([]);
      const st = await mkStudent(B, 'B o\'quvchi', B.main);
      const p = (await pay(B.owner, st.id, 1000).expect(201)).body;
      expect(p.receiptNo).toBe(1);
    });
  });

  describe('tekshiruvlar', () => {
    it("noto'g'ri kiritish: summa, usul, kelajak sanasi, noma'lum o'quvchi", async () => {
      const st = await single();
      await pay(cashier1.api, st.id, 0).expect(400);
      await pay(cashier1.api, st.id, -5).expect(400);
      await pay(cashier1.api, st.id, 10.5).expect(400);
      await pay(cashier1.api, st.id, 1000, { method: 'CLICK' }).expect(400);
      await pay(cashier1.api, st.id, 1000, { paidAt: new Date(Date.now() + 86_400_000).toISOString() }).expect(400);
      expect((await pay(cashier1.api, NOPE, 1000).expect(404)).body.code).toBe('STUDENT_NOT_FOUND');
      expect((await pay(cashier1.api, cashier1.id, 1000).expect(404)).body.code).toBe('STUDENT_NOT_FOUND'); // xodim o'quvchi emas
      await pay(cashier1.api, st.id, 1000, { paidAt: new Date(Date.now() - 86_400_000).toISOString(), note: 'Kecha' }).expect(201);
    });

    it("filial: yagona filial avtomatik, ikki filialda branchId majburiy, qamrovdan tashqari filial 403", async () => {
      const st = await mkStudent(A, 'Ikki filialli', A.main);
      const second = await mkGroup(A, 'Ikkinchi filial guruhi', { branchId: A.second });
      await enroll(A, second, st.id); // o'quvchi ikkinchi filialga avtomatik bog'lanadi
      expect((await pay(A.owner, st.id, 1000).expect(400)).body.code).toBe('BRANCH_REQUIRED');
      const ok = (await pay(A.owner, st.id, 1000, { branchId: A.second }).expect(201)).body;
      expect(ok.branchId).toBe(A.second);
      expect((await pay(cashier1.api, st.id, 1000).expect(201)).body.branchId).toBe(A.main); // kassir uchun yagona qamrovdagi filial
      await pay(cashier1.api, st.id, 1000, { branchId: A.second }).expect(403);
      await pay(A.owner, st.id, 1000, { branchId: NOPE }).expect(404);
    });
  });

  describe("qaytarish", () => {
    it("qaytarish: asl REVERSED, manfiy yozuv, hisoblar qayta ochiladi; takror va qaytarish yozuvini qaytarish 409", async () => {
      const st = await single();
      const p = (await pay(cashier1.api, st.id, 400000).expect(201)).body;
      expect((await chargesOf(A.owner, st.id))[0]!.status).toBe('PAID');

      const done = (await A.owner.post(`/payments/${p.id}/reverse`, { reason: 'Xato kiritilgan' }).expect(200)).body;
      expect(done).toMatchObject({ id: p.id, status: 'REVERSED', allocated: 0, unallocated: 0 });
      expect((await chargesOf(A.owner, st.id))[0]!.status).toBe('OPEN');
      expect(await balance(A.owner, st.id)).toMatchObject({ debt: 400000, advance: 0, paymentsTotal: 0 });

      const list = (await A.owner.get(`/payments?studentId=${st.id}`).expect(200)).body.items as { id: string; amount: number; reversesPaymentId: string | null; note: string | null; status: string; receiptNo: number }[];
      const rev = list.find((x) => x.reversesPaymentId === p.id)!;
      expect(rev).toMatchObject({ amount: -400000, status: 'CONFIRMED', note: 'Xato kiritilgan' });
      expect(rev.receiptNo).toBeGreaterThan(p.receiptNo);

      expect((await A.owner.post(`/payments/${p.id}/reverse`, { reason: 'Yana' }).expect(409)).body.code).toBe('ALREADY_REVERSED');
      expect((await A.owner.post(`/payments/${rev.id}/reverse`, { reason: 'Qaytarishni' }).expect(409)).body.code).toBe('NOT_REVERSIBLE');
      expect(await actions(p.id)).toContain('payment.reverse');
      expect(await actions(p.id)).toContain('payment.create');
    });

    it("qaytarilgan to'lovdan keyin boshqa avans qaytgan hisobga o'tadi", async () => {
      const st = await single();
      const p1 = (await pay(cashier1.api, st.id, 400000).expect(201)).body;
      await pay(cashier1.api, st.id, 100000).expect(201); // avans
      await A.owner.post(`/payments/${p1.id}/reverse`, { reason: 'Qaytarish' }).expect(200);
      expect((await chargesOf(A.owner, st.id))[0]!.status).toBe('PARTIAL');
      expect(await balance(A.owner, st.id)).toMatchObject({ debt: 300000, advance: 0, paymentsTotal: 100000 });
    });

    it("qaytarish ruxsatlari: rahbar ✔, kassir ○ (yoqilmagan 403), admin 403, boshqa markaz 404, sabab majburiy", async () => {
      const st = await single();
      const p = (await pay(cashier1.api, st.id, 1000).expect(201)).body;
      await A.owner.post(`/payments/${p.id}/reverse`, {}).expect(400);
      await cashier1.api.post(`/payments/${p.id}/reverse`, { reason: 'x' }).expect(403);
      await admin1.api.post(`/payments/${p.id}/reverse`, { reason: 'x' }).expect(403);
      await teacher1.api.post(`/payments/${p.id}/reverse`, { reason: 'x' }).expect(403);
      await B.owner.post(`/payments/${p.id}/reverse`, { reason: 'x' }).expect(404);
      await A.owner.post(`/payments/${NOPE}/reverse`, { reason: 'x' }).expect(404);
      // rahbar kassirga ○ ruxsatni beradi
      await A.owner.put(`/permissions/users/${cashier1.id}`, { permissions: { 'payment.reverse': true } }).expect(200);
      await cashier1.api.post(`/payments/${p.id}/reverse`, { reason: 'Ruxsat bilan' }).expect(200);
    });
  });

  describe("to'langan hisobni bekor qilish", () => {
    it("PAID hisob bekor qilinsa pul avansga o'tadi; avans keyingi hisobga ketadi; to'lov taqsimotida iz qoladi", async () => {
      const st = await single();
      const p = (await pay(cashier1.api, st.id, 400000).expect(201)).body;
      const [c] = await chargesOf(A.owner, st.id);
      expect(c!.status).toBe('PAID');

      const done = (await A.owner.post(`/charges/${c!.id}/cancel`, { reason: "O'quvchi chiqdi" }).expect(200)).body;
      expect(done.status).toBe('CANCELLED');
      expect(await balance(A.owner, st.id)).toMatchObject({ debt: 0, advance: 400000, charged: 0, paymentsTotal: 400000 });
      expect((await A.owner.get(`/payments/${p.id}`).expect(200)).body).toMatchObject({ allocated: 0, unallocated: 400000, allocations: [] });

      const e = (await A.owner.get(`/enrollments?studentId=${st.id}`).expect(200)).body.items[0].id as string;
      const m = (await A.owner.post('/charges', { enrollmentId: e, amount: 150000, note: "Yangi hisob" }).expect(201)).body;
      expect(m.status).toBe('PAID');
      expect(await balance(A.owner, st.id)).toMatchObject({ debt: 0, advance: 250000 });
      const act = (await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, c!.id))).find((x) => x.action === 'charge.cancel');
      expect((act!.after as { refunded: number }).refunded).toBe(400000);
    });

    it("qisman to'langan hisob bekor qilinsa to'langani boshqa ochiq hisobga o'tadi", async () => {
      const st = await mkStudent(A, 'Ikki hisob', A.main);
      await enroll(A, groupMain, st.id, { joinedAt: pastDay(40) });
      const cs = await chargesOf(A.owner, st.id);
      expect(cs.length).toBeGreaterThanOrEqual(2);
      await pay(cashier1.api, st.id, 100000).expect(201); // birinchi hisob PARTIAL
      await A.owner.post(`/charges/${cs[0]!.id}/cancel`, { reason: 'Birinchi oy bepul' }).expect(200);
      const after = await chargesOf(A.owner, st.id);
      expect(after[0]).toMatchObject({ status: 'CANCELLED' });
      expect(after[1]).toMatchObject({ status: 'PARTIAL' }); // 100 000 keyingi hisobga o'tdi
      expect(await balance(A.owner, st.id)).toMatchObject({ advance: 0 });
    });
  });

  describe("ko'rish, qamrov va ruxsat", () => {
    it("ro'yxat: filtrlar, sahifalash, tartib (yangi birinchi); kassir faqat o'z filiali; o'quvchi faqat o'zinikini", async () => {
      const st = await single();
      const other = await single();
      const p1 = (await pay(cashier1.api, st.id, 1000, { method: 'TRANSFER' }).expect(201)).body;
      const p2 = (await pay(cashier1.api, st.id, 2000).expect(201)).body;
      await pay(cashier1.api, other.id, 3000).expect(201);

      const mine = (await cashier1.api.get(`/payments?studentId=${st.id}`).expect(200)).body.items as { id: string }[];
      expect(mine.map((x) => x.id)).toEqual([p2.id, p1.id]);
      const tr = (await A.owner.get(`/payments?studentId=${st.id}&method=TRANSFER`).expect(200)).body.items;
      expect(tr).toHaveLength(1);
      expect((await A.owner.get(`/payments?studentId=${st.id}&limit=1&offset=1`).expect(200)).body.items[0].id).toBe(p1.id);
      expect((await A.owner.get(`/payments?studentId=${st.id}&from=${TODAY}&to=${TODAY}`).expect(200)).body.items.length).toBe(2);
      expect((await A.owner.get(`/payments?studentId=${st.id}&from=${addDays(TODAY, 1)}`).expect(200)).body.items).toEqual([]);

      expect((await cashier2.api.get(`/payments?studentId=${st.id}`).expect(200)).body.items).toEqual([]); // boshqa filial
      expect((await cashier2.api.get(`/payments?branchId=${A.main}`).expect(200)).body.items).toEqual([]);
      await cashier2.api.get(`/payments/${p1.id}`).expect(404);

      const own = (await (await st.api()).get('/payments').expect(200)).body.items as { studentId: string }[];
      expect(own.length).toBe(2);
      expect(own.every((x) => x.studentId === st.id)).toBe(true);
      await (await other.api()).get(`/payments/${p1.id}`).expect(404);
      expect((await (await st.api()).get(`/payments/${p1.id}`).expect(200)).body.receiptNo).toBe(p1.receiptNo);
    });

    it("ruxsatlar: o'quvchi/ustoz yozolmaydi, admin ○ (yoqilmagan 403), boshqa markaz va tokensiz", async () => {
      const st = await single();
      await pay(await st.api(), st.id, 1000).expect(403);
      await pay(teacher1.api, st.id, 1000).expect(403);
      await pay(admin1.api, st.id, 1000).expect(403);
      await teacher1.api.get('/payments').expect(403);
      await admin1.api.get('/payments').expect(403);
      await pay(B.owner, st.id, 1000).expect(404);
      await httpFn().post('/payments').send({ studentId: st.id, amount: 1000, method: 'CASH' }).expect(401);

      await A.owner.put(`/permissions/users/${admin1.id}`, { permissions: { 'payment.create': true, 'payment.view': true } }).expect(200);
      expect((await pay(admin1.api, st.id, 1000).expect(201)).body.branchId).toBe(A.main);
      await A.owner.put(`/permissions/users/${admin1.id}`, { permissions: { 'payment.create': null, 'payment.view': null } }).expect(200);
      await pay(admin1.api, st.id, 1000).expect(403);
    });

    it("kassir boshqa filial o'quvchisiga to'lov qabul qila olmaydi (404)", async () => {
      const st = await single();
      expect((await pay(cashier2.api, st.id, 1000).expect(404)).body.code).toBe('STUDENT_NOT_FOUND');
    });

    it("balans: rahbar/kassir ko'radi, o'quvchi faqat o'zinikini, qamrovdan tashqari/boshqa markaz 404, ustoz 403", async () => {
      const st = await single();
      const other = await single();
      await pay(cashier1.api, st.id, 100000).expect(201);
      expect(await balance(cashier1.api, st.id)).toMatchObject({ charged: 400000, debt: 300000, advance: 0, studentName: expect.any(String) });
      expect(await balance(await st.api(), st.id)).toMatchObject({ debt: 300000 });
      await (await st.api()).get(`/students/${other.id}/balance`).expect(404);
      await cashier2.api.get(`/students/${st.id}/balance`).expect(404);
      await B.owner.get(`/students/${st.id}/balance`).expect(404);
      await teacher1.api.get(`/students/${st.id}/balance`).expect(403);
      await A.owner.get(`/students/${cashier1.id}/balance`).expect(404);
    });
  });

  describe('audit va maxfiylik', () => {
    it("audit: payment.create summa va chek bilan; izoh/sabab saqlanadi", async () => {
      const st = await single();
      const p = (await pay(cashier1.api, st.id, 7000, { note: 'Naqd' }).expect(201)).body;
      const log = (await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, p.id))).find((x) => x.action === 'payment.create')!;
      expect(log.actorId).toBe(cashier1.id);
      expect(log.after).toMatchObject({ amount: 7000, method: 'CASH', receiptNo: p.receiptNo, studentId: st.id });
      const row = (await db.select().from(s.payments).where(eq(s.payments.id, p.id)))[0]!;
      expect(row.note).toBe('Naqd');
    });

    it("bazada to'lovni to'g'ridan-to'g'ri o'zgartirib/o'chirib bo'lmaydi (trigger)", async () => {
      const st = await single();
      const p = (await pay(cashier1.api, st.id, 5000).expect(201)).body;
      await expect(db.execute(sql`update payments set amount = 1 where id = ${p.id}`)).rejects.toThrow();
    });
  });
});
