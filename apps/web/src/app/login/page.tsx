import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Globe } from '@/components/globe';
import { Icon } from '@/components/icons';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Kirish' };

export default function LoginPage() {
  return (
    <main className="login">
      <aside className="login-side">
        <Link className="login-brand" href="/">
          <span className="brand-mark" aria-hidden>
            <Icon.cube />
          </span>
          TST_ERP
        </Link>
        <Globe className="login-globe" />
        <p className="login-claim">Guruh, davomat, to&apos;lov va maosh: hammasi bitta tizimda.</p>
      </aside>
      <section className="login-main">
        <div className="login-card" data-tilt>
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
