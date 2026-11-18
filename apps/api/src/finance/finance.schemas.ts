import { z } from 'zod';
import { daysBetween, todayLocal } from '../common/dates.js';

const category = z.string().trim().min(1).max(60);
const reason = z.string().trim().min(1).max(200);

export const createExpenseSchema = z.object({
  branchId: z.uuid().optional(), // berilmasa: xodimning yagona filiali (rahbar: markazning yagona faol filiali)
  category,
  amount: z.number().int().min(1).max(1_000_000_000_000),
  note: z.string().trim().min(1).max(200).optional(),
  spentOn: z.iso.date().optional(), // sukut: bugun; kelajak sanasi rad etiladi
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const voidExpenseSchema = z.object({ reason });

export const listExpensesSchema = z.object({
  branchId: z.uuid().optional(),
  category: category.optional(),
  status: z.enum(['ACTIVE', 'VOIDED']).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListExpensesQuery = z.infer<typeof listExpensesSchema>;

export const MAX_REPORT_DAYS = 366;

/** Hisobot oralig'i: sukut shu oyning boshidan bugungacha; `from <= to`, oraliq <= 366 kun. */
export const reportQuerySchema = z
  .object({
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    branchId: z.uuid().optional(),
  })
  .transform((q) => {
    const to = q.to ?? todayLocal();
    return { branchId: q.branchId, to, from: q.from ?? `${to.slice(0, 7)}-01` };
  })
  .refine((q) => q.from <= q.to, { message: "Boshlanish sanasi tugashdan keyin bo'lishi mumkin emas", path: ['from'] })
  .refine((q) => daysBetween(q.from, q.to) < MAX_REPORT_DAYS, { message: `Oraliq ${MAX_REPORT_DAYS} kundan oshmasin`, path: ['to'] });
export type ReportQuery = z.infer<typeof reportQuerySchema>;
