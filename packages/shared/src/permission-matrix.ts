// Ruxsatlar matritsasi (ERD-VA-RUXSATLAR.md, 3-bo'lim) mashinaga o'qiladigan ko'rinishda.
// ✔ -> `default` (markaz yaratilganda allowed=true), ○ -> `optional` (allowed=false qator; rahbar yoqishi mumkin),
// – -> ro'yxatda yo'q (hech qachon). Qamrov belgilari (f = filial, o = o'zi/o'z guruhi) ruxsatga emas, so'rov filtriga tegishli.
// Platforma ruxsatlari (SUPER_ADMIN) bu yerda emas: ular rolga qat'iy biriktirilgan (PLATFORM_ONLY_PERMISSIONS).
import type { Role } from './index';

export type TenantRole = Exclude<Role, 'SUPER_ADMIN'>;

export interface RoleMatrix {
  default: readonly string[];
  optional: readonly string[];
}

export const ROLE_PERMISSION_MATRIX: Readonly<Record<TenantRole, RoleMatrix>> = {
  OWNER: {
    default: [
      'center.view_own_subscription',
      'branch.manage', 'staff.create', 'teacher.create', 'teacher.edit', 'student.create', 'student.edit',
      'student.archive', 'user.reset_password', 'user.change_own_password', 'permissions.manage', 'student.view',
      'group.create', 'group.edit', 'group.billing_settings', 'group.view', 'enrollment.manage',
      'attendance.view', 'attendance.mark', 'attendance.edit_past', 'homework.view', 'rating.view', 'rating.adjust',
      'payment.create', 'payment.view', 'payment.reverse', 'debtors.view', 'discount.grant', 'charge.adjust',
      'expense.manage', 'finance.report', 'payroll.rules.manage', 'payroll.calculate', 'payroll.approve',
      'payroll.view_all', 'payroll.pay',
      'report.overview', 'report.branch_compare', 'audit.view', 'import.run', 'telegram.settings', 'notification.send',
    ],
    optional: [],
  },
  ADMIN: {
    default: [
      'teacher.create', 'teacher.edit', 'student.create', 'student.edit', 'user.reset_password',
      'user.change_own_password', 'student.view',
      'group.create', 'group.edit', 'group.view', 'enrollment.manage', 'attendance.view', 'homework.view', 'rating.view',
    ],
    optional: [
      'student.archive', 'group.billing_settings', 'attendance.mark', 'attendance.edit_past',
      'payment.create', 'payment.view', 'debtors.view', 'discount.grant', 'finance.report',
      'import.run', 'telegram.settings', 'notification.send',
    ],
  },
  CASHIER: {
    default: [
      'user.change_own_password', 'student.view', 'group.view',
      'payment.create', 'payment.view', 'debtors.view', 'finance.report', 'payroll.view_all',
    ],
    optional: ['payment.reverse', 'discount.grant', 'expense.manage', 'payroll.calculate', 'payroll.pay'],
  },
  TEACHER: {
    default: [
      'user.change_own_password', 'student.view', 'group.view', 'attendance.view', 'attendance.mark',
      'homework.create', 'homework.grade', 'homework.view', 'rating.view', 'rating.adjust', 'payroll.view_own',
    ],
    optional: ['debtors.view'],
  },
  STUDENT: {
    default: [
      'user.change_own_password', 'student.view', 'group.view', 'attendance.view', 'homework.view',
      'homework.submit', 'rating.view', 'payment.view', 'debtors.view',
    ],
    optional: [],
  },
};

export interface RolePermissionRow {
  role: TenantRole;
  permissionCode: string;
  allowed: boolean;
}

/** Yangi markaz uchun `center_role_permissions` boshlang'ich qatorlari. */
export function defaultRolePermissionRows(): RolePermissionRow[] {
  const rows: RolePermissionRow[] = [];
  for (const [role, m] of Object.entries(ROLE_PERMISSION_MATRIX) as [TenantRole, RoleMatrix][]) {
    for (const permissionCode of m.default) rows.push({ role, permissionCode, allowed: true });
    for (const permissionCode of m.optional) rows.push({ role, permissionCode, allowed: false });
  }
  return rows;
}

/** Markaz sozlamalarining boshlang'ich qiymatlari (`centers.settings`). */
export const DEFAULT_CENTER_SETTINGS = {
  billing_mode: 'GROUP_CYCLE',
  grace_days: 0,
  join_proration: 'FULL_MONTH',
  rounding: 'NONE',
  locale: 'uz',
} as const;

export const DEFAULT_TRIAL_DAYS = 14;
