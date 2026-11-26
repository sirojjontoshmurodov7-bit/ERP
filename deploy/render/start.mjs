// Bitta konteynerda API + web (bepul hosting: bitta servis). Ishga tushganda:
//   1) bazada ilova roli erp_app (NOSUPERUSER NOBYPASSRLS) bor bo'lishini ta'minlaydi, migratsiya va seed, ixtiyoriy super admin;
//   2) API (127.0.0.1:3001) va Next (127.0.0.1:3000) ni ishga tushiradi;
//   3) $PORT da kichik proksi: /ping o'zi javob beradi (bazaga tegmaydi: uyg'otish pingi Neon kvotasini yemaydi),
//      /telegram/webhook va /notifications/cron to'g'ridan-to'g'ri API'ga, qolgani web'ga;
//   4) Telegram webhook'ni ommaviy manzilga o'rnatadi (TELEGRAM_BOT_TOKEN va RENDER_EXTERNAL_URL/PUBLIC_URL bo'lsa).
// Muhit: DATABASE_MIGRATION_URL (baza egasi), APP_DB_PASSWORD, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET va ixtiyoriylar (DEPLOY.md).
// Bitta jarayon yiqilsa hammasi to'xtaydi: hosting konteynerni qayta ishga tushiradi. Sirlar logga yozilmaydi.
import { spawn } from 'node:child_process';
import { createServer, request } from 'node:http';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const env = process.env;
const API_DIR = resolve(env.API_DIR ?? '/app/api');
const WEB_SERVER = resolve(env.WEB_SERVER ?? '/app/web/apps/web/server.js');
const PORT = Number(env.PORT ?? 10000);
const API_PORT = 3001;
const WEB_PORT = 3000;
const log = (m) => console.log(`[start] ${m}`);
const die = (m) => {
  console.error(`[start] ${m}`);
  process.exit(1);
};

for (const k of ['DATABASE_MIGRATION_URL', 'APP_DB_PASSWORD', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) if (!env[k]) die(`${k} berilmagan`);
// Telegram faqat A-Z a-z 0-9 _ - qabul qiladi; hosting yaratgan base64 sirdan boshqa belgilar olib tashlanadi (ikki tomonda bir xil)
const webhookSecret = env.TELEGRAM_WEBHOOK_SECRET ? env.TELEGRAM_WEBHOOK_SECRET.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 128) : '';
const publicUrl = (env.PUBLIC_URL || env.RENDER_EXTERNAL_URL || '').replace(/\/+$/, '');

/** Ilova ulanishi: egasi manzilidan, foydalanuvchi va parol erp_app bilan almashtiriladi (host, baza, sslmode o'sha). */
function appUrl(ownerUrl) {
  const u = new URL(ownerUrl);
  u.username = 'erp_app';
  u.password = encodeURIComponent(env.APP_DB_PASSWORD);
  return u.toString();
}

async function ensureAppRole() {
  const mod = createRequire(resolve(API_DIR, 'package.json'))('postgres');
  const postgres = mod.default ?? mod;
  const sql = postgres(env.DATABASE_MIGRATION_URL, { max: 1, onnotice: () => {} });
  try {
    const [r] = await sql`select 1 from pg_roles where rolname = 'erp_app'`;
    if (!r) {
      // sukut atributlar: NOSUPERUSER NOBYPASSRLS (superuser bo'lmagan egasi ularni aniq yozolmaydi)
      await sql.unsafe(`create role erp_app login password ${quote(env.APP_DB_PASSWORD)}`);
      log('erp_app roli yaratildi');
    } else {
      try {
        await sql.unsafe(`alter role erp_app with login password ${quote(env.APP_DB_PASSWORD)}`);
      } catch {
        log("erp_app parolini yangilab bo'lmadi (egasida CREATEROLE yo'q): mavjud parol APP_DB_PASSWORD ga mos bo'lishi kerak");
      }
    }
    // RLS shu rolda ishlaydi: superuser yoki BYPASSRLS bo'lsa tenant izolyatsiyasi yo'qoladi
    const [flags] = await sql`select rolsuper, rolbypassrls from pg_roles where rolname = 'erp_app'`;
    if (flags.rolsuper || flags.rolbypassrls) throw new Error("erp_app superuser yoki BYPASSRLS: xavfsiz emas, ishga tushirilmaydi");
    const [{ db }] = await sql`select current_database() as db`;
    await sql.unsafe(`grant connect on database "${db.replace(/"/g, '""')}" to erp_app`);
  } finally {
    await sql.end();
  }
}
const quote = (s) => `'${String(s).replace(/'/g, "''")}'`;

function run(file, extraEnv = {}) {
  return new Promise((ok, fail) => {
    const p = spawn(process.execPath, [file], { cwd: API_DIR, env: { ...env, ...extraEnv }, stdio: 'inherit' });
    p.on('exit', (code) => (code === 0 ? ok() : fail(new Error(`${file} kodi ${code}`))));
  });
}

function startChild(name, args, cwd, extraEnv) {
  const p = spawn(process.execPath, args, { cwd, env: { ...env, ...extraEnv }, stdio: 'inherit' });
  p.on('exit', (code, signal) => {
    if (!shuttingDown) die(`${name} to'xtadi (kod ${code ?? signal}), konteyner qayta ishga tushadi`);
  });
  return p;
}

async function waitFor(url, ms = 90_000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (r.status < 500) return true;
    } catch {
      // hali tayyor emas
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function setupTelegram() {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token || env.TELEGRAM_POLLING === 'true' || env.TELEGRAM_POLLING === '1') return;
  if (!publicUrl || !webhookSecret) return log('Telegram: ommaviy manzil yoki webhook siri yo\'q, webhook o\'rnatilmadi');
  const call = async (method, body) => {
    const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15_000) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(`${method}: HTTP ${r.status} ${j.description ?? ''}`);
  };
  try {
    await call('setWebhook', { url: `${publicUrl}/telegram/webhook`, secret_token: webhookSecret, allowed_updates: ['message'] });
    await call('setMyCommands', { commands: [{ command: 'start', description: 'Akkauntni ulash: /start KOD' }, { command: 'stop', description: "Bildirishnomalarni o'chirish" }, { command: 'help', description: 'Yordam' }] });
    log(`Telegram webhook: ${publicUrl}/telegram/webhook`);
  } catch (e) {
    log(`Telegram webhook o'rnatilmadi: ${e instanceof Error ? e.message : 'noma\'lum'}`);
  }
}

// ---------------------------------------------------------------- ishga tushirish
let shuttingDown = false;
log('baza: rol, migratsiya, seed');
await ensureAppRole();
await run('dist/db/migrate.js');
await run('dist/db/seed.js');
if (env.SUPER_ADMIN_PASSWORD) await run('dist/db/create-super-admin.js'); // bor bo'lsa hech narsa o'zgarmaydi

const apiEnv = {
  NODE_ENV: 'production',
  API_PORT: String(API_PORT),
  DATABASE_URL: appUrl(env.DATABASE_MIGRATION_URL),
  TRUST_PROXY: '1', // oldida web BFF yoki shu proksi; X-Forwarded-For ni hosting balansiri qo'yadi
  TELEGRAM_WEBHOOK_SECRET: webhookSecret,
};
const api = startChild('API', ['--max-old-space-size=200', 'dist/main.js'], API_DIR, apiEnv);
const web = startChild('Web', ['--max-old-space-size=200', WEB_SERVER], resolve(WEB_SERVER, '..'), {
  NODE_ENV: 'production',
  PORT: String(WEB_PORT),
  HOSTNAME: '127.0.0.1',
  API_URL: `http://127.0.0.1:${API_PORT}`,
  WEB_SECURE_COOKIES: env.WEB_SECURE_COOKIES ?? 'true',
  NEXT_TELEMETRY_DISABLED: '1',
});

const DIRECT_API = /^\/(telegram\/webhook|notifications\/cron)(\?|$)/;
const proxy = createServer((req, res) => {
  if (req.url === '/ping') {
    res.writeHead(200, { 'content-type': 'text/plain', 'cache-control': 'no-store' }).end('ok');
    return;
  }
  const port = DIRECT_API.test(req.url ?? '') ? API_PORT : WEB_PORT;
  const up = request({ host: '127.0.0.1', port, method: req.method, path: req.url, headers: req.headers }, (r) => {
    res.writeHead(r.statusCode ?? 502, r.headers);
    r.pipe(res);
  });
  up.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain' });
    res.end('Servis ishga tushmoqda, birozdan keyin qayta urinib ko\'ring');
  });
  req.pipe(up);
});
proxy.listen(PORT, '0.0.0.0', () => log(`proksi :${PORT} -> web :${WEB_PORT}, api :${API_PORT}`));

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    shuttingDown = true;
    proxy.close();
    api.kill(sig);
    web.kill(sig);
    setTimeout(() => process.exit(0), 8000).unref();
  });
}

if (await waitFor(`http://127.0.0.1:${API_PORT}/health`)) {
  log('API tayyor');
  await setupTelegram();
} else die('API 90 s ichida tayyor bo\'lmadi');
