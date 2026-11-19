'use client';
import Link from 'next/link';
import { DataView, Empty, PageHead, Pager, SelectInput, Skeleton, Stat, Tag, TextInput } from '@/components/ui';
import { addDays, date, todayLocal } from '@/lib/format';
import { opts, useGroupsLite, useUrlState } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import { ATT_LABEL } from '@/lib/labels';

interface Summary {
  totals: { present: number; absent: number; late: number; excused: number; total: number; rate: number | null };
  byGroup: { groupId: string; groupName: string; present: number; absent: number; late: number; excused: number; total: number; rate: number | null }[];
}
interface Row {
  lessonId: string;
  lessonDate: string;
  groupId: string;
  groupName: string;
  studentId: string;
  studentName: string;
  status: keyof typeof ATT_LABEL;
  note: string | null;
}
const LIMIT = 100;

export function AttendancePage() {
  const { is, can } = useSession();
  const [f, setF] = useUrlState({ from: addDays(todayLocal(), -13), to: todayLocal(), groupId: '', status: '', offset: '0' });
  const offset = Number(f.offset) || 0;
  const q = { from: f.from, to: f.to, groupId: f.groupId };
  const summary = useApi<Summary>('/attendance/summary', q);
  const rows = useApi<{ items: Row[] }>('/attendance', { ...q, status: f.status, limit: LIMIT, offset });
  const groups = useGroupsLite(!is('STUDENT'));
  return (
    <>
      <PageHead title={is('STUDENT') ? 'Davomatim' : 'Davomat'} sub={can('attendance.mark') ? "Davomat guruh sahifasidagi \"Darslar va davomat\" tabida belgilanadi." : undefined} />
      <div className="toolbar">
        <TextInput label="Sanadan" type="date" value={f.from} max={f.to} onChange={(e) => setF({ from: e.target.value })} />
        <TextInput label="Sanagacha" type="date" value={f.to} max={todayLocal()} onChange={(e) => setF({ to: e.target.value })} />
        {!is('STUDENT') ? <SelectInput label="Guruh" value={f.groupId} onChange={(e) => setF({ groupId: e.target.value })} options={opts(groups.data?.items)} placeholder="Hammasi" /> : null}
        <SelectInput label="Holat" value={f.status} onChange={(e) => setF({ status: e.target.value })} options={Object.entries(ATT_LABEL).map(([value, x]) => ({ value, label: x.label }))} placeholder="Hammasi" />
      </div>
      <DataView state={summary} skeleton={<Skeleton rows={2} cols={4} />}>
        {(s) => (
          <div className="stats">
            <Stat label="Davomat" value={s.totals.rate === null ? "yo'q" : `${s.totals.rate}%`} note={`${s.totals.total} ta belgi`} />
            <Stat label="Keldi" value={s.totals.present} />
            <Stat label="Kechikdi" value={s.totals.late} />
            <Stat label="Kelmadi" value={s.totals.absent} tone={s.totals.absent ? 'debt' : undefined} />
            <Stat label="Sababli" value={s.totals.excused} />
          </div>
        )}
      </DataView>
      {!is('STUDENT') && summary.data && summary.data.byGroup.length > 1 ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Guruh</th>
                <th className="num">Davomat</th>
                <th className="num">Keldi</th>
                <th className="num">Kechikdi</th>
                <th className="num">Kelmadi</th>
              </tr>
            </thead>
            <tbody>
              {summary.data.byGroup.map((g) => (
                <tr key={g.groupId}>
                  <td>
                    <Link className="cell-main" href={`/groups/${g.groupId}?tab=lessons`}>
                      {g.groupName}
                    </Link>
                  </td>
                  <td className="num">{g.rate === null ? "yo'q" : `${g.rate}%`}</td>
                  <td className="num">{g.present}</td>
                  <td className="num">{g.late}</td>
                  <td className="num">{g.absent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <div className="table-wrap">
        <DataView state={rows} skeleton={<Skeleton rows={8} cols={4} />} empty={(d) => (d.items.length ? null : <Empty title="Davomat yozuvi yo'q" text="Tanlangan oraliqda belgilangan dars topilmadi." />)}>
          {(d) => (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Sana</th>
                    {!is('STUDENT') ? <th>O&apos;quvchi</th> : null}
                    <th>Guruh</th>
                    <th>Holat</th>
                    <th>Izoh</th>
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((r) => (
                    <tr key={`${r.lessonId}:${r.studentId}`}>
                      <td className="fig">{date(r.lessonDate)}</td>
                      {!is('STUDENT') ? <td>{is('OWNER', 'ADMIN') ? <Link className="cell-main" href={`/students/${r.studentId}`}>{r.studentName}</Link> : <span className="cell-main">{r.studentName}</span>}</td> : null}
                      <td className="muted">{r.groupName}</td>
                      <td>
                        <Tag kind={ATT_LABEL[r.status].kind}>{ATT_LABEL[r.status].label}</Tag>
                      </td>
                      <td className="muted">{r.note ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pager offset={offset} limit={LIMIT} count={d.items.length} onChange={(o) => setF({ offset: String(o) })} />
            </>
          )}
        </DataView>
      </div>
    </>
  );
}
