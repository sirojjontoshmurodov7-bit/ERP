'use client';
import { useMemo, useState } from 'react';
import { Button, DataView, Empty, PageHead, Segmented, SelectInput, Skeleton, Tag, useToast } from '@/components/ui';
import { api, errorText } from '@/lib/api';
import { useUrlState } from '@/lib/hooks';
import { ROLE_LABEL, type Role } from '@/lib/session';
import { useApi } from '@/lib/use-api';

interface RolePerm {
  code: string;
  module: string;
  description: string;
  kind: 'default' | 'optional' | 'none';
  configurable: boolean;
  allowed: boolean;
}
interface UserPerm extends Omit<RolePerm, 'allowed'> {
  template: boolean;
  override: boolean | null;
  effective: boolean;
}
const MODULES: Record<string, string> = { platform: 'Platforma', org: 'Tashkilot', academic: "O'quv jarayoni", finance: 'Moliya', payroll: 'Maosh', report: 'Hisobotlar', system: 'Tizim' };
const ROLES: Role[] = ['ADMIN', 'CASHIER', 'TEACHER'];

function byModule<T extends { module: string }>(items: T[]) {
  const m = new Map<string, T[]>();
  for (const i of items) m.set(i.module, [...(m.get(i.module) ?? []), i]);
  return [...m];
}

export function PermissionsPage() {
  const [f, setF] = useUrlState({ tab: 'roles', role: 'ADMIN', user: '' });
  return (
    <>
      <PageHead title="Ruxsatlar" sub="Rol bilan keladigan ruxsatlar o'zgarmaydi; sozlanadiganlarini yoqish yoki o'chirish mumkin." />
      <div className="tabs" role="tablist">
        <button type="button" role="tab" className="tab" aria-selected={f.tab === 'roles'} onClick={() => setF({ tab: 'roles' })}>
          Rol shablonlari
        </button>
        <button type="button" role="tab" className="tab" aria-selected={f.tab === 'users' || Boolean(f.user)} onClick={() => setF({ tab: 'users' })}>
          Xodim istisnolari
        </button>
      </div>
      {f.tab === 'roles' && !f.user ? <RolesTab role={f.role as Role} setRole={(r) => setF({ role: r })} /> : <UsersTab userId={f.user} setUser={(u) => setF({ user: u, tab: 'users' })} />}
    </>
  );
}

function RolesTab({ role, setRole }: { role: Role; setRole: (r: string) => void }) {
  const toast = useToast();
  const state = useApi<{ roles: Record<string, RolePerm[]> }>('/permissions/roles');
  const [changes, setChanges] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await api.put(`/permissions/roles/${role}`, { permissions: changes });
      toast(`${ROLE_LABEL[role]} shabloni saqlandi`);
      setChanges({});
      state.reload();
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="stack">
      <div className="row" data-between>
        <Segmented label="Rol" value={role} onChange={(r) => { setChanges({}); setRole(r); }} options={ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))} />
        <Button variant="primary" busy={busy} disabled={!Object.keys(changes).length} onClick={save}>
          Saqlash{Object.keys(changes).length ? ` (${Object.keys(changes).length})` : ''}
        </Button>
      </div>
      <DataView state={state} skeleton={<Skeleton rows={8} cols={2} />}>
        {(d) => (
          <div className="stack">
            {byModule(d.roles[role] ?? []).map(([mod, items]) => (
              <section key={mod} className="panel">
                <div className="panel-head">
                  <h2>{MODULES[mod] ?? mod}</h2>
                </div>
                <ul className="list-plain">
                  {items.map((p) => {
                    const value = changes[p.code] ?? p.allowed;
                    return (
                      <li key={p.code} className="row" data-between>
                        <span>
                          {p.description}
                          <div className="cell-sub fig">{p.code}</div>
                        </span>
                        {p.configurable ? (
                          <label className="check">
                            <input type="checkbox" checked={value} onChange={(e) => setChanges((c) => { const n = { ...c }; if (e.target.checked === p.allowed) delete n[p.code]; else n[p.code] = e.target.checked; return n; })} />
                            {value ? 'Yoqilgan' : "O'chirilgan"}
                          </label>
                        ) : p.allowed ? (
                          <Tag kind="ok">Rol bilan</Tag>
                        ) : (
                          <Tag kind="mute">Mumkin emas</Tag>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </DataView>
    </div>
  );
}

function UsersTab({ userId, setUser }: { userId: string; setUser: (u: string) => void }) {
  const staff = useApi<{ items: { id: string; fullName: string; role: Role }[] }>('/staff', { status: 'ACTIVE', limit: 200 });
  const options = useMemo(() => (staff.data?.items ?? []).map((s) => ({ value: s.id, label: `${s.fullName} (${ROLE_LABEL[s.role]})` })), [staff.data]);
  return (
    <div className="stack">
      <div className="toolbar">
        <SelectInput label="Xodim" fieldClass="field--grow" value={userId} onChange={(e) => setUser(e.target.value)} options={options} placeholder="Tanlang" />
      </div>
      {userId ? <UserPerms key={userId} userId={userId} /> : <div className="panel"><Empty title="Xodimni tanlang" text="Istisno faqat shu xodimga ta'sir qiladi: rol shablonidan farqli ruxsat berish yoki olish." /></div>}
    </div>
  );
}

function UserPerms({ userId }: { userId: string }) {
  const toast = useToast();
  const state = useApi<{ user: { fullName: string; role: Role }; permissions: UserPerm[] }>(`/permissions/users/${userId}`);
  const [changes, setChanges] = useState<Record<string, boolean | null>>({});
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await api.put(`/permissions/users/${userId}`, { permissions: changes });
      toast('Istisnolar saqlandi');
      setChanges({});
      state.reload();
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <DataView state={state} skeleton={<Skeleton rows={8} cols={2} />}>
      {(d) => {
        const configurable = d.permissions.filter((p) => p.configurable);
        return (
          <div className="stack">
            <div className="row" data-between>
              <p className="muted">
                {d.user.fullName}, {ROLE_LABEL[d.user.role].toLowerCase()}: {configurable.length} ta sozlanadigan ruxsat
              </p>
              <Button variant="primary" busy={busy} disabled={!Object.keys(changes).length} onClick={save}>
                Saqlash
              </Button>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ruxsat</th>
                    <th>Rol shablonida</th>
                    <th>Bu xodim uchun</th>
                  </tr>
                </thead>
                <tbody>
                  {configurable.map((p) => {
                    const cur = p.code in changes ? changes[p.code] : p.override;
                    return (
                      <tr key={p.code}>
                        <td>
                          {p.description}
                          <div className="cell-sub fig">{p.code}</div>
                        </td>
                        <td>{p.template ? <Tag kind="ok">Yoqilgan</Tag> : <Tag kind="mute">O&apos;chirilgan</Tag>}</td>
                        <td>
                          <select
                            className="select"
                            aria-label={`${p.description}: istisno`}
                            value={cur === null || cur === undefined ? '' : cur ? 'on' : 'off'}
                            onChange={(e) => {
                              const v = e.target.value === '' ? null : e.target.value === 'on';
                              setChanges((c) => {
                                const n = { ...c };
                                if (v === p.override) delete n[p.code];
                                else n[p.code] = v;
                                return n;
                              });
                            }}
                          >
                            <option value="">Shablon bo&apos;yicha</option>
                            <option value="on">Ruxsat beriladi</option>
                            <option value="off">Ruxsat yo&apos;q</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      }}
    </DataView>
  );
}
