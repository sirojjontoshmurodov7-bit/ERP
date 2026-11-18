import { z } from 'zod';

const price = z.number().int().min(0).max(1_000_000_000_000);
const reason = z.string().trim().min(1).max(200);

export const createEnrollmentSchema = z.object({
  groupId: z.uuid(),
  studentId: z.uuid(),
  joinedAt: z.iso.date().optional(), // sukut: bugun
  priceOverride: price.optional(), // faqat `group.billing_settings` bilan
});
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;

export const leaveEnrollmentSchema = z.object({
  reason: reason.optional(),
  leftAt: z.iso.date().optional(), // sukut: bugun
});
export type LeaveEnrollmentInput = z.infer<typeof leaveEnrollmentSchema>;

export const transferEnrollmentSchema = z.object({
  toGroupId: z.uuid(),
  reason: reason.optional(),
  transferDate: z.iso.date().optional(), // sukut: bugun
  priceOverride: price.optional(), // yangi guruh uchun; eskisi ko'chirilmaydi
});
export type TransferEnrollmentInput = z.infer<typeof transferEnrollmentSchema>;

export const listEnrollmentsSchema = z.object({
  groupId: z.uuid().optional(),
  studentId: z.uuid().optional(),
  branchId: z.uuid().optional(),
  status: z.enum(['ACTIVE', 'FROZEN', 'LEFT']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListEnrollmentsQuery = z.infer<typeof listEnrollmentsSchema>;
