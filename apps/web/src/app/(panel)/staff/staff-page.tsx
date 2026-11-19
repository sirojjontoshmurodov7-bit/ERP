'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { type Credentials, CredentialsDialog } from '@/components/credentials';
import { Icon } from '@/components/icons';
import { Button, Confirm, DataView, Dialog, Empty, PageHead, Pager, SelectInput, Skeleton, Tag, TextArea, TextInput, useToast, whenOpen } from '@/components/ui';
import { api, errorText } from '@/lib/api';
import { dateTime } from '@/lib/format';
import { clean, useSubmit } from '@/lib/forms';
import { type Branch, useBranches, useUrlState } from '@/lib/hooks';
import { ROLE_LABEL, useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';

interface Staff {
  id: string;
  login: string;
  fullName: string;
  phone: string | null;
  role: 'ADMIN' | 'CASHIER' | 'TEACHER';
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  branchIds: string[];
  specialization?: string | null;
  note?: string | null;
}
const LIMIT = 50;

export function StaffPage() {
  const { can, is } = useSession();
  const toast = useToast();
  const [f, setF] = useUrlState({ role: '', branchId: '', status: 'ACTIVE', offset: '0' });
  const offset = Number(f.offset) || 0;
  const list = useApi<{ items: Staff[] }>('/staff', { role: f.role, branchId: f.branchId, status: f.status, limit: LIMIT, offset });
  const branches = useBranches();
  const branchName = useMemo(() => new Map((branches.data?.items ?? []).map((b) => [b.id, b.name])), [branches.data]);
  const [create, setCreate] = useState(false);
  const [edit, setEdit] = useState<Staff | null>(null);
  const [suspend, setSuspend] = useState<Staff | null>(null);
  const [creds, setCreds] = useState<Credentials | null>(null);
  const canCreate = can('staff.create') || can('teacher.create');

  const reset = async (s: Staff) => {
    try {
      const r = await api.post<{ user: { login: string; fullName: string }; temporaryPassword: string }>(`/users/${s.id}/reset-password`);
      setCreds({ fullName: r.user.fullName, login: r.user.login, temporaryPassword: r.temporaryPassword });
    } catch (e) {
      toast(errorText(e), 'error');
    }
  };

  return (
    <>
      <PageHead title="Xodimlar" sub="Administratorlar, kassirlar va ustozlar." actions={canCreate ? <Button variant="primary" icon={<Icon.plus />} onClick={() => setCreate(true)}>Yangi xodim</Button> : null} />
      <div className="toolbar">
        <SelectInput label="Rol" value={f.role} onChange={(e) => setF({ role: e.target.value })} options={(['ADMIN', 'CASHIER', 'TEACHER'] as const).map((r) => ({ value: r, label: ROLE_LABEL[r] }))} placeholder="Hammasi" />
        {(branches.data?.items.length ?? 0) > 1 ? <SelectInput label="Filial" value={f.branchId} onChange={(e) => setF({ branchId: e.target.value })} options={(branches.data?.items ?? []).map((b) => ({ value: b.id, label: b.name }))} placeholder="Hammasi" /> : null}
        <SelectInput label="Holat" value={f.status} onChange={(e) => setF({ status: e.target.value })} options={[{ value: 'ACTIVE', label: 'Faol' }, { value: 'SUSPENDED', label: "To'xtatilgan" }]} placeholder="Hammasi" />
      </div>
      <div className="table-wrap">
        <DataView state={list} skeleton={<Skeleton rows={5} cols={5} />} empty={(d) => (d.items.length ? null : <Empty title="Xodim yo'q" action={canCreate ? <Button size="sm" variant="primary" onClick={() => setCreate(true)}>Yangi xodim</Button> : undefined} />)}>
          {(d) => (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Xodim</th>
                    <th>Rol</th>
                    <th>Filial</th>
                    <th>Oxirgi kirish</th>
                    <th>Holat</th>
                    <th className="actions-cell" aria-label="Amallar" />
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <span className="cell-main">{s.fullName}</span>
                        <div className="cell-sub fig">{s.login}</div>
                      </td>
                      <td>
                        {ROLE_LABEL[s.role]}
                        {s.specialization ? <div className="cell-sub">{s.specialization}</div> : null}
                      </td>
                      <td className="muted">{s.branchIds.map((b) => branchName.get(b)).filter(Boolean).join(', ')}</td>
                      <td className="fig muted">{s.lastLoginAt ? dateTime(s.lastLoginAt) : 'kirmagan'}</td>
                      <td>{s.status === 'ACTIVE' ? <Tag kind="ok">Faol</Tag> : <Tag kind="bad">To&apos;xtatilgan</Tag>}</td>
                      <td className="actions-cell">
                        <span className="row">
                          <Button size="sm" variant="ghost" onClick={() => setEdit(s)}>
                            Tahrirlash
                          </Button>
                          {can('user.reset_password') && s.status === 'ACTIVE' ? (
                            <Button size="sm" variant="ghost" onClick={() => reset(s)}>
                              Parolni tiklash
                            </Button>
                          ) : null}
                          {can('permissions.manage') ? (
                            <Link className="btn btn--ghost btn--sm" href={`/permissions?user=${s.id}`}>
                              Ruxsatlar
                            </Link>
                          ) : null}
                          {is('OWNER') ? (
                            <Button size="sm" variant={s.status === 'ACTIVE' ? 'danger' : 'ghost'} onClick={() => setSuspend(s)}>
                              {s.status === 'ACTIVE' ? "To'xtatish" : 'Faollashtirish'}
                            </Button>
                          ) : null}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pager offset={offset} limit={LIMIT} count={d.items.length} onChange={(o) => setF({ offset: String(o) })} />
            </>
          )}
        </DataView>
      </div>
      <StaffDialog
        open={create}
        branches={branches.data?.items ?? []}
        onClose={() => setCreate(false)}
        onCreated={(c) => {
          setCreate(false);
          setCreds(c);
          list.reload();
        }}
      />
      <EditStaff open={edit !== null} staff={edit} branches={branches.data?.items ?? []} onClose={() => setEdit(null)} onSaved={list.reload} />
      <Confirm
        open={suspend !== null}
        onClose={() => setSuspend(null)}
        title={suspend?.status === 'ACTIVE' ? "Xodimni to'xtatish" : 'Xodimni faollashtirish'}
        text={suspend?.status === 'ACTIVE' ? `${suspend.fullName} tizimga kira olmaydi, ochiq sessiyalari yopiladi. Tarix saqlanadi.` : `${suspend?.fullName ?? ''} yana tizimga kira oladi.`}
        confirmLabel={suspend?.status === 'ACTIVE' ? "To'xtatish" : 'Faollashtirish'}
        danger={suspend?.status === 'ACTIVE'}
        onConfirm={async () => {
          await api.patch(`/staff/${suspend!.id}`, { status: suspend!.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' });
          list.reload();
        }}
      />
      <CredentialsDialog value={creds} onClose={() => setCreds(null)} />
    </>
  );
}

function BranchChecks({ branches, value, onChange, error }: { branches: Branch[]; value: string[]; onChange: (v: string[]) => void; error?: string }) {
  return (
    <fieldset className="fieldset">
      <legend>Filiallar</legend>
      <div className="row">
        {branches.map((b) => (
          <label key={b.id} className="check">
            <input type="checkbox" checked={value.includes(b.id)} onChange={(e) => onChange(e.target.checked ? [...value, b.id] : value.filter((x) => x !== b.id))} />
            {b.name}
          </label>
        ))}
      </div>
      {error ? <span className="field-error">{error}</span> : null}
    </fieldset>
  );
}

const StaffDialog = whenOpen(function StaffDialogInner({ open, branches, onClose, onCreated }: { open: boolean; branches: Branch[]; onClose: () => void; onCreated: (c: Credentials) => void }) {
  const { can } = useSession();
  const roles = [...(can('staff.create') ? (['ADMIN', 'CASHIER'] as const) : []), ...(can('teacher.create') ? (['TEACHER'] as const) : [])];
  const [v, setV] = useState({ role: roles.includes('TEACHER') ? 'TEACHER' : roles[0] ?? 'TEACHER', fullName: '', login: '', phone: '', specialization: '', note: '' });
  const [branchIds, setBranchIds] = useState<string[]>(branches.length === 1 ? [branches[0]!.id] : []);
  const s = useSubmit();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { specialization, note, ...base } = v;
    const body = clean({ ...base, ...(v.role === 'TEACHER' ? { specialization, note } : {}) });
    const r = await s.run(() => api.post<{ user: { login: string; fullName: string }; temporaryPassword: string }>('/staff', { ...body, branchIds }));
    if (r) onCreated({ fullName: r.user.fullName, login: r.user.login, temporaryPassword: r.temporaryPassword });
  };
  return (
    <Dialog open={open} onClose={onClose} title="Yangi xodim" wide footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" type="submit" form="staff-form" busy={s.busy}>Yaratish</Button></>}>
      <form id="staff-form" className="form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <SelectInput label="Rol" value={v.role} onChange={set('role')} options={roles.map((r) => ({ value: r, label: ROLE_LABEL[r] }))} />
          <TextInput label="Ism familiya" value={v.fullName} onChange={set('fullName')} error={s.fields.fullName} autoFocus />
          <TextInput label="Login" optional value={v.login} onChange={set('login')} error={s.fields.login} hint="Bo'sh qolsa avtomatik: markaz.ism" autoCapitalize="none" spellCheck={false} />
          <TextInput label="Telefon" optional type="tel" value={v.phone} onChange={set('phone')} error={s.fields.phone} />
          {v.role === 'TEACHER' ? (
            <>
              <TextInput label="Mutaxassislik" optional value={v.specialization} onChange={set('specialization')} placeholder="Masalan: Ingliz tili" />
              <TextArea label="Izoh" optional value={v.note} onChange={set('note')} maxLength={500} />
            </>
          ) : null}
        </div>
        <BranchChecks branches={branches} value={branchIds} onChange={setBranchIds} error={s.fields.branchIds} />
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});

const EditStaff = whenOpen(function EditStaffInner({ open, staff, branches, onClose, onSaved }: { open: boolean; staff: Staff | null; branches: Branch[]; onClose: () => void; onSaved: () => void }) {
  const st = staff!;
  const detail = useApi<Staff>(`/staff/${st.id}`);
  return (
    <Dialog open={open} onClose={onClose} title={`${st.fullName}: tahrirlash`} wide footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" type="submit" form="edit-staff" disabled={!detail.data}>Saqlash</Button></>}>
      <DataView state={detail} skeleton={<Skeleton rows={3} cols={2} />}>
        {(d) => <EditStaffForm detail={d} branches={branches} onDone={() => { onSaved(); onClose(); }} />}
      </DataView>
    </Dialog>
  );
});

/** Tafsilot yuklangach mount bo'ladi: boshlang'ich qiymatlar prop'dan, sinxronlash effekti kerak emas. */
function EditStaffForm({ detail, branches, onDone }: { detail: Staff; branches: Branch[]; onDone: () => void }) {
  const { is } = useSession();
  const [v, setV] = useState({ fullName: detail.fullName, phone: detail.phone ?? '', specialization: detail.specialization ?? '', note: detail.note ?? '' });
  const [branchIds, setBranchIds] = useState<string[]>(detail.branchIds);
  const s = useSubmit();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = detail.role === 'TEACHER' ? clean(v, ['phone', 'specialization', 'note']) : clean({ fullName: v.fullName, phone: v.phone }, ['phone']);
    if (is('OWNER') && JSON.stringify([...branchIds].sort()) !== JSON.stringify([...detail.branchIds].sort())) body.branchIds = branchIds;
    const r = await s.run(() => api.patch(`/staff/${detail.id}`, body));
    if (r) onDone();
  };
  return (
    <form id="edit-staff" className="form" onSubmit={submit} noValidate>
      <div className="form-grid">
        <TextInput label="Ism familiya" value={v.fullName} onChange={set('fullName')} error={s.fields.fullName} />
        <TextInput label="Telefon" optional type="tel" value={v.phone} onChange={set('phone')} error={s.fields.phone} />
        {detail.role === 'TEACHER' ? (
          <>
            <TextInput label="Mutaxassislik" optional value={v.specialization} onChange={set('specialization')} />
            <TextArea label="Izoh" optional value={v.note} onChange={set('note')} maxLength={500} />
          </>
        ) : null}
      </div>
      {is('OWNER') ? <BranchChecks branches={branches} value={branchIds} onChange={setBranchIds} error={s.fields.branchIds} /> : null}
      {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
    </form>
  );
}
