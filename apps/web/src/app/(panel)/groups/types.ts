import type { Slot } from '@/components/schedule-editor';

export interface Group {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
  courseId: string;
  courseName: string;
  priceMonthly?: number;
  billingMode?: 'GROUP_CYCLE' | 'STUDENT_CYCLE';
  billingDay?: number | null;
  graceDays?: number;
  startDate: string | null;
  endDate: string | null;
  status: 'PLANNED' | 'ACTIVE' | 'FINISHED';
  archivedAt: string | null;
  createdAt: string;
  studentCount: number;
  schedule: (Slot & { id: string })[];
  teachers: { teacherId: string; fullName: string; kind: 'MAIN' | 'ASSISTANT'; fromDate: string; toDate: string | null }[];
}

export const GROUP_STATUS: Record<Group['status'], { label: string; kind: 'ok' | 'warn' | 'mute' }> = {
  PLANNED: { label: 'Rejada', kind: 'warn' },
  ACTIVE: { label: 'Faol', kind: 'ok' },
  FINISHED: { label: 'Tugagan', kind: 'mute' },
};

export const BILLING_MODE: Record<string, string> = { GROUP_CYCLE: 'Guruh sikli', STUDENT_CYCLE: "O'quvchi sikli" };

export const mainTeacher = (g: Group) => g.teachers.find((t) => t.kind === 'MAIN' && !t.toDate)?.fullName ?? null;

export interface Lesson {
  id: string;
  groupId: string;
  groupName: string;
  lessonDate: string;
  teacherId: string | null;
  teacherName: string | null;
  topic: string | null;
  status: 'HELD' | 'CANCELLED';
  lockedAt: string | null;
  locked: boolean;
  summary: { present: number; absent: number; late: number; excused: number };
  roster?: { studentId: string; fullName: string; status: AttStatus | null; note: string | null; markedAt: string | null }[];
}
export type AttStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
