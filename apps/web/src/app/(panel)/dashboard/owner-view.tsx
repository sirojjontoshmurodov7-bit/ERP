'use client';
// Rahbar bosh sahifasi: shu oy ko'rsatkichlari, filiallar globusi va filial kartasi, moliyaviy taqsimot, tushum grafigi, qarzdorlar, filiallar jadvali.
// Hamma raqam API'dan: /reports/overview, /reports/branches, /reports/finance/daily, /debtors.
import { useT } from '@/lib/i18n';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Card, Columns, Dist, GlobeCard, Kpi, KpiSkeleton } from '@/components/dash';
import { Icon } from '@/components/icons';
import { ButtonLink, DataView, Empty, PageHead, Segmented, Skeleton, Tag } from '@/components/ui';
import { compact, date, money, monthAbbr, monthLabel, todayLocal } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';

interface Overview {
  from: string;
  to: string;
  students: { active: number; archived: number; new: number };
  groups: { active: number; planned: number; finished: number };
  attendance: { lessons: number; rate: number | null };
  finance: { income: number; expenses: number; payouts: number; net: number };
  debt: { amount: number; debtors: number; overdueCharges: number };
}
interface BranchRow {
  branchId: string;
  branchName: string;
  archived: boolean;
  students: number;
  groups: number;
  attendance: { rate: number | null; total: number };
  income: number;
  expenses: number;
  debt: number;
  debtors: number;
}
export interface DebtorRow {
  studentId: string;
  studentName: string;
  phone?: string | null;
  debt?: number;
  daysOverdue?: number;
  groups: { groupId: string; groupName: string }[];
}
interface Daily {
  items: { date: string; income: number; expenses: number; net: number }[];
}

const monthStart = () => `${todayLocal().slice(0, 7)}-01`;
function monthsBack(n: number) {
  const [y, m] = todayLocal().slice(0, 7).split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 - n, 1));
  return d.toISOString().slice(0, 10);
}
const pctOf = (v: number, max: number) => (max > 0 ? Math.round((v / max) * 100) : 0);

export function OwnerView() {
  const t = useT();
  const { me } = useSession();
  const range = { from: monthStart(), to: todayLocal() };
  const ov = useApi<Overview>('/reports/overview', range);
  const br = useApi<{ items: BranchRow[] }>('/reports/branches', { ...range, sort: 'income' });
  return (
    <>
      <PageHead
        title="Markaz boshqaruv paneli"
        sub={t("{center} filiallari bo'yicha tushum, davomat va o'quvchilar, {month}.", { center: me.center?.name ?? t('Markaz'), month: monthLabel(todayLocal().slice(0, 7)).toLowerCase() })}
        actions={
          <>
            <ButtonLink href="/reports" icon={<Icon.chart />}>
              {t("Hisobotlar")}
            </ButtonLink>
            <ButtonLink href="/branches?new=1" variant="primary" icon={<Icon.plus />}>
              {t("Yangi filial")}
            </ButtonLink>
          </>
        }
      />
      <DataView state={ov} skeleton={<KpiSkeleton />}>
        {(o) => (
          <section className="kpis" aria-label={t("Markaz ko'rsatkichlari")}>
            <Kpi title="Faol o'quvchilar" icon="students" tone="violet" value={money(o.students.active)} note={o.students.new ? t('+{n} yangi', { n: o.students.new }) : undefined} noteTone="emerald" />
            <Kpi title="Shu oy tushum" icon="cash" tone="emerald" md value={<>{compact(o.finance.income)}<small>{t("so'm")}</small></>} note={t('sof {sum}', { sum: compact(o.finance.net) })} noteTone={o.finance.net < 0 ? 'coral' : 'emerald'} />
            <Kpi title="Qarzdorlik" icon="receipt" tone="coral" md value={<>{compact(o.debt.amount)}<small>{t("so'm")}</small></>} note={t('{n} ta qarzdor', { n: o.debt.debtors })} />
            <Kpi title="O'rtacha davomat" icon="check" tone="cyan" value={o.attendance.rate === null ? t("yo'q") : `${o.attendance.rate}%`} note={t('{n} ta dars', { n: o.attendance.lessons })} />
          </section>
        )}
      </DataView>

      <div className="dash">
        <DataView state={br} skeleton={<div className="panel c-8 skeleton-block" />}>
          {(b) => <Branches rows={b.items.filter((r) => !r.archived)} overview={ov.data} />}
        </DataView>
        <IncomeChart />
        <TopDebtors />
        <BranchTable state={br} />
      </div>
    </>
  );
}

function Branches({ rows, overview }: { rows: BranchRow[]; overview?: Overview }) {
  const t = useT();
  const labels = useMemo(() => rows.map((r) => r.branchName), [rows]);
  const [active, setActive] = useState(0);
  const sel = rows[active] ?? rows[0];
  const f = overview?.finance;
  const max = f ? Math.max(f.income, f.payouts, f.expenses) : 0;
  return (
    <>
      <GlobeCard className="c-8" title="Filiallar globusi" sub="Filialni tanlang: shu oydagi ko'rsatkichlari o'ng tomonda" labels={labels} active={active} onSelect={setActive} />
      <div className="col c-4">
        {sel ? (
          <Card eyebrow="Filial ko'rsatkichlari" title={sel.branchName} aside={sel.debtors ? <Tag kind="warn">{t('{n} qarzdor', { n: sel.debtors })}</Tag> : <Tag kind="ok">{t("Barqaror")}</Tag>}>
            <div className="minis">
              <div className="mini">
                <span className="mini-label">{t("O'quvchilar")}</span>
                <span className="mini-value">{money(sel.students)}</span>
              </div>
              <div className="mini">
                <span className="mini-label">{t("Faol guruhlar")}</span>
                <span className="mini-value">{money(sel.groups)}</span>
              </div>
              <div className="mini">
                <span className="mini-label">{t("Tushum")}</span>
                <span className="mini-value" data-tone="emerald">{compact(sel.income)}</span>
              </div>
              <div className="mini">
                <span className="mini-label">{t("Davomat")}</span>
                <span className="mini-value" data-tone="cyan">{sel.attendance.rate === null ? t("yo'q") : `${sel.attendance.rate}%`}</span>
              </div>
            </div>
          </Card>
        ) : (
          <section className="panel">
            <Empty title="Filial yo'q" />
          </section>
        )}
        <Card className="grow" title="Moliyaviy taqsimot" aside={<span className="muted small">{monthAbbr(todayLocal().slice(0, 7))}</span>}>
          {f ? (
            <Dist
              rows={[
                { label: "To'langan tushum", value: compact(f.income), pct: pctOf(f.income, max), tone: 'emerald' },
                { label: "Maosh to'lovlari", value: compact(f.payouts), pct: pctOf(f.payouts, max), tone: 'violet' },
                { label: 'Operatsion xarajat', value: compact(f.expenses), pct: pctOf(f.expenses, max), tone: 'amber' },
              ]}
            />
          ) : (
            <Skeleton rows={3} cols={2} />
          )}
        </Card>
      </div>
    </>
  );
}

type Period = 'day' | 'week' | 'month';
function IncomeChart() {
  const t = useT();
  const [period, setPeriod] = useState<Period>('month');
  const daily = useApi<Daily>('/reports/finance/daily', { from: monthsBack(5), to: todayLocal() });
  return (
    <Card
      className="c-8"
      title="Daromad va xarajatlar"
      sub="Qabul qilingan to'lovlar (ustun) va xarajatlar, so'm"
      aside={
        <Segmented<Period>
          label="Davr"
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'day', label: 'Kunlik' },
            { value: 'week', label: 'Haftalik' },
            { value: 'month', label: 'Oylik' },
          ]}
        />
      }
    >
      <DataView state={daily} skeleton={<div className="skeleton-block" />}>
        {(d) => {
          const pts = bucket(d.items, period);
          const income = pts.reduce((s, p) => s + p.income, 0);
          const expenses = pts.reduce((s, p) => s + p.expenses, 0);
          return (
            <div className="stack">
              <Columns tone="emerald" caption="Tushum" points={pts.map((p) => ({ label: p.label, value: p.income, shown: compact(p.income) }))} />
              <div className="chart-legend">
                <span>
                  {t("Tushum:")}{' '}<b className="fig ok-text">{money(income)}</b>
                </span>
                <span>
                  {t("Xarajat:")}{' '}<b className="fig tone-text" data-tone="amber">{money(expenses)}</b>
                </span>
                <span>
                  {t("Sof:")}{' '}<b className={income - expenses < 0 ? 'fig debt' : 'fig'}>{money(income - expenses)}</b>
                </span>
              </div>
            </div>
          );
        }}
      </DataView>
    </Card>
  );
}

function bucket(items: Daily['items'], period: Period) {
  if (period === 'day') {
    return items.slice(-14).map((r) => ({ label: r.date.slice(8, 10), income: r.income, expenses: r.expenses }));
  }
  if (period === 'week') {
    const out: { label: string; income: number; expenses: number }[] = [];
    const last = items.slice(-56);
    for (let i = 0; i < last.length; i += 7) {
      const chunk = last.slice(i, i + 7);
      out.push({ label: date(chunk[0]!.date).slice(0, 5), income: chunk.reduce((s, r) => s + r.income, 0), expenses: chunk.reduce((s, r) => s + r.expenses, 0) });
    }
    return out;
  }
  const map = new Map<string, { income: number; expenses: number }>();
  for (const r of items) {
    const k = r.date.slice(0, 7);
    const cur = map.get(k) ?? { income: 0, expenses: 0 };
    cur.income += r.income;
    cur.expenses += r.expenses;
    map.set(k, cur);
  }
  return [...map.entries()].map(([k, v]) => ({ label: monthAbbr(k), ...v }));
}

function TopDebtors() {
  const t = useT();
  const debtors = useApi<{ items: DebtorRow[]; total: number; totalDebt?: number }>('/debtors', { limit: 4 });
  return (
    <Card className="c-4" title="Eng katta qarzdorlar" aside={debtors.data ? <span className="count-badge">{debtors.data.total}</span> : null}>
      <DataView state={debtors} skeleton={<Skeleton rows={3} cols={2} />} empty={(d) => (d.items.length ? null : <p className="muted">{t("Muddati o'tgan to'lanmagan hisob yo'q.")}</p>)}>
        {(d) => (
          <div className="stack">
            <ul className="items">
              {d.items.map((r) => (
                <li className="item" key={r.studentId}>
                  <span className="item-text">
                    <Link className="item-title" href={`/students/${r.studentId}`}>
                      {r.studentName}
                    </Link>
                    <span className="item-sub">
                      {r.groups.map((g) => g.groupName).join(', ')}
                      {r.daysOverdue !== undefined ? ` · ${t('{n} kun', { n: r.daysOverdue })}` : ''}
                    </span>
                  </span>
                  <span className="fig debt">{r.debt !== undefined ? compact(r.debt) : 'bor'}</span>
                </li>
              ))}
            </ul>
            <Link className="link small" href="/debtors">
              {t("Hamma qarzdorlar")}
            </Link>
          </div>
        )}
      </DataView>
    </Card>
  );
}

function BranchTable({ state }: { state: ReturnType<typeof useApi<{ items: BranchRow[] }>> }) {
  const t = useT();
  return (
    <section className="col" aria-labelledby="br-h">
      <div className="row" data-between>
        <h2 id="br-h">{t("Filiallar samaradorligi")}</h2>
        <Link className="link" href="/reports">
          {t("Batafsil hisobot")}
        </Link>
      </div>
      <DataView state={state} skeleton={<div className="table-wrap"><Skeleton rows={3} cols={6} /></div>} empty={(d) => (d.items.length ? null : <section className="panel"><Empty title="Filial yo'q" /></section>)}>
        {(d) => (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("Filial nomi")}</th>
                  <th className="num">{t("O'quvchilar")}</th>
                  <th className="num">{t("Guruhlar")}</th>
                  <th className="num">{t("Davomat")}</th>
                  <th className="num" aria-sort="descending">{t("Oylik tushum")}</th>
                  <th className="num">{t("Qarzdorlik")}</th>
                  <th className="num">{t("Holat")}</th>
                </tr>
              </thead>
              <tbody>
                {d.items.map((r) => (
                  <tr key={r.branchId}>
                    <td className="cell-main">{r.branchName}</td>
                    <td className="num">{money(r.students)}</td>
                    <td className="num">{money(r.groups)}</td>
                    <td className="num tone-text" data-tone="cyan">{r.attendance.rate === null ? t("yo'q") : `${r.attendance.rate}%`}</td>
                    <td className="num ok-text">{money(r.income)}</td>
                    <td className={r.debt ? 'num debt' : 'num muted'}>{money(r.debt)}</td>
                    <td className="num">{r.archived ? <Tag kind="mute">{t("Arxivda")}</Tag> : r.debtors ? <Tag kind="warn">{t("Nazorat")}</Tag> : <Tag kind="ok">{t("Faol")}</Tag>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataView>
    </section>
  );
}


