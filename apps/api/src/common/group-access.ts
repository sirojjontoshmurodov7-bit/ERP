// Guruh va yozilishga kirish qamrovi: ustoz (amaldagi biriktirilgan guruhlari) va o'quvchi (tugallanmagan yozilishlari).
import { and, eq, gte, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import type { AuthUser } from '../auth/auth.types.js';
import type { Tx } from '../db/db.service.js';
import { enrollments, groups, groupTeachers } from '../db/schema.js';
import { type BranchScope, branchFilter } from './branch-scope.js';

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

/**
 * Guruhlarni ko'rish qamrovi (`groups` jadvali ustida): ustoz amaldagi guruhlari, o'quvchi yozilgan guruhlari,
 * qolganlar filial qamrovi bo'yicha (rahbar hammasi). `undefined` = cheklov yo'q.
 */
export function groupVisibility(tx: Tx, actor: Pick<AuthUser, 'id' | 'role'>, scope: BranchScope): SQL | undefined {
  if (actor.role === 'TEACHER') return inArray(groups.id, teacherGroupIds(tx, actor.id));
  if (actor.role === 'STUDENT') return inArray(groups.id, studentGroupIds(tx, actor.id));
  return branchFilter(groups.branchId, scope);
}
