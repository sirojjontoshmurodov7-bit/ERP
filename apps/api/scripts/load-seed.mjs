// Yuk sinovi uchun katta markaz (faqat API orqali, hamma qoidalar ishlaydi). ALOHIDA bazada ishlating (masalan erp_load).
//   LOAD_API=http://localhost:3031 LOAD_ROOT_LOGIN=... LOAD_ROOT_PASSWORD=... node scripts/load-seed.mjs
// Hajm: LOAD_BRANCHES (5), LOAD_GROUPS_PER_BRANCH (20), LOAD_STUDENTS_PER_GROUP (20), LOAD_MONTHS (12), LOAD_CONCURRENCY (8).
// Natija (rahbar logini/paroli) scripts/.load-owner.json ga yoziladi (gitignore).
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const API = (process.env.LOAD_API ?? 'http://localhost:3031').replace(/\/+$/, '');
const N = (k, d) => Number(process.env[k] ?? d);
const BRANCHES = N('LOAD_BRANCHES', 5);
const GROUPS_PER_BRANCH = N('LOAD_GROUPS_PER_BRANCH', 20);
const STUDENTS_PER_GROUP = N('LOAD_STUDENTS_PER_GROUP', 20);
const MONTHS = N('LOAD_MONTHS', 12);
const CONC = N('LOAD_CONCURRENCY', 8);
const DAY = 86_400_000;
const today = () => new Date(Date.now() + 5 * 3_600_000).toISOString().slice(0, 10);
const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const weekday = (iso) => ((new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;
let seed = 42;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const NAMES = ['Ali', 'Vali', 'Aziz', 'Dilshod', 'Jasur', 'Sardor', 'Malika', 'Nilufar', 'Zarina', 'Kamola', 'Bekzod', 'Otabek', 'Shahzod', 'Madina', 'Gulnoza', 'Sherzod', 'Akmal', 'Dilnoza', 'Sevara', 'Bobur'];
const SURNAMES = ['Karimov', 'Aliyev', 'Toshmatov', 'Rahimov', 'Yusupov', 'Nazarov', 'Saidov', 'Qodirov', 'Ergashev', 'Hasanov'];

async function call(method, path, token, body) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(API + path, {
      method,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    if (res.ok) return text ? JSON.parse(text) : {};
    if (res.status >= 500 && attempt < 2) continue;
    throw new Error(`${method} ${path}: ${res.status} ${text.slice(0, 200)}`);
  }
}
const login = (l, p) => call('POST', '/auth/login', null, { login: l, password: p });

async function pool(items, fn, label) {
  let i = 0;
  let done = 0;
  const t0 = Date.now();
  const out = new Array(items.length);
  await Promise.all(
    Array.from({ length: Math.min(CONC, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k], k);
        if (++done % 250 === 0) console.log(`  ${label}: ${done}/${items.length}`);
      }
    }),
  );
  console.log(`${label}: ${items.length} ta, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  return out;
}

async function rootToken() {
  const l = process.env.LOAD_ROOT_LOGIN;
  const p = process.env.LOAD_ROOT_PASSWORD;
  if (!l || !p) throw new Error('LOAD_ROOT_LOGIN va LOAD_ROOT_PASSWORD kerak');
  try {
    return (await login(l, `${p}-load`)).accessToken;
  } catch {
    const s = await login(l, p);
    if (!s.mustChangePassword) return s.accessToken;
    await call('POST', '/auth/change-password', s.accessToken, { currentPassword: p, newPassword: `${p}-load` });
    return (await login(l, `${p}-load`)).accessToken;
  }
}

const root = await rootToken();
const stamp = Date.now().toString(36);
const c = await call('POST', '/admin/centers', root, { name: `Yuk Markazi ${stamp}`, slug: `yuk-${stamp}`, ownerFullName: 'Yuk Rahbar' });
const ownerPw = `Load-${randomBytes(8).toString('base64url')}`;
const o1 = await login(c.owner.login, c.owner.temporaryPassword);
await call('POST', '/auth/change-password', o1.accessToken, { currentPassword: c.owner.temporaryPassword, newPassword: ownerPw });
const ot = (await login(c.owner.login, ownerPw)).accessToken;
writeFileSync(new URL('./.load-owner.json', import.meta.url), JSON.stringify({ api: API, login: c.owner.login, password: ownerPw }, null, 2));
console.log(`Markaz: ${c.center.name}, rahbar: ${c.owner.login}`);
await call('PATCH', '/center/settings', ot, { attendanceLockDays: 365 });

const branches = [c.branch];
for (let b = 1; b < BRANCHES; b++) branches.push(await call('POST', '/branches', ot, { name: `Filial ${b + 1}` }));
const course = await call('POST', '/courses', ot, { name: 'Ingliz tili', defaultPrice: 400_000 });

const teachers = await pool(
  branches.flatMap((br, bi) => Array.from({ length: 4 }, (_, k) => ({ br, name: `Ustoz ${bi + 1}-${k + 1}`, login: `yuk-${stamp}.t${bi + 1}-${k + 1}` }))),
  async (t) => ({ branchId: t.br.id, id: (await call('POST', '/staff', ot, { role: 'TEACHER', fullName: t.name, login: t.login, branchIds: [t.br.id] })).user.id }),
  'ustozlar',
);

const start = addDays(today(), -MONTHS * 30);
const slots = [
  [1, 3, 5],
  [2, 4, 6],
];
const groups = await pool(
  branches.flatMap((br, bi) => Array.from({ length: GROUPS_PER_BRANCH }, (_, k) => ({ br, bi, k }))),
  async ({ br, bi, k }) => {
    const days = slots[k % 2];
    const hour = 8 + (k % 10);
    const g = await call('POST', '/groups', ot, {
      name: `G-${bi + 1}-${k + 1}`,
      courseId: course.id,
      branchId: br.id,
      status: 'ACTIVE',
      startDate: start,
      schedule: days.map((d) => ({ weekday: d, startTime: `${String(hour).padStart(2, '0')}:00`, endTime: `${String(hour).padStart(2, '0')}:50` })),
    });
    const t = teachers.filter((x) => x.branchId === br.id)[k % 4];
    await call('POST', `/groups/${g.id}/teachers`, ot, { teacherId: t.id, kind: 'MAIN', fromDate: start });
    return { id: g.id, branchId: br.id, days };
  },
  'guruhlar',
);

const studentSpecs = groups.flatMap((g) => Array.from({ length: STUDENTS_PER_GROUP }, () => ({ g })));
const students = await pool(
  studentSpecs,
  async ({ g }, i) => {
    const s = await call('POST', '/students', ot, { fullName: `${pick(NAMES)} ${pick(SURNAMES)} ${i + 1}`, branchId: g.branchId, login: `yuk-${stamp}.s${i + 1}` }); // parallel yaratishda avtomatik login to'qnashmasin
    const joinedAt = addDays(start, Math.floor(rnd() * (MONTHS - 1) * 30));
    await call('POST', '/enrollments', ot, { groupId: g.id, studentId: s.student.id, joinedAt });
    return { id: s.student.id, g, joinedAt };
  },
  "o'quvchilar va yozilishlar",
);

const payments = students.flatMap((s) => {
  if (rnd() < 0.2) return []; // 20% umuman to'lamagan
  const months = Math.max(1, Math.floor((Date.parse(today()) - Date.parse(s.joinedAt)) / (30 * DAY)));
  const paid = Math.max(1, Math.floor(months * (0.5 + rnd() * 0.6)));
  return Array.from({ length: paid }, (_, m) => ({ studentId: s.id, paidAt: addDays(s.joinedAt, m * 30 + 2) }));
});
await pool(
  payments.filter((p) => p.paidAt <= today()),
  (p) => call('POST', '/payments', ot, { studentId: p.studentId, amount: 400_000, method: pick(['CASH', 'CARD', 'TRANSFER']), paidAt: `${p.paidAt}T10:00:00+05:00` }),
  "to'lovlar",
);

// Davomat: so'nggi 10 hafta, har guruhning jadval kunlari
const lessonDays = [];
for (let d = 1; d <= 70; d++) lessonDays.push(addDays(today(), -d));
const byGroup = new Map(groups.map((g) => [g.id, students.filter((s) => s.g.id === g.id)]));
const lessons = groups.flatMap((g) => lessonDays.filter((d) => g.days.includes(weekday(d))).map((d) => ({ g, d })));
await pool(
  lessons,
  async ({ g, d }) => {
    const l = await call('POST', `/groups/${g.id}/lessons`, ot, { lessonDate: d });
    const members = byGroup.get(g.id).filter((s) => s.joinedAt <= d);
    if (!members.length) return;
    const records = members.map((s) => ({ studentId: s.id, status: rnd() < 0.85 ? 'PRESENT' : rnd() < 0.5 ? 'LATE' : 'ABSENT' }));
    await call('PUT', `/lessons/${l.id}/attendance`, ot, { records });
  },
  'darslar va davomat',
);
console.log('Tayyor.');
