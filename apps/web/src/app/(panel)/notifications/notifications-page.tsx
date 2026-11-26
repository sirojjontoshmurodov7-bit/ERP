'use client';
import { tr, trMap, useT } from '@/lib/i18n';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { type PickedStudent, StudentPicker } from '@/components/student-picker';
import { Button, DataView, Dialog, Empty, PageHead, Pager, SelectInput, Skeleton, Tag, TextArea, useToast, whenOpen } from '@/components/ui';
import { ApiError, api, errorText } from '@/lib/api';
import { dateTime, money } from '@/lib/format';
import { useSubmit } from '@/lib/forms';
import { useUrlState } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';

interface LogRow {
  id: number;
  userId: string;
  userName: string;
  type: 'DEBT' | 'LESSON' | 'HOMEWORK' | 'PAYROLL' | 'MANUAL';
  status: 'SENT' | 'FAILED';
  error: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}
const TYPE: Record<LogRow['type'], string> = trMap({ DEBT: 'Qarz eslatmasi', LESSON: 'Dars eslatmasi', HOMEWORK: 'Vazifa eslatmasi', PAYROLL: 'Maosh xabari', MANUAL: "Qo'lda xabar" });
const ERR: Record<string, string> = trMap({ BLOCKED: "Foydalanuvchi botni to'sgan", RATE_LIMITED: 'Telegram cheklovi', NETWORK: "Tarmoq xatosi", NOT_CONFIGURED: 'Bot sozlanmagan' });
const LIMIT = 50;

export function NotificationsPage() {
  const t = useT();
  const { is } = useSession();
  const toast = useToast();
  const [f, setF] = useUrlState({ type: '', status: '', offset: '0' });
  const offset = Number(f.offset) || 0;
  const list = useApi<{ items: LogRow[]; total: number }>('/notifications', { type: f.type, status: f.status, limit: LIMIT, offset });
  const link = useApi<{ botConfigured: boolean }>('/notifications/link');
  const [send, setSend] = useState(false);
  const [running, setRunning] = useState(false);

  const runNow = async () => {
    setRunning(true);
    try {
      const r = await api.post<Record<string, { sent: number; failed: number }>>('/notifications/run', {});
      const sent = Object.values(r).reduce((a, x) => a + x.sent, 0);
      const failed = Object.values(r).reduce((a, x) => a + x.failed, 0);
      toast(failed ? tr('Yuborildi: {n}, xato: {m}', { n: sent, m: failed }) : tr('Yuborildi: {n}', { n: sent }));
      list.reload();
    } catch (e) {
      toast(e instanceof ApiError && e.code === 'TELEGRAM_NOT_CONFIGURED' ? 'Telegram bot hali sozlanmagan' : errorText(e), 'error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <PageHead
        title="Telegram xabarlar"
        sub="Eslatmalar faqat Telegram'ni ulagan foydalanuvchilarga boradi. Ulash kodi o'quvchi kartochkasida yoki profil sahifasida."
        actions={
          <>
            {is('OWNER') ? (
              <Button busy={running} onClick={runNow}>
                {t("Eslatmalarni hozir yuborish")}
              </Button>
            ) : null}
            <Button variant="primary" icon={<Icon.send />} onClick={() => setSend(true)}>
              {t("Xabar yuborish")}
            </Button>
          </>
        }
      />
      {link.data && !link.data.botConfigured ? <p className="form-error">{t("Telegram bot hali sozlanmagan: xabarlar yuborilmaydi. Server sozlamasida TELEGRAM_BOT_TOKEN kerak.")}</p> : null}
      <div className="toolbar">
        <SelectInput label="Turi" value={f.type} onChange={(e) => setF({ type: e.target.value })} options={Object.entries(TYPE).map(([value, label]) => ({ value, label }))} placeholder="Hammasi" />
        <SelectInput label="Holat" value={f.status} onChange={(e) => setF({ status: e.target.value })} options={[{ value: 'SENT', label: 'Yuborilgan' }, { value: 'FAILED', label: 'Xato' }]} placeholder="Hammasi" />
      </div>
      <div className="table-wrap">
        <DataView state={list} skeleton={<Skeleton rows={6} cols={4} />} empty={(d) => (d.items.length ? null : <Empty title="Xabar yuborilmagan" text="Avtomatik eslatmalar kuniga bir marta (tashqi cron) yoki rahbar tugmasi bilan yuboriladi." />)}>
          {(d) => (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("Vaqt")}</th>
                    <th>{t("Kimga")}</th>
                    <th>{t("Turi")}</th>
                    <th>{t("Tafsilot")}</th>
                    <th>{t("Holat")}</th>
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((n) => (
                    <tr key={n.id}>
                      <td className="fig">{dateTime(n.createdAt)}</td>
                      <td className="cell-main">{n.userName}</td>
                      <td>{TYPE[n.type]}</td>
                      <td className="muted small">{typeof n.payload.debt === 'number' ? `${money(n.payload.debt)} so'm` : typeof n.payload.total === 'number' ? `${money(n.payload.total)} so'm` : typeof n.payload.length === 'number' ? `${n.payload.length} belgi` : ''}</td>
                      <td>{n.status === 'SENT' ? <Tag kind="ok">{t("Yuborildi")}</Tag> : <Tag kind="bad">{ERR[n.error ?? ''] ?? 'Xato'}</Tag>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pager offset={offset} limit={LIMIT} count={d.items.length} total={d.total} onChange={(o) => setF({ offset: String(o) })} />
            </>
          )}
        </DataView>
      </div>
      <SendDialog open={send} onClose={() => setSend(false)} onDone={list.reload} />
    </>
  );
}

const SendDialog = whenOpen(function SendInner({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const t = useT();
  const toast = useToast();
  const [kind, setKind] = useState<'student' | 'staff'>('student');
  const [student, setStudent] = useState<PickedStudent | null>(null);
  const [staffId, setStaffId] = useState('');
  const [message, setMessage] = useState('');
  const staff = useApi<{ items: { id: string; fullName: string }[] }>(kind === 'staff' ? '/staff' : null, { status: 'ACTIVE', limit: 200 });
  const s = useSubmit();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = kind === 'student' ? student?.id : staffId;
    if (!userId) return s.setError(t('Qabul qiluvchini tanlang'));
    if (!message.trim()) return s.setError(t('Xabar matnini yozing'));
    const r = await s.run(() => api.post('/notifications/send', { userId, message: message.trim() }));
    if (r) {
      toast('Xabar yuborildi');
      onDone();
      onClose();
    }
  };
  return (
    <Dialog open={open} onClose={onClose} title="Telegram xabar" footer={<><Button onClick={onClose}>{t("Bekor qilish")}</Button><Button variant="primary" type="submit" form="send-form" busy={s.busy}>{t("Yuborish")}</Button></>}>
      <form id="send-form" className="form" onSubmit={submit} noValidate>
        <SelectInput label="Kimga" value={kind} onChange={(e) => setKind(e.target.value as 'student' | 'staff')} options={[{ value: 'student', label: "O'quvchi (yoki ota-onasi)" }, { value: 'staff', label: 'Xodim' }]} />
        {kind === 'student' ? <StudentPicker value={student} onChange={setStudent} /> : <SelectInput label="Xodim" value={staffId} onChange={(e) => setStaffId(e.target.value)} options={(staff.data?.items ?? []).map((x) => ({ value: x.id, label: x.fullName }))} placeholder="Tanlang" />}
        <TextArea label="Xabar" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} hint={t('{n}/1000; matn jurnalda saqlanmaydi', { n: message.length })} />
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});
