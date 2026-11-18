import { z } from 'zod';

const money = z.number().int().min(1).max(1_000_000_000_000);
const reason = z.string().trim().min(1).max(200);
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Oy YYYY-MM ko'rinishida bo'lishi kerak");
export const monthParamSchema = z.object({ month: monthSchema });

export const createRuleSchema = z
  .object({
    employeeId: z.uuid(),
    type: z.enum(['FIXED', 'PERCENT', 'PER_GROUP', 'PER_LESSON']),
    groupId: z.uuid().optional(), // yo'q = xodimning davrdagi hamma guruhi (FIXED uchun ahamiyatsiz)
    amount: money.optional(), // FIXED / PER_GROUP / PER_LESSON
    percent: z.number().min(0.01).max(100).multipleOf(0.01).optional(), // PERCENT
    percentBase: z.enum(['PAID', 'CHARGED']).optional(),
    teacherKind: z.enum(['MAIN', 'ASSISTANT']).optional(), // faqat shu sifatda biriktirilgan guruhlar
    validFrom: z.iso.date().optional(), // sukut: shu oyning 1-kuni
    validTo: z.iso.date().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.type === 'PERCENT') {
      if (v.percent === undefined) ctx.addIssue({ code: 'custom', path: ['percent'], message: 'Foiz majburiy' });
      if (v.percentBase === undefined) ctx.addIssue({ code: 'custom', path: ['percentBase'], message: 'Asos (PAID yoki CHARGED) majburiy' });
      if (v.amount !== undefined) ctx.addIssue({ code: 'custom', path: ['amount'], message: "Foizli qoidada summa bo'lmaydi" });
    } else {
      if (v.amount === undefined) ctx.addIssue({ code: 'custom', path: ['amount'], message: 'Summa majburiy' });
      if (v.percent !== undefined || v.percentBase !== undefined) ctx.addIssue({ code: 'custom', path: ['percent'], message: "Foiz faqat PERCENT qoidasida bo'ladi" });
    }
    if (v.validFrom && v.validTo && v.validTo < v.validFrom) ctx.addIssue({ code: 'custom', path: ['validTo'], message: "Tugash sanasi boshlanishdan oldin bo'lmasin" });
  });
export type CreateRuleInput = z.infer<typeof createRuleSchema>;

// Tur, xodim va guruh o'zgarmaydi (yangi qoida oching). Hisoblangan (tasdiqlangan) davrlarga ta'sir qilmaydi.
export const updateRuleSchema = z
  .object({
    amount: money.optional(),
    percent: z.number().min(0.01).max(100).multipleOf(0.01).optional(),
    percentBase: z.enum(['PAID', 'CHARGED']).optional(),
    teacherKind: z.enum(['MAIN', 'ASSISTANT']).nullable().optional(),
    validFrom: z.iso.date().optional(),
    validTo: z.iso.date().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Hech bo'lmasa bitta maydon kerak" });
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;

export const endRuleSchema = z.object({ validTo: z.iso.date().optional() }); // sukut: bugun

export const listRulesSchema = z.object({
  employeeId: z.uuid().optional(),
  groupId: z.uuid().optional(),
  active: z.enum(['true', 'false']).optional(), // bugun amalda
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListRulesQuery = z.infer<typeof listRulesSchema>;

export const createAdjustmentSchema = z.object({
  employeeId: z.uuid(),
  amount: z.number().int().refine((n) => n !== 0 && Math.abs(n) <= 1_000_000_000_000, { message: 'Summa 0 bo\'lmasligi kerak (musbat = bonus, manfiy = jarima)' }),
  reason,
});
export type CreateAdjustmentInput = z.infer<typeof createAdjustmentSchema>;

export const createPayoutSchema = z.object({
  month: monthSchema,
  employeeId: z.uuid(),
  amount: money,
  method: z.enum(['CASH', 'CARD', 'TRANSFER']),
  note: reason.optional(),
});
export type CreatePayoutInput = z.infer<typeof createPayoutSchema>;

export const reversePayoutSchema = z.object({ reason });

export const listPayoutsSchema = z.object({
  month: monthSchema.optional(),
  employeeId: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListPayoutsQuery = z.infer<typeof listPayoutsSchema>;

export const listPeriodsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(60).default(12),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListPeriodsQuery = z.infer<typeof listPeriodsSchema>;
