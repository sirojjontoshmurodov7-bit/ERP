'use client';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button, Confirm, DataView, Dialog, Empty, MoneyInput, PageHead, Pager, SelectInput, Skeleton, Stat, Tag, TextInput, whenOpen } from '@/components/ui';
import { api } from '@/lib/api';
import { date, money, todayLocal } from '@/lib/format';
import { clean, useSubmit } from '@/lib/forms';
import { opts, useBranches, useUrlState } from '@/lib/hooks';
import { useApi } from '@/lib/use-api';

interface Expense {
  id: string;
  branchId: string;
  branchName: string;
  category: string;
  amount: number;
  note: string | null;
  spentOn: string;
  status: 'ACTIVE' | 'VOIDED';
  voidReason: string | null;
  voidedByName: string | null;
  createdByName: string;
}
const LIMIT = 50;
const monthStart = () => `${todayLocal().slice(0, 7)}-01`;

export function ExpensesPage() {
  const [f, setF] = useUrlState({ from: monthStart(), to: todayLocal(), category: '', branchId: '', status: 'ACTIVE', offset: '0', new: '' });
  const offset = Number(f.offset) || 0;
  const list = useApi<{ items: Expense[] }>('/expenses', { from: f.from, to: f.to, category: f.category, branchId: f.branchId, status: f.status, limit: LIMIT, offset });
  const cats = useApi<{ items: { category: string; count: number; amount: number }[] }>('/expenses/categories');
  const branches = useBranches();
  const [voiding, setVoiding] = useState<Expense | null>(null);
  const total = (list.data?.items ?? []).filter((e) => e.status === 'ACTIVE').reduce((a, e) => a + e.amount, 0);

  return (
    <>
      <PageHead title="Xarajatlar" actions={<Button variant="primary" icon={<Icon.plus />} onClick={() => setF({ new: '1' })}>Xarajat qo&apos;shish</Button>} />
      <div className="toolbar">
        <TextInput label="Sanadan" type="date" value={f.from} onChange={(e) => setF({ from: e.target.value })} />
        <TextInput label="Sanagacha" type="date" value={f.to} onChange={(e) => setF({ to: e.target.value })} />
        <SelectInput label="Turkum" value={f.category} onChange={(e) => setF({ category: e.target.value })} options={(cats.data?.items ?? []).map((c) => ({ value: c.category, label: c.category }))} placeholder="Hammasi" />
        {(branches.data?.items.length ?? 0) > 1 ? <SelectInput label="Filial" value={f.branchId} onChange={(e) => setF({ branchId: e.target.value })} options={opts(branches.data?.items)} placeholder="Hammasi" /> : null}
        <SelectInput label="Holat" value={f.status} onChange={(e) => setF({ status: e.target.value })} options={[{ value: 'ACTIVE', label: 'Amalda' }, { value: 'VOIDED', label: 'Bekor qilingan' }]} placeholder="Hammasi" />
      </div>
      {list.data ? (
        <div className="stats">
          <Stat label="Sahifadagi amaldagi xarajatlar" value={money(total)} note="so'm" />
        </div>
      ) : null}
      <div className="table-wrap">
        <DataView state={list} skeleton={<Skeleton rows={5} cols={5} />} empty={(d) => (d.items.length ? null : <Empty title="Xarajat yo'q" text="Tanlangan oraliqda xarajat yozilmagan." />)}>
          {(d) => (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Sana</th>
                    <th>Turkum</th>
                    <th>Izoh</th>
                    <th>Filial</th>
                    <th>Kiritdi</th>
                    <th className="num">Summa, so&apos;m</th>
                    <th className="actions-cell" aria-label="Amallar" />
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((e) => (
                    <tr key={e.id}>
                      <td className="fig">{date(e.spentOn)}</td>
                      <td className="cell-main">{e.category}</td>
                      <td className="muted">
                        {e.note ?? ''}
                        {e.status === 'VOIDED' ? <div className="cell-sub">Bekor qilindi: {e.voidReason} ({e.voidedByName})</div> : null}
                      </td>
                      <td className="muted">{e.branchName}</td>
                      <td className="muted">{e.createdByName}</td>
                      <td className="num">{e.status === 'VOIDED' ? <s>{money(e.amount)}</s> : money(e.amount)}</td>
                      <td className="actions-cell">
                        {e.status === 'ACTIVE' ? (
                          <Button size="sm" variant="ghost" onClick={() => setVoiding(e)}>
                            Bekor qilish
                          </Button>
                        ) : (
                          <Tag kind="mute">Bekor</Tag>
                        )}
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
      <ExpenseDialog
        open={f.new === '1'}
        categories={(cats.data?.items ?? []).map((c) => c.category)}
        onClose={() => setF({ new: '' })}
        onSaved={() => {
          setF({ new: '' });
          list.reload();
          cats.reload();
        }}
      />
      <Confirm
        open={voiding !== null}
        onClose={() => setVoiding(null)}
        title="Xarajatni bekor qilish"
        text={`${voiding?.category ?? ''}, ${money(voiding?.amount)} so'm. Yozuv o'chirilmaydi: bekor qilingan deb belgilanadi va hisobotlardan chiqadi.`}
        confirmLabel="Bekor qilish"
        danger
        reason={{ label: 'Sabab', required: true }}
        onConfirm={async (reason) => {
          await api.post(`/expenses/${voiding!.id}/void`, { reason });
          list.reload();
        }}
      />
    </>
  );
}

const ExpenseDialog = whenOpen(function ExpenseDialogInner({ open, categories, onClose, onSaved }: { open: boolean; categories: string[]; onClose: () => void; onSaved: () => void }) {
  const branches = useBranches();
  const [v, setV] = useState({ category: '', note: '', spentOn: todayLocal(), branchId: '' });
  const [amount, setAmount] = useState<number | ''>('');
  const s = useSubmit();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  const branchId = v.branchId || (branches.data?.items.length === 1 ? branches.data.items[0]!.id : '');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return s.setError('Summani kiriting');
    const r = await s.run(() => api.post('/expenses', { ...clean({ ...v, branchId }), amount }));
    if (r) onSaved();
  };
  return (
    <Dialog open={open} onClose={onClose} title="Xarajat qo'shish" footer={<><Button onClick={onClose}>Bekor qilish</Button><Button variant="primary" type="submit" form="expense-form" busy={s.busy}>Saqlash</Button></>}>
      <form id="expense-form" className="form" onSubmit={submit} noValidate>
        <TextInput label="Turkum" value={v.category} onChange={set('category')} error={s.fields.category} list="expense-cats" placeholder="Ijara, kommunal, reklama..." autoFocus />
        <datalist id="expense-cats">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <MoneyInput label="Summa" value={amount} onChange={setAmount} error={s.fields.amount} />
        <TextInput label="Sana" type="date" value={v.spentOn} max={todayLocal()} onChange={set('spentOn')} error={s.fields.spentOn} />
        {(branches.data?.items.length ?? 0) > 1 ? <SelectInput label="Filial" value={branchId} onChange={set('branchId')} options={opts(branches.data?.items)} placeholder="Tanlang" error={s.fields.branchId} /> : null}
        <TextInput label="Izoh" optional value={v.note} onChange={set('note')} maxLength={200} />
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});
