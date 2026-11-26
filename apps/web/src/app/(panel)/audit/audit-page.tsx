'use client';
import { trMap, useT } from '@/lib/i18n';
import { useState } from 'react';
import { Button, DataView, Dialog, Empty, PageHead, Pager, SelectInput, Skeleton, TextInput } from '@/components/ui';
import { dateTime } from '@/lib/format';
import { useUrlState } from '@/lib/hooks';
import { useApi } from '@/lib/use-api';

interface AuditRow {
  id: number;
  at: string;
  action: string;
  entity: string;
  entityId: string | null;
  actorId: string | null;
  actorName: string | null;
  before: unknown;
  after: unknown;
  ip: string | null;
}
const ENTITY: Record<string, string> = trMap({ user: 'Foydalanuvchi', student: "O'quvchi", group: 'Guruh', enrollment: 'Yozilish', payment: "To'lov", charge: 'Hisob', lesson: 'Dars', expense: 'Xarajat', branch: 'Filial', course: 'Kurs', center: 'Markaz', payroll_period: 'Maosh davri', assignment: 'Vazifa' });
const LIMIT = 50;

/** Toshkent sanasi -> UTC ISO oraliq chegarasi. */
const dayStart = (d: string) => new Date(`${d}T00:00:00+05:00`).toISOString();
const dayEnd = (d: string) => new Date(`${d}T23:59:59.999+05:00`).toISOString();

export function AuditPage() {
  const t = useT();
  const [f, setF] = useUrlState({ action: '', entity: '', from: '', to: '', offset: '0' });
  const offset = Number(f.offset) || 0;
  const list = useApi<{ items: AuditRow[] }>('/audit', { action: f.action, entity: f.entity, from: f.from ? dayStart(f.from) : undefined, to: f.to ? dayEnd(f.to) : undefined, limit: LIMIT, offset });
  const [action, setAction] = useState(f.action);
  const [open, setOpen] = useState<AuditRow | null>(null);
  return (
    <>
      <PageHead title="Audit jurnali" sub="Kim, qachon, nimani o'zgartirgani. Yozuvlar o'chirilmaydi va tahrirlanmaydi." />
      <form className="toolbar" onSubmit={(e) => { e.preventDefault(); setF({ action: action.trim() }); }}>
        <TextInput label="Amal" value={action} onChange={(e) => setAction(e.target.value)} placeholder="masalan: payment.create" onBlur={() => setF({ action: action.trim() })} />
        <SelectInput label="Ob'ekt" value={f.entity} onChange={(e) => setF({ entity: e.target.value })} options={Object.entries(ENTITY).map(([value, label]) => ({ value, label }))} placeholder="Hammasi" />
        <TextInput label="Sanadan" type="date" value={f.from} onChange={(e) => setF({ from: e.target.value })} />
        <TextInput label="Sanagacha" type="date" value={f.to} onChange={(e) => setF({ to: e.target.value })} />
      </form>
      <div className="table-wrap">
        <DataView state={list} skeleton={<Skeleton rows={8} cols={4} />} empty={(d) => (d.items.length ? null : <Empty title="Yozuv topilmadi" />)}>
          {(d) => (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t("Vaqt")}</th>
                    <th>{t("Kim")}</th>
                    <th>{t("Amal")}</th>
                    <th>{t("Ob'ekt")}</th>
                    <th>{t("IP")}</th>
                    <th className="actions-cell" aria-label={t("Tafsilot")} />
                  </tr>
                </thead>
                <tbody>
                  {d.items.map((r) => (
                    <tr key={r.id}>
                      <td className="fig">{dateTime(r.at)}</td>
                      <td>{r.actorName ?? <span className="muted">{t("tizim")}</span>}</td>
                      <td className="fig">{r.action}</td>
                      <td className="muted">{ENTITY[r.entity] ?? r.entity}</td>
                      <td className="fig muted">{r.ip ?? ''}</td>
                      <td className="actions-cell">
                        {r.before || r.after ? (
                          <Button size="sm" variant="ghost" onClick={() => setOpen(r)}>
                            {t("Tafsilot")}
                          </Button>
                        ) : null}
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
      <Dialog open={open !== null} onClose={() => setOpen(null)} title={open?.action ?? ''} wide footer={<Button onClick={() => setOpen(null)}>{t("Yopish")}</Button>}>
        {open ? (
          <div className="grid-2">
            <div className="stack-sm">
              <h3>{t("Oldin")}</h3>
              <pre className="json">{open.before ? JSON.stringify(open.before, null, 2) : t("yo'q")}</pre>
            </div>
            <div className="stack-sm">
              <h3>{t("Keyin")}</h3>
              <pre className="json">{open.after ? JSON.stringify(open.after, null, 2) : t("yo'q")}</pre>
            </div>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
