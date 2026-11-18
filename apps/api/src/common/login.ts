import { eq } from 'drizzle-orm';
import type { Tx } from '../db/db.service.js';
import { centers } from '../db/schema.js';
import { uniqueViolation } from './pg-errors.js';
import { slugify } from './slug.js';

export const MAX_LOGIN_TRIES = 6;

/** Avtomatik login: `markaz-slug.ism`, band bo'lsa 2, 3, ... qo'shiladi (`attempt` 1 dan boshlanadi). */
export async function generateLogin(tx: Tx, centerId: string, fullName: string, attempt: number, fallback = 'xodim'): Promise<string> {
  const [center] = await tx.select({ slug: centers.slug }).from(centers).where(eq(centers.id, centerId));
  const first = slugify(fullName.split(/\s+/)[0] ?? '', 20) || fallback;
  return `${center!.slug}.${first}${attempt > 1 ? attempt : ''}`;
}

/** Xato login noyobligining buzilishimi (qayta urinish mumkin)? */
export const isLoginConflict = (e: unknown): boolean => uniqueViolation(e)?.includes('login') === true;
