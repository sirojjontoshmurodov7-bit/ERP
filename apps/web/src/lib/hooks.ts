'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useApi } from './use-api';

/** Filtr, tab va sahifalash holati URL'da: havola ulashilsa yoki sahifa yangilansa holat saqlanadi. */
export function useUrlState<T extends Record<string, string>>(defaults: T): [T, (patch: Partial<T>) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const state = useMemo(() => {
    const out = { ...defaults };
    for (const k of Object.keys(defaults) as (keyof T)[]) {
      const v = params.get(k as string);
      if (v !== null) out[k] = v as T[keyof T];
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);
  const set = useCallback(
    (patch: Partial<T>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === '' || v === defaults[k]) next.delete(k);
        else next.set(k, v as string);
      }
      // filtr o'zgarsa sahifa boshiga qaytamiz
      if (!('offset' in patch)) next.delete('offset');
      const s = next.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params, pathname, router],
  );
  return [state, set];
}

export interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  archivedAt: string | null;
  createdAt: string;
}
export interface Course {
  id: string;
  name: string;
  defaultPrice: number;
  archivedAt: string | null;
}
export interface GroupLite {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
  courseId: string;
  courseName: string;
  status: string;
  archivedAt: string | null;
}
export interface StaffLite {
  id: string;
  fullName: string;
  role: 'ADMIN' | 'CASHIER' | 'TEACHER';
  status: string;
  branchIds: string[];
}

export const useBranches = (enabled = true) => useApi<{ items: Branch[] }>(enabled ? '/branches' : null);
export const useCourses = (enabled = true) => useApi<{ items: Course[] }>(enabled ? '/courses' : null);
export const useGroupsLite = (enabled = true) => useApi<{ items: GroupLite[] }>(enabled ? '/groups' : null, { limit: 200 });
export const useTeachers = (enabled = true) => useApi<{ items: StaffLite[] }>(enabled ? '/staff' : null, { role: 'TEACHER', limit: 200 });

export const opts = <T extends { id: string; name?: string; fullName?: string }>(items: T[] | undefined) =>
  (items ?? []).map((x) => ({ value: x.id, label: (x.name ?? x.fullName ?? '') as string }));
