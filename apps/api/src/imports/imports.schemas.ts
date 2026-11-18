import { z } from 'zod';

// multipart maydonlari matn bo'lib keladi: bo'sh matn = berilmagan, mantiqiy qiymat 'true' | 'false'
const empty = (v: unknown) => (v === '' ? undefined : v);
const flag = z.preprocess(empty, z.enum(['true', 'false']).default('false')).transform((v) => v === 'true');

export const runImportSchema = z.object({
  type: z.preprocess(empty, z.enum(['STUDENTS', 'GROUPS', 'PAYMENTS']).default('STUDENTS')),
  branchId: z.preprocess(empty, z.uuid().optional()), // fayldagi "Filial" ustuni yo'q yoki bo'sh qatorlar uchun sukut filial
  dryRun: flag, // faqat tekshirish: hech narsa yozilmaydi va tarixga tushmaydi
  skipInvalid: flag, // xatoli qatorlarni o'tkazib, to'g'rilarini yaratish (sukut: bitta xato bo'lsa hech narsa yaratilmaydi)
});
export type RunImportInput = z.infer<typeof runImportSchema>;

export const listImportsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListImportsQuery = z.infer<typeof listImportsSchema>;

/** Multer xotira fayli (faqat ishlatiladigan maydonlar). */
export interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  size: number;
}
