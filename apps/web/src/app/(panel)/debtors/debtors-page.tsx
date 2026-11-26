'use client';
import { useT } from '@/lib/i18n';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PaymentDialog } from '@/components/payment-dialog';
import type { PickedStudent } from '@/components/student-picker';
import { Button, DataView, Empty, MoneyInput, PageHead, Pager, SelectInput, Skeleton, Stat, TextInput } from '@/components/ui';
import { date, money } from '@/lib/format';
import { opts, useBranches, useGroupsLite, useUrlState } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';

interface Debtor {
  studentId: string;
  studentName: string;
  phone?: string | null;
  debt?: number;
  overdueCharges?: number;
  oldestDueDate?: string;
  daysOverdue?: number;
  hasDebt?: boolean;
  groups: { groupId: string; groupName: string; debt?: number }[];
}
const LIMIT = 50;

export function DebtorsPage() {
  const t = useT();
  const { can, is } = useSession();
  const teacher = is('TEACHER');
  const [f, setF] = useUrlState({ q: '', branchId: '', groupId: '', minDebt: '', offset: '0' });
  const [q, setQ] = useState(f.q);
  const [minDebt, setMinDebt] = useState<number | ''>(f.minDebt ? Number(f.minDebt) : '');
  useEffect(() => {
    const t = setTimeout(() => {
      const md = minDebt === '' ? '' : String(minDebt);
      if (q !== f.q || md !== f.minDebt) setF({ q, minDebt: md });
    }, 400);
    return () => clearTimeout(t);
  }, [q, minDebt, f.q, f.minDebt, setF]);
  const offset = Number(f.offset) || 0;
  const list = useApi<{ items: Debtor[]; total: number; totalDebt?: number }>('/debtors', { q: f.q, branchId: f.branchId, groupId: f.groupId, minDebt: f.minDebt, limit: LIMIT, offset });
  const branches = useBranches(!teacher);
  const groups = useGroupsLite();
  const [pay, setPay] = useState<PickedStudent | null>(null);

  return (
    <>
      <PageHead title="Qarzdorlar" sub="Muddati va imtiyozli kunlari o'tgan to'lanmagan hisoblar." />
      <div className="toolbar">
        <TextInput label="Qidirish" fieldClass="field--grow" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ism, login yoki telefon" />
        {!teacher && (branches.data?.items.length ?? 0) > 1 ? <SelectInput label="Filial" value={f.branchId} onChange={(e) => setF({ branchId: e.target.value })} options={opts(branches.data?.items)} placeholder="Hammasi" /> : null}
        <SelectInput label="Guruh" value={f.groupId} onChange={(e) => setF({ groupId: e.target.value })} options={opts(groups.data?.items)} placeholder="Hammasi" />
        {!teacher ? <MoneyInput label="Qarz kamida" value={minDebt} onChange={setMinDebt} hint="" /> : null}
      </div>
      {list.data && !teacher ? (
        <div className="stats">
          <Stat label="Qarzdorlar" value={money(list.data.total)} />
          <Stat label="Jami qarz" value={money(list.data.totalDebt ?? 0)} note="so'm" tone={(list.data.totalDebt ?? 0) > 0 ? 'debt' : undefined} />
        </div>
      ) : null}
      <div className="table-wrap">
        <DataView state={list} skeleton={<Skeleton rows={6} cols={5} />} empty={(d) => (d.items.length ? null : <Empty title="Qarzdor yo'q" text="Hamma o'z vaqtida to'lagan yoki filtrga mos qarzdor topilmadi." />)}>
          {(d) => (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("O'quvchi")}</th>
                    <th>{t("Guruhlar")}</th>
                    {!teacher ? <th>{t("Eng eski muddat")}</th> : null}
                    {!teacher ? <th className="num">{t("Kechikish")}</th> : null}
                    {!teacher ? <th className="num">{t("Qarz, so'm")}</th> : null}
                    {can('payment.create') ? <th className="actions-cell" aria-label={t("Amallar")} /> : null}
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((r) => (
                    <tr key={r.studentId}>
                      <td>
                        {teacher ? <span className="cell-main">{r.studentName}</span> : <Link className="cell-main" href={`/students/${r.studentId}?tab=charges`}>{r.studentName}</Link>}
                        {r.phone ? <div className="cell-sub fig">{r.phone}</div> : null}
                      </td>
                      <td className="muted">
                        {r.groups.map((g) => (
                          <div key={g.groupId}>
                            {g.groupName}
                            {g.debt !== undefined ? <span className="fig"> {money(g.debt)}</span> : null}
                          </div>
                        ))}
                      </td>
                      {!teacher ? <td className="fig">{date(r.oldestDueDate)}</td> : null}
                      {!teacher ? <td className="num">{r.daysOverdue} kun</td> : null}
                      {!teacher ? <td className="num debt">{money(r.debt)}</td> : null}
                      {can('payment.create') ? (
                        <td className="actions-cell">
                          <Button size="sm" onClick={() => setPay({ id: r.studentId, fullName: r.studentName, login: '', phone: r.phone ?? null, branchIds: [] })}>
                            {t("To'lov")}
                          </Button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pager offset={offset} limit={LIMIT} count={d.items.length} total={d.total} onChange={(o) => setF({ offset: String(o) })} />
            </>
          )}
        </DataView>
      </div>
      <PaymentDialog open={pay !== null} student={pay} onClose={() => setPay(null)} onDone={list.reload} />
    </>
  );
}
