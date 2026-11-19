// Panel menyusi: har band rol va samarali ruxsatga qarab ko'rinadi (server baribir tekshiradi).
import type { Icon } from '@/components/icons';
import type { Session } from './session';

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof Icon;
  show: (s: Session) => boolean;
}
export interface NavGroup {
  title?: string;
  items: NavItem[];
}

const staff = (s: Session) => s.is('OWNER', 'ADMIN', 'CASHIER', 'TEACHER');

export const NAV: NavGroup[] = [
  {
    items: [{ href: '/dashboard', label: 'Bosh sahifa', icon: 'home', show: () => true }],
  },
  {
    title: "O'quv jarayoni",
    items: [
      { href: '/students', label: "O'quvchilar", icon: 'students', show: (s) => staff(s) && s.can('student.view') },
      { href: '/groups', label: 'Guruhlar', icon: 'groups', show: (s) => s.can('group.view') },
      { href: '/courses', label: 'Kurslar', icon: 'book', show: (s) => s.is('OWNER', 'ADMIN') },
      { href: '/attendance', label: 'Davomat', icon: 'calendar', show: (s) => s.can('attendance.view') },
      { href: '/assignments', label: 'Vazifalar', icon: 'task', show: (s) => s.can('homework.view') },
      { href: '/ratings', label: 'Reyting', icon: 'trophy', show: (s) => s.can('rating.view') },
    ],
  },
  {
    title: 'Moliya',
    items: [
      { href: '/payments', label: "To'lovlar", icon: 'cash', show: (s) => s.can('payment.view') },
      { href: '/debtors', label: 'Qarzdorlar', icon: 'alert', show: (s) => s.can('debtors.view') && !s.is('STUDENT') },
      { href: '/expenses', label: 'Xarajatlar', icon: 'receipt', show: (s) => s.can('expense.manage') },
      { href: '/reports', label: 'Hisobotlar', icon: 'chart', show: (s) => s.can('finance.report') || s.can('report.overview') },
      { href: '/payroll', label: 'Maosh', icon: 'wallet', show: (s) => s.can('payroll.view_all') || s.can('payroll.view_own') },
    ],
  },
  {
    title: 'Boshqaruv',
    items: [
      { href: '/branches', label: 'Filiallar', icon: 'building', show: (s) => s.is('OWNER', 'ADMIN', 'CASHIER') },
      { href: '/staff', label: 'Xodimlar', icon: 'staff', show: (s) => s.is('OWNER', 'ADMIN') },
      { href: '/permissions', label: 'Ruxsatlar', icon: 'key', show: (s) => s.can('permissions.manage') },
      { href: '/imports', label: 'Import', icon: 'upload', show: (s) => s.can('import.run') },
      { href: '/notifications', label: 'Telegram xabarlar', icon: 'send', show: (s) => s.can('notification.send') },
      { href: '/audit', label: 'Audit jurnali', icon: 'log', show: (s) => s.can('audit.view') },
      { href: '/settings', label: 'Markaz sozlamalari', icon: 'settings', show: (s) => s.is('OWNER', 'ADMIN') },
    ],
  },
  {
    title: 'Platforma',
    items: [
      { href: '/admin/centers', label: 'Markazlar', icon: 'building', show: (s) => s.is('SUPER_ADMIN') },
      { href: '/admin/plans', label: 'Tariflar', icon: 'layers', show: (s) => s.can('plan.manage') },
    ],
  },
  {
    items: [{ href: '/profile', label: 'Profil', icon: 'user', show: () => true }],
  },
];

export function navFor(s: Session): NavGroup[] {
  return NAV.map((g) => ({ ...g, items: g.items.filter((i) => i.show(s)) })).filter((g) => g.items.length);
}
