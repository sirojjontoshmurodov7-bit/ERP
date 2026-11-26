import { T } from '@/components/t';
import type { Metadata } from 'next';
import { ChangePasswordForm } from './form';

export const metadata: Metadata = { title: 'Yangi parol' };

export default function ChangePasswordPage() {
  return (
    <main className="auth">
      <div className="panel auth-card">
        <div>
          <h1><T>{"Yangi parol o'rnating"}</T></h1>
          <p className="auth-sub"><T>{"Vaqtinchalik parol bilan kirdingiz. Davom etish uchun o'zingizning parolingizni o'rnating."}</T></p>
        </div>
        <ChangePasswordForm />
      </div>
    </main>
  );
}
