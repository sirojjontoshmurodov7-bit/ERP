// Hisob-kitob motori (sof funksiya, DB'ga tegmaydi): bitta yozilish uchun yaratilishi kerak bo'lgan charge'larni rejalaydi.
// Qoidalar manbasi: ERD-VA-RUXSATLAR.md, 2.3 ("Ikki to'lov sikli", "Charge yaratish").
import { addDays, clampedDate, dayOf, isoWeekday, monthOf, yearOf } from '../common/dates.js';

export type BillingMode = 'GROUP_CYCLE' | 'STUDENT_CYCLE';
export type JoinProration = 'FULL_MONTH' | 'REMAINING_LESSONS';
export type ChargeKind = 'REGULAR' | 'FIRST_PRORATED';

export interface EngineEnrollment {
  joinedAt: string;
  billingAnchor: string | null;
  priceOverride: number | null;
}

export interface EngineGroup {
  priceMonthly: number;
  billingMode: BillingMode;
  billingDay: number | null; // faqat GROUP_CYCLE, 1-28
  startDate: string | null;
  endDate: string | null;
  status: 'PLANNED' | 'ACTIVE' | 'FINISHED';
  archived: boolean;
  /** Jadvaldagi har bir dars uchun hafta kuni (1 = dushanba ... 7 = yakshanba); bir kunda ikki dars bo'lsa ikki marta. */
  scheduleWeekdays: readonly number[];
}

export interface EngineDiscount {
  type: 'PERCENT' | 'AMOUNT' | 'FREE';
  value: number | null;
  fromDate: string | null;
  toDate: string | null;
}

export interface EngineContext {
  /** Hisoblash sanasi (biznes "bugun"): to'lov muddati shundan o'tmagan davrlar yaratilmaydi. */
  asOf: string;
  joinProration: JoinProration;
  /** Allaqachon yaratilgan avtomatik charge'larning davr boshlari (bekor qilinganlari ham). */
  existingPeriodStarts: ReadonlySet<string>;
  /** Muzlatish davrlari [from, to); to = null: hali muzlatilgan. */
  freezes: readonly { from: string; to: string | null }[];
  discounts: readonly EngineDiscount[];
  /** Chiqish/ko'chirish sanasi: shu kun yoki undan keyin to'lov muddati bo'lgan davrlar yaratilmaydi. */
  leftAt?: string | null;
}

export interface ChargeDraft {
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  baseAmount: number;
  discountAmount: number;
  amount: number;
  kind: ChargeKind;
}

const MAX_PERIODS = 600; // xavfsizlik chegarasi (50 yil)

/** `from..to` (ikkalasi ham kiradi) oralig'idagi darslar soni jadval bo'yicha. */
export function countLessons(weekdays: readonly number[], from: string, to: string): number {
  if (!weekdays.length) return 0;
  let n = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const wd = isoWeekday(d);
    for (const w of weekdays) if (w === wd) n++;
  }
  return n;
}

/** Chegirma: sana oralig'iga mos barcha chegirmalar yig'indisi, asos summadan oshmaydi. `date` — to'lov muddati. */
export function discountFor(base: number, discounts: readonly EngineDiscount[], date: string): number {
  let sum = 0;
  for (const d of discounts) {
    if ((d.fromDate && d.fromDate > date) || (d.toDate && d.toDate < date)) continue;
    if (d.type === 'FREE') sum += base;
    else if (d.type === 'PERCENT') sum += Math.floor((base * (d.value ?? 0)) / 100);
    else sum += d.value ?? 0;
  }
  return Math.min(sum, base);
}

export function planCharges(e: EngineEnrollment, g: EngineGroup, ctx: EngineContext): ChargeDraft[] {
  if (g.archived || g.status === 'FINISHED') return [];
  // Hali boshlanmagan guruh: faol emas va boshlanish sanasi yo'q yoki kelmagan bo'lsa hisoblanmaydi
  if (g.status === 'PLANNED' && (!g.startDate || g.startDate > ctx.asOf)) return [];

  // Hisob guruh boshlangandan keyin boshlanadi
  const join = g.startDate && g.startDate > e.joinedAt ? g.startDate : e.joinedAt;

  let cycleDay: number;
  let year: number;
  let month: number;
  if (g.billingMode === 'STUDENT_CYCLE') {
    // Davr yozilgan (anchor) kunidan boshlanadi, to'liq oy; anchor guruh boshlanishidan oldin bo'la olmaydi
    const anchor = e.billingAnchor && e.billingAnchor >= join ? e.billingAnchor : join;
    cycleDay = dayOf(anchor);
    year = yearOf(anchor);
    month = monthOf(anchor);
  } else {
    cycleDay = g.billingDay ?? 1;
    year = yearOf(join);
    month = monthOf(join);
    // Yozilgan kunni o'z ichiga olgan davr: shu oyning davr boshi kelmagan bo'lsa, oldingi oydan boshlanadi
    if (clampedDate(year, month, cycleDay) > join) month -= 1;
  }

  const base0 = e.priceOverride ?? g.priceMonthly;
  const out: ChargeDraft[] = [];

  for (let i = 0; i < MAX_PERIODS; i++) {
    const start = clampedDate(year, month + i, cycleDay);
    const end = addDays(clampedDate(year, month + i + 1, cycleDay), -1);
    const late = i === 0 && g.billingMode === 'GROUP_CYCLE' && start < join; // kech yozilgan: birinchi davr to'liq emas
    const due = late ? join : start;

    if (due > ctx.asOf) break; // kelajak davr oldindan hisoblanmaydi
    if (g.endDate && due > g.endDate) break;
    if (ctx.leftAt && due >= ctx.leftAt) break;
    if (ctx.existingPeriodStarts.has(start)) continue;
    if (ctx.freezes.some((f) => f.from <= due && (f.to === null || due < f.to))) continue;

    let base = base0;
    if (late && ctx.joinProration === 'REMAINING_LESSONS' && g.scheduleWeekdays.length) {
      const total = countLessons(g.scheduleWeekdays, start, end);
      if (total > 0) base = Math.round((base0 * countLessons(g.scheduleWeekdays, join, end)) / total);
    }
    const discountAmount = discountFor(base, ctx.discounts, due);
    out.push({
      periodStart: start,
      periodEnd: end,
      dueDate: due,
      baseAmount: base,
      discountAmount,
      amount: base - discountAmount,
      kind: late ? 'FIRST_PRORATED' : 'REGULAR',
    });
  }
  return out;
}
