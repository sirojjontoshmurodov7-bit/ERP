// Ma'lumotlar modeli manbasi: ERD-VA-RUXSATLAR.md (2.1). Skelet bosqichi, 2-qadam.
// RLS siyosatlari, huquqlar va triggerlar drizzle/0001_rls_and_grants.sql da (qo'lda yozilgan SQL).
import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  foreignKey,
  unique,
  bigint,
  bigserial,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

const ts = (name: string) => timestamp(name, { withTimezone: true });
const createdAt = () => ts('created_at').notNull().defaultNow();

export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  priceMonthly: bigint('price_monthly', { mode: 'number' }).notNull().default(0),
  maxStudents: integer('max_students'), // NULL = cheklanmagan
  maxBranches: integer('max_branches'), // NULL = cheklanmagan
  features: jsonb('features').notNull().default(sql`'{}'::jsonb`),
  createdAt: createdAt(),
});

export const centers = pgTable(
  'centers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    status: text('status').notNull().default('TRIAL'),
    planId: uuid('plan_id').references(() => plans.id),
    trialEndsAt: ts('trial_ends_at'),
    blockedAt: ts('blocked_at'),
    blockedReason: text('blocked_reason'),
    // billing mode, grace_days, rounding, locale, join_proration
    settings: jsonb('settings').notNull().default(sql`'{}'::jsonb`),
    createdBy: uuid('created_by').references((): AnyPgColumn => users.id),
    createdAt: createdAt(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [check('centers_status_chk', sql`${t.status} in ('TRIAL','ACTIVE','BLOCKED')`)],
);

export const branches = pgTable(
  'branches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    name: text('name').notNull(),
    address: text('address'),
    phone: text('phone'),
    archivedAt: ts('archived_at'),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('branches_center_name_uq').on(t.centerId, t.name),
    // Kompozit FK nishoni: boshqa markazga bog'lashni bazaning o'zi taqiqlaydi
    unique('branches_id_center_uq').on(t.id, t.centerId),
  ],
);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id').references(() => centers.id), // NULL = super admin
    role: text('role').notNull(),
    login: text('login').notNull(),
    passwordHash: text('password_hash').notNull(),
    mustChangePassword: boolean('must_change_password').notNull().default(true),
    fullName: text('full_name').notNull(),
    phone: text('phone'),
    status: text('status').notNull().default('ACTIVE'),
    telegramChatId: bigint('telegram_chat_id', { mode: 'number' }),
    totpSecret: text('totp_secret'),
    createdBy: uuid('created_by').references((): AnyPgColumn => users.id),
    lastLoginAt: ts('last_login_at'),
    createdAt: createdAt(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('users_login_uq').on(sql`lower(${t.login})`), // login global noyob, registrsiz
    index('users_center_role_idx').on(t.centerId, t.role),
    unique('users_id_center_uq').on(t.id, t.centerId),
    check(
      'users_role_chk',
      sql`${t.role} in ('SUPER_ADMIN','OWNER','ADMIN','CASHIER','TEACHER','STUDENT')`,
    ),
    check('users_status_chk', sql`${t.status} in ('ACTIVE','SUSPENDED','ARCHIVED')`),
    // Super admin markazsiz, qolgan hamma rol bitta markazga tegishli
    check('users_center_role_scope_chk', sql`(${t.role} = 'SUPER_ADMIN') = (${t.centerId} is null)`),
  ],
);

export const userBranches = pgTable(
  'user_branches',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id), // RLS uchun
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.branchId] }),
    foreignKey({ name: 'user_branches_branch_center_fk', columns: [t.branchId, t.centerId], foreignColumns: [branches.id, branches.centerId] }),
    foreignKey({ name: 'user_branches_user_center_fk', columns: [t.userId, t.centerId], foreignColumns: [users.id, users.centerId] }),
    index('user_branches_branch_idx').on(t.branchId),
    index('user_branches_center_idx').on(t.centerId),
  ],
);

// Ustoz profili (ERD 2.1). RLS uchun center_id; kompozit FK boshqa markaz foydalanuvchisiga bog'lashni rad etadi.
export const teacherProfiles = pgTable(
  'teacher_profiles',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    specialization: text('specialization'),
    note: text('note'),
  },
  (t) => [
    foreignKey({ name: 'teacher_profiles_user_center_fk', columns: [t.userId, t.centerId], foreignColumns: [users.id, users.centerId] }),
    index('teacher_profiles_center_idx').on(t.centerId),
  ],
);

// O'quvchi profili (ERD 2.1). Filial `user_branches` orqali, guruhga yozilish `enrollments` orqali belgilanadi.
export const studentProfiles = pgTable(
  'student_profiles',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    birthDate: date('birth_date', { mode: 'string' }),
    parentName: text('parent_name'),
    parentPhone: text('parent_phone'),
    note: text('note'),
  },
  (t) => [
    foreignKey({ name: 'student_profiles_user_center_fk', columns: [t.userId, t.centerId], foreignColumns: [users.id, users.centerId] }),
    index('student_profiles_center_idx').on(t.centerId),
  ],
);

// --- O'quv jarayoni (ERD 2.2): kurs, guruh, jadval, ustoz ---
export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    name: text('name').notNull(),
    defaultPrice: bigint('default_price', { mode: 'number' }),
    archivedAt: ts('archived_at'),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('courses_center_name_uq').on(t.centerId, sql`lower(${t.name})`),
    unique('courses_id_center_uq').on(t.id, t.centerId),
    check('courses_price_chk', sql`${t.defaultPrice} is null or ${t.defaultPrice} >= 0`),
  ],
);

export const groups = pgTable(
  'groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    branchId: uuid('branch_id').notNull(),
    courseId: uuid('course_id').notNull(),
    name: text('name').notNull(),
    priceMonthly: bigint('price_monthly', { mode: 'number' }).notNull(),
    billingMode: text('billing_mode').notNull(), // GROUP_CYCLE | STUDENT_CYCLE
    billingDay: integer('billing_day'), // faqat GROUP_CYCLE, 1-28
    graceDays: integer('grace_days').notNull().default(0),
    startDate: date('start_date', { mode: 'string' }),
    endDate: date('end_date', { mode: 'string' }),
    status: text('status').notNull().default('PLANNED'), // PLANNED | ACTIVE | FINISHED
    archivedAt: ts('archived_at'),
    createdAt: createdAt(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [
    foreignKey({ name: 'groups_branch_center_fk', columns: [t.branchId, t.centerId], foreignColumns: [branches.id, branches.centerId] }),
    foreignKey({ name: 'groups_course_center_fk', columns: [t.courseId, t.centerId], foreignColumns: [courses.id, courses.centerId] }),
    unique('groups_id_center_uq').on(t.id, t.centerId),
    uniqueIndex('groups_branch_name_uq').on(t.branchId, sql`lower(${t.name})`),
    index('groups_center_branch_idx').on(t.centerId, t.branchId),
    index('groups_course_idx').on(t.courseId),
    check('groups_price_chk', sql`${t.priceMonthly} >= 0`),
    check('groups_billing_mode_chk', sql`${t.billingMode} in ('GROUP_CYCLE','STUDENT_CYCLE')`),
    check(
      'groups_billing_day_chk',
      sql`(${t.billingMode} = 'GROUP_CYCLE' and ${t.billingDay} is not null and ${t.billingDay} between 1 and 28) or (${t.billingMode} = 'STUDENT_CYCLE' and ${t.billingDay} is null)`,
    ),
    check('groups_grace_chk', sql`${t.graceDays} between 0 and 60`),
    check('groups_status_chk', sql`${t.status} in ('PLANNED','ACTIVE','FINISHED')`),
    check('groups_dates_chk', sql`${t.endDate} is null or ${t.startDate} is null or ${t.endDate} >= ${t.startDate}`),
  ],
);

export const groupSchedules = pgTable(
  'group_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id').notNull(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    weekday: integer('weekday').notNull(), // 1 = dushanba ... 7 = yakshanba
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    room: text('room'),
  },
  (t) => [
    foreignKey({ name: 'group_schedules_group_center_fk', columns: [t.groupId, t.centerId], foreignColumns: [groups.id, groups.centerId] }),
    uniqueIndex('group_schedules_slot_uq').on(t.groupId, t.weekday, t.startTime),
    index('group_schedules_center_idx').on(t.centerId),
    check('group_schedules_weekday_chk', sql`${t.weekday} between 1 and 7`),
    check('group_schedules_time_chk', sql`${t.endTime} > ${t.startTime}`),
  ],
);

export const groupTeachers = pgTable(
  'group_teachers',
  {
    groupId: uuid('group_id').notNull(),
    teacherId: uuid('teacher_id').notNull(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    kind: text('kind').notNull(), // MAIN | ASSISTANT
    fromDate: date('from_date', { mode: 'string' }).notNull().default(sql`current_date`),
    toDate: date('to_date', { mode: 'string' }),
  },
  (t) => [
    primaryKey({ columns: [t.groupId, t.teacherId, t.fromDate] }),
    foreignKey({ name: 'group_teachers_group_center_fk', columns: [t.groupId, t.centerId], foreignColumns: [groups.id, groups.centerId] }),
    foreignKey({ name: 'group_teachers_teacher_center_fk', columns: [t.teacherId, t.centerId], foreignColumns: [users.id, users.centerId] }),
    // Guruhda bir vaqtda bitta asosiy ustoz
    uniqueIndex('group_teachers_one_main_uq').on(t.groupId).where(sql`${t.kind} = 'MAIN' and ${t.toDate} is null`),
    index('group_teachers_teacher_idx').on(t.teacherId),
    index('group_teachers_center_idx').on(t.centerId),
    check('group_teachers_kind_chk', sql`${t.kind} in ('MAIN','ASSISTANT')`),
    check('group_teachers_dates_chk', sql`${t.toDate} is null or ${t.toDate} >= ${t.fromDate}`),
  ],
);

// --- Yozilish (ERD 2.2). Qator hech qachon o'chirilmaydi: chiqish/ko'chirish `LEFT` bilan yopiladi (tarix saqlanadi). ---
export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    groupId: uuid('group_id').notNull(),
    studentId: uuid('student_id').notNull(),
    joinedAt: date('joined_at', { mode: 'string' }).notNull().default(sql`current_date`),
    leftAt: date('left_at', { mode: 'string' }),
    status: text('status').notNull().default('ACTIVE'), // ACTIVE | FROZEN | LEFT
    billingAnchor: date('billing_anchor', { mode: 'string' }), // faqat STUDENT_CYCLE: davr boshi kuni
    priceOverride: bigint('price_override', { mode: 'number' }),
    leftReason: text('left_reason'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: createdAt(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [
    foreignKey({ name: 'enrollments_group_center_fk', columns: [t.groupId, t.centerId], foreignColumns: [groups.id, groups.centerId] }),
    foreignKey({ name: 'enrollments_student_center_fk', columns: [t.studentId, t.centerId], foreignColumns: [users.id, users.centerId] }),
    unique('enrollments_id_center_uq').on(t.id, t.centerId),
    // Bitta o'quvchi bitta guruhda bir vaqtda faqat bitta tugallanmagan yozilishga ega
    uniqueIndex('enrollments_open_uq').on(t.groupId, t.studentId).where(sql`${t.status} <> 'LEFT'`),
    index('enrollments_student_idx').on(t.studentId),
    index('enrollments_group_idx').on(t.groupId),
    index('enrollments_center_idx').on(t.centerId),
    check('enrollments_status_chk', sql`${t.status} in ('ACTIVE','FROZEN','LEFT')`),
    check('enrollments_left_chk', sql`(${t.status} = 'LEFT') = (${t.leftAt} is not null)`),
    check('enrollments_dates_chk', sql`${t.leftAt} is null or ${t.leftAt} >= ${t.joinedAt}`),
    check('enrollments_price_chk', sql`${t.priceOverride} is null or ${t.priceOverride} >= 0`),
  ],
);

// Jadval tayyor; chegirma berish (`discount.grant`) moliya bosqichida qo'shiladi.
export const enrollmentDiscounts = pgTable(
  'enrollment_discounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    enrollmentId: uuid('enrollment_id').notNull(),
    type: text('type').notNull(), // PERCENT | AMOUNT | FREE
    value: bigint('value', { mode: 'number' }),
    reason: text('reason'),
    fromDate: date('from_date', { mode: 'string' }),
    toDate: date('to_date', { mode: 'string' }),
    grantedBy: uuid('granted_by').references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({ name: 'enrollment_discounts_enrollment_center_fk', columns: [t.enrollmentId, t.centerId], foreignColumns: [enrollments.id, enrollments.centerId] }),
    index('enrollment_discounts_enrollment_idx').on(t.enrollmentId),
    index('enrollment_discounts_center_idx').on(t.centerId),
    check('enrollment_discounts_type_chk', sql`${t.type} in ('PERCENT','AMOUNT','FREE')`),
    check(
      'enrollment_discounts_value_chk',
      sql`(${t.type} = 'FREE' and ${t.value} is null) or (${t.type} = 'PERCENT' and ${t.value} is not null and ${t.value} between 1 and 100) or (${t.type} = 'AMOUNT' and ${t.value} is not null and ${t.value} > 0)`,
    ),
    check('enrollment_discounts_dates_chk', sql`${t.toDate} is null or ${t.fromDate} is null or ${t.toDate} >= ${t.fromDate}`),
  ],
);

// Muzlatish davri: [from_date, to_date). to_date NULL = hozir muzlatilgan. Davr boshi shu oraliqqa tushsa charge yaratilmaydi.
export const enrollmentFreezes = pgTable(
  'enrollment_freezes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    enrollmentId: uuid('enrollment_id').notNull(),
    fromDate: date('from_date', { mode: 'string' }).notNull(),
    toDate: date('to_date', { mode: 'string' }),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({ name: 'enrollment_freezes_enrollment_center_fk', columns: [t.enrollmentId, t.centerId], foreignColumns: [enrollments.id, enrollments.centerId] }),
    uniqueIndex('enrollment_freezes_open_uq').on(t.enrollmentId).where(sql`${t.toDate} is null`), // bir vaqtda bitta ochiq muzlatish
    index('enrollment_freezes_enrollment_idx').on(t.enrollmentId),
    index('enrollment_freezes_center_idx').on(t.centerId),
    check('enrollment_freezes_dates_chk', sql`${t.toDate} is null or ${t.toDate} >= ${t.fromDate}`),
  ],
);

// --- Hisob-kitob (ERD 2.3): davr hisobi. Pul `bigint` so'mda. Qator o'chirilmaydi: bekor qilish `CANCELLED` bilan. ---
export const charges = pgTable(
  'charges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    enrollmentId: uuid('enrollment_id').notNull(),
    studentId: uuid('student_id').notNull(), // yozilishdan nusxa (o'zgarmaydi): so'rovlarni soddalashtiradi
    groupId: uuid('group_id').notNull(), // xuddi shunday
    periodStart: date('period_start', { mode: 'string' }).notNull(),
    periodEnd: date('period_end', { mode: 'string' }).notNull(), // shu kun kiradi
    dueDate: date('due_date', { mode: 'string' }).notNull(),
    baseAmount: bigint('base_amount', { mode: 'number' }).notNull(),
    discountAmount: bigint('discount_amount', { mode: 'number' }).notNull().default(0), // yaratilganda qotiriladi
    amount: bigint('amount', { mode: 'number' }).notNull(),
    status: text('status').notNull().default('OPEN'), // OPEN | PARTIAL | PAID | CANCELLED
    kind: text('kind').notNull(), // REGULAR | FIRST_PRORATED | MANUAL
    note: text('note'),
    cancelledAt: ts('cancelled_at'),
    cancelReason: text('cancel_reason'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: createdAt(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [
    foreignKey({ name: 'charges_enrollment_center_fk', columns: [t.enrollmentId, t.centerId], foreignColumns: [enrollments.id, enrollments.centerId] }),
    foreignKey({ name: 'charges_student_center_fk', columns: [t.studentId, t.centerId], foreignColumns: [users.id, users.centerId] }),
    foreignKey({ name: 'charges_group_center_fk', columns: [t.groupId, t.centerId], foreignColumns: [groups.id, groups.centerId] }),
    unique('charges_id_center_uq').on(t.id, t.centerId),
    // Har yozilish va davr boshiga bitta avtomatik charge (bekor qilingani ham qayta yaratilmasligi uchun holatdan qat'i nazar)
    uniqueIndex('charges_cycle_uq').on(t.enrollmentId, t.periodStart).where(sql`${t.kind} in ('REGULAR','FIRST_PRORATED')`),
    index('charges_enrollment_idx').on(t.enrollmentId),
    index('charges_student_idx').on(t.studentId),
    index('charges_group_idx').on(t.groupId),
    index('charges_center_due_idx').on(t.centerId, t.dueDate),
    check('charges_status_chk', sql`${t.status} in ('OPEN','PARTIAL','PAID','CANCELLED')`),
    check('charges_kind_chk', sql`${t.kind} in ('REGULAR','FIRST_PRORATED','MANUAL')`),
    check('charges_amounts_chk', sql`${t.baseAmount} >= 0 and ${t.discountAmount} >= 0 and ${t.discountAmount} <= ${t.baseAmount} and ${t.amount} = ${t.baseAmount} - ${t.discountAmount}`),
    check('charges_period_chk', sql`${t.periodEnd} >= ${t.periodStart}`),
    check('charges_manual_note_chk', sql`${t.kind} <> 'MANUAL' or ${t.note} is not null`),
    check('charges_cancel_chk', sql`(${t.status} = 'CANCELLED') = (${t.cancelledAt} is not null)`),
  ],
);

// --- To'lov (ERD 2.3): append-only. Asl to'lov faqat CONFIRMED -> REVERSED bo'ladi (trigger); qaytarish manfiy summali alohida qator. ---
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    branchId: uuid('branch_id').notNull(), // to'lov qabul qilingan filial
    studentId: uuid('student_id').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(), // asl to'lov > 0, qaytarish yozuvi < 0
    method: text('method').notNull(), // CASH | CARD | TRANSFER (CLICK | PAYME keyin)
    status: text('status').notNull().default('CONFIRMED'), // CONFIRMED | REVERSED
    reversesPaymentId: uuid('reverses_payment_id'),
    receivedBy: uuid('received_by').references(() => users.id),
    paidAt: ts('paid_at').notNull().defaultNow(),
    receiptNo: bigint('receipt_no', { mode: 'number' }).notNull(), // markaz bo'yicha ketma-ket
    externalTxnId: text('external_txn_id'),
    note: text('note'), // qaytarish yozuvida sabab
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({ name: 'payments_branch_center_fk', columns: [t.branchId, t.centerId], foreignColumns: [branches.id, branches.centerId] }),
    foreignKey({ name: 'payments_student_center_fk', columns: [t.studentId, t.centerId], foreignColumns: [users.id, users.centerId] }),
    foreignKey({ name: 'payments_reverses_center_fk', columns: [t.reversesPaymentId, t.centerId], foreignColumns: [t.id, t.centerId] }),
    unique('payments_id_center_uq').on(t.id, t.centerId),
    uniqueIndex('payments_receipt_uq').on(t.centerId, t.receiptNo),
    uniqueIndex('payments_reverses_uq').on(t.reversesPaymentId).where(sql`${t.reversesPaymentId} is not null`), // bitta to'lov bir marta qaytariladi
    index('payments_student_idx').on(t.studentId),
    index('payments_center_paid_idx').on(t.centerId, t.paidAt),
    index('payments_branch_idx').on(t.branchId),
    check('payments_method_chk', sql`${t.method} in ('CASH','CARD','TRANSFER','CLICK','PAYME')`),
    check('payments_status_chk', sql`${t.status} in ('CONFIRMED','REVERSED')`),
    check('payments_amount_chk', sql`(${t.reversesPaymentId} is null and ${t.amount} > 0) or (${t.reversesPaymentId} is not null and ${t.amount} < 0)`),
    check('payments_reversal_status_chk', sql`${t.reversesPaymentId} is null or ${t.status} = 'CONFIRMED'`),
  ],
);

// To'lovni hisobga biriktirish: musbat = taqsimlash, manfiy = qaytarish (to'lov qaytarilganda yoki to'langan hisob bekor qilinganda). Faqat INSERT.
export const paymentAllocations = pgTable(
  'payment_allocations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    paymentId: uuid('payment_id').notNull(),
    chargeId: uuid('charge_id').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({ name: 'payment_allocations_payment_center_fk', columns: [t.paymentId, t.centerId], foreignColumns: [payments.id, payments.centerId] }),
    foreignKey({ name: 'payment_allocations_charge_center_fk', columns: [t.chargeId, t.centerId], foreignColumns: [charges.id, charges.centerId] }),
    index('payment_allocations_payment_idx').on(t.paymentId),
    index('payment_allocations_charge_idx').on(t.chargeId),
    index('payment_allocations_center_idx').on(t.centerId),
    check('payment_allocations_amount_chk', sql`${t.amount} <> 0`),
  ],
);

// --- Maosh (ERD 2.4). Qoida -> davr (DRAFT) -> qatorlar -> tasdiq -> to'lov. Davr qulfi va to'lov append-only triggerlarda (0011). ---
export const payrollRules = pgTable(
  'payroll_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    employeeId: uuid('employee_id').notNull(),
    groupId: uuid('group_id'), // NULL = umumiy (xodimning davrdagi guruhlari)
    type: text('type').notNull(), // FIXED | PERCENT | PER_GROUP | PER_LESSON
    amount: bigint('amount', { mode: 'number' }), // FIXED/PER_GROUP/PER_LESSON
    percent: numeric('percent', { precision: 5, scale: 2 }), // PERCENT (0.01-100)
    percentBase: text('percent_base'), // PAID | CHARGED
    teacherKind: text('teacher_kind'), // ixtiyoriy filtr: faqat MAIN yoki ASSISTANT sifatida biriktirilgan guruhlar
    validFrom: date('valid_from', { mode: 'string' }).notNull(),
    validTo: date('valid_to', { mode: 'string' }),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({ name: 'payroll_rules_employee_center_fk', columns: [t.employeeId, t.centerId], foreignColumns: [users.id, users.centerId] }),
    foreignKey({ name: 'payroll_rules_group_center_fk', columns: [t.groupId, t.centerId], foreignColumns: [groups.id, groups.centerId] }),
    unique('payroll_rules_id_center_uq').on(t.id, t.centerId),
    index('payroll_rules_employee_idx').on(t.employeeId),
    index('payroll_rules_center_idx').on(t.centerId),
    check('payroll_rules_type_chk', sql`${t.type} in ('FIXED','PERCENT','PER_GROUP','PER_LESSON')`),
    check(
      'payroll_rules_value_chk',
      sql`(${t.type} = 'PERCENT' and ${t.percent} is not null and ${t.percent} > 0 and ${t.percent} <= 100 and ${t.percentBase} is not null and ${t.percentBase} in ('PAID','CHARGED') and ${t.amount} is null) or (${t.type} <> 'PERCENT' and ${t.amount} is not null and ${t.amount} > 0 and ${t.percent} is null and ${t.percentBase} is null)`,
    ),
    check('payroll_rules_kind_chk', sql`${t.teacherKind} is null or ${t.teacherKind} in ('MAIN','ASSISTANT')`),
    check('payroll_rules_dates_chk', sql`${t.validTo} is null or ${t.validTo} >= ${t.validFrom}`),
  ],
);

export const payrollPeriods = pgTable(
  'payroll_periods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    month: date('month', { mode: 'string' }).notNull(), // oyning 1-kuni
    status: text('status').notNull().default('DRAFT'), // DRAFT | APPROVED | PAID
    calculatedAt: ts('calculated_at'),
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: ts('approved_at'),
    createdAt: createdAt(),
  },
  (t) => [
    unique('payroll_periods_id_center_uq').on(t.id, t.centerId),
    uniqueIndex('payroll_periods_month_uq').on(t.centerId, t.month),
    check('payroll_periods_status_chk', sql`${t.status} in ('DRAFT','APPROVED','PAID')`),
    check('payroll_periods_month_chk', sql`extract(day from ${t.month}) = 1`),
    check('payroll_periods_approved_chk', sql`(${t.status} = 'DRAFT') = (${t.approvedAt} is null)`),
  ],
);

// Faqat DRAFT davrda o'zgaradi (trigger): qayta hisoblashda eski qatorlar o'chiriladi.
export const payrollItems = pgTable(
  'payroll_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    periodId: uuid('period_id').notNull(),
    employeeId: uuid('employee_id').notNull(),
    ruleId: uuid('rule_id').notNull(),
    groupId: uuid('group_id'),
    baseAmount: bigint('base_amount', { mode: 'number' }).notNull(), // FIXED/PER_GROUP: summa; PER_LESSON: darslar soni; PERCENT: asos summa
    amount: bigint('amount', { mode: 'number' }).notNull(),
    description: text('description').notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({ name: 'payroll_items_period_center_fk', columns: [t.periodId, t.centerId], foreignColumns: [payrollPeriods.id, payrollPeriods.centerId] }),
    foreignKey({ name: 'payroll_items_employee_center_fk', columns: [t.employeeId, t.centerId], foreignColumns: [users.id, users.centerId] }),
    foreignKey({ name: 'payroll_items_rule_center_fk', columns: [t.ruleId, t.centerId], foreignColumns: [payrollRules.id, payrollRules.centerId] }),
    foreignKey({ name: 'payroll_items_group_center_fk', columns: [t.groupId, t.centerId], foreignColumns: [groups.id, groups.centerId] }),
    index('payroll_items_period_idx').on(t.periodId),
    index('payroll_items_employee_idx').on(t.employeeId),
    index('payroll_items_center_idx').on(t.centerId),
    check('payroll_items_amount_chk', sql`${t.amount} > 0 and ${t.baseAmount} >= 0`),
  ],
);

// Bonus (musbat) va jarima (manfiy): faqat DRAFT davrda qo'shiladi/o'chiriladi (trigger).
export const payrollAdjustments = pgTable(
  'payroll_adjustments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    periodId: uuid('period_id').notNull(),
    employeeId: uuid('employee_id').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    reason: text('reason').notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({ name: 'payroll_adjustments_period_center_fk', columns: [t.periodId, t.centerId], foreignColumns: [payrollPeriods.id, payrollPeriods.centerId] }),
    foreignKey({ name: 'payroll_adjustments_employee_center_fk', columns: [t.employeeId, t.centerId], foreignColumns: [users.id, users.centerId] }),
    index('payroll_adjustments_period_idx').on(t.periodId),
    index('payroll_adjustments_center_idx').on(t.centerId),
    check('payroll_adjustments_amount_chk', sql`${t.amount} <> 0`),
  ],
);

// Maosh to'lovi: append-only (payments kabi): asl > 0, qaytarish yozuvi < 0; asl faqat CONFIRMED -> REVERSED (trigger).
export const payrollPayouts = pgTable(
  'payroll_payouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    periodId: uuid('period_id').notNull(),
    employeeId: uuid('employee_id').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    method: text('method').notNull(), // CASH | CARD | TRANSFER
    status: text('status').notNull().default('CONFIRMED'), // CONFIRMED | REVERSED
    reversesPayoutId: uuid('reverses_payout_id'),
    note: text('note'), // qaytarishda sabab
    paidBy: uuid('paid_by').references(() => users.id),
    paidAt: ts('paid_at').notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({ name: 'payroll_payouts_period_center_fk', columns: [t.periodId, t.centerId], foreignColumns: [payrollPeriods.id, payrollPeriods.centerId] }),
    foreignKey({ name: 'payroll_payouts_employee_center_fk', columns: [t.employeeId, t.centerId], foreignColumns: [users.id, users.centerId] }),
    foreignKey({ name: 'payroll_payouts_reverses_center_fk', columns: [t.reversesPayoutId, t.centerId], foreignColumns: [t.id, t.centerId] }),
    unique('payroll_payouts_id_center_uq').on(t.id, t.centerId),
    uniqueIndex('payroll_payouts_reverses_uq').on(t.reversesPayoutId).where(sql`${t.reversesPayoutId} is not null`),
    index('payroll_payouts_period_idx').on(t.periodId),
    index('payroll_payouts_employee_idx').on(t.employeeId),
    index('payroll_payouts_center_idx').on(t.centerId),
    check('payroll_payouts_method_chk', sql`${t.method} in ('CASH','CARD','TRANSFER')`),
    check('payroll_payouts_status_chk', sql`${t.status} in ('CONFIRMED','REVERSED')`),
    check('payroll_payouts_amount_chk', sql`(${t.reversesPayoutId} is null and ${t.amount} > 0) or (${t.reversesPayoutId} is not null and ${t.amount} < 0)`),
    check('payroll_payouts_reversal_status_chk', sql`${t.reversesPayoutId} is null or ${t.status} = 'CONFIRMED'`),
  ],
);

// --- Xarajat (ERD 2.3): append-only. Summa/kategoriya o'zgarmaydi; xato ACTIVE -> VOIDED (sabab bilan) orqali tuzatiladi (trigger, 0012). ---
export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    branchId: uuid('branch_id').notNull(),
    category: text('category').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    note: text('note'),
    spentOn: date('spent_on', { mode: 'string' }).notNull(), // biznes sanasi (Asia/Tashkent)
    status: text('status').notNull().default('ACTIVE'), // ACTIVE | VOIDED
    voidReason: text('void_reason'),
    voidedBy: uuid('voided_by').references(() => users.id),
    voidedAt: ts('voided_at'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({ name: 'expenses_branch_center_fk', columns: [t.branchId, t.centerId], foreignColumns: [branches.id, branches.centerId] }),
    index('expenses_center_spent_idx').on(t.centerId, t.spentOn),
    index('expenses_branch_idx').on(t.branchId),
    check('expenses_amount_chk', sql`${t.amount} > 0`),
    check('expenses_status_chk', sql`${t.status} in ('ACTIVE','VOIDED')`),
    check('expenses_category_chk', sql`length(btrim(${t.category})) between 1 and 60`),
    check('expenses_void_chk', sql`(${t.status} = 'VOIDED') = (${t.voidedAt} is not null and ${t.voidReason} is not null)`),
  ],
);

// --- Import (ERD 2.4): fayl o'zi saqlanmaydi (shaxsiy ma'lumot), faqat natija hisoboti (qator raqami, maydon, xato kodi; qiymatlarsiz). Append-only. ---
export const importJobs = pgTable(
  'import_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    type: text('type').notNull(), // STUDENTS | GROUPS | PAYMENTS (hozir faqat STUDENTS)
    fileName: text('file_name').notNull(),
    status: text('status').notNull(), // DONE | REJECTED
    totalRows: integer('total_rows').notNull(),
    createdRows: integer('created_rows').notNull().default(0),
    errorRows: integer('error_rows').notNull().default(0),
    skipInvalid: boolean('skip_invalid').notNull().default(false),
    report: jsonb('report').notNull(), // { errors: [{ row, field, code, message }], truncated }
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [
    index('import_jobs_center_created_idx').on(t.centerId, t.createdAt),
    check('import_jobs_type_chk', sql`${t.type} in ('STUDENTS','GROUPS','PAYMENTS')`),
    check('import_jobs_status_chk', sql`${t.status} in ('DONE','REJECTED')`),
    check('import_jobs_counts_chk', sql`${t.totalRows} >= 0 and ${t.createdRows} >= 0 and ${t.errorRows} >= 0 and ${t.createdRows} <= ${t.totalRows}`),
    check('import_jobs_rejected_chk', sql`${t.status} <> 'REJECTED' or ${t.createdRows} = 0`),
  ],
);

// --- Vazifa va reyting (ERD 2.2). Fayl yuklash yo'q: biriktirmalar havola ro'yxati [{ name, url }] (jsonb). ---
export const assignments = pgTable(
  'assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    groupId: uuid('group_id').notNull(),
    teacherId: uuid('teacher_id').notNull(), // yaratgan ustoz
    title: text('title').notNull(),
    description: text('description'),
    attachments: jsonb('attachments').notNull().default(sql`'[]'::jsonb`),
    dueAt: ts('due_at'),
    maxScore: integer('max_score').notNull().default(100),
    archivedAt: ts('archived_at'),
    createdAt: createdAt(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [
    foreignKey({ name: 'assignments_group_center_fk', columns: [t.groupId, t.centerId], foreignColumns: [groups.id, groups.centerId] }),
    foreignKey({ name: 'assignments_teacher_center_fk', columns: [t.teacherId, t.centerId], foreignColumns: [users.id, users.centerId] }),
    unique('assignments_id_center_uq').on(t.id, t.centerId),
    index('assignments_group_idx').on(t.groupId),
    index('assignments_center_idx').on(t.centerId),
    check('assignments_title_chk', sql`length(btrim(${t.title})) between 1 and 200`),
    check('assignments_max_score_chk', sql`${t.maxScore} between 1 and 1000`),
  ],
);

export const submissions = pgTable(
  'submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    assignmentId: uuid('assignment_id').notNull(),
    studentId: uuid('student_id').notNull(),
    text: text('text'),
    files: jsonb('files').notNull().default(sql`'[]'::jsonb`),
    submittedAt: ts('submitted_at').notNull().defaultNow(),
    score: integer('score'),
    feedback: text('feedback'),
    gradedBy: uuid('graded_by').references(() => users.id),
    gradedAt: ts('graded_at'),
  },
  (t) => [
    foreignKey({ name: 'submissions_assignment_center_fk', columns: [t.assignmentId, t.centerId], foreignColumns: [assignments.id, assignments.centerId] }),
    foreignKey({ name: 'submissions_student_center_fk', columns: [t.studentId, t.centerId], foreignColumns: [users.id, users.centerId] }),
    unique('submissions_id_center_uq').on(t.id, t.centerId),
    uniqueIndex('submissions_assignment_student_uq').on(t.assignmentId, t.studentId), // bitta o'quvchi bitta vazifaga bitta topshiriq
    index('submissions_student_idx').on(t.studentId),
    index('submissions_center_idx').on(t.centerId),
    check('submissions_score_chk', sql`${t.score} is null or ${t.score} >= 0`),
    check('submissions_graded_chk', sql`(${t.score} is null) = (${t.gradedAt} is null)`),
  ],
);

// Reyting voqealari: append-only (tuzatish teskari/delta yozuv bilan). Davomat balli saqlanmaydi, so'rovda attendance_records'dan hisoblanadi.
export const ratingPoints = pgTable(
  'rating_points',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    branchId: uuid('branch_id').notNull(), // guruh filiali (voqea paytida)
    groupId: uuid('group_id').notNull(),
    studentId: uuid('student_id').notNull(),
    source: text('source').notNull(), // HOMEWORK | MANUAL
    sourceId: uuid('source_id'), // HOMEWORK: submission id
    points: integer('points').notNull(),
    reason: text('reason'), // MANUAL uchun majburiy
    createdBy: uuid('created_by').references(() => users.id),
    at: ts('at').notNull().defaultNow(),
  },
  (t) => [
    foreignKey({ name: 'rating_points_branch_center_fk', columns: [t.branchId, t.centerId], foreignColumns: [branches.id, branches.centerId] }),
    foreignKey({ name: 'rating_points_group_center_fk', columns: [t.groupId, t.centerId], foreignColumns: [groups.id, groups.centerId] }),
    foreignKey({ name: 'rating_points_student_center_fk', columns: [t.studentId, t.centerId], foreignColumns: [users.id, users.centerId] }),
    index('rating_points_student_idx').on(t.studentId),
    index('rating_points_group_at_idx').on(t.groupId, t.at),
    index('rating_points_center_at_idx').on(t.centerId, t.at),
    index('rating_points_source_idx').on(t.sourceId),
    check('rating_points_source_chk', sql`${t.source} in ('HOMEWORK','MANUAL')`),
    check('rating_points_points_chk', sql`${t.points} <> 0 and abs(${t.points}) <= 1000`),
    check('rating_points_manual_chk', sql`${t.source} <> 'MANUAL' or (${t.reason} is not null and length(btrim(${t.reason})) > 0)`),
    check('rating_points_homework_chk', sql`${t.source} <> 'HOMEWORK' or ${t.sourceId} is not null`),
  ],
);

// --- Telegram bildirishnomalar (ERD 2.4, 21-qadam). Jurnal append-only; xabar matni saqlanmaydi, faqat minimal payload. ---
export const notificationLog = pgTable(
  'notification_log',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    userId: uuid('user_id').notNull(),
    channel: text('channel').notNull().default('TELEGRAM'), // TELEGRAM | SMS
    type: text('type').notNull(), // DEBT | LESSON | HOMEWORK | PAYROLL | MANUAL
    dedupeKey: text('dedupe_key'), // takror yuborishni oldini oladi (faqat SENT uchun noyob)
    payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
    status: text('status').notNull(), // SENT | FAILED
    error: text('error'), // faqat xato kodi
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({ name: 'notification_log_user_center_fk', columns: [t.userId, t.centerId], foreignColumns: [users.id, users.centerId] }),
    index('notification_log_center_created_idx').on(t.centerId, t.createdAt),
    index('notification_log_user_type_idx').on(t.userId, t.type, t.createdAt),
    uniqueIndex('notification_log_dedupe_uq').on(t.userId, t.dedupeKey).where(sql`${t.status} = 'SENT' and ${t.dedupeKey} is not null`),
    check('notification_log_channel_chk', sql`${t.channel} in ('TELEGRAM','SMS')`),
    check('notification_log_type_chk', sql`${t.type} in ('DEBT','LESSON','HOMEWORK','PAYROLL','MANUAL')`),
    check('notification_log_status_chk', sql`${t.status} in ('SENT','FAILED')`),
  ],
);

// Bir martalik bog'lash kodi: bazada faqat HMAC xesh. `app_telegram_redeem` (SECURITY DEFINER) webhook'da ishlatadi.
export const telegramLinkCodes = pgTable(
  'telegram_link_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    userId: uuid('user_id').notNull(),
    codeHash: text('code_hash').notNull(),
    expiresAt: ts('expires_at').notNull(),
    usedAt: ts('used_at'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({ name: 'telegram_link_codes_user_center_fk', columns: [t.userId, t.centerId], foreignColumns: [users.id, users.centerId] }),
    uniqueIndex('telegram_link_codes_hash_uq').on(t.codeHash),
    index('telegram_link_codes_user_idx').on(t.userId),
    check('telegram_link_codes_expiry_chk', sql`${t.expiresAt} > ${t.createdAt}`),
  ],
);

// --- Kirish urinishlari cheklovi (22-qadam): tenantga bog'liq emas, kalit = HMAC(ip|login). Ilova bevosita o'qimaydi/yozmaydi:
// faqat SECURITY DEFINER funksiyalar (`app_login_throttle_*`) orqali, shuning uchun ko'p nusxada ham ishlaydi. ---
export const loginThrottle = pgTable(
  'login_throttle',
  {
    key: text('key').primaryKey(),
    failures: integer('failures').notNull().default(1),
    windowStart: ts('window_start').notNull().defaultNow(),
  },
  (t) => [index('login_throttle_window_idx').on(t.windowStart), check('login_throttle_failures_chk', sql`${t.failures} > 0`)],
);

// --- Davomat (ERD 2.2): dars va davomat yozuvi. Qator o'chirilmaydi; tuzatishlar audit jurnalida. ---
export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    groupId: uuid('group_id').notNull(),
    lessonDate: date('lesson_date', { mode: 'string' }).notNull(),
    teacherId: uuid('teacher_id'), // darsni o'tgan ustoz (NULL = belgilanmagan)
    topic: text('topic'),
    status: text('status').notNull().default('HELD'), // HELD | CANCELLED
    lockedAt: ts('locked_at'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: createdAt(),
    updatedAt: ts('updated_at').notNull().defaultNow(),
  },
  (t) => [
    foreignKey({ name: 'lessons_group_center_fk', columns: [t.groupId, t.centerId], foreignColumns: [groups.id, groups.centerId] }),
    foreignKey({ name: 'lessons_teacher_center_fk', columns: [t.teacherId, t.centerId], foreignColumns: [users.id, users.centerId] }),
    unique('lessons_id_center_uq').on(t.id, t.centerId),
    uniqueIndex('lessons_group_date_uq').on(t.groupId, t.lessonDate), // bir guruhda bir sanada bitta dars
    index('lessons_center_idx').on(t.centerId),
    index('lessons_teacher_idx').on(t.teacherId),
    check('lessons_status_chk', sql`${t.status} in ('HELD','CANCELLED')`),
  ],
);

export const attendanceRecords = pgTable(
  'attendance_records',
  {
    lessonId: uuid('lesson_id').notNull(),
    studentId: uuid('student_id').notNull(),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    status: text('status').notNull(), // PRESENT | ABSENT | LATE | EXCUSED
    note: text('note'),
    markedBy: uuid('marked_by').references(() => users.id),
    markedAt: ts('marked_at').notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.lessonId, t.studentId] }),
    foreignKey({ name: 'attendance_lesson_center_fk', columns: [t.lessonId, t.centerId], foreignColumns: [lessons.id, lessons.centerId] }),
    foreignKey({ name: 'attendance_student_center_fk', columns: [t.studentId, t.centerId], foreignColumns: [users.id, users.centerId] }),
    index('attendance_student_idx').on(t.studentId),
    index('attendance_center_idx').on(t.centerId),
    check('attendance_status_chk', sql`${t.status} in ('PRESENT','ABSENT','LATE','EXCUSED')`),
  ],
);

export const permissions = pgTable('permissions', {
  code: text('code').primaryKey(),
  module: text('module').notNull(),
  description: text('description').notNull(),
});

export const centerRolePermissions = pgTable(
  'center_role_permissions',
  {
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id),
    role: text('role').notNull(),
    permissionCode: text('permission_code')
      .notNull()
      .references(() => permissions.code),
    allowed: boolean('allowed').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.centerId, t.role, t.permissionCode] }),
    check('crp_role_chk', sql`${t.role} in ('OWNER','ADMIN','CASHIER','TEACHER','STUDENT')`),
  ],
);

export const userPermissions = pgTable(
  'user_permissions',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    centerId: uuid('center_id')
      .notNull()
      .references(() => centers.id), // RLS uchun
    permissionCode: text('permission_code')
      .notNull()
      .references(() => permissions.code),
    allowed: boolean('allowed').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.permissionCode] }),
    foreignKey({ name: 'user_permissions_user_center_fk', columns: [t.userId, t.centerId], foreignColumns: [users.id, users.centerId] }),
    index('user_permissions_center_idx').on(t.centerId),
  ],
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    centerId: uuid('center_id').references(() => centers.id), // NULL = super admin sessiyasi
    refreshHash: text('refresh_hash').notNull().unique(),
    expiresAt: ts('expires_at').notNull(),
    revokedAt: ts('revoked_at'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: createdAt(),
  },
  (t) => [
    index('sessions_user_idx').on(t.userId),
    foreignKey({ name: 'sessions_user_center_fk', columns: [t.userId, t.centerId], foreignColumns: [users.id, users.centerId] }),
  ],
);

// Append-only: UPDATE/DELETE/TRUNCATE triggerlar bilan bloklangan (0001 migratsiya).
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    centerId: uuid('center_id').references(() => centers.id), // NULL = platforma darajasi
    actorId: uuid('actor_id').references(() => users.id),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: uuid('entity_id'),
    before: jsonb('before'),
    after: jsonb('after'),
    ip: text('ip'),
    at: ts('at').notNull().defaultNow(),
  },
  (t) => [
    index('audit_logs_center_at_idx').on(t.centerId, t.at),
    index('audit_logs_entity_idx').on(t.entity, t.entityId),
  ],
);
