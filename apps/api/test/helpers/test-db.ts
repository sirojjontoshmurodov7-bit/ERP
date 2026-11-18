// Testlar uchun baza. Sukut: xotiradagi Postgres (PGlite), haqiqiy migratsiyalar bilan.
// `TEST_DATABASE_URL` (superuser ulanishi, masalan `pnpm pg:local` chiqargan) berilsa: haqiqiy Postgres'da har test fayli
// uchun alohida baza ochiladi, migratsiyalar superuser EMAS `erp` egasi nomidan qo'llanadi (Neon/managed hostlardagi kabi),
// fayl tugagach baza o'chiriladi. Ikkala holatda ham ilova RLS uchun `erp_app` roliga o'tib so'rov yuboradi (DB_OPTIONS.setRole),
// seed esa superuser ulanishi bilan yoziladi.
import { randomBytes } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { migrate as migratePg } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../../src/db/schema.js';

type TestDb = ReturnType<typeof drizzlePglite<typeof schema>>;

export async function createTestDb(): Promise<{ pg: { close(): Promise<void> }; db: TestDb }> {
  const adminUrl = process.env.TEST_DATABASE_URL;
  if (adminUrl) return createRealDb(adminUrl);
  const pg = new PGlite();
  await pg.exec('CREATE ROLE erp_app NOSUPERUSER NOBYPASSRLS');
  const db = drizzlePglite(pg, { schema });
  await migratePglite(db, { migrationsFolder: './drizzle' });
  return { pg, db };
}

const quiet = { onnotice: () => {} };

async function createRealDb(adminUrl: string) {
  const name = `erp_test_${randomBytes(6).toString('hex')}`;
  const admin = postgres(adminUrl, { max: 1, ...quiet });
  try {
    await admin.unsafe(`DO $$ BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp') THEN CREATE ROLE erp NOSUPERUSER; END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_app') THEN CREATE ROLE erp_app NOSUPERUSER NOBYPASSRLS; END IF;
    END $$`);
    await admin.unsafe(`CREATE DATABASE ${name} OWNER erp`);
  } finally {
    await admin.end();
  }
  const url = new URL(adminUrl);
  url.pathname = `/${name}`;

  // Migratsiya egasi nomidan: superuser sessiyasi `role=erp` bilan ochiladi, ob'ektlar `erp` ga tegishli bo'ladi
  const owner = postgres(url.toString(), { max: 1, ...quiet, connection: { role: 'erp' } });
  try {
    await migratePg(drizzlePg(owner), { migrationsFolder: './drizzle' });
  } finally {
    await owner.end();
  }

  const client = postgres(url.toString(), { max: 8, ...quiet });
  const db = drizzlePg(client, { schema }) as unknown as TestDb;
  return {
    db,
    pg: {
      async close() {
        await client.end();
        const a = postgres(adminUrl, { max: 1, ...quiet });
        try {
          await a.unsafe(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
        } finally {
          await a.end();
        }
      },
    },
  };
}
