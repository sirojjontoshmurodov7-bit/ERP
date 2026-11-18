import { z } from 'zod';

/** Markaz sozlamalari (PATCH): faqat amalda ishlatiladigan kalitlar; `rounding` hali yo'q. */
export const updateCenterSettingsSchema = z
  .object({
    billingMode: z.enum(['GROUP_CYCLE', 'STUDENT_CYCLE']).optional(),
    graceDays: z.number().int().min(0).max(60).optional(),
    joinProration: z.enum(['FULL_MONTH', 'REMAINING_LESSONS']).optional(),
    attendanceLockDays: z.number().int().min(0).max(365).optional(),
    locale: z.enum(['uz', 'ru', 'en']).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "Hech bo'lmasa bitta maydon kerak" });
export type UpdateCenterSettingsInput = z.infer<typeof updateCenterSettingsSchema>;
