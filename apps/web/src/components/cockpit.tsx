'use client';
// Bosh sahifadagi 3D globus: nuqtalar rolga ochiq bo'limlar, bosilsa shu bo'limga o'tiladi.
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { navFor } from '@/lib/nav';
import { ROLE_LABEL, useSession } from '@/lib/session';
import { Globe, type GlobeNode } from './globe';

export function Cockpit() {
  const session = useSession();
  const router = useRouter();
  const [active, setActive] = useState(-1);
  const items = useMemo(() => navFor(session).flatMap((g) => g.items).filter((i) => i.href !== '/dashboard' && i.href !== '/profile').slice(0, 8), [session]);
  const nodes = useMemo<GlobeNode[]>(() => items.map((i) => ({ label: i.label })), [items]);
  const first = session.me.fullName.split(' ')[0];
  return (
    <section className="panel cockpit" aria-label="Bo'limlar globusi">
      <div className="cockpit-text">
        <h2>Salom, {first}</h2>
        <p className="cockpit-hint">{session.me.center?.name ?? 'Platforma boshqaruvi'}, {ROLE_LABEL[session.me.role].toLowerCase()}. Globusni aylantiring, nuqtani bosing.</p>
      </div>
      <div className="cockpit-globe">
        <Globe
          nodes={nodes}
          active={active}
          onSelect={(i) => {
            setActive(i);
            const href = items[i]?.href;
            if (href) window.setTimeout(() => router.push(href), 550);
          }}
        />
      </div>
    </section>
  );
}
