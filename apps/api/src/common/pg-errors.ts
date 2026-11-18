/** Xato zanjiridan (drizzle -> driver) PostgreSQL xato kodini va cheklov nomini topadi. */
export function pgErrorInfo(e: unknown): { code?: string; constraint?: string } {
  for (let cur: any = e; cur; cur = cur.cause) {
    if (typeof cur.code === 'string' && /^[0-9A-Z]{5}$/.test(cur.code)) {
      return { code: cur.code, constraint: cur.constraint_name ?? cur.constraint };
    }
  }
  return {};
}

/** UNIQUE buzilsa cheklov nomini (yoki bo'sh satr), aks holda null qaytaradi. */
export function uniqueViolation(e: unknown): string | null {
  const { code, constraint } = pgErrorInfo(e);
  return code === '23505' ? (constraint ?? '') : null;
}
