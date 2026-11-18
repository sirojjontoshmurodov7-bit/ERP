'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { type Credentials, CredentialsDialog } from '@/components/credentials';
import { Icon } from '@/components/icons';
import { Button, DataView, Dialog, Empty, PageHead, Pager, SelectInput, Skeleton, Tag, TextArea, TextInput, useToast, whenOpen } from '@/components/ui';
import { api, errorText } from '@/lib/api';
import { tsDate } from '@/lib/format';
import { clean, useSubmit } from '@/lib/forms';
import { opts, useBranches, useGroupsLite, useUrlState } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';
import type { Student } from './types';

const LIMIT = 50;

export function StudentsList() {
  const { can, is } = useSession();
  const router = useRouter();
  const [f, setF] = useUrlState({ q: '', branchId: '', status: 'ACTIVE', groupId: '', enrolled: '', sort: 'name', offset: '0', new: '' });
  const [q, setQ] = useState(f.q);
  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== f.q) setF({ q });
    }, 300);
    return () => clearTimeout(t);
  }, [q, f.q, setF]);

  const offset = Number(f.offset) || 0;
  const list = useApi<{ items: Student[] }>('/students', { q: f.q, branchId: f.branchId, status: f.status, groupId: f.groupId, enrolled: f.enrolled, sort: f.sort, limit: LIMIT, offset });
  const branches = useBranches(!is('TEACHER'));
  const groups = useGroupsLite();
  const branchName = useMemo(() => new Map((branches.data?.items ?? []).map((b) => [b.id, b.name])), [branches.data]);
  const [creds, setCreds] = useState<Credentials | null>(null);

  return (
    <>
      <PageHead
        title="O'quvchilar"
        sub="Qidirish ism, login yoki telefon bo'yicha."
        actions={
          can('student.create') ? (
            <>
              {can('import.run') ? (
                <Button onClick={() => router.push('/imports')} icon={<Icon.upload />}>
                  Exceldan import
                </Button>
              ) : null}
              <Button variant="primary" onClick={() => setF({ new: '1' })} icon={<Icon.plus />}>
                Yangi o&apos;quvchi
              </Button>
            </>
          ) : null
        }
      />
      <div className="toolbar" role="search">
        <TextInput label="Qidirish" fieldClass="field--grow" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ism, login yoki telefon" />
        {!is('TEACHER') && (branches.data?.items.length ?? 0) > 1 ? <SelectInput label="Filial" value={f.branchId} onChange={(e) => setF({ branchId: e.target.value })} options={opts(branches.data?.items)} placeholder="Hammasi" /> : null}
        <SelectInput label="Guruh" value={f.groupId} onChange={(e) => setF({ groupId: e.target.value })} options={opts(groups.data?.items)} placeholder="Hammasi" />
        <SelectInput
          label="Yozilish"
          value={f.enrolled}
          onChange={(e) => setF({ enrolled: e.target.value })}
          options={[
            { value: 'true', label: 'Guruhda o\'qiydi' },
            { value: 'false', label: 'Guruhsiz' },
          ]}
          placeholder="Hammasi"
        />
        <SelectInput
          label="Holat"
          value={f.status}
          onChange={(e) => setF({ status: e.target.value })}
          options={[
            { value: 'ACTIVE', label: 'Faol' },
            { value: 'ARCHIVED', label: 'Arxivda' },
          ]}
          placeholder="Hammasi"
        />
        <SelectInput
          label="Tartib"
          value={f.sort}
          onChange={(e) => setF({ sort: e.target.value })}
          options={[
            { value: 'name', label: 'Ism bo\'yicha' },
            { value: 'newest', label: 'Avval yangilari' },
          ]}
        />
      </div>

      <div className="table-wrap">
        <DataView
          state={list}
          skeleton={<Skeleton rows={8} cols={5} />}
          empty={(d) =>
            d.items.length ? null : f.q || f.groupId || f.branchId || f.enrolled ? (
              <Empty title="Hech narsa topilmadi" text="Filtrlarni o'zgartirib ko'ring." action={<Button size="sm" onClick={() => { setQ(''); setF({ q: '', groupId: '', branchId: '', enrolled: '' }); }}>Filtrlarni tozalash</Button>} />
            ) : (
              <Empty title="Hali o'quvchi yo'q" text="Birinchi o'quvchini qo'shing yoki Excel fayldan import qiling." action={can('student.create') ? <Button variant="primary" size="sm" onClick={() => setF({ new: '1' })}>Yangi o&apos;quvchi</Button> : undefined} />
            )
          }
        >
          {(d) => (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>O&apos;quvchi</th>
                    <th>Telefon</th>
                    <th>Ota-ona</th>
                    {!is('TEACHER') ? <th>Filial</th> : null}
                    <th>Qo&apos;shilgan</th>
                    <th>Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((s) => (
                    <tr key={s.id} data-clickable onClick={() => router.push(`/students/${s.id}`)}>
                      <td>
                        <Link className="cell-main" href={`/students/${s.id}`} onClick={(e) => e.stopPropagation()}>
                          {s.fullName}
                        </Link>
                        <div className="cell-sub fig">{s.login}</div>
                      </td>
                      <td className="fig">{s.phone ?? <span className="muted">—</span>}</td>
                      <td>
                        {s.parentName ?? <span className="muted">—</span>}
                        {s.parentPhone ? <div className="cell-sub fig">{s.parentPhone}</div> : null}
                      </td>
                      {!is('TEACHER') ? <td className="muted">{s.branchIds.map((b) => branchName.get(b) ?? '').filter(Boolean).join(', ') || '—'}</td> : null}
                      <td className="fig muted">{tsDate(s.createdAt)}</td>
                      <td>{s.status === 'ACTIVE' ? (s.mustChangePassword ? <Tag kind="mute">Kirmagan</Tag> : <Tag kind="ok">Faol</Tag>) : <Tag kind="mute">Arxivda</Tag>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pager offset={offset} limit={LIMIT} count={d.items.length} onChange={(o) => setF({ offset: String(o) })} />
            </>
          )}
        </DataView>
      </div>

      <CreateStudent
        open={f.new === '1'}
        onClose={() => setF({ new: '' })}
        onCreated={(c) => {
          setF({ new: '' });
          setCreds(c);
          list.reload();
        }}
      />
      <CredentialsDialog value={creds} onClose={() => setCreds(null)} />
    </>
  );
}

const CreateStudent = whenOpen(function CreateStudentInner({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (c: Credentials & { id: string }) => void }) {
  const branches = useBranches(open);
  const groups = useGroupsLite(open);
  const empty = { fullName: '', branchId: '', phone: '', birthDate: '', parentName: '', parentPhone: '', note: '', groupId: '' };
  const [v, setV] = useState(empty);
  const s = useSubmit();
  const toast = useToast();
  // yagona filial bo'lsa avtomatik tanlanadi
  const only = branches.data?.items.length === 1 ? branches.data.items[0]!.id : '';
  const branchId = v.branchId || only;

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  const groupOptions = (groups.data?.items ?? []).filter((g) => !branchId || g.branchId === branchId).filter((g) => g.status !== 'FINISHED');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { groupId, ...rest } = v;
    const r = await s.run(() => api.post<{ student: { id: string; login: string; fullName: string }; temporaryPassword: string }>('/students', clean({ ...rest, branchId })));
    if (!r) return;
    // O'quvchi yaratildi: guruhga yozish xato bersa ham parolni yo'qotmaymiz, xatoni alohida ko'rsatamiz
    if (groupId) {
      try {
        await api.post('/enrollments', { groupId, studentId: r.student.id });
      } catch (err) {
        toast(`O'quvchi qo'shildi, lekin guruhga yozilmadi: ${errorText(err)}`, 'error');
      }
    }
    onCreated({ id: r.student.id, fullName: r.student.fullName, login: r.student.login, temporaryPassword: r.temporaryPassword });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Yangi o'quvchi"
      wide
      footer={
        <>
          <Button onClick={onClose}>Bekor qilish</Button>
          <Button variant="primary" type="submit" form="new-student" busy={s.busy}>
            Qo&apos;shish
          </Button>
        </>
      }
    >
      <form id="new-student" className="form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <TextInput label="Ism familiya" fieldClass="span-2" value={v.fullName} onChange={set('fullName')} error={s.fields.fullName} autoFocus required />
          <SelectInput label="Filial" value={branchId} onChange={set('branchId')} options={opts(branches.data?.items)} placeholder="Tanlang" error={s.fields.branchId} />
          <SelectInput label="Guruhga yozish" optional value={v.groupId} onChange={set('groupId')} options={opts(groupOptions)} placeholder="Keyinroq" hint="Bugungi sanadan; birinchi hisob avtomatik yaratiladi" />
          <TextInput label="Telefon" optional type="tel" inputMode="tel" value={v.phone} onChange={set('phone')} error={s.fields.phone} placeholder="+998 90 123 45 67" />
          <TextInput label="Tug'ilgan sana" optional type="date" value={v.birthDate} onChange={set('birthDate')} error={s.fields.birthDate} />
          <TextInput label="Ota-ona ismi" optional value={v.parentName} onChange={set('parentName')} error={s.fields.parentName} />
          <TextInput label="Ota-ona telefoni" optional type="tel" inputMode="tel" value={v.parentPhone} onChange={set('parentPhone')} error={s.fields.parentPhone} />
          <TextArea label="Izoh" optional fieldClass="span-2" value={v.note} onChange={set('note')} error={s.fields.note} maxLength={500} />
        </div>
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});
