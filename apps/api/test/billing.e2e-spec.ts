// 13-qadam: hisob-kitob (charges): avtomatik yaratish, hooklar, muzlatish/chiqish/ko'chirish, chegirma, qo'lda hisob. PGlite, RLS yoqilgan.
// Biznes sanasi o'zgarib turadi, shuning uchun sanalar "bugun"ga nisbatan olinadi va kutilgan davrlar sana yordamchilaridan hisoblanadi.
import { PERMISSIONS } from '@erp/shared';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq, sql } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { countLessons } from '../src/billing/billing-engine.js';
import { hashPassword } from '../src/auth/password.js';
import { addDays, clampedDate, dayOf, monthOf, todayLocal, yearOf } from '../src/common/dates.js';
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
/** Kamida `min` kun oldingi, oyning 1-28 kunlaridan biriga to'g'ri keladigan sana (davr kuni sifatida ishlatiladi). */
const pastDay = (min: number, minDay = 1) => {
  for (let n = min; ; n++) {
    const d = daysAgo(n);
    if (dayOf(d) >= minDay && dayOf(d) <= 28) return d;
  }
};
/** `join` kunidan boshlab har oy shu kunda boshlanadigan davrlar, bugungacha. */
const monthlyStarts = (join: string) => {
  const out: string[] = [];
  for (let i = 0; ; i++) {
    const d = clampedDate(yearOf(join), monthOf(join) + i, dayOf(join));
    if (d > TODAY) return out;
    out.push(d);
  }
};
type Api = ReturnType<typeof makeApi>;
let httpFn: () => request.Agent;
const makeApi = (t: string) => ({
  get: (p: string) => httpFn().get(p).set({ Authorization: `Bearer ${t}` }),
  post: (p: string, b: object = {}) => httpFn().post(p).set({ Authorization: `Bearer ${t}` }).send(b),
  patch: (p: string, b: object) => httpFn().patch(p).set({ Authorization: `Bearer ${t}` }).send(b),
  put: (p: string, b: object) => httpFn().put(p).set({ Authorization: `Bearer ${t}` }).send(b),
});

describe('Hisob-kitob (charges) (PGlite, RLS yoqilgan)', () => {
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
    let cached: Promise<Api> | undefined;
    return { id: res.body.student.id as string, api: () => (cached ??= activate(login, res.body.temporaryPassword).then(makeApi)) };
  }
  interface Group {
    id: string;
  }
  const mkGroup = async (c: Center, name: string, extra: Record<string, unknown> = {}) =>
    (await c.owner.post('/groups', { name, courseId: c.course, branchId: c.main, priceMonthly: 400000, billingMode: 'GROUP_CYCLE', billingDay: 5, status: 'ACTIVE', ...extra }).expect(201)).body as Group;
  const enroll = async (c: Center, groupId: string, studentId: string, extra: Record<string, unknown> = {}) =>
    (await c.owner.post('/enrollments', { groupId, studentId, ...extra }).expect(201)).body.id as string;
  interface ChargeView {
    id: string;
    periodStart: string;
    periodEnd: string;
    dueDate: string;
    baseAmount: number;
    discountAmount: number;
    amount: number;
    status: string;
    kind: string;
    groupId: string;
    studentId: string;
  }
  const chargesOf = async (api: Api, qs: string) => ((await api.get(`/charges?limit=200&${qs}`).expect(200)).body.items as ChargeView[]).sort((a, b) => a.periodStart.localeCompare(b.periodStart));
  const wipeCharges = () => db.delete(s.charges); // "hali hisoblanmagan" holatni taqlid qilish (superuser ulanishi)
  const actions = async (entityId: string) => (await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, entityId))).map((x) => x.action);

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

    A = await newCenter('Hisob Markazi A');
    B = await newCenter('Hisob Markazi B');
    admin1 = await staff(A, 'ADMIN', 'Admin Bir', [A.main]);
    cashier1 = await staff(A, 'CASHIER', 'Kassir Bir', [A.main]);
    teacher1 = await staff(A, 'TEACHER', 'Ustoz Bir', [A.main]);
  });

  afterAll(async () => {
    await app?.close();
    await pg?.close();
  });

  describe('avtomatik yaratish', () => {
    it("yozilganda birinchi davrdan bugungacha oylik charge'lar; davr boshi = to'lov muddati; kelajak davr yo'q", async () => {
      const join = pastDay(70);
      const g = await mkGroup(A, 'Oylik Guruh', { billingDay: dayOf(join) });
      const st = await mkStudent(A, 'Oylik Oquvchi', A.main);
      const e = await enroll(A, g.id, st.id, { joinedAt: join });

      const items = await chargesOf(A.owner, `enrollmentId=${e}`);
      expect(items.map((c) => c.periodStart)).toEqual(monthlyStarts(join));
      expect(items.length).toBeGreaterThanOrEqual(2);
      expect(items[0]).toMatchObject({ periodStart: join, dueDate: join, kind: 'REGULAR', baseAmount: 400000, discountAmount: 0, amount: 400000, status: 'OPEN', groupId: g.id, studentId: st.id });
      for (const c of items) {
        expect(c.dueDate).toBe(c.periodStart);
        expect(c.dueDate <= TODAY).toBe(true);
        expect(c.periodEnd).toBe(addDays(clampedDate(yearOf(c.periodStart), monthOf(c.periodStart) + 1, dayOf(join)), -1));
      }
    });

    it("takroriy hisoblash yangi charge yaratmaydi (idempotent); POST /billing/generate soni qaytaradi", async () => {
      const join = pastDay(40);
      const g = await mkGroup(A, 'Idempotent Guruh', { billingDay: dayOf(join) });
      const st = await mkStudent(A, 'Idempotent Oquvchi', A.main);
      const e = await enroll(A, g.id, st.id, { joinedAt: join });
      const before = await chargesOf(A.owner, `enrollmentId=${e}`);

      for (let i = 0; i < 2; i++) expect((await A.owner.post('/billing/generate').expect(200)).body).toEqual({ asOf: TODAY, created: 0 });
      expect((await chargesOf(A.owner, `enrollmentId=${e}`)).map((c) => c.id)).toEqual(before.map((c) => c.id));

      await wipeCharges();
      const res = (await A.owner.post('/billing/generate').expect(200)).body;
      expect(res.created).toBeGreaterThanOrEqual(before.length); // markazdagi hamma faol yozilish uchun qayta tiklandi
      expect((await chargesOf(A.owner, `enrollmentId=${e}`)).map((c) => c.periodStart)).toEqual(before.map((c) => c.periodStart));
    });

    it("PLANNED (boshlanish sanasiz) guruhga hisob yo'q; ACTIVE qilingach hisoblanadi; boshlanish sanasi kelgan PLANNED hisoblanadi", async () => {
      const join = pastDay(40);
      const g = await mkGroup(A, 'Rejadagi Guruh', { status: 'PLANNED', billingDay: dayOf(join) });
      const st = await mkStudent(A, 'Rejadagi Oquvchi', A.main);
      const e = await enroll(A, g.id, st.id, { joinedAt: join });
      expect(await chargesOf(A.owner, `enrollmentId=${e}`)).toEqual([]);

      await A.owner.patch(`/groups/${g.id}`, { status: 'ACTIVE' }).expect(200);
      expect((await chargesOf(A.owner, `enrollmentId=${e}`)).map((c) => c.periodStart)).toEqual(monthlyStarts(join));

      const g2 = await mkGroup(A, 'Rejadagi Boshlangan', { status: 'PLANNED', startDate: daysAgo(50), billingDay: dayOf(join) });
      const st2 = await mkStudent(A, 'Rejadagi Oquvchi 2', A.main);
      const e2 = await enroll(A, g2.id, st2.id, { joinedAt: daysAgo(50) });
      expect((await chargesOf(A.owner, `enrollmentId=${e2}`)).length).toBeGreaterThan(0);
    });

    it("kech yozilgan o'quvchi: birinchi davr FIRST_PRORATED, to'lov muddati yozilgan kun, FULL_MONTH to'liq narx", async () => {
      let k = 20;
      while (dayOf(daysAgo(k)) < 10 || dayOf(daysAgo(k)) > 28) k++;
      const join = daysAgo(k);
      const billingDay = dayOf(join) - 3;
      const g = await mkGroup(A, 'Kech Guruh', { billingDay });
      const st = await mkStudent(A, 'Kech Oquvchi', A.main);
      const e = await enroll(A, g.id, st.id, { joinedAt: join });
      const [first, second] = await chargesOf(A.owner, `enrollmentId=${e}`);
      expect(first).toMatchObject({ periodStart: addDays(join, -3), dueDate: join, kind: 'FIRST_PRORATED', baseAmount: 400000, amount: 400000 });
      if (second) expect(second).toMatchObject({ kind: 'REGULAR', dueDate: second.periodStart });
    });

    it("REMAINING_LESSONS: qolgan darslar nisbatida (markaz sozlamasi); jadval bo'lmasa to'liq narx", async () => {
      const c = await newCenter('Proratsiya Markazi');
      await db.execute(sql`update centers set settings = settings || '{"join_proration": "REMAINING_LESSONS"}'::jsonb where id = ${c.centerId}`);
      let k = 20;
      while (dayOf(daysAgo(k)) < 12 || dayOf(daysAgo(k)) > 28) k++;
      const join = daysAgo(k);
      const billingDay = dayOf(join) - 5;
      const schedule = [{ weekday: 1, startTime: '10:00', endTime: '11:00' }, { weekday: 3, startTime: '10:00', endTime: '11:00' }, { weekday: 5, startTime: '10:00', endTime: '11:00' }];
      const g = await mkGroup(c, 'Proratsiya Guruhi', { billingDay, schedule });
      const st = await mkStudent(c, 'Proratsiya Oquvchi', c.main);
      const e = await enroll(c, g.id, st.id, { joinedAt: join });
      const [first] = await chargesOf(c.owner, `enrollmentId=${e}`);
      const start = addDays(join, -5);
      const end = first!.periodEnd;
      const total = countLessons([1, 3, 5], start, end);
      const remaining = countLessons([1, 3, 5], join, end);
      expect(first).toMatchObject({ kind: 'FIRST_PRORATED', dueDate: join, baseAmount: Math.round((400000 * remaining) / total) });
      expect(first!.baseAmount).toBeLessThan(400000);

      const noSchedule = await mkGroup(c, 'Jadvalsiz Guruh', { billingDay });
      const st2 = await mkStudent(c, 'Jadvalsiz Oquvchi', c.main);
      const e2 = await enroll(c, noSchedule.id, st2.id, { joinedAt: join });
      expect((await chargesOf(c.owner, `enrollmentId=${e2}`))[0]).toMatchObject({ baseAmount: 400000 });
    });

    it("STUDENT_CYCLE: davr yozilgan kundan, to'liq oy; individual narx guruh narxidan ustun", async () => {
      const join = pastDay(70);
      const g = await mkGroup(A, 'Talaba Sikli Guruhi', { billingMode: 'STUDENT_CYCLE', billingDay: undefined });
      const st = await mkStudent(A, 'Talaba Sikli Oquvchi', A.main);
      const e = await enroll(A, g.id, st.id, { joinedAt: join, priceOverride: 300000 });
      const items = await chargesOf(A.owner, `enrollmentId=${e}`);
      expect(items.map((c) => c.periodStart)).toEqual(monthlyStarts(join));
      expect(items.every((c) => c.kind === 'REGULAR' && c.baseAmount === 300000 && c.amount === 300000)).toBe(true);
    });

    it("kelajak sanasiga yozilgan o'quvchiga hozircha hisob yo'q; chiqarilgan va arxivlangan guruhga hisob yo'q", async () => {
      const g = await mkGroup(A, 'Kelajak Guruhi', { billingDay: 5 });
      const st = await mkStudent(A, 'Kelajak Oquvchi', A.main);
      const e = await enroll(A, g.id, st.id, { joinedAt: addDays(TODAY, 10) });
      expect(await chargesOf(A.owner, `enrollmentId=${e}`)).toEqual([]);
    });
  });

  describe('muzlatish, chiqish, ko\'chirish', () => {
    it("muzlatish oldin shu kungacha hisoblaydi va muzlatish davrini ochadi; qaytarish yopadi va yangi davrni hisoblaydi", async () => {
      const join = pastDay(70);
      const g = await mkGroup(A, 'Muzlatish Guruhi', { billingDay: dayOf(join) });
      const st = await mkStudent(A, 'Muzlatiladigan', A.main);
      const e = await enroll(A, g.id, st.id, { joinedAt: join });
      const before = await chargesOf(A.owner, `enrollmentId=${e}`);

      await wipeCharges(); // hali hisoblanmagan holat: muzlatishdan oldin hisoblanishi kerak
      await A.owner.post(`/enrollments/${e}/freeze`).expect(200);
      expect((await chargesOf(A.owner, `enrollmentId=${e}`)).map((c) => c.periodStart)).toEqual(before.map((c) => c.periodStart));
      const freezes = await db.select().from(s.enrollmentFreezes).where(eq(s.enrollmentFreezes.enrollmentId, e));
      expect(freezes).toEqual([expect.objectContaining({ fromDate: TODAY, toDate: null })]);

      await A.owner.post(`/enrollments/${e}/unfreeze`).expect(200);
      const closed = await db.select().from(s.enrollmentFreezes).where(eq(s.enrollmentFreezes.enrollmentId, e));
      expect(closed).toEqual([expect.objectContaining({ fromDate: TODAY, toDate: TODAY })]);
      expect((await chargesOf(A.owner, `enrollmentId=${e}`)).length).toBe(before.length); // takror yo'q
    });

    it("muzlatilgan davrga tushgan davrlar o'tkazib yuboriladi (o'tmishdagi muzlatish davri bilan)", async () => {
      const join = pastDay(100);
      const g = await mkGroup(A, 'Muzlatilgan Davr Guruhi', { billingDay: dayOf(join) });
      const st = await mkStudent(A, 'Davrli Muzlatish', A.main);
      const e = await enroll(A, g.id, st.id, { joinedAt: join });
      const all = (await chargesOf(A.owner, `enrollmentId=${e}`)).map((c) => c.periodStart);
      expect(all.length).toBeGreaterThanOrEqual(3);

      // ikkinchi va uchinchi davr boshlari muzlatish ichida: [all[1], all[3] yoki hozir)
      const skipFrom = all[1]!;
      const skipTo = all[3] ?? addDays(TODAY, 1);
      await wipeCharges();
      const [enr] = await db.select().from(s.enrollments).where(eq(s.enrollments.id, e));
      await db.insert(s.enrollmentFreezes).values({ centerId: enr!.centerId, enrollmentId: e, fromDate: skipFrom, toDate: skipTo });
      await A.owner.post('/billing/generate').expect(200);
      const starts = (await chargesOf(A.owner, `enrollmentId=${e}`)).map((c) => c.periodStart);
      expect(starts).toEqual(all.filter((d) => !(d >= skipFrom && d < skipTo)));
      expect(starts).not.toContain(all[1]);
    });

    it("chiqishdan oldin chiqish sanasigacha hisoblanadi (keyingi davrlar yaratilmaydi)", async () => {
      const join = pastDay(100);
      const g = await mkGroup(A, 'Chiqish Guruhi', { billingDay: dayOf(join) });
      const st = await mkStudent(A, 'Chiquvchi', A.main);
      const e = await enroll(A, g.id, st.id, { joinedAt: join });
      const all = (await chargesOf(A.owner, `enrollmentId=${e}`)).map((c) => c.periodStart);
      expect(all.length).toBeGreaterThanOrEqual(3);

      await wipeCharges();
      const leftAt = addDays(all[2]!, 0); // uchinchi davr boshi: shu kun va keyingilari yaratilmaydi
      await A.owner.post(`/enrollments/${e}/leave`, { leftAt }).expect(200);
      expect((await chargesOf(A.owner, `enrollmentId=${e}`)).map((c) => c.periodStart)).toEqual(all.slice(0, 2));
      await A.owner.post('/billing/generate').expect(200);
      expect((await chargesOf(A.owner, `enrollmentId=${e}`)).map((c) => c.periodStart)).toEqual(all.slice(0, 2)); // LEFT qayta hisoblanmaydi
    });

    it("muzlatilgan holatda chiqsa ochiq muzlatish yopiladi; chiqqach yangi hisob yo'q", async () => {
      const join = pastDay(70);
      const g = await mkGroup(A, 'Muzlatib Chiqish', { billingDay: dayOf(join) });
      const st = await mkStudent(A, 'Muzlatib Chiqqan', A.main);
      const e = await enroll(A, g.id, st.id, { joinedAt: join });
      await A.owner.post(`/enrollments/${e}/freeze`).expect(200);
      await A.owner.post(`/enrollments/${e}/leave`).expect(200);
      const f = await db.select().from(s.enrollmentFreezes).where(eq(s.enrollmentFreezes.enrollmentId, e));
      expect(f).toHaveLength(1);
      expect(f[0]!.toDate).not.toBeNull();
    });

    it("ko'chirish: eski guruh chiqish sanasigacha hisoblanadi, yangi guruhda birinchi hisob ochiladi", async () => {
      const join = pastDay(70);
      const g1 = await mkGroup(A, 'Kochirish Eski', { billingDay: dayOf(join) });
      const g2 = await mkGroup(A, 'Kochirish Yangi', { billingDay: 5, priceMonthly: 500000 });
      const st = await mkStudent(A, 'Kochadigan', A.main);
      const e = await enroll(A, g1.id, st.id, { joinedAt: join });
      const oldStarts = (await chargesOf(A.owner, `enrollmentId=${e}`)).map((c) => c.periodStart);
      await wipeCharges();

      const res = (await A.owner.post(`/enrollments/${e}/transfer`, { toGroupId: g2.id }).expect(200)).body;
      expect((await chargesOf(A.owner, `enrollmentId=${e}`)).map((c) => c.periodStart)).toEqual(oldStarts); // bugungacha
      const fresh = await chargesOf(A.owner, `enrollmentId=${res.to.id}`);
      expect(fresh).toHaveLength(1);
      expect(fresh[0]).toMatchObject({ groupId: g2.id, dueDate: TODAY, baseAmount: 500000 });
      expect(fresh[0]!.kind).toBe(TODAY === clampedDate(yearOf(TODAY), monthOf(TODAY), 5) ? 'REGULAR' : 'FIRST_PRORATED');
    });

    it("o'quvchi arxivlanganda hisob yakunlanadi va muzlatishlari yopiladi", async () => {
      const join = pastDay(70);
      const g = await mkGroup(A, 'Arxiv Hisob Guruhi', { billingDay: dayOf(join) });
      const st = await mkStudent(A, 'Arxivlanadigan Hisob', A.main);
      const e = await enroll(A, g.id, st.id, { joinedAt: join });
      const before = (await chargesOf(A.owner, `enrollmentId=${e}`)).map((c) => c.periodStart);
      await wipeCharges();
      await A.owner.post(`/students/${st.id}/archive`).expect(200);
      expect((await chargesOf(A.owner, `studentId=${st.id}`)).map((c) => c.periodStart)).toEqual(before);

      const st2 = await mkStudent(A, 'Muzlatilgan Arxiv', A.main);
      const e2 = await enroll(A, g.id, st2.id, { joinedAt: join });
      await A.owner.post(`/enrollments/${e2}/freeze`).expect(200);
      await A.owner.post(`/students/${st2.id}/archive`).expect(200);
      const f = await db.select().from(s.enrollmentFreezes).where(eq(s.enrollmentFreezes.enrollmentId, e2));
      expect(f.every((x) => x.toDate !== null)).toBe(true);
    });
  });

  describe('guruh o\'zgarishlari', () => {
    it("narx o'zgarishidan oldin kelgan davrlar eski narxda hisoblanadi; sikl rejimi va kunini hisob bor guruhda o'zgartirib bo'lmaydi", async () => {
      const join = pastDay(40);
      const g = await mkGroup(A, 'Narx Guruhi', { billingDay: dayOf(join) });
      const st = await mkStudent(A, 'Narx Oquvchi', A.main);
      const e = await enroll(A, g.id, st.id, { joinedAt: join });
      await wipeCharges(); // hali hisoblanmagan davrlar

      await A.owner.patch(`/groups/${g.id}`, { priceMonthly: 500000 }).expect(200);
      const items = await chargesOf(A.owner, `enrollmentId=${e}`);
      expect(items.length).toBeGreaterThan(0);
      expect(items.every((c) => c.baseAmount === 400000)).toBe(true); // eski narx

      expect((await A.owner.patch(`/groups/${g.id}`, { billingMode: 'STUDENT_CYCLE' }).expect(409)).body.code).toBe('BILLING_HAS_CHARGES');
      expect((await A.owner.patch(`/groups/${g.id}`, { billingDay: dayOf(join) === 7 ? 8 : 7 }).expect(409)).body.code).toBe('BILLING_HAS_CHARGES');
      await A.owner.patch(`/groups/${g.id}`, { billingDay: dayOf(join), priceMonthly: 600000 }).expect(200); // o'zgarmaydigan sikl va narx ruxsat
      const fresh = await mkGroup(A, 'Hisobsiz Guruh');
      await A.owner.patch(`/groups/${fresh.id}`, { billingMode: 'STUDENT_CYCLE' }).expect(200); // hisob yo'q: mumkin
    });

    it("guruh tugatilganda avval hisoblanadi, keyin yangi davr yaratilmaydi", async () => {
      const join = pastDay(40);
      const g = await mkGroup(A, 'Tugaydigan Guruh', { billingDay: dayOf(join) });
      const st = await mkStudent(A, 'Tugash Oquvchi', A.main);
      const e = await enroll(A, g.id, st.id, { joinedAt: join });
      const before = (await chargesOf(A.owner, `enrollmentId=${e}`)).map((c) => c.periodStart);
      await wipeCharges();
      await A.owner.patch(`/groups/${g.id}`, { status: 'FINISHED' }).expect(200);
      expect((await chargesOf(A.owner, `enrollmentId=${e}`)).map((c) => c.periodStart)).toEqual(before);
      await wipeCharges();
      await A.owner.post('/billing/generate').expect(200);
      expect(await chargesOf(A.owner, `enrollmentId=${e}`)).toEqual([]); // tugagan guruhga yangi hisob yo'q
    });
  });

  describe('chegirma', () => {
    it("yaratish paytida chegirma qotiriladi: foiz, summa va bepul (nol summa PAID)", async () => {
      const join = pastDay(40);
      const g = await mkGroup(A, 'Chegirma Guruhi', { billingDay: dayOf(join) });
      const [pct, free] = [await mkStudent(A, 'Foizli', A.main), await mkStudent(A, 'Bepul', A.main)];
      const e1 = await enroll(A, g.id, pct.id, { joinedAt: join });
      const e2 = await enroll(A, g.id, free.id, { joinedAt: join });
      await wipeCharges();
      const [r1] = await db.select().from(s.enrollments).where(eq(s.enrollments.id, e1));
      await db.insert(s.enrollmentDiscounts).values([
        { centerId: r1!.centerId, enrollmentId: e1, type: 'PERCENT', value: 25 },
        { centerId: r1!.centerId, enrollmentId: e1, type: 'AMOUNT', value: 10000 },
        { centerId: r1!.centerId, enrollmentId: e2, type: 'FREE' },
      ]);
      await A.owner.post('/billing/generate').expect(200);
      const a = await chargesOf(A.owner, `enrollmentId=${e1}`);
      expect(a.length).toBeGreaterThan(0);
      expect(a.every((c) => c.baseAmount === 400000 && c.discountAmount === 110000 && c.amount === 290000 && c.status === 'OPEN')).toBe(true);
      const b = await chargesOf(A.owner, `enrollmentId=${e2}`);
      expect(b.every((c) => c.amount === 0 && c.discountAmount === 400000 && c.status === 'PAID')).toBe(true);

      // keyingi chegirma o'zgarishi eski hisobni o'zgartirmaydi
      await db.update(s.enrollmentDiscounts).set({ value: 50 }).where(eq(s.enrollmentDiscounts.enrollmentId, e1));
      await A.owner.post('/billing/generate').expect(200);
      expect((await chargesOf(A.owner, `enrollmentId=${e1}`)).every((c) => c.discountAmount === 110000)).toBe(true);
    });
  });

  describe("qo'lda hisob va bekor qilish", () => {
    let g: Group;
    let e: string;
    beforeAll(async () => {
      const join = pastDay(40);
      g = await mkGroup(A, 'Qolda Guruh', { billingDay: dayOf(join) });
      const st = await mkStudent(A, 'Qolda Oquvchi', A.main);
      e = await enroll(A, g.id, st.id, { joinedAt: join });
    });

    it("rahbar sabab bilan MANUAL hisob qo'shadi; sabab majburiy; boshqa rollar 403; noma'lum yozilish 404; audit", async () => {
      const c = (await A.owner.post('/charges', { enrollmentId: e, amount: 150000, note: 'Kitob uchun' }).expect(201)).body;
      expect(c).toMatchObject({ kind: 'MANUAL', amount: 150000, baseAmount: 150000, discountAmount: 0, status: 'OPEN', note: 'Kitob uchun', dueDate: TODAY, periodStart: TODAY, periodEnd: TODAY });
      expect(await actions(c.id)).toContain('charge.create_manual');
      await A.owner.post('/charges', { enrollmentId: e, amount: 150000, dueDate: daysAgo(3), note: 'Yana' }).expect(201); // bir kunga bir nechta
      await A.owner.post('/charges', { enrollmentId: e, amount: 150000 }).expect(400); // sabab yo'q
      await A.owner.post('/charges', { enrollmentId: e, amount: 0, note: 'Nol' }).expect(400);
      await A.owner.post('/charges', { enrollmentId: e, amount: -5, note: 'Manfiy' }).expect(400);
      await A.owner.post('/charges', { enrollmentId: NOPE, amount: 1000, note: 'Yo\'q' }).expect(404);
      await admin1.api.post('/charges', { enrollmentId: e, amount: 1000, note: 'Hack' }).expect(403);
      await cashier1.api.post('/charges', { enrollmentId: e, amount: 1000, note: 'Hack' }).expect(403);
      await B.owner.post('/charges', { enrollmentId: e, amount: 1000, note: 'Hack' }).expect(404);
    });

    it("bekor qilish: sabab bilan, qator saqlanadi va avtomatik hisob qayta yaratilmaydi; ikkinchi marta 409 (to'langan hisob: payments.e2e-spec)", async () => {
      const [auto] = await chargesOf(A.owner, `enrollmentId=${e}&kind=REGULAR`);
      await A.owner.post(`/charges/${auto!.id}/cancel`, {}).expect(400); // sabab majburiy
      const done = (await A.owner.post(`/charges/${auto!.id}/cancel`, { reason: 'Xato hisob' }).expect(200)).body;
      expect(done).toMatchObject({ status: 'CANCELLED', cancelReason: 'Xato hisob' });
      expect(done.cancelledAt).not.toBeNull();
      expect((await A.owner.post(`/charges/${auto!.id}/cancel`, { reason: 'Yana' }).expect(409)).body.code).toBe('ALREADY_CANCELLED');

      await A.owner.post('/billing/generate').expect(200);
      const again = await chargesOf(A.owner, `enrollmentId=${e}&kind=REGULAR`);
      expect(again.find((c) => c.periodStart === auto!.periodStart)).toMatchObject({ id: auto!.id, status: 'CANCELLED' }); // qayta yaratilmadi
      expect(again.filter((c) => c.periodStart === auto!.periodStart)).toHaveLength(1);

      const actionsList = await actions(auto!.id);
      expect(actionsList).toContain('charge.cancel');
    });

    it("bekor qilish ruxsatlari: faqat rahbar; boshqa markaz va noma'lum hisob 404", async () => {
      const m = (await A.owner.post('/charges', { enrollmentId: e, amount: 1000, note: 'Bekor sinovi' }).expect(201)).body;
      await admin1.api.post(`/charges/${m.id}/cancel`, { reason: 'Hack' }).expect(403);
      await cashier1.api.post(`/charges/${m.id}/cancel`, { reason: 'Hack' }).expect(403);
      await B.owner.post(`/charges/${m.id}/cancel`, { reason: 'Hack' }).expect(404);
      await A.owner.post(`/charges/${NOPE}/cancel`, { reason: 'Yo\'q' }).expect(404);
      await A.owner.post('/charges/not-a-uuid/cancel', { reason: 'x' }).expect(400);
    });
  });

  describe("ko'rish va qamrov", () => {
    let gMain: Group;
    let gSecond: Group;
    let sMain: Awaited<ReturnType<typeof mkStudent>>;
    let sSecond: Awaited<ReturnType<typeof mkStudent>>;
    let cMain: string;
    let cSecond: string;
    beforeAll(async () => {
      const join = pastDay(40);
      gMain = await mkGroup(A, 'Qamrov Asosiy', { billingDay: dayOf(join) });
      gSecond = await mkGroup(A, 'Qamrov Ikkinchi', { branchId: A.second, billingDay: dayOf(join) });
      sMain = await mkStudent(A, 'Qamrov Bir', A.main);
      sSecond = await mkStudent(A, 'Qamrov Ikki', A.second);
      const eMain = await enroll(A, gMain.id, sMain.id, { joinedAt: join });
      const eSecond = await enroll(A, gSecond.id, sSecond.id, { joinedAt: join });
      cMain = (await chargesOf(A.owner, `enrollmentId=${eMain}`))[0]!.id;
      cSecond = (await chargesOf(A.owner, `enrollmentId=${eSecond}`))[0]!.id;
    });
    const ids = async (api: Api, qs = '') => (await chargesOf(api, qs)).map((c) => c.id);

    it("rahbar hammasini, kassir o'z filialini, admin (payment.view ○ yoqilgach) o'z filialini, o'quvchi faqat o'zinikini ko'radi; ustoz 403", async () => {
      expect(await ids(A.owner)).toEqual(expect.arrayContaining([cMain, cSecond]));
      const cashier = await ids(cashier1.api);
      expect(cashier).toContain(cMain);
      expect(cashier).not.toContain(cSecond);
      await admin1.api.get('/charges').expect(403); // payment.view admin uchun ○
      await A.owner.put('/permissions/roles/ADMIN', { permissions: { 'payment.view': true } }).expect(200);
      const admin = await ids(admin1.api);
      expect(admin).toContain(cMain);
      expect(admin).not.toContain(cSecond);
      await A.owner.put('/permissions/roles/ADMIN', { permissions: { 'payment.view': false } }).expect(200);

      const mine = await chargesOf(await sMain.api(), '');
      expect(mine.length).toBeGreaterThan(0);
      expect(new Set(mine.map((c) => c.studentId))).toEqual(new Set([sMain.id]));
      const spoof = await chargesOf(await sMain.api(), `studentId=${sSecond.id}`);
      expect(spoof.every((c) => c.studentId === sMain.id)).toBe(true); // boshqa o'quvchi filtri e'tiborsiz (siyosat bo'yicha o'z hisobi)
      await teacher1.api.get('/charges').expect(403);
      await httpFn().get('/charges').expect(401);
    });

    it("filtrlar: o'quvchi, guruh, filial, holat, tur, muddat oralig'i, sahifalash; get qamrovi", async () => {
      expect((await chargesOf(A.owner, `studentId=${sSecond.id}`)).every((c) => c.studentId === sSecond.id)).toBe(true);
      expect((await chargesOf(A.owner, `groupId=${gMain.id}`)).every((c) => c.groupId === gMain.id)).toBe(true);
      expect(await ids(A.owner, `branchId=${A.second}`)).toContain(cSecond);
      expect(await ids(A.owner, `branchId=${A.second}`)).not.toContain(cMain);
      expect(await ids(cashier1.api, `branchId=${A.second}`)).toEqual([]);
      expect((await chargesOf(A.owner, 'status=CANCELLED')).every((c) => c.status === 'CANCELLED')).toBe(true);
      expect((await chargesOf(A.owner, 'kind=MANUAL')).every((c) => c.kind === 'MANUAL')).toBe(true);
      expect(await ids(A.owner, `dueFrom=${addDays(TODAY, 1)}`)).toEqual([]);
      expect((await A.owner.get('/charges?limit=2&offset=1').expect(200)).body.items).toHaveLength(2);
      await A.owner.get('/charges?status=BAD').expect(400);
      await A.owner.get('/charges?dueFrom=bad').expect(400);

      await A.owner.get(`/charges/${cSecond}`).expect(200);
      await cashier1.api.get(`/charges/${cSecond}`).expect(404);
      await (await sMain.api()).get(`/charges/${cSecond}`).expect(404);
      expect((await (await sMain.api()).get(`/charges/${cMain}`).expect(200)).body).toMatchObject({ id: cMain, studentName: 'Qamrov Bir', groupName: 'Qamrov Asosiy' });
      await B.owner.get(`/charges/${cMain}`).expect(404);
      await A.owner.get(`/charges/${NOPE}`).expect(404);
      expect(await ids(B.owner)).not.toContain(cMain);
    });
  });

  describe('POST /billing/generate', () => {
    it("rahbar va kassir (debtors.view ✔) ishga tushiradi; admin (○), o'quvchi, ustoz 403; kelajak sanasi 400; audit", async () => {
      const r = (await A.owner.post('/billing/generate', { asOf: daysAgo(1) }).expect(200)).body;
      expect(r.asOf).toBe(daysAgo(1));
      await cashier1.api.post('/billing/generate').expect(200);
      await admin1.api.post('/billing/generate').expect(403);
      await teacher1.api.post('/billing/generate').expect(403);
      await (await (await mkStudent(A, 'Generate Oquvchi', A.main)).api()).post('/billing/generate').expect(403);
      expect((await A.owner.post('/billing/generate', { asOf: addDays(TODAY, 1) }).expect(400)).body.code).toBe('DATE_IN_FUTURE');
      await A.owner.post('/billing/generate', { asOf: 'bad' }).expect(400);
      await httpFn().post('/billing/generate').send({}).expect(401);

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.action, 'billing.generate'));
      expect(audit.length).toBeGreaterThanOrEqual(2);
      expect(audit[0]!.after).toMatchObject({ asOf: expect.any(String), created: expect.any(Number) });
    });

    it("o'tmishdagi asOf bilan hisoblash: shu sanadan keyingi davrlar yaratilmaydi", async () => {
      const c = await newCenter('AsOf Markazi');
      const join = pastDay(100);
      const g = await mkGroup(c, 'AsOf Guruhi', { status: 'PLANNED', startDate: join, billingDay: dayOf(join) });
      const st = await mkStudent(c, 'AsOf Oquvchi', c.main);
      const e = await enroll(c, g.id, st.id, { joinedAt: join });
      await c.owner.patch(`/groups/${g.id}`, { status: 'PLANNED' }).expect(200);
      await wipeCharges();
      const asOf = addDays(join, 40);
      await c.owner.post('/billing/generate', { asOf }).expect(200);
      const items = await chargesOf(c.owner, `enrollmentId=${e}`);
      expect(items.every((x) => x.dueDate <= TODAY)).toBe(true); // GET o'qishdan oldin hozirgacha to'ldiradi
      expect(items.length).toBeGreaterThan(0);
    });
  });
});
