// Rahbar: filial, xodim, parolni tiklash va ruxsatlarni sozlash (Skelet 6-qadam). PGlite, RLS yoqilgan.
import { PERMISSIONS } from '@erp/shared';
import { Controller, Get, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { RequirePermission } from '../src/auth/decorators.js';
import { hashPassword } from '../src/auth/password.js';
import { APP_CONFIG, type AppConfig } from '../src/config/app-config.js';
import { DB, DB_OPTIONS } from '../src/db/db.service.js';
import * as s from '../src/db/schema.js';
import { createTestDb } from './helpers/test-db.js';

@Controller('t')
class ProbeController {
  @RequirePermission('payment.reverse') @Get('pay-reverse') payReverse() { return { ok: true }; }
  @RequirePermission('payroll.pay') @Get('payroll-pay') payrollPay() { return { ok: true }; }
  @RequirePermission('payment.create') @Get('pay-create') payCreate() { return { ok: true }; }
}

const config: AppConfig = {
  databaseUrl: 'unused',
  port: 0,
  accessSecret: 'test-access-secret-0123456789',
  refreshSecret: 'test-refresh-secret-0123456789',
  accessTtlSeconds: 900,
  refreshTtlSeconds: 3600,
};

const ROOT_PW = 'Root-Password-1';
const USER_PW = 'User-Password-9';
const TEMP_RE = /^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/;
const NOPE = '00000000-0000-4000-8000-000000000000';

describe('Rahbar: filial, xodim, parol, ruxsatlar (PGlite, RLS yoqilgan)', () => {
  let app: INestApplication;
  let db: Awaited<ReturnType<typeof createTestDb>>['db'];
  let pg: Awaited<ReturnType<typeof createTestDb>>['pg'];
  let rootToken: string;

  const http = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const login = (l: string, p: string) => http().post('/auth/login').send({ login: l, password: p });
  const as = (token: string) => ({
    get: (path: string) => http().get(path).set(auth(token)),
    post: (path: string, body: object = {}) => http().post(path).set(auth(token)).send(body),
    patch: (path: string, body: object) => http().patch(path).set(auth(token)).send(body),
    put: (path: string, body: object) => http().put(path).set(auth(token)).send(body),
  });

  /** Vaqtinchalik parol bilan kirib, parolni almashtiradi va tayyor token qaytaradi. */
  async function activate(loginName: string, temporaryPassword: string) {
    const first = (await login(loginName, temporaryPassword).expect(200)).body;
    await http().post('/auth/change-password').set(auth(first.accessToken)).send({ currentPassword: temporaryPassword, newPassword: USER_PW }).expect(204);
    return (await login(loginName, USER_PW).expect(200)).body.accessToken as string;
  }

  interface Center {
    centerId: string;
    owner: ReturnType<typeof as>;
    ownerToken: string;
    main: string; // "Asosiy filial" id
  }
  async function newCenter(name: string, planId?: string): Promise<Center> {
    const res = await http().post('/admin/centers').set(auth(rootToken)).send({ name, ownerFullName: 'Rahbar Test', planId }).expect(201);
    const ownerToken = await activate(res.body.owner.login, res.body.owner.temporaryPassword);
    return { centerId: res.body.center.id, owner: as(ownerToken), ownerToken, main: res.body.branch.id };
  }

  /** Rahbar nomidan xodim yaratadi va u tomonidan kirishga tayyor token beradi. */
  async function staff(c: Center, role: 'ADMIN' | 'CASHIER' | 'TEACHER', fullName: string, branchIds: string[]) {
    const res = await c.owner.post('/staff', { role, fullName, branchIds }).expect(201);
    const token = await activate(res.body.user.login, res.body.temporaryPassword);
    return { id: res.body.user.id as string, login: res.body.user.login as string, token, api: as(token) };
  }

  let A: Center;
  let B: Center;
  let a2: string; // A markazining 2-filiali
  let admin: Awaited<ReturnType<typeof staff>>;
  let cashier: Awaited<ReturnType<typeof staff>>;
  let teacher2: Awaited<ReturnType<typeof staff>>; // faqat 2-filialda

  beforeAll(async () => {
    ({ db, pg } = await createTestDb());
    await db.insert(s.permissions).values(PERMISSIONS.map((p) => ({ ...p })));
    await db.insert(s.users).values({ centerId: null, role: 'SUPER_ADMIN', login: 'root', fullName: 'Root', passwordHash: await hashPassword(ROOT_PW), mustChangePassword: false });

    const moduleRef = await Test.createTestingModule({ imports: [AppModule], controllers: [ProbeController] })
      .overrideProvider(APP_CONFIG).useValue(config)
      .overrideProvider(DB).useValue(db)
      .overrideProvider(DB_OPTIONS).useValue({ setRole: 'erp_app' })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
    rootToken = (await login('root', ROOT_PW).expect(200)).body.accessToken;

    A = await newCenter('Markaz A');
    B = await newCenter('Markaz B');
    a2 = (await A.owner.post('/branches', { name: 'Chilonzor filiali' }).expect(201)).body.id;
    admin = await staff(A, 'ADMIN', 'Admin Birinchi', [A.main]);
    cashier = await staff(A, 'CASHIER', 'Kassir Birinchi', [A.main]);
    teacher2 = await staff(A, 'TEACHER', 'Ustoz Ikkinchi', [a2]);
  });

  afterAll(async () => {
    await app?.close();
    await pg?.close();
  });

  describe('filial', () => {
    it("rahbar filial yaratadi, tahrirlaydi; nom takrorlansa 409; audit yoziladi", async () => {
      const created = (await A.owner.post('/branches', { name: 'Yunusobod', address: 'Amir Temur 1', phone: '+998 90 111 22 33' }).expect(201)).body;
      expect(created).toMatchObject({ name: 'Yunusobod', address: 'Amir Temur 1', archivedAt: null });
      expect((await A.owner.post('/branches', { name: 'Yunusobod' }).expect(409)).body.code).toBe('BRANCH_NAME_TAKEN');
      await A.owner.post('/branches', { name: 'x' }).expect(400);

      const upd = (await A.owner.patch(`/branches/${created.id}`, { name: 'Yunusobod 2', address: null }).expect(200)).body;
      expect(upd).toMatchObject({ name: 'Yunusobod 2', address: null });
      expect((await A.owner.patch(`/branches/${created.id}`, { name: 'Asosiy filial' }).expect(409)).body.code).toBe('BRANCH_NAME_TAKEN');
      await A.owner.patch(`/branches/${created.id}`, {}).expect(400);

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.centerId, A.centerId));
      expect(audit.map((x) => x.action)).toEqual(expect.arrayContaining(['branch.create', 'branch.edit']));
    });

    it("arxivlash: ro'yxatdan chiqadi, unarchive qaytaradi, oxirgi faol filialni arxivlab bo'lmaydi", async () => {
      const c = await newCenter('Arxiv Markazi');
      const extra = (await c.owner.post('/branches', { name: 'Qo\'shimcha' }).expect(201)).body.id as string;

      await c.owner.post(`/branches/${extra}/archive`).expect(200);
      await c.owner.post(`/branches/${extra}/archive`).expect(409);
      expect((await c.owner.get('/branches').expect(200)).body.items).toHaveLength(1);
      expect((await c.owner.get('/branches?includeArchived=true').expect(200)).body.items).toHaveLength(2);

      expect((await c.owner.post(`/branches/${c.main}/archive`).expect(409)).body.code).toBe('LAST_BRANCH');
      await c.owner.post(`/branches/${extra}/unarchive`).expect(200);
      await c.owner.post(`/branches/${extra}/unarchive`).expect(409);
      await c.owner.post(`/branches/${c.main}/archive`).expect(200); // endi 2 ta faol bor edi
    });

    it("tarif limiti (max_branches) faol filiallar soniga qo'llanadi", async () => {
      const [plan] = await db.insert(s.plans).values({ name: 'Kichik', maxBranches: 2 }).returning();
      const c = await newCenter('Limitli Markaz', plan!.id);
      await c.owner.post('/branches', { name: 'Ikkinchi' }).expect(201);
      expect((await c.owner.post('/branches', { name: 'Uchinchi' }).expect(403)).body.code).toBe('PLAN_BRANCH_LIMIT');
    });

    it("admin/kassir/ustoz filial yarata olmaydi va faqat o'z filialini ko'radi", async () => {
      await admin.api.post('/branches', { name: 'Hack' }).expect(403);
      await cashier.api.patch(`/branches/${A.main}`, { name: 'Hack' }).expect(403);
      const mine = (await admin.api.get('/branches').expect(200)).body.items as { id: string }[];
      expect(mine.map((b) => b.id)).toEqual([A.main]);
      await admin.api.get(`/branches/${a2}`).expect(404); // qamrovdan tashqari
      expect((await teacher2.api.get('/branches').expect(200)).body.items.map((b: { id: string }) => b.id)).toEqual([a2]);
    });

    it("boshqa markaz filiali 404", async () => {
      await B.owner.get(`/branches/${A.main}`).expect(404);
      await B.owner.patch(`/branches/${A.main}`, { name: 'Hack' }).expect(404);
      await B.owner.post(`/branches/${A.main}/archive`).expect(404);
      await B.owner.get(`/branches/${NOPE}`).expect(404);
      expect((await B.owner.get('/branches').expect(200)).body.items.map((b: { id: string }) => b.id)).not.toContain(A.main);
    });
  });

  describe('xodim yaratish', () => {
    it("rahbar admin yaratadi: vaqtinchalik parol bir marta, majburiy almashtirish, filial biriktiriladi, parol auditda yo'q", async () => {
      const res = await A.owner.post('/staff', { role: 'ADMIN', fullName: 'Karim Aliyev', phone: '+998 91 000 00 00', branchIds: [A.main, a2] }).expect(201);
      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.body.temporaryPassword).toMatch(TEMP_RE);
      expect(res.body.user).toMatchObject({ role: 'ADMIN', fullName: 'Karim Aliyev' });
      expect(res.body.user.login).toMatch(/^markaz-a\.karim/);
      expect(res.body.user.branchIds.sort()).toEqual([A.main, a2].sort());

      const first = (await login(res.body.user.login, res.body.temporaryPassword).expect(200)).body;
      expect(first.mustChangePassword).toBe(true);

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.centerId, A.centerId));
      expect(audit.some((x) => x.action === 'staff.create' && x.entityId === res.body.user.id)).toBe(true);
      expect(JSON.stringify(audit)).not.toContain(res.body.temporaryPassword);
    });

    it("avtomatik login band bo'lsa raqam qo'shiladi; berilgan login band bo'lsa 409", async () => {
      const a = (await A.owner.post('/staff', { role: 'CASHIER', fullName: 'Sodiq Bir', branchIds: [A.main] }).expect(201)).body.user.login as string;
      const b = (await A.owner.post('/staff', { role: 'CASHIER', fullName: 'Sodiq Ikki', branchIds: [A.main] }).expect(201)).body.user.login as string;
      expect(a).toBe('markaz-a.sodiq');
      expect(b).toBe('markaz-a.sodiq2');
      expect((await A.owner.post('/staff', { role: 'CASHIER', fullName: 'Yana', login: a, branchIds: [A.main] }).expect(409)).body.code).toBe('LOGIN_TAKEN');
    });

    it("ustoz profili (mutaxassislik, izoh) bilan yaratiladi", async () => {
      const res = await A.owner.post('/staff', { role: 'TEACHER', fullName: 'Dilnoza Ingliz', branchIds: [A.main], specialization: 'IELTS', note: 'Sertifikatli' }).expect(201);
      const [profile] = await db.select().from(s.teacherProfiles).where(eq(s.teacherProfiles.userId, res.body.user.id));
      expect(profile).toMatchObject({ specialization: 'IELTS', note: 'Sertifikatli', centerId: A.centerId });
    });

    it("noto'g'ri kiritish 400; noma'lum, arxivlangan va boshqa markaz filiali 404; rahbar/o'quvchi yaratib bo'lmaydi", async () => {
      await A.owner.post('/staff', { role: 'ADMIN', fullName: 'Filialsiz', branchIds: [] }).expect(400);
      await A.owner.post('/staff', { role: 'OWNER', fullName: 'Ikkinchi Rahbar', branchIds: [A.main] }).expect(400);
      await A.owner.post('/staff', { role: 'STUDENT', fullName: 'Oquvchi', branchIds: [A.main] }).expect(400);
      await A.owner.post('/staff', { role: 'ADMIN', fullName: 'Noma lum', branchIds: [NOPE] }).expect(404);
      await A.owner.post('/staff', { role: 'ADMIN', fullName: 'Begona Filial', branchIds: [B.main] }).expect(404);
      await A.owner.post('/staff', { role: 'ADMIN', fullName: 'Aralash', branchIds: [A.main, B.main] }).expect(404);

      const tmp = (await A.owner.post('/branches', { name: 'Vaqtinchalik' }).expect(201)).body.id as string;
      await A.owner.post(`/branches/${tmp}/archive`).expect(200);
      await A.owner.post('/staff', { role: 'ADMIN', fullName: 'Arxivga', branchIds: [tmp] }).expect(404);
    });

    it("yarim holda hech narsa qolmaydi: filial xato bo'lsa foydalanuvchi ham yaratilmaydi", async () => {
      const before = await db.select().from(s.users).where(eq(s.users.centerId, A.centerId));
      await A.owner.post('/staff', { role: 'ADMIN', fullName: 'Rollback Test', branchIds: [A.main, NOPE] }).expect(404);
      expect((await db.select().from(s.users).where(eq(s.users.centerId, A.centerId))).length).toBe(before.length);
    });

    it("admin faqat o'z filialida ustoz yaratadi; admin/kassir yarata olmaydi; kassir va ustoz hech narsa yarata olmaydi", async () => {
      const ok = await admin.api.post('/staff', { role: 'TEACHER', fullName: 'Admin Yaratgan', branchIds: [A.main] }).expect(201);
      expect(ok.body.user.role).toBe('TEACHER');

      await admin.api.post('/staff', { role: 'CASHIER', fullName: 'Kassir', branchIds: [A.main] }).expect(403);
      await admin.api.post('/staff', { role: 'ADMIN', fullName: 'Admin', branchIds: [A.main] }).expect(403);
      await admin.api.post('/staff', { role: 'TEACHER', fullName: 'Begona Filial', branchIds: [a2] }).expect(403);
      await cashier.api.post('/staff', { role: 'TEACHER', fullName: 'Kassir Yaratdi', branchIds: [A.main] }).expect(403);
      await teacher2.api.post('/staff', { role: 'TEACHER', fullName: 'Ustoz Yaratdi', branchIds: [a2] }).expect(403);
      await http().post('/staff').send({}).expect(401);
    });

    it("admindan teacher.create (✔ default) ni olib bo'lmaydi: faqat ○ kodlar sozlanadi", async () => {
      const res = await A.owner.put(`/permissions/users/${admin.id}`, { permissions: { 'teacher.create': false } }).expect(400);
      expect(res.body.code).toBe('PERMISSION_NOT_CONFIGURABLE');
    });
  });

  describe("xodimni ko'rish va tahrirlash", () => {
    it("rahbar hamma xodimni, admin faqat o'z filialidagi ustozlarni ko'radi; parol xeshi chiqmaydi", async () => {
      const all = (await A.owner.get('/staff?limit=200').expect(200)).body.items as { id: string; role: string }[];
      expect(all.every((u) => ['ADMIN', 'CASHIER', 'TEACHER'].includes(u.role))).toBe(true);
      expect(all.map((u) => u.id)).toEqual(expect.arrayContaining([admin.id, cashier.id, teacher2.id]));
      expect(JSON.stringify(all)).not.toMatch(/passwordHash|password_hash|argon2/);

      const byBranch = (await A.owner.get(`/staff?branchId=${a2}`).expect(200)).body.items as { id: string }[];
      expect(byBranch.map((u) => u.id)).toContain(teacher2.id);
      expect(byBranch.map((u) => u.id)).not.toContain(cashier.id);
      expect((await A.owner.get('/staff?role=CASHIER').expect(200)).body.items.every((u: { role: string }) => u.role === 'CASHIER')).toBe(true);

      const seen = (await admin.api.get('/staff').expect(200)).body.items as { id: string; role: string; branchIds: string[] }[];
      expect(seen.every((u) => u.role === 'TEACHER' && u.branchIds.includes(A.main))).toBe(true);
      expect(seen.map((u) => u.id)).not.toContain(teacher2.id); // 2-filialdagi ustoz
      expect((await admin.api.get('/staff?role=ADMIN').expect(200)).body.items).toEqual([]);
      expect((await admin.api.get(`/staff?branchId=${a2}`).expect(200)).body.items).toEqual([]);
      await cashier.api.get('/staff').expect(403);
    });

    it("admin qamrovdan tashqari ustozni va admin/kassirni ko'ra olmaydi (404)", async () => {
      await admin.api.get(`/staff/${teacher2.id}`).expect(404);
      await admin.api.get(`/staff/${cashier.id}`).expect(404);
      await admin.api.get(`/staff/${admin.id}`).expect(404);
      await A.owner.get(`/staff/${teacher2.id}`).expect(200);
    });

    it("boshqa markaz xodimi 404, ro'yxatda ko'rinmaydi", async () => {
      await B.owner.get(`/staff/${admin.id}`).expect(404);
      await B.owner.patch(`/staff/${admin.id}`, { fullName: 'Hack' }).expect(404);
      const bList = (await B.owner.get('/staff?limit=200').expect(200)).body.items as { id: string }[];
      expect(bList.map((u) => u.id)).not.toContain(admin.id);
    });

    it("tahrirlash: nom, telefon, ustoz profili; admin faqat o'z ustozini; filial va holatni faqat rahbar", async () => {
      const t = await staff(A, 'TEACHER', 'Tahrir Ustoz', [A.main]);
      const upd = (await admin.api.patch(`/staff/${t.id}`, { fullName: 'Yangi Ism', phone: null, specialization: 'Matematika' }).expect(200)).body;
      expect(upd).toMatchObject({ fullName: 'Yangi Ism', phone: null, specialization: 'Matematika' });

      await admin.api.patch(`/staff/${t.id}`, { branchIds: [A.main, a2] }).expect(403);
      await admin.api.patch(`/staff/${t.id}`, { status: 'SUSPENDED' }).expect(403);
      await admin.api.patch(`/staff/${teacher2.id}`, { fullName: 'Hack' }).expect(404);
      await A.owner.patch(`/staff/${admin.id}`, { specialization: 'Mutaxassis' }).expect(400); // faqat ustoz
      await A.owner.patch(`/staff/${t.id}`, {}).expect(400);

      const moved = (await A.owner.patch(`/staff/${t.id}`, { branchIds: [a2] }).expect(200)).body;
      expect(moved.branchIds).toEqual([a2]);
      await admin.api.get(`/staff/${t.id}`).expect(404); // endi admin qamrovida emas

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, t.id));
      expect(audit.map((x) => x.action)).toEqual(expect.arrayContaining(['teacher.create', 'teacher.edit']));
    });

    it("to'xtatilgan xodim kira olmaydi, sessiyasi yopiladi; qayta faollashtirilgach kiradi", async () => {
      const t = await staff(A, 'TEACHER', 'Toxtatiladigan', [A.main]);
      await t.api.get('/branches').expect(200);
      expect((await A.owner.patch(`/staff/${t.id}`, { status: 'SUSPENDED' }).expect(200)).body.status).toBe('SUSPENDED');
      expect((await t.api.get('/branches').expect(401)).body.code).toBe('SESSION_INVALID');
      await login(t.login, USER_PW).expect(403);
      await A.owner.patch(`/staff/${t.id}`, { status: 'ACTIVE' }).expect(200);
      await login(t.login, USER_PW).expect(200);
    });
  });

  describe('parolni tiklash', () => {
    it("rahbar quyi rolni tiklaydi: yangi vaqtinchalik parol, eski sessiya va parol yaroqsiz, majburiy almashtirish", async () => {
      const t = await staff(A, 'CASHIER', 'Parol Unutdi', [A.main]);
      await t.api.get('/branches').expect(200);

      const res = await A.owner.post(`/users/${t.id}/reset-password`).expect(200);
      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.body.temporaryPassword).toMatch(TEMP_RE);
      expect(res.body.user).toMatchObject({ id: t.id, role: 'CASHIER' });

      await t.api.get('/branches').expect(401);
      await login(t.login, USER_PW).expect(401);
      expect((await login(t.login, res.body.temporaryPassword).expect(200)).body.mustChangePassword).toBe(true);

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, t.id));
      expect(audit.map((x) => x.action)).toContain('user.reset_password');
      expect(JSON.stringify(audit)).not.toContain(res.body.temporaryPassword);
    });

    it("admin o'z filialidagi ustozni tiklaydi; kassir, admin, boshqa filial ustozi va rahbarni tiklay olmaydi", async () => {
      const t = await staff(A, 'TEACHER', 'Admin Tiklaydi', [A.main]);
      await admin.api.post(`/users/${t.id}/reset-password`).expect(200);
      await admin.api.post(`/users/${teacher2.id}/reset-password`).expect(404); // boshqa filial
      await admin.api.post(`/users/${cashier.id}/reset-password`).expect(404); // admin kassirni tiklamaydi

      const ownerId = (await db.select().from(s.users).where(eq(s.users.role, 'OWNER'))).find((u) => u.centerId === A.centerId)!.id;
      await admin.api.post(`/users/${ownerId}/reset-password`).expect(404);
    });

    it("kassir va ustoz tiklay olmaydi (403); rahbar o'zini va boshqa rahbarni tiklay olmaydi; boshqa markaz 404", async () => {
      await cashier.api.post(`/users/${admin.id}/reset-password`).expect(403);
      await teacher2.api.post(`/users/${admin.id}/reset-password`).expect(403);

      const ownerId = (await db.select().from(s.users).where(eq(s.users.role, 'OWNER'))).find((u) => u.centerId === A.centerId)!.id;
      expect((await A.owner.post(`/users/${ownerId}/reset-password`).expect(400)).body.code).toBe('USE_CHANGE_PASSWORD');
      const ownerB = (await db.select().from(s.users).where(eq(s.users.role, 'OWNER'))).find((u) => u.centerId === B.centerId)!.id;
      await A.owner.post(`/users/${ownerB}/reset-password`).expect(404);
      await B.owner.post(`/users/${admin.id}/reset-password`).expect(404);
      await A.owner.post(`/users/${NOPE}/reset-password`).expect(404);
      await A.owner.post('/users/not-a-uuid/reset-password').expect(400);
    });
  });

  describe('ruxsatlarni sozlash', () => {
    it("faqat rahbar (permissions.manage); admin va boshqalar 403", async () => {
      await admin.api.get('/permissions/roles').expect(403);
      await cashier.api.put('/permissions/roles/CASHIER', { permissions: { 'payment.reverse': true } }).expect(403);
      await admin.api.put(`/permissions/users/${cashier.id}`, { permissions: { 'payment.reverse': true } }).expect(403);
    });

    it("rol matritsasi: har kod uchun tur, holat va sozlanishi ko'rinadi", async () => {
      const { roles } = (await A.owner.get('/permissions/roles').expect(200)).body;
      const get = (role: string, code: string) => roles[role].find((e: { code: string }) => e.code === code);
      expect(get('CASHIER', 'payment.create')).toMatchObject({ kind: 'default', allowed: true, configurable: false });
      expect(get('CASHIER', 'payment.reverse')).toMatchObject({ kind: 'optional', allowed: false, configurable: true });
      expect(get('CASHIER', 'homework.create')).toBeUndefined(); // – : ro'yxatda yo'q
      expect(roles.OWNER.every((e: { configurable: boolean }) => !e.configurable)).toBe(true);
    });

    it("rol shabloni: ○ kodni yoqish haqiqatan ruxsat beradi, o'chirish qaytaradi; audit yoziladi", async () => {
      const c = await newCenter('Shablon Sozlash');
      const k = await staff(c, 'CASHIER', 'Kassir Shablon', [c.main]);
      await k.api.get('/t/pay-reverse').expect(403);

      await c.owner.put('/permissions/roles/CASHIER', { permissions: { 'payment.reverse': true } }).expect(200);
      await k.api.get('/t/pay-reverse').expect(200);
      expect((await c.owner.get('/permissions/roles').expect(200)).body.roles.CASHIER.find((e: { code: string }) => e.code === 'payment.reverse').allowed).toBe(true);

      await c.owner.put('/permissions/roles/CASHIER', { permissions: { 'payment.reverse': false } }).expect(200);
      await k.api.get('/t/pay-reverse').expect(403);

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.centerId, c.centerId));
      const updates = audit.filter((x) => x.action === 'permissions.role_update');
      expect(updates).toHaveLength(2);
      expect(updates[0]!.before).toMatchObject({ role: 'CASHIER', permissions: { 'payment.reverse': false } });
      expect(updates[0]!.after).toMatchObject({ role: 'CASHIER', permissions: { 'payment.reverse': true } });
    });

    it("✔ (default), – (hech qachon) va noma'lum kodlarni sozlab bo'lmaydi; markazlar bir-biriga ta'sir qilmaydi", async () => {
      const bad = async (role: string, code: string) =>
        expect((await A.owner.put(`/permissions/roles/${role}`, { permissions: { [code]: true } }).expect(400)).body.code).toBe('PERMISSION_NOT_CONFIGURABLE');
      await bad('CASHIER', 'payment.create'); // ✔
      await bad('CASHIER', 'homework.create'); // –
      await bad('ADMIN', 'branch.manage'); // –
      await bad('ADMIN', 'payment.reverse'); // –
      await bad('CASHIER', 'center.create'); // platforma
      await bad('CASHIER', 'no.such.code');
      await bad('OWNER', 'payment.reverse');
      await bad('STUDENT', 'payment.create');
      await A.owner.put('/permissions/roles/CASHIER', { permissions: {} }).expect(400);
      await A.owner.put('/permissions/roles/SUPER_ADMIN', { permissions: { 'payment.reverse': true } }).expect(400);

      // Aralash so'rovda bitta yomon kod bo'lsa hech narsa o'zgarmaydi
      await A.owner.put('/permissions/roles/CASHIER', { permissions: { 'payment.reverse': true, 'homework.create': true } }).expect(400);
      expect((await A.owner.get('/permissions/roles').expect(200)).body.roles.CASHIER.find((e: { code: string }) => e.code === 'payment.reverse').allowed).toBe(false);

      // B markazining shabloni A ga bog'liq emas
      await B.owner.put('/permissions/roles/CASHIER', { permissions: { 'payment.reverse': true } }).expect(200);
      expect((await A.owner.get('/permissions/roles').expect(200)).body.roles.CASHIER.find((e: { code: string }) => e.code === 'payment.reverse').allowed).toBe(false);
    });

    it("foydalanuvchi istisnosi: faqat shu xodimga ta'sir qiladi, null istisnoni olib tashlaydi, false ○ kodni o'chiradi", async () => {
      const c = await newCenter('Istisno Markazi');
      const k1 = await staff(c, 'CASHIER', 'Kassir Bir', [c.main]);
      const k2 = await staff(c, 'CASHIER', 'Kassir Ikki', [c.main]);

      await c.owner.put(`/permissions/users/${k1.id}`, { permissions: { 'payroll.pay': true } }).expect(200);
      await k1.api.get('/t/payroll-pay').expect(200);
      await k2.api.get('/t/payroll-pay').expect(403);

      const view = (await c.owner.get(`/permissions/users/${k1.id}`).expect(200)).body;
      expect(view.permissions.find((p: { code: string }) => p.code === 'payroll.pay')).toMatchObject({ template: false, override: true, effective: true });

      await c.owner.put(`/permissions/users/${k1.id}`, { permissions: { 'payroll.pay': null } }).expect(200);
      await k1.api.get('/t/payroll-pay').expect(403);

      // Rol shabloni yoqilgan, lekin shu xodimga istisno bilan o'chirilgan
      await c.owner.put('/permissions/roles/CASHIER', { permissions: { 'payroll.pay': true } }).expect(200);
      await c.owner.put(`/permissions/users/${k2.id}`, { permissions: { 'payroll.pay': false } }).expect(200);
      await k1.api.get('/t/payroll-pay').expect(200);
      await k2.api.get('/t/payroll-pay').expect(403);

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.centerId, c.centerId));
      expect(audit.filter((x) => x.action === 'permissions.user_update').length).toBe(3);
    });

    it("istisnoda ham ✔ / – kodlar, rahbar nishoni, boshqa markaz va noma'lum foydalanuvchi rad etiladi", async () => {
      await A.owner.put(`/permissions/users/${cashier.id}`, { permissions: { 'payment.create': false } }).expect(400); // ✔ ni o'chirib bo'lmaydi
      await A.owner.put(`/permissions/users/${cashier.id}`, { permissions: { 'homework.create': true } }).expect(400); // –
      await A.owner.put(`/permissions/users/${admin.id}`, { permissions: { 'payment.reverse': true } }).expect(400); // admin uchun –
      const ownerId = (await db.select().from(s.users).where(eq(s.users.role, 'OWNER'))).find((u) => u.centerId === A.centerId)!.id;
      await A.owner.put(`/permissions/users/${ownerId}`, { permissions: { 'payment.reverse': true } }).expect(400);

      await B.owner.get(`/permissions/users/${cashier.id}`).expect(404);
      await B.owner.put(`/permissions/users/${cashier.id}`, { permissions: { 'payment.reverse': true } }).expect(404);
      await A.owner.get(`/permissions/users/${NOPE}`).expect(404);
      const [root] = await db.select().from(s.users).where(eq(s.users.role, 'SUPER_ADMIN'));
      await A.owner.get(`/permissions/users/${root!.id}`).expect(404);
      await A.owner.put(`/permissions/users/${cashier.id}`, { permissions: { 'payment.reverse': 'yes' } }).expect(400);
    });
  });

  describe("rahbar ruxsatsiz holatda (○ yo'q) hamma narsa yopiq", () => {
    it("tokensiz 401; kassir/ustoz hech bir yangi marshrutga kira olmaydi", async () => {
      for (const path of ['/branches', '/staff', '/permissions/roles']) await http().get(path).expect(401);
      await cashier.api.get('/permissions/roles').expect(403);
      await teacher2.api.get('/staff').expect(403);
      await teacher2.api.post(`/users/${cashier.id}/reset-password`).expect(403);
    });
  });
});
