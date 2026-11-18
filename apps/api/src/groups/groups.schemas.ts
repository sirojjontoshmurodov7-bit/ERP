import { z } from 'zod';

const price = z.number().int().min(0).max(1_000_000_000_000);
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Vaqt SS:DD ko'rinishida bo'lishi kerak");
const billingMode = z.enum(['GROUP_CYCLE', 'STUDENT_CYCLE']);

export const scheduleItemSchema = z
  .object({
    weekday: z.number().int().min(1).max(7), // 1 = dushanba ... 7 = yakshanba
    startTime: hhmm,
    endTime: hhmm,
    room: z.string().trim().min(1).max(60).optional(),
  })
  .refine((v) => v.endTime > v.startTime, { message: "Tugash vaqti boshlanishdan keyin bo'lishi kerak" });
export type ScheduleItem = z.infer<typeof scheduleItemSchema>;

/** Bitta kunda darslar kesishmasligi va takrorlanmasligi. */
export const scheduleSchema = z.array(scheduleItemSchema).max(21).superRefine((items, ctx) => {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]!;
      const b = items[j]!;
      if (a.weekday === b.weekday && a.startTime < b.endTime && b.startTime < a.endTime) {
        ctx.addIssue({ code: 'custom', message: `Dars vaqtlari kesishadi (hafta kuni ${a.weekday})`, path: [j] });
      }
    }
  }
});

export const createGroupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  branchId: z.uuid(),
  courseId: z.uuid(),
  // Moliyaviy maydonlar: berilsa `group.billing_settings` kerak; berilmasa kurs narxi va markaz sukutlari olinadi.
  priceMonthly: price.optional(),
  billingMode: billingMode.optional(),
  billingDay: z.number().int().min(1).max(28).optional(),
  graceDays: z.number().int().min(0).max(60).optional(),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
  status: z.enum(['PLANNED', 'ACTIVE']).optional(),
  schedule: scheduleSchema.optional(),
});
export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    courseId: z.uuid().optional(),
    priceMonthly: price.optional(),
    billingMode: billingMode.optional(),
    billingDay: z.number().int().min(1).max(28).optional(),
    graceDays: z.number().int().min(0).max(60).optional(),
    startDate: z.iso.date().nullable().optional(),
    endDate: z.iso.date().nullable().optional(),
    status: z.enum(['PLANNED', 'ACTIVE', 'FINISHED']).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Hech bo'lmasa bitta maydon kerak" });
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

export const BILLING_KEYS = ['priceMonthly', 'billingMode', 'billingDay', 'graceDays'] as const;

export const listGroupsSchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  branchId: z.uuid().optional(),
  courseId: z.uuid().optional(),
  teacherId: z.uuid().optional(),
  status: z.enum(['PLANNED', 'ACTIVE', 'FINISHED']).optional(),
  includeArchived: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListGroupsQuery = z.infer<typeof listGroupsSchema>;

export const setScheduleSchema = z.object({ schedule: scheduleSchema });

export const assignTeacherSchema = z.object({
  teacherId: z.uuid(),
  kind: z.enum(['MAIN', 'ASSISTANT']).default('MAIN'),
  fromDate: z.iso.date().optional(),
});
export type AssignTeacherInput = z.infer<typeof assignTeacherSchema>;

export const endTeacherSchema = z.object({ toDate: z.iso.date().optional() });
