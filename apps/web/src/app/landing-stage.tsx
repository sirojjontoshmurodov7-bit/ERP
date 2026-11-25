'use client';
// Bosh sahifa qahramoni: bo'limlar nuqta bo'lib turgan globus. Tugma yoki nuqta tanlansa globus shu tomonga burilib keladi.
import { useState } from 'react';
import { Globe, type GlobeNode } from '@/components/globe';
import { Icon } from '@/components/icons';

const MODULES: (GlobeNode & { icon: keyof typeof Icon })[] = [
  { label: 'Davomat', lat: 28, lon: -38, icon: 'calendar' },
  { label: "To'lov va qarz", lat: 6, lon: 28, icon: 'cash' },
  { label: 'Maosh', lat: -26, lon: -8, icon: 'wallet' },
  { label: 'Vazifa va reyting', lat: 40, lon: 62, icon: 'trophy' },
  { label: 'Telegram bot', lat: -12, lon: 96, icon: 'send' },
  { label: 'Excel va CSV', lat: -36, lon: -64, icon: 'upload' },
];

export function LandingStage() {
  const [active, setActive] = useState(-1);
  return (
    <>
      <div className="lp-globe">
        <Globe nodes={MODULES} active={active} onSelect={setActive} spin={0.0022} />
      </div>
      <ul className="lp-chips" aria-label="Imkoniyatlar">
        {MODULES.map((m, i) => {
          const I = Icon[m.icon];
          return (
            <li key={m.label}>
              <button type="button" className="lp-chip" aria-pressed={active === i} onClick={() => setActive(active === i ? -1 : i)}>
                <I />
                {m.label}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
