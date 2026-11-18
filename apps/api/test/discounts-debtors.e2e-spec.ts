// 15-qadam: chegirmalar (enrollment_discounts) va qarzdorlar (GET /debtors). PGlite, RLS yoqilgan.
// Aniq natija uchun STUDENT_CYCLE guruhlar ishlatiladi: bir oydan kam muddatda faqat bitta hisob bo'ladi (davr yozilish sanasidan).
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
const daysAgo = (n: number) => addDays(TODAY, -n);
type Api = ReturnType<typeof makeApi>;
let httpFn: () => request.Agent;
const makeApi = (t: string) => ({
  get: (p: string) => httpFn().get(p).set({ Authorization: `Bearer ${t}` }),
  post: (p: string, b: object = {}) => httpFn().post(p).set({ Authorization: `Bearer ${t}` }).send(b),
  put: (p: string, b: object) => httpFn().put(p).set({ Authorization: `Bearer ${t}` }).send(b),
});

describe('Chegirmalar va qarzdorlar (PGlite, RLS yoqilgan)', () => {
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
  let n = 0;
  async function mkStudent(c: Center, prefix: string, branchId: string) {
    const res = await c.owner.post('/students', { fullName: `${prefix}${++n} Talaba`, branchId }).expect(201);
    const login = res.body.student.login as string;
    let cached: Promise<Api> | undefined;
    return { id: res.body.student.id as string, name: `${prefix}${n} Talaba`, api: () => (cached ??= activate(login, res.body.temporaryPassword).then(makeApi)) };
  }
  const mkGroup = async (c: Center, name: string, extra: Record<string, unknown> = {}) =>
    (await c.owner.post('/groups', { name, courseId: c.course, branchId: c.main, priceMonthly: 400000, billingMode: 'STUDENT_CYCLE', status: 'ACTIVE', ...extra }).expect(201)).body.id as string;
  const enroll = async (c: Center, groupId: string, studentId: string, joinedAt: string) =>
    (await c.owner.post('/enrollments', { groupId, studentId, joinedAt }).expect(201)).body.id as string;
  const debtors = async (api: Api, qs: string) => (await api.get(`/debtors?${qs}`).expect(200)).body;
  const pay = (api: Api, studentId: string, amount: number) => api.post('/payments', { studentId, amount, method: 'CASH' });
  const enable = (c: Center, userId: string, codes: Record<string, boolean | null>) => c.owner.put(`/permissions/users/${userId}`, { permissions: codes }).expect(200);
  const actions = async (entityId: string) => (await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, entityId))).map((x) => x.action);
  interface ChargeView {
    id: string;
    baseAmount: number;
    discountAmount: number;
    amount: number;
    status: string;
    periodStart: string;
  }
  const chargesOf = async (api: Api, studentId: string) =>
    ((await api.get(`/charges?limit=200&studentId=${studentId}`).expect(200)).body.items as ChargeView[]).sort((a, b) => a.periodStart.localeCompare(b.periodStart));

  let A: Center;
  let B: Center;
  let admin1: Awaited<ReturnType<typeof staff>>;
  let cashier1: Awaited<ReturnType<typeof staff>>;
  let cashier2: Awaited<ReturnType<typeof staff>>;
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

    A = await newCenter('Qarz Markazi A');
    B = await newCenter('Qarz Markazi B');
    admin1 = await staff(A, 'ADMIN', 'Admin Bir', [A.main]);
    cashier1 = await staff(A, 'CASHIER', 'Kassir Bir', [A.main]);
    cashier2 = await staff(A, 'CASHIER', 'Kassir Ikki', [A.second]);
    teacher1 = await staff(A, 'TEACHER', 'Ustoz Bir', [A.main]);
  });

  afterAll(async () => {
    await app?.close();
    await pg?.close();
  });

  describe('chegirmalar', () => {
    let g: string;
    beforeAll(async () => {
      g = await mkGroup(A, 'Chegirma guruhi');
    });

    it("berish: o'tgan hisoblar eski narxda qotadi (avval hisoblanadi), chegirma saqlanadi, audit yoziladi", async () => {
      const st = await mkStudent(A, 'Chegirmali', A.main);
      const e = await enroll(A, g, st.id, daysAgo(40)); // 2 ta hisob: yozilgan kun va bir oy keyin
      await db.delete(s.charges).where(eq(s.charges.studentId, st.id)); // "hali hisoblanmagan" holat
      const d = (await A.owner.post(`/enrollments/${e}/discounts`, { type: 'PERCENT', value: 25, reason: "Aka-uka" }).expect(201)).body;
      expect(d).toMatchObject({ enrollmentId: e, type: 'PERCENT', value: 25, reason: 'Aka-uka', fromDate: null, toDate: null, active: true, overlaps: [] });
      const cs = await chargesOf(A.owner, st.id);
      expect(cs.length).toBeGreaterThanOrEqual(2);
      expect(cs.every((c) => c.discountAmount === 0 && c.amount === 400000)).toBe(true); // chegirmadan oldin yaratilgan
      expect(await actions(d.id)).toContain('discount.grant');
    });

    it("yangi hisoblarga chegirma qo'llanadi: foiz, summa, bepul; muddatli chegirma sanadan tashqarida qo'llanmaydi", async () => {
      const mk = async (body: object) => {
        const st = await mkStudent(A, 'Yangi', A.main);
        const e = await enroll(A, g, st.id, daysAgo(5));
        await A.owner.post(`/enrollments/${e}/discounts`, { reason: 'Test', ...body }).expect(201);
        await db.delete(s.charges).where(eq(s.charges.studentId, st.id));
        await A.owner.post('/billing/generate').expect(200);
        return (await chargesOf(A.owner, st.id))[0]!;
      };
      expect(await mk({ type: 'PERCENT', value: 25 })).toMatchObject({ baseAmount: 400000, discountAmount: 100000, amount: 300000, status: 'OPEN' });
      expect(await mk({ type: 'AMOUNT', value: 150000 })).toMatchObject({ discountAmount: 150000, amount: 250000 });
      expect(await mk({ type: 'AMOUNT', value: 900000 })).toMatchObject({ discountAmount: 400000, amount: 0, status: 'PAID' }); // asos summadan oshmaydi
      expect(await mk({ type: 'FREE' })).toMatchObject({ discountAmount: 400000, amount: 0, status: 'PAID' });
      expect(await mk({ type: 'PERCENT', value: 50, fromDate: addDays(TODAY, 1) })).toMatchObject({ discountAmount: 0, amount: 400000 }); // hali boshlanmagan
      expect(await mk({ type: 'PERCENT', value: 50, toDate: daysAgo(10) })).toMatchObject({ discountAmount: 0 }); // tugagan
    });

    it("tugatish: to_date qo'yiladi, qator saqlanadi; takror 409; boshlanishdan oldin 400; noma'lum 404", async () => {
      const st = await mkStudent(A, 'Tugatish', A.main);
      const e = await enroll(A, g, st.id, daysAgo(3));
      const d = (await A.owner.post(`/enrollments/${e}/discounts`, { type: 'FREE', reason: 'Imtiyoz', fromDate: daysAgo(2) }).expect(201)).body;
      await A.owner.post(`/discounts/${d.id}/end`, { toDate: daysAgo(5) }).expect(400);
      const done = (await A.owner.post(`/discounts/${d.id}/end`, { toDate: daysAgo(1) }).expect(200)).body;
      expect(done).toMatchObject({ id: d.id, toDate: daysAgo(1), active: false });
      expect((await A.owner.post(`/discounts/${d.id}/end`, { toDate: daysAgo(1) }).expect(409)).body.code).toBe('ALREADY_ENDED');
      await A.owner.post(`/discounts/${NOPE}/end`, {}).expect(404);
      const sess = (await A.owner.post(`/enrollments/${e}/discounts`, { type: 'AMOUNT', value: 1000, reason: 'Yana' }).expect(201)).body;
      expect((await A.owner.post(`/discounts/${sess.id}/end`, {}).expect(200)).body.toDate).toBe(TODAY); // sukut: bugun
      expect(await actions(d.id)).toEqual(expect.arrayContaining(['discount.grant', 'discount.end']));
      expect((await A.owner.get(`/enrollments/${e}/discounts`).expect(200)).body.items).toHaveLength(2);
    });

    it("ustma-ust chegirma ogohlantirishi (overlaps), ikkalasi saqlanadi va qo'shiladi", async () => {
      const st = await mkStudent(A, 'Ustma', A.main);
      const e = await enroll(A, g, st.id, daysAgo(2));
      const d1 = (await A.owner.post(`/enrollments/${e}/discounts`, { type: 'PERCENT', value: 10, reason: 'Bir' }).expect(201)).body;
      const d2 = (await A.owner.post(`/enrollments/${e}/discounts`, { type: 'PERCENT', value: 15, reason: 'Ikki' }).expect(201)).body;
      expect(d2.overlaps).toEqual([d1.id]);
      const d3 = (await A.owner.post(`/enrollments/${e}/discounts`, { type: 'PERCENT', value: 5, reason: 'Uch', fromDate: addDays(TODAY, 400) }).expect(201)).body;
      expect(d3.overlaps).toEqual([d1.id, d2.id].sort((a: string, b: string) => a.localeCompare(b)));
      await db.delete(s.charges).where(eq(s.charges.studentId, st.id));
      await A.owner.post('/billing/generate').expect(200);
      expect((await chargesOf(A.owner, st.id))[0]).toMatchObject({ discountAmount: 100000 }); // 10% + 15%
    });

    it("tekshiruvlar: qiymat qoidalari, sabab majburiy, sana tartibi", async () => {
      const st = await mkStudent(A, 'Tekshir', A.main);
      const e = await enroll(A, g, st.id, daysAgo(1));
      const post = (b: object) => A.owner.post(`/enrollments/${e}/discounts`, b);
      await post({ type: 'FREE', value: 5, reason: 'x' }).expect(400);
      await post({ type: 'PERCENT', value: 101, reason: 'x' }).expect(400);
      await post({ type: 'PERCENT', reason: 'x' }).expect(400);
      await post({ type: 'AMOUNT', reason: 'x' }).expect(400);
      await post({ type: 'AMOUNT', value: 0, reason: 'x' }).expect(400);
      await post({ type: 'AMOUNT', value: 100 }).expect(400);
      await post({ type: 'FREE', reason: 'x', fromDate: TODAY, toDate: daysAgo(1) }).expect(400);
      await post({ type: 'WEIRD', reason: 'x' }).expect(400);
      await A.owner.post(`/enrollments/${NOPE}/discounts`, { type: 'FREE', reason: 'x' }).expect(404);
      await A.owner.post(`/enrollments/${e}/leave`, {}).expect(200);
      expect((await post({ type: 'FREE', reason: 'x' }).expect(409)).body.code).toBe('ALREADY_LEFT');
    });

    it("ruxsatlar: rahbar ✔; kassir/admin ○ (yoqilmaguncha 403), filial qamrovi (boshqa filial 404); ustoz/o'quvchi yozolmaydi; boshqa markaz 404", async () => {
      const st = await mkStudent(A, 'Ruxsat', A.main);
      const e = await enroll(A, g, st.id, daysAgo(1));
      const body = { type: 'PERCENT', value: 5, reason: 'Ruxsat sinovi' };
      await cashier1.api.post(`/enrollments/${e}/discounts`, body).expect(403);
      await admin1.api.post(`/enrollments/${e}/discounts`, body).expect(403);
      await teacher1.api.post(`/enrollments/${e}/discounts`, body).expect(403);
      await (await st.api()).post(`/enrollments/${e}/discounts`, body).expect(403);
      await httpFn().post(`/enrollments/${e}/discounts`).send(body).expect(401);
      await B.owner.post(`/enrollments/${e}/discounts`, body).expect(404);

      await enable(A, cashier1.id, { 'discount.grant': true });
      await enable(A, cashier2.id, { 'discount.grant': true });
      await enable(A, admin1.id, { 'discount.grant': true });
      const ok = (await cashier1.api.post(`/enrollments/${e}/discounts`, body).expect(201)).body;
      await admin1.api.post(`/discounts/${ok.id}/end`, {}).expect(200);
      await cashier2.api.post(`/enrollments/${e}/discounts`, body).expect(404); // boshqa filial
      await B.owner.post(`/discounts/${ok.id}/end`, {}).expect(404);
      await enable(A, cashier1.id, { 'discount.grant': null });
      await cashier1.api.post(`/enrollments/${e}/discounts`, body).expect(403);
    });

    it("ro'yxat: kassir (payment.view) ko'radi, o'quvchi faqat o'zinikini, ustoz 403, boshqa markaz 404", async () => {
      const st = await mkStudent(A, 'Royxat', A.main);
      const other = await mkStudent(A, 'Boshqa', A.main);
      const e = await enroll(A, g, st.id, daysAgo(1));
      await A.owner.post(`/enrollments/${e}/discounts`, { type: 'FREE', reason: 'Ko\'rish' }).expect(201);
      expect((await cashier1.api.get(`/enrollments/${e}/discounts`).expect(200)).body.items).toHaveLength(1);
      expect((await (await st.api()).get(`/enrollments/${e}/discounts`).expect(200)).body.items).toHaveLength(1);
      await (await other.api()).get(`/enrollments/${e}/discounts`).expect(404);
      await cashier2.api.get(`/enrollments/${e}/discounts`).expect(404);
      await teacher1.api.get(`/enrollments/${e}/discounts`).expect(403);
      await B.owner.get(`/enrollments/${e}/discounts`).expect(404);
    });
  });

  describe('qarzdorlar', () => {
    let g3: string; // grace 3 kun
    let g0: string; // grace 0
    let g2: string; // ikkinchi guruh (ustozsiz)
    let s3: Awaited<ReturnType<typeof mkStudent>>;
    let s4: Awaited<ReturnType<typeof mkStudent>>;
    let s10: Awaited<ReturnType<typeof mkStudent>>;
    let sOther: Awaited<ReturnType<typeof mkStudent>>;

    beforeAll(async () => {
      g3 = await mkGroup(A, 'Qarz grace 3', { graceDays: 3 });
      g0 = await mkGroup(A, 'Qarz grace 0', { graceDays: 0 });
      g2 = await mkGroup(A, 'Qarz ikkinchi', { graceDays: 0, priceMonthly: 200000 });
      await A.owner.post(`/groups/${g3}/teachers`, { teacherId: teacher1.id, kind: 'MAIN' }).expect(200);
      s3 = await mkStudent(A, 'Qarzdor', A.main);
      s4 = await mkStudent(A, 'Qarzdor', A.main);
      s10 = await mkStudent(A, 'Qarzdor', A.main);
      sOther = await mkStudent(A, 'Qarzdor', A.main);
      await enroll(A, g3, s3.id, daysAgo(3)); // due + grace = bugun: hali qarzdor emas
      await enroll(A, g3, s4.id, daysAgo(4)); // 1 kun kechikdi
      await enroll(A, g3, s10.id, daysAgo(10));
      await enroll(A, g3, sOther.id, TODAY);
      await enroll(A, g2, s10.id, daysAgo(6)); // s10 ikkita guruhda qarzdor
    });

    it("grace chegarasi: due_date + grace_days o'tmaguncha qarzdor emas (aniq chegarada ham emas), o'tgach qarzdor", async () => {
      const r = await debtors(A.owner, `groupId=${g3}`);
      const ids = r.items.map((i: { studentId: string }) => i.studentId);
      expect(ids).toContain(s4.id);
      expect(ids).toContain(s10.id);
      expect(ids).not.toContain(s3.id);
      expect(ids).not.toContain(sOther.id);
      const g0s = await mkStudent(A, 'Nolgrace', A.main);
      const g0t = await mkStudent(A, 'Nolgrace', A.main);
      await enroll(A, g0, g0s.id, daysAgo(1));
      await enroll(A, g0, g0t.id, TODAY);
      const z = (await debtors(A.owner, `groupId=${g0}`)).items.map((i: { studentId: string }) => i.studentId);
      expect(z).toEqual([g0s.id]); // grace 0: muddat kuni emas, ertasidan
    });

    it("ma'lumot: qarz summasi, kechikish, eng eski muddat, guruhlar bo'yicha; saralash qarz kamayishi; jami", async () => {
      const r = await debtors(A.owner, `groupId=${g3}`);
      const row4 = r.items.find((i: { studentId: string }) => i.studentId === s4.id);
      expect(row4).toMatchObject({ studentName: s4.name, debt: 400000, overdueCharges: 1, oldestDueDate: daysAgo(4), daysOverdue: 4 });
      expect(row4.groups).toEqual([expect.objectContaining({ groupId: g3, debt: 400000, overdueCharges: 1 })]);

      const all = await debtors(A.owner, `q=Qarzdor`);
      const mine = all.items.filter((i: { studentId: string }) => [s3.id, s4.id, s10.id, sOther.id].includes(i.studentId));
      const row10 = mine.find((i: { studentId: string }) => i.studentId === s10.id);
      expect(row10).toMatchObject({ debt: 600000, overdueCharges: 2, oldestDueDate: daysAgo(10) });
      expect(row10.groups.map((x: { groupId: string }) => x.groupId).sort()).toEqual([g3, g2].sort());
      const debts = all.items.map((i: { debt: number }) => i.debt);
      expect(debts).toEqual([...debts].sort((a: number, b: number) => b - a));
      expect(all.total).toBe(all.items.length);
      expect(all.totalDebt).toBe(debts.reduce((a: number, b: number) => a + b, 0));
    });

    it("filtrlar: groupId bitta guruh qarzini, minDebt, q (ism/telefon), branchId, sahifalash", async () => {
      const only2 = await debtors(A.owner, `groupId=${g2}`);
      expect(only2.items).toHaveLength(1);
      expect(only2.items[0]).toMatchObject({ studentId: s10.id, debt: 200000 }); // faqat shu guruhdagi qism
      const big = (await debtors(A.owner, `groupId=${g3}&minDebt=400001`)).items;
      expect(big).toEqual([]);
      expect((await debtors(A.owner, `groupId=${g3}&minDebt=400000`)).items).toHaveLength(2);
      expect((await debtors(A.owner, `q=${encodeURIComponent(s4.name)}`)).items.map((i: { studentId: string }) => i.studentId)).toEqual([s4.id]);
      expect((await debtors(A.owner, `branchId=${A.second}`)).items).toEqual([]);
      const p1 = await debtors(A.owner, `groupId=${g3}&limit=1`);
      const p2 = await debtors(A.owner, `groupId=${g3}&limit=1&offset=1`);
      expect(p1.total).toBe(2);
      expect(p1.items[0].studentId).toBe(s10.id); // qarzi kattaroq (400 000 + eski) — eng eski birinchi emas, summa bo'yicha
      expect(p2.items[0].studentId).toBe(s4.id);
      expect((await debtors(A.owner, `groupId=${g3}&offset=5`)).items).toEqual([]);
    });

    it("to'lov qarzni kamaytiradi, to'liq to'langach ro'yxatdan chiqadi; avans qarz emas", async () => {
      const st = await mkStudent(A, 'Tolovchi', A.main);
      await enroll(A, g3, st.id, daysAgo(5));
      expect((await debtors(A.owner, `groupId=${g3}&q=Tolovchi`)).items[0]).toMatchObject({ debt: 400000 });
      await pay(cashier1.api, st.id, 150000).expect(201);
      expect((await debtors(A.owner, `groupId=${g3}&q=Tolovchi`)).items[0]).toMatchObject({ debt: 250000 });
      await pay(cashier1.api, st.id, 250000 + 50000).expect(201); // 50 000 avans
      expect((await debtors(A.owner, `groupId=${g3}&q=Tolovchi`)).items).toEqual([]);
    });

    it("bekor qilingan hisob qarz emas", async () => {
      const st = await mkStudent(A, 'Bekorchi', A.main);
      await enroll(A, g3, st.id, daysAgo(5));
      const [c] = await chargesOf(A.owner, st.id);
      await A.owner.post(`/charges/${c!.id}/cancel`, { reason: 'Xato' }).expect(200);
      expect((await debtors(A.owner, `groupId=${g3}&q=Bekorchi`)).items).toEqual([]);
    });

    it("kassir o'z filialini ko'radi (boshqa filial kassiri ko'rmaydi); admin ○ yoqilgach; filial qamrovi", async () => {
      expect((await debtors(cashier1.api, `groupId=${g3}`)).items.length).toBe(2);
      expect((await debtors(cashier2.api, `groupId=${g3}`)).items).toEqual([]);
      expect((await debtors(cashier2.api, `branchId=${A.main}`)).items).toEqual([]);
      await admin1.api.get('/debtors').expect(403);
      await enable(A, admin1.id, { 'debtors.view': true });
      expect((await debtors(admin1.api, `groupId=${g3}`)).items.length).toBe(2);
      await enable(A, admin1.id, { 'debtors.view': null });
      await admin1.api.get('/debtors').expect(403);
    });

    it("ustoz (○ yoqilgach) faqat o'z guruhida 'qarz bor' ni ko'radi, summasiz; o'z guruhidan tashqari ko'rinmaydi", async () => {
      await teacher1.api.get('/debtors').expect(403);
      await enable(A, teacher1.id, { 'debtors.view': true });
      const r = await debtors(teacher1.api, '');
      const row = r.items.find((i: { studentId: string }) => i.studentId === s10.id);
      expect(row).toEqual({ studentId: s10.id, studentName: s10.name, hasDebt: true, groups: [{ groupId: g3, groupName: 'Qarz grace 3' }] }); // g2 (biriktirilmagan) yo'q
      expect(JSON.stringify(r)).not.toMatch(/"debt"|"totalDebt"|"phone"|"amount"|"overdueCharges"/);
      expect(r.items.every((i: { groups: { groupId: string }[] }) => i.groups.every((g) => g.groupId === g3))).toBe(true);
      expect((await debtors(teacher1.api, `groupId=${g0}`)).items).toEqual([]);
      await enable(A, teacher1.id, { 'debtors.view': null });
    });

    it("o'quvchi faqat o'z qarzini ko'radi; qarzi yo'q o'quvchiga bo'sh; boshqa markaz hech narsa ko'rmaydi", async () => {
      const own = await debtors(await s4.api(), '');
      expect(own.items).toHaveLength(1);
      expect(own.items[0]).toMatchObject({ studentId: s4.id, debt: 400000 });
      expect(own.total).toBe(1);
      expect((await debtors(await sOther.api(), '')).items).toEqual([]);
      expect((await debtors(await s3.api(), '')).items).toEqual([]);
      expect((await debtors(B.owner, '')).items).toEqual([]);
      await httpFn().get('/debtors').expect(401);
      await A.owner.get('/debtors?limit=0').expect(400);
      await A.owner.get('/debtors?minDebt=-1').expect(400);
    });

    it("hisoblar avtomatik yangilanadi: ro'yxat so'rovi oldidan yetishmayotgan hisoblar yaratiladi", async () => {
      const st = await mkStudent(A, 'Avtomat', A.main);
      await enroll(A, g3, st.id, daysAgo(8));
      await db.delete(s.charges).where(eq(s.charges.studentId, st.id));
      expect((await debtors(A.owner, `groupId=${g3}&q=Avtomat`)).items[0]).toMatchObject({ studentId: st.id, debt: 400000 });
    });
  });
});
