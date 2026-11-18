// Maosh motori (sof funksiya, DB'ga tegmaydi): bir oy uchun qoidalardan maosh qatorlarini rejalaydi.
// Qoidalar manbasi: ERD-VA-RUXSATLAR.md, 2.4 ("Maosh namunalari") va 16-qadam hujjati (PROGRESS.md).
import { clampedDate, monthOf, yearOf } from '../common/dates.js';

export type RuleType = 'FIXED' | 'PERCENT' | 'PER_GROUP' | 'PER_LESSON';
export type PercentBase = 'PAID' | 'CHARGED';
export type TeacherKind = 'MAIN' | 'ASSISTANT';

export interface EngineRule {
  id: string;
  employeeId: string;
  groupId: string | null;
  type: RuleType;
  amount: number | null;
  percent: number | null;
  percentBase: PercentBase | null;
  teacherKind: TeacherKind | null;
  validFrom: string;
  validTo: string | null;
}

/** Xodimning guruhga biriktirilishi (group_teachers). */
export interface Attachment {
  employeeId: string;
  groupId: string;
  kind: TeacherKind;
  from: string;
  to: string | null;
}

/** Oy ichida shu xodim o'tgan (HELD) darslar soni, guruh bo'yicha. */
export interface LessonCount {
  employeeId: string;
  groupId: string;
  count: number;
}

/** Guruh bo'yicha oy asoslari: `paid` = oy ichida hisoblarga taqsimlangan sof to'lov, `charged` = oy ichida muddati kelgan hisoblar. */
export interface GroupBase {
  paid: number;
  charged: number;
}

export interface PayrollInput {
  /** Oyning 1-kuni (YYYY-MM-01). */
  month: string;
  rules: readonly EngineRule[];
  attachments: readonly Attachment[];
  lessons: readonly LessonCount[];
  bases: ReadonlyMap<string, GroupBase>;
}

export interface PayrollItemDraft {
  ruleId: string;
  employeeId: string;
  groupId: string | null;
  /** FIXED/PER_GROUP: summa; PER_LESSON: darslar soni; PERCENT: asos summa. */
  baseAmount: number;
  amount: number;
  description: string;
}

export const monthStartOf = (iso: string): string => `${iso.slice(0, 7)}-01`;
export const monthEndOf = (iso: string): string => clampedDate(yearOf(iso), monthOf(iso), 31);

const fmt = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** Qoida shu oyda amalda bo'ladimi (muddat oy bilan kesishsa). */
export const ruleActiveIn = (r: Pick<EngineRule, 'validFrom' | 'validTo'>, month: string): boolean =>
  r.validFrom <= monthEndOf(month) && (r.validTo === null || r.validTo >= monthStartOf(month));

/** Xodimning shu oydagi biriktirilgan guruhlari (tartiblangan, takrorsiz). */
function attachedGroups(input: PayrollInput, r: EngineRule): string[] {
  const start = monthStartOf(input.month);
  const end = monthEndOf(input.month);
  const ids = input.attachments
    .filter((a) => a.employeeId === r.employeeId && a.from <= end && (a.to === null || a.to >= start) && (!r.teacherKind || a.kind === r.teacherKind))
    .map((a) => a.groupId);
  return [...new Set(ids)].sort();
}

/** Qoida qo'llanadigan guruhlar: aniq guruh berilgan bo'lsa shu (biriktirishdan qat'i nazar), aks holda xodimning guruhlari. */
const targetGroups = (input: PayrollInput, r: EngineRule): string[] => (r.groupId ? [r.groupId] : attachedGroups(input, r));

export function planPayroll(input: PayrollInput): PayrollItemDraft[] {
  const out: PayrollItemDraft[] = [];
  for (const r of input.rules) {
    if (!ruleActiveIn(r, input.month)) continue;
    switch (r.type) {
      case 'FIXED':
        out.push({ ruleId: r.id, employeeId: r.employeeId, groupId: r.groupId, baseAmount: r.amount!, amount: r.amount!, description: "Qat'iy oylik" });
        break;
      case 'PER_GROUP':
        for (const g of targetGroups(input, r)) out.push({ ruleId: r.id, employeeId: r.employeeId, groupId: g, baseAmount: r.amount!, amount: r.amount!, description: 'Guruh uchun' });
        break;
      case 'PER_LESSON':
        for (const l of input.lessons) {
          if (l.employeeId !== r.employeeId || (r.groupId && l.groupId !== r.groupId) || l.count <= 0) continue;
          out.push({ ruleId: r.id, employeeId: r.employeeId, groupId: l.groupId, baseAmount: l.count, amount: l.count * r.amount!, description: `${l.count} dars x ${fmt(r.amount!)}` });
        }
        break;
      case 'PERCENT': {
        const key = r.percentBase === 'CHARGED' ? 'charged' : 'paid';
        for (const g of targetGroups(input, r)) {
          const base = Math.max(0, input.bases.get(g)?.[key] ?? 0); // qaytarishlar asosni nolgacha kamaytiradi, manfiy maosh bo'lmaydi
          const amount = Math.round((base * r.percent!) / 100);
          if (amount <= 0) continue;
          out.push({ ruleId: r.id, employeeId: r.employeeId, groupId: g, baseAmount: base, amount, description: `${r.percentBase === 'CHARGED' ? 'Hisoblangan' : "To'langan"} ${fmt(base)} ning ${r.percent}%` });
        }
        break;
      }
    }
  }
  return out.sort((a, b) => a.employeeId.localeCompare(b.employeeId) || a.ruleId.localeCompare(b.ruleId) || (a.groupId ?? '').localeCompare(b.groupId ?? ''));
}
