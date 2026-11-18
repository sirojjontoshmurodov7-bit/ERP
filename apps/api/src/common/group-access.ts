// Guruh va yozilishga kirish qamrovi: ustoz (amaldagi biriktirilgan guruhlari) va o'quvchi (tugallanmagan yozilishlari).
import { and, eq, gte, inArray, isNull, or, sql } from 'drizzle-orm';
import type { Tx } from '../db/db.service.js';
import { enrollments, groupTeachers } from '../db/schema.js';

/** Ustoz biriktirilishi amalda: tugash sanasi yo'q yoki bugundan oldin emas. */
export const currentTeacher = or(isNull(groupTeachers.toDate), gte(groupTeachers.toDate, sql`current_date`));

/** Ustozning amaldagi guruhlari (subquery). */
export const teacherGroupIds = (tx: Tx, teacherId: string) =>
  tx.select({ id: groupTeachers.groupId }).from(groupTeachers).where(and(eq(groupTeachers.teacherId, teacherId), currentTeacher));

/** O'quvchining tugallanmagan (ACTIVE/FROZEN) yozilishlaridagi guruhlar (subquery). */
export const studentGroupIds = (tx: Tx, studentId: string) =>
  tx.select({ id: enrollments.groupId }).from(enrollments).where(and(eq(enrollments.studentId, studentId), sql`${enrollments.status} <> 'LEFT'`));

/** Ustozning amaldagi guruhlaridagi tugallanmagan yozilishlarga ega o'quvchilar (subquery). */
export const teacherStudentIds = (tx: Tx, teacherId: string) =>
  tx
    .select({ id: enrollments.studentId })
    .from(enrollments)
    .where(and(sql`${enrollments.status} <> 'LEFT'`, inArray(enrollments.groupId, teacherGroupIds(tx, teacherId))));
