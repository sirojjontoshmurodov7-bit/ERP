import { z } from 'zod';

const note = z.string().trim().min(1).max(200);

export const createPaymentSchema = z.object({
  studentId: z.uuid(),
  amount: z.number().int().min(1).max(1_000_000_000_000),
  method: z.enum(['CASH', 'CARD', 'TRANSFER']), // CLICK/PAYME: to'lov provayderi qo'shilganda
  branchId: z.uuid().optional(), // berilmasa: o'quvchining (qamrovdagi) yagona filiali
  paidAt: z.iso.datetime({ offset: true }).optional(), // sukut: hozir; kelajak sanasi rad etiladi
  note: note.optional(),
});
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const reversePaymentSchema = z.object({ reason: note });

export const listPaymentsSchema = z.object({
  studentId: z.uuid().optional(),
  branchId: z.uuid().optional(),
  method: z.enum(['CASH', 'CARD', 'TRANSFER', 'CLICK', 'PAYME']).optional(),
  status: z.enum(['CONFIRMED', 'REVERSED']).optional(),
  from: z.iso.date().optional(), // Asia/Tashkent sanasi bo'yicha, shu kun kiradi
  to: z.iso.date().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListPaymentsQuery = z.infer<typeof listPaymentsSchema>;
