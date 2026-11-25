'use client';
// Bosh sahifa bloklari (Stitch tizimi): KPI karta, sarlavhali karta, taqsimot chiziqlari, ustunli grafik, globus kartasi.
import { type ReactNode, useMemo } from 'react';
import { Globe } from './globe';
import { Icon } from './icons';

export type Tone = 'violet' | 'cyan' | 'emerald' | 'amber' | 'coral';

export function Kpi({ title, icon, tone, value, note, noteTone, md, debt }: { title: string; icon: keyof typeof Icon; tone: Tone; value: ReactNode; note?: ReactNode; noteTone?: Tone; md?: boolean; debt?: boolean }) {
  const I = Icon[icon];
  return (
    <article className="kpi" data-tone={tone}>
      <header className="kpi-head">
        <span className="kpi-title">{title}</span>
        <span className="kpi-icon">
          <I />
        </span>
      </header>
      <div className="kpi-foot">
        <span className={['kpi-value', md && 'kpi-value--md', debt && 'kpi-value--debt'].filter(Boolean).join(' ')}>{value}</span>
        {note !== undefined && note !== null ? (
          <span className="kpi-note" data-tone={noteTone ?? tone}>
            {note}
          </span>
        ) : null}
      </div>
    </article>
  );
}

export function KpiSkeleton({ n = 4 }: { n?: number }) {
  return (
    <section className="kpis" aria-busy="true" aria-label="Yuklanmoqda">
      {Array.from({ length: n }, (_, i) => (
        <div className="kpi" key={i}>
          <span className="skeleton" style={{ width: '50%' }} />
          <span className="skeleton" style={{ width: '35%', height: 22 }} />
        </div>
      ))}
    </section>
  );
}

export function Card({ title, sub, eyebrow, aside, children, className, id, flush }: { title: ReactNode; sub?: ReactNode; eyebrow?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string; id?: string; flush?: boolean }) {
  const hid = id ? `${id}-h` : undefined;
  return (
    <section className={['panel', className].filter(Boolean).join(' ')} aria-labelledby={hid}>
      <div className="panel-head">
        <div className="panel-head-text">
          {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          <h2 id={hid}>{title}</h2>
          {sub ? <p className="panel-sub">{sub}</p> : null}
        </div>
        {aside}
      </div>
      <div className={flush ? 'panel-body--flush' : 'panel-body'}>{children}</div>
    </section>
  );
}

/** Taqsimot: har qator nom, qiymat va to'ldirilgan chiziq (foiz 0-100). */
export function Dist({ rows }: { rows: { label: string; value: ReactNode; pct: number; tone: Tone }[] }) {
  return (
    <div className="bars">
      {rows.map((r) => (
        <div className="bar-row" key={r.label} data-tone={r.tone}>
          <span>{r.label}</span>
          <span className="fig">{r.value}</span>
          <span className="bar-track" aria-hidden>
            <span className="bar-fill" style={{ width: `${Math.max(0, Math.min(100, r.pct))}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}

/** Ustunli grafik: balandlik eng katta qiymatga nisbatan; oxirgi ustun ajratib ko'rsatiladi. Jadval ko'rinishi ekran o'quvchi uchun. */
export function Columns({ points, tone = 'cyan', caption }: { points: { label: string; value: number; shown: string }[]; tone?: Tone; caption: string }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const last = points.length - 1;
  return (
    <figure className="chart" data-tone={tone} style={{ margin: 0 }}>
      <div className="chart-cols" aria-hidden>
        {points.map((p, i) => (
          <div className="chart-col" key={p.label + i} data-last={i === last ? '' : undefined}>
            <span className="chart-val">{p.shown}</span>
            <span className="chart-bar" style={{ height: `${Math.max(1, (p.value / max) * 82)}%` }} />
          </div>
        ))}
      </div>
      <div className="chart-labels" aria-hidden>
        {points.map((p, i) => (
          <span key={p.label + i} data-last={i === last ? '' : undefined}>
            {p.label}
          </span>
        ))}
      </div>
      <figcaption className="visually-hidden">
        {caption}: {points.map((p) => `${p.label} ${p.shown}`).join(', ')}
      </figcaption>
    </figure>
  );
}

/** Globus kartasi: nuqtalar ro'yxati, pastda bir xil tanlov tugmalari (klaviatura uchun). */
export function GlobeCard({ title, sub, labels, active, onSelect, className }: { title: string; sub: string; labels: string[]; active: number; onSelect: (i: number) => void; className?: string }) {
  const nodes = useMemo(() => labels.map((label) => ({ label })), [labels]);
  return (
    <section className={['panel', className].filter(Boolean).join(' ')} aria-label={title}>
      <div className="panel-head">
        <div className="panel-head-text">
          <h2>{title}</h2>
          <p className="panel-sub">{sub}</p>
        </div>
      </div>
      <div className="panel-body">
        <div className="globe-box">
          <Globe nodes={nodes} active={active} onSelect={onSelect} spin={0.0018} />
          {labels.length ? (
            <ul className="pills" aria-label={title}>
              {labels.map((l, i) => (
                <li key={l + i}>
                  <button type="button" className="pill" aria-pressed={active === i} onClick={() => onSelect(i)}>
                    {l}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
