export const ROLES = ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'CASHIER', 'TEACHER', 'STUDENT'] as const;
export type Role = (typeof ROLES)[number];

export const PAYMENT_MODES = ['GROUP_CYCLE', 'STUDENT_CYCLE'] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export * from './permissions';
export * from './permission-matrix';
