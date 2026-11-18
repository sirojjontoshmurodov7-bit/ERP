/** `tx.execute()` natijasi driverga qarab massiv (postgres-js) yoki `{ rows }` (PGlite) bo'ladi. */
export function rowsOf<T = Record<string, unknown>>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  return (result as { rows?: T[] }).rows ?? [];
}
