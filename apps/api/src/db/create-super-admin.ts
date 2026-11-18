// Birinchi super admin'ni yaratadi (egasi roli bilan, RLS'ni chetlab o'tadi). Bir marta ishlatiladi.
// Parol berilmasa, tasodifiy parol yaratilib BIR MARTA terminalga chiqariladi. Birinchi kirishda almashtirish majburiy.
import { randomBytes } from 'node:crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hashPassword } from '../auth/password.js';
import { users } from './schema.js';

const url = process.env.DATABASE_MIGRATION_URL;
if (!url) throw new Error('DATABASE_MIGRATION_URL is not set');

const login = (process.env.SUPER_ADMIN_LOGIN ?? 'superadmin').trim();
const fullName = process.env.SUPER_ADMIN_NAME ?? 'Super Admin';
const generated = !process.env.SUPER_ADMIN_PASSWORD;
const password = process.env.SUPER_ADMIN_PASSWORD ?? randomBytes(15).toString('base64url');
if (password.length < 8) throw new Error('SUPER_ADMIN_PASSWORD must be at least 8 characters');

const client = postgres(url, { max: 1 });
const db = drizzle(client);
const inserted = await db
  .insert(users)
  .values({ role: 'SUPER_ADMIN', centerId: null, login, passwordHash: await hashPassword(password), fullName, mustChangePassword: true })
  .onConflictDoNothing()
  .returning({ id: users.id });
await client.end();

if (inserted.length === 0) {
  console.log(`Login "${login}" already exists, nothing changed.`);
} else {
  console.log(`Super admin created. Login: ${login}`);
  if (generated) console.log(`Temporary password (shown once): ${password}`);
}
