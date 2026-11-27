'use client';
// Interfeys tili (o'zbek lotin / o'zbek kirill / rus / ingliz). Kalit = o'zbekcha lotin matnning o'zi: t("O'quvchilar") -> tanlangan tilda tarjima, lug'atda yo'q bo'lsa asl matn.
// Kirill o'zbekcha lug'atsiz: lotin matn `toCyrillic` bilan o'giriladi. O'zgaruvchilar: t('{n} ta qarzdor', { n: 5 }).
// Tanlov cookie'da (`tst-lang`, 1 yil), sukut o'zbekcha lotin.
import { useCallback, useSyncExternalStore } from 'react';
import { EN } from './i18n-en';
import { RU } from './i18n-ru';
import { toCyrillic } from './translit';

export type Lang = 'uz' | 'uz-cyrl' | 'ru' | 'en';
export const LANG_COOKIE = 'tst-lang';
export const LANGS: { value: Lang; label: string; short: string }[] = [
  { value: 'uz', label: 'O‘zbekcha', short: 'UZ' },
  { value: 'uz-cyrl', label: 'Ўзбекча', short: 'ЎЗ' },
  { value: 'ru', label: 'Русский', short: 'RU' },
  { value: 'en', label: 'English', short: 'EN' },
];

/** `<html lang>` qiymati (kirill o'zbekcha uchun BCP 47: uz-Cyrl). */
export const htmlLang = (lang: Lang) => (lang === 'uz-cyrl' ? 'uz-Cyrl' : lang);

const listeners = new Set<() => void>();
function readLang(): Lang {
  const m = /(?:^|;\s*)tst-lang=(uz-cyrl|ru|en)(?:;|$)/.exec(document.cookie);
  return (m?.[1] as Lang | undefined) ?? 'uz';
}

/** Hook'siz joylar uchun (xato matni, toast, forma xatosi): brauzerda cookie'dan, serverda o'zbekcha. */
export function currentLang(): Lang {
  return typeof document === 'undefined' ? 'uz' : readLang();
}

export function setLang(lang: Lang) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = htmlLang(lang);
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

function base(lang: Lang, s: string): string {
  switch (lang) {
    case 'ru':
      return RU[s] ?? s;
    case 'en':
      return EN[s] ?? s;
    case 'uz-cyrl':
      return toCyrillic(s);
    default:
      return s;
  }
}

export function translate(lang: Lang, s: string, vars?: Vars): string {
  const b = base(lang, s);
  return vars ? b.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? '')) : b;
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
