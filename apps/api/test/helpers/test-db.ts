// Testlar uchun xotiradagi Postgres (PGlite). Haqiqiy migratsiyalar qo'llanadi, ilova esa RLS ishlashi uchun
// `erp_app` roliga o'tib so'rov yuboradi (DB_OPTIONS.setRole). Seed superuser ulanishi bilan yoziladi.
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '../../src/db/schema.js';

export async function createTestDb() {
  const pg = new PGlite();
  await pg.exec('CREATE ROLE erp_app NOSUPERUSER NOBYPASSRLS');
  const db = drizzle(pg, { schema });
  await migrate(db, { migrationsFolder: './drizzle' });
  return { pg, db };
}
