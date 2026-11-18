import { z } from 'zod';

const phone = z.string().regex(/^\+?[0-9 ()-]{7,20}$/, "Telefon raqami noto'g'ri");

export const createBranchSchema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().min(1).max(300).optional(),
  phone: phone.optional(),
});
export type CreateBranchInput = z.infer<typeof createBranchSchema>;

export const updateBranchSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    address: z.string().trim().min(1).max(300).nullable().optional(),
    phone: phone.nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Hech bo'lmasa bitta maydon kerak" });
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;

export const listBranchesSchema = z.object({
  includeArchived: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
});
