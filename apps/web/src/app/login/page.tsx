import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Kirish' };

export default function LoginPage() {
  return (
    <main className="login">
      <aside className="login-side">
        <Link className="login-brand" href="/">
          <span className="login-mark" aria-hidden />
          O&apos;quv markazi
        </Link>
        <p className="login-claim">Guruh, davomat, to&apos;lov va maosh: hammasi bitta tizimda.</p>
      </aside>
      <section className="login-main">
        <div className="login-card">
          <div>
            <h1>Tizimga kirish</h1>
            <p className="auth-sub">Login va parolni markaz rahbari yoki administrator beradi.</p>
          </div>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
          <Link className="link small" href="/">
            Bosh sahifaga qaytish
          </Link>
        </div>
      </section>
    </main>
  );
}
