'use client';
// Kichik ma'lumot hook'i: yuklash, xato, qayta yuklash. Kesh yo'q (ERP ma'lumoti tez o'zgaradi).
// Holat faqat javob kelganda yoziladi; `loading` hosila: joriy so'rov kaliti uchun javob hali yo'q.
// Yo'l o'zgarsa eski so'rov bekor qilinadi. Filtr/sahifa o'zgarganda (yo'l o'sha) eski ma'lumot javob kelguncha ko'rinib turadi.
import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

type Query = Record<string, string | number | boolean | null | undefined>;

export interface ApiState<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
  reload: () => void;
  setData: (fn: (prev: T | undefined) => T | undefined) => void;
}

interface Result<T> {
  key: string | null;
  path: string | null;
  data?: T;
  error?: unknown;
}

export function useApi<T>(path: string | null, query?: Query): ApiState<T> {
  const [tick, setTick] = useState(0);
  const [res, setRes] = useState<Result<T>>({ key: null, path: null });
  const qkey = JSON.stringify(query ?? {});
  const key = path === null ? null : `${path}${qkey}#${tick}`;

  useEffect(() => {
    if (key === null || path === null) return;
    const ctrl = new AbortController();
    api
      .get<T>(path, JSON.parse(qkey) as Query, ctrl.signal)
      .then((data) => setRes({ key, path, data }))
      .catch((error: unknown) => {
        if (!ctrl.signal.aborted) setRes((r) => ({ key, path, data: r.path === path ? r.data : undefined, error }));
      });
    return () => ctrl.abort();
  }, [key, path, qkey]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((fn: (prev: T | undefined) => T | undefined) => setRes((r) => ({ ...r, data: fn(r.data) })), []);
  const samePath = res.path === path;
  return {
    data: samePath ? res.data : undefined,
    error: res.key === key ? (res.error ?? null) : null,
    loading: key !== null && res.key !== key,
    reload,
    setData,
  };
}
