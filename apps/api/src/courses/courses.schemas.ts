import { z } from 'zod';

const price = z.number().int().min(0).max(1_000_000_000_000);

export const createCourseSchema = z.object({
  name: z.string().trim().min(2).max(120),
  defaultPrice: price.optional(),
});
export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    defaultPrice: price.nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Hech bo'lmasa bitta maydon kerak" });
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

export const listCoursesSchema = z.object({
  includeArchived: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
});
