// 11-qadam: darslar va davomat belgilash (ruxsat, qamrov, yaroqlilik, audit). PGlite, RLS yoqilgan.
import { PERMISSIONS } from '@erp/shared';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq, sql } from 'drizzle-orm';
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
const daysAgo = (n: number) => addDays(todayLocal(), -n);
type Api = ReturnType<typeof makeApi>;
let httpFn: () => request.Agent;
const makeApi = (t: string) => ({
  get: (p: string) => httpFn().get(p).set({ Authorization: `Bearer ${t}` }),
  post: (p: string, b: object = {}) => httpFn().post(p).set({ Authorization: `Bearer ${t}` }).send(b),
  patch: (p: string, b: object) => httpFn().patch(p).set({ Authorization: `Bearer ${t}` }).send(b),
  put: (p: string, b: object) => httpFn().put(p).set({ Authorization: `Bearer ${t}` }).send(b),
});

describe('Darslar va davomat (PGlite, RLS yoqilgan)', () => {
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
    return { id: res.body.student.id as string, api: () => (cached ??= activate(login, res.body.temporaryPassword).then(makeApi)) };
  }
  const mkGroup = async (c: Center, name: string, extra: object = {}) =>
    (await c.owner.post('/groups', { name, courseId: c.course, branchId: c.main, ...extra }).expect(201)).body as { id: string };
  const enroll = async (c: Center, groupId: string, studentId: string, extra: object = {}) =>
    (await c.owner.post('/enrollments', { groupId, studentId, ...extra }).expect(201)).body.id as string;
  const assign = (c: Center, groupId: string, teacherId: string, kind = 'MAIN') => c.owner.post(`/groups/${groupId}/teachers`, { teacherId, kind }).expect(200);
  const lessonOf = async (api: Api, groupId: string, lessonDate: string, extra: object = {}) =>
    (await api.post(`/groups/${groupId}/lessons`, { lessonDate, ...extra }).expect(201)).body as { id: string };

  let A: Center;
  let B: Center;
  let admin1: Awaited<ReturnType<typeof staff>>;
  let cashier1: Awaited<ReturnType<typeof staff>>;
  let teacher1: Awaited<ReturnType<typeof staff>>; // Asosiy filial, g1
  let teacher2: Awaited<ReturnType<typeof staff>>; // Ikkinchi filial, g2
  let g1: { id: string };
  let g2: { id: string };
  let s1: Awaited<ReturnType<typeof mkStudent>>;
  let s2: Awaited<ReturnType<typeof mkStudent>>;
  let s3: Awaited<ReturnType<typeof mkStudent>>;
  let sOther: Awaited<ReturnType<typeof mkStudent>>; // faqat g2 da

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

    A = await newCenter('Davomat Markazi A');
    B = await newCenter('Davomat Markazi B');
    // Bu to'plamdagi testlar eski sanalar bilan ishlaydi: qulf muddati uzaytirilgan (qulf alohida bloklarda sinaladi)
    await db.execute(sql`update centers set settings = settings || '{"attendance_lock_days": 365}'::jsonb`);
    admin1 = await staff(A, 'ADMIN', 'Admin Bir', [A.main]);
    cashier1 = await staff(A, 'CASHIER', 'Kassir Bir', [A.main]);
    teacher1 = await staff(A, 'TEACHER', 'Ustoz Bir', [A.main]);
    teacher2 = await staff(A, 'TEACHER', 'Ustoz Ikki', [A.second]);
    g1 = await mkGroup(A, 'Davomat Guruhi 1');
    g2 = await mkGroup(A, 'Davomat Guruhi 2', { branchId: A.second });
    await assign(A, g1.id, teacher1.id);
    await assign(A, g2.id, teacher2.id);
    s1 = await mkStudent(A, 'Anvar Bir', A.main);
    s2 = await mkStudent(A, 'Bobur Ikki', A.main);
    s3 = await mkStudent(A, 'Dilshod Uch', A.main);
    sOther = await mkStudent(A, 'Begona Oquvchi', A.second);
    for (const st of [s1, s2, s3]) await enroll(A, g1.id, st.id, { joinedAt: daysAgo(60) });
    await enroll(A, g2.id, sOther.id, { joinedAt: daysAgo(60) });
  });

  afterAll(async () => {
    await app?.close();
    await pg?.close();
  });

  describe('dars ochish', () => {
    it("ustoz o'z guruhida ochadi (o'zi ustoz bo'ladi); rahbar ustozni guruh asosiy ustozidan oladi; audit", async () => {
      const l = (await teacher1.api.post(`/groups/${g1.id}/lessons`, { lessonDate: TODAY, topic: 'Present Simple' }).expect(201)).body;
      expect(l).toMatchObject({ groupId: g1.id, groupName: 'Davomat Guruhi 1', lessonDate: TODAY, teacherId: teacher1.id, teacherName: 'Ustoz Bir', topic: 'Present Simple', status: 'HELD', lockedAt: null });
      expect(l.summary).toEqual({ present: 0, absent: 0, late: 0, excused: 0 });

      const past = await lessonOf(A.owner, g1.id, daysAgo(7));
      expect((await A.owner.get(`/lessons/${past.id}`).expect(200)).body.teacherId).toBe(teacher1.id); // asosiy ustoz

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, l.id));
      expect(audit.find((x) => x.action === 'lesson.create')?.after).toMatchObject({ groupId: g1.id, lessonDate: TODAY });
    });

    it("bir sanada bitta dars; kelajak sanasi, noto'g'ri sana, noma'lum guruh rad etiladi", async () => {
      const g = await mkGroup(A, 'Sana Guruhi');
      await lessonOf(A.owner, g.id, daysAgo(3));
      expect((await A.owner.post(`/groups/${g.id}/lessons`, { lessonDate: daysAgo(3) }).expect(409)).body.code).toBe('LESSON_EXISTS');
      expect((await A.owner.post(`/groups/${g.id}/lessons`, { lessonDate: daysAgo(-1) }).expect(400)).body.code).toBe('LESSON_IN_FUTURE');
      await A.owner.post(`/groups/${g.id}/lessons`, { lessonDate: '03.03.2026' }).expect(400);
      await A.owner.post(`/groups/${g.id}/lessons`, {}).expect(400);
      await A.owner.post(`/groups/${NOPE}/lessons`, { lessonDate: TODAY }).expect(404);
      await A.owner.post('/groups/not-a-uuid/lessons', { lessonDate: TODAY }).expect(400);
      await A.owner.post(`/groups/${g.id}/lessons`, { lessonDate: daysAgo(5), topic: '' }).expect(400);

      const arch = await mkGroup(A, 'Arxiv Dars Guruhi');
      await A.owner.post(`/groups/${arch.id}/archive`).expect(200);
      expect((await A.owner.post(`/groups/${arch.id}/lessons`, { lessonDate: TODAY }).expect(409)).body.code).toBe('GROUP_ARCHIVED');
    });

    it("ustoz boshqa ustoz nomidan ocha olmaydi; rahbar faqat guruhga biriktirilgan ustozni ko'rsatadi", async () => {
      const g = await mkGroup(A, 'Ustoz Tanlash');
      await assign(A, g.id, teacher1.id);
      await teacher1.api.post(`/groups/${g.id}/lessons`, { lessonDate: daysAgo(2), teacherId: teacher2.id }).expect(403);
      await teacher1.api.post(`/groups/${g.id}/lessons`, { lessonDate: daysAgo(2), teacherId: teacher1.id }).expect(201);
      expect((await A.owner.post(`/groups/${g.id}/lessons`, { lessonDate: daysAgo(4), teacherId: teacher2.id }).expect(400)).body.code).toBe('TEACHER_NOT_IN_GROUP');
      await A.owner.post(`/groups/${g.id}/lessons`, { lessonDate: daysAgo(4), teacherId: admin1.id }).expect(400); // ustoz emas
      const noTeacher = await mkGroup(A, 'Ustozsiz Guruh');
      expect((await lessonOf(A.owner, noTeacher.id, daysAgo(1)).then((l) => A.owner.get(`/lessons/${l.id}`))).body.teacherId).toBeNull();
    });

    it("ruxsatlar: admin uchun attendance.mark ○ (yoqilmaguncha 403), kassir va o'quvchi 403, begona ustoz/filial/markaz 404", async () => {
      const g = await mkGroup(A, 'Ruxsat Guruhi');
      const gSecond = await mkGroup(A, 'Ruxsat Ikkinchi', { branchId: A.second });
      await admin1.api.post(`/groups/${g.id}/lessons`, { lessonDate: daysAgo(1) }).expect(403);
      await cashier1.api.post(`/groups/${g.id}/lessons`, { lessonDate: daysAgo(1) }).expect(403);
      await (await s1.api()).post(`/groups/${g.id}/lessons`, { lessonDate: daysAgo(1) }).expect(403);
      await httpFn().post(`/groups/${g.id}/lessons`).send({}).expect(401);

      await A.owner.put('/permissions/roles/ADMIN', { permissions: { 'attendance.mark': true } }).expect(200);
      await admin1.api.post(`/groups/${g.id}/lessons`, { lessonDate: daysAgo(1) }).expect(201);
      await admin1.api.post(`/groups/${gSecond.id}/lessons`, { lessonDate: daysAgo(1) }).expect(404); // admin filialidan tashqari
      await A.owner.put('/permissions/roles/ADMIN', { permissions: { 'attendance.mark': false } }).expect(200);

      await teacher1.api.post(`/groups/${g.id}/lessons`, { lessonDate: daysAgo(9) }).expect(404); // g ga biriktirilmagan
      await B.owner.post(`/groups/${g.id}/lessons`, { lessonDate: daysAgo(1) }).expect(404);
    });
  });

  describe('davomat belgilash', () => {
    it("bir so'rovda ko'p o'quvchi; qayta yuborilsa yangilanadi, yuborilmaganlar o'zgarmaydi; audit before/after", async () => {
      const l = await lessonOf(teacher1.api, g1.id, daysAgo(10));
      const first = (await teacher1.api
        .put(`/lessons/${l.id}/attendance`, { records: [{ studentId: s1.id, status: 'PRESENT' }, { studentId: s2.id, status: 'ABSENT', note: 'Kasal' }, { studentId: s3.id, status: 'LATE' }] })
        .expect(200)).body;
      expect(first.roster.map((r: { fullName: string; status: string }) => [r.fullName, r.status])).toEqual([['Anvar Bir', 'PRESENT'], ['Bobur Ikki', 'ABSENT'], ['Dilshod Uch', 'LATE']]);
      expect(first.roster[1]).toMatchObject({ note: 'Kasal', markedBy: teacher1.id });
      expect(first.summary).toEqual({ present: 1, absent: 1, late: 1, excused: 0 });

      const again = (await teacher1.api.put(`/lessons/${l.id}/attendance`, { records: [{ studentId: s2.id, status: 'EXCUSED', note: 'Ma\'lumotnoma' }] }).expect(200)).body;
      expect(again.roster.map((r: { status: string }) => r.status)).toEqual(['PRESENT', 'EXCUSED', 'LATE']);
      expect(again.summary).toEqual({ present: 1, absent: 0, late: 1, excused: 1 });
      expect(await db.select().from(s.attendanceRecords).where(eq(s.attendanceRecords.lessonId, l.id))).toHaveLength(3); // takror qator yo'q

      const audit = (await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, l.id))).filter((x) => x.action === 'attendance.mark');
      expect(audit).toHaveLength(2);
      expect(audit[1]!.before).toMatchObject({ records: { [s2.id]: { status: 'ABSENT', note: 'Kasal' } } });
      expect(audit[1]!.after).toMatchObject({ records: { [s2.id]: { status: 'EXCUSED' } } });
    });

    it("noto'g'ri kiritish: bo'sh, takror, noma'lum holat, uzun izoh 400; guruhda bo'lmagan o'quvchi 400 (ro'yxat bilan) va hech narsa yozilmaydi", async () => {
      const l = await lessonOf(A.owner, g1.id, daysAgo(11));
      const put = (records: unknown[]) => A.owner.put(`/lessons/${l.id}/attendance`, { records });
      await put([]).expect(400);
      await put([{ studentId: s1.id, status: 'SLEEPING' }]).expect(400);
      await put([{ studentId: s1.id, status: 'PRESENT', note: 'x'.repeat(201) }]).expect(400);
      expect((await put([{ studentId: s1.id, status: 'PRESENT' }, { studentId: s1.id, status: 'ABSENT' }]).expect(400)).body.code).toBe('DUPLICATE_STUDENT');
      const outside = (await put([{ studentId: s1.id, status: 'PRESENT' }, { studentId: sOther.id, status: 'PRESENT' }, { studentId: NOPE, status: 'ABSENT' }]).expect(400)).body;
      expect(outside.code).toBe('STUDENT_NOT_IN_LESSON');
      expect(outside.studentIds.sort()).toEqual([sOther.id, NOPE].sort());
      expect(await db.select().from(s.attendanceRecords).where(eq(s.attendanceRecords.lessonId, l.id))).toEqual([]); // s1 ham yozilmadi
      await A.owner.put(`/lessons/${NOPE}/attendance`, { records: [{ studentId: s1.id, status: 'PRESENT' }] }).expect(404);
    });

    it("dars kuni guruhda bo'lganlar belgilanadi: keyin yozilgan, oldin chiqqan va muzlatilgan emas; keyin chiqqan ha", async () => {
      const g = await mkGroup(A, 'Yaroqlilik Guruhi');
      const date = '2026-01-20';
      const mk = (n: string) => mkStudent(A, n, A.main);
      const [ok, late, gone, goneAfter, frozen] = await Promise.all([mk('Ok Oquvchi'), mk('Kech Yozilgan'), mk('Oldin Chiqqan'), mk('Keyin Chiqqan'), mk('Muzlatilgan')]);
      await enroll(A, g.id, ok.id, { joinedAt: '2026-01-10' });
      await enroll(A, g.id, late.id, { joinedAt: '2026-02-01' });
      const eGone = await enroll(A, g.id, gone.id, { joinedAt: '2026-01-01' });
      const eAfter = await enroll(A, g.id, goneAfter.id, { joinedAt: '2026-01-01' });
      const eFrozen = await enroll(A, g.id, frozen.id, { joinedAt: '2026-01-01' });
      await A.owner.post(`/enrollments/${eGone}/leave`, { leftAt: '2026-01-10' }).expect(200);
      await A.owner.post(`/enrollments/${eAfter}/leave`, { leftAt: '2026-01-25' }).expect(200);
      await A.owner.post(`/enrollments/${eFrozen}/freeze`).expect(200);

      const l = await lessonOf(A.owner, g.id, date);
      const roster = (await A.owner.get(`/lessons/${l.id}`).expect(200)).body.roster as { studentId: string }[];
      expect(roster.map((r) => r.studentId).sort()).toEqual([ok.id, goneAfter.id].sort());
      await A.owner.put(`/lessons/${l.id}/attendance`, { records: [{ studentId: ok.id, status: 'PRESENT' }, { studentId: goneAfter.id, status: 'ABSENT' }] }).expect(200);
      for (const bad of [late, gone, frozen]) {
        expect((await A.owner.put(`/lessons/${l.id}/attendance`, { records: [{ studentId: bad.id, status: 'PRESENT' }] }).expect(400)).body.code).toBe('STUDENT_NOT_IN_LESSON');
      }
    });

    it("keyin muzlatilgan/chiqqan o'quvchining yozuvi qatnashchilar ro'yxatida saqlanadi", async () => {
      const g = await mkGroup(A, 'Tarix Guruhi');
      const st = await mkStudent(A, 'Tarix Oquvchi', A.main);
      const e = await enroll(A, g.id, st.id, { joinedAt: daysAgo(30) });
      const l = await lessonOf(A.owner, g.id, daysAgo(5));
      await A.owner.put(`/lessons/${l.id}/attendance`, { records: [{ studentId: st.id, status: 'PRESENT' }] }).expect(200);
      await A.owner.post(`/enrollments/${e}/freeze`).expect(200);
      const roster = (await A.owner.get(`/lessons/${l.id}`).expect(200)).body.roster as { studentId: string; status: string }[];
      expect(roster).toEqual([expect.objectContaining({ studentId: st.id, status: 'PRESENT' })]);
    });

    it("kassir, o'quvchi, begona ustoz va admin (○ yoqilmagan) belgilay olmaydi; boshqa markaz 404", async () => {
      const l = await lessonOf(A.owner, g1.id, daysAgo(12));
      const body = { records: [{ studentId: s1.id, status: 'PRESENT' }] };
      await cashier1.api.put(`/lessons/${l.id}/attendance`, body).expect(403);
      await (await s1.api()).put(`/lessons/${l.id}/attendance`, body).expect(403);
      await admin1.api.put(`/lessons/${l.id}/attendance`, body).expect(403);
      await teacher2.api.put(`/lessons/${l.id}/attendance`, body).expect(404);
      await B.owner.put(`/lessons/${l.id}/attendance`, body).expect(404);
      await httpFn().put(`/lessons/${l.id}/attendance`).send(body).expect(401);
    });
  });

  describe('dars tahrirlash va bekor qilish', () => {
    it("mavzu o'zgaradi; ustozni faqat rahbar/admin o'zgartiradi; davomat belgilangan darsni bekor qilib bo'lmaydi; bekor qilingan darsga belgilanmaydi", async () => {
      const l = await lessonOf(teacher1.api, g1.id, daysAgo(13));
      expect((await teacher1.api.patch(`/lessons/${l.id}`, { topic: 'Past Continuous' }).expect(200)).body.topic).toBe('Past Continuous');
      expect((await teacher1.api.patch(`/lessons/${l.id}`, { topic: null }).expect(200)).body.topic).toBeNull();
      await teacher1.api.patch(`/lessons/${l.id}`, { teacherId: teacher1.id }).expect(403);
      await A.owner.patch(`/lessons/${l.id}`, {}).expect(400);
      expect((await A.owner.patch(`/lessons/${l.id}`, { teacherId: teacher2.id }).expect(400)).body.code).toBe('TEACHER_NOT_IN_GROUP');
      expect((await A.owner.patch(`/lessons/${l.id}`, { teacherId: null }).expect(200)).body.teacherId).toBeNull();

      await teacher1.api.put(`/lessons/${l.id}/attendance`, { records: [{ studentId: s1.id, status: 'PRESENT' }] }).expect(200);
      expect((await teacher1.api.patch(`/lessons/${l.id}`, { status: 'CANCELLED' }).expect(409)).body.code).toBe('LESSON_HAS_ATTENDANCE');

      const empty = await lessonOf(teacher1.api, g1.id, daysAgo(14));
      expect((await teacher1.api.patch(`/lessons/${empty.id}`, { status: 'CANCELLED', topic: "Bayram" }).expect(200)).body.status).toBe('CANCELLED');
      expect((await teacher1.api.put(`/lessons/${empty.id}/attendance`, { records: [{ studentId: s1.id, status: 'PRESENT' }] }).expect(409)).body.code).toBe('LESSON_CANCELLED');
      await teacher1.api.patch(`/lessons/${empty.id}`, { status: 'HELD' }).expect(200);
      await teacher1.api.put(`/lessons/${empty.id}/attendance`, { records: [{ studentId: s1.id, status: 'PRESENT' }] }).expect(200);

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, empty.id));
      expect(audit.filter((x) => x.action === 'lesson.edit')).toHaveLength(2);
    });

    it("tahrirlash ruxsatlari: kassir/o'quvchi 403, begona ustoz va boshqa markaz 404", async () => {
      const l = await lessonOf(A.owner, g1.id, daysAgo(15));
      await cashier1.api.patch(`/lessons/${l.id}`, { topic: 'Hack' }).expect(403);
      await (await s1.api()).patch(`/lessons/${l.id}`, { topic: 'Hack' }).expect(403);
      await teacher2.api.patch(`/lessons/${l.id}`, { topic: 'Hack' }).expect(404);
      await B.owner.patch(`/lessons/${l.id}`, { topic: 'Hack' }).expect(404);
      await A.owner.patch(`/lessons/${NOPE}`, { topic: 'Hack' }).expect(404);
    });
  });

  describe("ko'rish va qamrov", () => {
    let g: { id: string };
    let l1: { id: string };
    let l2: { id: string };
    let own: Awaited<ReturnType<typeof mkStudent>>;
    let peer: Awaited<ReturnType<typeof mkStudent>>;
    beforeAll(async () => {
      g = await mkGroup(A, 'Korish Guruhi');
      await assign(A, g.id, teacher1.id);
      own = await mkStudent(A, 'Oz Oquvchi', A.main);
      peer = await mkStudent(A, 'Hamsinf Oquvchi', A.main);
      await enroll(A, g.id, own.id, { joinedAt: daysAgo(40) });
      await enroll(A, g.id, peer.id, { joinedAt: daysAgo(40) });
      l1 = await lessonOf(A.owner, g.id, daysAgo(20));
      l2 = await lessonOf(A.owner, g.id, daysAgo(18));
      await A.owner.put(`/lessons/${l1.id}/attendance`, { records: [{ studentId: own.id, status: 'LATE' }, { studentId: peer.id, status: 'ABSENT' }] }).expect(200);
      await A.owner.patch(`/lessons/${l2.id}`, { status: 'CANCELLED' }).expect(200);
    });

    it("rahbar, ustoz va admin (attendance.view ✔ f) ko'radi; kassir 403; begona filial admini va begona ustoz 404", async () => {
      for (const api of [A.owner, teacher1.api, admin1.api]) {
        const d = (await api.get(`/lessons/${l1.id}`).expect(200)).body;
        expect(d.roster).toHaveLength(2);
        expect(d.summary).toEqual({ present: 0, absent: 1, late: 1, excused: 0 });
      }
      await cashier1.api.get(`/lessons/${l1.id}`).expect(403);
      await cashier1.api.get(`/groups/${g.id}/lessons`).expect(403);
      await teacher2.api.get(`/lessons/${l1.id}`).expect(404);
      await teacher2.api.get(`/groups/${g.id}/lessons`).expect(404);
      const second = await lessonOf(A.owner, g2.id, daysAgo(2));
      await admin1.api.get(`/lessons/${second.id}`).expect(404); // admin filialidan tashqari
      await admin1.api.get(`/groups/${g2.id}/lessons`).expect(404);
    });

    it("o'quvchi faqat o'z qatorini va o'z holatini ko'radi; yig'ma va boshqalar yashirin; begona guruh 404", async () => {
      const api = await own.api();
      const d = (await api.get(`/lessons/${l1.id}`).expect(200)).body;
      expect(d.roster).toEqual([expect.objectContaining({ studentId: own.id, status: 'LATE' })]);
      expect(d).not.toHaveProperty('summary');
      expect(d.roster[0]).not.toHaveProperty('markedBy');
      expect(JSON.stringify(d)).not.toContain(peer.id);
      expect(JSON.stringify(d)).not.toContain('Hamsinf');

      const list = (await api.get(`/groups/${g.id}/lessons`).expect(200)).body.items as { id: string; myStatus: string | null }[];
      expect(list.map((x) => [x.id, x.myStatus])).toEqual([[l2.id, null], [l1.id, 'LATE']]); // sana bo'yicha kamayish
      expect(list[0]).not.toHaveProperty('summary');
      await api.get(`/groups/${g1.id}/lessons`).expect(404);
      await (await sOther.api()).get(`/lessons/${l1.id}`).expect(404);
    });

    it("guruh darslari ro'yxati: sana oralig'i, holat va sahifalash; boshqa markaz 404", async () => {
      const items = async (qs = '') => ((await A.owner.get(`/groups/${g.id}/lessons?${qs}`).expect(200)).body.items as { id: string }[]).map((x) => x.id);
      expect(await items()).toEqual([l2.id, l1.id]);
      expect(await items(`from=${daysAgo(19)}`)).toEqual([l2.id]);
      expect(await items(`to=${daysAgo(19)}`)).toEqual([l1.id]);
      expect(await items('status=CANCELLED')).toEqual([l2.id]);
      expect(await items('limit=1&offset=1')).toEqual([l1.id]);
      await A.owner.get(`/groups/${g.id}/lessons?status=BAD`).expect(400);
      await A.owner.get(`/groups/${g.id}/lessons?from=bad`).expect(400);
      await B.owner.get(`/groups/${g.id}/lessons`).expect(404);
      await B.owner.get(`/lessons/${l1.id}`).expect(404);
      await A.owner.get(`/lessons/${NOPE}`).expect(404);
      await A.owner.get('/lessons/not-a-uuid').expect(400);
      await httpFn().get(`/lessons/${l1.id}`).expect(401);
    });

    it("ustoz guruhdan olib tashlangach davomatni ko'ra va belgilay olmaydi", async () => {
      const gx = await mkGroup(A, 'Ustoz Chiqadi');
      const t = await staff(A, 'TEACHER', 'Vaqtincha Ustoz', [A.main]);
      await A.owner.post(`/groups/${gx.id}/teachers`, { teacherId: t.id, fromDate: daysAgo(10) }).expect(200);
      const l = await lessonOf(t.api, gx.id, daysAgo(3));
      await t.api.get(`/lessons/${l.id}`).expect(200);
      await A.owner.post(`/groups/${gx.id}/teachers/${t.id}/end`, { toDate: daysAgo(1) }).expect(200);
      await t.api.get(`/lessons/${l.id}`).expect(404);
      await t.api.put(`/lessons/${l.id}/attendance`, { records: [{ studentId: s1.id, status: 'PRESENT' }] }).expect(404);
    });
  });
});
