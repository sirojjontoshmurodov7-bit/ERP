'use client';
// Rollar: 3D karusel. Tanlangan rol oldinga chiqadi, qolganlari chuqurlikka ketadi.
import { useT } from '@/lib/i18n';
import { useState } from 'react';

export interface DeckRole {
  role: string;
  text: string;
}

export function RoleDeck({ roles }: { roles: DeckRole[] }) {
  const t = useT();
  const [active, setActive] = useState(0);
  const go = (n: number) => setActive((n + roles.length) % roles.length);
  return (
    <div className="lp-deck" onKeyDown={(e) => { if (e.key === 'ArrowRight') go(active + 1); if (e.key === 'ArrowLeft') go(active - 1); }}>
      <div className="lp-deck-stage" role="group" aria-label={t("Rollar")}>
        {roles.map((r, i) => {
          const d = i - active;
          return (
            <button
              type="button"
              key={r.role}
              className="lp-card3d"
              style={{ '--d': d, '--a': Math.abs(d) } as React.CSSProperties}
              aria-pressed={d === 0}
              onClick={() => setActive(i)}
            >
              <span className="lp-card3d-title">{t(r.role)}</span>
              <span className="lp-card3d-text">{t(r.text)}</span>
            </button>
          );
        })}
      </div>
      <div className="lp-deck-nav">
        <button type="button" className="lp-orb" aria-label={t("Oldingi rol")} onClick={() => go(active - 1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
        </button>
        <button type="button" className="lp-orb" aria-label={t("Keyingi rol")} onClick={() => go(active + 1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
        </button>
      </div>
    </div>
  );
}
