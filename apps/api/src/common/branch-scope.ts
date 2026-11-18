// Qamrov (scope) so'rov filtri sifatida: OWNER hamma filialni, qolgan xodimlar faqat `user_branches` dagilarni ko'radi.
import { eq, inArray, sql, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import type { AuthUser } from '../auth/auth.types.js';
import type { Tx } from '../db/db.service.js';
import { userBranches } from '../db/schema.js';

export type BranchScope = { all: true } | { all: false; branchIds: string[] };

/** Foydalanuvchining filial qamrovi. Tenant konteksti ichidagi tranzaksiyada chaqiriladi. */
export async function branchScope(tx: Tx, user: Pick<AuthUser, 'id' | 'role'>): Promise<BranchScope> {
  if (user.role === 'OWNER') return { all: true };
  const rows = await tx.select({ branchId: userBranches.branchId }).from(userBranches).where(eq(userBranches.userId, user.id));
  return { all: false, branchIds: rows.map((r) => r.branchId) };
}

/** `branch_id` ustuniga qo'llanadigan filtr; `undefined` = cheklov yo'q. Bo'sh qamrov hech narsani ko'rsatmaydi. */
export function branchFilter(column: AnyPgColumn, scope: BranchScope): SQL | undefined {
  if (scope.all) return undefined;
  return scope.branchIds.length ? inArray(column, scope.branchIds) : sql`false`;
}

export const inScope = (scope: BranchScope, branchId: string): boolean => scope.all || scope.branchIds.includes(branchId);
