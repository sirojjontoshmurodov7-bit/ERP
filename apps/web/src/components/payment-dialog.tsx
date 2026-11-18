'use client';
// To'lov qabul qilish: o'quvchi, summa, usul, filial. Natija kvitansiya (chek raqami va qaysi oylarga taqsimlangani).
import { useState } from 'react';
import { api } from '@/lib/api';
import { dateTime, money, monthLabel } from '@/lib/format';
import { useSubmit } from '@/lib/forms';
import { opts, useBranches } from '@/lib/hooks';
import { useApi } from '@/lib/use-api';
import { type PickedStudent, StudentPicker } from './student-picker';
import { Button, Dialog, MoneyInput, Segmented, SelectInput, TextInput, whenOpen } from './ui';

export interface PaymentView {
  id: string;
  receiptNo: number;
  studentId: string;
  studentName: string;
  branchId: string;
  branchName: string;
  amount: number;
  method: string;
  status: 'CONFIRMED' | 'REVERSED';
  reversesPaymentId: string | null;
  receivedByName: string;
  paidAt: string;
  note: string | null;
  allocated: number;
  unallocated: number;
  allocations?: { chargeId: string; amount: number; periodStart: string; groupName: string }[];
}

export const METHODS = [
  { value: 'CASH', label: 'Naqd' },
  { value: 'CARD', label: 'Karta' },
  { value: 'TRANSFER', label: "O'tkazma" },
] as const;
export const METHOD_LABEL: Record<string, string> = { CASH: 'Naqd', CARD: 'Karta', TRANSFER: "O'tkazma", CLICK: 'Click', PAYME: 'Payme' };

type PaymentDialogProps = { open: boolean; onClose: () => void; onDone: () => void; student?: PickedStudent | null };
export const PaymentDialog = whenOpen(function PaymentDialogInner({ open, onClose, onDone, student }: PaymentDialogProps) {
  const [picked, setPicked] = useState<PickedStudent | null>(student ?? null);
  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH');
  const [branchChoice, setBranchId] = useState('');
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState<PaymentView | null>(null);
  const s = useSubmit();
  const branches = useBranches(open);
  const balance = useApi<{ debt: number; advance: number }>(open && picked ? `/students/${picked.id}/balance` : null);

  const studentBranches = (branches.data?.items ?? []).filter((b) => picked?.branchIds.includes(b.id));
  // bitta filial bo'lsa avtomatik; tanlangan filial o'quvchiga tegishli bo'lmasa (o'quvchi almashgan) bekor
  const branchId = studentBranches.length === 1 ? studentBranches[0]!.id : studentBranches.some((b) => b.id === branchChoice) ? branchChoice : '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!picked) return s.setError("O'quvchini tanlang");
    if (!amount) return s.setError('Summani kiriting');
    const r = await s.run(() => api.post<PaymentView>('/payments', { studentId: picked.id, amount, method, ...(branchId ? { branchId } : {}), ...(note.trim() ? { note: note.trim() } : {}) }));
    if (r) {
      setReceipt(r);
      onDone();
    }
  };

  if (receipt) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title={`Kvitansiya №${receipt.receiptNo}`}
        footer={
          <>
            <Button onClick={() => window.print()}>Chop etish</Button>
            <Button variant="primary" onClick={onClose}>
              Tayyor
            </Button>
          </>
        }
      >
        <Receipt p={receipt} />
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="To'lov qabul qilish"
      footer={
        <>
          <Button onClick={onClose}>Bekor qilish</Button>
          <Button variant="primary" type="submit" form="pay-form" busy={s.busy}>
            Qabul qilish
          </Button>
        </>
      }
    >
      <form id="pay-form" className="form" onSubmit={submit} noValidate>
        <StudentPicker value={picked} onChange={setPicked} error={s.fields.studentId} />
        {picked && balance.data ? (
          <p className="small">
            {balance.data.debt > 0 ? (
              <>
                Qarz: <span className="fig debt">{money(balance.data.debt)}</span> so&apos;m{' '}
                <button type="button" className="link-btn" onClick={() => setAmount(balance.data!.debt)}>
                  To&apos;liq summani qo&apos;yish
                </button>
              </>
            ) : (
              <span className="muted">Qarz yo&apos;q{balance.data.advance ? `, oldindan to'lov ${money(balance.data.advance)} so'm` : ''}</span>
            )}
          </p>
        ) : null}
        <MoneyInput label="Summa" value={amount} onChange={setAmount} error={s.fields.amount} />
        <div className="field">
          <span className="field-label">To&apos;lov usuli</span>
          <Segmented label="To'lov usuli" value={method} onChange={setMethod} options={METHODS.map((m) => ({ value: m.value, label: m.label }))} />
        </div>
        {studentBranches.length > 1 ? <SelectInput label="Filial" value={branchId} onChange={(e) => setBranchId(e.target.value)} options={opts(studentBranches)} placeholder="Tanlang" error={s.fields.branchId} /> : null}
        <TextInput label="Izoh" optional value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});

export function Receipt({ p }: { p: PaymentView }) {
  return (
    <div className="receipt">
      <div className="receipt-head">
        <span className="cell-main">№{p.receiptNo}</span>
        <span className="muted fig">{dateTime(p.paidAt)}</span>
      </div>
      <dl className="kv">
        <dt>O&apos;quvchi</dt>
        <dd>{p.studentName}</dd>
        <dt>Filial</dt>
        <dd>{p.branchName}</dd>
        <dt>Usul</dt>
        <dd>{METHOD_LABEL[p.method] ?? p.method}</dd>
        <dt>Qabul qildi</dt>
        <dd>{p.receivedByName}</dd>
      </dl>
      {p.allocations?.length ? (
        <table className="table">
          <thead>
            <tr>
              <th>Guruh</th>
              <th>Davr</th>
              <th className="num">So&apos;m</th>
            </tr>
          </thead>
          <tbody>
            {p.allocations.map((a) => (
              <tr key={a.chargeId}>
                <td>{a.groupName}</td>
                <td>{monthLabel(a.periodStart.slice(0, 7))}</td>
                <td className="num">{money(a.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {p.unallocated > 0 ? <p className="small muted">Oldindan to&apos;lov (keyingi hisoblarga): {money(p.unallocated)} so&apos;m</p> : null}
      <div className="receipt-head">
        <span className="muted">Jami</span>
        <span className="receipt-total">{money(p.amount)} so&apos;m</span>
      </div>
      {p.status === 'CONFIRMED' && p.amount > 0 ? <span className="stamp" aria-label="To'langan">To&apos;landi</span> : null}
    </div>
  );
}
