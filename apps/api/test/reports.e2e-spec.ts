// 18-qadam: umumiy hisobotlar (GET /reports/overview, /reports/branches). Faqat rahbar. PGlite, RLS yoqilgan.
// Ma'lumot qo'lda hisoblangan summalarga mos tuzilgan (qarz, davomat, tushum, xarajat, yozilishlar).
import { PERMISSIONS } from '@erp/shared';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
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
const TODAY = todayLocal();
const YESTERDAY = addDays(TODAY, -1);
const RANGE = `from=${addDays(TODAY, -3)}&to=${TODAY}`;
type Api = ReturnType<typeof makeApi>;
let httpFn: () => request.Agent;
const makeApi = (t: string) => ({
  get: (p: string) => httpFn().get(p).set({ Authorization: `Bearer ${t}` }),
  post: (p: string, b: object = {}) => httpFn().post(p).set({ Authorization: `Bearer ${t}` }).send(b),
  put: (p: string, b: object) => httpFn().put(p).set({ Authorization: `Bearer ${t}` }).send(b),
});

describe('Umumiy hisobotlar (PGlite, RLS yoqilgan)', () => {
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
    return { owner, main: res.body.branch.id, second, course };
  }
  async function staff(c: Center, role: 'ADMIN' | 'CASHIER' | 'TEACHER', fullName: string) {
    const res = await c.owner.post('/staff', { role, fullName, branchIds: [c.main] }).expect(201);
    return { id: res.body.user.id as string, api: makeApi(await activate(res.body.user.login, res.body.temporaryPassword)) };
  }
  let n = 0;
  async function mkStudent(c: Center, branchId: string) {
    const res = await c.owner.post('/students', { fullName: `Talaba${++n} Hisobot`, branchId }).expect(201);
    const login = res.body.student.login as string;
    let cached: Promise<Api> | undefined;
    return { id: res.body.student.id as string, api: () => (cached ??= activate(login, res.body.temporaryPassword).then(makeApi)) };
  }
  const mkGroup = async (c: Center, name: string, branchId: string, price: number, status = 'ACTIVE') =>
    (await c.owner.post('/groups', { name, courseId: c.course, branchId, priceMonthly: price, billingMode: 'STUDENT_CYCLE', status }).expect(201)).body.id as string;
  const enroll = async (c: Center, groupId: string, studentId: string, joinedAt: string) =>
    (await c.owner.post('/enrollments', { groupId, studentId, joinedAt }).expect(201)).body.id as string;
  const overview = async (api: Api, qs = RANGE) => (await api.get(`/reports/overview?${qs}`).expect(200)).body;
  const branches = async (api: Api, qs = RANGE) => (await api.get(`/reports/branches?${qs}`).expect(200)).body;
  const row = (body: { items: { branchId: string }[] }, id: string) => body.items.find((i) => i.branchId === id)!;

  let A: Center;
  let B: Center;
  let admin1: Awaited<ReturnType<typeof staff>>;
  let cashier1: Awaited<ReturnType<typeof staff>>;
  let teacher1: Awaited<ReturnType<typeof staff>>;
  let g1: string;
  let g2: string;
  let student1: Awaited<ReturnType<typeof mkStudent>>;
  let emptyBranch: string;

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

    A = await newCenter('Hisobot Markazi A');
    B = await newCenter('Hisobot Markazi B');
    admin1 = await staff(A, 'ADMIN', 'Admin Bir');
    cashier1 = await staff(A, 'CASHIER', 'Kassir Bir');
    teacher1 = await staff(A, 'TEACHER', 'Ustoz Bir');
    emptyBranch = (await A.owner.post('/branches', { name: "Bo'sh filial" }).expect(201)).body.id as string;
    const archived = (await A.owner.post('/branches', { name: 'Arxiv filial' }).expect(201)).body.id as string;
    await A.owner.post(`/branches/${archived}/archive`).expect(200);

    g1 = await mkGroup(A, 'Hisobot g1', A.main, 400000);
    g2 = await mkGroup(A, 'Hisobot g2', A.second, 200000);
    await mkGroup(A, 'Hisobot rejadagi', A.main, 100000, 'PLANNED');
    student1 = await mkStudent(A, A.main);
    const s2 = await mkStudent(A, A.main);
    const s3 = await mkStudent(A, A.second);
    const s4 = await mkStudent(A, A.main);
    const s5 = await mkStudent(A, A.main);
    await enroll(A, g1, student1.id, YESTERDAY); // kechagi hisob: muddati o'tgan qarz
    await enroll(A, g1, s2.id, TODAY);
    await enroll(A, g2, s3.id, YESTERDAY);
    await enroll(A, g2, s2.id, TODAY); // s2 ikki filialda
    await enroll(A, g1, s4.id, TODAY);
    const e5 = await enroll(A, g1, s5.id, TODAY);
    await A.owner.post(`/students/${s4.id}/archive`).expect(200); // yozilishi LEFT, o'quvchi ARCHIVED
    await A.owner.post(`/enrollments/${e5}/freeze`).expect(200);

    const pay = (studentId: string, amount: number, method: string, branchId: string) => A.owner.post('/payments', { studentId, amount, method, branchId }).expect(201);
    await pay(student1.id, 150000, 'CASH', A.main); // qarz 400 000 - 150 000 = 250 000
    await pay(s3.id, 200000, 'TRANSFER', A.second); // qarz yopildi
    await A.owner.post('/expenses', { branchId: A.main, category: 'Ijara', amount: 90000 }).expect(201);
    await A.owner.post('/expenses', { branchId: A.second, category: 'Kommunal', amount: 30000 }).expect(201);

    // davomat: g1 darsi (s1 kelgan, s2 kelmagan, s4 sababli; s5 muzlatilgan), g2 darsi (s3 kelgan, s2 kech qolgan)
    const l1 = (await A.owner.post(`/groups/${g1}/lessons`, { lessonDate: TODAY }).expect(201)).body.id as string;
    const l2 = (await A.owner.post(`/groups/${g2}/lessons`, { lessonDate: TODAY }).expect(201)).body.id as string;
    await A.owner.put(`/lessons/${l1}/attendance`, { records: [{ studentId: student1.id, status: 'PRESENT' }, { studentId: s2.id, status: 'ABSENT' }, { studentId: s4.id, status: 'EXCUSED' }] }).expect(200);
    await A.owner.put(`/lessons/${l2}/attendance`, { records: [{ studentId: s3.id, status: 'PRESENT' }, { studentId: s2.id, status: 'LATE' }] }).expect(200);
  });

  afterAll(async () => {
    await app?.close();
    await pg?.close();
  });

  describe('markaz umumiy ko\'rsatkichlari (report.overview)', () => {
    it("o'quvchilar, xodimlar, guruhlar va yozilishlar", async () => {
      const r = await overview(A.owner);
      expect(r).toMatchObject({ from: addDays(TODAY, -3), to: TODAY });
      expect(r.students).toEqual({ active: 4, archived: 1, new: 5 });
      expect(r.staff).toEqual({ admins: 1, cashiers: 1, teachers: 1 });
      expect(r.groups).toEqual({ active: 2, planned: 1, finished: 0 });
      expect(r.enrollments).toEqual({ active: 4, frozen: 1, joined: 6, left: 1 });
    });

    it("davomat (kelgan + kech qolgan) / (+ kelmagan), sababli hisobga olinmaydi", async () => {
      const r = await overview(A.owner);
      expect(r.attendance).toEqual({ lessons: 2, present: 2, absent: 1, late: 1, excused: 1, total: 5, rate: 75 });
      const none = await overview(A.owner, `from=${addDays(TODAY, -10)}&to=${addDays(TODAY, -5)}`);
      expect(none.attendance).toEqual({ lessons: 0, present: 0, absent: 0, late: 0, excused: 0, total: 0, rate: null });
      expect(none.finance).toEqual({ income: 0, expenses: 0, payouts: 0, net: 0 });
      expect(none.enrollments).toMatchObject({ active: 4, joined: 0, left: 0 }); // joriy holat oraliqqa bog'liq emas
    });

    it("moliya (tushum, xarajat, maosh, sof natija) va muddati o'tgan qarz", async () => {
      const r = await overview(A.owner);
      expect(r.finance).toEqual({ income: 350000, expenses: 120000, payouts: 0, net: 230000 });
      expect(r.debt).toEqual({ amount: 250000, debtors: 1, overdueCharges: 1 }); // bugungi hisoblar hali muddati o'tmagan
    });

    it("qarz va moliya to'lovdan keyin yangilanadi", async () => {
      await A.owner.post('/payments', { studentId: student1.id, amount: 250000, method: 'CARD', branchId: A.main }).expect(201);
      const r = await overview(A.owner);
      expect(r.debt).toEqual({ amount: 0, debtors: 0, overdueCharges: 0 });
      expect(r.finance.income).toBe(600000);
      await A.owner.post(`/payments/${(await A.owner.get(`/payments?studentId=${student1.id}&method=CARD`).expect(200)).body.items[0].id}/reverse`, { reason: 'Test' }).expect(200);
      expect((await overview(A.owner)).debt.amount).toBe(250000);
      expect((await overview(A.owner)).finance.income).toBe(350000); // qaytarish o'z kunida manfiy
    });

    it("oraliq: sukut shu oyning boshidan; noto'g'ri oraliq 400; boshqa markaz faqat o'zini ko'radi", async () => {
      const d = await overview(A.owner, '');
      expect(d).toMatchObject({ from: `${TODAY.slice(0, 7)}-01`, to: TODAY });
      await A.owner.get(`/reports/overview?from=${TODAY}&to=${YESTERDAY}`).expect(400);
      await A.owner.get('/reports/overview?from=2020-01-01&to=2026-06-01').expect(400);
      await A.owner.get('/reports/overview?from=abc').expect(400);
      expect(await overview(B.owner)).toMatchObject({ students: { active: 0, archived: 0, new: 0 }, groups: { active: 0 }, enrollments: { active: 0 }, finance: { income: 0, expenses: 0 }, debt: { amount: 0 } });
    });
  });

  describe('filiallarni solishtirish (report.branch_compare)', () => {
    it("har filial: o'quvchi, guruh, yozilish, davomat, tushum, xarajat, qarz", async () => {
      const r = await branches(A.owner);
      const main = row(r, A.main);
      expect(main).toMatchObject({
        branchName: 'Asosiy filial',
        students: 3, // s1, s2, s5 (s4 arxivda)
        groups: 1,
        enrollments: { active: 2, joined: 4, left: 1 },
        attendance: { present: 1, absent: 1, late: 0, excused: 1, rate: 50 },
        income: 150000,
        expenses: 90000,
        net: 60000,
        debt: 250000,
        debtors: 1,
      });
      expect(row(r, A.second)).toMatchObject({
        branchName: 'Ikkinchi filial',
        students: 2, // s3 va s2 (s2 ikki filialda)
        groups: 1,
        enrollments: { active: 2, joined: 2, left: 0 },
        attendance: { present: 1, absent: 0, late: 1, excused: 0, rate: 100 },
        income: 200000,
        expenses: 30000,
        net: 170000,
        debt: 0,
        debtors: 0,
      });
      expect(row(r, emptyBranch)).toMatchObject({ branchName: "Bo'sh filial", students: 0, groups: 0, income: 0, expenses: 0, debt: 0, attendance: { total: 0, rate: null } });
      expect(r.items.map((i: { branchName: string }) => i.branchName)).toEqual(['Asosiy filial', 'Bo\'sh filial', 'Ikkinchi filial']); // arxivlangan bo'sh filial yo'q
    });

    it("jami: ikki filialli o'quvchi bir marta, tushum/xarajat/qarz yig'indisi, umumiy davomat", async () => {
      const r = await branches(A.owner);
      expect(r.totals).toMatchObject({
        students: 4,
        groups: 2,
        enrollments: { active: 4, joined: 6, left: 1 },
        attendance: { present: 2, absent: 1, late: 1, excused: 1, rate: 75 },
        income: 350000,
        expenses: 120000,
        net: 230000,
        debt: 250000,
      });
      const o = await overview(A.owner);
      expect(r.totals.income).toBe(o.finance.income); // ikki hisobot mos
      expect(r.totals.debt).toBe(o.debt.amount);
      expect(r.totals.attendance.rate).toBe(o.attendance.rate);
    });

    it("saralash: tushum, qarz, o'quvchi kamayish tartibida; nom bo'yicha o'sish; noto'g'ri saralash 400", async () => {
      const names = async (sort: string) => (await branches(A.owner, `${RANGE}&sort=${sort}`)).items.map((i: { branchName: string }) => i.branchName);
      expect(await names('name')).toEqual(['Asosiy filial', "Bo'sh filial", 'Ikkinchi filial']);
      expect((await names('income'))[0]).toBe('Ikkinchi filial');
      expect((await names('net'))[0]).toBe('Ikkinchi filial');
      expect((await names('debt'))[0]).toBe('Asosiy filial');
      expect((await names('students'))[0]).toBe('Asosiy filial');
      expect((await names('attendance'))[0]).toBe('Ikkinchi filial'); // 100% > 50% > hech narsa
      expect((await names('attendance')).at(-1)).toBe("Bo'sh filial");
      expect((await branches(A.owner, `${RANGE}&sort=debt`)).sort).toBe('debt');
      await A.owner.get(`/reports/branches?${RANGE}&sort=weird`).expect(400);
      await A.owner.get(`/reports/branches?from=${TODAY}&to=${YESTERDAY}`).expect(400);
    });

    it("oraliq tashqarisidagi kunlar: tushum/xarajat/davomat 0, joriy holat (o'quvchi, qarz) saqlanadi", async () => {
      const r = await branches(A.owner, `from=${addDays(TODAY, -10)}&to=${addDays(TODAY, -5)}`);
      expect(row(r, A.main)).toMatchObject({ students: 3, income: 0, expenses: 0, net: 0, debt: 250000, enrollments: { active: 2, joined: 0, left: 0 }, attendance: { total: 0, rate: null } });
      expect(r.totals).toMatchObject({ income: 0, expenses: 0, students: 4 });
    });
  });

  describe('ruxsat', () => {
    it("faqat rahbar: admin, kassir, ustoz, o'quvchi 403; tokensiz 401; boshqa markaz alohida", async () => {
      const urls = [`/reports/overview?${RANGE}`, `/reports/branches?${RANGE}`];
      for (const u of urls) {
        await admin1.api.get(u).expect(403);
        await cashier1.api.get(u).expect(403);
        await teacher1.api.get(u).expect(403);
        await (await student1.api()).get(u).expect(403);
        await httpFn().get(u).expect(401);
        await A.owner.get(u).expect(200);
      }
      // report.* kodlari sozlanmaydi (–): rahbar ularni boshqa rolga bera olmaydi
      const res = await A.owner.put(`/permissions/users/${admin1.id}`, { permissions: { 'report.overview': true } });
      expect(res.status).toBe(400);
      await admin1.api.get(urls[0]!).expect(403);
      expect((await branches(B.owner)).items.map((i: { branchName: string }) => i.branchName)).toEqual(['Asosiy filial', 'Ikkinchi filial']); // A ning filiali yo'q
    });
  });
});
