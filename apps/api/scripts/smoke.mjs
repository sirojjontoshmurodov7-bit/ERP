// Ishlab turgan API ustida tutun testi (smoke): super admin -> tarif -> markaz -> filial/kurs/ustoz/guruh/o'quvchi ->
// yozilish, hisob, to'lov va qaytarish, dars/davomat/qulf, hisobotlar, Telegram kodi, audit, login cheklovi, refresh.
// Faqat lokal yoki staging bazada ishlating: yangi markaz va yozuvlar yaratadi.
//   SMOKE_API=http://localhost:3001 SMOKE_LOGIN=root SMOKE_PASSWORD=... [SMOKE_NEW_PASSWORD=...] node scripts/smoke.mjs
const API = process.env.SMOKE_API ?? 'http://localhost:3001';
const LOGIN = process.env.SMOKE_LOGIN ?? 'root';
const PASSWORD = process.env.SMOKE_PASSWORD;
const NEW_PASSWORD = process.env.SMOKE_NEW_PASSWORD ?? `${PASSWORD}-2`;
if (!PASSWORD) { console.error('SMOKE_PASSWORD kerak'); process.exit(2); }
const call = async (method, path, token, body) => {
  const res = await fetch(API + path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
};
const must = (r, status, label) => { if (r.status !== status) { console.error(`XATO ${label}: ${r.status}`, JSON.stringify(r.body)); process.exit(1); } console.log(`ok  ${label} (${status})`); return r.body; };

for (let i = 0; i < 40; i++) { try { await fetch(API); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }

const first = must(await call('POST', '/auth/login', null, { login: LOGIN, password: PASSWORD }), 200, 'super admin login');
let root = first.accessToken;
if (first.mustChangePassword) {
  must(await call('POST', '/auth/change-password', root, { currentPassword: PASSWORD, newPassword: NEW_PASSWORD }), 204, 'majburiy parol almashtirish');
  root = must(await call('POST', '/auth/login', null, { login: LOGIN, password: NEW_PASSWORD }), 200, 'qayta login').accessToken;
}
const plan = must(await call('POST', '/admin/plans', root, { name: `Smoke ${Date.now()}`, maxStudents: 100 }), 201, 'tarif yaratish');
const c = must(await call('POST', '/admin/centers', root, { name: `Smoke Markaz ${Date.now()}`, ownerFullName: 'Smoke Rahbar', planId: plan.id }), 201, 'markaz yaratish');
const t0 = must(await call('POST', '/auth/login', null, { login: c.owner.login, password: c.owner.temporaryPassword }), 200, 'rahbar login').accessToken;
must(await call('POST', '/auth/change-password', t0, { currentPassword: c.owner.temporaryPassword, newPassword: 'Owner-Pass-123' }), 204, 'rahbar parol');
const owner = must(await call('POST', '/auth/login', null, { login: c.owner.login, password: 'Owner-Pass-123' }), 200, 'rahbar qayta login');
const ot = owner.accessToken;
must(await call('PATCH', '/center/settings', ot, { graceDays: 3 }), 200, 'markaz sozlamalari');
const branch = must(await call('POST', '/branches', ot, { name: 'Smoke filial' }), 201, 'filial');
const course = must(await call('POST', '/courses', ot, { name: 'Matematika', defaultPrice: 300000 }), 201, 'kurs');
const teacher = must(await call('POST', '/staff', ot, { role: 'TEACHER', fullName: 'Smoke Ustoz', branchIds: [c.branch.id] }), 201, 'ustoz');
const group = must(await call('POST', '/groups', ot, { name: 'Smoke guruh', courseId: course.id, branchId: c.branch.id, priceMonthly: 300000, billingMode: 'STUDENT_CYCLE', status: 'ACTIVE', schedule: [{ weekday: 1, startTime: '10:00', endTime: '11:30' }] }), 201, 'guruh + jadval');
must(await call('POST', `/groups/${group.id}/teachers`, ot, { teacherId: teacher.user.id, kind: 'MAIN' }), 200, 'ustoz biriktirish');
const st = must(await call('POST', '/students', ot, { fullName: 'Smoke Talaba', branchId: c.branch.id, phone: '+998 90 111 22 33' }), 201, "o'quvchi");
const yesterday = new Date(Date.now() - 86400000 + 5 * 3600000).toISOString().slice(0, 10);
const enr = must(await call('POST', '/enrollments', ot, { groupId: group.id, studentId: st.student.id, joinedAt: yesterday }), 201, 'yozilish (kecha)');
const charges = must(await call('GET', `/charges?studentId=${st.student.id}`, ot), 200, 'hisoblar');
if (!charges.items.length) { console.error('XATO: hisob yaratilmagan'); process.exit(1); }
must(await call('GET', '/debtors', ot), 200, 'qarzdorlar');
const pay = must(await call('POST', '/payments', ot, { studentId: st.student.id, amount: 100000, method: 'CASH', branchId: c.branch.id }), 201, "to'lov");
must(await call('POST', `/payments/${pay.id ?? pay.payment?.id}/reverse`, ot, { reason: 'Smoke qaytarish' }), 200, "to'lovni qaytarish");
const lesson = must(await call('POST', `/groups/${group.id}/lessons`, ot, { lessonDate: yesterday }), 201, 'dars');
must(await call('PUT', `/lessons/${lesson.id}/attendance`, ot, { records: [{ studentId: st.student.id, status: 'PRESENT' }] }), 200, 'davomat');
must(await call('POST', `/lessons/${lesson.id}/lock`, ot), 200, 'dars qulfi');
must(await call('GET', '/reports/overview', ot), 200, 'umumiy hisobot');
must(await call('GET', '/reports/finance/summary', ot), 200, 'moliya hisoboti');
must(await call('GET', '/ratings?scope=center', ot), 200, 'reyting');
must(await call('POST', '/notifications/link-code', ot), 200, 'telegram kod');
must(await call('GET', '/audit', ot), 200, 'audit');
// login cheklovi bazada
for (let i = 0; i < 5; i++) await call('POST', '/auth/login', null, { login: 'smoke.nobody', password: 'xato-parol-1' });
must(await call('POST', '/auth/login', null, { login: 'smoke.nobody', password: 'xato-parol-1' }), 429, 'login cheklovi (bazada)');
must(await call('POST', '/auth/refresh', null, { refreshToken: owner.refreshToken }), 200, 'refresh');
console.log(`HAMMASI OK (yozilish ${enr.id ?? ''})`);
