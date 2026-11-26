'use client';
// Joriy foydalanuvchi (`/auth/me`): rol, samarali ruxsatlar, markaz. Menyu va tugmalarni yashirish uchun; haqiqiy tekshiruv serverda.
import { createContext, type ReactNode, useContext } from 'react';
import { trMap } from './i18n';

export type Role = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'CASHIER' | 'TEACHER' | 'STUDENT';

export interface Me {
  id: string;
  login: string;
  fullName: string;
  role: Role;
  centerId: string | null;
  mustChangePassword: boolean;
  permissions: string[];
  center: { id: string; name: string; status: string; trialEndsAt: string | null } | null;
}

export interface Session {
  me: Me;
  can: (code: string) => boolean;
  is: (...roles: Role[]) => boolean;
  reload: () => void;
}

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ value, children }: { value: Session; children: ReactNode }) {
  return <Ctx value={value}>{children}</Ctx>;
}

export function useSession(): Session {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSession must be used inside the panel');
  return s;
}

export const ROLE_LABEL: Record<Role, string> = trMap({
  SUPER_ADMIN: 'Super admin',
  OWNER: 'Rahbar',
  ADMIN: 'Administrator',
  CASHIER: 'Kassir',
  TEACHER: 'Ustoz',
  STUDENT: "O'quvchi",
});
