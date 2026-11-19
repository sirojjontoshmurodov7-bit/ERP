'use client';
import { useState } from 'react';
import { type Credentials, CredentialsDialog } from '@/components/credentials';
import { Icon } from '@/components/icons';
import { Button, Confirm, DataView, Dialog, Empty, PageHead, Pager, SelectInput, Skeleton, Tag, TextInput, useToast, whenOpen } from '@/components/ui';
import { api, errorText } from '@/lib/api';
import { date, dateTime, tsDate } from '@/lib/format';
import { clean, useSubmit } from '@/lib/forms';
import { useUrlState } from '@/lib/hooks';
import { useApi } from '@/lib/use-api';

interface Center {
  id: string;
  name: string;
  slug: string;
  status: 'TRIAL' | 'ACTIVE' | 'BLOCKED';
  planId: string | null;
  planName: string | null;
  trialEndsAt: string | null;
  blockedAt: string | null;
  blockedReason: string | null;
  createdAt: string;
}
interface Plan {
  id: string;
  name: string;
}
const STATUS = { TRIAL: { label: 'Sinovda', kind: 'warn' as const }, ACTIVE: { label: 'Faol', kind: 'ok' as const }, BLOCKED: { label: 'Bloklangan', kind: 'bad' as const } };
const LIMIT = 50;

export function CentersPage() {
  const toast = useToast();
  const [f, setF] = useUrlState({ status: '', offset: '0', new: '' });
  const offset = Number(f.offset) || 0;
  const list = useApi<{ items: Center[] }>('/admin/centers', { status: f.status, limit: LIMIT, offset });
  const plans = useApi<{ items: Plan[] }>('/admin/plans');
  const [edit, setEdit] = useState<Center | null>(null);
  const [block, setBlock] = useState<Center | null>(null);
  const [creds, setCreds] = useState<Credentials | null>(null);

  const resetOwner = async (c: Center) => {
    try {
      const r = await api.post<{ owner?: { login: string; fullName: string }; user?: { login: string; fullName: string }; login?: string; temporaryPassword: string }>(`/admin/centers/${c.id}/owner/reset-password`, {});
      const who = r.owner ?? r.user;
      setCreds({ fullName: who?.fullName ?? `${c.name} rahbari`, login: who?.login ?? r.login ?? '', temporaryPassword: r.temporaryPassword });
    } catch (e) {
      toast(errorText(e), 'error');
    }
  };

  return (
    <>
      <PageHead title="Markazlar" actions={<Button variant="primary" icon={<Icon.plus />} onClick={() => setF({ new: '1' })}>Yangi markaz</Button>} />
      <div className="toolbar">
        <SelectInput label="Holat" value={f.status} onChange={(e) => setF({ status: e.target.value })} options={Object.entries(STATUS).map(([value, x]) => ({ value, label: x.label }))} placeholder="Hammasi" />
      </div>
      <div className="table-wrap">
        <DataView state={list} skeleton={<Skeleton rows={5} cols={5} />} empty={(d) => (d.items.length ? null : <Empty title="Markaz yo'q" action={<Button size="sm" variant="primary" onClick={() => setF({ new: '1' })}>Yangi markaz</Button>} />)}>
          {(d) => (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Markaz</th>
                    <th>Tarif</th>
                    <th>Sinov tugaydi</th>
                    <th>Ochilgan</th>
                    <th>Holat</th>
                    <th className="actions-cell" aria-label="Amallar" />
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <span className="cell-main">{c.name}</span>
                        <div className="cell-sub fig">{c.slug}</div>
                      </td>
                      <td>{c.planName ?? <span className="muted">{"yo'q"}</span>}</td>
                      <td className="fig">{c.trialEndsAt ? tsDate(c.trialEndsAt) : "yo'q"}</td>
                      <td className="fig muted">{tsDate(c.createdAt)}</td>
                      <td>
                        <Tag kind={STATUS[c.status].kind}>{STATUS[c.status].label}</Tag>
                        {c.blockedReason ? <div className="cell-sub">{c.blockedReason}</div> : null}
                      </td>
                      <td className="actions-cell">
                        <span className="row">
                          <Button size="sm" variant="ghost" onClick={() => setEdit(c)}>
                            Tahrirlash
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => resetOwner(c)}>
                            Rahbar paroli
                          </Button>
                          <Button size="sm" variant={c.status === 'BLOCKED' ? 'ghost' : 'danger'} onClick={() => setBlock(c)}>
                            {c.status === 'BLOCKED' ? 'Blokdan chiqarish' : 'Bloklash'}
                          </Button>
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
      <CreateCenter
        open={f.new === '1'}
        plans={plans.data?.items ?? []}
        onClose={() => setF({ new: '' })}
        onCreated={(c) => {
          setF({ new: '' });
          setCreds(c);
          list.reload();
        }}
      />
      <EditCenter open={edit !== null} center={edit} plans={plans.data?.items ?? []} onClose={() => setEdit(null)} onSaved={list.reload} />
      <Confirm
        open={block !== null}
        onClose={() => setBlock(null)}
        title={block?.status === 'BLOCKED' ? 'Markazni blokdan chiqarish' : 'Markazni bloklash'}
        text={block?.status === 'BLOCKED' ? `${block.name} xodimlari va o'quvchilari yana kira oladi.` : `${block?.name ?? ''}: hamma foydalanuvchilar sessiyasi yopiladi va kira olmaydi. Ma'lumotlar saqlanadi.`}
        confirmLabel={block?.status === 'BLOCKED' ? 'Blokdan chiqarish' : 'Bloklash'}
        danger={block?.status !== 'BLOCKED'}
        reason={block?.status === 'BLOCKED' ? undefined : { label: 'Sabab', required: true }}
        onConfirm={async (reason) => {
          if (block!.status === 'BLOCKED') await api.post(`/admin/centers/${block!.id}/unblock`);
          else await api.post(`/admin/centers/${block!.id}/block`, { reason });
          list.reload();
        }}
      />
      <CredentialsDialog value={creds} onClose={() => setCreds(null)} />
    </>
  );
}

const CreateCenter = whenOpen(function CreateCenterInner({ open, plans, onClose, onCreated }: { open: boolean; plans: Plan[]; onClose: () => void; onCreated: (c: Credentials) => void }) {
  const [v, setV] = useState({ name: '', slug: '', planId: '', trialDays: '14', ownerFullName: '', ownerPhone: '', ownerLogin: '' });
  const s = useSubmit();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { trialDays, ...rest } = v;
    const r = await s.run(() => api.post<{ owner: { login: string; fullName: string; temporaryPassword: string } }>('/admin/centers', { ...clean(rest), trialDays: Number(trialDays) }));
    if (r) onCreated({ fullName: r.owner.fullName, login: r.owner.login, temporaryPassword: r.owner.temporaryPassword });
  };
  return (
    <Dialog open={open} onClose={onClose} title="Yangi markaz" wide footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" type="submit" form="center-form" busy={s.busy}>Yaratish</Button></>}>
      <form id="center-form" className="form" onSubmit={submit} noValidate>
        <p className="muted small">Markaz bilan birga &quot;Asosiy filial&quot; va rahbar akkaunti yaratiladi. Rahbar paroli faqat bir marta ko&apos;rsatiladi.</p>
        <div className="form-grid">
          <TextInput label="Markaz nomi" value={v.name} onChange={set('name')} error={s.fields.name} autoFocus />
          <TextInput label="Slug" optional value={v.slug} onChange={set('slug')} error={s.fields.slug} hint="Loginlar prefiksi; bo'sh qolsa nomdan" autoCapitalize="none" />
          <SelectInput label="Tarif" optional value={v.planId} onChange={set('planId')} options={plans.map((p) => ({ value: p.id, label: p.name }))} placeholder="Biriktirilmagan" />
          <TextInput label="Sinov kunlari" type="number" min={0} max={365} value={v.trialDays} onChange={set('trialDays')} error={s.fields.trialDays} hint="0: darhol faol" />
          <TextInput label="Rahbar ismi" value={v.ownerFullName} onChange={set('ownerFullName')} error={s.fields.ownerFullName} />
          <TextInput label="Rahbar telefoni" optional type="tel" value={v.ownerPhone} onChange={set('ownerPhone')} error={s.fields.ownerPhone} />
          <TextInput label="Rahbar logini" optional value={v.ownerLogin} onChange={set('ownerLogin')} error={s.fields.ownerLogin} hint="Bo'sh qolsa: slug.ism" autoCapitalize="none" />
        </div>
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});

const EditCenter = whenOpen(function EditCenterInner({ open, center, plans, onClose, onSaved }: { open: boolean; center: Center | null; plans: Plan[]; onClose: () => void; onSaved: () => void }) {
  const c = center!;
  const toLocal = (iso: string | null) => (iso ? tsDate(iso).split('.').reverse().join('-') : '');
  const [v, setV] = useState({ name: c.name, planId: c.planId ?? '', trialEnd: toLocal(c.trialEndsAt) });
  const s = useSubmit();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = {};
    if (v.name.trim() !== c.name) body.name = v.name.trim();
    if (v.planId !== (c.planId ?? '')) body.planId = v.planId || null;
    if (v.trialEnd !== toLocal(c.trialEndsAt)) body.trialEndsAt = v.trialEnd ? new Date(`${v.trialEnd}T23:59:59+05:00`).toISOString() : null;
    if (!Object.keys(body).length) return onClose();
    const r = await s.run(() => api.patch(`/admin/centers/${c.id}`, body));
    if (r) {
      onSaved();
      onClose();
    }
  };
  return (
    <Dialog open={open} onClose={onClose} title={`${c.name}: tahrirlash`} footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" type="submit" form="edit-center" busy={s.busy}>Saqlash</Button></>}>
      <form id="edit-center" className="form" onSubmit={submit} noValidate>
        <TextInput label="Nomi" value={v.name} onChange={set('name')} error={s.fields.name} />
        <SelectInput label="Tarif" value={v.planId} onChange={set('planId')} options={plans.map((p) => ({ value: p.id, label: p.name }))} placeholder="Biriktirilmagan" />
        <TextInput label="Sinov muddati tugashi" optional type="date" value={v.trialEnd} onChange={set('trialEnd')} hint={c.trialEndsAt ? `Hozir: ${date(c.trialEndsAt.slice(0, 10))}` : undefined} />
        <p className="small muted">Ochilgan: {dateTime(c.createdAt)}</p>
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});
