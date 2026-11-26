'use client';
import { useT } from '@/lib/i18n';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { type PaymentView, Receipt } from '@/components/payment-dialog';
import { Button, Confirm, DataView, PageHead, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';

export function PaymentCard() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const { can, is } = useSession();
  const p = useApi<PaymentView & { reversedBy?: { id: string; receiptNo: number } | null }>(`/payments/${id}`);
  const [reverse, setReverse] = useState(false);
  return (
    <DataView state={p} skeleton={<Skeleton rows={5} cols={2} />}>
      {(d) => (
        <>
          <PageHead
            crumbs={[{ href: '/payments', label: "To'lovlar" }]}
            title={t('Kvitansiya №{n}', { n: d.receiptNo })}
            actions={
              <>
                <Button onClick={() => window.print()}>{t("Chop etish")}</Button>
                {can('payment.reverse') && d.status === 'CONFIRMED' && d.amount > 0 ? (
                  <Button variant="danger" onClick={() => setReverse(true)}>
                    {t("Qaytarish")}
                  </Button>
                ) : null}
              </>
            }
          />
          <div className="receipt-wrap">
            <Receipt p={d} />
          </div>
          {d.status === 'REVERSED' ? <p className="muted">{t("Bu to'lov qaytarilgan: summa teskari yozuv bilan bekor qilingan, tarix o'zgarmaydi.")}</p> : null}
          {d.reversesPaymentId ? (
            <p className="muted">
              {t("Bu")}{' '}
              <Link className="link" href={`/payments/${d.reversesPaymentId}`}>
                {t("asl to'lovni")}
              </Link>{' '}
              {t("qaytarish yozuvi.")}
            </p>
          ) : null}
          {!is('STUDENT') ? (
            <p>
              <Link className="link" href={`/students/${d.studentId}?tab=payments`}>
                {t("O'quvchi kartochkasi")}
              </Link>
            </p>
          ) : null}
          <Confirm
            open={reverse}
            onClose={() => setReverse(false)}
            title={t("№{n} to'lovni qaytarish", { n: d.receiptNo })}
            text="Qaytarish teskari (manfiy) yozuv sifatida saqlanadi va qarz qayta hisoblanadi. Bu amalni bekor qilib bo'lmaydi."
            confirmLabel="Qaytarish"
            danger
            reason={{ label: 'Sabab', required: true }}
            onConfirm={async (reason) => {
              await api.post(`/payments/${d.id}/reverse`, { reason });
              p.reload();
            }}
          />
        </>
      )}
    </DataView>
  );
}
