// Skelet keyingi bosqichi, 8-qadam: o'quvchilar (PGlite, RLS yoqilgan).
import { PERMISSIONS } from '@erp/shared';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
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
const TEMP_RE = /^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/;
const NOPE = '00000000-0000-4000-8000-000000000000';

describe("O'quvchilar (PGlite, RLS yoqilgan)", () => {
  let app: INestApplication;
  let db: Awaited<ReturnType<typeof createTestDb>>['db'];
  let pg: Awaited<ReturnType<typeof createTestDb>>['pg'];
  let rootToken: string;
  const http = () => request(app.getHttpServer());
  const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });
  const login = (l: string, p: string) => http().post('/auth/login').send({ login: l, password: p });
  const as = (t: string) => ({
    get: (p: string) => http().get(p).set(bearer(t)),
    post: (p: string, b: object = {}) => http().post(p).set(bearer(t)).send(b),
    patch: (p: string, b: object) => http().patch(p).set(bearer(t)).send(b),
    put: (p: string, b: object) => http().put(p).set(bearer(t)).send(b),
  });

  async function activate(l: string, temp: string) {
    const first = (await login(l, temp).expect(200)).body;
    await http().post('/auth/change-password').set(bearer(first.accessToken)).send({ currentPassword: temp, newPassword: PW }).expect(204);
    return (await login(l, PW).expect(200)).body.accessToken as string;
  }
  interface Center {
    centerId: string;
    owner: ReturnType<typeof as>;
    main: string;
  }
  async function newCenter(name: string, planId?: string): Promise<Center> {
    const res = await as(rootToken).post('/admin/centers', { name, ownerFullName: 'Rahbar', planId }).expect(201);
    const token = await activate(res.body.owner.login, res.body.owner.temporaryPassword);
    return { centerId: res.body.center.id, owner: as(token), main: res.body.branch.id };
  }
  async function staff(c: Center, role: 'ADMIN' | 'CASHIER' | 'TEACHER', branchIds: string[]) {
    const res = await c.owner.post('/staff', { role, fullName: `${role} Xodim`, branchIds }).expect(201);
    return { id: res.body.user.id as string, api: as(await activate(res.body.user.login, res.body.temporaryPassword)) };
  }
  async function student(c: Center, fullName: string, branchId: string, extra: object = {}) {
    const res = await c.owner.post('/students', { fullName, branchId, ...extra }).expect(201);
    return { id: res.body.student.id as string, login: res.body.student.login as string, temp: res.body.temporaryPassword as string };
  }

  let A: Center;
  let B: Center;
  let a2: string;
  let admin1: Awaited<ReturnType<typeof staff>>; // faqat Asosiy filial
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
    rootToken = (await login('root', ROOT_PW).expect(200)).body.accessToken;

    A = await newCenter("Oquvchi Markazi A");
    B = await newCenter("Oquvchi Markazi B");
    a2 = (await A.owner.post('/branches', { name: 'Ikkinchi filial' }).expect(201)).body.id;
    admin1 = await staff(A, 'ADMIN', [A.main]);
    cashier1 = await staff(A, 'CASHIER', [A.main]);
    teacher1 = await staff(A, 'TEACHER', [A.main]);
  });

  afterAll(async () => {
    await app?.close();
    await pg?.close();
  });

  describe('yaratish', () => {
    it("rahbar o'quvchi yaratadi: profil, filial, vaqtinchalik parol bir marta, majburiy almashtirish, parol auditda yo'q", async () => {
      const res = await A.owner
        .post('/students', { fullName: 'Aziz Karimov', branchId: A.main, phone: '+998 90 111 11 11', birthDate: '2012-05-17', parentName: 'Karim', parentPhone: '+998 91 222 22 22', note: 'Yangi' })
        .expect(201);
      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.body.temporaryPassword).toMatch(TEMP_RE);
      expect(res.body.student).toMatchObject({ fullName: 'Aziz Karimov', status: 'ACTIVE', branchIds: [A.main], birthDate: '2012-05-17', parentName: 'Karim', parentPhone: '+998 91 222 22 22', note: 'Yangi' });
      expect(res.body.student.login).toMatch(/^oquvchi-markazi-a\.aziz/);
      expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);

      const first = (await login(res.body.student.login, res.body.temporaryPassword).expect(200)).body;
      expect(first.mustChangePassword).toBe(true);
      const [profile] = await db.select().from(s.studentProfiles).where(eq(s.studentProfiles.userId, res.body.student.id));
      expect(profile).toMatchObject({ centerId: A.centerId, parentName: 'Karim' });

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, res.body.student.id));
      expect(audit.map((x) => x.action)).toContain('student.create');
      expect(JSON.stringify(audit)).not.toContain(res.body.temporaryPassword);
    });

    it("login band bo'lsa raqam qo'shiladi; berilgan login band bo'lsa 409", async () => {
      const a = await student(A, 'Dilshod Bir', A.main);
      const b = await student(A, 'Dilshod Ikki', A.main);
      expect(b.login).toBe(`${a.login}2`);
      expect((await A.owner.post('/students', { fullName: 'Yana', branchId: A.main, login: a.login }).expect(409)).body.code).toBe('LOGIN_TAKEN');
    });

    it("noto'g'ri kiritish 400; noma'lum, arxivlangan va boshqa markaz filiali 404", async () => {
      await A.owner.post('/students', { fullName: 'x', branchId: A.main }).expect(400);
      await A.owner.post('/students', { fullName: 'Yaxshi Ism' }).expect(400);
      await A.owner.post('/students', { fullName: 'Yaxshi Ism', branchId: A.main, birthDate: '2999-01-01' }).expect(400);
      await A.owner.post('/students', { fullName: 'Yaxshi Ism', branchId: A.main, birthDate: '17.05.2012' }).expect(400);
      await A.owner.post('/students', { fullName: 'Yaxshi Ism', branchId: A.main, parentPhone: 'abc' }).expect(400);
      await A.owner.post('/students', { fullName: 'Yaxshi Ism', branchId: NOPE }).expect(404);
      await A.owner.post('/students', { fullName: 'Yaxshi Ism', branchId: B.main }).expect(404);
      const tmp = (await A.owner.post('/branches', { name: 'Yopiladigan' }).expect(201)).body.id as string;
      await A.owner.post(`/branches/${tmp}/archive`).expect(200);
      await A.owner.post('/students', { fullName: 'Yaxshi Ism', branchId: tmp }).expect(404);
    });

    it("admin faqat o'z filialida yaratadi; kassir, ustoz va tokensiz rad etiladi", async () => {
      await admin1.api.post('/students', { fullName: 'Admin Yaratgan', branchId: A.main }).expect(201);
      await admin1.api.post('/students', { fullName: 'Begona Filial', branchId: a2 }).expect(403);
      await cashier1.api.post('/students', { fullName: 'Kassir Yaratdi', branchId: A.main }).expect(403);
      await teacher1.api.post('/students', { fullName: 'Ustoz Yaratdi', branchId: A.main }).expect(403);
      await http().post('/students').send({}).expect(401);
    });

    it("tarif limiti (max_students) faol o'quvchilarga qo'llanadi; arxivlash joy bo'shatadi", async () => {
      const [plan] = await db.insert(s.plans).values({ name: 'Kichik o\'quvchi', maxStudents: 2 }).returning();
      const c = await newCenter('Limit Oquvchi', plan!.id);
      const one = await student(c, 'Birinchi Oquvchi', c.main);
      await student(c, 'Ikkinchi Oquvchi', c.main);
      expect((await c.owner.post('/students', { fullName: 'Uchinchi Oquvchi', branchId: c.main }).expect(403)).body.code).toBe('PLAN_STUDENT_LIMIT');

      await c.owner.post(`/students/${one.id}/archive`).expect(200);
      const third = await student(c, 'Uchinchi Oquvchi', c.main);
      expect((await c.owner.post(`/students/${one.id}/unarchive`).expect(403)).body.code).toBe('PLAN_STUDENT_LIMIT');
      expect(third.id).toBeDefined();
    });
  });

  describe("ro'yxat, qidiruv va qamrov", () => {
    let s1: string; // Asosiy filial
    let s2: string; // 2-filial
    beforeAll(async () => {
      s1 = (await student(A, 'Qidiruv Sherzod', A.main, { phone: '+998 93 555 66 77' })).id;
      s2 = (await student(A, 'Qidiruv Madina', a2)).id;
    });

    it("rahbar hammasini, admin va kassir faqat o'z filialidagi o'quvchilarni ko'radi", async () => {
      const ids = async (api: ReturnType<typeof as>, qs = '') => ((await api.get(`/students?limit=200${qs}`).expect(200)).body.items as { id: string }[]).map((x) => x.id);
      const owner = await ids(A.owner);
      expect(owner).toEqual(expect.arrayContaining([s1, s2]));
      for (const api of [admin1.api, cashier1.api]) {
        const seen = await ids(api);
        expect(seen).toContain(s1);
        expect(seen).not.toContain(s2);
      }
      expect(await ids(admin1.api, `&branchId=${a2}`)).toEqual([]);
      expect(await ids(A.owner, `&branchId=${a2}`)).toContain(s2);
      expect(await ids(A.owner, `&branchId=${a2}`)).not.toContain(s1);
    });

    it("qidiruv ism, login va telefon bo'yicha; maxsus belgilar xavfsiz; filtr va sahifalash", async () => {
      const names = async (qs: string) => ((await A.owner.get(`/students?${qs}`).expect(200)).body.items as { fullName: string }[]).map((x) => x.fullName);
      expect(await names('q=sherzod')).toEqual(['Qidiruv Sherzod']);
      expect(await names(`q=${encodeURIComponent('555 66')}`)).toEqual(['Qidiruv Sherzod']);
      expect(await names('q=qidiruv&limit=1')).toHaveLength(1);
      expect((await names('q=qidiruv&limit=1&offset=1'))[0]).not.toBe((await names('q=qidiruv&limit=1'))[0]);
      expect(await names(`q=${encodeURIComponent('%')}`)).toEqual([]); // LIKE belgisi literal
      expect(await names(`q=${encodeURIComponent("'; drop table users;--")}`)).toEqual([]);
      expect((await A.owner.get('/students?status=ARCHIVED').expect(200)).body.items.every((x: { status: string }) => x.status === 'ARCHIVED')).toBe(true);
      await A.owner.get('/students?status=BAD').expect(400);
      await A.owner.get('/students?limit=0').expect(400);
    });

    it("ro'yxatda faqat o'quvchilar chiqadi (xodimlar emas), parol xeshi yo'q", async () => {
      const items = (await A.owner.get('/students?limit=200').expect(200)).body.items as { id: string }[];
      expect(items.map((x) => x.id)).not.toContain(admin1.id);
      expect(JSON.stringify(items)).not.toMatch(/passwordHash|password_hash|argon2/);
    });

    it("ko'rish: qamrovdagi 200, qamrovdan tashqari va boshqa markaz 404, xodim id'si 404", async () => {
      await admin1.api.get(`/students/${s1}`).expect(200);
      await admin1.api.get(`/students/${s2}`).expect(404);
      await B.owner.get(`/students/${s1}`).expect(404);
      await A.owner.get(`/students/${admin1.id}`).expect(404);
      await A.owner.get(`/students/${NOPE}`).expect(404);
      await A.owner.get('/students/not-a-uuid').expect(400);
      await teacher1.api.get('/students').expect(403); // ustoz: yozilish moduli kelguncha yo'q
    });

    it("boshqa markaz ro'yxatda ko'rinmaydi", async () => {
      const bItems = (await B.owner.get('/students?limit=200').expect(200)).body.items as { id: string }[];
      expect(bItems.map((x) => x.id)).not.toContain(s1);
    });
  });

  describe("o'quvchi o'zi", () => {
    it("faqat o'z yozuvini ko'radi, ro'yxat va boshqalarni ko'ra olmaydi, hech narsa o'zgartira olmaydi", async () => {
      const a = await student(A, 'Oz Yozuv', A.main);
      const b = await student(A, 'Boshqa Oquvchi', A.main);
      const token = await activate(a.login, a.temp);
      const me = as(token);
      expect((await me.get(`/students/${a.id}`).expect(200)).body.fullName).toBe('Oz Yozuv');
      await me.get(`/students/${b.id}`).expect(404);
      await me.get('/students').expect(403);
      await me.patch(`/students/${a.id}`, { fullName: 'Hack Hack' }).expect(403);
      await me.post(`/students/${a.id}/archive`).expect(403);
      await me.post('/students', { fullName: 'Hack Hack', branchId: A.main }).expect(403);
    });
  });

  describe('tahrirlash', () => {
    it("nom, telefon va profil o'zgaradi (null tozalaydi); admin faqat o'z qamrovida; audit before/after", async () => {
      const st = await student(A, 'Tahrir Oquvchi', A.main, { parentName: 'Ota', note: 'Eski' });
      const upd = (await admin1.api.patch(`/students/${st.id}`, { fullName: 'Yangi Nom', phone: '+998 90 000 00 01', parentName: null, note: 'Yangi izoh' }).expect(200)).body;
      expect(upd).toMatchObject({ fullName: 'Yangi Nom', phone: '+998 90 000 00 01', parentName: null, note: 'Yangi izoh' });
      await A.owner.patch(`/students/${st.id}`, {}).expect(400);
      await A.owner.patch(`/students/${st.id}`, { status: 'ARCHIVED' }).expect(400); // holat bu yerda o'zgarmaydi (noma'lum maydon rad)

      const other = await student(A, 'Boshqa Filial', a2);
      await admin1.api.patch(`/students/${other.id}`, { fullName: 'Hack Hack' }).expect(404);
      await cashier1.api.patch(`/students/${st.id}`, { fullName: 'Hack Hack' }).expect(403);
      await B.owner.patch(`/students/${st.id}`, { fullName: 'Hack Hack' }).expect(404);

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, st.id));
      const edit = audit.find((x) => x.action === 'student.edit')!;
      expect(edit.before).toMatchObject({ fullName: 'Tahrir Oquvchi', parentName: 'Ota' });
      expect(edit.after).toMatchObject({ fullName: 'Yangi Nom', parentName: null });
    });
  });

  describe('arxivlash', () => {
    it("arxivlangan o'quvchi kira olmaydi, sessiyasi yopiladi; faqat rahbar (admin uchun ○ sukutda yo'q); qayta tiklash mumkin", async () => {
      const st = await student(A, 'Arxiv Oquvchi', A.main);
      const me = as(await activate(st.login, st.temp));
      await me.get(`/students/${st.id}`).expect(200);

      await admin1.api.post(`/students/${st.id}/archive`).expect(403); // student.archive admin uchun ○
      await cashier1.api.post(`/students/${st.id}/archive`).expect(403);
      await B.owner.post(`/students/${st.id}/archive`).expect(404);

      expect((await A.owner.post(`/students/${st.id}/archive`).expect(200)).body.status).toBe('ARCHIVED');
      await A.owner.post(`/students/${st.id}/archive`).expect(409);
      expect((await me.get(`/students/${st.id}`).expect(401)).body.code).toBe('SESSION_INVALID');
      await login(st.login, PW).expect(403);
      expect((await A.owner.get('/students?status=ARCHIVED&limit=200').expect(200)).body.items.map((x: { id: string }) => x.id)).toContain(st.id);

      await A.owner.post(`/students/${st.id}/unarchive`).expect(200);
      await A.owner.post(`/students/${st.id}/unarchive`).expect(409);
      await login(st.login, PW).expect(200);

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, st.id));
      expect(audit.map((x) => x.action)).toEqual(expect.arrayContaining(['student.create', 'student.archive', 'student.unarchive']));
    });

    it("rahbar ○ ni yoqsa admin ham arxivlaydi (faqat o'z filialida)", async () => {
      const c = await newCenter('Arxiv Ruxsati');
      const adm = await staff(c, 'ADMIN', [c.main]);
      const st = await student(c, 'Ruxsatli Arxiv', c.main);
      await adm.api.post(`/students/${st.id}/archive`).expect(403);
      await c.owner.put('/permissions/roles/ADMIN', { permissions: { 'student.archive': true } }).expect(200);
      await adm.api.post(`/students/${st.id}/archive`).expect(200);
    });
  });

  describe("parolni tiklash (6-qadam cheklovi bartaraf)", () => {
    it("admin o'z filialidagi o'quvchi parolini tiklaydi; boshqa filial o'quvchisini tiklay olmaydi", async () => {
      const mine = await student(A, 'Tiklanadigan Oquvchi', A.main);
      const other = await student(A, 'Begona Oquvchi', a2);
      const res = await admin1.api.post(`/users/${mine.id}/reset-password`).expect(200);
      expect(res.body.user.role).toBe('STUDENT');
      expect((await login(mine.login, res.body.temporaryPassword).expect(200)).body.mustChangePassword).toBe(true);
      await admin1.api.post(`/users/${other.id}/reset-password`).expect(404);
      await cashier1.api.post(`/users/${mine.id}/reset-password`).expect(403);
    });
  });
});
