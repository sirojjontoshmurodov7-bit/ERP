// Ko'rsatish formatlari: pul (so'm), sana va vaqt Toshkent bo'yicha. Biznes sanasi API'dan `YYYY-MM-DD` satr bo'lib keladi.
// Matnlar joriy tilda (tr): oy va hafta kunlari nomlari, "yo'q", "so'm", ixcham birliklar.
import { currentLang, tr } from './i18n';

/** Indeks bilan o'qilganda tarjima qilinadigan ro'yxat (WEEKDAYS[i], .map ham ishlaydi). */
const translated = (xs: string[]): readonly string[] => new Proxy(xs, { get: (a, k) => (typeof k === 'string' && /^\d+$/.test(k) ? tr(a[Number(k)] ?? '') : Reflect.get(a, k)) });
const NO = () => tr("yo'q");

const SOM = new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 });

/** 1250000 -> "1 250 000" (ajratgich oddiy bo'sh joy: shrift va nusxalash uchun barqaror). */
export function money(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return NO();
  const sign = n < 0 ? '−' : '';
  const sep = currentLang() === 'en' ? ',' : ' ';
  return sign + SOM.format(Math.abs(Math.round(n))).replace(/[  ,.]/g, sep);
}
export const som = (n: number | null | undefined) => (n === null || n === undefined ? NO() : `${money(n)} ${tr("so'm")}`);

const MONTHS = translated(['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']);
const MONTHS_NOM = translated(['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']);
const MONTHS_SHORT = translated(['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek']);

/** "2026-11-19" -> "19.11.2026" */
export function date(iso: string | null | undefined): string {
  if (!iso) return NO();
  const d = iso.slice(0, 10);
  return `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;
}
/** "2026-11-19" -> "19 noyabr" (joriy yil) yoki "19 noyabr 2025" */
export function dateLong(iso: string | null | undefined): string {
  if (!iso) return NO();
  const y = iso.slice(0, 4);
  const m = Number(iso.slice(5, 7)) - 1;
  const day = Number(iso.slice(8, 10));
  return `${day} ${MONTHS[m]}${y === todayLocal().slice(0, 4) ? '' : ` ${y}`}`;
}
/** "2026-11" -> "Noyabr 2026" */
export function monthLabel(ym: string): string {
  const m = Number(ym.slice(5, 7)) - 1;
  // bosh kelishik (ruschada "Ноябрь 2026"; dateLong'dagi kichik harfli kalitlar qaratqich: "19 ноября")
  return `${MONTHS_NOM[m] ?? ''} ${ym.slice(0, 4)}`;
}
export const monthShort = (ym: string) => `${MONTHS_SHORT[Number(ym.slice(5, 7)) - 1] ?? ''} ${ym.slice(2, 4)}`;
/** "2026-11" -> "Noy" (grafik o'qi uchun) */
export const monthAbbr = (ym: string) => {
  const s = MONTHS_SHORT[Number(ym.slice(5, 7)) - 1] ?? '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Ixcham pul: 642 000 000 -> "642 mln", 4 820 000 000 -> "4,82 mlrd", 18 500 -> "18,5 ming" (kartochka va grafiklar uchun). */
export function compact(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return NO();
  const a = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  const fmt = (v: number, unit: string) => `${sign}${(Math.round(v * 100) / 100).toString().replace('.', currentLang() === 'en' ? '.' : ',')} ${unit}`;
  if (a >= 1e9) return fmt(a / 1e9, tr('mlrd'));
  if (a >= 1e6) return fmt(a >= 1e8 ? Math.round(a / 1e6) : a / 1e6, tr('mln'));
  if (a >= 1e4) return fmt(Math.round(a / 100) / 10, tr('ming'));
  return sign + money(a);
}

const TZ = 5 * 3_600_000;
const tashkent = (v: string | Date) => new Date(new Date(v).getTime() + TZ);
/** Vaqt tamg'asi -> "19.11.2026 14:05" (Toshkent) */
export function dateTime(v: string | Date | null | undefined): string {
  if (!v) return NO();
  const d = tashkent(v).toISOString();
  return `${date(d)} ${d.slice(11, 16)}`;
}
export const todayLocal = () => tashkent(new Date()).toISOString().slice(0, 10);
export const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
export const thisMonth = () => todayLocal().slice(0, 7);
/** Ikki biznes sanasi orasidagi kunlar (b - a). */
export const daysBetweenIso = (a: string, b: string) => Math.round((Date.parse(`${b.slice(0, 10)}T00:00:00Z`) - Date.parse(`${a.slice(0, 10)}T00:00:00Z`)) / 86_400_000);

export const WEEKDAYS = translated(['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba']);
export const WEEKDAYS_SHORT = translated(['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']);

/** Telefon uchun yengil ko'rinish: faqat saqlangan qiymat, qayta formatlanmaydi. */
export const phone = (p: string | null | undefined) => p || NO();

export function plural(n: number, word: string) {
  return tr('{n} ta {w}', { n: money(n), w: tr(word) });
}

/** Vaqt tamg'asining Toshkent sanasi: "19.11.2026" */
/** Vaqt tamg'asi -> Toshkent biznes sanasi "YYYY-MM-DD". */
export const tsDay = (v: string) => tashkent(v).toISOString().slice(0, 10);
export const tsDate = (v: string | Date | null | undefined) => (v ? dateTime(v).slice(0, 10) : "yo'q");
