import { z } from 'zod';

const money = z.number().int().min(1).max(1_000_000_000_000);
const reason = z.string().trim().min(1).max(200);

export const createManualChargeSchema = z.object({
  enrollmentId: z.uuid(),
  amount: money,
  dueDate: z.iso.date().optional(), // sukut: bugun
  note: reason, // qo'lda hisob uchun sabab majburiy
});
export type CreateManualChargeInput = z.infer<typeof createManualChargeSchema>;

export const cancelChargeSchema = z.object({ reason });

export const listChargesSchema = z.object({
  studentId: z.uuid().optional(),
  groupId: z.uuid().optional(),
  enrollmentId: z.uuid().optional(),
  branchId: z.uuid().optional(),
  status: z.enum(['OPEN', 'PARTIAL', 'PAID', 'CANCELLED']).optional(),
  kind: z.enum(['REGULAR', 'FIRST_PRORATED', 'MANUAL']).optional(),
  dueFrom: z.iso.date().optional(),
  dueTo: z.iso.date().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListChargesQuery = z.infer<typeof listChargesSchema>;

export const generateBillingSchema = z.object({ asOf: z.iso.date().optional() });
