import { z } from 'zod';

const limit = z.number().int().min(1).max(1_000_000);
const features = z
  .record(z.string().regex(/^[a-z][a-z0-9_]{0,39}$/), z.union([z.boolean(), z.number(), z.string().max(100)]))
  .refine((v) => Object.keys(v).length <= 30, { message: "Imkoniyatlar 30 tadan oshmasin" });

export const createPlanSchema = z.object({
  name: z.string().trim().min(2).max(60),
  priceMonthly: z.number().int().min(0).max(1_000_000_000).default(0),
  maxStudents: limit.nullable().default(null), // null = cheklanmagan
  maxBranches: limit.nullable().default(null),
  features: features.default({}),
});
export type CreatePlanInput = z.infer<typeof createPlanSchema>;

export const updatePlanSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    priceMonthly: z.number().int().min(0).max(1_000_000_000).optional(),
    maxStudents: limit.nullable().optional(),
    maxBranches: limit.nullable().optional(),
    features: features.optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "Hech bo'lmasa bitta maydon kerak" });
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
