// 12-qadam: davomat qulfi (attendance_lock_days, attendance.edit_past) va davomatni ko'rish/yig'ma. PGlite, RLS yoqilgan.
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

describe('Davomat qulfi va ko\'rish (PGlite, RLS yoqilgan)', () => {
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
  const mkGroup = async (c: Center, name: string, extra: object = {}) =>
    (await c.owner.post('/groups', { name, courseId: c.course, branchId: c.main, ...extra }).expect(201)).body as { id: string };
  const enroll = async (c: Center, groupId: string, studentId: string) =>
    (await c.owner.post('/enrollments', { groupId, studentId, joinedAt: daysAgo(100) }).expect(201)).body.id as string;
  const assign = (c: Center, groupId: string, teacherId: string) =>
    c.owner.post(`/groups/${groupId}/teachers`, { teacherId, kind: 'MAIN', fromDate: daysAgo(100) }).expect(200);
  const lessonOf = async (api: Api, groupId: string, lessonDate: string) =>
    (await api.post(`/groups/${groupId}/lessons`, { lessonDate }).expect(201)).body as { id: string; locked: boolean };
  const setSettings = (centerId: string, patch: object) =>
    db.execute(sql`update centers set settings = settings || ${JSON.stringify(patch)}::jsonb where id = ${centerId}`);
  const actions = async (entityId: string) => (await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, entityId))).map((x) => x.action);

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
  });

  afterAll(async () => {
    await app?.close();
    await pg?.close();
  });

  describe('qulf', () => {
    let C: Center;
    let teacher: Awaited<ReturnType<typeof staff>>;
    let admin: Awaited<ReturnType<typeof staff>>;
    let cashier: Awaited<ReturnType<typeof staff>>;
    let st: Awaited<ReturnType<typeof mkStudent>>;
    let g: { id: string };
    beforeAll(async () => {
      C = await newCenter('Qulf Markazi');
      teacher = await staff(C, 'TEACHER', 'Qulf Ustozi', [C.main]);
      admin = await staff(C, 'ADMIN', 'Qulf Admini', [C.main]);
      cashier = await staff(C, 'CASHIER', 'Qulf Kassiri', [C.main]);
      st = await mkStudent(C, 'Qulf Oquvchisi', C.main);
      g = await mkGroup(C, 'Qulf Guruhi');
      await assign(C, g.id, teacher.id);
      await enroll(C, g.id, st.id);
    });
    const body = (status = 'PRESENT') => ({ records: [{ studentId: st.id, status }] });

    it("sukut 3 kun: chegaradagi dars ochiq, undan eskisi qulflangan; ustoz tuzatadi (qulfgacha) va audit oddiy amal bilan", async () => {
      const edge = await lessonOf(teacher.api, g.id, daysAgo(3));
      expect(edge.locked).toBe(false);
      expect((await teacher.api.put(`/lessons/${edge.id}/attendance`, body()).expect(200)).body).toMatchObject({ locked: false });
      expect(await actions(edge.id)).toEqual(expect.arrayContaining(['lesson.create', 'attendance.mark']));

      const today = await lessonOf(teacher.api, g.id, TODAY);
      expect(today.locked).toBe(false);
      await teacher.api.patch(`/lessons/${today.id}`, { topic: 'Bugungi mavzu' }).expect(200);
    });

    it("eski sanaga dars ochish ham qulflangan: ustoz va admin (○ yoqilmagan) 403, rahbar ochadi", async () => {
      const old = daysAgo(4);
      expect((await teacher.api.post(`/groups/${g.id}/lessons`, { lessonDate: old }).expect(403)).body.code).toBe('LESSON_LOCKED');
      await admin.api.post(`/groups/${g.id}/lessons`, { lessonDate: old }).expect(403); // attendance.mark ham ○, admin uchun yopiq
      const l = await lessonOf(C.owner, g.id, old);
      expect(l.locked).toBe(true);
    });

    it("qulflangan darsni ustoz belgilay va o'zgartira olmaydi; rahbar tuzatadi va 'attendance.edit_past' auditga yoziladi", async () => {
      const l = await lessonOf(C.owner, g.id, daysAgo(10));
      expect((await teacher.api.put(`/lessons/${l.id}/attendance`, body()).expect(403)).body.code).toBe('LESSON_LOCKED');
      expect((await teacher.api.patch(`/lessons/${l.id}`, { topic: 'Hack' }).expect(403)).body.code).toBe('LESSON_LOCKED');
      await cashier.api.put(`/lessons/${l.id}/attendance`, body()).expect(403);
      await (await st.api()).put(`/lessons/${l.id}/attendance`, body()).expect(403);

      const first = (await C.owner.put(`/lessons/${l.id}/attendance`, body('ABSENT')).expect(200)).body;
      expect(first).toMatchObject({ locked: true, summary: { absent: 1 } });
      await C.owner.put(`/lessons/${l.id}/attendance`, body('EXCUSED')).expect(200);
      await C.owner.patch(`/lessons/${l.id}`, { topic: 'Tuzatilgan mavzu' }).expect(200);

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, l.id));
      const edits = audit.filter((x) => x.action === 'attendance.edit_past');
      expect(edits).toHaveLength(2);
      expect(edits[1]!.before).toMatchObject({ records: { [st.id]: { status: 'ABSENT' } } });
      expect(edits[1]!.after).toMatchObject({ records: { [st.id]: { status: 'EXCUSED' } } });
      expect(audit.map((x) => x.action)).toContain('lesson.edit_past');
      expect(audit.map((x) => x.action)).not.toContain('attendance.mark'); // qulflangan tuzatish oddiy belgilash deb yozilmaydi
    });

    it("admin uchun attendance.edit_past (○) yoqilsa tuzatadi (faqat o'z filialida); mark ham kerak", async () => {
      const l = await lessonOf(C.owner, g.id, daysAgo(11));
      await admin.api.put(`/lessons/${l.id}/attendance`, body()).expect(403);
      await C.owner.put('/permissions/roles/ADMIN', { permissions: { 'attendance.edit_past': true } }).expect(200);
      await admin.api.put(`/lessons/${l.id}/attendance`, body()).expect(403); // attendance.mark yo'q (○)
      await C.owner.put('/permissions/roles/ADMIN', { permissions: { 'attendance.mark': true } }).expect(200);
      expect((await admin.api.put(`/lessons/${l.id}/attendance`, body('LATE')).expect(200)).body.summary).toMatchObject({ late: 1 });
      expect(await actions(l.id)).toContain('attendance.edit_past');
      await admin.api.post(`/groups/${g.id}/lessons`, { lessonDate: daysAgo(12) }).expect(201); // endi eski sanaga ham ochadi
      await C.owner.put('/permissions/roles/ADMIN', { permissions: { 'attendance.mark': false, 'attendance.edit_past': false } }).expect(200);
    });

    it("qo'lda qo'yilgan locked_at yangi darsni ham qulflaydi; qulf holati o'quvchiga ham ko'rinadi", async () => {
      const l = await lessonOf(teacher.api, g.id, daysAgo(1));
      await teacher.api.put(`/lessons/${l.id}/attendance`, body()).expect(200);
      await db.update(s.lessons).set({ lockedAt: new Date() }).where(eq(s.lessons.id, l.id));
      expect((await teacher.api.put(`/lessons/${l.id}/attendance`, body('ABSENT')).expect(403)).body.code).toBe('LESSON_LOCKED');
      const seen = (await (await st.api()).get(`/lessons/${l.id}`).expect(200)).body;
      expect(seen).toMatchObject({ locked: true });
      expect(seen.lockedAt).not.toBeNull();
    });

    it("markaz sozlamasi attendance_lock_days: 0 bo'lsa faqat bugun ochiq; noto'g'ri qiymat sukutga qaytadi", async () => {
      const c2 = await newCenter('Qulf Nol');
      const t2 = await staff(c2, 'TEACHER', 'Nol Ustozi', [c2.main]);
      const g2 = await mkGroup(c2, 'Nol Guruhi');
      await assign(c2, g2.id, t2.id);
      await setSettings(c2.centerId, { attendance_lock_days: 0 });
      expect((await lessonOf(t2.api, g2.id, TODAY)).locked).toBe(false);
      await t2.api.post(`/groups/${g2.id}/lessons`, { lessonDate: daysAgo(1) }).expect(403);

      await setSettings(c2.centerId, { attendance_lock_days: 10 });
      expect((await lessonOf(t2.api, g2.id, daysAgo(10))).locked).toBe(false);
      await t2.api.post(`/groups/${g2.id}/lessons`, { lessonDate: daysAgo(11) }).expect(403);

      await setSettings(c2.centerId, { attendance_lock_days: 'ko\'p' }); // yaroqsiz: sukut (3)
      expect((await lessonOf(t2.api, g2.id, daysAgo(3))).locked).toBe(false);
      await t2.api.post(`/groups/${g2.id}/lessons`, { lessonDate: daysAgo(5) }).expect(403);
    });

    it("ro'yxatda har dars uchun locked bor", async () => {
      const items = (await teacher.api.get(`/groups/${g.id}/lessons?limit=200`).expect(200)).body.items as { lessonDate: string; locked: boolean }[];
      expect(items.length).toBeGreaterThan(3);
      // daysAgo(1) darsi oldingi testda qo'lda qulflangan (locked_at)
      for (const l of items) expect(l.locked).toBe(l.lessonDate < daysAgo(3) || l.lessonDate === daysAgo(1));
    });
  });

  describe("davomatni ko'rish va yig'ma", () => {
    let D: Center;
    let other: Center;
    let admin: Awaited<ReturnType<typeof staff>>;
    let cashier: Awaited<ReturnType<typeof staff>>;
    let teacher: Awaited<ReturnType<typeof staff>>;
    let teacher2: Awaited<ReturnType<typeof staff>>;
    let a: Awaited<ReturnType<typeof mkStudent>>;
    let b: Awaited<ReturnType<typeof mkStudent>>;
    let c: Awaited<ReturnType<typeof mkStudent>>;
    let g: { id: string };
    let g2: { id: string };
    let l1: string;
    let l3: string;

    beforeAll(async () => {
      D = await newCenter('Korish Markazi');
      other = await newCenter('Korish Begona');
      await setSettings(D.centerId, { attendance_lock_days: 365 });
      admin = await staff(D, 'ADMIN', 'Korish Admini', [D.main]);
      cashier = await staff(D, 'CASHIER', 'Korish Kassiri', [D.main]);
      teacher = await staff(D, 'TEACHER', 'Korish Ustozi', [D.main]);
      teacher2 = await staff(D, 'TEACHER', 'Korish Ustozi 2', [D.second]);
      a = await mkStudent(D, 'Aziz A', D.main);
      b = await mkStudent(D, 'Bahrom B', D.main);
      c = await mkStudent(D, 'Cobir C', D.main);
      g = await mkGroup(D, 'Korish Guruhi');
      g2 = await mkGroup(D, 'Korish Ikkinchi', { branchId: D.second });
      await assign(D, g.id, teacher.id);
      await assign(D, g2.id, teacher2.id);
      for (const st of [a, b, c]) await enroll(D, g.id, st.id);
      const other2 = await mkStudent(D, 'Dilnoza D', D.second);
      await enroll(D, g2.id, other2.id);

      const mark = async (date: string, rows: [typeof a, string][]) => {
        const l = await lessonOf(D.owner, g.id, date);
        await D.owner.put(`/lessons/${l.id}/attendance`, { records: rows.map(([st, status]) => ({ studentId: st.id, status })) }).expect(200);
        return l.id;
      };
      l1 = await mark(daysAgo(9), [[a, 'PRESENT'], [b, 'ABSENT'], [c, 'LATE']]);
      await mark(daysAgo(8), [[a, 'PRESENT'], [b, 'EXCUSED'], [c, 'ABSENT']]);
      l3 = await mark(daysAgo(7), [[a, 'ABSENT'], [b, 'PRESENT'], [c, 'PRESENT']]);
      const lo = await lessonOf(D.owner, g2.id, daysAgo(5));
      await D.owner.put(`/lessons/${lo.id}/attendance`, { records: [{ studentId: other2.id, status: 'PRESENT' }] }).expect(200);
    });
    type Row = { lessonId: string; lessonDate: string; groupName: string; studentName: string; status: string };
    const rows = async (api: Api, qs = '') => (await api.get(`/attendance?limit=500${qs}`).expect(200)).body.items as Row[];

    it("rahbar guruh bo'yicha yozuvlarni sana (kamayish) va ism tartibida oladi", async () => {
      const items = await rows(D.owner, `&groupId=${g.id}`);
      expect(items).toHaveLength(9);
      const dates = items.map((r) => r.lessonDate);
      expect(dates).toEqual(dates.toSorted().toReversed());
      expect(items.slice(0, 3).map((r) => [r.studentName, r.status])).toEqual([['Aziz A', 'ABSENT'], ['Bahrom B', 'PRESENT'], ['Cobir C', 'PRESENT']]);
      expect(items[0]).toMatchObject({ groupName: 'Korish Guruhi', lessonId: l3 });
    });

    it("filtrlar: o'quvchi, holat, sana oralig'i, sahifalash; noto'g'ri qiymat 400", async () => {
      expect((await rows(D.owner, `&groupId=${g.id}&studentId=${a.id}`)).map((r) => r.status)).toEqual(['ABSENT', 'PRESENT', 'PRESENT']);
      expect(await rows(D.owner, `&groupId=${g.id}&status=LATE`)).toHaveLength(1);
      expect(await rows(D.owner, `&groupId=${g.id}&from=${daysAgo(8)}&to=${daysAgo(8)}`)).toHaveLength(3);
      expect(await rows(D.owner, `&groupId=${g.id}&from=${daysAgo(1)}`)).toEqual([]);
      expect((await D.owner.get(`/attendance?groupId=${g.id}&limit=2&offset=1`).expect(200)).body.items).toHaveLength(2);
      await D.owner.get('/attendance?status=BAD').expect(400);
      await D.owner.get('/attendance?groupId=nope').expect(400);
      await D.owner.get('/attendance?from=bad').expect(400);
      await D.owner.get('/attendance?limit=0').expect(400);
      await httpFn().get('/attendance').expect(401);
    });

    it("qamrov: admin o'z filiali, ustoz o'z guruhi; boshqa guruh bo'sh; kassir 403; boshqa markaz hech narsa ko'rmaydi", async () => {
      const adminRows = await rows(admin.api);
      expect(new Set(adminRows.map((r) => r.groupName))).toEqual(new Set(['Korish Guruhi']));
      expect(await rows(admin.api, `&groupId=${g2.id}`)).toEqual([]);
      expect(new Set((await rows(teacher.api)).map((r) => r.groupName))).toEqual(new Set(['Korish Guruhi']));
      expect(await rows(teacher.api, `&groupId=${g2.id}`)).toEqual([]);
      expect(new Set((await rows(teacher2.api)).map((r) => r.groupName))).toEqual(new Set(['Korish Ikkinchi']));
      expect(new Set((await rows(D.owner)).map((r) => r.groupName))).toEqual(new Set(['Korish Guruhi', 'Korish Ikkinchi']));
      await cashier.api.get('/attendance').expect(403);
      await cashier.api.get('/attendance/summary').expect(403);
      expect(await rows(other.owner)).toEqual([]);
      expect(await rows(other.owner, `&groupId=${g.id}`)).toEqual([]);
    });

    it("o'quvchi faqat o'z yozuvlarini ko'radi (boshqa o'quvchi filtri e'tiborsiz)", async () => {
      const api = await a.api();
      const mine = await rows(api);
      expect(mine).toHaveLength(3);
      expect(new Set(mine.map((r) => r.studentName))).toEqual(new Set(['Aziz A']));
      const spoof = await rows(api, `&studentId=${b.id}`);
      expect(new Set(spoof.map((r) => r.studentName))).toEqual(new Set(['Aziz A']));
      expect(JSON.stringify(mine)).not.toContain('Bahrom');
    });

    it("yig'ma (guruh): jami va o'quvchilar kesimi; rate = (kelgan+kech)/(kelgan+kech+kelmagan), sababli hisobga olinmaydi", async () => {
      const r = (await D.owner.get(`/attendance/summary?groupId=${g.id}`).expect(200)).body;
      expect(r.totals).toEqual({ present: 4, absent: 3, late: 1, excused: 1, total: 9, rate: 62.5 });
      expect(r.byStudent).toEqual([
        expect.objectContaining({ fullName: 'Aziz A', present: 2, absent: 1, late: 0, excused: 0, total: 3, rate: 66.7 }),
        expect.objectContaining({ fullName: 'Bahrom B', present: 1, absent: 1, late: 0, excused: 1, total: 3, rate: 50 }),
        expect.objectContaining({ fullName: 'Cobir C', present: 1, absent: 1, late: 1, excused: 0, total: 3, rate: 66.7 }),
      ]);
      expect(r).not.toHaveProperty('byGroup');
      const ranged = (await D.owner.get(`/attendance/summary?groupId=${g.id}&from=${daysAgo(8)}&to=${daysAgo(8)}`).expect(200)).body;
      expect(ranged.totals).toMatchObject({ present: 1, absent: 1, excused: 1, total: 3, rate: 50 });
    });

    it("yig'ma (guruhsiz): guruhlar kesimida; bo'sh to'plamda rate null; qamrov va o'quvchi cheklovi", async () => {
      const all = (await D.owner.get('/attendance/summary').expect(200)).body;
      expect(all.byGroup.map((x: { groupName: string }) => x.groupName)).toEqual(['Korish Guruhi', 'Korish Ikkinchi']);
      expect(all.totals.total).toBe(10);
      expect(all).not.toHaveProperty('byStudent');

      const empty = (await D.owner.get(`/attendance/summary?groupId=${g.id}&from=${daysAgo(1)}`).expect(200)).body;
      expect(empty.totals).toEqual({ present: 0, absent: 0, late: 0, excused: 0, total: 0, rate: null });
      expect(empty.byStudent).toEqual([]);

      const adminSum = (await admin.api.get('/attendance/summary').expect(200)).body;
      expect(adminSum.byGroup.map((x: { groupName: string }) => x.groupName)).toEqual(['Korish Guruhi']);
      expect((await teacher2.api.get(`/attendance/summary?groupId=${g.id}`).expect(200)).body.totals.total).toBe(0); // begona guruh

      const mine = (await (await a.api()).get('/attendance/summary').expect(200)).body;
      expect(mine.totals).toEqual({ present: 2, absent: 1, late: 0, excused: 0, total: 3, rate: 66.7 });
      expect(mine.byGroup).toEqual([expect.objectContaining({ groupName: 'Korish Guruhi', total: 3 })]);
      const spoof = (await (await a.api()).get(`/attendance/summary?groupId=${g.id}`).expect(200)).body;
      expect(spoof).not.toHaveProperty('byStudent'); // o'quvchi boshqalarning kesimini ko'rmaydi
      expect(spoof.totals.total).toBe(3);

      expect((await other.owner.get('/attendance/summary').expect(200)).body.totals.total).toBe(0);
      await D.owner.get('/attendance/summary?status=BAD').expect(400);
    });

    it("dars ro'yxati va yozuvlar mos: bir darsning yozuvlari /lessons/:id bilan bir xil", async () => {
      const detail = (await D.owner.get(`/lessons/${l1}`).expect(200)).body.roster as { studentId: string; status: string }[];
      const list = (await D.owner.get(`/attendance?groupId=${g.id}&from=${daysAgo(9)}&to=${daysAgo(9)}`).expect(200)).body.items as { studentName: string; status: string }[];
      expect(list.map((r) => r.status).sort()).toEqual(detail.map((r) => r.status).sort());
    });
  });
});
