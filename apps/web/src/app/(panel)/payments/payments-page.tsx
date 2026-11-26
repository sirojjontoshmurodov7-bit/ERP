'use client';
import { useT } from '@/lib/i18n';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons';
import { METHOD_LABEL, PaymentDialog, type PaymentView } from '@/components/payment-dialog';
import { Button, DataView, Empty, PageHead, Pager, SelectInput, Skeleton, Stat, Tag, TextInput } from '@/components/ui';
import { dateTime, money, todayLocal } from '@/lib/format';
import { opts, useBranches, useUrlState } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';

const LIMIT = 50;

export function PaymentsPage() {
  const t = useT();
  const { can, is } = useSession();
  const router = useRouter();
  const [f, setF] = useUrlState({ from: is('STUDENT') ? '' : todayLocal(), to: is('STUDENT') ? '' : todayLocal(), method: '', branchId: '', status: '', offset: '0', new: '' });
  const offset = Number(f.offset) || 0;
  const list = useApi<{ items: PaymentView[] }>('/payments', { from: f.from, to: f.to, method: f.method, branchId: f.branchId, status: f.status, limit: LIMIT, offset });
  const branches = useBranches(!is('STUDENT'));
  const items = list.data?.items ?? [];
  const pageTotal = items.reduce((a, p) => a + p.amount, 0);

  return (
    <>
      <PageHead
        title={is('STUDENT') ? "To'lovlarim" : "To'lovlar"}
        actions={can('payment.create') ? <Button variant="primary" icon={<Icon.cash />} onClick={() => setF({ new: '1' })}>{t("To'lov qabul qilish")}</Button> : null}
      />
      {!is('STUDENT') ? (
        <div className="toolbar">
          <TextInput label="Sanadan" type="date" value={f.from} onChange={(e) => setF({ from: e.target.value })} />
          <TextInput label="Sanagacha" type="date" value={f.to} onChange={(e) => setF({ to: e.target.value })} />
          <SelectInput label="Usul" value={f.method} onChange={(e) => setF({ method: e.target.value })} options={Object.entries(METHOD_LABEL).map(([value, label]) => ({ value, label }))} placeholder="Hammasi" />
          {(branches.data?.items.length ?? 0) > 1 ? <SelectInput label="Filial" value={f.branchId} onChange={(e) => setF({ branchId: e.target.value })} options={opts(branches.data?.items)} placeholder="Hammasi" /> : null}
          <SelectInput label="Holat" value={f.status} onChange={(e) => setF({ status: e.target.value })} options={[{ value: 'CONFIRMED', label: 'Tasdiqlangan' }, { value: 'REVERSED', label: 'Qaytarilgan' }]} placeholder="Hammasi" />
        </div>
      ) : null}
      {!is('STUDENT') && list.data ? (
        <div className="stats">
          <Stat label="Sahifadagi to'lovlar" value={money(items.filter((p) => p.amount > 0).length)} />
          <Stat label="Sahifa jami (qaytarishlar ayirilgan)" value={money(pageTotal)} note="so'm; to'liq hisobot Hisobotlar bo'limida" />
        </div>
      ) : null}
      <div className="table-wrap">
        <DataView state={list} skeleton={<Skeleton rows={6} cols={6} />} empty={(d) => (d.items.length ? null : <Empty title="To'lov yo'q" text={f.from ? 'Tanlangan oraliqda to\'lov qabul qilinmagan.' : undefined} />)}>
          {(d) => (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("Chek")}</th>
                    <th>{t("Vaqt")}</th>
                    {!is('STUDENT') ? <th>{t("O'quvchi")}</th> : null}
                    <th>{t("Usul")}</th>
                    <th>{t("Qabul qildi")}</th>
                    <th className="num">{t("Summa, so'm")}</th>
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((p) => (
                    <tr key={p.id} data-clickable onClick={() => router.push(`/payments/${p.id}`)}>
                      <td className="fig">
                        <Link className="cell-main" href={`/payments/${p.id}`} onClick={(e) => e.stopPropagation()}>
                          №{p.receiptNo}
                        </Link>{' '}
                        {p.reversesPaymentId ? <Tag kind="bad">{t("qaytarish")}</Tag> : p.status === 'REVERSED' ? <Tag kind="mute">{t("qaytarilgan")}</Tag> : null}
                      </td>
                      <td className="fig">{dateTime(p.paidAt)}</td>
                      {!is('STUDENT') ? (
                        <td>
                          <span className="cell-main">{p.studentName}</span>
                          <div className="cell-sub">{p.branchName}</div>
                        </td>
                      ) : null}
                      <td>{METHOD_LABEL[p.method] ?? p.method}</td>
                      <td className="muted">{p.receivedByName}</td>
                      <td className={p.amount < 0 ? 'num debt' : 'num'}>{money(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pager offset={offset} limit={LIMIT} count={d.items.length} onChange={(o) => setF({ offset: String(o) })} />
            </>
          )}
        </DataView>
      </div>
      <PaymentDialog open={f.new === '1'} onClose={() => setF({ new: '' })} onDone={list.reload} />
    </>
  );
}
