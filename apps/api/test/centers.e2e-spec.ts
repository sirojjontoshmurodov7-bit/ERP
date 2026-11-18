import { defaultRolePermissionRows, PERMISSIONS } from '@erp/shared';
import { Controller, Get, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq, sql } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { RequirePermission } from '../src/auth/decorators.js';
import { hashPassword } from '../src/auth/password.js';
import { APP_CONFIG, type AppConfig } from '../src/config/app-config.js';
import { contextOf, DB, DB_OPTIONS, DbService } from '../src/db/db.service.js';
import { rowsOf } from '../src/db/rows.js';
import * as s from '../src/db/schema.js';
import { createTestDb } from './helpers/test-db.js';

@Controller('t')
class ProbeController {
  @RequirePermission('branch.manage') @Get('branch-manage') branchManage() { return { ok: true }; }
  @RequirePermission('payment.reverse') @Get('pay-reverse') payReverse() { return { ok: true }; }
  @RequirePermission('payroll.pay') @Get('payroll-pay') payrollPay() { return { ok: true }; }
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
const TEMP_RE = /^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/;

describe('Super admin: markaz boshqaruvi (PGlite, RLS yoqilgan)', () => {
  let app: INestApplication;
  let db: Awaited<ReturnType<typeof createTestDb>>['db'];
  let pg: Awaited<ReturnType<typeof createTestDb>>['pg'];
  let svc: DbService;
  let rootToken: string;
  let planId: string;
  const http = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const login = (l: string, p: string) => http().post('/auth/login').send({ login: l, password: p });
  const asRoot = {
    post: (path: string, body: object = {}) => http().post(path).set(auth(rootToken)).send(body),
    get: (path: string) => http().get(path).set(auth(rootToken)),
    patch: (path: string, body: object) => http().patch(path).set(auth(rootToken)).send(body),
  };
  const countCenters = async () => Number(rowsOf<{ c: number }>(await db.execute(sql`select count(*)::int c from centers`))[0]!.c);

  const createCenter = (body: object) => asRoot.post('/admin/centers', body);
  /** Markaz yaratadi va rahbarni birinchi parolini almashtirgan holda kiritadi. */
  async function readyOwner(name: string, ownerFullName: string) {
    const res = await createCenter({ name, ownerFullName }).expect(201);
    const { login: ownerLogin, temporaryPassword } = res.body.owner;
    const first = (await login(ownerLogin, temporaryPassword).expect(200)).body;
    const newPassword = 'Owner-Password-9';
    await http().post('/auth/change-password').set(auth(first.accessToken)).send({ currentPassword: temporaryPassword, newPassword }).expect(204);
    const token = (await login(ownerLogin, newPassword).expect(200)).body.accessToken as string;
    return { centerId: res.body.center.id as string, ownerLogin: ownerLogin as string, token, newPassword };
  }

  beforeAll(async () => {
    ({ db, pg } = await createTestDb());
    svc = new DbService(db as never, { setRole: 'erp_app' });
    await db.insert(s.permissions).values(PERMISSIONS.map((p) => ({ ...p })));
    await db.insert(s.users).values({
      centerId: null, role: 'SUPER_ADMIN', login: 'root', fullName: 'Root',
      passwordHash: await hashPassword(ROOT_PW), mustChangePassword: false,
    });
    const [plan] = await db.insert(s.plans).values({ name: 'Boshlang\'ich', priceMonthly: 100_000 }).returning();
    planId = plan!.id;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule], controllers: [ProbeController] })
      .overrideProvider(APP_CONFIG).useValue(config)
      .overrideProvider(DB).useValue(db)
      .overrideProvider(DB_OPTIONS).useValue({ setRole: 'erp_app' })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
    rootToken = (await login('root', ROOT_PW).expect(200)).body.accessToken;
  });

  afterAll(async () => {
    await app?.close();
    await pg?.close();
  });

  describe('markaz yaratish', () => {
    it('markaz, Asosiy filial, rol shabloni va rahbar bitta amalda yaratiladi; parol saqlanmaydi', async () => {
      const res = await createCenter({ name: 'Najot Ta\'lim', ownerFullName: 'Ali Valiyev', ownerPhone: '+998 90 123 45 67', planId }).expect(201);
      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.body.center).toMatchObject({ name: "Najot Ta'lim", slug: 'najot-talim', status: 'TRIAL' });
      expect(res.body.branch.name).toBe('Asosiy filial');
      expect(res.body.owner.login).toBe('najot-talim.ali');
      expect(res.body.owner.temporaryPassword).toMatch(TEMP_RE);

      const id = res.body.center.id as string;
      const [center] = await db.select().from(s.centers).where(eq(s.centers.id, id));
      expect(center!.planId).toBe(planId);
      const days = (center!.trialEndsAt!.getTime() - Date.now()) / 86_400_000;
      expect(days).toBeGreaterThan(13.9);
      expect(days).toBeLessThanOrEqual(14);
      expect(center!.settings).toMatchObject({ billing_mode: 'GROUP_CYCLE', join_proration: 'FULL_MONTH' });

      const branchRows = await db.select().from(s.branches).where(eq(s.branches.centerId, id));
      expect(branchRows.map((b) => b.name)).toEqual(['Asosiy filial']);

      const perms = await db.select().from(s.centerRolePermissions).where(eq(s.centerRolePermissions.centerId, id));
      expect(perms.length).toBe(defaultRolePermissionRows().length);

      const [owner] = await db.select().from(s.users).where(eq(s.users.centerId, id));
      expect(owner).toMatchObject({ role: 'OWNER', mustChangePassword: true, phone: '+998 90 123 45 67' });
      expect(owner!.passwordHash).not.toContain(res.body.owner.temporaryPassword);

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.centerId, id));
      expect(audit.map((a) => a.action).sort()).toEqual(['center.create', 'owner.create']);
      expect(JSON.stringify(audit)).not.toContain(res.body.owner.temporaryPassword);
    });

    it("rahbar vaqtinchalik parol bilan kiradi, parolni almashtiradi va rol shabloni ishlaydi", async () => {
      const created = await createCenter({ name: 'Shablon Markaz', ownerFullName: 'Vali Karimov' }).expect(201);
      const { login: ownerLogin, temporaryPassword } = created.body.owner;
      const res = await login(ownerLogin, temporaryPassword).expect(200);
      expect(res.body.mustChangePassword).toBe(true);
      const token = res.body.accessToken as string;

      expect((await http().get('/t/branch-manage').set(auth(token)).expect(403)).body.code).toBe('PASSWORD_CHANGE_REQUIRED');
      await http().post('/auth/change-password').set(auth(token)).send({ currentPassword: temporaryPassword, newPassword: 'Brand-New-Pass-1' }).expect(204);

      await http().get('/t/branch-manage').set(auth(token)).expect(200); // OWNER shabloni: ✔
      await http().get('/t/pay-reverse').set(auth(token)).expect(200);
    });

    it("slug nomdan (kirill ham) avtomatik hosil bo'ladi, kiritilgan slug ishlatiladi", async () => {
      const cyr = await createCenter({ name: 'Нажот Таълим 2', ownerFullName: 'Олим' }).expect(201);
      expect(cyr.body.center.slug).toBe('najot-talim-2');
      expect(cyr.body.owner.login).toBe('najot-talim-2.olim');
      const explicit = await createCenter({ name: 'Boshqa', slug: 'my-center', ownerFullName: 'Sardor', ownerLogin: 'sardor.boss' }).expect(201);
      expect(explicit.body.center.slug).toBe('my-center');
      expect(explicit.body.owner.login).toBe('sardor.boss');
    });

    it('trialDays=0 bo\'lsa markaz darhol ACTIVE', async () => {
      const res = await createCenter({ name: 'Faol Markaz', ownerFullName: 'Zafar', trialDays: 0 }).expect(201);
      expect(res.body.center).toMatchObject({ status: 'ACTIVE', trialEndsAt: null });
    });

    it("takroriy slug va login 409 beradi va yarim holda hech narsa qolmaydi (rollback)", async () => {
      await createCenter({ name: 'Dup', slug: 'dup-center', ownerFullName: 'Bir', ownerLogin: 'dup.owner' }).expect(201);
      const before = await countCenters();

      const slugDup = await createCenter({ name: 'Dup 2', slug: 'dup-center', ownerFullName: 'Ikki' }).expect(409);
      expect(slugDup.body.code).toBe('SLUG_TAKEN');
      const loginDup = await createCenter({ name: 'Dup 3', slug: 'dup-center-3', ownerFullName: 'Uch', ownerLogin: 'DUP.owner'.toLowerCase() }).expect(409);
      expect(loginDup.body.code).toBe('LOGIN_TAKEN');

      expect(await countCenters()).toBe(before); // markaz qatori ham orqaga qaytdi
      expect(rowsOf(await db.execute(sql`select 1 from centers where slug = 'dup-center-3'`))).toEqual([]);
    });

    it("noto'g'ri ma'lumot 400, noma'lum tarif 404 va markaz yaratilmaydi", async () => {
      const before = await countCenters();
      await createCenter({ name: 'x', ownerFullName: 'Ali' }).expect(400);
      await createCenter({ name: 'Yaxshi nom', ownerFullName: '' }).expect(400);
      await createCenter({ name: 'Yaxshi nom', slug: 'Bad Slug!', ownerFullName: 'Ali' }).expect(400);
      await createCenter({ name: '!!!', ownerFullName: 'Ali' }).expect(400); // nomdan slug chiqmaydi
      await createCenter({ name: 'Tarifsiz', ownerFullName: 'Ali', planId: '00000000-0000-4000-8000-000000000000' }).expect(404);
      expect(await countCenters()).toBe(before);
    });

    it("super admin bo'lmaganlar markaz yarata olmaydi, tokensiz 401", async () => {
      const owner = await readyOwner('Begona Markaz', 'Begona Rahbar');
      await http().post('/admin/centers').set(auth(owner.token)).send({ name: 'Hack', ownerFullName: 'Hacker' }).expect(403);
      await http().get('/admin/centers').set(auth(owner.token)).expect(403);
      await http().post('/admin/centers').send({ name: 'Hack', ownerFullName: 'Hacker' }).expect(401);
    });

    it("super admin faqat platforma audit yozuvlarini ko'radi, markaz yaratilishi ko'rinadi", async () => {
      const rows = await svc.withContext(contextOf(null, 'SUPER_ADMIN'), async (tx) =>
        rowsOf<{ action: string; entity: string; center_id: string | null }>(
          await tx.execute(sql`select action, entity, center_id from audit_logs`),
        ),
      );
      expect(rows.some((r) => r.action === 'center.create')).toBe(true);
      // Ko'rinadiganlar: platforma darajasi (center_id NULL, masalan super adminning o'z kirishi) yoki center/owner/plan yozuvlari.
      // Markaz ichidagi foydalanuvchi/sessiya hodisalari (rahbarning kirishi va h.k.) ko'rinmaydi.
      expect(rows.every((r) => r.center_id === null || ['center', 'owner', 'plan', 'saas_invoice'].includes(r.entity))).toBe(true);
      expect(rows.some((r) => r.center_id !== null && ['user', 'session'].includes(r.entity))).toBe(false);
      const tenantLogins = rowsOf<{ c: number }>(await db.execute(sql`select count(*)::int c from audit_logs where action = 'auth.login' and center_id is not null`));
      expect(Number(tenantLogins[0]!.c)).toBeGreaterThan(0); // bazada bor, lekin super admin ularni ko'rmaydi
      expect(rows.some((r) => r.action === 'auth.login' && r.center_id !== null)).toBe(false);
    });
  });

  describe("ro'yxat va ko'rish", () => {
    it("ro'yxat va filtr ishlaydi, get rahbarlarni qaytaradi", async () => {
      const list = (await asRoot.get('/admin/centers?limit=100').expect(200)).body;
      expect(list.items.length).toBeGreaterThan(3);
      const active = (await asRoot.get('/admin/centers?status=ACTIVE').expect(200)).body;
      expect(active.items.every((c: { status: string }) => c.status === 'ACTIVE')).toBe(true);
      await asRoot.get('/admin/centers?status=WRONG').expect(400);

      const one = (await asRoot.get(`/admin/centers/${list.items[0].id}`).expect(200)).body;
      expect(one.owners.length).toBeGreaterThanOrEqual(1);
      expect(one.owners[0]).not.toHaveProperty('passwordHash');
    });

    it("noma'lum markaz 404, noto'g'ri ID 400", async () => {
      await asRoot.get('/admin/centers/00000000-0000-4000-8000-000000000000').expect(404);
      await asRoot.get('/admin/centers/not-a-uuid').expect(400);
    });
  });

  describe('bloklash', () => {
    it("bloklangan markaz rahbari kira olmaydi, mavjud token darhol o'ladi, blokdan chiqarilgach qaytadi", async () => {
      const o = await readyOwner('Bloklanadigan', 'Blok Rahbar');
      await http().get('/t/branch-manage').set(auth(o.token)).expect(200);

      await asRoot.post(`/admin/centers/${o.centerId}/block`, {}).expect(400); // sabab majburiy
      const blocked = (await asRoot.post(`/admin/centers/${o.centerId}/block`, { reason: "To'lov qilinmadi" }).expect(200)).body;
      expect(blocked).toMatchObject({ status: 'BLOCKED', blockedReason: "To'lov qilinmadi" });

      // Bloklashda sessiyalar yopiladi: eski token 401, qayta kirish urinishi 403 CENTER_BLOCKED
      expect((await http().get('/t/branch-manage').set(auth(o.token)).expect(401)).body.code).toBe('SESSION_INVALID');
      expect((await login(o.ownerLogin, o.newPassword).expect(403)).body.code).toBe('CENTER_BLOCKED');
      const live = rowsOf<{ c: number }>(await db.execute(sql`select count(*)::int c from sessions where center_id = ${o.centerId} and revoked_at is null`));
      expect(Number(live[0]!.c)).toBe(0);

      await asRoot.post(`/admin/centers/${o.centerId}/block`, { reason: 'Yana' }).expect(409);

      const unblocked = (await asRoot.post(`/admin/centers/${o.centerId}/unblock`).expect(200)).body;
      expect(unblocked).toMatchObject({ status: 'TRIAL', blockedAt: null, blockedReason: null }); // sinov hali tugamagan
      await asRoot.post(`/admin/centers/${o.centerId}/unblock`).expect(409);
      await login(o.ownerLogin, o.newPassword).expect(200);

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.centerId, o.centerId));
      expect(audit.map((a) => a.action)).toEqual(expect.arrayContaining(['center.block', 'center.unblock']));
    });

    it("sinovi tugagan markaz blokdan ACTIVE bo'lib chiqadi", async () => {
      const res = await createCenter({ name: 'Eski Sinov', ownerFullName: 'Eski', trialDays: 1 }).expect(201);
      const id = res.body.center.id as string;
      await db.update(s.centers).set({ trialEndsAt: new Date(Date.now() - 86_400_000) }).where(eq(s.centers.id, id));
      await asRoot.post(`/admin/centers/${id}/block`, { reason: 'Sabab' }).expect(200);
      expect((await asRoot.post(`/admin/centers/${id}/unblock`).expect(200)).body.status).toBe('ACTIVE');
    });

    it("noma'lum markazni bloklab bo'lmaydi", async () => {
      await asRoot.post('/admin/centers/00000000-0000-4000-8000-000000000000/block', { reason: 'Sabab' }).expect(404);
    });
  });

  describe('tahrirlash', () => {
    it("nom, tarif va sinov muddati o'zgaradi; holatni PATCH bilan o'zgartirib bo'lmaydi", async () => {
      const res = await createCenter({ name: 'Tahrir', ownerFullName: 'Tahrirchi' }).expect(201);
      const id = res.body.center.id as string;
      const newEnd = new Date(Date.now() + 30 * 86_400_000).toISOString();
      const upd = (await asRoot.patch(`/admin/centers/${id}`, { name: 'Yangi Tahrir', planId, trialEndsAt: newEnd }).expect(200)).body;
      expect(upd).toMatchObject({ name: 'Yangi Tahrir', planId, slug: 'tahrir' });
      expect(new Date(upd.trialEndsAt).toISOString()).toBe(newEnd);

      await asRoot.patch(`/admin/centers/${id}`, {}).expect(400);
      await asRoot.patch(`/admin/centers/${id}`, { status: 'ACTIVE' }).expect(400); // status bu yerda o'zgarmaydi
      await asRoot.patch(`/admin/centers/${id}`, { planId: '00000000-0000-4000-8000-000000000000' }).expect(404);
      await asRoot.patch('/admin/centers/00000000-0000-4000-8000-000000000000', { name: 'Yo\'q' }).expect(404);
      expect((await asRoot.get(`/admin/centers/${id}`).expect(200)).body.status).toBe('TRIAL');
    });
  });

  describe('rahbar parolini tiklash', () => {
    it("yangi vaqtinchalik parol beriladi, eski parol va sessiyalar yaroqsiz, majburiy almashtirish qaytadi", async () => {
      const o = await readyOwner('Parol Tiklash', 'Unutuvchan');
      await http().get('/t/branch-manage').set(auth(o.token)).expect(200);

      const res = await asRoot.post(`/admin/centers/${o.centerId}/owner/reset-password`).expect(200);
      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.body.owner.login).toBe(o.ownerLogin);
      expect(res.body.temporaryPassword).toMatch(TEMP_RE);

      await http().get('/t/branch-manage').set(auth(o.token)).expect(401); // eski sessiya yopildi
      await login(o.ownerLogin, o.newPassword).expect(401);
      const again = await login(o.ownerLogin, res.body.temporaryPassword).expect(200);
      expect(again.body.mustChangePassword).toBe(true);

      const audit = await db.select().from(s.auditLogs).where(eq(s.auditLogs.centerId, o.centerId));
      expect(audit.map((a) => a.action)).toContain('owner.reset_password');
      expect(JSON.stringify(audit)).not.toContain(res.body.temporaryPassword);
    });

    it("boshqa markaz foydalanuvchisi yoki noma'lum markaz uchun 404", async () => {
      const a = await readyOwner('Markaz Alfa', 'Alfa Rahbar');
      const b = await readyOwner('Markaz Beta', 'Beta Rahbar');
      const [betaOwner] = await db.select().from(s.users).where(eq(s.users.login, b.ownerLogin));
      await asRoot.post(`/admin/centers/${a.centerId}/owner/reset-password`, { userId: betaOwner!.id }).expect(404);
      await asRoot.post('/admin/centers/00000000-0000-4000-8000-000000000000/owner/reset-password').expect(404);
      await login(b.ownerLogin, b.newPassword).expect(200); // Beta tegilmagan
    });

    it('rahbarning o\'zi bu endpointni chaqira olmaydi', async () => {
      const o = await readyOwner('Oz Tiklash', 'Oz Rahbar');
      await http().post(`/admin/centers/${o.centerId}/owner/reset-password`).set(auth(o.token)).send({}).expect(403);
    });
  });

  describe('rol shabloni', () => {
    it("shablon matritsaga mos: kassirda payment.reverse ○ (qator bor, allowed=false), TEACHER'da homework.create ✔", async () => {
      const res = await createCenter({ name: 'Matritsa', ownerFullName: 'Matritsa Rahbar' }).expect(201);
      const id = res.body.center.id as string;
      const rows = await db.select().from(s.centerRolePermissions).where(eq(s.centerRolePermissions.centerId, id));
      const get = (role: string, code: string) => rows.find((r) => r.role === role && r.permissionCode === code);
      expect(get('CASHIER', 'payment.reverse')).toMatchObject({ allowed: false });
      expect(get('CASHIER', 'payment.create')).toMatchObject({ allowed: true });
      expect(get('TEACHER', 'homework.create')).toMatchObject({ allowed: true });
      expect(get('OWNER', 'homework.create')).toBeUndefined(); // – : hech qachon
      expect(get('STUDENT', 'payment.create')).toBeUndefined();
    });
  });
});
