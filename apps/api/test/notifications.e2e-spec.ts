// 21-qadam: Telegram bot va bildirishnomalar. PGlite, RLS yoqilgan; Telegram soxta `TelegramSender` bilan (tarmoq yo'q).
import { PERMISSIONS } from '@erp/shared';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { and, eq } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { hashPassword } from '../src/auth/password.js';
import { addDays, isoWeekday, todayLocal } from '../src/common/dates.js';
import { APP_CONFIG, type AppConfig } from '../src/config/app-config.js';
import { DB, DB_OPTIONS } from '../src/db/db.service.js';
import * as s from '../src/db/schema.js';
import { DispatchService } from '../src/notifications/dispatch.service.js';
import { hashLinkCode, normalizeLinkCode } from '../src/notifications/messages.js';
import { type SendResult, TelegramSender } from '../src/notifications/telegram.sender.js';
import { createTestDb } from './helpers/test-db.js';

const WEBHOOK_SECRET = 'webhook-secret-0123456789';
const CRON_SECRET = 'cron-secret-0123456789abcd';
const config: AppConfig = {
  databaseUrl: 'unused',
  port: 0,
  accessSecret: 'test-access-secret-0123456789',
  refreshSecret: 'test-refresh-secret-0123456789',
  accessTtlSeconds: 900,
  refreshTtlSeconds: 3600,
  telegramBotToken: 'test-token-not-real',
  telegramBotUsername: 'erp_test_bot',
  telegramWebhookSecret: WEBHOOK_SECRET,
  cronSecret: CRON_SECRET,
};

class FakeSender extends TelegramSender {
  sent: { chatId: number; text: string }[] = [];
  configured = true;
  result: SendResult = { ok: true };
  isConfigured() {
    return this.configured;
  }
  send(chatId: number, text: string): Promise<SendResult> {
    if (this.result.ok) this.sent.push({ chatId, text });
    return Promise.resolve(this.result);
  }
  to = (chatId: number) => this.sent.filter((m) => m.chatId === chatId).map((m) => m.text);
  clear() {
    this.sent = [];
  }
}

const ROOT_PW = 'Root-Password-1';
const PW = 'User-Password-9';
const NOPE = '00000000-0000-4000-8000-000000000000';
const TODAY = todayLocal();
const YESTERDAY = addDays(TODAY, -1);
const TOMORROW = addDays(TODAY, 1);
type Api = ReturnType<typeof makeApi>;
let httpFn: () => request.Agent;
const makeApi = (t: string) => ({
  get: (p: string) => httpFn().get(p).set({ Authorization: `Bearer ${t}` }),
  post: (p: string, b: object = {}) => httpFn().post(p).set({ Authorization: `Bearer ${t}` }).send(b),
  put: (p: string, b: object) => httpFn().put(p).set({ Authorization: `Bearer ${t}` }).send(b),
  del: (p: string) => httpFn().delete(p).set({ Authorization: `Bearer ${t}` }),
});

describe('Telegram bot va bildirishnomalar (PGlite, RLS yoqilgan)', () => {
  let app: INestApplication;
  let db: Awaited<ReturnType<typeof createTestDb>>['db'];
  let pg: Awaited<ReturnType<typeof createTestDb>>['pg'];
  let rootToken: string;
  const fake = new FakeSender();
  const http = () => request(app.getHttpServer());
  const login = (l: string, p: string) => http().post('/auth/login').send({ login: l, password: p });

  async function activate(l: string, temp: string) {
    const first = (await login(l, temp).expect(200)).body;
    await http().post('/auth/change-password').set({ Authorization: `Bearer ${first.accessToken}` }).send({ currentPassword: temp, newPassword: PW }).expect(204);
    return (await login(l, PW).expect(200)).body.accessToken as string;
  }
  interface Center {
    id: string;
    owner: Api;
    ownerId: string;
    main: string;
    second: string;
    course: string;
  }
  async function newCenter(name: string): Promise<Center> {
    const res = await makeApi(rootToken).post('/admin/centers', { name, ownerFullName: 'Rahbar' }).expect(201);
    const owner = makeApi(await activate(res.body.owner.login, res.body.owner.temporaryPassword));
    const second = (await owner.post('/branches', { name: 'Ikkinchi filial' }).expect(201)).body.id as string;
    const course = (await owner.post('/courses', { name: 'Ingliz tili', defaultPrice: 400000 }).expect(201)).body.id as string;
    return { id: res.body.center.id, owner, ownerId: res.body.owner.id as string, main: res.body.branch.id, second, course };
  }
  async function staff(c: Center, role: 'ADMIN' | 'CASHIER' | 'TEACHER', fullName: string, branchId: string) {
    const res = await c.owner.post('/staff', { role, fullName, branchIds: [branchId] }).expect(201);
    return { id: res.body.user.id as string, api: makeApi(await activate(res.body.user.login, res.body.temporaryPassword)) };
  }
  let n = 0;
  async function mkStudent(c: Center, branchId: string, name = `Talaba${++n} Bot`) {
    const res = await c.owner.post('/students', { fullName: name, branchId }).expect(201);
    const login = res.body.student.login as string;
    let cached: Promise<Api> | undefined;
    return { id: res.body.student.id as string, name, api: () => (cached ??= activate(login, res.body.temporaryPassword).then(makeApi)) };
  }
  const mkGroup = async (c: Center, name: string, branchId: string, extra: object = {}) =>
    (await c.owner.post('/groups', { name, courseId: c.course, branchId, priceMonthly: 100000, billingMode: 'STUDENT_CYCLE', status: 'ACTIVE', ...extra }).expect(201)).body.id as string;
  const enroll = async (c: Center, groupId: string, studentId: string, joinedAt?: string) =>
    (await c.owner.post('/enrollments', { groupId, studentId, ...(joinedAt ? { joinedAt } : {}) }).expect(201)).body.id as string;
  const enable = (c: Center, userId: string, codes: Record<string, boolean | null>) => c.owner.put(`/permissions/users/${userId}`, { permissions: codes }).expect(200);

  const webhook = (body: object, secret: string | null = WEBHOOK_SECRET) => {
    const r = http().post('/telegram/webhook');
    return (secret === null ? r : r.set('x-telegram-bot-api-secret-token', secret)).send(body);
  };
  const say = (chatId: number, text: string, type = 'private') => webhook({ message: { text, chat: { id: chatId, type } } });
  const chatOf = async (userId: string) => (await db.select().from(s.users).where(eq(s.users.id, userId)))[0]!.telegramChatId;
  /** Foydalanuvchi o'zi kod oladi va botga yuboradi. */
  async function link(api: Api, chatId: number) {
    const code = (await api.post('/notifications/link-code').expect(200)).body.code as string;
    await say(chatId, `/start ${code}`).expect(200);
    return code;
  }
  const logs = (userId: string, type?: string) =>
    db.select().from(s.notificationLog).where(type ? and(eq(s.notificationLog.userId, userId), eq(s.notificationLog.type, type)) : eq(s.notificationLog.userId, userId));

  let A: Center;
  let B: Center;
  let admin1: Awaited<ReturnType<typeof staff>>;
  let cashier1: Awaited<ReturnType<typeof staff>>;
  let teacher1: Awaited<ReturnType<typeof staff>>;
  let sMain: Awaited<ReturnType<typeof mkStudent>>; // asosiy filial
  let sSecond: Awaited<ReturnType<typeof mkStudent>>; // ikkinchi filial
  let sB: Awaited<ReturnType<typeof mkStudent>>; // B markaz

  beforeAll(async () => {
    ({ db, pg } = await createTestDb());
    await db.insert(s.permissions).values(PERMISSIONS.map((p) => ({ ...p })));
    await db.insert(s.users).values({ centerId: null, role: 'SUPER_ADMIN', login: 'root', fullName: 'Root', passwordHash: await hashPassword(ROOT_PW), mustChangePassword: false });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(APP_CONFIG).useValue(config)
      .overrideProvider(DB).useValue(db)
      .overrideProvider(DB_OPTIONS).useValue({ setRole: 'erp_app' })
      .overrideProvider(TelegramSender).useValue(fake)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
    httpFn = http as never;
    rootToken = (await login('root', ROOT_PW).expect(200)).body.accessToken;

    A = await newCenter('Bot Markazi A');
    B = await newCenter('Bot Markazi B');
    admin1 = await staff(A, 'ADMIN', 'Admin Bir', A.main);
    cashier1 = await staff(A, 'CASHIER', 'Kassir Bir', A.main);
    teacher1 = await staff(A, 'TEACHER', 'Ustoz Bir', A.main);
    sMain = await mkStudent(A, A.main, 'Anvar Aliyev');
    sSecond = await mkStudent(A, A.second, 'Bobur Karimov');
    sB = await mkStudent(B, B.main, 'Begona Talaba');
  });

  afterAll(async () => {
    await app?.close();
    await pg?.close();
  });
  beforeEach(() => {
    fake.clear();
    fake.configured = true;
    fake.result = { ok: true };
  });

  describe('kod yordamchilari', () => {
    it("normalizeLinkCode: registr, bo'shliq va chiziqcha e'tiborsiz; noto'g'ri uzunlik/belgi rad", () => {
      expect(normalizeLinkCode('abcde-fghjk')).toBe('ABCDEFGHJK');
      expect(normalizeLinkCode(' ABCDE FGHJK ')).toBe('ABCDEFGHJK');
      expect(normalizeLinkCode('ABCDEFGHJ')).toBeNull();
      expect(normalizeLinkCode('ABCDEFGHJ0')).toBeNull(); // 0 alfavitda yo'q
      expect(hashLinkCode('ABCDEFGHJK', 'a')).not.toBe(hashLinkCode('ABCDEFGHJK', 'b'));
    });
  });

  describe("o'z hisobini ulash (kod + webhook)", () => {
    it("kod beriladi (no-store, havola), bazada faqat xesh; /start KOD bog'laydi, kod bir marta ishlaydi", async () => {
      const api = await sMain.api();
      const res = await api.post('/notifications/link-code').expect(200);
      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.body.code).toMatch(/^[A-HJ-NP-Z2-9]{10}$/);
      expect(res.body.deepLink).toBe(`https://t.me/erp_test_bot?start=${res.body.code}`);
      const rows = await db.select().from(s.telegramLinkCodes).where(eq(s.telegramLinkCodes.userId, sMain.id));
      expect(JSON.stringify(rows)).not.toContain(res.body.code);
      expect(rows[0]!.codeHash).toBe(hashLinkCode(res.body.code, config.accessSecret));

      expect((await api.get('/notifications/link').expect(200)).body.linked).toBe(false);
      await say(5001, `/start ${res.body.code.toLowerCase()}`).expect(200).expect({ ok: true });
      expect(await chatOf(sMain.id)).toBe(5001);
      expect(fake.to(5001)[0]).toContain('Ulandi: Anvar Aliyev');
      expect((await api.get('/notifications/link').expect(200)).body.linked).toBe(true);
      expect((await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, sMain.id))).map((a) => a.action)).toEqual(expect.arrayContaining(['telegram.link_code', 'telegram.link']));

      await say(5002, `/start ${res.body.code}`).expect(200); // ikkinchi marta: ishlatilgan
      expect(fake.to(5002)[0]).toContain("noto'g'ri yoki muddati tugagan");
      expect(await chatOf(sMain.id)).toBe(5001);
    });

    it("muddati tugagan, noto'g'ri va eskirgan (yangi kod berilgan) kodlar ishlamaydi; /stop uzadi", async () => {
      const api = await sSecond.api();
      const old = (await api.post('/notifications/link-code').expect(200)).body.code as string;
      const fresh = (await api.post('/notifications/link-code').expect(200)).body.code as string; // eskisini bekor qiladi
      await say(5101, `/start ${old}`).expect(200);
      expect(fake.to(5101)[0]).toContain("noto'g'ri");
      await db.update(s.telegramLinkCodes).set({ expiresAt: new Date(Date.now() - 1000), createdAt: new Date(Date.now() - 60_000) }).where(eq(s.telegramLinkCodes.codeHash, hashLinkCode(fresh, config.accessSecret)));
      await say(5102, `/start ${fresh}`).expect(200);
      expect(fake.to(5102)[0]).toContain("noto'g'ri");
      await say(5103, '/start nonsense').expect(200);
      expect(await chatOf(sSecond.id)).toBeNull();

      const ok = (await api.post('/notifications/link-code').expect(200)).body.code as string;
      await say(5104, `/start@erp_test_bot ${ok}`).expect(200);
      expect(await chatOf(sSecond.id)).toBe(5104);
      await say(5104, '/stop').expect(200);
      expect(await chatOf(sSecond.id)).toBeNull();
      expect(fake.to(5104).at(-1)).toContain('Hisob uzildi');
      await say(5104, '/stop').expect(200);
      expect(fake.to(5104).at(-1)).toContain('topilmadi');
    });

    it("/start kodsiz va boshqa matn yordam beradi; guruh chati e'tiborsiz", async () => {
      await say(5201, '/start').expect(200);
      await say(5201, 'salom').expect(200);
      expect(fake.to(5201)).toHaveLength(2);
      expect(fake.to(5201)[0]).toContain('/start KOD');
      await say(5202, '/start ABCDEFGHJK', 'group').expect(200);
      await webhook({ edited_message: {} }).expect(200);
      await webhook({}).expect(200);
      expect(fake.to(5202)).toEqual([]);
    });

    it("kod tanlashga qarshi: bir chatdan 5 xato urinishdan keyin to'g'ri kod ham, javob ham yo'q; boshqa chat ta'sirlanmaydi", async () => {
      const api = await sMain.api();
      for (let i = 0; i < 5; i++) await say(5301, '/start AAAAAAAAAA').expect(200);
      expect(fake.to(5301)).toHaveLength(5);
      const code = (await api.post('/notifications/link-code').expect(200)).body.code as string;
      await say(5301, `/start ${code}`).expect(200);
      expect(fake.to(5301)).toHaveLength(5); // javob ham yo'q
      expect(await chatOf(sMain.id)).toBe(5001); // o'zgarmagan
      await say(5302, `/start ${code}`).expect(200);
      expect(await chatOf(sMain.id)).toBe(5302);
      await say(5302, '/stop');
      await link(api, 5001);
    });

    it("webhook himoyasi: sirsiz/noto'g'ri sir 403; token yo'q joyda ham xatosiz", async () => {
      await webhook({ message: { text: '/start AAAAAAAAAA', chat: { id: 1, type: 'private' } } }, null).expect(403);
      await webhook({}, 'wrong-secret-0123456789').expect(403);
      await webhook({}, 'x').expect(403);
      expect(fake.sent).toEqual([]);
    });

    it("o'zini uzish; tokensiz 401; super admin 403", async () => {
      const api = await sSecond.api();
      await link(api, 5401);
      await api.del('/notifications/link').expect(200).expect({ linked: false });
      expect(await chatOf(sSecond.id)).toBeNull();
      await httpFn().post('/notifications/link-code').expect(401);
      await makeApi(rootToken).post('/notifications/link-code').expect(403);
    });
  });

  describe("boshqa foydalanuvchi uchun kod va uzish (telegram.settings)", () => {
    it("rahbar o'z markazidagi istalgan foydalanuvchi uchun; boshqa markaz 404; super admin 403", async () => {
      const res = await A.owner.post(`/users/${sMain.id}/telegram/link-code`).expect(200);
      expect(res.headers['cache-control']).toBe('no-store');
      await say(5501, `/start ${res.body.code}`).expect(200);
      expect(await chatOf(sMain.id)).toBe(5501);
      await A.owner.post(`/users/${sB.id}/telegram/link-code`).expect(404);
      await B.owner.post(`/users/${sMain.id}/telegram/link-code`).expect(404);
      await A.owner.post(`/users/${NOPE}/telegram/link-code`).expect(404);
      await makeApi(rootToken).post(`/users/${sMain.id}/telegram/link-code`).expect(403);
      await A.owner.del(`/users/${sMain.id}/telegram`).expect(200);
      expect(await chatOf(sMain.id)).toBeNull();
      await A.owner.del(`/users/${sB.id}/telegram`).expect(404);
    });

    it("admin: ruxsat yoqilmaguncha 403, keyin faqat o'z filialidagi foydalanuvchilar; kassir va ustoz 403", async () => {
      await admin1.api.post(`/users/${sMain.id}/telegram/link-code`).expect(403);
      await enable(A, admin1.id, { 'telegram.settings': true });
      await admin1.api.post(`/users/${sMain.id}/telegram/link-code`).expect(200);
      await admin1.api.post(`/users/${sSecond.id}/telegram/link-code`).expect(404); // boshqa filial
      await admin1.api.post(`/users/${A.ownerId}/telegram/link-code`).expect(404); // rahbar qamrovda emas
      await admin1.api.del(`/users/${sSecond.id}/telegram`).expect(404);
      await cashier1.api.post(`/users/${sMain.id}/telegram/link-code`).expect(403);
      await teacher1.api.post(`/users/${sMain.id}/telegram/link-code`).expect(403);
      await admin1.api.del(`/users/${sMain.id}/telegram`).expect(200);
      await enable(A, admin1.id, { 'telegram.settings': null });
      await admin1.api.post(`/users/${sMain.id}/telegram/link-code`).expect(403);
    });
  });

  describe("qo'lda xabar va jurnal (notification.send)", () => {
    it("yuboriladi, jurnalga matnsiz yoziladi; ulanmagan 409; xato 502 + FAILED; bot sozlanmagan 503", async () => {
      await link(await sMain.api(), 5601);
      fake.clear();
      const res = await A.owner.post('/notifications/send', { userId: sMain.id, message: '  Ertaga imtihon  ' }).expect(200);
      expect(res.body).toEqual({ status: 'SENT' });
      expect(fake.to(5601)).toEqual(['Ertaga imtihon']);
      const [log] = await logs(sMain.id, 'MANUAL');
      expect(log).toMatchObject({ status: 'SENT', channel: 'TELEGRAM', error: null, createdBy: A.ownerId, payload: { length: 14 } });
      expect(JSON.stringify(log)).not.toContain('imtihon');

      await A.owner.post('/notifications/send', { userId: sSecond.id, message: 'salom' }).expect(409).expect((r) => expect(r.body.code).toBe('TELEGRAM_NOT_LINKED'));
      fake.result = { ok: false, code: 'NETWORK' };
      const failed = await A.owner.post('/notifications/send', { userId: sMain.id, message: 'yana' }).expect(502);
      expect(failed.body).toMatchObject({ code: 'TELEGRAM_SEND_FAILED', reason: 'NETWORK' });
      expect((await logs(sMain.id, 'MANUAL')).map((l) => [l.status, l.error])).toEqual([['SENT', null], ['FAILED', 'NETWORK']]);
      expect(await chatOf(sMain.id)).toBe(5601); // oddiy xatoda uzilmaydi

      fake.result = { ok: false, code: 'BLOCKED', blocked: true };
      await A.owner.post('/notifications/send', { userId: sMain.id, message: 'yana' }).expect(502);
      expect(await chatOf(sMain.id)).toBeNull(); // bot to'silgan: avtomatik uziladi
      fake.result = { ok: true };
      await link(await sMain.api(), 5601);
      fake.configured = false;
      await A.owner.post('/notifications/send', { userId: sMain.id, message: 'yana' }).expect(503);
    });

    it("tekshiruvlar va ruxsat: bo'sh/uzun matn 400, boshqa markaz 404, admin/kassir/ustoz/o'quvchi", async () => {
      await A.owner.post('/notifications/send', { userId: sMain.id, message: '   ' }).expect(400);
      await A.owner.post('/notifications/send', { userId: sMain.id, message: 'x'.repeat(1001) }).expect(400);
      await A.owner.post('/notifications/send', { userId: 'nope', message: 'x' }).expect(400);
      await A.owner.post('/notifications/send', { userId: sB.id, message: 'x' }).expect(404);
      await admin1.api.post('/notifications/send', { userId: sMain.id, message: 'x' }).expect(403);
      await cashier1.api.post('/notifications/send', { userId: sMain.id, message: 'x' }).expect(403);
      await teacher1.api.post('/notifications/send', { userId: sMain.id, message: 'x' }).expect(403);
      await (await sMain.api()).post('/notifications/send', { userId: sMain.id, message: 'x' }).expect(403);
      await httpFn().post('/notifications/send').send({}).expect(401);
      await enable(A, admin1.id, { 'notification.send': true });
      await admin1.api.post('/notifications/send', { userId: sMain.id, message: 'admin xabari' }).expect(200);
      await admin1.api.post('/notifications/send', { userId: sSecond.id, message: 'x' }).expect(404); // boshqa filial
      await enable(A, admin1.id, { 'notification.send': null });
    });

    it("jurnal: rahbar hammasini, admin faqat o'z filiali foydalanuvchilarini; filtr va sahifalash; boshqa markaz ko'rinmaydi", async () => {
      await link(await sSecond.api(), 5701);
      await A.owner.post('/notifications/send', { userId: sSecond.id, message: 'ikkinchi filial' }).expect(200);
      await B.owner.post('/notifications/send', { userId: sB.id, message: 'x' }).expect(409); // ulanmagan

      const all = (await A.owner.get('/notifications').expect(200)).body;
      expect(all.items.length).toBe(all.total);
      expect(new Set(all.items.map((i: { userId: string }) => i.userId))).toEqual(new Set([sMain.id, sSecond.id]));
      expect(all.items[0]).toMatchObject({ userName: expect.any(String), type: 'MANUAL' });
      expect(all.items[0]).not.toHaveProperty('text');
      expect((await A.owner.get(`/notifications?userId=${sSecond.id}`).expect(200)).body.total).toBe(1);
      expect((await A.owner.get('/notifications?status=FAILED').expect(200)).body.items.every((i: { status: string }) => i.status === 'FAILED')).toBe(true);
      expect((await A.owner.get('/notifications?limit=1&offset=1').expect(200)).body.items).toHaveLength(1);
      await A.owner.get('/notifications?type=NOPE').expect(400);
      expect((await B.owner.get('/notifications').expect(200)).body.total).toBe(0);

      await admin1.api.get('/notifications').expect(403);
      await enable(A, admin1.id, { 'notification.send': true });
      const scoped = (await admin1.api.get('/notifications').expect(200)).body;
      expect(scoped.items.every((i: { userId: string }) => i.userId === sMain.id)).toBe(true);
      expect(scoped.total).toBeGreaterThan(0);
      await enable(A, admin1.id, { 'notification.send': null });
      await cashier1.api.get('/notifications').expect(403);
      await teacher1.api.get('/notifications').expect(403);
    });
  });

  describe('avtomatik eslatmalar (run / cron)', () => {
    let gD: string;
    let gL: string;
    let sDebt: Awaited<ReturnType<typeof mkStudent>>;
    let sHw: Awaited<ReturnType<typeof mkStudent>>;
    let sDone: Awaited<ReturnType<typeof mkStudent>>;
    let sUnlinked: Awaited<ReturnType<typeof mkStudent>>;
    let hw: string;
    const CH = { debt: 6001, hw: 6002, done: 6003, teacher: 6004, unlinked: 0, b: 6100 };
    const month = TODAY.slice(0, 7);
    const run = (body: object = {}) => A.owner.post('/notifications/run', body);
    const only = async (types: string[]) => (await run({ types }).expect(200)).body;

    beforeAll(async () => {
      gD = await mkGroup(A, 'Qarz guruhi', A.main);
      gL = await mkGroup(A, 'Dars guruhi', A.main, { schedule: [{ weekday: isoWeekday(TOMORROW), startTime: '18:00', endTime: '19:30', room: '12-xona' }] });
      await A.owner.post(`/groups/${gL}/teachers`, { teacherId: teacher1.id, kind: 'MAIN' }).expect(200);
      sDebt = await mkStudent(A, A.main, 'Qarzdor Talaba');
      sHw = await mkStudent(A, A.main, 'Vazifali Talaba');
      sDone = await mkStudent(A, A.main, 'Topshirgan Talaba');
      sUnlinked = await mkStudent(A, A.main, 'Ulanmagan Talaba');
      await enroll(A, gD, sDebt.id, YESTERDAY); // birinchi hisob kecha muddatli: qarz
      for (const st of [sHw, sDone, sUnlinked]) await enroll(A, gL, st.id);
      await enroll(A, gL, sDebt.id);
      await link(await sDebt.api(), CH.debt);
      await link(await sHw.api(), CH.hw);
      await link(await sDone.api(), CH.done);
      await link(teacher1.api, CH.teacher);
      // boshqa markaz: shu ham qarzdor, ulangan
      const gB = await mkGroup(B, 'B guruhi', B.main);
      await enroll(B, gB, sB.id, YESTERDAY);
      await link(await sB.api(), CH.b);

      const t = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.id, teacher1.id));
      expect(t).toHaveLength(1);
      hw = (await teacher1.api.post(`/groups/${gL}/assignments`, { title: 'Insho yozish', dueAt: new Date(Date.now() + 12 * 3_600_000).toISOString() }).expect(201)).body.id as string;
      await teacher1.api.post(`/groups/${gL}/assignments`, { title: 'Uzoq vazifa', dueAt: new Date(Date.now() + 5 * 86_400_000).toISOString() }).expect(201); // 24 soatdan keyin: eslatilmaydi
      await (await sDone.api()).post(`/assignments/${hw}/submission`, { text: 'tayyor' }).expect(200);
    });

    it("ruxsat: faqat rahbar; admin/kassir/ustoz/o'quvchi 403; tokensiz 401; bot sozlanmagan 503", async () => {
      await admin1.api.post('/notifications/run', {}).expect(403);
      await enable(A, admin1.id, { 'notification.send': true });
      await admin1.api.post('/notifications/run', {}).expect(403); // ruxsat bor, lekin rol faqat rahbar
      await enable(A, admin1.id, { 'notification.send': null });
      await cashier1.api.post('/notifications/run', {}).expect(403);
      await teacher1.api.post('/notifications/run', {}).expect(403);
      await (await sDebt.api()).post('/notifications/run', {}).expect(403);
      await httpFn().post('/notifications/run').send({}).expect(401);
      await A.owner.post('/notifications/run', { types: ['NOPE'] }).expect(400);
      await A.owner.post('/notifications/run', { debtGapDays: 0 }).expect(400);
      fake.configured = false;
      await run().expect(503);
      expect(fake.sent).toEqual([]);
    });

    it("qarz: faqat ulangan qarzdorga, summa bilan; takror yuborilmaydi (oraliq), oraliq o'tgach yana; boshqa markaz tegilmaydi", async () => {
      const res = await only(['DEBT']);
      expect(res.DEBT).toEqual({ sent: 1, failed: 0 });
      expect(fake.to(CH.debt)).toHaveLength(1);
      expect(fake.to(CH.debt)[0]).toContain("Hurmatli Qarzdor Talaba, sizda 100 000 so'm");
      expect(fake.to(CH.debt)[0]).toContain('Bot Markazi A');
      expect(fake.to(CH.b)).toEqual([]); // B markaz qarzdori A ning ishga tushirishida tegilmaydi
      const [log] = await logs(sDebt.id, 'DEBT');
      expect(log).toMatchObject({ status: 'SENT', payload: { debt: 100000 }, dedupeKey: `DEBT:${TODAY}` });
      expect(JSON.stringify(log)).not.toContain('Qarzdor');

      expect((await only(['DEBT'])).DEBT).toEqual({ sent: 0, failed: 0 });
      expect((await only(['DEBT'])).DEBT.sent).toBe(0);
      // oraliqni o'tkazib yuborish: eski yozuv 8 kun oldin
      await db.update(s.notificationLog).set({ createdAt: new Date(Date.now() - 8 * 86_400_000), dedupeKey: 'DEBT:eski' }).where(eq(s.notificationLog.userId, sDebt.id));
      expect((await only(['DEBT'])).DEBT.sent).toBe(1);
      await db.update(s.notificationLog).set({ createdAt: new Date(Date.now() - 2 * 86_400_000), dedupeKey: 'DEBT:eski2' }).where(and(eq(s.notificationLog.userId, sDebt.id), eq(s.notificationLog.dedupeKey, `DEBT:${TODAY}`)));
      expect((await run({ types: ['DEBT'], debtGapDays: 7 }).expect(200)).body.DEBT.sent).toBe(0);
      expect((await run({ types: ['DEBT'], debtGapDays: 1 }).expect(200)).body.DEBT.sent).toBe(1);
    });

    it("dars: ertangi jadval bo'yicha ulangan o'quvchi va ustozga (xona va vaqt bilan), ulanmaganga yo'q; takror yo'q; bekor qilingan dars yo'q", async () => {
      fake.clear();
      const res = await only(['LESSON']);
      expect(res.LESSON.failed).toBe(0);
      for (const ch of [CH.hw, CH.done, CH.debt, CH.teacher]) {
        expect(fake.to(ch)).toHaveLength(1);
        expect(fake.to(ch)[0]).toContain(`ertaga (${TOMORROW.slice(8, 10)}.${TOMORROW.slice(5, 7)}) soat 18:00 da "Dars guruhi" darsi, xona: 12-xona`);
      }
      expect(res.LESSON.sent).toBe(4);
      expect(fake.to(CH.b)).toEqual([]);
      expect((await logs(sUnlinked.id)).length).toBe(0); // ulanmagan uchun jurnal ham yo'q
      expect((await logs(sHw.id, 'LESSON'))[0]!.dedupeKey).toBe(`LESSON:${gL}:${TOMORROW}`);
      fake.clear();
      expect((await only(['LESSON'])).LESSON.sent).toBe(0);
      expect(fake.sent).toEqual([]);
    });

    it("bekor qilingan darsga eslatma yuborilmaydi", async () => {
      const gC = await mkGroup(A, 'Bekor guruh', A.main, { schedule: [{ weekday: isoWeekday(TOMORROW), startTime: '09:00', endTime: '10:00' }] });
      await enroll(A, gC, sHw.id);
      await db.insert(s.lessons).values({ centerId: A.id, groupId: gC, lessonDate: TOMORROW, status: 'CANCELLED' });
      fake.clear();
      await only(['LESSON']);
      expect(fake.to(CH.hw).some((t) => t.includes('Bekor guruh'))).toBe(false);
    });

    it("vazifa: 24 soat ichidagi muddat, topshirmaganga; topshirgan va ulanmagan yo'q; takror yo'q", async () => {
      fake.clear();
      const res = await only(['HOMEWORK']);
      expect(res.HOMEWORK).toEqual({ sent: 2, failed: 0 }); // sHw va sDebt (ikkalasi gL da, topshirmagan)
      expect(fake.to(CH.hw)).toHaveLength(1);
      expect(fake.to(CH.hw)[0]).toContain('"Dars guruhi" guruhi vazifasi "Insho yozish" muddati yaqin:');
      expect(fake.to(CH.hw)[0]).not.toContain('Uzoq vazifa');
      expect(fake.to(CH.done)).toEqual([]);
      expect(fake.to(CH.teacher)).toEqual([]);
      expect((await logs(sHw.id, 'HOMEWORK'))[0]!.dedupeKey).toBe(`HW:${hw}`);
      expect((await only(['HOMEWORK'])).HOMEWORK.sent).toBe(0);
      // arxivlangan vazifa eslatilmaydi
      const hw2 = (await teacher1.api.post(`/groups/${gL}/assignments`, { title: 'Arxiv vazifa', dueAt: new Date(Date.now() + 3_600_000).toISOString() }).expect(201)).body.id as string;
      await teacher1.api.post(`/assignments/${hw2}/archive`).expect(200);
      expect((await only(['HOMEWORK'])).HOMEWORK.sent).toBe(0);
    });

    it("maosh: tasdiqlangan davr uchun xodimga jami summa (qoida + bonus/jarima), takror yo'q; hisoblangan (DRAFT) davr yo'q", async () => {
      await A.owner.post('/payroll/rules', { employeeId: teacher1.id, type: 'FIXED', amount: 5_000_000 }).expect(201);
      await A.owner.post(`/payroll/periods/${month}/calculate`).expect(200);
      fake.clear();
      expect((await only(['PAYROLL'])).PAYROLL.sent).toBe(0); // hali DRAFT
      await A.owner.post(`/payroll/periods/${month}/adjustments`, { employeeId: teacher1.id, amount: -200_000, reason: 'jarima' }).expect(201);
      await A.owner.post(`/payroll/periods/${month}/approve`).expect(200);
      const res = await only(['PAYROLL']);
      expect(res.PAYROLL).toEqual({ sent: 1, failed: 0 });
      expect(fake.to(CH.teacher)).toEqual([`Hurmatli Ustoz Bir, ${month} oyi uchun maosh hisoblandi: 4 800 000 so'm.`]);
      expect((await only(['PAYROLL'])).PAYROLL.sent).toBe(0);
    });

    it("yuborish xatosi FAILED yoziladi (takror urinish mumkin); bot to'silsa chat uziladi", async () => {
      const sNew = await mkStudent(A, A.main, 'Yangi Qarzdor');
      await enroll(A, gD, sNew.id, YESTERDAY);
      await link(await sNew.api(), 6201);
      fake.clear();
      fake.result = { ok: false, code: 'RATE_LIMITED' };
      const failed = await only(['DEBT']);
      expect(failed.DEBT).toEqual({ sent: 0, failed: 1 });
      expect((await logs(sNew.id, 'DEBT')).map((l) => [l.status, l.error])).toEqual([['FAILED', 'RATE_LIMITED']]);
      fake.result = { ok: false, code: 'BLOCKED', blocked: true };
      await only(['DEBT']);
      expect(await chatOf(sNew.id)).toBeNull();
      fake.result = { ok: true };
      expect((await only(['DEBT'])).DEBT.sent).toBe(0); // chat uzilgan: nomzod emas
    });

    it("cron: sirsiz 403, noto'g'ri sir 403; to'g'ri sir bilan hamma markaz (B ham); bo'sh tana yaroqli", async () => {
      await httpFn().post('/notifications/cron').send({}).expect(403);
      await httpFn().post('/notifications/cron').set('x-cron-secret', 'wrong-secret-0123456789abcd').send({}).expect(403);
      await httpFn().post('/notifications/cron').set('x-cron-secret', 'short').send({}).expect(403);
      await httpFn().post('/notifications/cron').set('x-cron-secret', CRON_SECRET).send({ types: ['NOPE'] }).expect(400);
      fake.clear();
      const res = await httpFn().post('/notifications/cron').set('x-cron-secret', CRON_SECRET).expect(200);
      expect(res.body).toMatchObject({ centers: 2, failedCenters: 0 });
      expect(res.body.totals.DEBT.sent).toBe(1); // B markaz qarzdori
      expect(fake.to(CH.b)).toHaveLength(1);
      expect(fake.to(CH.b)[0]).toContain('Bot Markazi B');
      expect((await logs(sB.id, 'DEBT'))[0]).toMatchObject({ centerId: B.id });
      // bir marta yuborilganlar takrorlanmaydi
      const again = await httpFn().post('/notifications/cron').set('x-cron-secret', CRON_SECRET).send({}).expect(200);
      expect(Object.values(again.body.totals as Record<string, { sent: number }>).every((t) => t.sent === 0)).toBe(true);
      fake.configured = false;
      await httpFn().post('/notifications/cron').set('x-cron-secret', CRON_SECRET).send({}).expect(503);
    });

    it("bloklangan markaz cron'da o'tkazib yuboriladi", async () => {
      await db.update(s.centers).set({ status: 'BLOCKED' }).where(eq(s.centers.id, B.id));
      const res = await httpFn().post('/notifications/cron').set('x-cron-secret', CRON_SECRET).send({}).expect(200);
      expect(res.body.centers).toBe(1);
      await db.update(s.centers).set({ status: 'ACTIVE' }).where(eq(s.centers.id, B.id));
    });
  });

  describe('xavfsizlik va izolyatsiya', () => {
    it("boshqa markaz foydalanuvchisi uchun kod ham, jurnal ham ko'rinmaydi; kod xeshi markazlararo takrorlanmaydi", async () => {
      const codes = await db.select().from(s.telegramLinkCodes);
      expect(new Set(codes.map((c) => c.codeHash)).size).toBe(codes.length);
      expect((await B.owner.get('/notifications').expect(200)).body.items.every((i: { userId: string }) => i.userId === sB.id)).toBe(true);
    });

    it("webhook sirsiz sozlangan bo'lsa yo'l yopiq (404); cron sirsiz ham", async () => {
      const cfg = config as AppConfig;
      const saved = { w: cfg.telegramWebhookSecret, c: cfg.cronSecret };
      cfg.telegramWebhookSecret = undefined;
      cfg.cronSecret = undefined;
      await webhook({}, 'anything-0123456789abcd').expect(404);
      await httpFn().post('/notifications/cron').set('x-cron-secret', CRON_SECRET).send({}).expect(404);
      cfg.telegramWebhookSecret = saved.w;
      cfg.cronSecret = saved.c;
    });

    it("DispatchService: bir vaqtda ikki marta ishga tushirish ikkinchisini bo'sh qaytaradi", async () => {
      const svc = app.get(DispatchService);
      const [a, b] = await Promise.all([svc.runForCenter(A.id, { types: ['LESSON'] }), svc.runForCenter(A.id, { types: ['LESSON'] })]);
      const total = (x: Awaited<typeof a>) => x.LESSON.sent + x.LESSON.failed;
      expect(total(a) + total(b)).toBe(0); // hammasi allaqachon yuborilgan; hech biri xato bermaydi
    });
  });
});
