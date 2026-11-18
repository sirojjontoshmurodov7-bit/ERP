import { z } from 'zod';

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Faqat kichik lotin harf, raqam va '-'").min(3).max(40);
const phone = z.string().regex(/^\+?[0-9 ()-]{7,20}$/, "Telefon raqami noto'g'ri");

export const createCenterSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slug.optional(),
  planId: z.uuid().optional(),
  trialDays: z.number().int().min(0).max(365).optional(),
  ownerFullName: z.string().trim().min(2).max(120),
  ownerPhone: phone.optional(),
  ownerLogin: z
    .string()
    .regex(/^[a-z0-9][a-z0-9._-]{2,49}$/, "Login kichik lotin harf, raqam, '.', '_' yoki '-' bo'lishi kerak")
    .optional(),
});
export type CreateCenterInput = z.infer<typeof createCenterSchema>;

export const updateCenterSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    planId: z.uuid().nullable().optional(),
    trialEndsAt: z.iso.datetime().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Hech bo'lmasa bitta maydon kerak" });
export type UpdateCenterInput = z.infer<typeof updateCenterSchema>;

export const blockCenterSchema = z.object({ reason: z.string().trim().min(3).max(500) });
export const resetOwnerPasswordSchema = z.object({ userId: z.uuid().optional() });
export const idParamSchema = z.uuid();

export const listCentersSchema = z.object({
  status: z.enum(['TRIAL', 'ACTIVE', 'BLOCKED']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListCentersQuery = z.infer<typeof listCentersSchema>;
