'use client';
import { useT } from '@/lib/i18n';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { cleanLinks, LinksEditor } from '@/components/links-editor';
import { Button, DataView, Dialog, Empty, PageHead, Pager, SelectInput, Skeleton, Tag, TextArea, TextInput, whenOpen } from '@/components/ui';
import { api } from '@/lib/api';
import { dateTime } from '@/lib/format';
import { useSubmit } from '@/lib/forms';
import { opts, useGroupsLite, useUrlState } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import type { Assignment, LinkItem } from './types';

const LIMIT = 30;

export function AssignmentsPage() {
  const t = useT();
  const { can, is } = useSession();
  const router = useRouter();
  const [f, setF] = useUrlState({ groupId: '', status: '', includeArchived: 'false', offset: '0', new: '' });
  const offset = Number(f.offset) || 0;
  const list = useApi<{ items: Assignment[] }>('/assignments', { groupId: f.groupId, status: f.status, includeArchived: is('STUDENT') ? undefined : f.includeArchived, limit: LIMIT, offset });
  const groups = useGroupsLite();
  const student = is('STUDENT');
  return (
    <>
      <PageHead title="Vazifalar" actions={can('homework.create') ? <Button variant="primary" icon={<Icon.plus />} onClick={() => setF({ new: '1' })}>{t("Yangi vazifa")}</Button> : null} />
      <div className="toolbar">
        <SelectInput label="Guruh" value={f.groupId} onChange={(e) => setF({ groupId: e.target.value })} options={opts(groups.data?.items)} placeholder="Hammasi" />
        <SelectInput label="Muddat" value={f.status} onChange={(e) => setF({ status: e.target.value })} options={[{ value: 'open', label: 'Ochiq' }, { value: 'overdue', label: "Muddati o'tgan" }]} placeholder="Hammasi" />
        {!student ? <SelectInput label="Arxiv" value={f.includeArchived} onChange={(e) => setF({ includeArchived: e.target.value })} options={[{ value: 'false', label: "Ko'rsatilmaydi" }, { value: 'true', label: "Ko'rsatiladi" }]} /> : null}
      </div>
      <div className="table-wrap">
        <DataView state={list} skeleton={<Skeleton rows={5} cols={4} />} empty={(d) => (d.items.length ? null : <Empty title="Vazifa yo'q" text={can('homework.create') ? "Guruhingiz uchun vazifa bering: o'quvchilar matn yoki havola bilan topshiradi." : undefined} />)}>
          {(d) => (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("Vazifa")}</th>
                    <th>{t("Guruh")}</th>
                    <th>{t("Muddat")}</th>
                    <th>{student ? t('Holat') : t('Topshirildi')}</th>
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((a) => {
                    const overdue = a.dueAt !== null && new Date(a.dueAt).getTime() < Date.now();
                    return (
                      <tr key={a.id} data-clickable onClick={() => router.push(`/assignments/${a.id}`)}>
                        <td>
                          <Link className="cell-main" href={`/assignments/${a.id}`} onClick={(e) => e.stopPropagation()}>
                            {a.title}
                          </Link>
                          {a.archivedAt ? <div className="cell-sub">{t("arxivda")}</div> : null}
                        </td>
                        <td className="muted">{a.groupName}</td>
                        <td className={overdue ? 'fig muted' : 'fig'}>{a.dueAt ? dateTime(a.dueAt) : t('muddatsiz')}</td>
                        <td>
                          {student ? (
                            a.mySubmission ? a.mySubmission.graded ? <Tag kind="ok">Baho: {a.mySubmission.score}/{a.maxScore}</Tag> : <Tag kind="ok">{t("Topshirilgan")}</Tag> : overdue ? <Tag kind="bad">{t("Topshirilmagan")}</Tag> : <Tag kind="warn">{t("Kutilmoqda")}</Tag>
                          ) : a.counts ? (
                            <span className="fig">
                              {a.counts.submitted}/{a.counts.students}
                              {a.counts.submitted > a.counts.graded ? <span className="cell-sub"> {a.counts.submitted - a.counts.graded} baholanmagan</span> : null}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pager offset={offset} limit={LIMIT} count={d.items.length} onChange={(o) => setF({ offset: String(o) })} />
            </>
          )}
        </DataView>
      </div>
      <AssignmentDialog
        open={f.new === '1'}
        defaultGroupId={f.groupId}
        onClose={() => setF({ new: '' })}
        onSaved={(id) => {
          setF({ new: '' });
          router.push(`/assignments/${id}`);
        }}
      />
    </>
  );
}

/** Yangi vazifa yoki tahrirlash (assignment berilsa). Muddat Toshkent vaqtida kiritiladi. */
export const AssignmentDialog = whenOpen(function AssignmentDialogInner({ open, defaultGroupId, assignment, onClose, onSaved }: { open: boolean; defaultGroupId?: string; assignment?: Assignment; onClose: () => void; onSaved: (id: string) => void }) {
  const t = useT();
  const groups = useGroupsLite(!assignment);
  const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + 5 * 3600e3).toISOString().slice(0, 16) : '');
  const [v, setV] = useState({ groupId: assignment?.groupId ?? defaultGroupId ?? '', title: assignment?.title ?? '', description: assignment?.description ?? '', dueAt: toLocal(assignment?.dueAt ?? null), maxScore: String(assignment?.maxScore ?? 100) });
  const [links, setLinks] = useState<LinkItem[]>(assignment?.attachments ?? []);
  const s = useSubmit();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dueAt = v.dueAt ? `${v.dueAt}:00+05:00` : null;
    const body: Record<string, unknown> = { title: v.title.trim(), maxScore: Number(v.maxScore), attachments: cleanLinks(links) };
    if (assignment) {
      body.description = v.description.trim() || null;
      body.dueAt = dueAt;
    } else {
      if (v.description.trim()) body.description = v.description.trim();
      if (dueAt) body.dueAt = dueAt;
    }
    const r = await s.run(() => (assignment ? api.patch<Assignment>(`/assignments/${assignment.id}`, body) : api.post<Assignment>(`/groups/${v.groupId}/assignments`, body)));
    if (r) onSaved(r.id);
  };
  return (
    <Dialog open={open} onClose={onClose} title={assignment ? 'Vazifani tahrirlash' : 'Yangi vazifa'} wide footer={<><Button onClick={onClose}>{t("Bekor qilish")}</Button><Button variant="primary" type="submit" form="hw-form" busy={s.busy}>{t("Saqlash")}</Button></>}>
      <form id="hw-form" className="form" onSubmit={submit} noValidate>
        <div className="form-grid">
          {!assignment ? <SelectInput label="Guruh" fieldClass="span-2" value={v.groupId} onChange={set('groupId')} options={opts(groups.data?.items.filter((g) => !g.archivedAt && g.status !== 'FINISHED'))} placeholder="Tanlang" /> : null}
          <TextInput label="Sarlavha" fieldClass="span-2" value={v.title} onChange={set('title')} error={s.fields.title} maxLength={200} autoFocus />
          <TextArea label="Tavsif" optional fieldClass="span-2" value={v.description} onChange={set('description')} maxLength={5000} />
          <TextInput label="Muddat" optional type="datetime-local" value={v.dueAt} onChange={set('dueAt')} error={s.fields.dueAt} hint="Toshkent vaqti" />
          <TextInput label="Maksimal ball" type="number" min={1} max={1000} value={v.maxScore} onChange={set('maxScore')} error={s.fields.maxScore} />
        </div>
        <fieldset className="fieldset">
          <legend>{t("Havolalar")}</legend>
          <LinksEditor value={links} onChange={setLinks} />
        </fieldset>
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});
