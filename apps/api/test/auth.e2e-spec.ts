import { PERMISSIONS } from '@erp/shared';
import { Controller, Get, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { hashPassword } from '../src/auth/password.js';
import { RequirePermission, Roles } from '../src/auth/decorators.js';
import { APP_CONFIG, type AppConfig } from '../src/config/app-config.js';
import { DB, DB_OPTIONS } from '../src/db/db.service.js';
import * as s from '../src/db/schema.js';
import { createTestDb } from './helpers/test-db.js';

@Controller('t')
class ProbeController {
  @Get('plain') plain() { return { ok: true }; }
  @RequirePermission('payment.create') @Get('pay-create') payCreate() { return { ok: true }; }
  @RequirePermission('payment.view') @Get('pay-view') payView() { return { ok: true }; }
  @RequirePermission('center.create') @Get('platform') platform() { return { ok: true }; }
  @Roles('OWNER') @Get('owner-only') ownerOnly() { return { ok: true }; }
}

const config: AppConfig = {
  databaseUrl: 'unused',
  port: 0,
  accessSecret: 'test-access-secret-0123456789',
  refreshSecret: 'test-refresh-secret-0123456789',
  accessTtlSeconds: 900,
  refreshTtlSeconds: 3600,
};

const PW = 'Correct-Horse-1';
const TEMP_PW = 'Temp-Password-1';

describe('Auth (PGlite, RLS yoqilgan)', () => {
  let app: INestApplication;
  let db: Awaited<ReturnType<typeof createTestDb>>['db'];
  let pg: Awaited<ReturnType<typeof createTestDb>>['pg'];
  let centerA: string;
  let centerB: string;
  const http = () => request(app.getHttpServer());

  const login = (loginName: string, password: string) => http().post('/auth/login').send({ login: loginName, password });
  const tokenOf = async (loginName: string, password = PW): Promise<string> => {
    const res = await login(loginName, password).expect(200);
    return res.body.accessToken as string;
  };
  const get = (path: string, token: string) => http().get(path).set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    ({ db, pg } = await createTestDb());
    await db.insert(s.permissions).values(PERMISSIONS.map((p) => ({ ...p })));

    const [a] = await db.insert(s.centers).values({ name: 'A', slug: 'a', status: 'ACTIVE' }).returning();
    const [b] = await db.insert(s.centers).values({ name: 'B', slug: 'b', status: 'BLOCKED' }).returning();
    centerA = a!.id;
    centerB = b!.id;

    const hash = await hashPassword(PW);
    const tempHash = await hashPassword(TEMP_PW);
    const mk = (centerId: string | null, role: string, loginName: string, extra: Partial<typeof s.users.$inferInsert> = {}) =>
      ({ centerId, role, login: loginName, fullName: loginName, passwordHash: hash, mustChangePassword: false, ...extra }) as typeof s.users.$inferInsert;
    const inserted = await db
      .insert(s.users)
      .values([
        mk(centerA, 'OWNER', 'a.owner'),
        mk(centerA, 'CASHIER', 'a.cashier', { passwordHash: tempHash, mustChangePassword: true }),
        mk(centerA, 'CASHIER', 'a.cashier2'),
        mk(centerA, 'ADMIN', 'a.suspended', { status: 'SUSPENDED' }),
        mk(centerB, 'OWNER', 'b.owner'),
        mk(null, 'SUPER_ADMIN', 'root'),
        mk(centerA, 'OWNER', 'a.owner.block'),
        mk(centerA, 'OWNER', 'a.owner.pw'),
        mk(centerA, 'OWNER', 'a.owner.logout'),
        mk(centerA, 'OWNER', 'a.owner.reuse'),
      ])
      .returning();
    const idOf = (l: string) => inserted.find((u) => u.login === l)!.id;

    await db.insert(s.centerRolePermissions).values([
      { centerId: centerA, role: 'OWNER', permissionCode: 'payment.create', allowed: true },
      { centerId: centerA, role: 'OWNER', permissionCode: 'payment.view', allowed: true },
      { centerId: centerA, role: 'CASHIER', permissionCode: 'payment.create', allowed: false },
    ]);
    await db.insert(s.userPermissions).values([
      // shablon taqiqlagan, istisno ruxsat beradi
      { userId: idOf('a.cashier2'), centerId: centerA, permissionCode: 'payment.create', allowed: true },
      // shablon ruxsat bergan, istisno taqiqlaydi
      { userId: idOf('a.owner.pw'), centerId: centerA, permissionCode: 'payment.view', allowed: false },
    ]);

    const moduleRef = await Test.createTestingModule({ imports: [AppModule], controllers: [ProbeController] })
      .overrideProvider(APP_CONFIG).useValue(config)
      .overrideProvider(DB).useValue(db)
      .overrideProvider(DB_OPTIONS).useValue({ setRole: 'erp_app' })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await pg?.close();
  });

  describe('login', () => {
    it("to'g'ri login/parol token juftligini qaytaradi", async () => {
      const res = await login('A.Owner', PW).expect(200); // login registrga bog'liq emas
      expect(res.body).toMatchObject({ mustChangePassword: false, expiresIn: 900, user: { login: 'a.owner', role: 'OWNER' } });
      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.refreshToken).toBeTruthy();
    });

    it("noto'g'ri parol va mavjud bo'lmagan login bir xil javob beradi", async () => {
      const wrong = await login('a.owner', 'nope-nope-1').expect(401);
      const unknown = await login('nobody', 'nope-nope-1').expect(401);
      expect(wrong.body).toEqual(unknown.body);
      expect(wrong.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('bloklangan markaz foydalanuvchisi kira olmaydi', async () => {
      const res = await login('b.owner', PW).expect(403);
      expect(res.body.code).toBe('CENTER_BLOCKED');
    });

    it("to'xtatilgan akkaunt kira olmaydi", async () => {
      const res = await login('a.suspended', PW).expect(403);
      expect(res.body.code).toBe('ACCOUNT_INACTIVE');
    });

    it('super admin markazsiz kiradi va /me da centerId null', async () => {
      const token = await tokenOf('root');
      const me = await get('/auth/me', token).expect(200);
      expect(me.body).toMatchObject({ role: 'SUPER_ADMIN', centerId: null });
    });

    it('validatsiya xatosi 400 qaytaradi', async () => {
      await http().post('/auth/login').send({ login: '' }).expect(400);
    });

    it('ketma-ket xato urinishlardan keyin 429', async () => {
      for (let i = 0; i < 5; i++) await login('throttle.me', 'bad-password-1').expect(401);
      const res = await login('throttle.me', 'bad-password-1').expect(429);
      expect(res.body.code).toBe('TOO_MANY_ATTEMPTS');
    });

    it('kirish va xato urinish audit jurnaliga yoziladi (parolsiz)', async () => {
      await login('a.owner', 'wrong-password-1').expect(401);
      const rows = await db.select().from(s.auditLogs).where(eq(s.auditLogs.centerId, centerA));
      const actions = rows.map((r) => r.action);
      expect(actions).toContain('auth.login');
      expect(actions).toContain('auth.login_failed');
      expect(JSON.stringify(rows)).not.toContain(PW);
    });
  });

  describe('himoya', () => {
    it("tokensiz va noto'g'ri token bilan 401", async () => {
      await http().get('/t/plain').expect(401);
      await get('/t/plain', 'garbage.token.value').expect(401);
    });

    it('health (GET /) ochiq', async () => {
      await http().get('/').expect(200);
    });

    it('majburiy parol almashtirish: boshqa marshrutlar bloklanadi, me/change-password ishlaydi', async () => {
      const res = await login('a.cashier', TEMP_PW).expect(200);
      expect(res.body.mustChangePassword).toBe(true);
      const token = res.body.accessToken as string;

      const blocked = await get('/t/plain', token).expect(403);
      expect(blocked.body.code).toBe('PASSWORD_CHANGE_REQUIRED');
      await get('/auth/me', token).expect(200);

      const change = (body: object) =>
        http().post('/auth/change-password').set('Authorization', `Bearer ${token}`).send(body);
      await change({ currentPassword: 'wrong-current-1', newPassword: 'New-Password-1' }).expect(401);
      await change({ currentPassword: TEMP_PW, newPassword: 'short' }).expect(400);
      await change({ currentPassword: TEMP_PW, newPassword: TEMP_PW }).expect(400);
      await change({ currentPassword: TEMP_PW, newPassword: 'New-Password-1' }).expect(204);

      await get('/t/plain', token).expect(200); // shu token endi ishlaydi
      await login('a.cashier', TEMP_PW).expect(401); // eski parol endi yaroqsiz
      await login('a.cashier', 'New-Password-1').expect(200);
    });

    it('parol almashtirilganda boshqa sessiyalar yopiladi', async () => {
      const t1 = await tokenOf('a.owner.pw');
      const t2 = await tokenOf('a.owner.pw');
      await http()
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${t1}`)
        .send({ currentPassword: PW, newPassword: 'Another-Pass-9' })
        .expect(204);
      await get('/t/plain', t1).expect(200);
      await get('/t/plain', t2).expect(401);
    });

    it("login qilingandan keyin markaz bloklansa, token darhol yaroqsiz bo'ladi", async () => {
      const token = await tokenOf('a.owner.block');
      await get('/t/plain', token).expect(200);
      await db.update(s.centers).set({ status: 'BLOCKED' }).where(eq(s.centers.id, centerA));
      const res = await get('/t/plain', token).expect(403);
      expect(res.body.code).toBe('CENTER_BLOCKED');
      await db.update(s.centers).set({ status: 'ACTIVE' }).where(eq(s.centers.id, centerA));
      await get('/t/plain', token).expect(200);
    });
  });

  describe('sessiya', () => {
    it('refresh rotatsiyasi ishlaydi; eski refresh qayta ishlatilsa hamma sessiya yopiladi', async () => {
      const first = (await login('a.owner.reuse', PW).expect(200)).body;
      const rotated = (await http().post('/auth/refresh').send({ refreshToken: first.refreshToken }).expect(200)).body;
      expect(rotated.refreshToken).not.toBe(first.refreshToken);
      await get('/t/plain', rotated.accessToken).expect(200);

      // eski (ishlatilgan) refresh token qayta kelsa: rad etiladi va yangi sessiya ham yopiladi
      await http().post('/auth/refresh').send({ refreshToken: first.refreshToken }).expect(401);
      await get('/t/plain', rotated.accessToken).expect(401);
      await http().post('/auth/refresh').send({ refreshToken: rotated.refreshToken }).expect(401);
    });

    it("noma'lum refresh token 401", async () => {
      await http().post('/auth/refresh').send({ refreshToken: 'x'.repeat(43) }).expect(401);
    });

    it('logout sessiyani bekor qiladi', async () => {
      const res = (await login('a.owner.logout', PW).expect(200)).body;
      await http().post('/auth/logout').set('Authorization', `Bearer ${res.accessToken}`).expect(204);
      await get('/t/plain', res.accessToken).expect(401);
      await http().post('/auth/refresh').send({ refreshToken: res.refreshToken }).expect(401);
    });
  });

  describe('rol va ruxsat guardlari', () => {
    it("@Roles: faqat ko'rsatilgan rol", async () => {
      await get('/t/owner-only', await tokenOf('a.owner')).expect(200);
      await get('/t/owner-only', await tokenOf('a.cashier2')).expect(403);
    });

    it("rol shabloni ruxsat beradi", async () => {
      await get('/t/pay-view', await tokenOf('a.owner')).expect(200);
      await get('/t/pay-create', await tokenOf('a.owner')).expect(200);
    });

    it("foydalanuvchi istisnosi shablondan ustun (ikkala yo'nalishda)", async () => {
      await get('/t/pay-create', await tokenOf('a.cashier2')).expect(200); // shablon: taqiq, istisno: ruxsat
      const denied = await get('/t/pay-view', await tokenOf('a.owner.pw', 'Another-Pass-9')).expect(403); // shablon: ruxsat, istisno: taqiq
      expect(denied.body.code).toBe('FORBIDDEN');
    });

    it("shablonda yozuv yo'q bo'lsa sukut bo'yicha taqiq", async () => {
      await get('/t/pay-view', await tokenOf('a.cashier2')).expect(403);
    });

    it('platforma ruxsatlari faqat super admin uchun', async () => {
      await get('/t/platform', await tokenOf('root')).expect(200);
      await get('/t/platform', await tokenOf('a.owner')).expect(403);
    });

    it('super admin markaz ichki ruxsatlariga ega emas', async () => {
      await get('/t/pay-create', await tokenOf('root')).expect(403);
    });
  });
});
