// Biznes sanalari: Asia/Tashkent (UTC+5, yozgi vaqt yo'q). Sanalar `YYYY-MM-DD` satr ko'rinishida (DB `date` bilan mos).
const TASHKENT_OFFSET_MS = 5 * 3_600_000;
const DAY_MS = 86_400_000;

/** Biznes "bugun" (Toshkent sanasi). `now` testlar uchun. */
export const todayLocal = (now: Date = new Date()): string => new Date(now.getTime() + TASHKENT_OFFSET_MS).toISOString().slice(0, 10);

const toMs = (iso: string): number => Date.parse(`${iso}T00:00:00Z`);
const fromMs = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

export const addDays = (iso: string, days: number): string => fromMs(toMs(iso) + days * DAY_MS);

/** `to - from` kunlarda (to keyin bo'lsa musbat). */
export const daysBetween = (from: string, to: string): number => Math.round((toMs(to) - toMs(from)) / DAY_MS);

export const daysInMonth = (year: number, month: number): number => new Date(Date.UTC(year, month, 0)).getUTCDate(); // month: 1-12

/** Oyning `day`-kuni; oyda shuncha kun bo'lmasa oxirgi kuni (29-31 uchun). `month` 1-12, oshib ketishi (13, 0) ruxsat etiladi. */
export function clampedDate(year: number, month: number, day: number): string {
  const y = year + Math.floor((month - 1) / 12);
  const m = ((((month - 1) % 12) + 12) % 12) + 1;
  return fromMs(Date.UTC(y, m - 1, Math.min(day, daysInMonth(y, m))));
}

export const yearOf = (iso: string): number => Number(iso.slice(0, 4));
export const monthOf = (iso: string): number => Number(iso.slice(5, 7));
export const dayOf = (iso: string): number => Number(iso.slice(8, 10));

/** ISO hafta kuni: 1 = dushanba ... 7 = yakshanba. */
export const isoWeekday = (iso: string): number => {
  const d = new Date(toMs(iso)).getUTCDay();
  return d === 0 ? 7 : d;
};
