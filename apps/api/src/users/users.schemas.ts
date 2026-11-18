import { z } from 'zod';

const phone = z.string().regex(/^\+?[0-9 ()-]{7,20}$/, "Telefon raqami noto'g'ri");
const login = z.string().regex(/^[a-z0-9][a-z0-9._-]{2,49}$/, "Login kichik lotin harf, raqam, '.', '_' yoki '-' bo'lishi kerak");
const branchIds = z.array(z.uuid()).min(1, "Hech bo'lmasa bitta filial kerak").max(50);

export const STAFF_ROLES = ['ADMIN', 'CASHIER', 'TEACHER'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const createStaffSchema = z.object({
  role: z.enum(STAFF_ROLES),
  fullName: z.string().trim().min(2).max(120),
  login: login.optional(),
  phone: phone.optional(),
  branchIds,
  specialization: z.string().trim().min(1).max(120).optional(), // faqat ustoz
  note: z.string().trim().min(1).max(500).optional(), // faqat ustoz
});
export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const updateStaffSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    phone: phone.nullable().optional(),
    branchIds: branchIds.optional(), // faqat rahbar
    status: z.enum(['ACTIVE', 'SUSPENDED']).optional(), // faqat rahbar
    specialization: z.string().trim().min(1).max(120).nullable().optional(), // faqat ustoz
    note: z.string().trim().min(1).max(500).nullable().optional(), // faqat ustoz
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Hech bo'lmasa bitta maydon kerak" });
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

export const listStaffSchema = z.object({
  role: z.enum(STAFF_ROLES).optional(),
  branchId: z.uuid().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListStaffQuery = z.infer<typeof listStaffSchema>;
