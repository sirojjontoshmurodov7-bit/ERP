'use client';
// Bosh sahifa: har rol o'z ko'rinishini oladi (Stitch tizimi). Super admin, rahbar va o'quvchi alohida fayllarda.
import Link from 'next/link';
import { Card, Kpi, KpiSkeleton } from '@/components/dash';
import { Icon } from '@/components/icons';
import { ButtonLink, DataView, Empty, PageHead, Skeleton } from '@/components/ui';
import { compact, date, money, todayLocal, WEEKDAYS } from '@/lib/format';
import { ROLE_LABEL, useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import type { Assignment } from '../assignments/types';
import type { Group } from '../groups/types';
import { type DebtorRow, OwnerView } from './owner-view';
import { PlatformView } from './platform-view';
import { StudentView, todaysWeekday } from './student-view';


export function Dashboard() {
  const { is } = useSession();
  if (is('SUPER_ADMIN')) return <PlatformView />;
  if (is('OWNER')) return <OwnerView />;
  if (is('STUDENT')) return <StudentView />;
  if (is('TEACHER')) return <TeacherView />;
  return <DeskView />;
}

function Greeting({ actions, sub }: { actions?: React.ReactNode; sub?: string }) {
  const { me } = useSession();
  const first = me.fullName.split(' ')[0] ?? me.fullName;
  const weekday = WEEKDAYS[(new Date(`${todayLocal()}T00:00:00Z`).getUTCDay() + 6) % 7]?.toLowerCase();
  return <PageHead title={`Salom, ${first}`} sub={sub ?? `${ROLE_LABEL[me.role]}, ${me.center?.name ?? ''}. Bugun ${date(todayLocal())}, ${weekday}.`} actions={actions} />;
}

function DeskView() {
  const { can } = useSession();
  const today = todayLocal();
  const fin = useApi<{ income: { total: number; byMethod: { method: string; amount: number }[] }; expenses: { total: number } }>(can('finance.report') ? '/reports/finance/summary' : null, { from: today, to: today });
  const debtors = useApi<{ items: DebtorRow[]; total: number; totalDebt?: number }>(can('debtors.view') ? '/debtors' : null, { limit: 6 });
  const method = (m: string) => fin.data?.income.byMethod.find((x) => x.method === m)?.amount ?? 0;
  return (
    <>
      <Greeting
        actions={
          <>
            {can('attendance.mark') ? <ButtonLink href="/attendance" icon={<Icon.calendar />}>Davomat</ButtonLink> : null}
            {can('student.create') ? <ButtonLink href="/students?new=1" icon={<Icon.plus />}>Yangi o&apos;quvchi</ButtonLink> : null}
            {can('payment.create') ? <ButtonLink href="/payments?new=1" variant="primary" icon={<Icon.cash />}>To&apos;lov qabul qilish</ButtonLink> : null}
          </>
        }
      />
      {can('finance.report') ? (
        <DataView state={fin} skeleton={<KpiSkeleton />}>
          {(f) => (
            <section className="kpis" aria-label="Bugungi kassa">
              <Kpi title="Bugungi tushum" icon="cash" tone="emerald" md value={<>{compact(f.income.total)}<small>so&apos;m</small></>} note={money(f.income.total)} />
              <Kpi title="Naqd" icon="wallet" tone="violet" md value={compact(method('CASH'))} />
              <Kpi title="Karta va o'tkazma" icon="receipt" tone="cyan" md value={compact(method('CARD') + method('TRANSFER'))} />
              <Kpi title="Bugungi xarajat" icon="alert" tone="amber" md value={compact(f.expenses.total)} />
            </section>
          )}
        </DataView>
      ) : null}
      {can('debtors.view') ? (
        <Card title="Eng katta qarzdorlar" aside={<Link className="link" href="/debtors">Hammasi</Link>} flush>
          <DataView state={debtors} skeleton={<Skeleton rows={4} />} empty={(d) => (d.items.length ? null : <Empty title="Qarzdor yo'q" text="Muddati o'tgan to'lanmagan hisob yo'q." />)}>
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
                        <td className="num">{r.daysOverdue !== undefined ? `${r.daysOverdue} kun` : "yo'q"}</td>
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
        </Card>
      ) : null}
    </>
  );
}

function TeacherView() {
  const groups = useApi<{ items: Group[] }>('/groups', { limit: 200 });
  const tasks = useApi<{ items: Assignment[] }>('/assignments', { limit: 20 });
  const wd = todaysWeekday();
  const list = groups.data?.items ?? [];
  const today = list.flatMap((g) => g.schedule.filter((s) => s.weekday === wd).map((s) => ({ g, s }))).sort((a, b) => a.s.startTime.localeCompare(b.s.startTime));
  const pending = (tasks.data?.items ?? []).filter((a) => (a.counts?.submitted ?? 0) > (a.counts?.graded ?? 0));
  const toGrade = pending.reduce((s, a) => s + (a.counts?.submitted ?? 0) - (a.counts?.graded ?? 0), 0);
  return (
    <>
      <Greeting
        actions={
          <>
            <ButtonLink href="/assignments" icon={<Icon.task />}>
              Vazifalar
            </ButtonLink>
            <ButtonLink href="/attendance" variant="primary" icon={<Icon.check />}>
              Davomat belgilash
            </ButtonLink>
          </>
        }
      />
      {groups.data && tasks.data ? (
        <section className="kpis" aria-label="Ko'rsatkichlar">
          <Kpi title="Guruhlarim" icon="groups" tone="violet" value={money(list.length)} />
          <Kpi title="O'quvchilar" icon="students" tone="cyan" value={money(list.reduce((s, g) => s + g.studentCount, 0))} />
          <Kpi title="Bugungi darslar" icon="calendar" tone="emerald" value={money(today.length)} note={today[0] ? `birinchisi ${today[0].s.startTime}` : undefined} />
          <Kpi title="Tekshirish kutilmoqda" icon="task" tone="amber" value={money(toGrade)} note={pending.length ? `${pending.length} ta vazifada` : undefined} />
        </section>
      ) : (
        <KpiSkeleton />
      )}
      <div className="dash">
        <Card className="c-5" title="Bugungi darslar">
          <DataView state={groups} skeleton={<Skeleton rows={3} cols={2} />}>
            {() =>
              today.length ? (
                <ul className="items">
                  {today.map(({ g, s }) => (
                    <li key={g.id + s.startTime} className="item">
                      <span className="item-text">
                        <Link className="item-title" href={`/groups/${g.id}`}>
                          {g.name}
                        </Link>
                        <span className="item-sub">
                          <span className="fig">{s.startTime}–{s.endTime}</span> · {s.room ?? g.branchName} · {g.studentCount} o&apos;quvchi
                        </span>
                      </span>
                      <ButtonLink href={`/groups/${g.id}?tab=lessons&mark=${todayLocal()}`} size="sm" icon={<Icon.check />}>
                        Davomat
                      </ButtonLink>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty title="Bugun dars yo'q" text="Jadvalingiz bo'yicha bugun darslar belgilanmagan." action={<ButtonLink href="/groups" size="sm">Guruhlarim</ButtonLink>} />
              )
            }
          </DataView>
        </Card>
        <Card className="c-7" title="Tekshirish kutilmoqda" aside={<Link className="link" href="/assignments">Barchasi</Link>}>
          <DataView state={tasks} skeleton={<Skeleton rows={3} cols={2} />}>
            {() =>
              pending.length ? (
                <ul className="items">
                  {pending.map((a) => (
                    <li key={a.id} className="item">
                      <span className="item-text">
                        <Link className="item-title" href={`/assignments/${a.id}`}>
                          {a.title}
                        </Link>
                        <span className="item-sub">{a.groupName}</span>
                      </span>
                      <span className="count-badge">{(a.counts?.submitted ?? 0) - (a.counts?.graded ?? 0)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty title="Hammasi tekshirilgan" text="Yangi topshiriqlar kelganda shu yerda ko'rinadi." />
              )
            }
          </DataView>
        </Card>
      </div>
    </>
  );
}
