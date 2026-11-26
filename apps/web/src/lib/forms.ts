'use client';
import { useState } from 'react';
import { ApiError, errorText } from './api';
import { tr } from './i18n';

/** Bo'sh satrlarni yuborilmaydigan (undefined) qiladi; `nullable` kalitlar tahrirda null bo'ladi (maydonni tozalash). */
export function clean<T extends Record<string, unknown>>(v: T, nullable: (keyof T)[] = []): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v)) {
    if (typeof x === 'string') {
      const t = x.trim();
      if (t) out[k] = t;
      else if (nullable.includes(k as keyof T)) out[k] = null;
    } else if (x !== undefined && x !== '') out[k] = x;
  }
  return out as Partial<T>;
}

/** Forma yuborish holati: busy, umumiy xato va maydon xatolari (API `issues` dan). */
export function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const run = async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    setBusy(true);
    setError(null);
    setFields({});
    try {
      return await fn();
    } catch (e) {
      if (e instanceof ApiError && e.body.issues?.length) {
        setFields(e.fieldErrors);
        setError(tr('Maydonlarni tekshiring'));
      } else setError(errorText(e));
      return undefined;
    } finally {
      setBusy(false);
    }
  };
  const reset = () => {
    setError(null);
    setFields({});
  };
  return { busy, error, fields, run, reset, setError };
}
