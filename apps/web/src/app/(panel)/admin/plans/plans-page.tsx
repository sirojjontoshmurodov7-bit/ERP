'use client';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button, DataView, Dialog, Empty, MoneyInput, PageHead, Skeleton, TextInput, whenOpen } from '@/components/ui';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { useSubmit } from '@/lib/forms';
import { useApi } from '@/lib/use-api';

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  maxStudents: number | null;
  maxBranches: number | null;
  features: Record<string, boolean | number | string>;
  centers?: number;
}
const limit = (n: number | null) => (n === null ? 'cheksiz' : money(n));

export function PlansPage() {
  const list = useApi<{ items: Plan[] }>('/admin/plans');
  const [edit, setEdit] = useState<Plan | 'new' | null>(null);
  return (
    <>
      <PageHead title="Tariflar" sub="Tarif chegaralari faqat yangi o'quvchi va filial qo'shishni to'sadi; mavjudlariga tegmaydi." actions={<Button variant="primary" icon={<Icon.plus />} onClick={() => setEdit('new')}>Yangi tarif</Button>} />
      <div className="table-wrap">
        <DataView state={list} skeleton={<Skeleton rows={3} cols={5} />} empty={(d) => (d.items.length ? null : <Empty title="Tarif yo'q" action={<Button size="sm" variant="primary" onClick={() => setEdit('new')}>Yangi tarif</Button>} />)}>
          {(d) => (
            <table className="table">
              <thead>
                <tr>
                  <th>Tarif</th>
                  <th className="num">Oylik narx, so&apos;m</th>
                  <th className="num">O&apos;quvchilar</th>
                  <th className="num">Filiallar</th>
                  <th className="num">Markazlar</th>
                  <th className="actions-cell" aria-label="Amallar" />
                </tr>
              </thead>
              <tbody>
                {d.items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="cell-main">{p.name}</span>
                      {Object.keys(p.features).length ? <div className="cell-sub">{Object.entries(p.features).map(([k, v]) => (v === true ? k : `${k}: ${String(v)}`)).join(', ')}</div> : null}
                    </td>
                    <td className="num">{money(p.priceMonthly)}</td>
                    <td className="num">{limit(p.maxStudents)}</td>
                    <td className="num">{limit(p.maxBranches)}</td>
                    <td className="num">{p.centers ?? 0}</td>
                    <td className="actions-cell">
                      <Button size="sm" variant="ghost" onClick={() => setEdit(p)}>
                        Tahrirlash
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DataView>
      </div>
      <PlanDialog open={edit !== null} plan={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onSaved={list.reload} />
    </>
  );
}

const PlanDialog = whenOpen(function PlanInner({ open, plan, onClose, onSaved }: { open: boolean; plan: Plan | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(plan?.name ?? '');
  const [price, setPrice] = useState<number | ''>(plan?.priceMonthly ?? 0);
  const [maxStudents, setMaxStudents] = useState<number | ''>(plan?.maxStudents ?? '');
  const [maxBranches, setMaxBranches] = useState<number | ''>(plan?.maxBranches ?? '');
  const [features, setFeatures] = useState(plan ? Object.entries(plan.features).filter(([, v]) => v === true).map(([k]) => k).join(', ') : '');
  const s = useSubmit();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const feats = Object.fromEntries(
      features
        .split(',')
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean)
        .map((k) => [k, true]),
    );
    const body = { name: name.trim(), priceMonthly: price === '' ? 0 : price, maxStudents: maxStudents === '' ? null : maxStudents, maxBranches: maxBranches === '' ? null : maxBranches, features: { ...Object.fromEntries(Object.entries(plan?.features ?? {}).filter(([, v]) => v !== true)), ...feats } };
    const r = await s.run(() => (plan ? api.patch(`/admin/plans/${plan.id}`, body) : api.post('/admin/plans', body)));
    if (r) {
      onSaved();
      onClose();
    }
  };
  return (
    <Dialog open={open} onClose={onClose} title={plan ? 'Tarifni tahrirlash' : 'Yangi tarif'} footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" type="submit" form="plan-form" busy={s.busy}>Saqlash</Button></>}>
      <form id="plan-form" className="form" onSubmit={submit} noValidate>
        <TextInput label="Nomi" value={name} onChange={(e) => setName(e.target.value)} error={s.fields.name} autoFocus />
        <MoneyInput label="Oylik narx" value={price} onChange={setPrice} error={s.fields.priceMonthly} />
        <MoneyInput label="O'quvchilar chegarasi" optional value={maxStudents} onChange={setMaxStudents} error={s.fields.maxStudents} hint="Bo'sh: cheksiz" />
        <MoneyInput label="Filiallar chegarasi" optional value={maxBranches} onChange={setMaxBranches} error={s.fields.maxBranches} hint="Bo'sh: cheksiz" />
        <TextInput label="Imkoniyatlar" optional value={features} onChange={(e) => setFeatures(e.target.value)} error={s.fields.features} hint="Vergul bilan: telegram, reports (kichik lotin harf)" />
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});
