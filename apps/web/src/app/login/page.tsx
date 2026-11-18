import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Kirish' };

export default function LoginPage() {
  return (
    <main className="auth">
      <div className="panel auth-card">
        <div>
          <h1>Tizimga kirish</h1>
          <p className="auth-sub">Login va parolni markaz rahbari yoki administrator beradi.</p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
