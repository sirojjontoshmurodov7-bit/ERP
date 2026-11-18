import { Inject, Injectable } from '@nestjs/common';
import { type ExtractTablesWithRelations, sql } from 'drizzle-orm';
import type { PgDatabase, PgTransaction } from 'drizzle-orm/pg-core';
import type * as schema from './schema.js';

export const DB = Symbol('DB');
export const DB_OPTIONS = Symbol('DB_OPTIONS');

// Driver'dan mustaqil tip (ishlab chiqarishda postgres-js, testda PGlite).
export type Db = PgDatabase<any, typeof schema>;
export type Tx = PgTransaction<any, typeof schema, ExtractTablesWithRelations<typeof schema>>;

export interface DbOptions {
  /** Ulanish allaqachon `erp_app` bo'lsa kerak emas. Testda superuser ulanishidan RLS'ni yoqish uchun. */
  setRole?: string;
}

/** RLS konteksti. Super admin bayrog'i FAQAT tasdiqlangan tokendan olinadi, so'rov kiritishidan hech qachon. */
export interface TenantContext {
  centerId: string | null;
  isSuperAdmin: boolean;
}

export const NO_CONTEXT: TenantContext = { centerId: null, isSuperAdmin: false };

export function contextOf(centerId: string | null, role: string): TenantContext {
  return { centerId, isSuperAdmin: role === 'SUPER_ADMIN' };
}

/**
 * Super admin yangi markaz yaratganda o'sha tranzaksiya ichida markaz kontekstiga o'tadi, shunda filial,
 * rol shabloni va rahbar yozuvlari tenant siyosatlaridan o'tadi. Faqat servis kodidan chaqiriladi.
 */
export async function enterCenter(tx: Tx, centerId: string): Promise<void> {
  await tx.execute(sql`select set_config('app.center_id', ${centerId}, true)`);
}

@Injectable()
export class DbService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(DB_OPTIONS) private readonly options: DbOptions,
  ) {}

  /** Har tenant amali shu orqali: tranzaksiya ichida `app.center_id` / `app.is_super_admin` o'rnatiladi. */
  withContext<T>(ctx: TenantContext, fn: (tx: Tx) => Promise<T>): Promise<T> {
    const role = this.options.setRole;
    if (role !== undefined && !/^[a-z_][a-z0-9_]*$/.test(role)) throw new Error('Invalid DB role name');
    return this.db.transaction(async (tx) => {
      if (role) await tx.execute(sql.raw(`set local role ${role}`));
      await tx.execute(
        sql`select set_config('app.center_id', ${ctx.centerId ?? ''}, true),
                   set_config('app.is_super_admin', ${ctx.isSuperAdmin ? 'true' : 'false'}, true)`,
      );
      return fn(tx);
    });
  }
}
