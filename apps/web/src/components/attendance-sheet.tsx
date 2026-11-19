'use client';
// Davomat varag'i: dars ro'yxati, har o'quvchi uchun Keldi / Kechikdi / Kelmadi / Sababli. Saqlash bitta so'rovda.
// Qulflangan dars faqat attendance.edit_past bilan tahrirlanadi (server tekshiradi; UI ogohlantiradi).
import { useMemo, useState } from 'react';
import type { AttStatus, Lesson } from '@/app/(panel)/groups/types';
import { api, errorText } from '@/lib/api';
import { dateLong } from '@/lib/format';
import { useSession } from '@/lib/session';
import { Icon } from './icons';
import { Button, Tag, useToast } from './ui';

const OPTIONS: { v: AttStatus; label: string; short: string }[] = [
  { v: 'PRESENT', label: 'Keldi', short: 'K' },
  { v: 'LATE', label: 'Kechikdi', short: 'Kch' },
  { v: 'ABSENT', label: 'Kelmadi', short: 'Y' },
  { v: 'EXCUSED', label: 'Sababli', short: 'S' },
];

export function AttendanceSheet({ lesson, onSaved }: { lesson: Lesson; onSaved: (l: Lesson) => void }) {
  const { can } = useSession();
  const toast = useToast();
  const initial = useMemo(() => Object.fromEntries((lesson.roster ?? []).map((r) => [r.studentId, r.status])), [lesson]);
  const [marks, setMarks] = useState<Record<string, AttStatus | null>>(initial);
  const [busy, setBusy] = useState(false);
  const canEdit = can('attendance.mark') && lesson.status === 'HELD' && (!lesson.locked || can('attendance.edit_past'));
  const roster = lesson.roster ?? [];
  const changed = roster.filter((r) => marks[r.studentId] && marks[r.studentId] !== r.status);
  const unmarked = roster.filter((r) => !marks[r.studentId]).length;

  const save = async () => {
    setBusy(true);
    try {
      const records = roster.filter((r) => marks[r.studentId]).map((r) => ({ studentId: r.studentId, status: marks[r.studentId]! }));
      const updated = await api.put<Lesson>(`/lessons/${lesson.id}/attendance`, { records });
      toast('Davomat saqlandi');
      onSaved(updated);
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!roster.length) return <p className="muted">Dars kuni guruhda faol o&apos;quvchi bo&apos;lmagan.</p>;

  return (
    <div className="stack">
      <div className="row" data-between>
        <span className="muted">
          {dateLong(lesson.lessonDate)}
          {lesson.topic ? `, ${lesson.topic}` : ''}
          {lesson.teacherName ? `, ${lesson.teacherName}` : ''}
        </span>
        <span className="row">
          {lesson.locked ? (
            <Tag kind="warn">
              <Icon.lock width={12} height={12} /> Qulflangan
            </Tag>
          ) : null}
          {canEdit ? (
            <Button size="sm" onClick={() => setMarks(Object.fromEntries(roster.map((r) => [r.studentId, marks[r.studentId] ?? 'PRESENT'])))}>
              Qolganlar keldi
            </Button>
          ) : null}
        </span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>O&apos;quvchi</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((r) => (
              <tr key={r.studentId}>
                <td className="cell-main">{r.fullName}</td>
                <td>
                  <div className="att" role="radiogroup" aria-label={`${r.fullName}: davomat`}>
                    {OPTIONS.map((o) => (
                      <button key={o.v} type="button" role="radio" data-v={o.v} aria-checked={marks[r.studentId] === o.v} disabled={!canEdit} title={o.label} onClick={() => setMarks((m) => ({ ...m, [r.studentId]: o.v }))}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canEdit ? (
        <div className="row" data-between>
          <span className="muted small">{unmarked ? `${unmarked} ta o'quvchi belgilanmagan` : 'Hammasi belgilangan'}</span>
          <Button variant="primary" busy={busy} disabled={!changed.length} onClick={save} icon={<Icon.check />}>
            Saqlash{changed.length ? ` (${changed.length})` : ''}
          </Button>
        </div>
      ) : lesson.locked ? (
        <p className="muted small">Dars qulflangan: o&apos;zgartirish uchun &quot;O&apos;tgan davomatni tuzatish&quot; ruxsati kerak.</p>
      ) : null}
    </div>
  );
}
