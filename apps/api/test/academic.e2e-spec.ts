// 20-qadam: vazifa (assignments, submissions) va reyting (rating_points + davomat balli). PGlite, RLS yoqilgan.
// Hamma narsa joriy oyda yaratiladi; kutilgan ballar qo'lda hisoblangan.
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
const PREV = clampedDate(yearOf(TODAY), monthOf(TODAY) - 1, 1).slice(0, 7);
const PAST = new Date(Date.now() - 86_400_000).toISOString();
const FUTURE = new Date(Date.now() + 7 * 86_400_000).toISOString();
type Api = ReturnType<typeof makeApi>;
let httpFn: () => request.Agent;
const makeApi = (t: string) => ({
  get: (p: string) => httpFn().get(p).set({ Authorization: `Bearer ${t}` }),
  post: (p: string, b: object = {}) => httpFn().post(p).set({ Authorization: `Bearer ${t}` }).send(b),
  patch: (p: string, b: object) => httpFn().patch(p).set({ Authorization: `Bearer ${t}` }).send(b),
  put: (p: string, b: object) => httpFn().put(p).set({ Authorization: `Bearer ${t}` }).send(b),
});

describe('Vazifa va reyting (PGlite, RLS yoqilgan)', () => {
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
  async function staff(c: Center, role: 'ADMIN' | 'CASHIER' | 'TEACHER', fullName: string, branchId: string) {
    const res = await c.owner.post('/staff', { role, fullName, branchIds: [branchId] }).expect(201);
    return { id: res.body.user.id as string, api: makeApi(await activate(res.body.user.login, res.body.temporaryPassword)) };
  }
  let n = 0;
  async function mkStudent(c: Center, branchId: string, name = `Talaba${++n} Reyting`) {
    const res = await c.owner.post('/students', { fullName: name, branchId }).expect(201);
    const login = res.body.student.login as string;
    let cached: Promise<Api> | undefined;
    return { id: res.body.student.id as string, name, api: () => (cached ??= activate(login, res.body.temporaryPassword).then(makeApi)) };
  }
  const mkGroup = async (c: Center, name: string, branchId: string) =>
    (await c.owner.post('/groups', { name, courseId: c.course, branchId, priceMonthly: 100000, billingMode: 'STUDENT_CYCLE', status: 'ACTIVE' }).expect(201)).body.id as string;
  const enroll = async (c: Center, groupId: string, studentId: string) =>
    (await c.owner.post('/enrollments', { groupId, studentId }).expect(201)).body.id as string;
  const actions = async (entityId: string) => (await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, entityId))).map((x) => x.action);

  let A: Center;
  let B: Center;
  let admin1: Awaited<ReturnType<typeof staff>>;
  let cashier1: Awaited<ReturnType<typeof staff>>;
  let teacher1: Awaited<ReturnType<typeof staff>>;
  let teacher2: Awaited<ReturnType<typeof staff>>;
  let g1: string;
  let g2: string;
  let s1: Awaited<ReturnType<typeof mkStudent>>;
  let s2: Awaited<ReturnType<typeof mkStudent>>;
  let s3: Awaited<ReturnType<typeof mkStudent>>;
  let s4: Awaited<ReturnType<typeof mkStudent>>;
  let s5: Awaited<ReturnType<typeof mkStudent>>;
  let s6: Awaited<ReturnType<typeof mkStudent>>;
  let e4: string;
  let hw: string; // asosiy vazifa (g1, 100 ball)

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

    A = await newCenter('Reyting Markazi A');
    B = await newCenter('Reyting Markazi B');
    admin1 = await staff(A, 'ADMIN', 'Admin Bir', A.main);
    cashier1 = await staff(A, 'CASHIER', 'Kassir Bir', A.main);
    teacher1 = await staff(A, 'TEACHER', 'Ustoz Bir', A.main);
    teacher2 = await staff(A, 'TEACHER', 'Ustoz Ikki', A.second);
    g1 = await mkGroup(A, 'Reyting g1', A.main);
    g2 = await mkGroup(A, 'Reyting g2', A.second);
    await A.owner.post(`/groups/${g1}/teachers`, { teacherId: teacher1.id, kind: 'MAIN' }).expect(200);
    await A.owner.post(`/groups/${g2}/teachers`, { teacherId: teacher2.id, kind: 'MAIN' }).expect(200);
    s1 = await mkStudent(A, A.main, 'Anvar Aliyev');
    s2 = await mkStudent(A, A.main, 'Bobur Karimov');
    s3 = await mkStudent(A, A.second, 'Dilnoza Rahimova');
    s4 = await mkStudent(A, A.main, 'Eldor Sodiqov');
    s5 = await mkStudent(A, A.main, 'Farrux Tursunov');
    s6 = await mkStudent(A, A.main, 'Gulnora Yusupova'); // hech qayerga yozilmagan
    await enroll(A, g1, s1.id);
    await enroll(A, g1, s2.id);
    await enroll(A, g2, s3.id);
    await enroll(A, g2, s2.id); // s2 ikki filialda
    e4 = await enroll(A, g1, s4.id);
    const e5 = await enroll(A, g1, s5.id);
    await A.owner.post(`/enrollments/${e5}/leave`, {}).expect(200); // s5 guruhdan chiqqan
  });

  afterAll(async () => {
    await app?.close();
    await pg?.close();
  });

  describe('vazifa yaratish va ko\'rish', () => {
    it("faqat ustoz o'z guruhida yaratadi; rahbar/admin/o'quvchi/kassir yaratolmaydi; boshqa ustoz guruhi 404", async () => {
      const body = { title: 'Unit 1 mashqlari', description: 'Kitobdan 1-10', dueAt: FUTURE, maxScore: 100, attachments: [{ name: 'Kitob', url: 'https://example.com/book.pdf' }] };
      await A.owner.post(`/groups/${g1}/assignments`, body).expect(403);
      await admin1.api.post(`/groups/${g1}/assignments`, body).expect(403);
      await cashier1.api.post(`/groups/${g1}/assignments`, body).expect(403);
      await (await s1.api()).post(`/groups/${g1}/assignments`, body).expect(403);
      await httpFn().post(`/groups/${g1}/assignments`).send(body).expect(401);
      await teacher1.api.post(`/groups/${g2}/assignments`, body).expect(404); // o'z guruhi emas
      await teacher2.api.post(`/groups/${g1}/assignments`, body).expect(404);
      await teacher1.api.post(`/groups/${NOPE}/assignments`, body).expect(404);

      const a = (await teacher1.api.post(`/groups/${g1}/assignments`, body).expect(201)).body;
      hw = a.id;
      expect(a).toMatchObject({ groupId: g1, groupName: 'Reyting g1', teacherName: 'Ustoz Bir', title: 'Unit 1 mashqlari', maxScore: 100, archivedAt: null, counts: { students: 3, submitted: 0, graded: 0 }, submissions: [] }); // s1, s2, s4 (s5 chiqqan)
      expect(a.attachments).toEqual([{ name: 'Kitob', url: 'https://example.com/book.pdf' }]);
      expect(await actions(a.id)).toContain('assignment.create');
    });

    it("tekshiruvlar: sarlavha, ball, havola (faqat http/https, <= 10), sana", async () => {
      const post = (b: object) => teacher1.api.post(`/groups/${g1}/assignments`, b);
      await post({ title: '   ' }).expect(400);
      await post({ title: 'x'.repeat(201) }).expect(400);
      await post({ title: 'T', maxScore: 0 }).expect(400);
      await post({ title: 'T', maxScore: 1001 }).expect(400);
      await post({ title: 'T', maxScore: 10.5 }).expect(400);
      await post({ title: 'T', dueAt: 'ertaga' }).expect(400);
      await post({ title: 'T', attachments: [{ name: 'X', url: 'javascript:alert(1)' }] }).expect(400);
      await post({ title: 'T', attachments: [{ name: 'X', url: 'ftp://x.com/a' }] }).expect(400);
      await post({ title: 'T', attachments: Array.from({ length: 11 }, (_, i) => ({ name: `f${i}`, url: 'https://x.com/a' })) }).expect(400);
      await post({ title: 'Faqat sarlavha' }).expect(201);
    });

    it("ko'rish qamrovi: ustoz o'z guruhi, admin o'z filiali, o'quvchi o'z guruhi, rahbar hammasi; kassir yo'q; boshqa markaz yo'q", async () => {
      const second = (await teacher2.api.post(`/groups/${g2}/assignments`, { title: 'Ikkinchi filial vazifasi' }).expect(201)).body.id as string;
      const ids = async (api: Api) => ((await api.get('/assignments?limit=100').expect(200)).body.items as { id: string }[]).map((x) => x.id);
      expect(await ids(A.owner)).toEqual(expect.arrayContaining([hw, second]));
      expect(await ids(teacher1.api)).toContain(hw);
      expect(await ids(teacher1.api)).not.toContain(second);
      expect(await ids(teacher2.api)).toEqual([second]);
      expect(await ids(admin1.api)).toContain(hw); // asosiy filial
      expect(await ids(admin1.api)).not.toContain(second);
      expect(await ids(await s1.api())).toContain(hw);
      expect(await ids(await s1.api())).not.toContain(second);
      expect(await ids(await s3.api())).toEqual([second]);
      expect(await ids(await s2.api())).toEqual(expect.arrayContaining([hw, second])); // ikki guruhda
      expect(await ids(B.owner)).toEqual([]);
      await cashier1.api.get('/assignments').expect(403);
      await teacher1.api.get(`/assignments/${second}`).expect(404);
      await (await s1.api()).get(`/assignments/${second}`).expect(404);
      await admin1.api.get(`/assignments/${second}`).expect(404);
      await B.owner.get(`/assignments/${hw}`).expect(404);
      await A.owner.get(`/assignments/${NOPE}`).expect(404);
      expect((await A.owner.get(`/assignments?groupId=${g2}`).expect(200)).body.items.map((x: { id: string }) => x.id)).toEqual([second]);
      expect((await A.owner.get('/assignments?status=overdue').expect(200)).body.items).toEqual([]);
      await A.owner.get('/assignments?limit=0').expect(400);
    });
  });

  describe('topshirish', () => {
    it("o'quvchi topshiradi va qayta topshiradi; bo'sh yoki ruxsatsiz rad etiladi; muddatdan keyin 'late'; o'z guruhi bo'lmasa 404", async () => {
      const api1 = await s1.api();
      await api1.post(`/assignments/${hw}/submission`, {}).expect(400);
      await api1.post(`/assignments/${hw}/submission`, { text: '   ' }).expect(400);
      await api1.post(`/assignments/${hw}/submission`, { files: [{ name: 'x', url: 'javascript:1' }] }).expect(400);
      const first = (await api1.post(`/assignments/${hw}/submission`, { text: 'Birinchi javob' }).expect(200)).body;
      expect(first).toMatchObject({ studentId: s1.id, text: 'Birinchi javob', late: false, score: null, maxScore: 100 });
      const again = (await api1.post(`/assignments/${hw}/submission`, { text: 'Tuzatilgan javob', files: [{ name: 'Rasm', url: 'https://example.com/a.png' }] }).expect(200)).body;
      expect(again.id).toBe(first.id); // bitta topshiriq yangilandi
      expect(again).toMatchObject({ text: 'Tuzatilgan javob', files: [{ name: 'Rasm', url: 'https://example.com/a.png' }] });

      await (await s3.api()).post(`/assignments/${hw}/submission`, { text: 'Begona guruh' }).expect(404);
      await teacher1.api.post(`/assignments/${hw}/submission`, { text: 'x' }).expect(403);
      await A.owner.post(`/assignments/${hw}/submission`, { text: 'x' }).expect(403);
      await httpFn().post(`/assignments/${hw}/submission`).send({ text: 'x' }).expect(401);

      const late = (await teacher1.api.post(`/groups/${g1}/assignments`, { title: 'Muddati o\'tgan', dueAt: PAST }).expect(201)).body.id as string;
      expect((await (await s2.api()).post(`/assignments/${late}/submission`, { text: 'Kech' }).expect(200)).body.late).toBe(true);
      expect((await (await s2.api()).get(`/assignments?status=overdue`).expect(200)).body.items.map((x: { id: string }) => x.id)).toContain(late);
      expect((await (await s2.api()).get(`/assignments?status=open`).expect(200)).body.items.map((x: { id: string }) => x.id)).not.toContain(late);
    });

    it("o'quvchi faqat o'zining topshirig'ini ko'radi; xodim hammasini (ism, matn, baho); sanoq to'g'ri", async () => {
      await (await s2.api()).post(`/assignments/${hw}/submission`, { text: 'Bobur javobi' }).expect(200);
      const mine = (await (await s1.api()).get(`/assignments/${hw}`).expect(200)).body;
      expect(mine.submission).toMatchObject({ studentId: s1.id, text: 'Tuzatilgan javob' });
      expect(mine.submissions).toBeUndefined();
      expect(mine.counts).toBeUndefined();
      expect(JSON.stringify(mine)).not.toContain('Bobur javobi');
      const list = (await (await s1.api()).get('/assignments').expect(200)).body.items.find((x: { id: string }) => x.id === hw);
      expect(list.mySubmission).toMatchObject({ late: false, score: null, graded: false });

      const staffView = (await teacher1.api.get(`/assignments/${hw}`).expect(200)).body;
      expect(staffView.counts).toEqual({ students: 3, submitted: 2, graded: 0 });
      expect(staffView.submissions.map((x: { studentName: string }) => x.studentName).sort((a: string, b: string) => a.localeCompare(b))).toEqual(['Anvar Aliyev', 'Bobur Karimov']);
      expect((await A.owner.get(`/assignments/${hw}`).expect(200)).body.submissions).toHaveLength(2);
      expect((await admin1.api.get(`/assignments/${hw}`).expect(200)).body.counts.submitted).toBe(2);
    });
  });

  describe('baholash va reyting ballari', () => {
    it("baho: faqat ustoz o'z guruhida; ball > maksimal 409; topshiriqsiz 404; reytingga 10 ballik shkalada yoziladi", async () => {
      const grade = (api: Api, studentId: string, body: object) => api.post(`/assignments/${hw}/submissions/${studentId}/grade`, body);
      await grade(A.owner, s1.id, { score: 80 }).expect(403);
      await grade(admin1.api, s1.id, { score: 80 }).expect(403);
      await grade(await s1.api(), s1.id, { score: 100 }).expect(403);
      await grade(teacher2.api, s1.id, { score: 80 }).expect(404); // o'z guruhi emas
      await grade(teacher1.api, s1.id, { score: -1 }).expect(400);
      await grade(teacher1.api, s1.id, { score: 8.5 }).expect(400);
      expect((await grade(teacher1.api, s1.id, { score: 101 }).expect(409)).body.code).toBe('SCORE_EXCEEDS_MAX');
      expect((await grade(teacher1.api, s3.id, { score: 50 }).expect(404)).body.code).toBe('SUBMISSION_NOT_FOUND');

      const g = (await grade(teacher1.api, s1.id, { score: 80, feedback: 'Yaxshi, lekin xatolar bor' }).expect(200)).body;
      expect(g).toMatchObject({ score: 80, maxScore: 100, feedback: 'Yaxshi, lekin xatolar bor' });
      expect(g.gradedAt).not.toBeNull();
      const pts = async () => ((await teacher1.api.get(`/ratings/students/${s1.id}/events`).expect(200)).body.items as { points: number; source: string }[]).filter((e) => e.source === 'HOMEWORK');
      expect((await pts()).map((e) => e.points)).toEqual([8]); // 80/100 -> 8 ball

      // qayta baholash: faqat farq yoziladi (voqealar o'zgarmaydi)
      await grade(teacher1.api, s1.id, { score: 100 }).expect(200);
      await grade(teacher1.api, s1.id, { score: 50 }).expect(200);
      await grade(teacher1.api, s1.id, { score: 50 }).expect(200); // o'zgarishsiz: yangi voqea yo'q
      const all = await pts();
      expect(all.map((e) => e.points).sort((a, b) => a - b)).toEqual([-5, 2, 8]);
      expect(all.reduce((s0, e) => s0 + e.points, 0)).toBe(5); // 50/100 -> 5 ball
      const sub = (await db.select().from(s.submissions).where(eq(s.submissions.studentId, s1.id)))[0]!;
      expect(await actions(sub.id)).toContain('homework.grade');
    });

    it("baholangan topshiriq o'zgarmaydi; o'quvchi bahosi va izohini ko'radi; maksimal ballni o'zgartirib bo'lmaydi", async () => {
      const api1 = await s1.api();
      expect((await api1.post(`/assignments/${hw}/submission`, { text: 'Yana' }).expect(409)).body.code).toBe('ALREADY_GRADED');
      const own = (await api1.get(`/assignments/${hw}`).expect(200)).body;
      expect(own.submission).toMatchObject({ score: 50, maxScore: 100, feedback: null });
      expect((await api1.get('/assignments').expect(200)).body.items.find((x: { id: string }) => x.id === hw).mySubmission).toMatchObject({ graded: true, score: 50 });
      expect((await teacher1.api.patch(`/assignments/${hw}`, { maxScore: 50 }).expect(409)).body.code).toBe('HAS_GRADES');
      expect((await teacher1.api.patch(`/assignments/${hw}`, { title: 'Unit 1 (yangilangan)', maxScore: 100 }).expect(200)).body.title).toBe('Unit 1 (yangilangan)');
      expect((await A.owner.get(`/assignments/${hw}`).expect(200)).body.counts).toEqual({ students: 3, submitted: 2, graded: 1 });
    });

    it("boshqa maksimal ball: 20 dan 15 -> 7.5 yaxlitlanadi (8 ball)", async () => {
      const a = (await teacher1.api.post(`/groups/${g1}/assignments`, { title: 'Kichik test', maxScore: 20 }).expect(201)).body.id as string;
      await (await s2.api()).post(`/assignments/${a}/submission`, { text: 'javob' }).expect(200);
      await teacher1.api.post(`/assignments/${a}/submissions/${s2.id}/grade`, { score: 15 }).expect(200);
      const ev = ((await teacher1.api.get(`/ratings/students/${s2.id}/events?groupId=${g1}`).expect(200)).body.items as { points: number; source: string }[]).filter((e) => e.source === 'HOMEWORK');
      expect(ev.map((e) => e.points)).toEqual([8]);
    });
  });

  describe('qo\'lda ball va davomat balli', () => {
    beforeAll(async () => {
      // davomat: g1 darsi: s1 kelgan (2), s2 kech qolgan (1), s4 kelmagan (0)
      const lesson = (await A.owner.post(`/groups/${g1}/lessons`, { lessonDate: TODAY }).expect(201)).body.id as string;
      await A.owner.put(`/lessons/${lesson}/attendance`, { records: [{ studentId: s1.id, status: 'PRESENT' }, { studentId: s2.id, status: 'LATE' }, { studentId: s4.id, status: 'ABSENT' }] }).expect(200);
      await A.owner.post(`/enrollments/${e4}/freeze`).expect(200); // s4 muzlatilgan, baribir reytingda
    });

    it("qo'lda ball: rahbar va ustoz (o'z guruhida); sabab majburiy; guruhda bo'lmagan o'quvchi 404; admin/o'quvchi 403", async () => {
      const adj = (api: Api, body: object) => api.post('/ratings/adjust', body);
      const ok = (await adj(teacher1.api, { studentId: s2.id, groupId: g1, points: 4, reason: 'Faol qatnashdi' }).expect(201)).body;
      expect(ok).toMatchObject({ studentId: s2.id, groupId: g1, source: 'MANUAL', points: 4, reason: 'Faol qatnashdi' });
      await adj(teacher1.api, { studentId: s4.id, groupId: g1, points: -1, reason: 'Kechikdi' }).expect(201);
      await adj(A.owner, { studentId: s3.id, groupId: g2, points: 3, reason: 'Olimpiada' }).expect(201);
      await adj(admin1.api, { studentId: s1.id, groupId: g1, points: 1, reason: 'x' }).expect(403);
      await adj(await s1.api(), { studentId: s1.id, groupId: g1, points: 100, reason: 'o\'zimga' }).expect(403);
      await adj(cashier1.api, { studentId: s1.id, groupId: g1, points: 1, reason: 'x' }).expect(403);
      expect((await adj(teacher1.api, { studentId: s3.id, groupId: g2, points: 1, reason: 'x' }).expect(404)).body.code).toBe('GROUP_NOT_FOUND'); // ustozning guruhi emas
      expect((await adj(A.owner, { studentId: s3.id, groupId: g1, points: 1, reason: 'x' }).expect(404)).body.code).toBe('STUDENT_NOT_IN_GROUP');
      expect((await adj(A.owner, { studentId: s5.id, groupId: g1, points: 1, reason: 'x' }).expect(404)).body.code).toBe('STUDENT_NOT_IN_GROUP'); // chiqqan
      await adj(A.owner, { studentId: s1.id, groupId: g1, points: 0, reason: 'x' }).expect(400);
      await adj(A.owner, { studentId: s1.id, groupId: g1, points: 1001, reason: 'x' }).expect(400);
      await adj(A.owner, { studentId: s1.id, groupId: g1, points: 5 }).expect(400);
      await adj(B.owner, { studentId: s1.id, groupId: g1, points: 1, reason: 'x' }).expect(404);
      expect(await actions(s2.id)).toContain('rating.adjust');
    });

    it("guruh reytingi: vazifa + davomat + qo'lda; tartib va o'rin; chiqqan o'quvchi yo'q, muzlatilgan bor", async () => {
      const r = (await teacher1.api.get(`/ratings?scope=group&groupId=${g1}`).expect(200)).body;
      expect(r).toMatchObject({ scope: 'group', scopeName: 'Reyting g1', period: 'month', month: TODAY.slice(0, 7), total: 3 });
      expect(r.items.map((i: { studentName: string; rank: number; total: number; homework: number; attendance: number; manual: number }) => [i.rank, i.studentName, i.total, i.homework, i.attendance, i.manual])).toEqual([
        [1, 'Bobur Karimov', 13, 8, 1, 4], // 20 dan 15 -> 8; kech qolgan 1; qo'lda +4
        [2, 'Anvar Aliyev', 7, 5, 2, 0], // vazifa 50/100 -> 5; kelgan 2
        [3, 'Eldor Sodiqov', -1, 0, 0, -1], // kelmagan 0; qo'lda -1
      ]);
      expect(r.items[0].branches).toEqual(['Asosiy filial', 'Ikkinchi filial']);
      expect(r.my).toBeNull(); // o'quvchi emas
    });

    it("filial va markaz reytingi: o'quvchi har filialda alohida (filial voqealari), markazda hammasi; teng ball bir xil o'rin", async () => {
      const b = (await A.owner.get(`/ratings?scope=branch&branchId=${A.main}`).expect(200)).body;
      expect(b).toMatchObject({ scopeName: 'Asosiy filial' });
      // s2: asosiy filialda g1 voqealari (13); s3 ikkinchi filialda; s5 va s6 asosiy filialga bog'langan (0 ball)
      expect(b.items.map((i: { studentName: string; total: number }) => [i.studentName, i.total])).toEqual([
        ['Bobur Karimov', 13],
        ['Anvar Aliyev', 7],
        ['Farrux Tursunov', 0],
        ['Gulnora Yusupova', 0],
        ['Eldor Sodiqov', -1],
      ]);
      expect(b.items.map((i: { rank: number }) => i.rank)).toEqual([1, 2, 3, 3, 5]); // teng ball: bir xil o'rin, keyingisi o'tkazib yuboriladi
      const second = (await A.owner.get(`/ratings?scope=branch&branchId=${A.second}`).expect(200)).body;
      expect(second.items.map((i: { studentName: string; total: number }) => [i.studentName, i.total])).toEqual([['Dilnoza Rahimova', 3], ['Bobur Karimov', 0]]);
      const c = (await A.owner.get('/ratings?scope=center').expect(200)).body;
      expect(c.scopeName).toBe('Markaz');
      expect(c.items.map((i: { studentName: string; total: number }) => [i.studentName, i.total])).toEqual([
        ['Bobur Karimov', 13],
        ['Anvar Aliyev', 7],
        ['Dilnoza Rahimova', 3],
        ['Farrux Tursunov', 0],
        ['Gulnora Yusupova', 0],
        ['Eldor Sodiqov', -1],
      ]);
    });

    it("davr: boshqa oy bo'sh, 'all' hozirgi bilan teng; sahifalash; noto'g'ri parametrlar 400", async () => {
      const prev = (await A.owner.get(`/ratings?scope=center&period=month&month=${PREV}`).expect(200)).body;
      expect(prev.items.every((i: { total: number }) => i.total === 0)).toBe(true);
      expect(prev.items.every((i: { rank: number }) => i.rank === 1)).toBe(true);
      const all = (await A.owner.get('/ratings?scope=center&period=all').expect(200)).body;
      expect(all).toMatchObject({ period: 'all', month: null });
      expect(all.items[0]).toMatchObject({ studentName: 'Bobur Karimov', total: 13 });
      const page = (await A.owner.get('/ratings?scope=center&limit=2&offset=1').expect(200)).body;
      expect(page).toMatchObject({ total: 6, limit: 2, offset: 1 });
      expect(page.items.map((i: { rank: number }) => i.rank)).toEqual([2, 3]);
      await A.owner.get('/ratings?scope=group').expect(400);
      await A.owner.get('/ratings?scope=branch').expect(400);
      await A.owner.get('/ratings?scope=weird').expect(400);
      await A.owner.get('/ratings?scope=center&period=month&month=2026-13').expect(400);
      await A.owner.get('/ratings').expect(400);
    });

    it("ko'rish ruxsatlari: ustoz faqat o'z guruhi; admin faqat o'z filiali (markaz yo'q); o'quvchi o'z guruhi, o'z filiali va markaz; kassir yo'q", async () => {
      await teacher1.api.get(`/ratings?scope=branch&branchId=${A.main}`).expect(403);
      await teacher1.api.get('/ratings?scope=center').expect(403);
      expect((await teacher1.api.get(`/ratings?scope=group&groupId=${g2}`).expect(404)).body.code).toBe('GROUP_NOT_FOUND');
      await teacher2.api.get(`/ratings?scope=group&groupId=${g1}`).expect(404);

      await admin1.api.get(`/ratings?scope=group&groupId=${g1}`).expect(200);
      await admin1.api.get(`/ratings?scope=branch&branchId=${A.main}`).expect(200);
      await admin1.api.get(`/ratings?scope=group&groupId=${g2}`).expect(404); // boshqa filial
      await admin1.api.get(`/ratings?scope=branch&branchId=${A.second}`).expect(404);
      await admin1.api.get('/ratings?scope=center').expect(403);
      await cashier1.api.get('/ratings?scope=center').expect(403);
      await httpFn().get('/ratings?scope=center').expect(401);

      const st = await s1.api();
      await st.get(`/ratings?scope=group&groupId=${g1}`).expect(200);
      await st.get(`/ratings?scope=group&groupId=${g2}`).expect(404); // yozilmagan guruh
      await st.get(`/ratings?scope=branch&branchId=${A.main}`).expect(200);
      await st.get(`/ratings?scope=branch&branchId=${A.second}`).expect(404); // bog'lanmagan filial
      const center = (await st.get('/ratings?scope=center').expect(200)).body;
      expect(center.my).toEqual({ rank: 2, points: 7 }); // markaz reytingida o'z o'rni
      expect(center.items.map((i: { studentName: string }) => i.studentName)).toContain('Dilnoza Rahimova'); // to'liq ism (ERD 6.5)
      expect((await (await s6.api()).get('/ratings?scope=center').expect(200)).body.my).toMatchObject({ points: 0 });
      expect((await B.owner.get('/ratings?scope=center').expect(200)).body.items).toEqual([]);
      await B.owner.get(`/ratings?scope=group&groupId=${g1}`).expect(404);
    });

    it("o'quvchi voqealari: o'zinikini ko'radi, boshqasini yo'q; ustoz faqat o'z guruhi voqealarini; admin o'z filialidagini", async () => {
      expect((await (await s1.api()).get(`/ratings/students/${s1.id}/events`).expect(200)).body.items.length).toBe(3);
      await (await s1.api()).get(`/ratings/students/${s2.id}/events`).expect(404);
      const asT1 = (await teacher1.api.get(`/ratings/students/${s2.id}/events`).expect(200)).body;
      expect(asT1.studentName).toBe('Bobur Karimov');
      expect(asT1.items.every((i: { groupId: string }) => i.groupId === g1)).toBe(true);
      expect(asT1.items.map((i: { source: string; points: number }) => `${i.source}:${i.points}`).sort((a: string, b: string) => a.localeCompare(b))).toEqual(['HOMEWORK:8', 'MANUAL:4']);
      expect((await teacher2.api.get(`/ratings/students/${s2.id}/events`).expect(200)).body.items).toEqual([]); // s2 ning g2 dagi voqeasi yo'q, g1 niki ko'rinmaydi
      await teacher2.api.get(`/ratings/students/${s1.id}/events`).expect(404);
      expect((await A.owner.get(`/ratings/students/${s2.id}/events?groupId=${g1}&limit=1`).expect(200)).body.items).toHaveLength(1);
      await admin1.api.get(`/ratings/students/${s2.id}/events`).expect(200);
      await admin1.api.get(`/ratings/students/${s3.id}/events`).expect(404);
      await A.owner.get(`/ratings/students/${NOPE}/events`).expect(404);
      await A.owner.get(`/ratings/students/${admin1.id}/events`).expect(404); // xodim o'quvchi emas
      await B.owner.get(`/ratings/students/${s1.id}/events`).expect(404);
      await cashier1.api.get(`/ratings/students/${s1.id}/events`).expect(403);
    });
  });

  describe('arxiv va o\'zgartirish', () => {
    it("arxivlash: o'quvchi ko'rmaydi, xodim includeArchived bilan ko'radi; topshirish va tahrirlash 409; takror arxiv 409; ustoz tahriri faqat o'z guruhida", async () => {
      const a = (await teacher1.api.post(`/groups/${g1}/assignments`, { title: 'Arxivlanadigan' }).expect(201)).body.id as string;
      await teacher2.api.patch(`/assignments/${a}`, { title: 'Boshqa' }).expect(404);
      await A.owner.patch(`/assignments/${a}`, { title: 'Rahbar' }).expect(403);
      await teacher1.api.patch(`/assignments/${a}`, {}).expect(400);
      expect((await teacher1.api.patch(`/assignments/${a}`, { dueAt: null, description: null, maxScore: 50 }).expect(200)).body).toMatchObject({ dueAt: null, description: null, maxScore: 50 }); // baholanmagan: ball o'zgaradi
      const done = (await teacher1.api.post(`/assignments/${a}/archive`).expect(200)).body;
      expect(done.archivedAt).not.toBeNull();
      expect((await teacher1.api.post(`/assignments/${a}/archive`).expect(409)).body.code).toBe('ALREADY_ARCHIVED');
      expect((await teacher1.api.patch(`/assignments/${a}`, { title: 'Yana' }).expect(409)).body.code).toBe('ASSIGNMENT_ARCHIVED');
      expect((await (await s1.api()).post(`/assignments/${a}/submission`, { text: 'x' }).expect(404)).body.code).toBe('ASSIGNMENT_NOT_FOUND');
      await (await s1.api()).get(`/assignments/${a}`).expect(404);
      const staffList = async (qs: string) => ((await teacher1.api.get(`/assignments?limit=100${qs}`).expect(200)).body.items as { id: string }[]).map((x) => x.id);
      expect(await staffList('')).not.toContain(a);
      expect(await staffList('&includeArchived=true')).toContain(a);
      expect(await actions(a)).toEqual(expect.arrayContaining(['assignment.create', 'assignment.edit', 'assignment.archive']));
    });

    it("muzlatilgan o'quvchi topshira olmaydi (409), ammo ko'ra oladi", async () => {
      const a = (await teacher1.api.post(`/groups/${g1}/assignments`, { title: 'Muzlatilganlar uchun' }).expect(201)).body.id as string;
      const api4 = await s4.api();
      await api4.get(`/assignments/${a}`).expect(200);
      expect((await api4.post(`/assignments/${a}/submission`, { text: 'x' }).expect(409)).body.code).toBe('ENROLLMENT_NOT_ACTIVE');
    });
  });
});
