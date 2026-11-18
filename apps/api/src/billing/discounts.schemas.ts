import { z } from 'zod';

const reason = z.string().trim().min(1).max(200);

export const createDiscountSchema = z
  .object({
    type: z.enum(['PERCENT', 'AMOUNT', 'FREE']),
    value: z.number().int().positive().max(1_000_000_000_000).optional(), // PERCENT 1-100, AMOUNT so'm, FREE qiymatsiz
    reason, // sabab majburiy
    fromDate: z.iso.date().optional(), // to'lov muddati shu sanadan keyingi hisoblarga; yo'q = boshidan
    toDate: z.iso.date().optional(), // shu kun kiradi; yo'q = muddatsiz
  })
  .superRefine((v, ctx) => {
    if (v.type === 'FREE' && v.value !== undefined) ctx.addIssue({ code: 'custom', path: ['value'], message: "Bepul yozilishda qiymat bo'lmaydi" });
    if (v.type === 'PERCENT' && (v.value === undefined || v.value > 100)) ctx.addIssue({ code: 'custom', path: ['value'], message: "Foiz 1 dan 100 gacha bo'lishi kerak" });
    if (v.type === 'AMOUNT' && v.value === undefined) ctx.addIssue({ code: 'custom', path: ['value'], message: 'Summa majburiy' });
    if (v.fromDate && v.toDate && v.toDate < v.fromDate) ctx.addIssue({ code: 'custom', path: ['toDate'], message: "Tugash sanasi boshlanishdan oldin bo'lmasin" });
  });
export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;

export const endDiscountSchema = z.object({ toDate: z.iso.date().optional() }); // sukut: bugun

export const listDebtorsSchema = z.object({
  branchId: z.uuid().optional(),
  groupId: z.uuid().optional(),
  minDebt: z.coerce.number().int().min(1).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListDebtorsQuery = z.infer<typeof listDebtorsSchema>;
