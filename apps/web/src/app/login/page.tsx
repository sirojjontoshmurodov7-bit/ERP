import { T } from '@/components/t';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Globe } from '@/components/globe';
import { Icon } from '@/components/icons';
import { LangDropdown } from '@/components/lang-dropdown';
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
          <T>{"TST_ERP"}</T>
        </Link>
        <Globe className="login-globe" />
        <p className="login-claim"><T>{"Guruh, davomat, to'lov va maosh: hammasi bitta tizimda."}</T></p>
      </aside>
      <section className="login-main">
        <div className="login-lang">
          <LangDropdown />
        </div>
        <div className="login-card" data-tilt>
          <div>
            <h1><T>{"Tizimga kirish"}</T></h1>
            <p className="auth-sub"><T>{"Login va parolni markaz rahbari yoki administrator beradi."}</T></p>
          </div>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
          <Link className="link small" href="/">
            <T>{"Bosh sahifaga qaytish"}</T>
          </Link>
        </div>
      </section>
    </main>
  );
}
