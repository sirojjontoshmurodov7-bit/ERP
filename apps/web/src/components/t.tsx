'use client';
// Server komponentlari ichida tarjima: <T>Tizimga kirish</T>. Server o'zbekcha chizadi, brauzer tanlangan tilga o'tkazadi.
import { useT, type Vars } from '@/lib/i18n';

export function T({ children, vars }: { children: string; vars?: Vars }) {
  const t = useT();
  return <>{t(children, vars)}</>;
}
