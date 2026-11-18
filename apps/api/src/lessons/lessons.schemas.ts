import { z } from 'zod';

export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

const topic = z.string().trim().min(1).max(200);

export const createLessonSchema = z.object({
  lessonDate: z.iso.date(),
  topic: topic.optional(),
  teacherId: z.uuid().optional(), // sukut: ustozning o'zi yoki guruhning amaldagi asosiy ustozi
});
export type CreateLessonInput = z.infer<typeof createLessonSchema>;

export const updateLessonSchema = z
  .object({
    topic: topic.nullable().optional(),
    teacherId: z.uuid().nullable().optional(),
    status: z.enum(['HELD', 'CANCELLED']).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Hech bo'lmasa bitta maydon kerak" });
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;

export const listLessonsSchema = z.object({
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  status: z.enum(['HELD', 'CANCELLED']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListLessonsQuery = z.infer<typeof listLessonsSchema>;

export const markAttendanceSchema = z.object({
  records: z
    .array(
      z.object({
        studentId: z.uuid(),
        status: z.enum(ATTENDANCE_STATUSES),
        note: z.string().trim().min(1).max(200).nullable().optional(),
      }),
    )
    .min(1)
    .max(300),
});
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
