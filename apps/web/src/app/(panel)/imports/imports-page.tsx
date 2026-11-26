'use client';
import { tr, trMap, useT } from '@/lib/i18n';
import { useRef, useState } from 'react';
import { Icon } from '@/components/icons';
import { Button, DataView, Empty, PageHead, Pager, SelectInput, Skeleton, Stat, Tag, useToast } from '@/components/ui';
import { api, errorText } from '@/lib/api';
import { dateTime } from '@/lib/format';
import { opts, useBranches, useUrlState } from '@/lib/hooks';
import { useApi } from '@/lib/use-api';

interface RowError {
  row: number;
  field: string;
  code: string;
  message: string;
}
interface Result {
  dryRun: boolean;
  job: { id: string; status: 'DONE' | 'REJECTED'; createdRows: number } | null;
  fileName: string;
  totalRows: number;
  validRows?: number;
  errorRows: number;
  ignoredColumns: string[];
  errors: RowError[];
  errorsTruncated: boolean;
  created: { row: number; studentId: string; fullName?: string; login: string; temporaryPassword: string; groupId: string | null }[];
}
interface Job {
  id: string;
  type: string;
  fileName: string;
  status: 'DONE' | 'REJECTED';
  totalRows: number;
  createdRows: number;
  errorRows: number;
  createdAt: string;
}
const FIELD: Record<string, string> = trMap({ fullName: 'Ism', phone: 'Telefon', birthDate: "Tug'ilgan sana", parentName: 'Ota-ona', parentPhone: 'Ota-ona telefoni', note: 'Izoh', branch: 'Filial', group: 'Guruh', joinedAt: "Qo'shilgan sana" });

export function ImportsPage() {
  const t = useT();
  const toast = useToast();
  const branches = useBranches();
  const [branchId, setBranchId] = useState('');
  const [skipInvalid, setSkipInvalid] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<'dry' | 'run' | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const [f, setF] = useUrlState({ offset: '0' });
  const offset = Number(f.offset) || 0;
  const history = useApi<{ items: Job[] }>('/imports', { limit: 20, offset });

  const send = async (dryRun: boolean) => {
    if (!file) return toast('Faylni tanlang', 'error');
    const form = new FormData();
    form.set('type', 'STUDENTS');
    if (branchId) form.set('branchId', branchId);
    form.set('dryRun', String(dryRun));
    form.set('skipInvalid', String(skipInvalid));
    form.set('file', file);
    setBusy(dryRun ? 'dry' : 'run');
    try {
      const r = await api.upload<Result>('/imports', form);
      setResult(r);
      if (!dryRun) history.reload();
    } catch (e) {
      setResult(null);
      toast(errorText(e), 'error');
    } finally {
      setBusy(null);
    }
  };

  const downloadCreds = () => {
    if (!result?.created.length) return;
    const rows = [[tr('Qator'), tr('Ism'), tr('Login'), tr('Vaqtinchalik parol')], ...result.created.map((c) => [String(c.row), c.fullName ?? '', c.login, c.temporaryPassword])];
    const csv = '﻿' + rows.map((r) => r.map((x) => `"${x.replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'oquvchilar-loginlar.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <>
      <PageHead title="Exceldan import" sub="O'quvchilarni .xlsx yoki .csv fayldan qo'shish (bir faylda 300 qatorgacha)." actions={<Button icon={<Icon.download />} onClick={() => api.download('/imports/template', 'oquvchilar-shablon.csv').catch((e: unknown) => toast(errorText(e), 'error'))}>{t("Shablonni yuklab olish")}</Button>} />
      <section className="panel panel-body stack">
        <div className="form-grid">
          <div className="field">
            <label className="field-label" htmlFor="import-file">
              {t("Fayl")}
            </label>
            <input id="import-file" ref={input} className="input file-input" type="file" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }} />
            <span className="field-hint">{t("Ustunlar: Ism, Telefon, Tug'ilgan sana, Ota-ona ismi, Ota-ona telefoni, Izoh, Filial, Guruh, Qo'shilgan sana")}</span>
          </div>
          <SelectInput label="Sukut filial" optional value={branchId} onChange={(e) => setBranchId(e.target.value)} options={opts(branches.data?.items)} placeholder={branches.data?.items.length === 1 ? 'Yagona filial' : 'Fayldagi Filial ustuni'} hint="Faylda filial ko'rsatilmagan qatorlar uchun" />
        </div>
        <label className="check">
          <input type="checkbox" checked={skipInvalid} onChange={(e) => setSkipInvalid(e.target.checked)} />
          {t("Xatoli qatorlarni o'tkazib, to'g'rilarini qo'shish")}
        </label>
        <div className="row">
          <Button busy={busy === 'dry'} disabled={!file || busy !== null} onClick={() => send(true)}>
            {t("Tekshirish")}
          </Button>
          <Button variant="primary" busy={busy === 'run'} disabled={!file || busy !== null} onClick={() => send(false)} icon={<Icon.upload />}>
            {t("Import qilish")}
          </Button>
        </div>
        <p className="small muted">{t("Sukut bo'yicha bitta xato bo'lsa ham hech narsa qo'shilmaydi. Fayl serverda saqlanmaydi.")}</p>
      </section>

      {result ? (
        <section className="stack" aria-live="polite">
          <div className="stats">
            <Stat label={result.dryRun ? 'Tekshirildi' : 'Natija'} value={<span className="stat-text">{t(result.dryRun ? 'Sinov (hech narsa yozilmadi)' : result.job?.status === 'DONE' ? 'Bajarildi' : 'Rad etildi')}</span>} note={result.fileName} />
            <Stat label="Qatorlar" value={result.totalRows} />
            {result.dryRun ? <Stat label="To'g'ri" value={result.validRows ?? 0} /> : <Stat label="Qo'shildi" value={result.created.length} />}
            <Stat label="Xatoli qatorlar" value={result.errorRows} tone={result.errorRows ? 'debt' : undefined} />
          </div>
          {result.ignoredColumns.length ? <p className="muted small">E&apos;tiborsiz qoldirilgan ustunlar: {result.ignoredColumns.join(', ')}</p> : null}
          {result.errors.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="num">{t("Qator")}</th>
                    <th>{t("Ustun")}</th>
                    <th>{t("Xato")}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((e, i) => (
                    <tr key={i}>
                      <td className="num">{e.row}</td>
                      <td>{FIELD[e.field] ?? e.field}</td>
                      <td>{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.errorsTruncated ? <p className="table-foot">{t("Faqat birinchi 200 xato ko'rsatildi.")}</p> : null}
            </div>
          ) : null}
          {result.created.length ? (
            <section className="panel">
              <div className="panel-head">
                <h2>{t("Yangi o'quvchilar va vaqtinchalik parollar")}</h2>
                <Button size="sm" onClick={downloadCreds} icon={<Icon.download />}>
                  {t("CSV yuklab olish")}
                </Button>
              </div>
              <p className="panel-body small muted">{t("Parollar faqat hozir ko'rinadi: sahifadan chiqqach qayta ko'rsatilmaydi.")}</p>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="num">{t("Qator")}</th>
                      <th>{t("Login")}</th>
                      <th>{t("Vaqtinchalik parol")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.created.map((c) => (
                      <tr key={c.studentId}>
                        <td className="num">{c.row}</td>
                        <td className="fig">{c.login}</td>
                        <td className="fig">{c.temporaryPassword}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </section>
      ) : null}

      <section className="stack-sm">
        <h2>{t("Tarix")}</h2>
        <div className="table-wrap">
          <DataView state={history} skeleton={<Skeleton rows={3} cols={4} />} empty={(d) => (d.items.length ? null : <Empty title="Hali import qilinmagan" />)}>
            {(d) => (
              <>
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("Vaqt")}</th>
                      <th>{t("Fayl")}</th>
                      <th className="num">{t("Qatorlar")}</th>
                      <th className="num">{t("Qo'shildi")}</th>
                      <th className="num">{t("Xato")}</th>
                      <th>{t("Holat")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.items.map((j) => (
                      <tr key={j.id}>
                        <td className="fig">{dateTime(j.createdAt)}</td>
                        <td>{j.fileName}</td>
                        <td className="num">{j.totalRows}</td>
                        <td className="num">{j.createdRows}</td>
                        <td className="num">{j.errorRows}</td>
                        <td>{j.status === 'DONE' ? <Tag kind="ok">{t("Bajarildi")}</Tag> : <Tag kind="bad">{t("Rad etildi")}</Tag>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pager offset={offset} limit={20} count={d.items.length} onChange={(o) => setF({ offset: String(o) })} />
              </>
            )}
          </DataView>
        </div>
      </section>
    </>
  );
}
