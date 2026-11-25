'use client';
// Super admin bosh sahifasi: markazlar soni va holati, tarif taqsimoti, so'nggi ochilgan va sinov muddati tugayotgan markazlar.
// Super admin markaz ichki ma'lumotini (o'quvchi, to'lov) ko'rmaydi (RLS), shuning uchun faqat platforma ko'rsatkichlari.
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Card, Dist, GlobeCard, Kpi, KpiSkeleton } from '@/components/dash';
import { Icon } from '@/components/icons';
import { ButtonLink, DataView, Empty, PageHead, Tag } from '@/components/ui';
import { date, daysBetweenIso, money, todayLocal, tsDay } from '@/lib/format';
import { useApi } from '@/lib/use-api';

interface Center {
  id: string;
  name: string;
  slug: string;
  status: 'TRIAL' | 'ACTIVE' | 'BLOCKED' | string;
  planName: string | null;
  trialEndsAt: string | null;
  blockedAt: string | null;
  createdAt: string;
}

export const CENTER_STATUS: Record<string, { label: string; kind: 'ok' | 'warn' | 'bad' | 'mute' }> = {
  ACTIVE: { label: 'Faol', kind: 'ok' },
  TRIAL: { label: 'Sinovda', kind: 'warn' },
  BLOCKED: { label: 'Bloklangan', kind: 'bad' },
};
const statusOf = (s: string) => CENTER_STATUS[s] ?? { label: s, kind: 'mute' as const };
const TONES = ['violet', 'cyan', 'emerald', 'amber', 'coral'] as const;

export function PlatformView() {
  const centers = useApi<{ items: Center[] }>('/admin/centers', { limit: 200 });
  return (
    <>
      <PageHead
        title="Platforma boshqaruv markazi"
        sub={centers.data ? `${centers.data.items.length} ta o'quv markazi: holat, tarif va sinov muddatlari.` : "O'quv markazlari, tariflar va rahbar akkauntlari."}
        actions={
          <>
            <ButtonLink href="/admin/plans" icon={<Icon.layers />}>
              Tariflar
            </ButtonLink>
            <ButtonLink href="/admin/centers?new=1" variant="primary" icon={<Icon.plus />}>
              Yangi markaz
            </ButtonLink>
          </>
        }
      />
      <DataView state={centers} skeleton={<KpiSkeleton />} empty={(d) => (d.items.length ? null : <section className="panel"><Empty title="Hali markaz yo'q" text="Birinchi markazni oching: asosiy filial va rahbar akkaunti avtomatik yaratiladi." action={<ButtonLink href="/admin/centers?new=1" variant="primary" size="sm">Yangi markaz</ButtonLink>} /></section>)}>
        {(d) => <Platform items={d.items} />}
      </DataView>
    </>
  );
}

function Platform({ items }: { items: Center[] }) {
  const today = todayLocal();
  const month = today.slice(0, 7);
  const byNew = useMemo(() => [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [items]);
  const shown = useMemo(() => byNew.slice(0, 8), [byNew]);
  const labels = useMemo(() => shown.map((c) => c.name), [shown]);
  const [active, setActive] = useState(0);
  const sel = shown[active] ?? shown[0];

  const count = (s: string) => items.filter((c) => c.status === s).length;
  const fresh = items.filter((c) => tsDay(c.createdAt).slice(0, 7) === month).length;
  const trials = items
    .filter((c) => c.status === 'TRIAL' && c.trialEndsAt)
    .map((c) => ({ ...c, left: daysBetweenIso(today, tsDay(c.trialEndsAt!)) }))
    .sort((a, b) => a.left - b.left);
  const soon = trials.filter((t) => t.left <= 7).length;
  const pct = (n: number) => (items.length ? Math.round((n / items.length) * 100) : 0);

  const plans = new Map<string, number>();
  for (const c of items) plans.set(c.planName ?? 'Tarifsiz', (plans.get(c.planName ?? 'Tarifsiz') ?? 0) + 1);
  const planRows = [...plans.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <>
      <section className="kpis" aria-label="Asosiy ko'rsatkichlar">
        <Kpi title="Jami markazlar" icon="building" tone="violet" value={money(items.length)} note={fresh ? `+${fresh} shu oy` : undefined} noteTone="emerald" />
        <Kpi title="Faol markazlar" icon="check" tone="emerald" value={money(count('ACTIVE'))} note={`${pct(count('ACTIVE'))}%`} />
        <Kpi title="Sinov muddatida" icon="clock" tone="amber" value={money(count('TRIAL'))} note={soon ? `${soon} tasi 7 kunda tugaydi` : undefined} />
        <Kpi title="Bloklangan" icon="lock" tone="coral" value={money(count('BLOCKED'))} note={`${pct(count('BLOCKED'))}%`} />
      </section>

      <div className="dash">
        <GlobeCard className="c-8" title="Markazlar globusi" sub="Globusni suring yoki markazni tanlang: ma'lumoti o'ng tomonda" labels={labels} active={active} onSelect={setActive} />
        <div className="col c-4">
          {sel ? (
            <Card eyebrow="Tanlangan markaz" title={sel.name} aside={<Tag kind={statusOf(sel.status).kind}>{statusOf(sel.status).label}</Tag>}>
              <div className="stack">
                <div className="minis">
                  <div className="mini">
                    <span className="mini-label">Tarif</span>
                    <span className="mini-value" data-tone="violet">{sel.planName ?? 'Tarifsiz'}</span>
                  </div>
                  <div className="mini">
                    <span className="mini-label">Login prefiksi</span>
                    <span className="mini-value fig">{sel.slug}</span>
                  </div>
                  <div className="mini">
                    <span className="mini-label">Ochilgan</span>
                    <span className="mini-value fig">{date(tsDay(sel.createdAt))}</span>
                  </div>
                  <div className="mini">
                    <span className="mini-label">{sel.status === 'BLOCKED' ? 'Bloklangan' : 'Sinov tugashi'}</span>
                    <span className="mini-value fig" data-tone={sel.status === 'BLOCKED' ? 'coral' : 'cyan'}>
                      {sel.status === 'BLOCKED' ? (sel.blockedAt ? date(tsDay(sel.blockedAt)) : "yo'q") : sel.trialEndsAt ? date(tsDay(sel.trialEndsAt)) : "yo'q"}
                    </span>
                  </div>
                </div>
                <Link className="link small" href="/admin/centers">
                  Markazlar ro&apos;yxatida ochish
                </Link>
              </div>
            </Card>
          ) : null}
          <Card className="grow" title="Tarif taqsimoti" aside={<span className="muted small">{items.length} ta</span>}>
            <Dist rows={planRows.map(([name, n], i) => ({ label: name, value: `${pct(n)}%`, pct: pct(n), tone: TONES[i % TONES.length]! }))} />
          </Card>
        </div>

        <section className="col c-8" aria-labelledby="new-centers-h">
          <div className="row" data-between>
            <h2 id="new-centers-h">So&apos;nggi ochilgan markazlar</h2>
            <Link className="link" href="/admin/centers">
              Barchasini ko&apos;rish
            </Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Markaz nomi</th>
                  <th>Tarif</th>
                  <th aria-sort="descending">Ochilgan</th>
                  <th className="num">Holat</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="cell-main">{c.name}</span>
                      <div className="cell-sub fig">{c.slug}</div>
                    </td>
                    <td>{c.planName ?? <span className="muted">Tarifsiz</span>}</td>
                    <td className="fig">{date(tsDay(c.createdAt))}</td>
                    <td className="num">
                      <Tag kind={statusOf(c.status).kind}>{statusOf(c.status).label}</Tag>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <Card className="c-4" title="Sinov muddati yaqin" sub="Muddat tugagach markaz tarifga o'tkaziladi yoki bloklanadi">
          {trials.length ? (
            <ul className="feed">
              {trials.slice(0, 6).map((t) => (
                <li key={t.id} data-tone={t.left <= 3 ? 'coral' : t.left <= 7 ? 'amber' : 'emerald'}>
                  <span className="dot" />
                  <span className="item-text">
                    <span className="cell-main">{t.name}</span>
                    <span className="cell-sub">
                      {t.left < 0 ? `${-t.left} kun oldin tugagan` : t.left === 0 ? 'Bugun tugaydi' : `${t.left} kun qoldi`} · {date(tsDay(t.trialEndsAt!))}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Sinov muddatidagi markaz yo&apos;q.</p>
          )}
        </Card>
      </div>
    </>
  );
}
