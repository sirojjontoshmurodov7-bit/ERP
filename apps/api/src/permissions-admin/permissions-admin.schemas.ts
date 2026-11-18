import { z } from 'zod';

const nonEmpty = <T extends Record<string, unknown>>(v: T) => Object.keys(v).length > 0;

export const roleParamSchema = z.enum(['ADMIN', 'CASHIER', 'TEACHER', 'OWNER', 'STUDENT']);

/** Rol shabloni: { "payment.create": true, ... } */
export const setRolePermissionsSchema = z.object({
  permissions: z.record(z.string(), z.boolean()).refine(nonEmpty, { message: "Hech bo'lmasa bitta ruxsat kerak" }),
});

/** Foydalanuvchi istisnosi: true/false = istisno, null = istisnoni olib tashlash (shablonga qaytish). */
export const setUserPermissionsSchema = z.object({
  permissions: z.record(z.string(), z.boolean().nullable()).refine(nonEmpty, { message: "Hech bo'lmasa bitta ruxsat kerak" }),
});
