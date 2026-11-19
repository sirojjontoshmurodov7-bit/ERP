'use client';
import { DataView, PageHead, SelectInput, Skeleton, Stat, TextInput } from '@/components/ui';
import { METHOD_LABEL } from '@/components/payment-dialog';
import { date, money, todayLocal } from '@/lib/format';
import { opts, useBranches, useUrlState } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';

interface Finance {
  from: string;
  to: string;
  income: { total: number; byMethod: { method: string; amount: number }[] };
  expenses: { total: number; byCategory: { category: string; amount: number }[] };
  payouts: number;
  net: number;
  byBranch: { branchId: string; branchName: string; income: number; expenses: number; net: number }[];
  byGroup: { groupId: string; groupName: string; income: number }[];
  unallocated: number;
}
interface Daily {
  items: { date: string; income: number; expenses: number; net: number }[];
  totals: { income: number; expenses: number; net: number };
}
interface Overview {
  students: { active: number; archived: number; new: number };
  staff: { admins: number; cashiers: number; teachers: number };
  groups: { active: number; planned: number; finished: number };
  enrollments: { active: number; frozen: number; joined: number; left: number };
  attendance: { lessons: number; present: number; absent: number; late: number; excused: number; total: number; rate: number | null };
  finance: { income: number; expenses: number; payouts: number; net: number };
  debt: { amount: number; debtors: number; overdueCharges: number };
}
interface BranchRow {
  branchId: string;
  branchName: string;
  archived: boolean;
  students: number;
  groups: number;
  enrollments: { active: number; joined: number; left: number };
  attendance: { rate: number | null };
  income: number;
  expenses: number;
  net: number;
  debt: number;
  debtors: number;
}

const monthStart = () => `${todayLocal().slice(0, 7)}-01`;

export function ReportsPage() {
  const { can } = useSession();
  const tabs = [
    ...(can('report.overview') ? [{ key: 'overview', label: 'Umumiy' }] : []),
    ...(can('finance.report') ? [{ key: 'finance', label: 'Moliya' }, { key: 'daily', label: 'Kassa kitobi' }] : []),
    ...(can('report.branch_compare') ? [{ key: 'branches', label: 'Filiallar' }] : []),
  ];
  const [f, setF] = useUrlState({ tab: tabs[0]?.key ?? 'finance', from: monthStart(), to: todayLocal(), branchId: '', sort: 'name' });
  const branches = useBranches();
  const presets = [
    { label: 'Bugun', from: todayLocal(), to: todayLocal() },
    { label: 'Shu oy', from: monthStart(), to: todayLocal() },
    { label: "O'tgan oy", ...prevMonth() },
  ];
  return (
    <>
      <PageHead title="Hisobotlar" sub={`${date(f.from)} dan ${date(f.to)} gacha`} />
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.key} type="button" role="tab" className="tab" aria-selected={f.tab === t.key} onClick={() => setF({ tab: t.key })}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="toolbar">
        <TextInput label="Sanadan" type="date" value={f.from} max={f.to} onChange={(e) => setF({ from: e.target.value })} />
        <TextInput label="Sanagacha" type="date" value={f.to} max={todayLocal()} onChange={(e) => setF({ to: e.target.value })} />
        <div className="row presets">
          {presets.map((p) => (
            <button key={p.label} type="button" className="link-btn small" onClick={() => setF({ from: p.from, to: p.to })}>
              {p.label}
            </button>
          ))}
        </div>
        {(f.tab === 'finance' || f.tab === 'daily') && (branches.data?.items.length ?? 0) > 1 ? <SelectInput label="Filial" value={f.branchId} onChange={(e) => setF({ branchId: e.target.value })} options={opts(branches.data?.items)} placeholder="Hammasi" /> : null}
        {f.tab === 'branches' ? (
          <SelectInput
            label="Saralash"
            value={f.sort}
            onChange={(e) => setF({ sort: e.target.value })}
            options={[
              { value: 'name', label: 'Nomi' },
              { value: 'income', label: 'Tushum' },
              { value: 'net', label: 'Sof natija' },
              { value: 'students', label: "O'quvchilar" },
              { value: 'debt', label: 'Qarz' },
              { value: 'attendance', label: 'Davomat' },
            ]}
          />
        ) : null}
      </div>
      {f.tab === 'overview' ? <OverviewTab from={f.from} to={f.to} /> : null}
      {f.tab === 'finance' ? <FinanceTab from={f.from} to={f.to} branchId={f.branchId} /> : null}
      {f.tab === 'daily' ? <DailyTab from={f.from} to={f.to} branchId={f.branchId} /> : null}
      {f.tab === 'branches' ? <BranchesTab from={f.from} to={f.to} sort={f.sort} /> : null}
    </>
  );
}

function prevMonth() {
  const t = todayLocal();
  const y = Number(t.slice(0, 4));
  const m = Number(t.slice(5, 7));
  const py = m === 1 ? y - 1 : y;
  const pm = m === 1 ? 12 : m - 1;
  const last = new Date(Date.UTC(py, pm, 0)).getUTCDate();
  const mm = String(pm).padStart(2, '0');
  return { from: `${py}-${mm}-01`, to: `${py}-${mm}-${String(last).padStart(2, '0')}` };
}

function OverviewTab({ from, to }: { from: string; to: string }) {
  const s = useApi<Overview>('/reports/overview', { from, to });
  return (
    <DataView state={s} skeleton={<Skeleton rows={4} cols={4} />}>
      {(o) => (
        <div className="stack">
          <div className="stats">
            <Stat label="Tushum" value={money(o.finance.income)} note="so'm" />
            <Stat label="Xarajat" value={money(o.finance.expenses)} note="so'm" />
            <Stat label="Maosh to'lovlari" value={money(o.finance.payouts)} note="so'm" />
            <Stat label="Sof natija" value={money(o.finance.net)} note="so'm" tone={o.finance.net < 0 ? 'debt' : undefined} />
          </div>
          <div className="stats">
            <Stat label="Faol o'quvchilar" value={money(o.students.active)} note={`${o.students.new} ta yangi, ${o.students.archived} ta arxivda`} />
            <Stat label="Yozilishlar" value={money(o.enrollments.active)} note={`${o.enrollments.joined} qo'shildi, ${o.enrollments.left} chiqdi, ${o.enrollments.frozen} muzlatilgan`} />
            <Stat label="Guruhlar" value={money(o.groups.active)} note={`${o.groups.planned} rejada, ${o.groups.finished} tugagan`} />
            <Stat label="Xodimlar" value={money(o.staff.admins + o.staff.cashiers + o.staff.teachers)} note={`${o.staff.teachers} ustoz, ${o.staff.admins} admin, ${o.staff.cashiers} kassir`} />
          </div>
          <div className="stats">
            <Stat label="Davomat" value={o.attendance.rate === null ? "yo'q" : `${o.attendance.rate}%`} note={`${o.attendance.lessons} dars, ${o.attendance.absent} qoldirilgan`} />
            <Stat label="Qarz (bugungi holat)" value={money(o.debt.amount)} note={`${o.debt.debtors} qarzdor, ${o.debt.overdueCharges} hisob`} tone={o.debt.amount > 0 ? 'debt' : undefined} />
          </div>
        </div>
      )}
    </DataView>
  );
}

function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.value)));
  if (!rows.length) return <p className="muted">Ma&apos;lumot yo&apos;q.</p>;
  return (
    <div className="bars">
      {rows.map((r) => (
        <div className="bar-row" key={r.label}>
          <span>{r.label}</span>
          <span className="fig">{money(r.value)}</span>
          <span className="bar-track" aria-hidden>
            <span className="bar-fill" style={{ transform: `scaleX(${Math.abs(r.value) / max})` }} />
          </span>
        </div>
      ))}
    </div>
  );
}

function FinanceTab({ from, to, branchId }: { from: string; to: string; branchId: string }) {
  const s = useApi<Finance>('/reports/finance/summary', { from, to, branchId });
  return (
    <DataView state={s} skeleton={<Skeleton rows={4} cols={4} />}>
      {(d) => (
        <div className="stack">
          <div className="stats">
            <Stat label="Tushum" value={money(d.income.total)} note="so'm" />
            <Stat label="Xarajat" value={money(d.expenses.total)} note="so'm" />
            <Stat label="Maosh to'lovlari" value={money(d.payouts)} note={branchId ? 'filialga bog\'lanmagan' : "so'm"} />
            <Stat label="Sof natija" value={money(d.net)} note="so'm" tone={d.net < 0 ? 'debt' : undefined} />
          </div>
          <div className="grid-2">
            <section className="panel panel-body stack-sm">
              <h2>Tushum usullar bo&apos;yicha</h2>
              <Bars rows={d.income.byMethod.map((m) => ({ label: METHOD_LABEL[m.method] ?? m.method, value: m.amount }))} />
              {d.unallocated ? <p className="small muted">Shundan oldindan to&apos;lov (hisobga taqsimlanmagan): {money(d.unallocated)} so&apos;m</p> : null}
            </section>
            <section className="panel panel-body stack-sm">
              <h2>Xarajat turkumlar bo&apos;yicha</h2>
              <Bars rows={d.expenses.byCategory.map((c) => ({ label: c.category, value: c.amount }))} />
            </section>
          </div>
          {d.byBranch.length > 1 ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Filial</th>
                    <th className="num">Tushum</th>
                    <th className="num">Xarajat</th>
                    <th className="num">Sof</th>
                  </tr>
                </thead>
                <tbody>
                  {d.byBranch.map((b) => (
                    <tr key={b.branchId}>
                      <td className="cell-main">{b.branchName}</td>
                      <td className="num">{money(b.income)}</td>
                      <td className="num">{money(b.expenses)}</td>
                      <td className={b.net < 0 ? 'num debt' : 'num'}>{money(b.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {d.byGroup.length ? (
            <section className="panel">
              <div className="panel-head">
                <h2>Guruhlar bo&apos;yicha tushum</h2>
              </div>
              <div className="panel-body">
                <Bars rows={d.byGroup.map((g) => ({ label: g.groupName, value: g.income }))} />
              </div>
            </section>
          ) : null}
        </div>
      )}
    </DataView>
  );
}

function DailyTab({ from, to, branchId }: { from: string; to: string; branchId: string }) {
  const s = useApi<Daily>('/reports/finance/daily', { from, to, branchId });
  return (
    <div className="table-wrap">
      <DataView state={s} skeleton={<Skeleton rows={8} cols={4} />}>
        {(d) => (
          <table className="table">
            <thead>
              <tr>
                <th>Sana</th>
                <th className="num">Tushum, so&apos;m</th>
                <th className="num">Xarajat, so&apos;m</th>
                <th className="num">Farq, so&apos;m</th>
              </tr>
            </thead>
            <tbody>
              {d.items
                .filter((r) => r.income || r.expenses)
                .map((r) => (
                  <tr key={r.date}>
                    <td className="fig">{date(r.date)}</td>
                    <td className="num">{money(r.income)}</td>
                    <td className="num">{money(r.expenses)}</td>
                    <td className={r.net < 0 ? 'num debt' : 'num'}>{money(r.net)}</td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Jami</td>
                <td className="num">{money(d.totals.income)}</td>
                <td className="num">{money(d.totals.expenses)}</td>
                <td className={d.totals.net < 0 ? 'num debt' : 'num'}>{money(d.totals.net)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </DataView>
    </div>
  );
}

function BranchesTab({ from, to, sort }: { from: string; to: string; sort: string }) {
  const s = useApi<{ items: BranchRow[]; totals: Omit<BranchRow, 'branchId' | 'branchName' | 'archived' | 'debtors'> }>('/reports/branches', { from, to, sort });
  return (
    <div className="table-wrap">
      <DataView state={s} skeleton={<Skeleton rows={3} cols={7} />}>
        {(d) => (
          <table className="table">
            <thead>
              <tr>
                <th>Filial</th>
                <th className="num">O&apos;quvchi</th>
                <th className="num">Guruh</th>
                <th className="num">Davomat</th>
                <th className="num">Tushum</th>
                <th className="num">Xarajat</th>
                <th className="num">Sof</th>
                <th className="num">Qarz</th>
              </tr>
            </thead>
            <tbody>
              {d.items.map((b) => (
                <tr key={b.branchId}>
                  <td className="cell-main">
                    {b.branchName}
                    {b.archived ? <div className="cell-sub">arxivda</div> : null}
                  </td>
                  <td className="num">{b.students}</td>
                  <td className="num">{b.groups}</td>
                  <td className="num">{b.attendance.rate === null ? "yo'q" : `${b.attendance.rate}%`}</td>
                  <td className="num">{money(b.income)}</td>
                  <td className="num">{money(b.expenses)}</td>
                  <td className={b.net < 0 ? 'num debt' : 'num'}>{money(b.net)}</td>
                  <td className="num debt">{money(b.debt)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Jami</td>
                <td className="num">{d.totals.students}</td>
                <td className="num">{d.totals.groups}</td>
                <td className="num">{d.totals.attendance.rate === null ? "yo'q" : `${d.totals.attendance.rate}%`}</td>
                <td className="num">{money(d.totals.income)}</td>
                <td className="num">{money(d.totals.expenses)}</td>
                <td className="num">{money(d.totals.net)}</td>
                <td className="num debt">{money(d.totals.debt)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </DataView>
    </div>
  );
}
