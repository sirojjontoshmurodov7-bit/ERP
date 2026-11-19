'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AttendanceSheet } from '@/components/attendance-sheet';
import { Icon } from '@/components/icons';
import { ScheduleEditor, scheduleBody, type Slot } from '@/components/schedule-editor';
import { type PickedStudent, StudentPicker } from '@/components/student-picker';
import { Button, ButtonLink, Confirm, DataView, Dialog, Empty, ErrorState, MoneyInput, PageHead, SelectInput, Skeleton, Stat, Tag, TextInput, useToast, whenOpen } from '@/components/ui';
import { api, errorText } from '@/lib/api';
import { date, dateLong, money, todayLocal, WEEKDAYS } from '@/lib/format';
import { clean, useSubmit } from '@/lib/forms';
import { opts, useCourses, useTeachers, useUrlState } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import { ENROLL_STATUS, type Enrollment } from '../../students/types';
import { BILLING_MODE, GROUP_STATUS, type Group, type Lesson, mainTeacher } from '../types';

export function GroupCard() {
  const { id } = useParams<{ id: string }>();
  const { can, is } = useSession();
  const g = useApi<Group>(`/groups/${id}`);
  const [tab, setTab] = useUrlState({ tab: is('STUDENT') ? 'lessons' : 'students', mark: '' });
  const [edit, setEdit] = useState(false);
  const [archive, setArchive] = useState(false);

  if (g.error) return <ErrorState error={g.error} onRetry={g.reload} />;
  if (!g.data) return <Skeleton />;
  const grp = g.data;
  const tabs = [
    ...(is('STUDENT') ? [] : [{ key: 'students', label: `O'quvchilar (${grp.studentCount})` }]),
    ...(can('attendance.view') ? [{ key: 'lessons', label: 'Darslar va davomat' }] : []),
    { key: 'schedule', label: 'Jadval va ustozlar' },
  ];

  return (
    <>
      <PageHead
        crumbs={[{ href: '/groups', label: 'Guruhlar' }]}
        title={grp.name}
        sub={
          <span className="row">
            <span>
              {grp.courseName}, {grp.branchName}
            </span>
            {grp.archivedAt ? <Tag kind="mute">Arxivda</Tag> : <Tag kind={GROUP_STATUS[grp.status].kind}>{GROUP_STATUS[grp.status].label}</Tag>}
          </span>
        }
        actions={
          <>
            {can('homework.view') ? <ButtonLink href={`/assignments?groupId=${grp.id}`} icon={<Icon.task />}>Vazifalar</ButtonLink> : null}
            {can('group.edit') && !grp.archivedAt ? <Button onClick={() => setEdit(true)}>Tahrirlash</Button> : null}
            {can('group.edit') ? (
              <Button variant="ghost" onClick={() => setArchive(true)}>
                {grp.archivedAt ? 'Arxivdan qaytarish' : 'Arxivlash'}
              </Button>
            ) : null}
          </>
        }
      />
      <div className="stats">
        <Stat label="Asosiy ustoz" value={<span className="stat-text">{mainTeacher(grp) ?? "yo'q"}</span>} />
        <Stat label="O'quvchilar" value={grp.studentCount} />
        {grp.priceMonthly !== undefined ? <Stat label="Oylik narx" value={money(grp.priceMonthly)} note={grp.billingMode ? `${BILLING_MODE[grp.billingMode]}${grp.billingDay ? `, ${grp.billingDay}-sana` : ''}` : undefined} /> : null}
        <Stat label="Muddat" value={<span className="stat-text">{grp.startDate ? date(grp.startDate) : "yo'q"}</span>} note={grp.endDate ? `${date(grp.endDate)} gacha` : 'tugash sanasi yo\'q'} />
      </div>
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.key} type="button" role="tab" className="tab" aria-selected={tab.tab === t.key} onClick={() => setTab({ tab: t.key })}>
            {t.label}
          </button>
        ))}
      </div>
      {tab.tab === 'students' ? <StudentsTab group={grp} onChange={g.reload} /> : null}
      {tab.tab === 'lessons' ? <LessonsTab group={grp} markDate={tab.mark} /> : null}
      {tab.tab === 'schedule' ? <ScheduleTab group={grp} onChange={g.reload} /> : null}

      <EditGroup open={edit} group={grp} onClose={() => setEdit(false)} onSaved={g.reload} />
      <Confirm
        open={archive}
        onClose={() => setArchive(false)}
        title={grp.archivedAt ? 'Guruhni arxivdan qaytarish' : 'Guruhni arxivlash'}
        text={grp.archivedAt ? 'Guruh yana ro\'yxatlarda ko\'rinadi.' : "Arxivlangan guruh ro'yxatlarda ko'rinmaydi va unga yangi o'quvchi yozilmaydi. Tarix saqlanadi."}
        confirmLabel={grp.archivedAt ? 'Qaytarish' : 'Arxivlash'}
        danger={!grp.archivedAt}
        onConfirm={async () => {
          await api.post(`/groups/${grp.id}/${grp.archivedAt ? 'unarchive' : 'archive'}`);
          g.reload();
        }}
      />
    </>
  );
}

function StudentsTab({ group, onChange }: { group: Group; onChange: () => void }) {
  const { can } = useSession();
  const [status, setStatus] = useState('ACTIVE');
  const list = useApi<{ items: Enrollment[] }>('/enrollments', { groupId: group.id, status: status || undefined, limit: 200 });
  const [add, setAdd] = useState(false);
  return (
    <section className="stack">
      <div className="toolbar">
        <SelectInput
          label="Holat"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { value: 'ACTIVE', label: 'Faol' },
            { value: 'FROZEN', label: 'Muzlatilgan' },
            { value: 'LEFT', label: 'Chiqqan' },
          ]}
          placeholder="Hammasi"
        />
        <span className="topbar-spacer" />
        {can('enrollment.manage') && !group.archivedAt && group.status !== 'FINISHED' ? (
          <Button icon={<Icon.plus />} onClick={() => setAdd(true)}>
            O&apos;quvchi qo&apos;shish
          </Button>
        ) : null}
      </div>
      <div className="table-wrap">
        <DataView state={list} skeleton={<Skeleton rows={5} cols={3} />} empty={(d) => (d.items.length ? null : <Empty title="O'quvchi yo'q" text={status === 'ACTIVE' ? "Guruhga o'quvchi qo'shing: birinchi oylik hisob avtomatik yaratiladi." : undefined} />)}>
          {(d) => (
            <table className="table">
              <thead>
                <tr>
                  <th>O&apos;quvchi</th>
                  <th>Qo&apos;shilgan</th>
                  <th>Holat</th>
                  <th className="num">Maxsus narx</th>
                </tr>
              </thead>
              <tbody>
                {d.items.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Link className="cell-main" href={`/students/${e.studentId}`}>
                        {e.studentName}
                      </Link>
                    </td>
                    <td className="fig">
                      {date(e.joinedAt)}
                      {e.leftAt ? <div className="cell-sub">chiqdi {date(e.leftAt)}</div> : null}
                    </td>
                    <td>
                      <Tag kind={ENROLL_STATUS[e.status].kind}>{ENROLL_STATUS[e.status].label}</Tag>
                    </td>
                    <td className="num">{e.priceOverride !== null ? money(e.priceOverride) : "yo'q"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DataView>
      </div>
      <AddStudent
        open={add}
        group={group}
        onClose={() => setAdd(false)}
        onDone={() => {
          setAdd(false);
          list.reload();
          onChange();
        }}
      />
    </section>
  );
}

const AddStudent = whenOpen(function AddStudentInner({ open, group, onClose, onDone }: { open: boolean; group: Group; onClose: () => void; onDone: () => void }) {
  const { can } = useSession();
  const [student, setStudent] = useState<PickedStudent | null>(null);
  const [joinedAt, setJoinedAt] = useState(todayLocal());
  const [price, setPrice] = useState<number | ''>('');
  const s = useSubmit();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return s.setError("O'quvchini tanlang");
    const r = await s.run(() => api.post('/enrollments', { groupId: group.id, studentId: student.id, joinedAt, ...(price !== '' ? { priceOverride: price } : {}) }));
    if (r) onDone();
  };
  return (
    <Dialog open={open} onClose={onClose} title={`${group.name}: o'quvchi qo'shish`} footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" type="submit" form="add-student" busy={s.busy}>Qo&apos;shish</Button></>}>
      <form id="add-student" className="form" onSubmit={submit} noValidate>
        <StudentPicker value={student} onChange={setStudent} />
        {student && !student.branchIds.includes(group.branchId) ? <p className="form-error">Bu o&apos;quvchi {group.branchName} filialiga biriktirilmagan.</p> : null}
        <TextInput label="Qo'shilgan sana" type="date" value={joinedAt} max={todayLocal()} onChange={(e) => setJoinedAt(e.target.value)} error={s.fields.joinedAt} hint="Birinchi hisob shu sanadan boshlanadi" />
        {can('group.billing_settings') ? <MoneyInput label="Maxsus oylik narx" optional value={price} onChange={setPrice} hint="Bo'sh: guruh narxi" /> : null}
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});

function LessonsTab({ group, markDate }: { group: Group; markDate: string }) {
  const { can } = useSession();
  const toast = useToast();
  const list = useApi<{ items: Lesson[] }>(`/groups/${group.id}/lessons`, { limit: 60 });
  const [selected, setSelected] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [newDate, setNewDate] = useState(markDate || todayLocal());
  const wantedId = selected ?? list.data?.items.find((l) => l.lessonDate === (markDate || '__'))?.id ?? list.data?.items[0]?.id ?? null;
  const lesson = useApi<Lesson>(wantedId ? `/lessons/${wantedId}` : null);

  const open = async () => {
    setOpening(true);
    try {
      const l = await api.post<Lesson>(`/groups/${group.id}/lessons`, { lessonDate: newDate });
      list.reload();
      setSelected(l.id);
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setOpening(false);
    }
  };
  const lockToggle = async (l: Lesson) => {
    try {
      await api.post(`/lessons/${l.id}/${l.lockedAt ? 'unlock' : 'lock'}`);
      lesson.reload();
      list.reload();
    } catch (e) {
      toast(errorText(e), 'error');
    }
  };
  const cancel = async (l: Lesson) => {
    try {
      await api.patch(`/lessons/${l.id}`, { status: l.status === 'HELD' ? 'CANCELLED' : 'HELD' });
      lesson.reload();
      list.reload();
    } catch (e) {
      toast(errorText(e), 'error');
    }
  };

  return (
    <div className="split">
      <section className="panel" aria-labelledby="sheet-h">
        <div className="panel-head">
          <h2 id="sheet-h">Davomat</h2>
          {lesson.data && can('attendance.mark') ? (
            <span className="row">
              {lesson.data.lockedAt ? (
                can('attendance.edit_past') ? (
                  <Button size="sm" variant="ghost" onClick={() => lockToggle(lesson.data!)}>
                    Qulfni ochish
                  </Button>
                ) : null
              ) : !lesson.data.locked ? (
                <Button size="sm" variant="ghost" onClick={() => lockToggle(lesson.data!)} icon={<Icon.lock />}>
                  Qulflash
                </Button>
              ) : null}
              {!lesson.data.locked || can('attendance.edit_past') ? (
                <Button size="sm" variant="ghost" onClick={() => cancel(lesson.data!)}>
                  {lesson.data.status === 'HELD' ? 'Dars bo\'lmadi' : 'Dars bo\'ldi'}
                </Button>
              ) : null}
            </span>
          ) : null}
        </div>
        <div className="panel-body">
          {!wantedId ? (
            <Empty title="Hali dars ochilmagan" text="Dars sanasini tanlab, davomat varag'ini oching." />
          ) : (
            <DataView state={lesson} skeleton={<Skeleton rows={6} cols={2} />}>
              {(l) => (l.status === 'CANCELLED' ? <Empty title="Dars bekor qilingan" text={`${dateLong(l.lessonDate)}: davomat belgilanmaydi.`} /> : <AttendanceSheet key={`${l.id}:${JSON.stringify(l.summary)}`} lesson={l} onSaved={() => { lesson.reload(); list.reload(); }} />)}
            </DataView>
          )}
        </div>
      </section>
      <aside className="stack">
        {can('attendance.mark') && !group.archivedAt ? (
          <div className="panel panel-body stack-sm">
            <h2>Dars ochish</h2>
            <div className="row">
              <input className="input num input--auto" type="date" aria-label="Dars sanasi" value={newDate} max={todayLocal()} onChange={(e) => setNewDate(e.target.value)} />
              <Button variant="primary" busy={opening} onClick={open}>
                Ochish
              </Button>
            </div>
            <p className="small muted">
              Bugun: {WEEKDAYS[(new Date(`${todayLocal()}T00:00:00Z`).getUTCDay() + 6) % 7]}. Jadval: {group.schedule.map((s) => WEEKDAYS[s.weekday - 1]?.slice(0, 2)).join(', ') || "yo'q"}
            </p>
          </div>
        ) : null}
        <div className="panel">
          <div className="panel-head">
            <h2>Darslar</h2>
          </div>
          <div className="panel-body--flush">
            <DataView state={list} skeleton={<Skeleton rows={4} cols={2} />} empty={(d) => (d.items.length ? null : <p className="panel-body muted">Darslar yo&apos;q.</p>)}>
              {(d) => (
                <ul className="list-plain lesson-list">
                  {d.items.map((l) => (
                    <li key={l.id}>
                      <button type="button" className="lesson-item" aria-current={l.id === wantedId ? 'true' : undefined} onClick={() => setSelected(l.id)}>
                        <span className="fig">{date(l.lessonDate)}</span>
                        <span className="small muted">{l.status === 'CANCELLED' ? 'bekor qilingan' : `${l.summary.present + l.summary.late} keldi, ${l.summary.absent} kelmadi`}</span>
                        {l.locked ? <Icon.lock width={14} height={14} aria-label="Qulflangan" /> : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </DataView>
          </div>
        </div>
      </aside>
    </div>
  );
}

function ScheduleTab({ group, onChange }: { group: Group; onChange: () => void }) {
  const { can, is } = useSession();
  const toast = useToast();
  const [slots, setSlots] = useState<Slot[]>(group.schedule.map((s) => ({ weekday: s.weekday, startTime: s.startTime, endTime: s.endTime, room: s.room ?? '' })));
  const [busy, setBusy] = useState(false);
  const [assign, setAssign] = useState(false);
  const [end, setEnd] = useState<string | null>(null);
  const editable = can('group.edit') && !group.archivedAt;
  const saveSchedule = async () => {
    if (slots.some((x) => x.endTime <= x.startTime)) return toast("Tugash vaqti boshlanishdan keyin bo'lishi kerak", 'error');
    setBusy(true);
    try {
      await api.put(`/groups/${group.id}/schedule`, { schedule: scheduleBody(slots) });
      toast('Jadval saqlandi');
      onChange();
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setBusy(false);
    }
  };
  const current = group.teachers.filter((t) => !t.toDate);
  const past = group.teachers.filter((t) => t.toDate);
  return (
    <div className="grid-2">
      <section className="panel panel-body stack">
        <h2>Haftalik jadval</h2>
        <ScheduleEditor value={slots} onChange={setSlots} disabled={!editable} />
        {editable ? (
          <div>
            <Button variant="primary" busy={busy} onClick={saveSchedule}>
              Jadvalni saqlash
            </Button>
          </div>
        ) : null}
      </section>
      <section className="panel">
        <div className="panel-head">
          <h2>Ustozlar</h2>
          {is('OWNER', 'ADMIN') && editable ? (
            <Button size="sm" icon={<Icon.plus />} onClick={() => setAssign(true)}>
              Biriktirish
            </Button>
          ) : null}
        </div>
        <div className="panel-body--flush">
          {current.length || past.length ? (
            <ul className="list-plain">
              {[...current, ...past].map((t) => (
                <li key={t.teacherId + t.fromDate} className="row" data-between>
                  <span>
                    <span className="cell-main">{t.fullName}</span>
                    <span className="cell-sub">
                      {' '}
                      {t.kind === 'MAIN' ? 'asosiy' : 'yordamchi'}, {date(t.fromDate)} dan{t.toDate ? ` ${date(t.toDate)} gacha` : ''}
                    </span>
                  </span>
                  {!t.toDate && is('OWNER', 'ADMIN') && editable ? (
                    <Button size="sm" variant="ghost" onClick={() => setEnd(t.teacherId)}>
                      Ajratish
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="panel-body muted">Ustoz biriktirilmagan.</p>
          )}
        </div>
      </section>
      <AssignTeacher open={assign} group={group} onClose={() => setAssign(false)} onDone={() => { setAssign(false); onChange(); }} />
      <Confirm
        open={end !== null}
        onClose={() => setEnd(null)}
        title="Ustozni guruhdan ajratish"
        text="Bugungi sana bilan ajratiladi. Ustozning shu guruhdagi tarixi va maosh hisobi saqlanadi."
        confirmLabel="Ajratish"
        onConfirm={async () => {
          await api.post(`/groups/${group.id}/teachers/${end}/end`, {});
          onChange();
        }}
      />
    </div>
  );
}

const AssignTeacher = whenOpen(function AssignTeacherInner({ open, group, onClose, onDone }: { open: boolean; group: Group; onClose: () => void; onDone: () => void }) {
  const teachers = useTeachers();
  const [teacherId, setTeacher] = useState('');
  const [kind, setKind] = useState('MAIN');
  const [fromDate, setFrom] = useState(todayLocal());
  const s = useSubmit();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId) return s.setError('Ustozni tanlang');
    const r = await s.run(() => api.post(`/groups/${group.id}/teachers`, { teacherId, kind, fromDate }));
    if (r !== undefined) onDone();
  };
  return (
    <Dialog open={open} onClose={onClose} title="Ustoz biriktirish" footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" type="submit" form="assign-t" busy={s.busy}>Biriktirish</Button></>}>
      <form id="assign-t" className="form" onSubmit={submit} noValidate>
        <SelectInput label="Ustoz" value={teacherId} onChange={(e) => setTeacher(e.target.value)} options={opts((teachers.data?.items ?? []).filter((t) => t.status === 'ACTIVE' && t.branchIds.includes(group.branchId)))} placeholder="Tanlang" hint={`${group.branchName} filiali ustozlari`} />
        <SelectInput
          label="Turi"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          options={[
            { value: 'MAIN', label: 'Asosiy (guruhda bittadan; avvalgisi ajratiladi)' },
            { value: 'ASSISTANT', label: 'Yordamchi' },
          ]}
        />
        <TextInput label="Qaysi sanadan" type="date" value={fromDate} onChange={(e) => setFrom(e.target.value)} />
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});

const EditGroup = whenOpen(function EditGroupInner({ open, group, onClose, onSaved }: { open: boolean; group: Group; onClose: () => void; onSaved: () => void }) {
  const { can } = useSession();
  const billing = can('group.billing_settings');
  const courses = useCourses();
  const [v, setV] = useState({
    name: group.name,
    courseId: group.courseId,
    status: group.status,
    startDate: group.startDate ?? '',
    endDate: group.endDate ?? '',
    billingMode: group.billingMode ?? '',
    billingDay: group.billingDay ? String(group.billingDay) : '',
    graceDays: group.graceDays !== undefined ? String(group.graceDays) : '',
  });
  const [price, setPrice] = useState<number | ''>(group.priceMonthly ?? '');
  const s = useSubmit();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = {};
    if (v.name.trim() !== group.name) body.name = v.name.trim();
    if (v.courseId !== group.courseId) body.courseId = v.courseId;
    if (v.status !== group.status) body.status = v.status;
    if (v.startDate !== (group.startDate ?? '')) body.startDate = v.startDate || null;
    if (v.endDate !== (group.endDate ?? '')) body.endDate = v.endDate || null;
    if (billing) {
      if (price !== '' && price !== group.priceMonthly) body.priceMonthly = price;
      if (v.billingMode && v.billingMode !== group.billingMode) body.billingMode = v.billingMode;
      if (v.billingMode === 'GROUP_CYCLE' && v.billingDay && Number(v.billingDay) !== group.billingDay) body.billingDay = Number(v.billingDay);
      if (v.graceDays !== '' && Number(v.graceDays) !== group.graceDays) body.graceDays = Number(v.graceDays);
    }
    if (!Object.keys(body).length) return onClose();
    const r = await s.run(() => api.patch(`/groups/${group.id}`, clean(body)));
    if (r) {
      onSaved();
      onClose();
    }
  };
  return (
    <Dialog open={open} onClose={onClose} title="Guruhni tahrirlash" wide footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" type="submit" form="edit-group" busy={s.busy}>Saqlash</Button></>}>
      <form id="edit-group" className="form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <TextInput label="Guruh nomi" fieldClass="span-2" value={v.name} onChange={set('name')} error={s.fields.name} />
          <SelectInput label="Kurs" value={v.courseId} onChange={set('courseId')} options={opts(courses.data?.items)} />
          <SelectInput label="Holat" value={v.status} onChange={set('status')} options={Object.entries(GROUP_STATUS).map(([value, x]) => ({ value, label: x.label }))} hint={v.status === 'FINISHED' && group.status !== 'FINISHED' ? "Tugagan guruhda yangi hisob yaratilmaydi" : undefined} />
          <TextInput label="Boshlanish" optional type="date" value={v.startDate} onChange={set('startDate')} error={s.fields.startDate} />
          <TextInput label="Tugash" optional type="date" value={v.endDate} onChange={set('endDate')} error={s.fields.endDate} />
          {billing ? (
            <>
              <MoneyInput label="Oylik narx" value={price} onChange={setPrice} error={s.fields.priceMonthly} hint="Yangi narx keyingi davrlardan qo'llanadi" />
              <SelectInput
                label="Hisob sikli"
                value={v.billingMode}
                onChange={set('billingMode')}
                options={[
                  { value: 'GROUP_CYCLE', label: 'Guruh sikli' },
                  { value: 'STUDENT_CYCLE', label: "O'quvchi sikli" },
                ]}
              />
              {v.billingMode === 'GROUP_CYCLE' ? <TextInput label="To'lov kuni (1-28)" type="number" min={1} max={28} value={v.billingDay} onChange={set('billingDay')} error={s.fields.billingDay} /> : null}
              <TextInput label="Imtiyozli kunlar" type="number" min={0} max={60} value={v.graceDays} onChange={set('graceDays')} />
            </>
          ) : null}
        </div>
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});
