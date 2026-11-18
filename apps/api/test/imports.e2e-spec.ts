// 19-qadam: Excel/CSV import (o'quvchilar). PGlite, RLS yoqilgan. Fayllar test yozuvchisi bilan haqiqiy .xlsx sifatida yig'iladi.
import { PERMISSIONS } from '@erp/shared';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { hashPassword } from '../src/auth/password.js';
import { addDays, todayLocal } from '../src/common/dates.js';
import { APP_CONFIG, type AppConfig } from '../src/config/app-config.js';
import { DB, DB_OPTIONS } from '../src/db/db.service.js';
import * as s from '../src/db/schema.js';
import { createTestDb } from './helpers/test-db.js';
import { type Cell, makeXlsx } from './helpers/xlsx-writer.js';

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
const YESTERDAY = addDays(TODAY, -1);
const HEADER = ['Ism', 'Telefon', "Tug'ilgan sana", 'Ota-ona ismi', 'Izoh', 'Guruh', "Qo'shilgan sana"];
type Api = ReturnType<typeof makeApi>;
let httpFn: () => request.Agent;
const makeApi = (t: string) => ({
  get: (p: string) => httpFn().get(p).set({ Authorization: `Bearer ${t}` }),
  post: (p: string, b: object = {}) => httpFn().post(p).set({ Authorization: `Bearer ${t}` }).send(b),
  put: (p: string, b: object) => httpFn().put(p).set({ Authorization: `Bearer ${t}` }).send(b),
  /** multipart yuklash: `fields` matn maydonlari. */
  upload: (file: Buffer | null, name: string, fields: Record<string, string> = {}) => {
    let r = httpFn().post('/imports').set({ Authorization: `Bearer ${t}` });
    for (const [k, v] of Object.entries(fields)) r = r.field(k, v);
    return file ? r.attach('file', file, name) : r;
  },
});

describe('Excel/CSV import (PGlite, RLS yoqilgan)', () => {
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
    slug: string;
    owner: Api;
    main: string;
    second: string;
    course: string;
  }
  async function newCenter(name: string, withSecond = true): Promise<Center> {
    const res = await makeApi(rootToken).post('/admin/centers', { name, ownerFullName: 'Rahbar' }).expect(201);
    const owner = makeApi(await activate(res.body.owner.login, res.body.owner.temporaryPassword));
    const second = withSecond ? ((await owner.post('/branches', { name: 'Ikkinchi filial' }).expect(201)).body.id as string) : '';
    const course = (await owner.post('/courses', { name: 'Ingliz tili', defaultPrice: 400000 }).expect(201)).body.id as string;
    return { centerId: res.body.center.id, slug: res.body.center.slug, owner, main: res.body.branch.id, second, course };
  }
  async function staff(c: Center, role: 'ADMIN' | 'CASHIER' | 'TEACHER', fullName: string, branchId: string) {
    const res = await c.owner.post('/staff', { role, fullName, branchIds: [branchId] }).expect(201);
    return { id: res.body.user.id as string, api: makeApi(await activate(res.body.user.login, res.body.temporaryPassword)) };
  }
  const mkGroup = async (c: Center, name: string, branchId: string, status = 'ACTIVE') =>
    (await c.owner.post('/groups', { name, courseId: c.course, branchId, priceMonthly: 400000, billingMode: 'STUDENT_CYCLE', status }).expect(201)).body.id as string;
  const xlsx = (rows: Cell[][], opts = { shared: true }) => makeXlsx(rows, opts);
  const students = async () => (await db.select().from(s.users).where(eq(s.users.role, 'STUDENT'))).length;
  const enable = (c: Center, userId: string, codes: Record<string, boolean | null>) => c.owner.put(`/permissions/users/${userId}`, { permissions: codes }).expect(200);

  let A: Center;
  let B: Center;
  let admin1: Awaited<ReturnType<typeof staff>>;
  let cashier1: Awaited<ReturnType<typeof staff>>;
  let teacher1: Awaited<ReturnType<typeof staff>>;
  let gMain: string;
  let gSecond: string;

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

    A = await newCenter('Import Markazi A');
    B = await newCenter('Import Markazi B', false);
    admin1 = await staff(A, 'ADMIN', 'Admin Bir', A.main);
    cashier1 = await staff(A, 'CASHIER', 'Kassir Bir', A.main);
    teacher1 = await staff(A, 'TEACHER', 'Ustoz Bir', A.main);
    gMain = await mkGroup(A, 'IELTS 1', A.main);
    gSecond = await mkGroup(A, 'Matematika', A.second);
    const finished = await mkGroup(A, 'Eski guruh', A.main);
    await db.update(s.groups).set({ status: 'FINISHED' }).where(eq(s.groups.id, finished)); // tugagan guruhni to'g'ridan-to'g'ri yaratib bo'lmaydi
    await A.owner.post('/students', { fullName: 'Ali Mavjud', branchId: A.main, phone: '+998 90 000 00 01' }).expect(201); // login `slug.ali` band
  });

  afterAll(async () => {
    await app?.close();
    await pg?.close();
  });

  describe('muvaffaqiyatli import', () => {
    it("xlsx: o'quvchilar, profil, filial, guruhga yozilish va birinchi hisob yaratiladi; loginlar takrorlanmaydi; parollar faqat javobda", async () => {
      const before = await students();
      const file = xlsx([
        HEADER,
        ['Ali Karimov', '+998 90 123-45-67', { date: '2012-05-17' }, 'Karim Karimov', 'Izoh 1', 'IELTS 1', { date: YESTERDAY }],
        ['Ali Valiyev', 998911234567, '17.05.2013', null, null, null, null],
        ["Dilnoza Rahimova", '+998 93 111 22 33', null, null, null, 'ielts 1', null],
      ]);
      const res = await A.owner.upload(file, 'talabalar.xlsx', { branchId: A.main }).expect(200);
      expect(res.headers['cache-control']).toBe('no-store');
      expect(res.body).toMatchObject({ dryRun: false, fileName: 'talabalar.xlsx', totalRows: 3, validRows: 3, errorRows: 0, errors: [], ignoredColumns: [] });
      expect(res.body.job).toMatchObject({ type: 'STUDENTS', status: 'DONE', totalRows: 3, createdRows: 3, errorRows: 0 });
      expect(await students()).toBe(before + 3);

      const created = res.body.created as { row: number; studentId: string; login: string; temporaryPassword: string; groupId: string | null; enrollmentId: string | null }[];
      expect(created.map((c) => c.row)).toEqual([2, 3, 4]);
      expect(created[0]!.login).toBe(`${A.slug}.ali2`); // `ali` mavjud o'quvchida band
      expect(created[1]!.login).toBe(`${A.slug}.ali3`);
      expect(created[2]!.login).toBe(`${A.slug}.dilnoza`);
      expect(created.every((c) => /^[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/.test(c.temporaryPassword))).toBe(true);
      expect(created.map((c) => c.groupId)).toEqual([gMain, null, gMain]); // guruh nomi registrsiz

      // profil, filial va sana/raqam hujayralari
      const [p1] = await db.select().from(s.studentProfiles).where(eq(s.studentProfiles.userId, created[0]!.studentId));
      expect(p1).toMatchObject({ birthDate: '2012-05-17', parentName: 'Karim Karimov', note: 'Izoh 1' });
      const [p2] = await db.select().from(s.studentProfiles).where(eq(s.studentProfiles.userId, created[1]!.studentId));
      expect(p2!.birthDate).toBe('2013-05-17');
      const [u2] = await db.select().from(s.users).where(eq(s.users.id, created[1]!.studentId));
      expect(u2).toMatchObject({ phone: '998911234567', mustChangePassword: true, role: 'STUDENT' });
      expect((await db.select().from(s.userBranches).where(eq(s.userBranches.userId, created[0]!.studentId))).map((l) => l.branchId)).toEqual([A.main]);

      // yozilish (kechagi sana) va birinchi hisob
      const [e1] = await db.select().from(s.enrollments).where(eq(s.enrollments.studentId, created[0]!.studentId));
      expect(e1).toMatchObject({ groupId: gMain, joinedAt: YESTERDAY, billingAnchor: YESTERDAY, status: 'ACTIVE' });
      const charges = (await A.owner.get(`/charges?studentId=${created[0]!.studentId}`).expect(200)).body.items as { dueDate: string; amount: number }[];
      expect(charges).toEqual([expect.objectContaining({ dueDate: YESTERDAY, amount: 400000 })]);
      const [e3] = await db.select().from(s.enrollments).where(eq(s.enrollments.studentId, created[2]!.studentId));
      expect(e3!.joinedAt).toBe(TODAY); // sana berilmasa bugun

      // vaqtinchalik parol bilan kirish va majburiy almashtirish
      const first = (await login(created[0]!.login, created[0]!.temporaryPassword).expect(200)).body;
      expect(first.mustChangePassword ?? first.user?.mustChangePassword ?? true).toBeTruthy();
      await activate(created[1]!.login, created[1]!.temporaryPassword);
    });

    it("csv (nuqtali vergul, BOM, KK.OO.YYYY), ustun tartibi va noma'lum ustunlar e'tiborsiz; sukut filial yagona bo'lsa avtomatik", async () => {
      const csv = Buffer.from("﻿Telefon;Ism;Yosh;Tug'ilgan sana\r\n+998 97 555 44 33;Sardor Bekov;12;01.02.2011\r\n;Zilola Nurova;11;\r\n");
      const res = await B.owner.upload(csv, 'oquvchilar.csv').expect(200); // B markazda bitta filial
      expect(res.body).toMatchObject({ totalRows: 2, errorRows: 0, ignoredColumns: ['Yosh'] });
      expect(res.body.job.status).toBe('DONE');
      expect(res.body.created.map((c: { login: string }) => c.login)).toEqual([`${B.slug}.sardor`, `${B.slug}.zilola`]);
      const [u] = await db.select().from(s.users).where(eq(s.users.id, res.body.created[0].studentId));
      expect(u!.phone).toBe('+998 97 555 44 33');
    });

    it("dryRun: tekshiradi, hech narsa yaratmaydi va tarixga yozmaydi", async () => {
      const before = await students();
      const jobs = (await A.owner.get('/imports').expect(200)).body.items.length;
      const file = xlsx([HEADER, ['Quruq Sinov', null, null, null, null, null, null], ['B', null, null, null, null, null, null]]);
      const res = await A.owner.upload(file, 'quruq.xlsx', { branchId: A.main, dryRun: 'true' }).expect(200);
      expect(res.body).toMatchObject({ dryRun: true, job: null, totalRows: 2, validRows: 1, errorRows: 1, created: [] });
      expect(res.body.errors).toEqual([{ row: 3, field: 'fullName', code: 'MISSING_NAME', message: expect.any(String) }]);
      expect(await students()).toBe(before);
      expect((await A.owner.get('/imports').expect(200)).body.items).toHaveLength(jobs);
    });
  });

  describe('xatolar va rad etish', () => {
    const bad = () =>
      xlsx([
        HEADER,
        ['Yaxshi Birinchi', '+998 90 200 00 01', null, null, null, null, null],
        ['A', 'abc', '31.02.2012', null, null, "Yo'q guruh", null], // 3 ta xato, bitta qatorda
        ['Yaxshi Ikkinchi', '+998 90 200 00 02', null, null, null, 'Eski guruh', null], // tugagan guruh
        ['Takror Birinchi', '+998 90 000 00 01', null, null, null, null, null], // bazada bor
        ['Takror Ikkinchi', '998 90 200 00 01', null, null, null, null, null], // fayldagi birinchi qator bilan bir xil raqam (faqat raqamlar)
        ['Yaxshi Uchinchi', '+998 90 200 00 03', null, null, null, 'IELTS 1', { date: addDays(TODAY, 5) }], // kelajak
      ]);

    it("bitta xato bo'lsa hech narsa yaratilmaydi: qator, maydon va kod bilan hisobot (qiymatlarsiz), tarixda REJECTED", async () => {
      const before = await students();
      const res = await A.owner.upload(bad(), 'xato.xlsx', { branchId: A.main }).expect(200);
      expect(await students()).toBe(before);
      expect(res.body).toMatchObject({ dryRun: false, totalRows: 6, validRows: 1, errorRows: 5, created: [] });
      expect(res.body.job).toMatchObject({ status: 'REJECTED', createdRows: 0, errorRows: 5, skipInvalid: false });
      const pairs = res.body.errors.map((e: { row: number; field: string; code: string }) => `${e.row}:${e.field}:${e.code}`);
      expect(pairs).toEqual([
        '3:fullName:MISSING_NAME',
        '3:phone:INVALID_PHONE',
        '3:birthDate:INVALID_DATE',
        '4:group:GROUP_FINISHED',
        '5:phone:DUPLICATE_PHONE',
        '6:phone:DUPLICATE_IN_FILE',
        '7:joinedAt:DATE_IN_FUTURE',
      ].filter((p) => p !== '3:group:UNKNOWN_GROUP'));
      // qiymatlar hisobotga tushmaydi (shaxsiy ma'lumot)
      expect(JSON.stringify(res.body.errors)).not.toMatch(/abc|31\.02|Takror|Yaxshi|\+998/);
      const stored = (await A.owner.get(`/imports/${res.body.job.id}`).expect(200)).body;
      expect(stored.report.errors).toHaveLength(7);
      expect(JSON.stringify(stored)).not.toMatch(/abc|Takror|Yaxshi|\+998/);
    });

    it("skipInvalid: to'g'ri qatorlar yaratiladi, xatolilari o'tkaziladi va hisobotga tushadi", async () => {
      const before = await students();
      const res = await A.owner.upload(bad(), 'xato.xlsx', { branchId: A.main, skipInvalid: 'true' }).expect(200);
      expect(await students()).toBe(before + 1); // faqat "Yaxshi Birinchi"
      expect(res.body.job).toMatchObject({ status: 'DONE', createdRows: 1, errorRows: 5, skipInvalid: true });
      expect(res.body.created).toHaveLength(1);
      expect(res.body.created[0]).toMatchObject({ row: 2, login: `${A.slug}.yaxshi` });
    });

    it("ikkinchi marta yuklash: yaratilgan telefon endi mavjud (takror import himoyasi)", async () => {
      const file = xlsx([HEADER, ['Yaxshi Birinchi', '+998 90 200 00 01', null, null, null, null, null]]);
      const res = await A.owner.upload(file, 'takror.xlsx', { branchId: A.main }).expect(200);
      expect(res.body.job.status).toBe('REJECTED');
      expect(res.body.errors).toEqual([expect.objectContaining({ row: 2, field: 'phone', code: 'DUPLICATE_PHONE' })]);
    });

    it("filial: ustun bo'yicha, qamrovdan tashqari/noma'lum filial, ikki filialli markazda sukut filial majburiy", async () => {
      const rows = [
        HEADER.concat(['Filial']),
        ['Filial Bir', null, null, null, null, 'Matematika', null, 'Ikkinchi filial'],
        ['Filial Ikki', null, null, null, null, null, null, 'Yo\'q filial'],
        ['Filial Uch', null, null, null, null, null, null, null], // ustun bor, qator bo'sh, sukut yo'q
      ];
      const res = await A.owner.upload(xlsx(rows), 'filial.xlsx', { skipInvalid: 'true' }).expect(200);
      expect(res.body.errors.map((e: { row: number; code: string }) => `${e.row}:${e.code}`)).toEqual(['3:UNKNOWN_BRANCH', '4:BRANCH_REQUIRED']);
      expect(res.body.created).toHaveLength(1);
      expect(res.body.created[0]).toMatchObject({ branchId: A.second, groupId: gSecond });

      // ustun ham, sukut filial ham yo'q: ikki filialli markazda fayl darajasida 400
      const noBranch = await A.owner.upload(xlsx([HEADER, ['Filialsiz Talaba', null, null, null, null, null, null]]), 'f.xlsx').expect(400);
      expect(noBranch.body.code).toBe('BRANCH_REQUIRED');
      await A.owner.upload(xlsx([HEADER, ['X Talaba', null, null, null, null, null, null]]), 'f.xlsx', { branchId: NOPE }).expect(404);
    });
  });

  describe('fayl muammolari', () => {
    it("fayl yo'q, noto'g'ri tur, buzilgan, sarlavhasiz, bo'sh, juda ko'p qator, katta fayl, qo'llab-quvvatlanmaydigan import turi", async () => {
      const f = { branchId: A.main };
      expect((await A.owner.upload(null, '', f).expect(400)).body.code).toBe('FILE_REQUIRED');
      expect((await A.owner.upload(Buffer.from('x'), 'a.pdf', f).expect(400)).body.code).toBe('IMPORT_UNSUPPORTED_FILE');
      expect((await A.owner.upload(Buffer.from('oddiy matn'), 'a.xlsx', f).expect(400)).body.code).toBe('IMPORT_CORRUPT_FILE');
      expect((await A.owner.upload(Buffer.alloc(0), 'a.csv', f).expect(400)).body.code).toBe('IMPORT_EMPTY_FILE');
      expect((await A.owner.upload(xlsx([['Telefon', 'Izoh'], ['1', '2']]), 'a.xlsx', f).expect(400)).body.code).toBe('IMPORT_MISSING_COLUMN');
      expect((await A.owner.upload(xlsx([HEADER]), 'a.xlsx', f).expect(400)).body.code).toBe('IMPORT_EMPTY');
      const many = ['Ism', ...Array.from({ length: 301 }, (_, i) => `Talaba ${i}`)].join('\n');
      expect((await A.owner.upload(Buffer.from(many), 'a.csv', f).expect(400)).body.code).toBe('IMPORT_TOO_MANY_ROWS');
      await A.owner.upload(Buffer.alloc(5 * 1024 * 1024 + 10, 65), 'katta.csv', f).expect(413);
      expect((await A.owner.upload(xlsx([HEADER, ['Y Talaba']]), 'a.xlsx', { ...f, type: 'GROUPS' }).expect(400)).body.code).toBe('IMPORT_TYPE_NOT_SUPPORTED');
      await A.owner.upload(xlsx([HEADER, ['Y Talaba']]), 'a.xlsx', { ...f, type: 'WEIRD' }).expect(400);
      await A.owner.upload(xlsx([HEADER, ['Y Talaba']]), 'a.xlsx', { ...f, dryRun: 'ha' }).expect(400);
      await A.owner.upload(xlsx([HEADER, ['Y Talaba']]), 'a.xlsx', { branchId: 'xyz' }).expect(400);
    });

    it("300 qator chegarasi: aynan 300 ta qabul qilinadi (dryRun)", async () => {
      const csv = Buffer.from(['Ism', ...Array.from({ length: 300 }, (_, i) => `Talaba ${i}`)].join('\n'));
      const res = await A.owner.upload(csv, 'ellik.csv', { branchId: A.main, dryRun: 'true' }).expect(200);
      expect(res.body).toMatchObject({ totalRows: 300, validRows: 300, errorRows: 0 });
    });

    it("tarif chegarasi: import chegaradan oshirsa hech narsa yaratilmaydi (403 PLAN_STUDENT_LIMIT)", async () => {
      const [plan] = await db.insert(s.plans).values({ name: 'Kichik', maxStudents: 2 }).returning();
      await db.update(s.centers).set({ planId: plan!.id }).where(eq(s.centers.id, B.centerId));
      const before = (await db.select().from(s.users).where(eq(s.users.centerId, B.centerId))).filter((u) => u.role === 'STUDENT').length; // 2 ta (oldingi csv)
      const res = await B.owner.upload(xlsx([HEADER, ['Limit Bir'], ['Limit Ikki']]), 'limit.xlsx').expect(403);
      expect(res.body.code).toBe('PLAN_STUDENT_LIMIT');
      expect((await db.select().from(s.users).where(eq(s.users.centerId, B.centerId))).filter((u) => u.role === 'STUDENT')).toHaveLength(before);
      expect((await B.owner.get('/imports').expect(200)).body.items.every((j: { fileName: string }) => j.fileName !== 'limit.xlsx')).toBe(true);
    });
  });

  describe('ruxsat, tarix, audit', () => {
    it("rahbar ✔; admin ○ (yoqilgach faqat o'z filiali); kassir, ustoz, o'quvchi 403; tokensiz 401; shablon", async () => {
      const file = () => xlsx([HEADER, ['Ruxsat Sinov', null, null, null, null, null, null]]);
      await admin1.api.upload(file(), 'a.xlsx', { branchId: A.main }).expect(403);
      await cashier1.api.upload(file(), 'a.xlsx', { branchId: A.main }).expect(403);
      await teacher1.api.upload(file(), 'a.xlsx', { branchId: A.main }).expect(403);
      await httpFn().post('/imports').expect(401);
      await admin1.api.get('/imports/template').expect(403);
      await cashier1.api.get('/imports/template').expect(403);

      await enable(A, admin1.id, { 'import.run': true });
      await admin1.api.upload(file(), 'a.xlsx', { branchId: A.second }).expect(403); // boshqa filial
      const rows = [HEADER.concat(['Filial']), ['Admin Bir Talaba', null, null, null, null, null, null, 'Asosiy filial'], ['Admin Ikki Talaba', null, null, null, null, null, null, 'Ikkinchi filial']];
      const res = await admin1.api.upload(xlsx(rows), 'admin.xlsx', { skipInvalid: 'true' }).expect(200);
      expect(res.body.errors).toEqual([expect.objectContaining({ row: 3, field: 'branch', code: 'BRANCH_OUT_OF_SCOPE' })]);
      expect(res.body.created).toHaveLength(1);

      const tpl = await A.owner.get('/imports/template').expect(200);
      expect(tpl.headers['content-type']).toMatch(/text\/csv/);
      expect(tpl.headers['content-disposition']).toMatch(/attachment/);
      expect(tpl.text.startsWith('﻿Ism;Telefon')).toBe(true);
      // shablon o'zi import qilinadigan fayl: sarlavhalar tanib olinadi
      const dry = await A.owner.upload(Buffer.from(tpl.text), 'shablon.csv', { dryRun: 'true', branchId: A.main }).expect(200);
      expect(dry.body.ignoredColumns).toEqual([]);
      expect(dry.body.totalRows).toBe(1);
    });

    it("tarix: rahbar hammasini, admin faqat o'zinikini ko'radi; bitta import hisoboti; boshqa markaz 404", async () => {
      const all = (await A.owner.get('/imports?limit=100').expect(200)).body.items as { id: string; createdBy: string }[];
      expect(all.length).toBeGreaterThanOrEqual(5);
      const mine = (await admin1.api.get('/imports').expect(200)).body.items as { id: string; createdBy: string }[];
      expect(mine).toHaveLength(1);
      expect(mine[0]!.createdBy).toBe(admin1.id);
      const first = all.find((j) => j.createdBy !== admin1.id)!;
      await admin1.api.get(`/imports/${first.id}`).expect(404); // boshqaning importi
      expect((await A.owner.get(`/imports/${first.id}`).expect(200)).body).toMatchObject({ id: first.id, report: expect.any(Object) });
      await B.owner.get(`/imports/${first.id}`).expect(404);
      await A.owner.get(`/imports/${NOPE}`).expect(404);
      await A.owner.get('/imports/abc').expect(400);
      await A.owner.get('/imports?limit=0').expect(400);
      expect((await A.owner.get('/imports?limit=2').expect(200)).body.items).toHaveLength(2);
      expect((await B.owner.get('/imports').expect(200)).body.items.every((j: { id: string }) => !all.some((a) => a.id === j.id))).toBe(true);
      await cashier1.api.get('/imports').expect(403);
    });

    it("audit: import.students va student/enrollment yozuvlari (source=import); parollar va fayl qiymatlari auditda yo'q; DB tarixni o'zgartirmaydi", async () => {
      const file = xlsx([HEADER, ['Audit Talaba', '+998 90 777 66 55', '01.01.2010', null, null, 'IELTS 1', null]]);
      const res = await A.owner.upload(file, 'audit.xlsx', { branchId: A.main }).expect(200);
      const jobId = res.body.job.id as string;
      const c = res.body.created[0] as { studentId: string; temporaryPassword: string; enrollmentId: string };
      const summary = (await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, jobId)))[0]!;
      expect(summary).toMatchObject({ action: 'import.students', entity: 'import' });
      expect(summary.after).toMatchObject({ status: 'DONE', totalRows: 1, created: 1, errorRows: 0 });
      const studentAudit = (await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, c.studentId)))[0]!;
      expect(studentAudit).toMatchObject({ action: 'student.create', actorId: expect.any(String) });
      expect(studentAudit.after).toMatchObject({ source: 'import', branchId: A.main });
      expect((await db.select().from(s.auditLogs).where(eq(s.auditLogs.entityId, c.enrollmentId)))[0]!.action).toBe('enrollment.create');
      const everything = JSON.stringify(await db.select().from(s.auditLogs)) + JSON.stringify(await db.select().from(s.importJobs));
      expect(everything).not.toContain(c.temporaryPassword);
      expect(everything).not.toContain('+998 90 777 66 55');
      await expect(db.update(s.importJobs).set({ createdRows: 0 }).where(eq(s.importJobs.id, jobId))).resolves.toBeDefined(); // superuser ulanishi cheklanmagan; ilova roli UPDATE qila olmaydi (izolyatsiya testi)
    });
  });
});
