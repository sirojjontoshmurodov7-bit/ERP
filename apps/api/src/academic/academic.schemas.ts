import { z } from 'zod';
import { todayLocal } from '../common/dates.js';

const text = (max: number) => z.string().trim().min(1).max(max);

/** Biriktirma: faqat http(s) havola (fayl yuklash yo'q). */
const link = z.object({
  name: text(100),
  url: z.url({ protocol: /^https?$/ }).max(500),
});
const links = z.array(link).max(10);
export type Link = z.infer<typeof link>;

export const createAssignmentSchema = z.object({
  title: text(200),
  description: text(5000).optional(),
  attachments: links.optional(),
  dueAt: z.iso.datetime({ offset: true }).optional(),
  maxScore: z.number().int().min(1).max(1000).optional(), // sukut 100
});
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

export const updateAssignmentSchema = z
  .object({
    title: text(200).optional(),
    description: text(5000).nullable().optional(),
    attachments: links.optional(),
    dueAt: z.iso.datetime({ offset: true }).nullable().optional(),
    maxScore: z.number().int().min(1).max(1000).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Hech bo'lmasa bitta maydon kerak" });
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;

export const listAssignmentsSchema = z.object({
  groupId: z.uuid().optional(),
  status: z.enum(['open', 'overdue']).optional(), // open: muddati o'tmagan yoki muddatsiz; overdue: muddati o'tgan
  includeArchived: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListAssignmentsQuery = z.infer<typeof listAssignmentsSchema>;

export const submitSchema = z
  .object({ text: text(10000).optional(), files: links.optional() })
  .refine((v) => v.text !== undefined || (v.files?.length ?? 0) > 0, { message: 'Matn yoki havola kerak' });
export type SubmitInput = z.infer<typeof submitSchema>;

export const gradeSchema = z.object({
  score: z.number().int().min(0).max(1000),
  feedback: text(1000).optional(),
});
export type GradeInput = z.infer<typeof gradeSchema>;

export const adjustRatingSchema = z.object({
  studentId: z.uuid(),
  groupId: z.uuid(),
  points: z.number().int().refine((n) => n !== 0 && Math.abs(n) <= 1000, { message: "Ball 0 bo'lmasligi va 1000 dan oshmasligi kerak (musbat = mukofot, manfiy = jarima)" }),
  reason: text(200),
});
export type AdjustRatingInput = z.infer<typeof adjustRatingSchema>;

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Oy YYYY-MM ko'rinishida bo'lishi kerak");

/** Reyting: kesim (guruh/filial/markaz) va davr (oy yoki umumiy). */
export const rankingQuerySchema = z
  .object({
    scope: z.enum(['group', 'branch', 'center']),
    groupId: z.uuid().optional(),
    branchId: z.uuid().optional(),
    period: z.enum(['month', 'all']).default('month'),
    month: monthSchema.optional(), // sukut: joriy oy
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .refine((q) => q.scope !== 'group' || !!q.groupId, { message: 'groupId majburiy', path: ['groupId'] })
  .refine((q) => q.scope !== 'branch' || !!q.branchId, { message: 'branchId majburiy', path: ['branchId'] })
  .transform((q) => ({ ...q, month: q.period === 'month' ? (q.month ?? todayLocal().slice(0, 7)) : undefined }));
export type RankingQuery = z.infer<typeof rankingQuerySchema>;

export const ratingEventsSchema = z.object({
  groupId: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type RatingEventsQuery = z.infer<typeof ratingEventsSchema>;
