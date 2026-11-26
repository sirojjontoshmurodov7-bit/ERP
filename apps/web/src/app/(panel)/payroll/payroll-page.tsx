'use client';
import { tr, trMap, useT } from '@/lib/i18n';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { METHODS } from '@/components/payment-dialog';
import { Button, Confirm, DataView, Dialog, Empty, MoneyInput, PageHead, Segmented, SelectInput, Skeleton, Stat, Tag, TextInput, useToast, whenOpen } from '@/components/ui';
import { ApiError, api, errorText } from '@/lib/api';
import { date, dateTime, money, monthLabel, thisMonth, todayLocal } from '@/lib/format';
import { useSubmit } from '@/lib/forms';
import { opts, useGroupsLite, useUrlState } from '@/lib/hooks';
import { ROLE_LABEL, useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';

interface Item {
  id: string;
  groupName: string | null;
  baseAmount: number;
  amount: number;
  description: string;
}
interface Adjustment {
  id: string;
  amount: number;
  reason: string;
}
interface Payout {
  id: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string;
  note: string | null;
  reversesPayoutId: string | null;
  employeeName?: string;
  month?: string;
}
interface Employee {
  employeeId: string;
  employeeName: string;
  role: 'ADMIN' | 'CASHIER' | 'TEACHER';
  items: Item[];
  adjustments: Adjustment[];
  payouts: Payout[];
  gross: number;
  adjustmentsTotal: number;
  total: number;
  paid: number;
  remaining: number;
}
interface Period {
  period: { id: string; month: string; status: 'DRAFT' | 'APPROVED' | 'PAID'; calculatedAt: string | null; approvedAt: string | null };
  employees: Employee[];
  totals: { total: number; paid: number; remaining: number };
}
interface Rule {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  groupId: string | null;
  groupName: string | null;
  type: 'FIXED' | 'PERCENT' | 'PER_GROUP' | 'PER_LESSON';
  amount: number | null;
  percent: number | null;
  percentBase: 'PAID' | 'CHARGED' | null;
  teacherKind: 'MAIN' | 'ASSISTANT' | null;
  validFrom: string;
  validTo: string | null;
}

const PERIOD_STATUS = { DRAFT: { label: 'Qoralama', kind: 'warn' as const }, APPROVED: { label: 'Tasdiqlangan', kind: 'ok' as const }, PAID: { label: "To'langan", kind: 'ok' as const } };
const RULE_TYPE: Record<Rule['type'], string> = trMap({ FIXED: "Qat'iy oylik", PERCENT: "To'lovdan foiz", PER_GROUP: 'Har guruh uchun', PER_LESSON: 'Har dars uchun' });

export function PayrollPage() {
  const { can } = useSession();
  if (!can('payroll.view_all')) return <MyPayroll />;
  return <PayrollAdmin />;
}

function PayrollAdmin() {
  const { can } = useSession();
  const [f, setF] = useUrlState({ tab: 'period', month: thisMonth() });
  const tabs = [{ key: 'period', label: 'Oylik hisob' }, { key: 'rules', label: 'Qoidalar' }, { key: 'payouts', label: "To'lovlar tarixi" }];
  return (
    <>
      <PageHead title="Maosh" sub="Qoidalar bo'yicha hisoblanadi, rahbar tasdiqlaydi, keyin to'lanadi." />
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.key} type="button" role="tab" className="tab" aria-selected={f.tab === t.key} onClick={() => setF({ tab: t.key })}>
            {t.label}
          </button>
        ))}
      </div>
      {f.tab === 'period' ? <PeriodTab month={f.month} setMonth={(m) => setF({ month: m })} /> : null}
      {f.tab === 'rules' ? <RulesTab canManage={can('payroll.rules.manage')} /> : null}
      {f.tab === 'payouts' ? <PayoutsTab month={f.month} /> : null}
    </>
  );
}

function PeriodTab({ month, setMonth }: { month: string; setMonth: (m: string) => void }) {
  const t = useT();
  const { can } = useSession();
  const toast = useToast();
  const periods = useApi<{ items: { month: string; status: keyof typeof PERIOD_STATUS; total: number; remaining: number }[] }>('/payroll/periods', { limit: 24 });
  const period = useApi<Period>(`/payroll/periods/${month}`);
  const [busy, setBusy] = useState<string | null>(null);
  const [approve, setApprove] = useState(false);
  const [adjust, setAdjust] = useState<Employee | null>(null);
  const [payout, setPayout] = useState<Employee | null>(null);
  const [delAdj, setDelAdj] = useState<Adjustment | null>(null);
  const notCalculated = period.error instanceof ApiError && period.error.status === 404;

  const calculate = async () => {
    setBusy('calc');
    try {
      await api.post(`/payroll/periods/${month}/calculate`);
      toast('Maosh hisoblandi');
      period.reload();
      periods.reload();
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setBusy(null);
    }
  };
  const reload = () => {
    period.reload();
    periods.reload();
  };
  const draft = period.data?.period.status === 'DRAFT';

  return (
    <div className="stack">
      <div className="toolbar">
        <TextInput label="Oy" type="month" value={month} max={thisMonth()} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        <div className="row presets">
          {(periods.data?.items ?? []).slice(0, 6).map((p) => (
            <button key={p.month} type="button" className="link-btn small" aria-current={p.month === month ? 'true' : undefined} onClick={() => setMonth(p.month)}>
              {monthLabel(p.month)}
            </button>
          ))}
        </div>
        <span className="topbar-spacer" />
        {can('payroll.calculate') && (notCalculated || draft) ? (
          <Button busy={busy === 'calc'} onClick={calculate}>
            {notCalculated ? t('Hisoblash') : t('Qayta hisoblash')}
          </Button>
        ) : null}
        {can('payroll.approve') && draft ? (
          <Button variant="primary" onClick={() => setApprove(true)}>
            {t("Tasdiqlash")}
          </Button>
        ) : null}
      </div>
      {notCalculated ? (
        <div className="panel">
          <Empty title={t('{month}: hali hisoblanmagan', { month: monthLabel(month) })} text="Hisoblash qoidalar bo'yicha qoralama tuzadi; tasdiqlanguncha qayta hisoblash mumkin." action={can('payroll.calculate') ? <Button variant="primary" size="sm" busy={busy === 'calc'} onClick={calculate}>{t("Hisoblash")}</Button> : undefined} />
        </div>
      ) : (
        <DataView state={period} skeleton={<Skeleton rows={5} cols={5} />}>
          {(d) => (
            <>
              <div className="stats">
                <Stat label="Holat" value={<Tag kind={PERIOD_STATUS[d.period.status].kind}>{PERIOD_STATUS[d.period.status].label}</Tag>} note={d.period.calculatedAt ? `hisoblandi ${dateTime(d.period.calculatedAt)}` : undefined} />
                <Stat label="Jami hisoblangan" value={money(d.totals.total)} note="so'm" />
                <Stat label="To'langan" value={money(d.totals.paid)} note="so'm" />
                <Stat label="Qoldiq" value={money(d.totals.remaining)} note="so'm" tone={d.totals.remaining > 0 ? 'debt' : undefined} />
              </div>
              {d.employees.length ? (
                <div className="stack">
                  {d.employees.map((e) => (
                    <section key={e.employeeId} className="panel">
                      <div className="panel-head">
                        <h2>
                          {e.employeeName} <span className="cell-sub">{ROLE_LABEL[e.role]}</span>
                        </h2>
                        <span className="row">
                          {draft && can('payroll.calculate') ? (
                            <Button size="sm" variant="ghost" onClick={() => setAdjust(e)}>
                              {t("Bonus yoki jarima")}
                            </Button>
                          ) : null}
                          {!draft && can('payroll.pay') && e.remaining > 0 ? (
                            <Button size="sm" variant="primary" onClick={() => setPayout(e)}>
                              {t("To'lash")}
                            </Button>
                          ) : null}
                          {!draft && e.total > 0 && e.remaining === 0 ? <span className="stamp">{t("To'landi")}</span> : null}
                        </span>
                      </div>
                      <div className="panel-body--flush">
                        <div className="table-wrap">
                          <table className="table">
                            <tbody>
                              {e.items.map((i) => (
                                <tr key={i.id}>
                                  <td>
                                    {i.description}
                                    {i.groupName ? <div className="cell-sub">{i.groupName}</div> : null}
                                  </td>
                                  <td className="num">{money(i.amount)}</td>
                                  <td className="actions-cell" />
                                </tr>
                              ))}
                              {e.adjustments.map((a) => (
                                <tr key={a.id}>
                                  <td>
                                    {a.amount > 0 ? t('Bonus') : t('Jarima')}: {a.reason}
                                  </td>
                                  <td className={a.amount < 0 ? 'num debt' : 'num'}>{money(a.amount)}</td>
                                  <td className="actions-cell">
                                    {draft && can('payroll.calculate') ? (
                                      <Button size="sm" variant="ghost" aria-label="O'chirish" onClick={() => setDelAdj(a)} icon={<Icon.close />} />
                                    ) : null}
                                  </td>
                                </tr>
                              ))}
                              {e.payouts.map((p) => (
                                <tr key={p.id}>
                                  <td className="muted">
                                    To&apos;landi {dateTime(p.paidAt)}
                                    {p.note ? `, ${p.note}` : ''}
                                  </td>
                                  <td className="num muted">−{money(p.amount)}</td>
                                  <td className="actions-cell" />
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td>{e.paid ? t("Jami (to'langan {sum})", { sum: money(e.paid) }) : t('Jami')}</td>
                                <td className="num">{money(e.total)}</td>
                                <td className="actions-cell" />
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="panel">
                  <Empty title="Hisoblangan xodim yo'q" text="Maosh qoidasi bo'lgan xodim topilmadi. Avval Qoidalar tabida qoida qo'shing." />
                </div>
              )}
            </>
          )}
        </DataView>
      )}
      <Confirm
        open={approve}
        onClose={() => setApprove(false)}
        title={t('{month} maoshini tasdiqlash', { month: monthLabel(month) })}
        text="Tasdiqlangan davr qulflanadi: qayta hisoblash, bonus va jarima qo'shish mumkin bo'lmaydi. Keyin to'lov qilinadi."
        confirmLabel="Tasdiqlash"
        onConfirm={async () => {
          await api.post(`/payroll/periods/${month}/approve`);
          reload();
        }}
      />
      <AdjustDialog open={adjust !== null} employee={adjust} month={month} onClose={() => setAdjust(null)} onDone={reload} />
      <PayoutDialog open={payout !== null} employee={payout} month={month} onClose={() => setPayout(null)} onDone={reload} />
      <Confirm
        open={delAdj !== null}
        onClose={() => setDelAdj(null)}
        title="Bonus yoki jarimani o'chirish"
        text={t("{reason}: {sum} so'm.", { reason: delAdj?.reason ?? '', sum: money(delAdj?.amount) })}
        confirmLabel="O'chirish"
        danger
        onConfirm={async () => {
          await api.del(`/payroll/adjustments/${delAdj!.id}`);
          reload();
        }}
      />
    </div>
  );
}

const AdjustDialog = whenOpen(function AdjustInner({ open, employee, month, onClose, onDone }: { open: boolean; employee: Employee | null; month: string; onClose: () => void; onDone: () => void }) {
  const t = useT();
  const e = employee!;
  const [kind, setKind] = useState<'bonus' | 'fine'>('bonus');
  const [amount, setAmount] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const s = useSubmit();
  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!amount) return s.setError(t('Summani kiriting'));
    const r = await s.run(() => api.post(`/payroll/periods/${month}/adjustments`, { employeeId: e.employeeId, amount: kind === 'bonus' ? amount : -amount, reason: reason.trim() }));
    if (r) {
      onDone();
      onClose();
    }
  };
  return (
    <Dialog open={open} onClose={onClose} title={t('{name}: bonus yoki jarima', { name: e.employeeName })} footer={<><Button onClick={onClose}>{t("Bekor qilish")}</Button><Button variant="primary" type="submit" form="adj-form" busy={s.busy}>{t("Qo'shish")}</Button></>}>
      <form id="adj-form" className="form" onSubmit={submit} noValidate>
        <Segmented label="Turi" value={kind} onChange={setKind} options={[{ value: 'bonus', label: 'Bonus' }, { value: 'fine', label: 'Jarima' }]} />
        <MoneyInput label="Summa" value={amount} onChange={setAmount} error={s.fields.amount} />
        <TextInput label="Sabab" value={reason} onChange={(ev) => setReason(ev.target.value)} error={s.fields.reason} maxLength={200} />
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});

const PayoutDialog = whenOpen(function PayoutInner({ open, employee, month, onClose, onDone }: { open: boolean; employee: Employee | null; month: string; onClose: () => void; onDone: () => void }) {
  const t = useT();
  const e = employee!;
  const [amount, setAmount] = useState<number | ''>(e.remaining);
  const [method, setMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH');
  const [note, setNote] = useState('');
  const s = useSubmit();
  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!amount) return s.setError(t('Summani kiriting'));
    const r = await s.run(() => api.post('/payroll/payouts', { month, employeeId: e.employeeId, amount, method, ...(note.trim() ? { note: note.trim() } : {}) }));
    if (r) {
      onDone();
      onClose();
    }
  };
  return (
    <Dialog open={open} onClose={onClose} title={t("{name}: maosh to'lash", { name: e.employeeName })} footer={<><Button onClick={onClose}>{t("Bekor qilish")}</Button><Button variant="primary" type="submit" form="payout-form" busy={s.busy}>{t("To'lash")}</Button></>}>
      <form id="payout-form" className="form" onSubmit={submit} noValidate>
        <p className="muted">
          {t("{month}: qoldiq {sum} so'm", { month: monthLabel(month), sum: money(e.remaining) })}
        </p>
        <MoneyInput label="Summa" value={amount} onChange={setAmount} error={s.fields.amount} hint="Qoldiqdan oshmasin; bo'lib to'lash mumkin" />
        <div className="field">
          <span className="field-label">{t("Usul")}</span>
          <Segmented label="Usul" value={method} onChange={setMethod} options={METHODS.map((m) => ({ value: m.value, label: m.label }))} />
        </div>
        <TextInput label="Izoh" optional value={note} onChange={(ev) => setNote(ev.target.value)} maxLength={200} />
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});

function ruleText(r: Rule) {
  if (r.type === 'PERCENT') return `${r.percent}% (${r.percentBase === 'PAID' ? tr("to'langan summadan") : tr('hisoblangan summadan')})`;
  return `${money(r.amount)} ${tr("so'm")}`;
}

function RulesTab({ canManage }: { canManage: boolean }) {
  const t = useT();
  const [active, setActive] = useState('true');
  const list = useApi<{ items: Rule[] }>('/payroll/rules', { active: active || undefined, limit: 200 });
  const [create, setCreate] = useState(false);
  const [end, setEnd] = useState<Rule | null>(null);
  return (
    <div className="stack">
      <div className="toolbar">
        <SelectInput label="Holat" value={active} onChange={(e) => setActive(e.target.value)} options={[{ value: 'true', label: 'Amaldagi' }, { value: 'false', label: 'Tugagan' }]} placeholder="Hammasi" />
        <span className="topbar-spacer" />
        {canManage ? (
          <Button variant="primary" icon={<Icon.plus />} onClick={() => setCreate(true)}>
            {t("Yangi qoida")}
          </Button>
        ) : null}
      </div>
      <div className="table-wrap">
        <DataView state={list} skeleton={<Skeleton rows={4} cols={5} />} empty={(d) => (d.items.length ? null : <Empty title="Qoida yo'q" text="Har xodim uchun maosh qoidasi: qat'iy oylik, foiz, har guruh yoki har dars uchun." />)}>
          {(d) => (
            <table className="table">
              <thead>
                <tr>
                  <th>{t("Xodim")}</th>
                  <th>{t("Turi")}</th>
                  <th>{t("Miqdor")}</th>
                  <th>{t("Guruh")}</th>
                  <th>{t("Amal qiladi")}</th>
                  {canManage ? <th className="actions-cell" aria-label={t("Amallar")} /> : null}
                </tr>
              </thead>
              <tbody>
                {d.items.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="cell-main">{r.employeeName}</span>
                      <div className="cell-sub">{ROLE_LABEL[r.employeeRole as keyof typeof ROLE_LABEL] ?? r.employeeRole}</div>
                    </td>
                    <td>{RULE_TYPE[r.type]}</td>
                    <td className="fig">{ruleText(r)}</td>
                    <td className="muted">
                      {r.groupName ?? 'hammasi'}
                      {r.teacherKind ? <div className="cell-sub">{r.teacherKind === 'MAIN' ? t('asosiy ustoz sifatida') : t('yordamchi sifatida')}</div> : null}
                    </td>
                    <td className="fig">
                      {date(r.validFrom)} dan {r.validTo ? `${date(r.validTo)} gacha` : 'muddatsiz'}
                    </td>
                    {canManage ? (
                      <td className="actions-cell">
                        {!r.validTo || r.validTo >= todayLocal() ? (
                          <Button size="sm" variant="ghost" onClick={() => setEnd(r)}>
                            {t("Tugatish")}
                          </Button>
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
      <RuleDialog open={create} onClose={() => setCreate(false)} onDone={list.reload} />
      <Confirm
        open={end !== null}
        onClose={() => setEnd(null)}
        title="Qoidani tugatish"
        text="Qoida bugungi sana bilan tugaydi. Hisoblangan va tasdiqlangan davrlarga ta'sir qilmaydi."
        confirmLabel="Tugatish"
        onConfirm={async () => {
          await api.post(`/payroll/rules/${end!.id}/end`, {});
          list.reload();
        }}
      />
    </div>
  );
}

const RuleDialog = whenOpen(function RuleInner({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const t = useT();
  const staff = useApi<{ items: { id: string; fullName: string; role: string; status: string }[] }>('/staff', { status: 'ACTIVE', limit: 200 });
  const groups = useGroupsLite();
  const [v, setV] = useState({ employeeId: '', type: 'FIXED' as Rule['type'], groupId: '', percent: '', percentBase: 'PAID', teacherKind: '', validFrom: `${thisMonth()}-01` });
  const [amount, setAmount] = useState<number | ''>('');
  const s = useSubmit();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = { employeeId: v.employeeId, type: v.type, validFrom: v.validFrom };
    if (v.type === 'PERCENT') {
      body.percent = Number(v.percent);
      body.percentBase = v.percentBase;
    } else body.amount = amount === '' ? undefined : amount;
    if (v.groupId && v.type !== 'FIXED') body.groupId = v.groupId;
    if (v.teacherKind && v.type !== 'FIXED') body.teacherKind = v.teacherKind;
    const r = await s.run(() => api.post('/payroll/rules', body));
    if (r) {
      onDone();
      onClose();
    }
  };
  return (
    <Dialog open={open} onClose={onClose} title="Yangi maosh qoidasi" wide footer={<><Button onClick={onClose}>{t("Bekor qilish")}</Button><Button variant="primary" type="submit" form="rule-form" busy={s.busy}>{t("Saqlash")}</Button></>}>
      <form id="rule-form" className="form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <SelectInput label="Xodim" value={v.employeeId} onChange={set('employeeId')} options={(staff.data?.items ?? []).map((x) => ({ value: x.id, label: `${x.fullName} (${ROLE_LABEL[x.role as keyof typeof ROLE_LABEL] ?? x.role})` }))} placeholder="Tanlang" error={s.fields.employeeId} />
          <SelectInput label="Turi" value={v.type} onChange={set('type')} options={Object.entries(RULE_TYPE).map(([value, label]) => ({ value, label }))} />
          {v.type === 'PERCENT' ? (
            <>
              <TextInput label="Foiz" type="number" min={0.01} max={100} step={0.01} value={v.percent} onChange={set('percent')} error={s.fields.percent} />
              <SelectInput label="Asos" value={v.percentBase} onChange={set('percentBase')} options={[{ value: 'PAID', label: "O'quvchilar to'lagan summa" }, { value: 'CHARGED', label: 'Hisoblangan summa' }]} />
            </>
          ) : (
            <MoneyInput label={v.type === 'FIXED' ? 'Oylik summa' : v.type === 'PER_GROUP' ? 'Har guruh uchun' : 'Har dars uchun'} value={amount} onChange={setAmount} error={s.fields.amount} />
          )}
          {v.type !== 'FIXED' ? (
            <>
              <SelectInput label="Guruh" optional value={v.groupId} onChange={set('groupId')} options={opts(groups.data?.items)} placeholder="Xodimning hamma guruhlari" />
              <SelectInput label="Ustoz sifati" optional value={v.teacherKind} onChange={set('teacherKind')} options={[{ value: 'MAIN', label: 'Asosiy' }, { value: 'ASSISTANT', label: 'Yordamchi' }]} placeholder="Farqi yo'q" />
            </>
          ) : null}
          <TextInput label="Qaysi sanadan" type="date" value={v.validFrom} onChange={set('validFrom')} error={s.fields.validFrom} />
        </div>
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});

function PayoutsTab({ month }: { month: string }) {
  const t = useT();
  const { can } = useSession();
  const list = useApi<{ items: Payout[] }>('/payroll/payouts', { month, limit: 200 });
  const [reverse, setReverse] = useState<Payout | null>(null);
  return (
    <div className="table-wrap">
      <DataView state={list} skeleton={<Skeleton rows={4} cols={4} />} empty={(d) => (d.items.length ? null : <Empty title={t("{month}: maosh to'lovi yo'q", { month: monthLabel(month) })} />)}>
        {(d) => (
          <table className="table">
            <thead>
              <tr>
                <th>{t("Vaqt")}</th>
                <th>{t("Xodim")}</th>
                <th>{t("Usul")}</th>
                <th className="num">{t("Summa, so'm")}</th>
                {can('payroll.approve') ? <th className="actions-cell" aria-label={t("Amallar")} /> : null}
              </tr>
            </thead>
            <tbody>
              {d.items.map((p) => (
                <tr key={p.id}>
                  <td className="fig">{dateTime(p.paidAt)}</td>
                  <td>
                    {p.employeeName}
                    {p.note ? <div className="cell-sub">{p.note}</div> : null}
                  </td>
                  <td>{METHODS.find((m) => m.value === p.method)?.label ?? p.method}</td>
                  <td className={p.amount < 0 ? 'num debt' : 'num'}>{money(p.amount)}</td>
                  {can('payroll.approve') ? (
                    <td className="actions-cell">
                      {p.amount > 0 && p.status === 'CONFIRMED' ? (
                        <Button size="sm" variant="ghost" onClick={() => setReverse(p)}>
                          {t("Qaytarish")}
                        </Button>
                      ) : p.status === 'REVERSED' ? (
                        <Tag kind="mute">{t("qaytarilgan")}</Tag>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DataView>
      <Confirm
        open={reverse !== null}
        onClose={() => setReverse(null)}
        title="Maosh to'lovini qaytarish"
        text={t("{name}: {sum} so'm. Teskari yozuv yaratiladi.", { name: reverse?.employeeName ?? '', sum: money(reverse?.amount) })}
        confirmLabel="Qaytarish"
        danger
        reason={{ label: 'Sabab', required: true }}
        onConfirm={async (reason) => {
          await api.post(`/payroll/payouts/${reverse!.id}/reverse`, { reason });
          list.reload();
        }}
      />
    </div>
  );
}

function MyPayroll() {
  const t = useT();
  const list = useApi<{ items: (Period['period'] & Employee)[] }>('/payroll/me', { limit: 12 });
  return (
    <>
      <PageHead title="Maoshim" sub="Faqat tasdiqlangan oylar ko'rinadi." />
      <DataView state={list} skeleton={<Skeleton rows={4} cols={3} />} empty={(d) => (d.items.length ? null : <div className="panel"><Empty title="Hali tasdiqlangan maosh yo'q" text="Rahbar oylik hisobni tasdiqlagach shu yerda ko'rinadi." /></div>)}>
        {(d) => (
          <div className="stack">
            {d.items.map((p) => (
              <section key={p.id} className="panel">
                <div className="panel-head">
                  <h2>{monthLabel(p.month)}</h2>
                  {p.remaining === 0 && p.total > 0 ? <span className="stamp">{t("To'landi")}</span> : <Tag kind="warn">Qoldiq {money(p.remaining)}</Tag>}
                </div>
                <div className="panel-body--flush">
                  <div className="table-wrap">
                    <table className="table">
                      <tbody>
                        {p.items.map((i) => (
                          <tr key={i.id}>
                            <td>
                              {i.description}
                              {i.groupName ? <div className="cell-sub">{i.groupName}</div> : null}
                            </td>
                            <td className="num">{money(i.amount)}</td>
                          </tr>
                        ))}
                        {p.adjustments.map((a) => (
                          <tr key={a.id}>
                            <td>
                              {a.amount > 0 ? t('Bonus') : t('Jarima')}: {a.reason}
                            </td>
                            <td className={a.amount < 0 ? 'num debt' : 'num'}>{money(a.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td>Jami (to&apos;langan {money(p.paid)})</td>
                          <td className="num">{money(p.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </DataView>
    </>
  );
}
