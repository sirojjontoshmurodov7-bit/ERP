// `permissions` jadvalini @erp/shared dagi ro'yxatdan to'ldiradi (idempotent).
import { PERMISSIONS } from '@erp/shared';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { permissions } from './schema.js';

const url = process.env.DATABASE_MIGRATION_URL;
if (!url) throw new Error('DATABASE_MIGRATION_URL is not set');

const client = postgres(url, { max: 1 });
const db = drizzle(client);
await db
  .insert(permissions)
  .values(PERMISSIONS.map((p) => ({ ...p })))
  .onConflictDoUpdate({
    target: permissions.code,
    set: { module: sql`excluded.module`, description: sql`excluded.description` },
  });
await client.end();
console.log(`seeded ${PERMISSIONS.length} permissions`);
