'use client';
// Panel qobig'i: sessiyani yuklaydi (`/auth/me`), parolni majburiy almashtirishga yo'naltiradi, yon menyu va yuqori panelni chizadi.
import { LANGS, setLang, useLang, useT } from '@/lib/i18n';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, auth, setUnauthorizedHandler } from '@/lib/api';
import { date, money, todayLocal, tsDay, WEEKDAYS } from '@/lib/format';
import { navFor } from '@/lib/nav';
import { type Me, type Role, ROLE_LABEL, type Session, SessionProvider } from '@/lib/session';
import { useTheme } from '@/lib/theme';
import { useApi } from '@/lib/use-api';
import { Icon } from './icons';
import { ErrorState, ToastProvider } from './ui';

export const BRAND = 'TST_ERP';
const COLLAPSE_KEY = 'tst-sidebar';

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

const ROLE_TONE: Record<Role, string> = { SUPER_ADMIN: 'violet', OWNER: 'emerald', ADMIN: 'violet', CASHIER: 'amber', TEACHER: 'violet', STUDENT: 'cyan' };
const ROLE_SCOPE: Record<Role, string> = { SUPER_ADMIN: 'GLOBAL', OWNER: 'MARKAZ', ADMIN: 'FILIAL', CASHIER: 'FILIAL', TEACHER: 'GURUH', STUDENT: '' };

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

export function Shell({ children }: { children: ReactNode }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [tick, setTick] = useState(0);
  const [menu, setMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });

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
    return {
      me,
      can: (code) => perms.has(code),
      is: (...roles) => roles.includes(me.role),
      reload: () => setTick((t) => t + 1),
    };
  }, [me]);

  const toggleCollapse = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      } catch {
        // saqlanmasa ham ishlayveradi
      }
      return !c;
    });
  };

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
        <span className="spinner" aria-label={t("Yuklanmoqda")} />
      </div>
    );
  }

  const groups = navFor(session);
  const role = session.me.role;
  const centerName = session.me.center?.name ?? t('Platforma');
  return (
    <SessionProvider value={session}>
      <ToastProvider>
        <div className="shell" data-menu={menu ? 'open' : 'closed'} data-collapsed={collapsed}>
          <aside className="sidebar" aria-label={t("Asosiy menyu")}>
            <div className="sidebar-top">
              <div className="brand">
                <Link className="brand-link" href="/dashboard" title={BRAND} onClick={() => setMenu(false)}>
                  <span className="brand-mark">
                    <Icon.cube />
                  </span>
                  <span className="brand-text sidebar-label">
                    <span className="brand-name">{BRAND}</span>
                    <span className="brand-sub">{role === 'STUDENT' ? t("O'quvchi portali") : centerName}</span>
                  </span>
                </Link>
                <button type="button" className="icon-btn icon-btn--bare collapse-btn" aria-label={collapsed ? t('Yon panelni ochish') : t("Yon panelni yig'ish")} aria-pressed={collapsed} onClick={toggleCollapse}>
                  {collapsed ? <Icon.panelOpen /> : <Icon.panel />}
                </button>
              </div>

              <div className="role-pill sidebar-label" data-tone={ROLE_TONE[role]}>
                <span className="role-pill-name">
                  <span className="dot" />
                  {ROLE_LABEL[role]}
                </span>
                <span className="role-pill-scope">{ROLE_SCOPE[role] ? t(ROLE_SCOPE[role]) : session.me.login}</span>
              </div>

              <nav className="nav" aria-label={t("Bo'limlar")}>
                {groups.map((g, i) => (
                  <div className="nav-group" key={g.title ?? i}>
                    {g.title ? <span className="nav-group-title">{t(g.title)}</span> : null}
                    {g.items.map((item) => {
                      const I = Icon[item.icon];
                      return (
                        <Link key={item.href} href={item.href} className="nav-link" title={collapsed ? t(item.label) : undefined} onClick={() => setMenu(false)} aria-current={isActive(pathname, item.href) ? 'page' : undefined}>
                          <I />
                          <span className="nav-label sidebar-label">{t(item.label)}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>
            <div className="sidebar-foot sidebar-label">
              <FootCard session={session} />
            </div>
          </aside>

          <div className="main">
            <header className="topbar">
              <div className="topbar-left">
                <button type="button" className="icon-btn menu-toggle" aria-label={t("Menyuni ochish")} aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
                  <Icon.menu />
                </button>
                <span className="ctx-chip" data-tone="violet">
                  {role === 'SUPER_ADMIN' ? <Icon.globe /> : <Icon.building />}
                  <span>{role === 'SUPER_ADMIN' ? t('Barcha markazlar') : centerName}</span>
                </span>
                <span className="ctx-chip ctx-chip--hide-sm" data-tone="cyan">
                  <Icon.calendar />
                  <span>
                    {date(todayLocal())}, {WEEKDAYS[(new Date(`${todayLocal()}T00:00:00Z`).getUTCDay() + 6) % 7]?.toLowerCase()}
                  </span>
                </span>
              </div>
              <div className="topbar-right">
                {session.is('OWNER', 'ADMIN', 'CASHIER', 'TEACHER') && session.can('student.view') ? <StudentSearch /> : null}
                <ThemeButton />
                <Account session={session} onLogout={logout} />
              </div>
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

function StudentSearch() {
  const t = useT();
  const router = useRouter();
  const [q, setQ] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    router.push(v ? `/students?q=${encodeURIComponent(v)}` : '/students');
  };
  return (
    <form className="topbar-search" role="search" onSubmit={submit}>
      <Icon.search />
      <label className="visually-hidden" htmlFor="top-search">
        {t("O'quvchi qidirish")}
      </label>
      <input id="top-search" type="search" placeholder={t("O'quvchi: ism, login yoki telefon")} value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
    </form>
  );
}

export function ThemeButton() {
  const t = useT();
  const [theme, toggle] = useTheme();
  const light = theme === 'light';
  return (
    <button type="button" className="icon-btn" aria-label={light ? t("Qorong'i rejimga o'tish") : t("Yorug' rejimga o'tish")} title={light ? t("Qorong'i rejim") : t("Yorug' rejim")} onClick={toggle}>
      {light ? <Icon.moon /> : <Icon.sun />}
    </button>
  );
}

function Account({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  const { me } = session;
  return (
    <div className="account" ref={box}>
      <button type="button" className="account-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="avatar" aria-hidden>
          {initials(me.fullName)}
        </span>
        <span className="account-text">
          <span>{me.fullName}</span>
          <span>{ROLE_LABEL[me.role]}</span>
        </span>
      </button>
      {open ? (
        <div className="menu" role="menu">
          <div className="menu-head">
            <strong>{me.fullName}</strong>
            <span>
              {ROLE_LABEL[me.role]} · {me.login}
            </span>
          </div>
          <Link className="menu-item" role="menuitem" href="/profile" onClick={() => setOpen(false)}>
            <Icon.user />
            {t("Profil")}
          </Link>
          <LangSwitch />
          <button type="button" className="menu-item menu-item--danger" role="menuitem" onClick={onLogout}>
            <Icon.logout />
            {t("Chiqish")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Til: tanlov cookie'da; sahifa qayta yuklanadi (hamma matn, sana va xato xabarlari bir xil tilda bo'lsin). */
function LangSwitch() {
  const t = useT();
  const lang = useLang();
  return (
    <div className="menu-lang" role="group" aria-label={t('Til')}>
      {LANGS.map((l) => (
        <button
          key={l.value}
          type="button"
          role="menuitemradio"
          aria-checked={lang === l.value}
          className="menu-lang-btn"
          onClick={() => {
            if (lang === l.value) return;
            setLang(l.value);
            window.location.reload();
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

function FootCard({ session }: { session: Session }) {
  const t = useT();
  const { me } = session;
  if (me.role === 'STUDENT') return <StudentBalance id={me.id} />;
  if (me.role === 'SUPER_ADMIN') {
    return (
      <div className="foot-card" data-tone="violet">
        <div className="foot-card-row">
          {t("Platforma")}
          <strong>{t("Global")}</strong>
        </div>
        <p>{t("Markazlar, tariflar va rahbar akkauntlari shu yerdan boshqariladi.")}</p>
      </div>
    );
  }
  const c = me.center;
  if (!c) return null;
  const trial = c.status === 'TRIAL';
  return (
    <div className="foot-card" data-tone={trial ? 'amber' : 'emerald'}>
      <div className="foot-card-row">
        {t("Markaz holati")}
        <strong>{trial ? t('Sinov') : c.status === 'ACTIVE' ? t('Faol') : c.status}</strong>
      </div>
      <p>{trial && c.trialEndsAt ? t('Sinov muddati {date} gacha.', { date: date(tsDay(c.trialEndsAt)) }) : t("{name} ma'lumotlari faqat shu markaz doirasida.", { name: c.name })}</p>
    </div>
  );
}

function StudentBalance({ id }: { id: string }) {
  const t = useT();
  const bal = useApi<{ debt: number; advance: number; openCharges: { dueDate: string }[] }>(`/students/${id}/balance`);
  const b = bal.data;
  if (!b) return null;
  const debt = b.debt > 0;
  return (
    <div className="foot-card" data-tone={debt ? 'coral' : 'emerald'}>
      <div className="foot-card-row">
        {t("Balansim")}
        <strong>{debt ? `-${money(b.debt)}` : `+${money(b.advance)}`} so&apos;m</strong>
      </div>
      <p>{debt && b.openCharges[0] ? t('Eng eski muddat: {date}', { date: date(b.openCharges[0].dueDate) }) : t("Qarz yo'q.")}</p>
    </div>
  );
}
