'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { ScheduleEditor, scheduleBody, scheduleText, type Slot } from '@/components/schedule-editor';
import { Button, DataView, Dialog, Empty, MoneyInput, PageHead, Pager, SelectInput, Skeleton, Tag, TextInput, whenOpen } from '@/components/ui';
import { api } from '@/lib/api';
import { money, todayLocal } from '@/lib/format';
import { clean, useSubmit } from '@/lib/forms';
import { opts, useBranches, useCourses, useTeachers, useUrlState } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import { GROUP_STATUS, type Group, mainTeacher } from './types';

const LIMIT = 50;

export function GroupsList() {
  const { can, is } = useSession();
  const router = useRouter();
  const staffView = is('OWNER', 'ADMIN', 'CASHIER');
  const [f, setF] = useUrlState({ q: '', branchId: '', courseId: '', teacherId: '', status: '', billingMode: '', noTeacher: '', includeArchived: 'false', offset: '0', new: '' });
  const [q, setQ] = useState(f.q);
  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== f.q) setF({ q });
    }, 300);
    return () => clearTimeout(t);
  }, [q, f.q, setF]);
  const offset = Number(f.offset) || 0;
  const list = useApi<{ items: Group[] }>('/groups', { q: f.q, branchId: f.branchId, courseId: f.courseId, teacherId: f.teacherId, status: f.status, billingMode: f.billingMode, noTeacher: f.noTeacher, includeArchived: f.includeArchived, limit: LIMIT, offset });
  const branches = useBranches(staffView);
  const courses = useCourses(staffView);
  const teachers = useTeachers(is('OWNER', 'ADMIN'));
  const showPrice = can('group.billing_settings') || is('OWNER', 'CASHIER');

  return (
    <>
      <PageHead
        title={is('TEACHER') ? 'Guruhlarim' : is('STUDENT') ? 'Guruhlarim' : 'Guruhlar'}
        actions={
          can('group.create') ? (
            <Button variant="primary" icon={<Icon.plus />} onClick={() => setF({ new: '1' })}>
              Yangi guruh
            </Button>
          ) : null
        }
      />
      {staffView ? (
        <div className="toolbar" role="search">
          <TextInput label="Qidirish" fieldClass="field--grow" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Guruh nomi" />
          {(branches.data?.items.length ?? 0) > 1 ? <SelectInput label="Filial" value={f.branchId} onChange={(e) => setF({ branchId: e.target.value })} options={opts(branches.data?.items)} placeholder="Hammasi" /> : null}
          <SelectInput label="Kurs" value={f.courseId} onChange={(e) => setF({ courseId: e.target.value })} options={opts(courses.data?.items)} placeholder="Hammasi" />
          {teachers.data ? <SelectInput label="Ustoz" value={f.teacherId} onChange={(e) => setF({ teacherId: e.target.value, noTeacher: '' })} options={opts(teachers.data.items)} placeholder="Hammasi" /> : null}
          <SelectInput label="Holat" value={f.status} onChange={(e) => setF({ status: e.target.value })} options={Object.entries(GROUP_STATUS).map(([value, v]) => ({ value, label: v.label }))} placeholder="Hammasi" />
          <SelectInput
            label="Ustoz biriktirilgan"
            value={f.noTeacher}
            onChange={(e) => setF({ noTeacher: e.target.value, teacherId: '' })}
            options={[
              { value: 'false', label: 'Ha' },
              { value: 'true', label: "Yo'q" },
            ]}
            placeholder="Hammasi"
          />
          <SelectInput
            label="Arxiv"
            value={f.includeArchived}
            onChange={(e) => setF({ includeArchived: e.target.value })}
            options={[
              { value: 'false', label: "Ko'rsatilmaydi" },
              { value: 'true', label: "Ko'rsatiladi" },
            ]}
          />
        </div>
      ) : null}

      <div className="table-wrap">
        <DataView
          state={list}
          skeleton={<Skeleton rows={6} cols={6} />}
          empty={(d) =>
            d.items.length ? null : (
              <Empty
                title={f.q || f.courseId || f.status || f.teacherId ? "Mos guruh yo'q" : "Hali guruh yo'q"}
                text={can('group.create') ? 'Guruh kurs va filialga bog\'lanadi; jadval va ustozni keyin ham qo\'shish mumkin.' : undefined}
                action={can('group.create') ? <Button size="sm" variant="primary" onClick={() => setF({ new: '1' })}>Yangi guruh</Button> : undefined}
              />
            )
          }
        >
          {(d) => (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Guruh</th>
                    <th>Ustoz</th>
                    <th>Jadval</th>
                    <th className="num">O&apos;quvchi</th>
                    {showPrice ? <th className="num">Oylik, so&apos;m</th> : null}
                    <th>Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((g) => (
                    <tr key={g.id} data-clickable onClick={() => router.push(`/groups/${g.id}`)}>
                      <td>
                        <Link className="cell-main" href={`/groups/${g.id}`} onClick={(e) => e.stopPropagation()}>
                          {g.name}
                        </Link>
                        <div className="cell-sub">
                          {g.courseName}, {g.branchName}
                        </div>
                      </td>
                      <td>{mainTeacher(g) ?? <span className="muted">biriktirilmagan</span>}</td>
                      <td className="fig small">{scheduleText(g.schedule)}</td>
                      <td className="num">{g.studentCount}</td>
                      {showPrice ? <td className="num">{g.priceMonthly !== undefined ? money(g.priceMonthly) : "yo'q"}</td> : null}
                      <td>{g.archivedAt ? <Tag kind="mute">Arxivda</Tag> : <Tag kind={GROUP_STATUS[g.status].kind}>{GROUP_STATUS[g.status].label}</Tag>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pager offset={offset} limit={LIMIT} count={d.items.length} onChange={(o) => setF({ offset: String(o) })} />
            </>
          )}
        </DataView>
      </div>
      <CreateGroup
        open={f.new === '1'}
        onClose={() => setF({ new: '' })}
        onCreated={(id) => {
          setF({ new: '' });
          router.push(`/groups/${id}`);
        }}
      />
    </>
  );
}

const CreateGroup = whenOpen(function CreateGroupInner({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const { can, is } = useSession();
  const billing = can('group.billing_settings');
  const branches = useBranches();
  const courses = useCourses();
  const teachers = useTeachers(is('OWNER', 'ADMIN'));
  const [v, setV] = useState({ name: '', branchId: '', courseId: '', status: 'ACTIVE', startDate: todayLocal(), billingMode: '', billingDay: '', graceDays: '', teacherId: '' });
  const [price, setPrice] = useState<number | ''>('');
  const [schedule, setSchedule] = useState<Slot[]>([]);
  const s = useSubmit();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  const branchId = v.branchId || (branches.data?.items.length === 1 ? branches.data.items[0]!.id : '');
  const course = courses.data?.items.find((c) => c.id === v.courseId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (schedule.some((x) => x.endTime <= x.startTime)) return s.setError("Jadvalda tugash vaqti boshlanishdan keyin bo'lishi kerak");
    const body: Record<string, unknown> = clean({ name: v.name, branchId, courseId: v.courseId, status: v.status, startDate: v.startDate });
    if (billing) {
      if (price !== '') body.priceMonthly = price;
      if (v.billingMode) body.billingMode = v.billingMode;
      if (v.billingMode === 'GROUP_CYCLE' && v.billingDay) body.billingDay = Number(v.billingDay);
      if (v.graceDays) body.graceDays = Number(v.graceDays);
    }
    if (schedule.length) body.schedule = scheduleBody(schedule);
    const r = await s.run(() => api.post<{ id: string }>('/groups', body));
    if (!r) return;
    if (v.teacherId) await api.post(`/groups/${r.id}/teachers`, { teacherId: v.teacherId, kind: 'MAIN' }).catch(() => {});
    onCreated(r.id);
  };

  return (
    <Dialog open={open} onClose={onClose} title="Yangi guruh" wide footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" type="submit" form="new-group" busy={s.busy}>Yaratish</Button></>}>
      <form id="new-group" className="form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <TextInput label="Guruh nomi" fieldClass="span-2" value={v.name} onChange={set('name')} error={s.fields.name} autoFocus placeholder="Masalan: IELTS 6.5 kechki" />
          <SelectInput label="Kurs" value={v.courseId} onChange={set('courseId')} options={opts(courses.data?.items)} placeholder="Tanlang" error={s.fields.courseId} />
          <SelectInput label="Filial" value={branchId} onChange={set('branchId')} options={opts(branches.data?.items)} placeholder="Tanlang" error={s.fields.branchId} />
          <SelectInput
            label="Holat"
            value={v.status}
            onChange={set('status')}
            options={[
              { value: 'ACTIVE', label: 'Faol (darslar boshlangan)' },
              { value: 'PLANNED', label: "Rejada (yig'ilmoqda)" },
            ]}
          />
          <TextInput label="Boshlanish sanasi" type="date" value={v.startDate} onChange={set('startDate')} error={s.fields.startDate} />
          {teachers.data ? <SelectInput label="Asosiy ustoz" optional value={v.teacherId} onChange={set('teacherId')} options={opts(teachers.data.items.filter((t) => !branchId || t.branchIds.includes(branchId)))} placeholder="Keyinroq" /> : null}
        </div>
        {billing ? (
          <fieldset className="fieldset">
            <legend>To&apos;lov sozlamalari</legend>
            <div className="form-grid">
              <MoneyInput label="Oylik narx" value={price} onChange={setPrice} error={s.fields.priceMonthly} hint={course ? `Bo'sh qolsa kurs narxi: ${money(course.defaultPrice)} so'm` : "so'm"} />
              <SelectInput
                label="Hisob sikli"
                optional
                value={v.billingMode}
                onChange={set('billingMode')}
                options={[
                  { value: 'GROUP_CYCLE', label: "Guruh sikli: hamma bir kunda to'laydi" },
                  { value: 'STUDENT_CYCLE', label: "O'quvchi sikli: qo'shilgan kunidan" },
                ]}
                placeholder="Markaz sukuti"
              />
              {v.billingMode === 'GROUP_CYCLE' ? <TextInput label="To'lov kuni (1-28)" type="number" min={1} max={28} value={v.billingDay} onChange={set('billingDay')} error={s.fields.billingDay} /> : null}
              <TextInput label="Imtiyozli kunlar" optional type="number" min={0} max={60} value={v.graceDays} onChange={set('graceDays')} hint="Muddatdan keyin qarz hisoblanishidan oldingi kunlar" />
            </div>
          </fieldset>
        ) : null}
        <fieldset className="fieldset">
          <legend>Haftalik jadval</legend>
          <ScheduleEditor value={schedule} onChange={setSchedule} />
        </fieldset>
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});
