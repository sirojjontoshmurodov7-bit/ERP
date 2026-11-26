'use client';
import { useT } from '@/lib/i18n';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { type Credentials, CredentialsDialog } from '@/components/credentials';
import { Icon } from '@/components/icons';
import { PaymentDialog, type PaymentView, METHOD_LABEL } from '@/components/payment-dialog';
import { Button, Confirm, DataView, Dialog, Empty, ErrorState, MoneyInput, PageHead, SelectInput, Skeleton, Stat, Tag, TextArea, TextInput, useToast, whenOpen } from '@/components/ui';
import { api } from '@/lib/api';
import { date, dateTime, money, monthLabel, todayLocal } from '@/lib/format';
import { clean, useSubmit } from '@/lib/forms';
import { useGroupsLite, useUrlState } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { ATT_LABEL } from '@/lib/labels';
import { useApi } from '@/lib/use-api';
import { ENROLL_STATUS, type Enrollment, type Student } from '../types';

interface Balance {
  charged: number;
  allocated: number;
  debt: number;
  advance: number;
  paymentsTotal: number;
}
interface Charge {
  id: string;
  groupName: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  baseAmount: number;
  discountAmount: number;
  amount: number;
  status: 'OPEN' | 'PARTIAL' | 'PAID' | 'CANCELLED';
  kind: string;
}
interface AttRow {
  lessonId: string;
  lessonDate: string;
  groupName: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  note: string | null;
}

const CHARGE_STATUS: Record<Charge['status'], { label: string; kind: 'ok' | 'warn' | 'bad' | 'mute' }> = {
  OPEN: { label: "To'lanmagan", kind: 'bad' },
  PARTIAL: { label: 'Qisman', kind: 'warn' },
  PAID: { label: "To'langan", kind: 'ok' },
  CANCELLED: { label: 'Bekor qilingan', kind: 'mute' },
};

export function StudentCard() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const { can } = useSession();
  const toast = useToast();
  const st = useApi<Student>(`/students/${id}`);
  const bal = useApi<Balance>(can('payment.view') || can('debtors.view') ? `/students/${id}/balance` : null);
  const [tab, setTab] = useUrlState({ tab: 'groups' });
  const [edit, setEdit] = useState(false);
  const [pay, setPay] = useState(false);
  const [archive, setArchive] = useState(false);
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [rev, setRev] = useState(0); // to'lov/yozilishdan keyin tablarni yangilash
  const [tgCode, setTgCode] = useState<{ code: string; deepLink: string | null; expiresAt: string } | null>(null);

  if (st.error) return <ErrorState error={st.error} onRetry={st.reload} />;
  if (!st.data) return <Skeleton />;
  const s = st.data;
  const tabs = [
    { key: 'groups', label: 'Guruhlar' },
    ...(can('payment.view') ? [{ key: 'charges', label: 'Hisoblar' }, { key: 'payments', label: "To'lovlar" }] : []),
    ...(can('attendance.view') ? [{ key: 'attendance', label: 'Davomat' }] : []),
    { key: 'info', label: "Ma'lumot" },
  ];

  const resetPassword = async () => {
    try {
      const r = await api.post<{ user: { login: string; fullName: string }; temporaryPassword: string }>(`/users/${s.id}/reset-password`);
      setCreds({ fullName: r.user.fullName, login: r.user.login, temporaryPassword: r.temporaryPassword });
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };
  const telegramCode = async () => {
    try {
      setTgCode(await api.post(`/users/${s.id}/telegram/link-code`));
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  return (
    <>
      <PageHead
        crumbs={[{ href: '/students', label: "O'quvchilar" }]}
        title={s.fullName}
        sub={
          <span className="row">
            <span className="fig">{s.login}</span>
            {s.status !== 'ACTIVE' ? <Tag kind="mute">{t("Arxivda")}</Tag> : s.mustChangePassword ? <Tag kind="mute">{t("Hali kirmagan")}</Tag> : null}
          </span>
        }
        actions={
          <>
            {can('payment.create') && s.status === 'ACTIVE' ? (
              <Button variant="primary" icon={<Icon.cash />} onClick={() => setPay(true)}>
                {t("To'lov qabul qilish")}
              </Button>
            ) : null}
            {can('student.edit') ? <Button onClick={() => setEdit(true)}>{t("Tahrirlash")}</Button> : null}
            {can('user.reset_password') && s.status === 'ACTIVE' ? <Button onClick={resetPassword}>{t("Parolni tiklash")}</Button> : null}
            {can('telegram.settings') && s.status === 'ACTIVE' ? <Button onClick={telegramCode}>{t("Telegram kodi")}</Button> : null}
            {can('student.archive') ? (
              <Button variant="ghost" onClick={() => setArchive(true)}>
                {s.status === 'ACTIVE' ? t('Arxivlash') : t('Arxivdan qaytarish')}
              </Button>
            ) : null}
          </>
        }
      />

      {bal.data ? (
        <div className="stats">
          <Stat label="Qarz" value={money(bal.data.debt)} note="so'm" tone={bal.data.debt > 0 ? 'debt' : undefined} />
          <Stat label="Oldindan to'lov" value={money(bal.data.advance)} note="so'm" />
          <Stat label="Jami hisoblangan" value={money(bal.data.charged)} />
          <Stat label="Jami to'langan" value={money(bal.data.paymentsTotal)} />
        </div>
      ) : null}

      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.key} type="button" role="tab" className="tab" aria-selected={tab.tab === t.key} onClick={() => setTab({ tab: t.key })}>
            {t.label}
          </button>
        ))}
      </div>

      {tab.tab === 'groups' ? <GroupsTab key={rev} student={s} onChange={() => bal.reload()} /> : null}
      {tab.tab === 'charges' ? <ChargesTab key={rev} studentId={s.id} /> : null}
      {tab.tab === 'payments' ? <PaymentsTab key={rev} studentId={s.id} /> : null}
      {tab.tab === 'attendance' ? <AttendanceTab studentId={s.id} /> : null}
      {tab.tab === 'info' ? <InfoTab s={s} /> : null}

      <EditStudent open={edit} student={s} onClose={() => setEdit(false)} onSaved={() => st.reload()} />
      <PaymentDialog
        open={pay}
        onClose={() => setPay(false)}
        onDone={() => {
          bal.reload();
          setRev((r) => r + 1);
        }}
        student={{ id: s.id, fullName: s.fullName, login: s.login, phone: s.phone, branchIds: s.branchIds }}
      />
      <Confirm
        open={archive}
        onClose={() => setArchive(false)}
        title={s.status === 'ACTIVE' ? t("O'quvchini arxivlash") : t('Arxivdan qaytarish')}
        text={s.status === 'ACTIVE' ? t("O'quvchi tizimga kira olmaydi va ro'yxatlarda ko'rinmaydi. Ma'lumotlari va to'lov tarixi saqlanadi; keyin qaytarish mumkin.") : t("O'quvchi yana faol bo'ladi va tizimga kira oladi.")}
        confirmLabel={s.status === 'ACTIVE' ? t('Arxivlash') : t('Qaytarish')}
        danger={s.status === 'ACTIVE'}
        onConfirm={async () => {
          await api.post(`/students/${s.id}/${s.status === 'ACTIVE' ? 'archive' : 'unarchive'}`);
          st.reload();
        }}
      />
      <CredentialsDialog value={creds} onClose={() => setCreds(null)} />
      <Dialog open={tgCode !== null} onClose={() => setTgCode(null)} title="Telegram'ga ulash" footer={<Button variant="primary" onClick={() => setTgCode(null)}>{t("Tayyor")}</Button>}>
        {tgCode ? (
          <div className="stack">
            <p>{t("O'quvchi yoki ota-ona botga quyidagi kodni yuborsin. Kod {time} gacha (15 daqiqa) amal qiladi.", { time: dateTime(tgCode.expiresAt).slice(11) })}</p>
            <span className="code-box">/start {tgCode.code}</span>
            {tgCode.deepLink ? (
              <a className="link" href={tgCode.deepLink} target="_blank" rel="noreferrer">
                {t("Botni ochish havolasi")}
              </a>
            ) : null}
          </div>
        ) : null}
      </Dialog>
    </>
  );
}

function GroupsTab({ student, onChange }: { student: Student; onChange: () => void }) {
  const t = useT();
  const { can } = useSession();
  const list = useApi<{ items: Enrollment[] }>('/enrollments', { studentId: student.id, limit: 100 });
  const [enroll, setEnroll] = useState(false);
  const [action, setAction] = useState<{ kind: 'freeze' | 'unfreeze' | 'leave' | 'transfer' | 'discount'; e: Enrollment } | null>(null);
  const done = () => {
    setAction(null);
    list.reload();
    onChange();
  };
  return (
    <section className="stack">
      {can('enrollment.manage') && student.status === 'ACTIVE' ? (
        <div className="actions">
          <Button icon={<Icon.plus />} onClick={() => setEnroll(true)}>
            {t("Guruhga yozish")}
          </Button>
        </div>
      ) : null}
      <div className="table-wrap">
        <DataView state={list} skeleton={<Skeleton rows={2} />} empty={(d) => (d.items.length ? null : <Empty title="Guruhga yozilmagan" text="O'quvchini guruhga yozing: birinchi hisob avtomatik yaratiladi." />)}>
          {(d) => (
            <table className="table">
              <thead>
                <tr>
                  <th>{t("Guruh")}</th>
                  <th>{t("Qo'shilgan")}</th>
                  <th>{t("Holat")}</th>
                  <th className="num">{t("Maxsus narx")}</th>
                  {can('enrollment.manage') ? <th className="actions-cell" aria-label={t("Amallar")} /> : null}
                </tr>
              </thead>
              <tbody>
                {d.items.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Link className="cell-main" href={`/groups/${e.groupId}`}>
                        {e.groupName}
                      </Link>
                      <div className="cell-sub">
                        {e.courseName}, {e.branchName}
                      </div>
                    </td>
                    <td className="fig">
                      {date(e.joinedAt)}
                      {e.leftAt ? <div className="cell-sub">{t('chiqdi {date}', { date: date(e.leftAt) })}</div> : null}
                    </td>
                    <td>
                      <Tag kind={ENROLL_STATUS[e.status].kind}>{ENROLL_STATUS[e.status].label}</Tag>
                    </td>
                    <td className="num">{e.priceOverride !== null ? money(e.priceOverride) : t("yo'q")}</td>
                    {can('enrollment.manage') ? (
                      <td className="actions-cell">
                        {e.status !== 'LEFT' ? (
                          <span className="row">
                            {e.status === 'ACTIVE' ? (
                              <Button size="sm" variant="ghost" onClick={() => setAction({ kind: 'freeze', e })}>
                                {t("Muzlatish")}
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => setAction({ kind: 'unfreeze', e })}>
                                {t("Davom ettirish")}
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => setAction({ kind: 'transfer', e })}>
                              {t("Ko'chirish")}
                            </Button>
                            {can('discount.grant') ? (
                              <Button size="sm" variant="ghost" onClick={() => setAction({ kind: 'discount', e })}>
                                {t("Chegirma")}
                              </Button>
                            ) : null}
                            <Button size="sm" variant="danger" onClick={() => setAction({ kind: 'leave', e })}>
                              {t("Chiqarish")}
                            </Button>
                          </span>
                        ) : null}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DataView>
      </div>
      <EnrollDialog open={enroll} student={student} onClose={() => setEnroll(false)} onDone={done} />
      <Confirm
        open={action?.kind === 'freeze'}
        onClose={() => setAction(null)}
        title="Yozilishni muzlatish"
        text={t('{group}: muzlatilgan davrda yangi hisob yaratilmaydi. Davom ettirilganda hisob yana boshlanadi.', { group: action?.e.groupName ?? '' })}
        confirmLabel="Muzlatish"
        onConfirm={async () => {
          await api.post(`/enrollments/${action!.e.id}/freeze`);
          done();
        }}
      />
      <Confirm
        open={action?.kind === 'unfreeze'}
        onClose={() => setAction(null)}
        title="Davom ettirish"
        text={t("{group}: o'quvchi yana faol bo'ladi va hisob qayta boshlanadi.", { group: action?.e.groupName ?? '' })}
        confirmLabel="Davom ettirish"
        onConfirm={async () => {
          await api.post(`/enrollments/${action!.e.id}/unfreeze`);
          done();
        }}
      />
      <Confirm
        open={action?.kind === 'leave'}
        onClose={() => setAction(null)}
        title="Guruhdan chiqarish"
        text={t('{group}: bugundan boshlab yangi hisob yaratilmaydi. Mavjud qarz saqlanadi.', { group: action?.e.groupName ?? '' })}
        confirmLabel="Chiqarish"
        danger
        reason={{ label: 'Sabab' }}
        onConfirm={async (reason) => {
          await api.post(`/enrollments/${action!.e.id}/leave`, reason ? { reason } : {});
          done();
        }}
      />
      <TransferDialog value={action?.kind === 'transfer' ? action.e : null} onClose={() => setAction(null)} onDone={done} />
      <DiscountDialog value={action?.kind === 'discount' ? action.e : null} onClose={() => setAction(null)} onDone={done} />
    </section>
  );
}

const EnrollDialog = whenOpen(function EnrollDialogInner({ open, student, onClose, onDone }: { open: boolean; student: Student; onClose: () => void; onDone: () => void }) {
  const t = useT();
  const groups = useGroupsLite(open);
  const [groupId, setGroupId] = useState('');
  const [joinedAt, setJoinedAt] = useState(todayLocal());
  const s = useSubmit();
  const options = (groups.data?.items ?? []).filter((g) => g.status !== 'FINISHED' && !g.archivedAt && student.branchIds.includes(g.branchId));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return s.setError(t('Guruhni tanlang'));
    const r = await s.run(() => api.post('/enrollments', { groupId, studentId: student.id, joinedAt }));
    if (r) onDone();
  };
  return (
    <Dialog open={open} onClose={onClose} title="Guruhga yozish" footer={<><Button onClick={onClose}>{t("Bekor qilish")}</Button><Button variant="primary" type="submit" form="enroll-form" busy={s.busy}>{t("Yozish")}</Button></>}>
      <form id="enroll-form" className="form" onSubmit={submit} noValidate>
        <SelectInput label="Guruh" value={groupId} onChange={(e) => setGroupId(e.target.value)} options={options.map((g) => ({ value: g.id, label: `${g.name} (${g.courseName})` }))} placeholder="Tanlang" hint="O'quvchi filialidagi guruhlar" />
        <TextInput label="Qo'shilgan sana" type="date" value={joinedAt} max={todayLocal()} onChange={(e) => setJoinedAt(e.target.value)} error={s.fields.joinedAt} hint="Birinchi hisob shu sanadan boshlanadi" />
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});

type ValueDialog = { value: Enrollment | null; onClose: () => void; onDone: () => void };
function TransferDialog(p: ValueDialog) {
  return p.value ? <TransferInner {...p} value={p.value} /> : null;
}
function TransferInner({ value, onClose, onDone }: ValueDialog & { value: Enrollment }) {
  const t = useT();
  const open = true;
  const groups = useGroupsLite(open);
  const [toGroupId, setTo] = useState('');
  const [reason, setReason] = useState('');
  const s = useSubmit();
  const options = (groups.data?.items ?? []).filter((g) => g.id !== value.groupId && g.status !== 'FINISHED' && !g.archivedAt);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toGroupId) return s.setError(t('Yangi guruhni tanlang'));
    const r = await s.run(() => api.post(`/enrollments/${value.id}/transfer`, clean({ toGroupId, reason })));
    if (r) onDone();
  };
  return (
    <Dialog open={open} onClose={onClose} title="Boshqa guruhga ko'chirish" footer={<><Button onClick={onClose}>{t("Bekor qilish")}</Button><Button variant="primary" type="submit" form="transfer-form" busy={s.busy}>{t("Ko'chirish")}</Button></>}>
      <form id="transfer-form" className="form" onSubmit={submit} noValidate>
        <p className="muted">
          {t('{group} guruhidan bugungi sana bilan chiqariladi va yangi guruhga yoziladi.', { group: value.groupName })}
        </p>
        <SelectInput label="Yangi guruh" value={toGroupId} onChange={(e) => setTo(e.target.value)} options={options.map((g) => ({ value: g.id, label: `${g.name} (${g.branchName})` }))} placeholder="Tanlang" />
        <TextInput label="Sabab" optional value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
}

interface Discount {
  id: string;
  type: 'PERCENT' | 'AMOUNT' | 'FREE';
  value: number | null;
  reason: string;
  fromDate: string | null;
  toDate: string | null;
  active: boolean;
}
function DiscountDialog(p: ValueDialog) {
  return p.value ? <DiscountInner {...p} value={p.value} /> : null;
}
function DiscountInner({ value, onClose, onDone }: ValueDialog & { value: Enrollment }) {
  const t = useT();
  const open = true;
  const list = useApi<{ items: Discount[] }>(`/enrollments/${value.id}/discounts`);
  const [type, setType] = useState<'PERCENT' | 'AMOUNT' | 'FREE'>('PERCENT');
  const [amount, setAmount] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [fromDate, setFrom] = useState('');
  const [toDate, setToD] = useState('');
  const s = useSubmit();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = clean({ type, value: type === 'FREE' ? undefined : amount, reason, fromDate, toDate });
    const r = await s.run(() => api.post(`/enrollments/${value.id}/discounts`, body));
    if (r) onDone();
  };
  const end = async (id: string) => {
    await s.run(() => api.post(`/discounts/${id}/end`, {}));
    list.reload();
  };
  return (
    <Dialog open={open} onClose={onClose} title={t('Chegirma: {group}', { group: value.groupName })} wide footer={<><Button onClick={onClose}>{t("Yopish")}</Button><Button variant="primary" type="submit" form="discount-form" busy={s.busy}>{t("Chegirma berish")}</Button></>}>
      <div className="stack">
        <DataView state={list} skeleton={<Skeleton rows={1} />} empty={(d) => (d.items.length ? null : <p className="muted">{t("Bu yozilishda chegirma yo'q.")}</p>)}>
          {(d) => (
            <table className="table">
              <thead>
                <tr>
                  <th>{t("Chegirma")}</th>
                  <th>{t("Sabab")}</th>
                  <th>{t("Muddat")}</th>
                  <th className="actions-cell" aria-label={t("Amallar")} />
                </tr>
              </thead>
              <tbody>
                {d.items.map((x) => (
                  <tr key={x.id}>
                    <td className="fig">{x.type === 'PERCENT' ? `${x.value}%` : x.type === 'AMOUNT' ? `${money(x.value)} ${t("so'm")}` : t('Bepul')}</td>
                    <td>{x.reason}</td>
                    <td className="fig">
                      {x.fromDate ? `${date(x.fromDate)} dan` : 'boshidan'} {x.toDate ? `${date(x.toDate)} gacha` : 'muddatsiz'}
                    </td>
                    <td className="actions-cell">
                      {x.active ? (
                        <Button size="sm" variant="ghost" onClick={() => end(x.id)}>
                          {t("Tugatish")}
                        </Button>
                      ) : (
                        <Tag kind="mute">{t("Tugagan")}</Tag>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DataView>
        <form id="discount-form" className="form" onSubmit={submit} noValidate>
          <div className="form-grid">
            <SelectInput
              label="Turi"
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              options={[
                { value: 'PERCENT', label: 'Foiz' },
                { value: 'AMOUNT', label: "Summa (so'm)" },
                { value: 'FREE', label: 'Bepul' },
              ]}
            />
            {type === 'PERCENT' ? <TextInput label="Foiz" type="number" min={1} max={100} value={amount} onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))} error={s.fields.value} /> : null}
            {type === 'AMOUNT' ? <MoneyInput label="Har oy chegiriladi" value={amount} onChange={setAmount} error={s.fields.value} /> : null}
            <TextInput label="Sabab" fieldClass="span-2" value={reason} onChange={(e) => setReason(e.target.value)} error={s.fields.reason} maxLength={300} />
            <TextInput label="Boshlanish" optional type="date" value={fromDate} onChange={(e) => setFrom(e.target.value)} hint="Shu sanadan keyingi hisoblarga" />
            <TextInput label="Tugash" optional type="date" value={toDate} onChange={(e) => setToD(e.target.value)} />
          </div>
          {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
        </form>
      </div>
    </Dialog>
  );
}

function ChargesTab({ studentId }: { studentId: string }) {
  const t = useT();
  const list = useApi<{ items: Charge[] }>('/charges', { studentId, limit: 100 });
  return (
    <div className="table-wrap">
      <DataView state={list} skeleton={<Skeleton rows={4} />} empty={(d) => (d.items.length ? null : <Empty title="Hisob yo'q" text="O'quvchi guruhga yozilgach, oylik hisoblar shu yerda paydo bo'ladi." />)}>
        {(d) => (
          <table className="table">
            <thead>
              <tr>
                <th>{t("Davr")}</th>
                <th>{t("Guruh")}</th>
                <th>{t("Muddat")}</th>
                <th className="num">{t("Narx")}</th>
                <th className="num">{t("Chegirma")}</th>
                <th className="num">{t("Hisob, so'm")}</th>
                <th>{t("Holat")}</th>
              </tr>
            </thead>
            <tbody>
              {d.items.map((c) => (
                <tr key={c.id}>
                  <td>
                    {monthLabel(c.periodStart.slice(0, 7))}
                    <div className="cell-sub fig">
                      {date(c.periodStart)} dan {date(c.periodEnd)} gacha
                    </div>
                  </td>
                  <td>{c.groupName}</td>
                  <td className="fig">{date(c.dueDate)}</td>
                  <td className="num">{money(c.baseAmount)}</td>
                  <td className="num">{c.discountAmount ? money(c.discountAmount) : t("yo'q")}</td>
                  <td className="num">{money(c.amount)}</td>
                  <td>{c.status === 'PAID' ? <span className="stamp">{t("To'langan")}</span> : <Tag kind={CHARGE_STATUS[c.status].kind}>{CHARGE_STATUS[c.status].label}</Tag>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DataView>
    </div>
  );
}

function PaymentsTab({ studentId }: { studentId: string }) {
  const t = useT();
  const list = useApi<{ items: PaymentView[] }>('/payments', { studentId, limit: 100 });
  return (
    <div className="table-wrap">
      <DataView state={list} skeleton={<Skeleton rows={4} />} empty={(d) => (d.items.length ? null : <Empty title="To'lov yo'q" />)}>
        {(d) => (
          <table className="table">
            <thead>
              <tr>
                <th>{t("Chek")}</th>
                <th>{t("Sana")}</th>
                <th>{t("Usul")}</th>
                <th>{t("Qabul qildi")}</th>
                <th className="num">{t("Summa, so'm")}</th>
              </tr>
            </thead>
            <tbody>
              {d.items.map((p) => (
                <tr key={p.id}>
                  <td className="fig">
                    <Link className="cell-main" href={`/payments/${p.id}`}>
                      №{p.receiptNo}
                    </Link>
                    {p.reversesPaymentId ? <div className="cell-sub">{t("qaytarish")}</div> : p.status === 'REVERSED' ? <div className="cell-sub">{t("qaytarilgan")}</div> : null}
                  </td>
                  <td className="fig">{dateTime(p.paidAt)}</td>
                  <td>{METHOD_LABEL[p.method] ?? p.method}</td>
                  <td className="muted">{p.receivedByName}</td>
                  <td className={p.amount < 0 ? 'num debt' : 'num'}>{money(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DataView>
    </div>
  );
}

function AttendanceTab({ studentId }: { studentId: string }) {
  const t = useT();
  const list = useApi<{ items: AttRow[] }>('/attendance', { studentId, limit: 200 });
  return (
    <div className="table-wrap">
      <DataView state={list} skeleton={<Skeleton rows={6} cols={3} />} empty={(d) => (d.items.length ? null : <Empty title="Davomat yozuvi yo'q" />)}>
        {(d) => (
          <table className="table">
            <thead>
              <tr>
                <th>{t("Sana")}</th>
                <th>{t("Guruh")}</th>
                <th>{t("Holat")}</th>
                <th>{t("Izoh")}</th>
              </tr>
            </thead>
            <tbody>
              {d.items.map((a) => (
                <tr key={a.lessonId}>
                  <td className="fig">{date(a.lessonDate)}</td>
                  <td>{a.groupName}</td>
                  <td>
                    <Tag kind={ATT_LABEL[a.status].kind}>{ATT_LABEL[a.status].label}</Tag>
                  </td>
                  <td className="muted">{a.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DataView>
    </div>
  );
}

function InfoTab({ s }: { s: Student }) {
  const t = useT();
  return (
    <div className="panel panel-body">
      <dl className="kv">
        <dt>{t("Telefon")}</dt>
        <dd className="fig">{s.phone ?? t("yo'q")}</dd>
        <dt>{t("Tug'ilgan sana")}</dt>
        <dd className="fig">{date(s.birthDate)}</dd>
        <dt>{t("Ota-ona")}</dt>
        <dd>{s.parentName ?? t("yo'q")}</dd>
        <dt>{t("Ota-ona telefoni")}</dt>
        <dd className="fig">{s.parentPhone ?? t("yo'q")}</dd>
        <dt>{t("Izoh")}</dt>
        <dd>{s.note ?? t("yo'q")}</dd>
        <dt>{t("Ro'yxatga olingan")}</dt>
        <dd className="fig">{dateTime(s.createdAt)}</dd>
        <dt>{t("Oxirgi kirish")}</dt>
        <dd className="fig">{s.lastLoginAt ? dateTime(s.lastLoginAt) : t('hali kirmagan')}</dd>
      </dl>
    </div>
  );
}

const EditStudent = whenOpen(function EditStudentInner({ open, student, onClose, onSaved }: { open: boolean; student: Student; onClose: () => void; onSaved: () => void }) {
  const t = useT();
  const init = () => ({ fullName: student.fullName, phone: student.phone ?? '', birthDate: student.birthDate ?? '', parentName: student.parentName ?? '', parentPhone: student.parentPhone ?? '', note: student.note ?? '' });
  const [v, setV] = useState(init);
  const s = useSubmit();
  const set = (k: keyof ReturnType<typeof init>) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await s.run(() => api.patch(`/students/${student.id}`, clean(v, ['phone', 'birthDate', 'parentName', 'parentPhone', 'note'])));
    if (r) {
      onSaved();
      onClose();
    }
  };
  return (
    <Dialog open={open} onClose={onClose} title="O'quvchini tahrirlash" wide footer={<><Button onClick={onClose}>{t("Bekor qilish")}</Button><Button variant="primary" type="submit" form="edit-student" busy={s.busy}>{t("Saqlash")}</Button></>}>
      <form id="edit-student" className="form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <TextInput label="Ism familiya" fieldClass="span-2" value={v.fullName} onChange={set('fullName')} error={s.fields.fullName} />
          <TextInput label="Telefon" optional type="tel" value={v.phone} onChange={set('phone')} error={s.fields.phone} />
          <TextInput label="Tug'ilgan sana" optional type="date" value={v.birthDate} onChange={set('birthDate')} error={s.fields.birthDate} />
          <TextInput label="Ota-ona ismi" optional value={v.parentName} onChange={set('parentName')} error={s.fields.parentName} />
          <TextInput label="Ota-ona telefoni" optional type="tel" value={v.parentPhone} onChange={set('parentPhone')} error={s.fields.parentPhone} />
          <TextArea label="Izoh" optional fieldClass="span-2" value={v.note} onChange={set('note')} maxLength={500} />
        </div>
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});
