// Ruxsat kodlari: ERD-VA-RUXSATLAR.md, 3-bo'lim. Yagona manba shu fayl;
// `permissions` jadvali `pnpm db:seed` orqali shundan to'ldiriladi.

export const PERMISSION_MODULES = ['platform', 'org', 'academic', 'finance', 'system'] as const;
export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export interface PermissionDef {
  code: string;
  module: PermissionModule;
  description: string;
}

const p = (code: string, module: PermissionModule, description: string): PermissionDef => ({
  code,
  module,
  description,
});

export const PERMISSIONS: readonly PermissionDef[] = [
  // 3.1 Platforma
  p('center.create', 'platform', 'Markaz yaratish'),
  p('center.block', 'platform', 'Markazni bloklash'),
  p('center.edit', 'platform', 'Markazni tahrirlash'),
  p('owner.create', 'platform', 'Rahbar akkauntini yaratish'),
  p('owner.reset_password', 'platform', 'Rahbar parolini tiklash'),
  p('plan.manage', 'platform', 'Tariflarni boshqarish'),
  p('saas_invoice.manage', 'platform', 'Obuna hisoblarini boshqarish'),
  p('center.view_own_subscription', 'platform', "O'z obunasini ko'rish"),
  // 3.2 Tashkilot va foydalanuvchilar
  p('branch.manage', 'org', 'Filial yaratish va tahrirlash'),
  p('staff.create', 'org', 'Admin va kassir yaratish'),
  p('teacher.create', 'org', 'Ustoz yaratish'),
  p('teacher.edit', 'org', 'Ustozni tahrirlash'),
  p('student.create', 'org', "O'quvchi yaratish"),
  p('student.edit', 'org', "O'quvchini tahrirlash"),
  p('student.archive', 'org', "O'quvchini arxivlash"),
  p('user.reset_password', 'org', 'Parolni tiklash'),
  p('user.change_own_password', 'org', "O'z parolini almashtirish"),
  p('permissions.manage', 'org', 'Ruxsatlarni sozlash'),
  p('student.view', 'org', "O'quvchini ko'rish"),
  // 3.3 Guruhlar, davomat, vazifa, reyting
  p('group.create', 'academic', 'Guruh yaratish'),
  p('group.edit', 'academic', 'Guruhni tahrirlash'),
  p('group.billing_settings', 'academic', 'Guruh narxi, sikl rejimi va grace sozlamasi'),
  p('group.view', 'academic', "Guruhni ko'rish"),
  p('enrollment.manage', 'academic', "Yozilishni boshqarish (qo'shish, chiqarish, ko'chirish, muzlatish)"),
  p('attendance.view', 'academic', "Davomatni ko'rish"),
  p('attendance.mark', 'academic', 'Davomat belgilash'),
  p('attendance.edit_past', 'academic', 'Qulflangan dars davomatini tuzatish'),
  p('homework.create', 'academic', 'Vazifa yaratish'),
  p('homework.grade', 'academic', 'Vazifani baholash'),
  p('homework.view', 'academic', "Vazifani ko'rish"),
  p('homework.submit', 'academic', 'Vazifa topshirish'),
  p('rating.view', 'academic', "Reytingni ko'rish"),
  p('rating.adjust', 'academic', "Reytingga qo'lda ball qo'shish"),
  // 3.4 Moliya
  p('payment.create', 'finance', "To'lov qabul qilish (kirim)"),
  p('payment.view', 'finance', "To'lovlarni ko'rish"),
  p('payment.reverse', 'finance', "To'lovni qaytarish yoki bekor qilish"),
  p('debtors.view', 'finance', "Qarzdorlarni ko'rish"),
  p('discount.grant', 'finance', 'Chegirma yoki imtiyoz berish'),
  p('charge.adjust', 'finance', "Hisob-kitobni qo'lda tuzatish yoki bekor qilish"),
  p('expense.manage', 'finance', 'Xarajatlarni boshqarish'),
  p('finance.report', 'finance', "Kassa va tushum hisobotlari"),
  p('payroll.rules.manage', 'finance', 'Maosh qoidalarini boshqarish'),
  p('payroll.calculate', 'finance', 'Maoshni hisoblash'),
  p('payroll.approve', 'finance', 'Maoshni tasdiqlash'),
  p('payroll.view_all', 'finance', "Hamma maoshni ko'rish"),
  p('payroll.view_own', 'finance', "O'z maoshini ko'rish"),
  p('payroll.pay', 'finance', "Maosh to'lash"),
  // 3.5 Tizim
  p('report.overview', 'system', 'Markaz va filiallar umumiy hisoboti'),
  p('report.branch_compare', 'system', 'Filiallarni solishtirish'),
  p('audit.view', 'system', "Audit jurnalini ko'rish"),
  p('import.run', 'system', 'Excel import'),
  p('telegram.settings', 'system', 'Telegram sozlamalari'),
  p('notification.send', 'system', 'Bildirishnoma yuborish'),
];

export type PermissionCode = (typeof PERMISSIONS)[number]['code'];

/**
 * Platforma ruxsatlari faqat SUPER_ADMIN roliga qat'iy biriktirilgan va markaz sozlamasi bilan o'zgarmaydi.
 * `center.view_own_subscription` bundan mustasno: u rahbarga rol shabloni orqali beriladi.
 */
export const PLATFORM_ONLY_PERMISSIONS: ReadonlySet<string> = new Set(
  PERMISSIONS.filter((x) => x.module === 'platform' && x.code !== 'center.view_own_subscription').map(
    (x) => x.code,
  ),
);

export const PERMISSION_CODES: ReadonlySet<string> = new Set(PERMISSIONS.map((x) => x.code));
