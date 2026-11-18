// Namuna (demo) markaz: frontend'ni lokal sinash uchun API orqali to'ldiradi. FAQAT lokal yoki staging bazada ishlating.
// Hamma ism va raqamlar o'ylab topilgan (haqiqiy shaxslar emas). Ishlab turgan API va super admin kerak:
//   DEMO_API=http://localhost:3001 DEMO_ROOT_LOGIN=root DEMO_ROOT_PASSWORD=... node scripts/demo-seed.mjs
// Yaratilgan foydalanuvchilarning paroli: DEMO_PASSWORD (sukut: Demo-Pass-123). Loginlar oxirida chiqariladi.
const API = process.env.DEMO_API ?? 'http://localhost:3001';
const ROOT_LOGIN = process.env.DEMO_ROOT_LOGIN ?? 'root';
const ROOT_PASSWORD = process.env.DEMO_ROOT_PASSWORD;
const PW = process.env.DEMO_PASSWORD ?? 'Demo-Pass-123';
if (!ROOT_PASSWORD) {
  console.error('DEMO_ROOT_PASSWORD kerak');
  process.exit(2);
}

const call = async (method, path, token, body) => {
  const res = await fetch(API + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(json)}`);
  return json;
};

// Deterministik tasodif (har yurgizishda bir xil manzara)
let seed = 20261119;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const tz = (d) => new Date(d.getTime() + 5 * 3600_000);
const today = tz(new Date()).toISOString().slice(0, 10);
const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);
const weekday = (iso) => ((new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;

async function activate(login, temp) {
  const first = await call('POST', '/auth/login', null, { login, password: temp });
  await call('POST', '/auth/change-password', first.accessToken, { currentPassword: temp, newPassword: PW });
  return (await call('POST', '/auth/login', null, { login, password: PW })).accessToken;
}

const rootLogin = await call('POST', '/auth/login', null, { login: ROOT_LOGIN, password: ROOT_PASSWORD });
if (rootLogin.mustChangePassword) throw new Error("Super admin parolini avval almashtiring (birinchi kirish)");
const root = rootLogin.accessToken;

const stamp = Date.now().toString(36).slice(-4);
const plans = await call('GET', '/admin/plans', root);
let plan = plans.items.find((p) => p.name === 'Standart');
if (!plan) plan = await call('POST', '/admin/plans', root, { name: 'Standart', priceMonthly: 290000, maxStudents: 500, maxBranches: 5, features: { telegram: true } });
const created = await call('POST', '/admin/centers', root, { name: `Namuna o'quv markazi ${stamp}`, ownerFullName: 'Dilshod Rahimov', planId: plan.id, trialDays: 0 });
const owner = await activate(created.owner.login, created.owner.temporaryPassword);
const main = created.branch.id;
await call('PATCH', `/branches/${main}`, owner, { name: 'Chilonzor filiali', address: 'Chilonzor tumani' });
const second = (await call('POST', '/branches', owner, { name: 'Yunusobod filiali', address: 'Yunusobod tumani' })).id;
await call('PATCH', '/center/settings', owner, { graceDays: 3, billingMode: 'STUDENT_CYCLE' });

const logins = [['Rahbar', created.owner.login]];
async function staff(role, fullName, branchIds, extra = {}) {
  const r = await call('POST', '/staff', owner, { role, fullName, branchIds, ...extra });
  await activate(r.user.login, r.temporaryPassword);
  logins.push([{ ADMIN: 'Administrator', CASHIER: 'Kassir', TEACHER: 'Ustoz' }[role], r.user.login]);
  return r.user.id;
}
const admin = await staff('ADMIN', 'Malika Yusupova', [main]);
await staff('CASHIER', 'Shahzod Qodirov', [main, second]);
const t1 = await staff('TEACHER', 'Nodira Karimova', [main], { specialization: 'Ingliz tili' });
const t2 = await staff('TEACHER', 'Jamshid Ergashev', [main, second], { specialization: 'Matematika' });
const t3 = await staff('TEACHER', 'Gulnoza Tursunova', [second], { specialization: 'Rus tili' });
await call('PUT', `/permissions/users/${admin}`, owner, { permissions: { 'payment.create': true, 'payment.view': true, 'debtors.view': true, 'attendance.mark': true, 'import.run': true } });

const eng = (await call('POST', '/courses', owner, { name: 'Ingliz tili', defaultPrice: 450000 })).id;
const math = (await call('POST', '/courses', owner, { name: 'Matematika', defaultPrice: 400000 })).id;
const rus = (await call('POST', '/courses', owner, { name: 'Rus tili', defaultPrice: 380000 })).id;

const start = addDays(today, -75);
const groupsDef = [
  { name: 'IELTS 6.5 kechki', courseId: eng, branchId: main, priceMonthly: 550000, teacher: t1, days: [1, 3, 5], time: ['18:00', '19:30'], room: '12-xona' },
  { name: 'General English B1', courseId: eng, branchId: main, priceMonthly: 450000, teacher: t1, days: [2, 4, 6], time: ['16:00', '17:30'], room: '12-xona' },
  { name: 'Matematika DTM', courseId: math, branchId: main, priceMonthly: 400000, teacher: t2, days: [1, 3, 5], time: ['15:00', '16:30'], room: '7-xona' },
  { name: 'Matematika 9-sinf', courseId: math, branchId: second, priceMonthly: 350000, teacher: t2, days: [2, 4], time: ['17:00', '18:30'], room: '3-xona' },
  { name: "Rus tili boshlang'ich", courseId: rus, branchId: second, priceMonthly: 380000, teacher: t3, days: [1, 4], time: ['10:00', '11:30'], room: '5-xona' },
];
const groups = [];
for (const g of groupsDef) {
  const r = await call('POST', '/groups', owner, {
    name: g.name, courseId: g.courseId, branchId: g.branchId, priceMonthly: g.priceMonthly, billingMode: 'STUDENT_CYCLE', status: 'ACTIVE', startDate: start,
    schedule: g.days.map((d) => ({ weekday: d, startTime: g.time[0], endTime: g.time[1], room: g.room })),
  });
  await call('POST', `/groups/${r.id}/teachers`, owner, { teacherId: g.teacher, kind: 'MAIN', fromDate: start });
  groups.push({ ...g, id: r.id, students: [] });
}

const first = ['Aziz', 'Bekzod', 'Dilnoza', 'Elyor', 'Feruza', 'Gavhar', 'Hasan', 'Iroda', 'Javohir', 'Kamola', 'Lola', 'Mirzo', 'Nilufar', 'Otabek', 'Parizoda', 'Rustam', 'Sevara', 'Temur', 'Umida', 'Zarina', 'Sardor', 'Madina', 'Akmal', 'Shoira', 'Bobur', 'Nargiza', 'Islom', 'Muslima'];
const last = ['Aliyev', 'Karimov', 'Toshmatov', 'Rahimov', 'Sobirov', 'Nazarov', 'Umarov', 'Qosimov', 'Ismoilov', 'Hamidov', 'Xolmatov', 'Yoqubov'];
const femaleish = new Set(['Dilnoza', 'Feruza', 'Gavhar', 'Iroda', 'Kamola', 'Lola', 'Nilufar', 'Parizoda', 'Sevara', 'Umida', 'Zarina', 'Madina', 'Shoira', 'Nargiza', 'Muslima']);
const students = [];
for (let i = 0; i < 28; i++) {
  const f = first[i];
  const l = pick(last);
  const fullName = `${f} ${femaleish.has(f) ? `${l}a` : l}`;
  const g = groups[i % groups.length];
  const r = await call('POST', '/students', owner, {
    fullName, branchId: g.branchId, phone: `+998 9${i % 10} ${String(100 + i * 7).padStart(3, '0')} ${String(10 + i).padStart(2, '0')} ${String(30 + i).padStart(2, '0')}`,
    parentName: `${pick(['Anvar', 'Botir', 'Shuhrat', 'Ravshan', 'Zafar'])} ${l}`, parentPhone: `+998 93 ${String(200 + i).padStart(3, '0')} 44 ${String(10 + i).padStart(2, '0')}`,
  });
  students.push({ id: r.student.id, login: r.student.login, temp: r.temporaryPassword, g });
}
// Yozilishlar: ko'pchilik 60 kun oldin, ba'zilari yaqinda; ikkinchi guruhga ham yozilganlar
for (const [i, s] of students.entries()) {
  const joined = i % 6 === 5 ? addDays(today, -12) : addDays(today, -60 + (i % 4));
  const e = await call('POST', '/enrollments', owner, { groupId: s.g.id, studentId: s.id, joinedAt: joined });
  s.g.students.push(s.id);
  s.enrollmentId = e.id;
  if (i % 9 === 0 && s.g.branchId === main) {
    const other = groups.find((x) => x.branchId === main && x.id !== s.g.id);
    await call('POST', '/enrollments', owner, { groupId: other.id, studentId: s.id, joinedAt: addDays(today, -30) });
    other.students.push(s.id);
  }
}
// Chegirma (aka-uka uchun 10%)
await call('POST', `/enrollments/${students[2].enrollmentId}/discounts`, owner, { type: 'PERCENT', value: 10, reason: 'Aka-uka chegirmasi' }).catch(() => {});

// To'lovlar: ko'pchilik to'lagan, bir qismi qisman, bir qismi qarzdor
for (const [i, s] of students.entries()) {
  const bal = await call('GET', `/students/${s.id}/balance`, owner);
  const due = bal.debt;
  if (!due) continue;
  const mode = i % 7;
  const amount = mode === 0 ? 0 : mode === 1 ? Math.round(due / 2 / 1000) * 1000 : mode === 2 ? Math.min(due, bal.openCharges[0]?.remaining ?? due) : due;
  if (amount > 0) {
    await call('POST', '/payments', owner, { studentId: s.id, amount, method: pick(['CASH', 'CASH', 'CARD', 'TRANSFER']), branchId: s.g.branchId, paidAt: new Date(Date.now() - (i % 20) * 86400_000).toISOString() });
  }
}

// Darslar va davomat: so'nggi 10 kun, jadval bo'yicha
for (const g of groups) {
  for (let d = 10; d >= 0; d--) {
    const day = addDays(today, -d);
    if (!g.days.includes(weekday(day))) continue;
    const lesson = await call('POST', `/groups/${g.id}/lessons`, owner, { lessonDate: day, topic: pick(['Takrorlash', 'Yangi mavzu', 'Nazorat ishi', 'Mashqlar', 'Grammatika']) });
    if (!g.students.length) continue;
    const records = g.students.map((sid) => ({ studentId: sid, status: rnd() < 0.82 ? 'PRESENT' : rnd() < 0.5 ? 'LATE' : 'ABSENT' }));
    await call('PUT', `/lessons/${lesson.id}/attendance`, owner, { records }).catch(() => {});
  }
}

// Xarajatlar
for (const [cat, amount, days] of [['Ijara', 6_000_000, 18], ['Kommunal', 850_000, 12], ['Reklama', 1_200_000, 6], ['Kanselyariya', 240_000, 2]]) {
  await call('POST', '/expenses', owner, { category: cat, amount, branchId: main, spentOn: addDays(today, -days), note: `${cat} uchun` });
}

// Maosh qoidalari
await call('POST', '/payroll/rules', owner, { employeeId: t1, type: 'PERCENT', percent: 40, percentBase: 'PAID', validFrom: addDays(today, -90) });
await call('POST', '/payroll/rules', owner, { employeeId: t2, type: 'PER_LESSON', amount: 120000, validFrom: addDays(today, -90) });
await call('POST', '/payroll/rules', owner, { employeeId: t3, type: 'FIXED', amount: 3_500_000, validFrom: addDays(today, -90) });
await call('POST', '/payroll/rules', owner, { employeeId: admin, type: 'FIXED', amount: 4_000_000, validFrom: addDays(today, -90) });

// Vazifalar
const t1Token = (await call('POST', '/auth/login', null, { login: logins.find((l) => l[0] === 'Ustoz')[1], password: PW })).accessToken;
await call('POST', `/groups/${groups[0].id}/assignments`, t1Token, { title: 'Writing Task 2: insho', description: '250 so\'zdan kam bo\'lmagan insho yozing.', dueAt: new Date(Date.now() + 2 * 86400_000).toISOString(), maxScore: 9 });
await call('POST', `/groups/${groups[1].id}/assignments`, t1Token, { title: 'Unit 5 lug\'at', dueAt: new Date(Date.now() + 20 * 3600_000).toISOString() });

// Bitta o'quvchi akkaunti faollashtiriladi (o'quvchi kabineti uchun)
const demoStudent = students[3];
await activate(demoStudent.login, demoStudent.temp);
logins.push(["O'quvchi", demoStudent.login]);

console.log(`\nNamuna markaz tayyor: ${created.center.name}`);
console.log(`Hamma parollar: ${PW}`);
for (const [role, login] of logins) console.log(`  ${role.padEnd(14)} ${login}`);
