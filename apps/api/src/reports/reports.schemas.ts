import { z } from 'zod';
import { daysBetween, todayLocal } from '../common/dates.js';

const MAX_DAYS = 366;

const range = z
  .object({ from: z.iso.date().optional(), to: z.iso.date().optional() })
  .transform((q) => {
    const to = q.to ?? todayLocal();
    return { to, from: q.from ?? `${to.slice(0, 7)}-01` };
  })
  .refine((q) => q.from <= q.to, { message: "Boshlanish sanasi tugashdan keyin bo'lishi mumkin emas", path: ['from'] })
  .refine((q) => daysBetween(q.from, q.to) < MAX_DAYS, { message: `Oraliq ${MAX_DAYS} kundan oshmasin`, path: ['to'] });

/** Umumiy hisobot: sana oralig'i (sukut shu oyning boshidan bugungacha). */
export const overviewQuerySchema = range;
export type OverviewQuery = z.infer<typeof overviewQuerySchema>;

export const BRANCH_SORTS = ['name', 'income', 'net', 'students', 'groups', 'debt', 'attendance'] as const;

/** Filiallarni solishtirish: oraliq + saralash (nom bo'yicha o'sish, qolganlari kamayish tartibida). */
export const branchesQuerySchema = z
  .object({ from: z.iso.date().optional(), to: z.iso.date().optional(), sort: z.enum(BRANCH_SORTS).default('name') })
  .transform((q) => {
    const to = q.to ?? todayLocal();
    return { to, from: q.from ?? `${to.slice(0, 7)}-01`, sort: q.sort };
  })
  .refine((q) => q.from <= q.to, { message: "Boshlanish sanasi tugashdan keyin bo'lishi mumkin emas", path: ['from'] })
  .refine((q) => daysBetween(q.from, q.to) < MAX_DAYS, { message: `Oraliq ${MAX_DAYS} kundan oshmasin`, path: ['to'] });
export type BranchesQuery = z.infer<typeof branchesQuerySchema>;
