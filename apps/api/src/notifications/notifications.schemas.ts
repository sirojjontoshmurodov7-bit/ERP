import { z } from 'zod';

export const NOTIFICATION_TYPES = ['DEBT', 'LESSON', 'HOMEWORK', 'PAYROLL', 'MANUAL'] as const;
export const RUN_TYPES = ['DEBT', 'LESSON', 'HOMEWORK', 'PAYROLL'] as const;
export type RunType = (typeof RUN_TYPES)[number];

export const sendSchema = z.object({
  userId: z.uuid(),
  message: z.string().trim().min(1).max(1000),
});

export const listNotificationsSchema = z.object({
  userId: z.uuid().optional(),
  type: z.enum(NOTIFICATION_TYPES).optional(),
  status: z.enum(['SENT', 'FAILED']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>;

/** Bo'sh tanali so'rov ham yaroqli (hamma sukut qiymatlar). */
export const runSchema = z.preprocess((v) => v ?? {}, z.object({
  types: z.array(z.enum(RUN_TYPES)).min(1).max(RUN_TYPES.length).optional(),
  /** Qarz eslatmasi bir o'quvchiga ko'pi bilan har shuncha kunda (sukut: 7). */
  debtGapDays: z.number().int().min(1).max(90).default(7),
}));
export type RunInput = z.infer<typeof runSchema>;

/** Telegram `Update` dan bizga kerak qismi; qolgani e'tiborsiz. */
export const telegramUpdateSchema = z.object({
  message: z
    .object({
      text: z.string().max(4096).optional(),
      chat: z.object({ id: z.number().int(), type: z.string() }),
    })
    .optional(),
});
