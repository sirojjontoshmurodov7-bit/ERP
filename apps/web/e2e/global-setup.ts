// E2E ma'lumoti API orqali: har ishga tushirishda yangi sinov markazi (rahbar, ustoz, guruh bugungi jadval bilan, o'quvchi).
// Natija e2e/.data.json ga yoziladi (gitignore). Mavjud markazlarga tegilmaydi.
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export interface E2EData {
  stamp: string;
  root: { login: string; password: string };
  center: { id: string; name: string };
  owner: { login: string; password: string; fullName: string };
  teacher: { login: string; temp: string; fullName: string };
  student: { login: string; temp: string; fullName: string; id: string };
  group: { id: string; name: string };
}

// Playwright konfiguratsiyasi apps/web ichidan ishga tushiriladi (CJS transpilyatsiya: import.meta yo'q)
export const DATA_FILE = join(process.cwd(), 'e2e', '.data.json');
const API = (process.env.E2E_API_URL ?? 'http://localhost:3001').replace(/\/+$/, '');

async function call<T>(method: string, path: string, token: string | null, body?: unknown): Promise<T> {
  const res = await fetch(API + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path}: HTTP ${res.status} ${text.slice(0, 200)}`);
  return (text ? JSON.parse(text) : {}) as T;
}
type Session = { accessToken: string; mustChangePassword: boolean };
const login = (l: string, p: string) => call<Session>('POST', '/auth/login', null, { login: l, password: p });

/** Super admin: birinchi kirishda parol majburan almashtiriladi, shuning uchun `<parol>-e2e` ham sinab ko'riladi. */
async function rootSession(l: string, p: string): Promise<{ token: string; password: string }> {
  const changed = `${p}-e2e`;
  try {
    const s = await login(l, changed);
    return { token: s.accessToken, password: changed };
  } catch {
    const s = await login(l, p);
    if (!s.mustChangePassword) return { token: s.accessToken, password: p };
    await call('POST', '/auth/change-password', s.accessToken, { currentPassword: p, newPassword: changed });
    return { token: (await login(l, changed)).accessToken, password: changed };
  }
}

const tashkentToday = () => new Date(Date.now() + 5 * 3_600_000);

export default async function globalSetup() {
  const rootLogin = process.env.E2E_ROOT_LOGIN;
  const rootPassword = process.env.E2E_ROOT_PASSWORD;
  if (!rootLogin || !rootPassword) throw new Error('E2E_ROOT_LOGIN va E2E_ROOT_PASSWORD kerak (e2e/README.md)');
  const root = await rootSession(rootLogin, rootPassword);
  const stamp = `${Date.now().toString(36)}${randomBytes(2).toString('hex')}`;

  const c = await call<{ center: { id: string; name: string }; owner: { login: string; temporaryPassword: string }; branch: { id: string } }>('POST', '/admin/centers', root.token, {
    name: `E2E Markaz ${stamp}`,
    slug: `e2e-${stamp}`,
    ownerFullName: 'E2E Rahbar',
  });
  const ownerPw = `Owner-${randomBytes(8).toString('base64url')}`;
  const o1 = await login(c.owner.login, c.owner.temporaryPassword);
  await call('POST', '/auth/change-password', o1.accessToken, { currentPassword: c.owner.temporaryPassword, newPassword: ownerPw });
  const ot = (await login(c.owner.login, ownerPw)).accessToken;

  const course = await call<{ id: string }>('POST', '/courses', ot, { name: 'Ingliz tili', defaultPrice: 300_000 });
  const teacher = await call<{ user: { id: string; login: string }; temporaryPassword: string }>('POST', '/staff', ot, { role: 'TEACHER', fullName: 'E2E Ustoz', branchIds: [c.branch.id] });
  const now = tashkentToday();
  const weekday = ((now.getUTCDay() + 6) % 7) + 1;
  const group = await call<{ id: string; name: string }>('POST', '/groups', ot, {
    name: 'IELTS E2E',
    courseId: course.id,
    branchId: c.branch.id,
    status: 'ACTIVE',
    schedule: [{ weekday, startTime: '23:00', endTime: '23:59' }], // bugun, kun oxirigacha "keyingi dars"
  });
  await call('POST', `/groups/${group.id}/teachers`, ot, { teacherId: teacher.user.id, kind: 'MAIN' });
  const st = await call<{ student: { id: string; login: string }; temporaryPassword: string }>('POST', '/students', ot, { fullName: 'E2E Oquvchi', branchId: c.branch.id });
  await call('POST', '/enrollments', ot, { groupId: group.id, studentId: st.student.id });

  const data: E2EData = {
    stamp,
    root: { login: rootLogin, password: root.password },
    center: { id: c.center.id, name: c.center.name },
    owner: { login: c.owner.login, password: ownerPw, fullName: 'E2E Rahbar' },
    teacher: { login: teacher.user.login, temp: teacher.temporaryPassword, fullName: 'E2E Ustoz' },
    student: { login: st.student.login, temp: st.temporaryPassword, fullName: 'E2E Oquvchi', id: st.student.id },
    group: { id: group.id, name: group.name },
  };
  mkdirSync(dirname(DATA_FILE), { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
