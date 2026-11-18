'use client';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { ButtonLink, DataView, Empty, PageHead, Skeleton, Stat, Tag } from '@/components/ui';
import { date, dateTime, money, som, todayLocal, WEEKDAYS } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';

interface Overview {
  from: string;
  to: string;
  students: { active: number; archived: number; new: number };
  groups: { active: number; planned: number; finished: number };
  enrollments: { active: number; frozen: number; joined: number; left: number };
  attendance: { lessons: number; rate: number | null };
  finance: { income: number; expenses: number; payouts: number; net: number };
  debt: { amount: number; debtors: number; overdueCharges: number };
}
interface DebtorRow {
  studentId: string;
  studentName: string;
  phone?: string | null;
  debt?: number;
  daysOverdue?: number;
  groups: { groupId: string; groupName: string }[];
}
interface Group {
  id: string;
  name: string;
  branchName: string;
  courseName: string;
  studentCount: number;
  schedule: { weekday: number; startTime: string; endTime: string; room: string | null }[];
}
interface Assignment {
  id: string;
  title: string;
  groupName: string;
  dueAt: string | null;
  counts?: { students: number; submitted: number; graded: number };
  mySubmission?: { score: number | null } | null;
}

const monthStart = () => `${todayLocal().slice(0, 7)}-01`;

export function Dashboard() {
  const { is } = useSession();
  return (
    <>
      <PageHead title="Bosh sahifa" sub={`${date(todayLocal())}, ${WEEKDAYS[(new Date(`${todayLocal()}T00:00:00Z`).getUTCDay() + 6) % 7]?.toLowerCase()}`} />
      {is('OWNER') ? <OwnerView /> : null}
      {is('ADMIN', 'CASHIER') ? <DeskView /> : null}
      {is('TEACHER') ? <TeacherView /> : null}
      {is('STUDENT') ? <StudentView /> : null}
      {is('SUPER_ADMIN') ? <PlatformView /> : null}
    </>
  );
}

function OwnerView() {
  const ov = useApi<Overview>('/reports/overview', { from: monthStart(), to: todayLocal() });
  const debtors = useApi<{ items: DebtorRow[]; total: number; totalDebt: number }>('/debtors', { limit: 6 });
  return (
    <>
      <DataView state={ov} skeleton={<div className="stats"><Stat label="Yuklanmoqda" value="—" /></div>}>
        {(o) => (
          <section className="stack-sm" aria-labelledby="month-h">
            <h2 id="month-h">Shu oy: {date(o.from)} – {date(o.to)}</h2>
            <div className="stats">
              <Stat label="Faol o'quvchilar" value={money(o.students.active)} note={`${o.students.new} ta yangi`} />
              <Stat label="Faol guruhlar" value={money(o.groups.active)} note={o.groups.planned ? `${o.groups.planned} ta rejada` : undefined} />
              <Stat label="Tushum" value={money(o.finance.income)} note="so'm" />
              <Stat label="Xarajat va maosh" value={money(o.finance.expenses + o.finance.payouts)} note="so'm" />
              <Stat label="Qarz" value={money(o.debt.amount)} note={`${o.debt.debtors} ta qarzdor`} tone={o.debt.amount > 0 ? 'debt' : undefined} />
              <Stat label="Davomat" value={o.attendance.rate === null ? '—' : `${o.attendance.rate}%`} note={`${o.attendance.lessons} ta dars`} />
            </div>
          </section>
        )}
      </DataView>
      <DebtorsPanel state={debtors} />
    </>
  );
}

function DeskView() {
  const { can } = useSession();
  const today = todayLocal();
  const fin = useApi<{ income: { total: number; byMethod: { method: string; amount: number }[] }; expenses: { total: number } }>(can('finance.report') ? '/reports/finance/summary' : null, { from: today, to: today });
  const debtors = useApi<{ items: DebtorRow[]; total: number; totalDebt: number }>(can('debtors.view') ? '/debtors' : null, { limit: 6 });
  return (
    <>
      <div className="actions">
        {can('payment.create') ? <ButtonLink href="/payments?new=1" variant="primary" icon={<Icon.cash />}>To&apos;lov qabul qilish</ButtonLink> : null}
        {can('student.create') ? <ButtonLink href="/students?new=1" icon={<Icon.plus />}>Yangi o&apos;quvchi</ButtonLink> : null}
        {can('attendance.mark') ? <ButtonLink href="/attendance" icon={<Icon.calendar />}>Davomat</ButtonLink> : null}
      </div>
      {can('finance.report') ? (
        <DataView state={fin}>
          {(f) => (
            <div className="stats">
              <Stat label="Bugungi tushum" value={money(f.income.total)} note="so'm" />
              {f.income.byMethod.map((m) => (
                <Stat key={m.method} label={METHOD[m.method] ?? m.method} value={money(m.amount)} />
              ))}
              <Stat label="Bugungi xarajat" value={money(f.expenses.total)} />
            </div>
          )}
        </DataView>
      ) : null}
      {can('debtors.view') ? <DebtorsPanel state={debtors} /> : null}
    </>
  );
}

export const METHOD: Record<string, string> = { CASH: 'Naqd', CARD: 'Karta', TRANSFER: "O'tkazma", CLICK: 'Click', PAYME: 'Payme' };

function DebtorsPanel({ state }: { state: ReturnType<typeof useApi<{ items: DebtorRow[]; total: number; totalDebt: number }>> }) {
  return (
    <section className="panel" aria-labelledby="debt-h">
      <div className="panel-head">
        <h2 id="debt-h">Eng katta qarzdorlar</h2>
        <Link className="link small" href="/debtors">
          Hammasi
        </Link>
      </div>
      <div className="panel-body--flush">
        <DataView state={state} skeleton={<Skeleton rows={4} />} empty={(d) => (d.items.length ? null : <Empty title="Qarzdor yo'q" text="Muddati o'tgan to'lanmagan hisob yo'q." />)}>
          {(d) => (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>O&apos;quvchi</th>
                    <th>Guruh</th>
                    <th className="num">Kechikish</th>
                    <th className="num">Qarz, so&apos;m</th>
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((r) => (
                    <tr key={r.studentId}>
                      <td>
                        <Link className="cell-main" href={`/students/${r.studentId}`}>
                          {r.studentName}
                        </Link>
                        {r.phone ? <div className="cell-sub fig">{r.phone}</div> : null}
                      </td>
                      <td className="muted">{r.groups.map((g) => g.groupName).join(', ')}</td>
                      <td className="num">{r.daysOverdue !== undefined ? `${r.daysOverdue} kun` : '—'}</td>
                      <td className="num debt">{r.debt !== undefined ? money(r.debt) : 'bor'}</td>
                    </tr>
                  ))}
                </tbody>
                {d.totalDebt !== undefined ? (
                  <tfoot>
                    <tr>
                      <td colSpan={3}>Jami {d.total} ta qarzdor</td>
                      <td className="num debt">{money(d.totalDebt)}</td>
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          )}
        </DataView>
      </div>
    </section>
  );
}

function todaysWeekday() {
  return ((new Date(`${todayLocal()}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;
}

function TeacherView() {
  const groups = useApi<{ items: Group[] }>('/groups', { limit: 200 });
  const tasks = useApi<{ items: Assignment[] }>('/assignments', { limit: 20 });
  const wd = todaysWeekday();
  return (
    <div className="split">
      <section className="panel" aria-labelledby="today-h">
        <div className="panel-head">
          <h2 id="today-h">Bugungi darslar</h2>
        </div>
        <div className="panel-body--flush">
          <DataView state={groups} skeleton={<Skeleton rows={3} />}>
            {(d) => {
              const today = d.items
                .flatMap((g) => g.schedule.filter((s) => s.weekday === wd).map((s) => ({ g, s })))
                .sort((a, b) => a.s.startTime.localeCompare(b.s.startTime));
              if (!today.length) return <Empty title="Bugun dars yo'q" text="Jadvalingiz bo'yicha bugun darslar belgilanmagan." action={<ButtonLink href="/groups" size="sm">Guruhlarim</ButtonLink>} />;
              return (
                <ul className="list-plain">
                  {today.map(({ g, s }) => (
                    <li key={g.id + s.startTime} className="row" data-between>
                      <span>
                        <span className="fig">{s.startTime}–{s.endTime}</span>{' '}
                        <Link className="cell-main" href={`/groups/${g.id}`}>
                          {g.name}
                        </Link>
                        <span className="cell-sub"> {s.room ?? g.branchName}, {g.studentCount} o&apos;quvchi</span>
                      </span>
                      <ButtonLink href={`/groups/${g.id}?tab=lessons&mark=${todayLocal()}`} size="sm" icon={<Icon.check />}>
                        Davomat
                      </ButtonLink>
                    </li>
                  ))}
                </ul>
              );
            }}
          </DataView>
        </div>
      </section>
      <section className="panel" aria-labelledby="grade-h">
        <div className="panel-head">
          <h2 id="grade-h">Tekshirish kutilmoqda</h2>
        </div>
        <div className="panel-body--flush">
          <DataView state={tasks} skeleton={<Skeleton rows={3} cols={2} />}>
            {(d) => {
              const pending = d.items.filter((a) => (a.counts?.submitted ?? 0) > (a.counts?.graded ?? 0));
              if (!pending.length) return <Empty title="Hammasi tekshirilgan" text="Yangi topshiriqlar kelganda shu yerda ko'rinadi." />;
              return (
                <ul className="list-plain">
                  {pending.map((a) => (
                    <li key={a.id}>
                      <Link className="cell-main" href={`/assignments/${a.id}`}>
                        {a.title}
                      </Link>
                      <div className="cell-sub">
                        {a.groupName}: {(a.counts?.submitted ?? 0) - (a.counts?.graded ?? 0)} ta baholanmagan
                      </div>
                    </li>
                  ))}
                </ul>
              );
            }}
          </DataView>
        </div>
      </section>
    </div>
  );
}

interface Balance {
  charged: number;
  debt: number;
  advance: number;
  openCharges: { id: string; dueDate: string; remaining: number }[];
}
function StudentView() {
  const { me } = useSession();
  const bal = useApi<Balance>(`/students/${me.id}/balance`);
  const groups = useApi<{ items: Group[] }>('/groups');
  const tasks = useApi<{ items: Assignment[] }>('/assignments', { status: 'open', limit: 10 });
  const att = useApi<{ totals: { rate: number | null; present: number; absent: number; late: number } }>('/attendance/summary');
  return (
    <>
      <div className="stats">
        <DataView state={bal} skeleton={<Stat label="Balans" value="—" />}>
          {(b) =>
            b.debt > 0 ? (
              <Stat label="Qarz" value={money(b.debt)} note={`so'm, eng eski muddat ${date(b.openCharges[0]?.dueDate)}`} tone="debt" />
            ) : (
              <Stat label="To'lov holati" value={<span className="stamp">To&apos;langan</span>} note={b.advance ? `Oldindan to'lov: ${som(b.advance)}` : undefined} />
            )
          }
        </DataView>
        <DataView state={att} skeleton={<Stat label="Davomat" value="—" />}>
          {(a) => <Stat label="Davomat" value={a.totals.rate === null ? '—' : `${a.totals.rate}%`} note={`${a.totals.absent} ta qoldirilgan dars`} />}
        </DataView>
      </div>
      <div className="grid-2">
        <section className="panel" aria-labelledby="my-groups">
          <div className="panel-head">
            <h2 id="my-groups">Guruhlarim</h2>
          </div>
          <div className="panel-body--flush">
            <DataView state={groups} skeleton={<Skeleton rows={2} cols={2} />} empty={(d) => (d.items.length ? null : <Empty title="Guruhga yozilmagansiz" text="Administrator sizni guruhga yozgach, jadval shu yerda ko'rinadi." />)}>
              {(d) => (
                <ul className="list-plain">
                  {d.items.map((g) => (
                    <li key={g.id}>
                      <span className="cell-main">{g.name}</span>
                      <div className="cell-sub">{g.schedule.map((s) => `${WEEKDAYS[s.weekday - 1]} ${s.startTime}`).join(', ') || 'Jadval belgilanmagan'}</div>
                    </li>
                  ))}
                </ul>
              )}
            </DataView>
          </div>
        </section>
        <section className="panel" aria-labelledby="my-tasks">
          <div className="panel-head">
            <h2 id="my-tasks">Vazifalar</h2>
            <Link className="link small" href="/assignments">
              Hammasi
            </Link>
          </div>
          <div className="panel-body--flush">
            <DataView state={tasks} skeleton={<Skeleton rows={2} cols={2} />} empty={(d) => (d.items.length ? null : <Empty title="Ochiq vazifa yo'q" />)}>
              {(d) => (
                <ul className="list-plain">
                  {d.items.map((a) => (
                    <li key={a.id} className="row" data-between>
                      <span>
                        <Link className="cell-main" href={`/assignments/${a.id}`}>
                          {a.title}
                        </Link>
                        <div className="cell-sub">{a.groupName}{a.dueAt ? `, muddat ${dateTime(a.dueAt)}` : ''}</div>
                      </span>
                      {a.mySubmission ? <Tag kind="ok">Topshirilgan</Tag> : <Tag kind="warn">Topshirilmagan</Tag>}
                    </li>
                  ))}
                </ul>
              )}
            </DataView>
          </div>
        </section>
      </div>
    </>
  );
}

function PlatformView() {
  const centers = useApi<{ items: { id: string; status: string }[] }>('/admin/centers', { limit: 200 });
  return (
    <DataView state={centers}>
      {(d) => (
        <>
          <div className="stats">
            <Stat label="Markazlar" value={money(d.items.length)} />
            <Stat label="Faol" value={money(d.items.filter((c) => c.status === 'ACTIVE').length)} />
            <Stat label="Sinovda" value={money(d.items.filter((c) => c.status === 'TRIAL').length)} />
            <Stat label="Bloklangan" value={money(d.items.filter((c) => c.status === 'BLOCKED').length)} />
          </div>
          <div className="actions">
            <ButtonLink href="/admin/centers?new=1" variant="primary" icon={<Icon.plus />}>
              Yangi markaz
            </ButtonLink>
            <ButtonLink href="/admin/plans">Tariflar</ButtonLink>
          </div>
        </>
      )}
    </DataView>
  );
}
