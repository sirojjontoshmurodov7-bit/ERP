'use client';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button, DataView, Dialog, Empty, PageHead, Pager, Segmented, SelectInput, Skeleton, Stat, TextInput, whenOpen } from '@/components/ui';
import { api } from '@/lib/api';
import { dateTime, monthLabel, thisMonth } from '@/lib/format';
import { useSubmit } from '@/lib/forms';
import { opts, useBranches, useGroupsLite, useUrlState } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';

interface Ranking {
  scope: string;
  scopeName: string;
  period: 'month' | 'all';
  month?: string;
  total: number;
  my: { rank: number; points: number } | null;
  items: { rank: number; studentId: string; studentName: string; total: number; homework: number; attendance: number; manual: number; branches: string[] }[];
}
interface Events {
  studentName: string;
  items: { id: string; source: 'HOMEWORK' | 'MANUAL'; points: number; reason: string | null; groupName?: string; at: string }[];
}
const LIMIT = 50;

export function RatingsPage() {
  const { can, is, me } = useSession();
  const groups = useGroupsLite();
  const branches = useBranches(!is('STUDENT', 'TEACHER'));
  const [f, setF] = useUrlState({ scope: is('TEACHER') ? 'group' : 'center', groupId: '', branchId: '', period: 'month', month: thisMonth(), offset: '0' });
  const groupId = f.groupId || groups.data?.items[0]?.id || '';
  const branchId = f.branchId || branches.data?.items[0]?.id || '';
  const ready = f.scope === 'center' || (f.scope === 'group' ? Boolean(groupId) : Boolean(branchId));
  const offset = Number(f.offset) || 0;
  const r = useApi<Ranking>(ready ? '/ratings' : null, { scope: f.scope, groupId: f.scope === 'group' ? groupId : undefined, branchId: f.scope === 'branch' ? branchId : undefined, period: f.period, month: f.period === 'month' ? f.month : undefined, limit: LIMIT, offset });
  const [events, setEvents] = useState<{ id: string; name: string } | null>(null);
  const [adjust, setAdjust] = useState(false);

  return (
    <>
      <PageHead title="Reyting" sub="Ballar: vazifa baholari, davomat va ustozning qo'shimcha ballari." actions={can('rating.adjust') ? <Button icon={<Icon.plus />} onClick={() => setAdjust(true)}>Ball berish</Button> : null} />
      <div className="toolbar">
        <div className="field">
          <span className="field-label">Kesim</span>
          <Segmented
            label="Kesim"
            value={f.scope}
            onChange={(v) => setF({ scope: v })}
            options={[
              { value: 'group', label: 'Guruh' },
              ...(is('TEACHER', 'STUDENT') ? [] : [{ value: 'branch', label: 'Filial' }]),
              { value: 'center', label: 'Markaz' },
            ]}
          />
        </div>
        {f.scope === 'group' ? <SelectInput label="Guruh" value={groupId} onChange={(e) => setF({ groupId: e.target.value })} options={opts(groups.data?.items)} /> : null}
        {f.scope === 'branch' ? <SelectInput label="Filial" value={branchId} onChange={(e) => setF({ branchId: e.target.value })} options={opts(branches.data?.items)} /> : null}
        <div className="field">
          <span className="field-label">Davr</span>
          <Segmented label="Davr" value={f.period} onChange={(v) => setF({ period: v })} options={[{ value: 'month', label: 'Oy' }, { value: 'all', label: 'Umumiy' }]} />
        </div>
        {f.period === 'month' ? <TextInput label="Oy" type="month" value={f.month} max={thisMonth()} onChange={(e) => e.target.value && setF({ month: e.target.value })} /> : null}
      </div>
      {r.data?.my ? (
        <div className="stats">
          <Stat label="Mening o'rnim" value={`${r.data.my.rank} / ${r.data.total}`} />
          <Stat label="Ballarim" value={r.data.my.points} note={r.data.period === 'month' && r.data.month ? monthLabel(r.data.month) : 'umumiy'} />
        </div>
      ) : null}
      <div className="table-wrap">
        {!ready ? (
          <Empty title="Guruh yoki filial tanlang" />
        ) : (
          <DataView state={r} skeleton={<Skeleton rows={8} cols={5} />} empty={(d) => (d.items.length ? null : <Empty title="Ball yo'q" text="Davomat belgilangach va vazifalar baholangach reyting shakllanadi." />)}>
            {(d) => (
              <>
                <table className="table">
                  <thead>
                    <tr>
                      <th className="num">O&apos;rin</th>
                      <th>O&apos;quvchi</th>
                      <th className="num">Vazifa</th>
                      <th className="num">Davomat</th>
                      <th className="num">Qo&apos;shimcha</th>
                      <th className="num">Jami</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.items.map((x) => (
                      <tr key={x.studentId} className={x.studentId === me.id ? 'row-me' : undefined} data-clickable={is('STUDENT') ? undefined : true} onClick={is('STUDENT') ? undefined : () => setEvents({ id: x.studentId, name: x.studentName })}>
                        <td className="num">{x.rank}</td>
                        <td>
                          <span className="cell-main">{x.studentName}</span>
                          {f.scope === 'center' && x.branches.length ? <div className="cell-sub">{x.branches.join(', ')}</div> : null}
                        </td>
                        <td className="num">{x.homework}</td>
                        <td className="num">{x.attendance}</td>
                        <td className={x.manual < 0 ? 'num debt' : 'num'}>{x.manual}</td>
                        <td className="num cell-main">{x.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pager offset={offset} limit={LIMIT} count={d.items.length} total={d.total} onChange={(o) => setF({ offset: String(o) })} />
              </>
            )}
          </DataView>
        )}
      </div>
      <EventsDialog open={events !== null} student={events} onClose={() => setEvents(null)} />
      <AdjustDialog open={adjust} defaultGroupId={f.scope === 'group' ? groupId : ''} onClose={() => setAdjust(false)} onDone={r.reload} />
    </>
  );
}

const EventsDialog = whenOpen(function EventsInner({ open, student, onClose }: { open: boolean; student: { id: string; name: string } | null; onClose: () => void }) {
  const ev = useApi<Events>(`/ratings/students/${student!.id}/events`, { limit: 50 });
  return (
    <Dialog open={open} onClose={onClose} title={`${student!.name}: ballar tarixi`} footer={<Button onClick={onClose}>Yopish</Button>}>
      <DataView state={ev} skeleton={<Skeleton rows={4} cols={2} />} empty={(d) => (d.items.length ? null : <p className="muted">Vazifa va qo&apos;shimcha ballar yo&apos;q (davomat balli reytingda alohida hisoblanadi).</p>)}>
        {(d) => (
          <ul className="list-plain">
            {d.items.map((e) => (
              <li key={e.id} className="row" data-between>
                <span>
                  {e.source === 'HOMEWORK' ? 'Vazifa' : 'Ustoz'}
                  {e.reason ? `: ${e.reason}` : ''}
                  <div className="cell-sub fig">
                    {dateTime(e.at)}
                    {e.groupName ? `, ${e.groupName}` : ''}
                  </div>
                </span>
                <span className={e.points < 0 ? 'fig debt' : 'fig'}>{e.points > 0 ? `+${e.points}` : e.points}</span>
              </li>
            ))}
          </ul>
        )}
      </DataView>
    </Dialog>
  );
});

const AdjustDialog = whenOpen(function AdjustInner({ open, defaultGroupId, onClose, onDone }: { open: boolean; defaultGroupId: string; onClose: () => void; onDone: () => void }) {
  const groups = useGroupsLite();
  const [groupId, setGroupId] = useState(defaultGroupId);
  const [studentId, setStudentId] = useState('');
  const [sign, setSign] = useState<'plus' | 'minus'>('plus');
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const roster = useApi<{ items: { studentId: string; studentName: string }[] }>(groupId ? '/enrollments' : null, { groupId, status: 'ACTIVE', limit: 200 });
  const s = useSubmit();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(points);
    if (!groupId || !studentId) return s.setError("Guruh va o'quvchini tanlang");
    if (!Number.isInteger(n) || n <= 0 || n > 1000) return s.setError('Ball 1 dan 1000 gacha butun son');
    const r = await s.run(() => api.post('/ratings/adjust', { groupId, studentId, points: sign === 'plus' ? n : -n, reason: reason.trim() }));
    if (r) {
      onDone();
      onClose();
    }
  };
  return (
    <Dialog open={open} onClose={onClose} title="Ball berish" footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" type="submit" form="adjust-form" busy={s.busy}>Saqlash</Button></>}>
      <form id="adjust-form" className="form" onSubmit={submit} noValidate>
        <SelectInput label="Guruh" value={groupId} onChange={(e) => { setGroupId(e.target.value); setStudentId(''); }} options={opts(groups.data?.items)} placeholder="Tanlang" />
        <SelectInput label="O'quvchi" value={studentId} onChange={(e) => setStudentId(e.target.value)} options={(roster.data?.items ?? []).map((x) => ({ value: x.studentId, label: x.studentName }))} placeholder={groupId ? 'Tanlang' : 'Avval guruhni tanlang'} disabled={!groupId} />
        <Segmented label="Turi" value={sign} onChange={setSign} options={[{ value: 'plus', label: 'Mukofot' }, { value: 'minus', label: 'Jarima' }]} />
        <TextInput label="Ball" type="number" min={1} max={1000} value={points} onChange={(e) => setPoints(e.target.value)} error={s.fields.points} />
        <TextInput label="Sabab" value={reason} onChange={(e) => setReason(e.target.value)} error={s.fields.reason} maxLength={200} />
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});
