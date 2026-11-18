// Skelet 7-qadam: har rol × har ruxsat kodi HTTP darajasida (ruxsat yo'q -> 403), audit jurnali (`GET /audit`).
import {
  PERMISSIONS,
  PLATFORM_ONLY_PERMISSIONS,
  ROLE_PERMISSION_MATRIX,
  type TenantRole,
} from '@erp/shared';
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

/** Har ruxsat kodi uchun bitta GET /p/<kod> marshruti (dekoratorlar dinamik qo'llanadi). */
@Controller('p')
class AllPermissionsProbe {}
PERMISSIONS.forEach((perm, i) => {
  const key = `h${i}`;
  Object.defineProperty(AllPermissionsProbe.prototype, key, { value: () => ({ ok: true }), writable: true, configurable: true });
  const desc = Object.getOwnPropertyDescriptor(AllPermissionsProbe.prototype, key)!;
  RequirePermission(perm.code)(AllPermissionsProbe.prototype, key, desc);
  Get(perm.code)(AllPermissionsProbe.prototype, key, desc);
});

const config: AppConfig = {
  databaseUrl: 'unused',
  port: 0,
  accessSecret: 'test-access-secret-0123456789',
  refreshSecret: 'test-refresh-secret-0123456789',
  accessTtlSeconds: 900,
  refreshTtlSeconds: 3600,
};
const PW = 'User-Password-9';
const ROOT_PW = 'Root-Password-1';

describe('Ruxsat matritsasi (HTTP) va audit jurnali', () => {
  let app: INestApplication;
  let db: Awaited<ReturnType<typeof createTestDb>>['db'];
  let pg: Awaited<ReturnType<typeof createTestDb>>['pg'];
  const http = () => request(app.getHttpServer());
  const login = (l: string, p: string) => http().post('/auth/login').send({ login: l, password: p });
  const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });
  const as = (t: string) => ({
    get: (p: string) => http().get(p).set(bearer(t)),
    post: (p: string, b: object = {}) => http().post(p).set(bearer(t)).send(b),
    put: (p: string, b: object) => http().put(p).set(bearer(t)).send(b),
  });

  let root: string;
  let ownerA: ReturnType<typeof as>;
  let ownerB: ReturnType<typeof as>;
  let centerA: string;
  let centerB: string;
  const tokens = {} as Record<TenantRole, string>;

  const issuedPasswords: string[] = [PW];
  async function activate(l: string, temp: string) {
    issuedPasswords.push(temp);
    const first = (await login(l, temp).expect(200)).body;
    await http().post('/auth/change-password').set(bearer(first.accessToken)).send({ currentPassword: temp, newPassword: PW }).expect(204);
    return (await login(l, PW).expect(200)).body.accessToken as string;
  }
  async function newCenter(name: string) {
    const res = await as(root).post('/admin/centers', { name, ownerFullName: 'Rahbar' }).expect(201);
    const token = await activate(res.body.owner.login, res.body.owner.temporaryPassword);
    return { token, centerId: res.body.center.id as string, branch: res.body.branch.id as string };
  }

  beforeAll(async () => {
    ({ db, pg } = await createTestDb());
    await db.insert(s.permissions).values(PERMISSIONS.map((p) => ({ ...p })));
    await db.insert(s.users).values({ centerId: null, role: 'SUPER_ADMIN', login: 'root', fullName: 'Root', passwordHash: await hashPassword(ROOT_PW), mustChangePassword: false });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule], controllers: [AllPermissionsProbe] })
      .overrideProvider(APP_CONFIG).useValue(config)
      .overrideProvider(DB).useValue(db)
      .overrideProvider(DB_OPTIONS).useValue({ setRole: 'erp_app' })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
    root = (await login('root', ROOT_PW).expect(200)).body.accessToken;

    const a = await newCenter('Matritsa A');
    const b = await newCenter('Matritsa B');
    centerA = a.centerId;
    centerB = b.centerId;
    ownerA = as(a.token);
    ownerB = as(b.token);
    tokens.OWNER = a.token;
    for (const role of ['ADMIN', 'CASHIER', 'TEACHER'] as const) {
      const res = await ownerA.post('/staff', { role, fullName: `${role} Xodim`, branchIds: [a.branch] }).expect(201);
      tokens[role] = await activate(res.body.user.login, res.body.temporaryPassword);
    }
    // O'quvchi moduli hali yo'q: akkaunt to'g'ridan-to'g'ri bazaga yoziladi.
    await db.insert(s.users).values({ centerId: centerA, role: 'STUDENT', login: 'matritsa.oquvchi', fullName: 'Oquvchi', passwordHash: await hashPassword(PW), mustChangePassword: false });
    tokens.STUDENT = (await login('matritsa.oquvchi', PW).expect(200)).body.accessToken;
  });

  afterAll(async () => {
    await app?.close();
    await pg?.close();
  });

  const statuses = async (token: string) => {
    const out = new Map<string, number>();
    for (const p of PERMISSIONS) out.set(p.code, (await http().get(`/p/${p.code}`).set(bearer(token))).status);
    return out;
  };

  describe.each(['OWNER', 'ADMIN', 'CASHIER', 'TEACHER', 'STUDENT'] as const)('%s', (role) => {
    it('sukut shabloni: ✔ kodlar 200, ○ / – / platforma kodlari 403', async () => {
      const m = ROLE_PERMISSION_MATRIX[role];
      const got = await statuses(tokens[role]);
      const wrong = PERMISSIONS.filter((p) => got.get(p.code) !== (m.default.includes(p.code) ? 200 : 403)).map((p) => `${p.code}=${got.get(p.code)}`);
      expect(wrong).toEqual([]);
    });
  });

  it("rahbar ○ kodlarni yoqsa rol ✔ + ○ ga ega bo'ladi, – kodlar baribir 403", async () => {
    for (const role of ['ADMIN', 'CASHIER', 'TEACHER'] as const) {
      const optional = ROLE_PERMISSION_MATRIX[role].optional;
      await ownerA.put(`/permissions/roles/${role}`, { permissions: Object.fromEntries(optional.map((c) => [c, true])) }).expect(200);
      const m = ROLE_PERMISSION_MATRIX[role];
      const got = await statuses(tokens[role]);
      const wrong = PERMISSIONS.filter((p) => got.get(p.code) !== ([...m.default, ...m.optional].includes(p.code) ? 200 : 403)).map((p) => `${p.code}=${got.get(p.code)}`);
      expect(wrong, role).toEqual([]);
    }
  });

  it("B markazi shabloni A ning yoqilgan ○ kodlaridan bexabar: B da kassir yaratilsa payment.reverse 403", async () => {
    const b = await ownerB.post('/staff', { role: 'CASHIER', fullName: 'B Kassir', branchIds: [(await ownerB.get('/branches').expect(200)).body.items[0].id] }).expect(201);
    const token = await activate(b.body.user.login, b.body.temporaryPassword);
    await http().get('/p/payment.reverse').set(bearer(token)).expect(403);
  });

  it("super admin: faqat platforma kodlari 200, markaz ichki kodlari 403", async () => {
    const got = await statuses(root);
    const wrong = PERMISSIONS.filter((p) => got.get(p.code) !== (PLATFORM_ONLY_PERMISSIONS.has(p.code) ? 200 : 403)).map((p) => `${p.code}=${got.get(p.code)}`);
    expect(wrong).toEqual([]);
  });

  it("tokensiz hamma marshrut 401", async () => {
    for (const p of PERMISSIONS) await http().get(`/p/${p.code}`).expect(401);
  });

  describe('GET /audit', () => {
    it("rahbar ko'radi: amallar, ijrochi ismi, before/after; yangi yozuvlar birinchi", async () => {
      const res = (await ownerA.get('/audit?limit=200').expect(200)).body;
      const actions = res.items.map((i: { action: string }) => i.action);
      expect(actions).toEqual(expect.arrayContaining(['staff.create', 'teacher.create', 'permissions.role_update', 'center.create', 'owner.create']));
      const ids = res.items.map((i: { id: number }) => i.id);
      expect(ids).toEqual([...ids].sort((x, y) => y - x));
      const upd = res.items.find((i: { action: string }) => i.action === 'permissions.role_update');
      expect(upd.actorName).toBe('Rahbar');
      expect(upd.after).toHaveProperty('permissions');
    });

    it("faqat o'z markazi: B rahbari A yozuvlarini ko'rmaydi", async () => {
      const a = (await ownerA.get('/audit?limit=200').expect(200)).body.items as { id: number }[];
      const b = (await ownerB.get('/audit?limit=200').expect(200)).body.items as { id: number }[];
      expect(b.length).toBeGreaterThan(0);
      const aIds = new Set(a.map((x) => x.id));
      expect(b.some((x) => aIds.has(x.id))).toBe(false);
      const rows = await db.select().from(s.auditLogs).where(eq(s.auditLogs.centerId, centerB));
      expect(b.length).toBe(rows.length);
      expect(centerA).not.toBe(centerB);
    });

    it("filtrlar: action, entity, entityId, actorId, sana, limit/offset", async () => {
      const created = (await ownerA.get('/audit?action=staff.create').expect(200)).body.items as { entityId: string; actorId: string; action: string }[];
      expect(created.length).toBe(2); // admin va kassir (ustoz: teacher.create)
      expect(created.every((i) => i.action === 'staff.create')).toBe(true);

      const one = (await ownerA.get(`/audit?entityId=${created[0]!.entityId}`).expect(200)).body.items as { entityId: string }[];
      expect(one.length).toBeGreaterThan(0);
      expect(one.every((i) => i.entityId === created[0]!.entityId)).toBe(true);

      const byActor = (await ownerA.get(`/audit?actorId=${created[0]!.actorId}&entity=user`).expect(200)).body.items as { entity: string }[];
      expect(byActor.every((i) => i.entity === 'user')).toBe(true);

      const future = new Date(Date.now() + 86_400_000).toISOString();
      expect((await ownerA.get(`/audit?from=${future}`).expect(200)).body.items).toEqual([]);
      expect((await ownerA.get(`/audit?to=${future}&action=staff.create`).expect(200)).body.items).toHaveLength(2);

      const p1 = (await ownerA.get('/audit?limit=2&offset=0').expect(200)).body.items as { id: number }[];
      const p2 = (await ownerA.get('/audit?limit=2&offset=2').expect(200)).body.items as { id: number }[];
      expect(p1).toHaveLength(2);
      expect(p2[0]!.id).toBeLessThan(p1[1]!.id);
      await ownerA.get('/audit?limit=0').expect(400);
      await ownerA.get('/audit?entityId=nope').expect(400);
    });

    it("rahbardan boshqa hamma rol va super admin 403; ruxsat berib ham bo'lmaydi", async () => {
      for (const role of ['ADMIN', 'CASHIER', 'TEACHER', 'STUDENT'] as const) await as(tokens[role]).get('/audit').expect(403);
      await as(root).get('/audit').expect(403);
      await http().get('/audit').expect(401);
      const [admin] = await db.select().from(s.users).where(eq(s.users.role, 'ADMIN'));
      const res = await ownerA.put(`/permissions/users/${admin!.id}`, { permissions: { 'audit.view': true } }).expect(400);
      expect(res.body.code).toBe('PERMISSION_NOT_CONFIGURABLE');
    });

    it("jurnalda sir yo'q va o'zgartirib bo'lmaydi (append-only)", async () => {
      const all = JSON.stringify((await ownerA.get('/audit?limit=200').expect(200)).body);
      expect(all).not.toMatch(/passwordHash|password_hash|\$argon2/);
      for (const pw of issuedPasswords) expect(all).not.toContain(pw); // berilgan vaqtinchalik va yangi parollar
      await expect(db.update(s.auditLogs).set({ action: 'hack' }).where(eq(s.auditLogs.centerId, centerA))).rejects.toThrow();
      await expect(db.delete(s.auditLogs).where(eq(s.auditLogs.centerId, centerA))).rejects.toThrow();
    });
  });
});
