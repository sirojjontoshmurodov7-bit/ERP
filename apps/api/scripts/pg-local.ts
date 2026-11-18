// Lokal haqiqiy Postgres 17 (Docker/WSL'siz): `embedded-postgres` binarlari bilan, `apps/api/.pg-data` ichida.
// Production'ga yaqin rollar yaratiladi:
//   postgres  - klaster superuser'i (faqat shu skript va testlar uchun)
//   erp       - baza egasi, superuser EMAS (migratsiya, seed, create-super-admin shu bilan; Neon/managed hostlardagi kabi)
//   erp_app   - ilova roli (NOSUPERUSER NOBYPASSRLS), RLS shu rolda ishlaydi
// Ishlatish: `pnpm --filter @erp/api pg:local` (Ctrl+C bilan to'xtaydi). Ulanishlar pastda chiqariladi.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import EmbeddedPostgres from 'embedded-postgres';
import postgres from 'postgres';

export const PG_LOCAL = {
  port: Number(process.env.PG_LOCAL_PORT ?? 54329),
  superPassword: 'postgres_local_pw',
  ownerPassword: 'erp_dev_password',
  appPassword: 'erp_app_password',
};
const dataDir = fileURLToPath(new URL('../.pg-data', import.meta.url));

export const superUrl = (db = 'postgres') => `postgresql://postgres:${PG_LOCAL.superPassword}@localhost:${PG_LOCAL.port}/${db}`;

/** Rollar va `erp` bazasi (idempotent). */
export async function ensureRolesAndDb(): Promise<void> {
  const sql = postgres(superUrl(), { max: 1, onnotice: () => {} });
  try {
    await sql.unsafe(`DO $$ BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp') THEN
        CREATE ROLE erp LOGIN NOSUPERUSER CREATEDB PASSWORD '${PG_LOCAL.ownerPassword}';
      END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_app') THEN
        CREATE ROLE erp_app LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD '${PG_LOCAL.appPassword}';
      END IF;
    END $$`);
    const [exists] = await sql`select 1 from pg_database where datname = 'erp'`;
    if (!exists) await sql.unsafe('CREATE DATABASE erp OWNER erp');
    await sql.unsafe('GRANT CONNECT ON DATABASE erp TO erp_app');
  } finally {
    await sql.end();
  }
}

export async function startLocalPg(): Promise<EmbeddedPostgres> {
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: 'postgres',
    password: PG_LOCAL.superPassword,
    port: PG_LOCAL.port,
    persistent: true,
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    onLog: () => {},
  });
  if (!existsSync(dataDir)) await pg.initialise();
  await pg.start();
  await ensureRolesAndDb();
  return pg;
}

// To'g'ridan-to'g'ri ishga tushirilganda: klasterni yoqib, Ctrl+C gacha ushlab turadi.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const pg = await startLocalPg();
  console.log(`Postgres 17 ishlayapti: localhost:${PG_LOCAL.port}`);
  console.log(`  DATABASE_MIGRATION_URL=postgresql://erp:${PG_LOCAL.ownerPassword}@localhost:${PG_LOCAL.port}/erp`);
  console.log(`  DATABASE_URL=postgresql://erp_app:${PG_LOCAL.appPassword}@localhost:${PG_LOCAL.port}/erp`);
  console.log(`  TEST_DATABASE_URL=${superUrl()}   (e2e testlarni haqiqiy bazada yurgizish uchun)`);
  const stop = async () => {
    await pg.stop();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  setInterval(() => {}, 1 << 30);
}
