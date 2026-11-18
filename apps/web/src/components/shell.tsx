'use client';
// Panel qobig'i: sessiyani yuklaydi (`/auth/me`), parolni majburiy almashtirishga yo'naltiradi, menyu va yuqori panelni chizadi.
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { api, auth, setUnauthorizedHandler } from '@/lib/api';
import { navFor } from '@/lib/nav';
import { type Me, ROLE_LABEL, type Session, SessionProvider } from '@/lib/session';
import { Icon } from './icons';
import { Button, ErrorState, ToastProvider } from './ui';

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function Shell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [tick, setTick] = useState(0);
  const [menu, setMenu] = useState(false);

  const toLogin = useCallback(() => {
    const next = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
    router.replace(next && next !== '/' ? `/login?next=${encodeURIComponent(next)}` : '/login');
  }, [router]);

  useEffect(() => {
    setUnauthorizedHandler(toLogin);
    return () => setUnauthorizedHandler(null);
  }, [toLogin]);

  useEffect(() => {
    let alive = true;
    api
      .get<Me>('/auth/me')
      .then((m) => {
        if (!alive) return;
        if (m.mustChangePassword) {
          router.replace('/change-password');
          return;
        }
        setMe(m);
        setError(null);
      })
      .catch((e: unknown) => {
        if (alive) setError(e);
      });
    return () => {
      alive = false;
    };
  }, [router, tick]);

  const session = useMemo<Session | null>(() => {
    if (!me) return null;
    const perms = new Set(me.permissions);
    return { me, can: (c) => perms.has(c), is: (...roles) => roles.includes(me.role), reload: () => setTick((t) => t + 1) };
  }, [me]);

  const logout = async () => {
    await auth.logout().catch(() => {});
    router.replace('/login');
  };

  if (error) {
    return (
      <div className="auth">
        <div className="panel auth-card">
          <ErrorState error={error} onRetry={() => setTick((t) => t + 1)} />
        </div>
      </div>
    );
  }
  if (!session) {
    return (
      <div className="auth" aria-busy="true">
        <span className="spinner" aria-label="Yuklanmoqda" />
      </div>
    );
  }

  const groups = navFor(session);
  const centerName = session.me.center?.name ?? 'Platforma boshqaruvi';
  return (
    <SessionProvider value={session}>
      <ToastProvider>
        <div className="shell" data-menu={menu ? 'open' : 'closed'}>
          <aside className="sidebar" aria-label="Asosiy menyu">
            <div className="brand">
              <span className="brand-name">{centerName}</span>
              <span className="brand-sub">{ROLE_LABEL[session.me.role]}</span>
            </div>
            <nav className="stack-sm">
              {groups.map((g, i) => (
                <div className="nav-group" key={g.title ?? i}>
                  {g.title ? <span className="nav-group-title">{g.title}</span> : null}
                  {g.items.map((item) => {
                    const I = Icon[item.icon];
                    return (
                      <Link key={item.href} href={item.href} className="nav-link" onClick={() => setMenu(false)} aria-current={isActive(pathname, item.href) ? 'page' : undefined}>
                        <I />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
            <div className="sidebar-foot">
              {session.me.center?.status === 'TRIAL' && session.me.center.trialEndsAt ? <p>Sinov muddati: {new Date(session.me.center.trialEndsAt).toLocaleDateString('ru-RU')} gacha</p> : null}
            </div>
          </aside>
          <div className="main">
            <header className="topbar">
              <Button variant="ghost" className="btn--icon menu-toggle" aria-label="Menyuni ochish" aria-expanded={menu} onClick={() => setMenu((m) => !m)} icon={<Icon.menu />} />
              <span className="topbar-title">{session.me.fullName}</span>
              <span className="topbar-spacer" />
              <Button variant="ghost" size="sm" onClick={logout} icon={<Icon.logout />}>
                Chiqish
              </Button>
            </header>
            <main className="content" id="main">
              {children}
            </main>
          </div>
        </div>
      </ToastProvider>
    </SessionProvider>
  );
}
