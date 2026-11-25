// Ko'rsatish formatlari: pul (so'm), sana va vaqt Toshkent bo'yicha. Biznes sanasi API'dan `YYYY-MM-DD` satr bo'lib keladi.

const SOM = new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 });

/** 1250000 -> "1 250 000" (ajratgich oddiy bo'sh joy: shrift va nusxalash uchun barqaror). */
export function money(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "yo'q";
  const sign = n < 0 ? '−' : '';
  return sign + SOM.format(Math.abs(Math.round(n))).replace(/[  ,.]/g, ' ');
}
export const som = (n: number | null | undefined) => (n === null || n === undefined ? "yo'q" : `${money(n)} so'm`);

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const MONTHS_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];

/** "2026-11-19" -> "19.11.2026" */
export function date(iso: string | null | undefined): string {
  if (!iso) return "yo'q";
  const d = iso.slice(0, 10);
  return `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;
}
/** "2026-11-19" -> "19 noyabr" (joriy yil) yoki "19 noyabr 2025" */
export function dateLong(iso: string | null | undefined): string {
  if (!iso) return "yo'q";
  const y = iso.slice(0, 4);
  const m = Number(iso.slice(5, 7)) - 1;
  const day = Number(iso.slice(8, 10));
  return `${day} ${MONTHS[m]}${y === todayLocal().slice(0, 4) ? '' : ` ${y}`}`;
}
/** "2026-11" -> "Noyabr 2026" */
export function monthLabel(ym: string): string {
  const m = Number(ym.slice(5, 7)) - 1;
  const name = MONTHS[m] ?? '';
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${ym.slice(0, 4)}`;
}
export const monthShort = (ym: string) => `${MONTHS_SHORT[Number(ym.slice(5, 7)) - 1] ?? ''} ${ym.slice(2, 4)}`;
/** "2026-11" -> "Noy" (grafik o'qi uchun) */
export const monthAbbr = (ym: string) => {
  const s = MONTHS_SHORT[Number(ym.slice(5, 7)) - 1] ?? '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Ixcham pul: 642 000 000 -> "642 mln", 4 820 000 000 -> "4,82 mlrd", 18 500 -> "18,5 ming" (kartochka va grafiklar uchun). */
export function compact(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "yo'q";
  const a = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  const fmt = (v: number, unit: string) => `${sign}${(Math.round(v * 100) / 100).toString().replace('.', ',')} ${unit}`;
  if (a >= 1e9) return fmt(a / 1e9, 'mlrd');
  if (a >= 1e6) return fmt(a >= 1e8 ? Math.round(a / 1e6) : a / 1e6, 'mln');
  if (a >= 1e4) return fmt(Math.round(a / 100) / 10, 'ming');
  return sign + money(a);
}

const TZ = 5 * 3_600_000;
const tashkent = (v: string | Date) => new Date(new Date(v).getTime() + TZ);
/** Vaqt tamg'asi -> "19.11.2026 14:05" (Toshkent) */
export function dateTime(v: string | Date | null | undefined): string {
  if (!v) return "yo'q";
  const d = tashkent(v).toISOString();
  return `${date(d)} ${d.slice(11, 16)}`;
}
export const todayLocal = () => tashkent(new Date()).toISOString().slice(0, 10);
export const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
export const thisMonth = () => todayLocal().slice(0, 7);
/** Ikki biznes sanasi orasidagi kunlar (b - a). */
export const daysBetweenIso = (a: string, b: string) => Math.round((Date.parse(`${b.slice(0, 10)}T00:00:00Z`) - Date.parse(`${a.slice(0, 10)}T00:00:00Z`)) / 86_400_000);

export const WEEKDAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];
export const WEEKDAYS_SHORT = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

/** Telefon uchun yengil ko'rinish: faqat saqlangan qiymat, qayta formatlanmaydi. */
export const phone = (p: string | null | undefined) => p || "yo'q";

export function plural(n: number, word: string) {
  return `${money(n)} ta ${word}`;
}

/** Vaqt tamg'asining Toshkent sanasi: "19.11.2026" */
/** Vaqt tamg'asi -> Toshkent biznes sanasi "YYYY-MM-DD". */
export const tsDay = (v: string) => tashkent(v).toISOString().slice(0, 10);
export const tsDate = (v: string | Date | null | undefined) => (v ? dateTime(v).slice(0, 10) : "yo'q");
