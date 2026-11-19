'use client';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { cleanLinks, LinkList, LinksEditor } from '@/components/links-editor';
import { Button, Confirm, DataView, Dialog, Empty, PageHead, Skeleton, Stat, Tag, TextArea, TextInput, useToast, whenOpen } from '@/components/ui';
import { api, errorText } from '@/lib/api';
import { dateTime } from '@/lib/format';
import { useSubmit } from '@/lib/forms';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import { AssignmentDialog } from '../assignments-page';
import type { Assignment, LinkItem, Submission } from '../types';

export function AssignmentCard() {
  const { id } = useParams<{ id: string }>();
  const { can, is } = useSession();
  const a = useApi<Assignment>(`/assignments/${id}`);
  const [edit, setEdit] = useState(false);
  const [archive, setArchive] = useState(false);
  return (
    <DataView state={a} skeleton={<Skeleton rows={5} cols={2} />}>
      {(d) => {
        const teacherOwns = is('TEACHER') && can('homework.create');
        return (
          <>
            <PageHead
              crumbs={[{ href: '/assignments', label: 'Vazifalar' }]}
              title={d.title}
              sub={`${d.groupName}, ${d.teacherName}${d.archivedAt ? ', arxivda' : ''}`}
              actions={
                teacherOwns && !d.archivedAt ? (
                  <>
                    <Button onClick={() => setEdit(true)}>Tahrirlash</Button>
                    <Button variant="ghost" onClick={() => setArchive(true)}>
                      Arxivlash
                    </Button>
                  </>
                ) : null
              }
            />
            <div className="split">
              <section className="panel panel-body stack-sm">
                <h2>Topshiriq</h2>
                {d.description ? <p className="prewrap">{d.description}</p> : <p className="muted">Tavsif yo&apos;q.</p>}
                <LinkList items={d.attachments} />
              </section>
              <aside className="stats stats--col">
                <Stat label="Muddat" value={<span className="stat-text">{d.dueAt ? dateTime(d.dueAt) : 'muddatsiz'}</span>} />
                <Stat label="Maksimal ball" value={d.maxScore} />
                {d.counts ? <Stat label="Topshirgan" value={`${d.counts.submitted}/${d.counts.students}`} note={`${d.counts.graded} baholangan`} /> : null}
              </aside>
            </div>
            {is('STUDENT') ? <MySubmission a={d} onChange={a.reload} /> : <Submissions a={d} canGrade={can('homework.grade') && is('TEACHER')} onChange={a.reload} />}
            <AssignmentDialog open={edit} assignment={d} onClose={() => setEdit(false)} onSaved={() => { setEdit(false); a.reload(); }} />
            <Confirm
              open={archive}
              onClose={() => setArchive(false)}
              title="Vazifani arxivlash"
              text="Arxivlangan vazifa o'quvchilarga ko'rinmaydi va topshirib bo'lmaydi. Baholar va reyting ballari saqlanadi."
              confirmLabel="Arxivlash"
              onConfirm={async () => {
                await api.post(`/assignments/${d.id}/archive`);
                a.reload();
              }}
            />
          </>
        );
      }}
    </DataView>
  );
}

function Submissions({ a, canGrade, onChange }: { a: Assignment; canGrade: boolean; onChange: () => void }) {
  const [grading, setGrading] = useState<Submission | null>(null);
  const subs = a.submissions ?? [];
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Topshiriqlar</h2>
      </div>
      <div className="panel-body--flush">
        {!subs.length ? (
          <Empty title="Hali hech kim topshirmagan" />
        ) : (
          <ul className="list-plain">
            {subs.map((s) => (
              <li key={s.id} className="stack-sm">
                <div className="row" data-between>
                  <span>
                    <span className="cell-main">{s.studentName}</span> <span className="cell-sub fig">{dateTime(s.submittedAt)}</span> {s.late ? <Tag kind="warn">kech</Tag> : null}
                  </span>
                  <span className="row">
                    {s.gradedAt ? <span className="fig cell-main">{s.score}/{s.maxScore}</span> : <Tag kind="mute">baholanmagan</Tag>}
                    {canGrade && !s.gradedAt && !a.archivedAt ? (
                      <Button size="sm" variant="primary" onClick={() => setGrading(s)}>
                        Baholash
                      </Button>
                    ) : null}
                  </span>
                </div>
                {s.text ? <p className="prewrap">{s.text}</p> : null}
                <LinkList items={s.files} />
                {s.feedback ? <p className="small muted">Izoh: {s.feedback}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
      <GradeDialog open={grading !== null} sub={grading} a={a} onClose={() => setGrading(null)} onDone={onChange} />
    </section>
  );
}

const GradeDialog = whenOpen(function GradeInner({ open, sub, a, onClose, onDone }: { open: boolean; sub: Submission | null; a: Assignment; onClose: () => void; onDone: () => void }) {
  const s0 = sub!;
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const s = useSubmit();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(score);
    if (score === '' || !Number.isInteger(n) || n < 0 || n > a.maxScore) return s.setError(`Ball 0 dan ${a.maxScore} gacha butun son`);
    const r = await s.run(() => api.post(`/assignments/${a.id}/submissions/${s0.studentId}/grade`, { score: n, ...(feedback.trim() ? { feedback: feedback.trim() } : {}) }));
    if (r) {
      onDone();
      onClose();
    }
  };
  return (
    <Dialog open={open} onClose={onClose} title={`${s0.studentName ?? ''}: baholash`} footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" type="submit" form="grade-form" busy={s.busy}>Saqlash</Button></>}>
      <form id="grade-form" className="form" onSubmit={submit} noValidate>
        <p className="muted small">Baho bir marta qo&apos;yiladi va reyting balliga aylanadi.</p>
        <TextInput label={`Ball (0 dan ${a.maxScore} gacha)`} type="number" min={0} max={a.maxScore} value={score} onChange={(e) => setScore(e.target.value)} error={s.fields.score} autoFocus />
        <TextArea label="Izoh" optional value={feedback} onChange={(e) => setFeedback(e.target.value)} maxLength={1000} />
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});

function MySubmission({ a, onChange }: { a: Assignment; onChange: () => void }) {
  const toast = useToast();
  const sub = a.submission ?? null;
  const [text, setText] = useState(sub?.text ?? '');
  const [links, setLinks] = useState<LinkItem[]>(sub?.files ?? []);
  const [busy, setBusy] = useState(false);
  const locked = Boolean(sub?.gradedAt) || Boolean(a.archivedAt);
  const send = async () => {
    const files = cleanLinks(links);
    if (!text.trim() && !files.length) return toast('Javob matni yoki havola kiriting', 'error');
    setBusy(true);
    try {
      await api.post(`/assignments/${a.id}/submission`, { ...(text.trim() ? { text: text.trim() } : {}), ...(files.length ? { files } : {}) });
      toast('Topshirildi');
      onChange();
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="panel panel-body stack">
      <div className="row" data-between>
        <h2>Mening javobim</h2>
        {sub?.gradedAt ? <span className="stamp">{sub.score}/{sub.maxScore}</span> : sub ? <Tag kind="ok">Topshirilgan {dateTime(sub.submittedAt)}</Tag> : null}
      </div>
      {sub?.feedback ? <p>Ustoz izohi: {sub.feedback}</p> : null}
      {locked ? (
        <>
          {sub?.text ? <p className="prewrap">{sub.text}</p> : null}
          <LinkList items={sub?.files ?? []} />
        </>
      ) : (
        <>
          <TextArea label="Javob" value={text} onChange={(e) => setText(e.target.value)} maxLength={10000} hint={sub ? 'Baholanguncha qayta topshirish mumkin' : undefined} />
          <LinksEditor value={links} onChange={setLinks} />
          <div>
            <Button variant="primary" busy={busy} onClick={send}>
              {sub ? 'Qayta topshirish' : 'Topshirish'}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
