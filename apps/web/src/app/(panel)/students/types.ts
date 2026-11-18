export interface Student {
  id: string;
  login: string;
  fullName: string;
  phone: string | null;
  status: 'ACTIVE' | 'ARCHIVED' | 'SUSPENDED';
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  branchIds: string[];
  birthDate: string | null;
  parentName: string | null;
  parentPhone: string | null;
  note: string | null;
}

export interface Enrollment {
  id: string;
  groupId: string;
  groupName: string;
  branchId: string;
  branchName: string;
  courseName: string;
  studentId: string;
  studentName: string;
  status: 'ACTIVE' | 'FROZEN' | 'LEFT';
  joinedAt: string;
  leftAt: string | null;
  leftReason: string | null;
  billingAnchor: string | null;
  priceOverride: number | null;
}

export const ENROLL_STATUS: Record<Enrollment['status'], { label: string; kind: 'ok' | 'warn' | 'mute' }> = {
  ACTIVE: { label: 'Faol', kind: 'ok' },
  FROZEN: { label: 'Muzlatilgan', kind: 'warn' },
  LEFT: { label: 'Chiqqan', kind: 'mute' },
};
