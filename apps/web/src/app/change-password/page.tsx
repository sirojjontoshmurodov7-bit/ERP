import type { Metadata } from 'next';
import { ChangePasswordForm } from './form';

export const metadata: Metadata = { title: 'Yangi parol' };

export default function ChangePasswordPage() {
  return (
    <main className="auth">
      <div className="panel auth-card">
        <div>
          <h1>Yangi parol o&apos;rnating</h1>
          <p className="auth-sub">Vaqtinchalik parol bilan kirdingiz. Davom etish uchun o&apos;zingizning parolingizni o&apos;rnating.</p>
        </div>
        <ChangePasswordForm />
      </div>
    </main>
  );
}
