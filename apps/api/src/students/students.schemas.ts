import { z } from 'zod';
import { todayLocal } from '../common/dates.js';

const phone = z.string().regex(/^\+?[0-9 ()-]{7,20}$/, "Telefon raqami noto'g'ri");
const login = z.string().regex(/^[a-z0-9][a-z0-9._-]{2,49}$/, "Login kichik lotin harf, raqam, '.', '_' yoki '-' bo'lishi kerak");
const birthDate = z.iso.date().refine((d) => d <= todayLocal(), { message: 'Tug\'ilgan sana kelajakda bo\'lishi mumkin emas' });
const text = (max: number) => z.string().trim().min(1).max(max);

export const createStudentSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  branchId: z.uuid(),
  login: login.optional(),
  phone: phone.optional(),
  birthDate: birthDate.optional(),
  parentName: text(120).optional(),
  parentPhone: phone.optional(),
  note: text(500).optional(),
});
export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    phone: phone.nullable().optional(),
    birthDate: birthDate.nullable().optional(),
    parentName: text(120).nullable().optional(),
    parentPhone: phone.nullable().optional(),
    note: text(500).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Hech bo'lmasa bitta maydon kerak" });
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

export const listStudentsSchema = z.object({
  q: z.string().trim().min(1).max(100).optional(), // ism, login yoki telefon bo'yicha qidiruv
  branchId: z.uuid().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListStudentsQuery = z.infer<typeof listStudentsSchema>;
