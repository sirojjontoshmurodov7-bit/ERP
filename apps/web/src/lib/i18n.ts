'use client';
// Interfeys tili (o'zbek / rus). Kalit = o'zbekcha matnning o'zi: t("O'quvchilar") -> ruscha lug'atda bo'lsa tarjima, bo'lmasa asl matn.
// O'zgaruvchilar: t('{n} ta qarzdor', { n: 5 }). Tanlov cookie'da (`tst-lang`, 1 yil), sukut o'zbekcha.
import { useCallback, useSyncExternalStore } from 'react';
import { RU } from './i18n-ru';

export type Lang = 'uz' | 'ru';
export const LANG_COOKIE = 'tst-lang';
export const LANGS: { value: Lang; label: string }[] = [
  { value: 'uz', label: "O'zbekcha" },
  { value: 'ru', label: 'Русский' },
];

const listeners = new Set<() => void>();
function readLang(): Lang {
  return /(?:^|;\s*)tst-lang=ru(?:;|$)/.test(document.cookie) ? 'ru' : 'uz';
}

/** Hook'siz joylar uchun (xato matni, toast, forma xatosi): brauzerda cookie'dan, serverda o'zbekcha. */
export function currentLang(): Lang {
  return typeof document === 'undefined' ? 'uz' : readLang();
}

export function setLang(lang: Lang) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = lang;
  listeners.forEach((f) => f());
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    readLang,
    () => 'uz',
  );
}

export type Vars = Record<string, string | number | null | undefined>;
export type T = (s: string, vars?: Vars) => string;

export function translate(lang: Lang, s: string, vars?: Vars): string {
  const base = lang === 'ru' ? (RU[s] ?? s) : s;
  return vars ? base.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? '')) : base;
}

/** Hook'siz tarjima (hodisa ishlovchilari, toast): `tr('Saqlandi')`. */
export const tr = (s: string, vars?: Vars) => translate(currentLang(), s, vars);

/** Yorliqlar xaritasi (ROLE_LABEL[role] kabi): qiymat o'qilganda joriy tilda qaytadi. */
export function trMap<T extends Record<string, string>>(m: T): T {
  return new Proxy(m, { get: (o, k) => (typeof k === 'string' && typeof o[k] === 'string' ? tr(o[k] as string) : Reflect.get(o, k)) });
}

/** Komponent ichida: `const t = useT();` */
export function useT(): T {
  const lang = useLang();
  return useCallback((s: string, vars?: Vars) => translate(lang, s, vars), [lang]);
}
