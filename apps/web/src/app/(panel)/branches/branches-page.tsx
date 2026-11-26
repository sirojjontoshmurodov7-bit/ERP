'use client';
import { useT } from '@/lib/i18n';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button, Confirm, DataView, Dialog, Empty, PageHead, SelectInput, Skeleton, Tag, TextInput, whenOpen } from '@/components/ui';
import { api } from '@/lib/api';
import { tsDate } from '@/lib/format';
import { clean, useSubmit } from '@/lib/forms';
import type { Branch } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';

export function BranchesPage() {
  const t = useT();
  const { can } = useSession();
  const [archived, setArchived] = useState('false');
  const list = useApi<{ items: Branch[] }>('/branches', { includeArchived: archived });
  const params = useSearchParams();
  // /branches?new=1 (bosh sahifadagi "Yangi filial" tugmasi) dialogni ochib keladi
  const [edit, setEdit] = useState<Branch | 'new' | null>(() => (params.get('new') === '1' ? 'new' : null));
  const [toggle, setToggle] = useState<Branch | null>(null);
  const manage = can('branch.manage');
  return (
    <>
      <PageHead title="Filiallar" actions={manage ? <Button variant="primary" icon={<Icon.plus />} onClick={() => setEdit('new')}>{t("Yangi filial")}</Button> : null} />
      {manage ? (
        <div className="toolbar">
          <SelectInput label="Arxiv" value={archived} onChange={(e) => setArchived(e.target.value)} options={[{ value: 'false', label: "Ko'rsatilmaydi" }, { value: 'true', label: "Ko'rsatiladi" }]} />
        </div>
      ) : null}
      <div className="table-wrap">
        <DataView state={list} skeleton={<Skeleton rows={3} cols={3} />} empty={(d) => (d.items.length ? null : <Empty title="Filial yo'q" />)}>
          {(d) => (
            <table className="table">
              <thead>
                <tr>
                  <th>{t("Filial")}</th>
                  <th>{t("Manzil")}</th>
                  <th>{t("Telefon")}</th>
                  <th>{t("Ochilgan")}</th>
                  <th>{t("Holat")}</th>
                  {manage ? <th className="actions-cell" aria-label={t("Amallar")} /> : null}
                </tr>
              </thead>
              <tbody>
                {d.items.map((b) => (
                  <tr key={b.id}>
                    <td className="cell-main">{b.name}</td>
                    <td>{b.address ?? <span className="muted">{t("yo'q")}</span>}</td>
                    <td className="fig">{b.phone ?? <span className="muted">{t("yo'q")}</span>}</td>
                    <td className="fig muted">{tsDate(b.createdAt)}</td>
                    <td>{b.archivedAt ? <Tag kind="mute">{t("Arxivda")}</Tag> : <Tag kind="ok">{t("Faol")}</Tag>}</td>
                    {manage ? (
                      <td className="actions-cell">
                        <span className="row">
                          {!b.archivedAt ? (
                            <Button size="sm" variant="ghost" onClick={() => setEdit(b)}>
                              {t("Tahrirlash")}
                            </Button>
                          ) : null}
                          <Button size="sm" variant="ghost" onClick={() => setToggle(b)}>
                            {b.archivedAt ? 'Qaytarish' : 'Arxivlash'}
                          </Button>
                        </span>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DataView>
      </div>
      <BranchDialog open={edit !== null} branch={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onSaved={list.reload} />
      <Confirm
        open={toggle !== null}
        onClose={() => setToggle(null)}
        title={toggle?.archivedAt ? 'Filialni qaytarish' : 'Filialni arxivlash'}
        text={toggle?.archivedAt ? 'Filial yana faol bo\'ladi.' : "Filialda faol guruh bo'lsa arxivlab bo'lmaydi. Tarix saqlanadi."}
        confirmLabel={toggle?.archivedAt ? 'Qaytarish' : 'Arxivlash'}
        onConfirm={async () => {
          await api.post(`/branches/${toggle!.id}/${toggle!.archivedAt ? 'unarchive' : 'archive'}`);
          list.reload();
        }}
      />
    </>
  );
}

const BranchDialog = whenOpen(function BranchDialogInner({ open, branch, onClose, onSaved }: { open: boolean; branch: Branch | null; onClose: () => void; onSaved: () => void }) {
  const t = useT();
  const [v, setV] = useState({ name: branch?.name ?? '', address: branch?.address ?? '', phone: branch?.phone ?? '' });
  const s = useSubmit();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await s.run(() => (branch ? api.patch(`/branches/${branch.id}`, clean(v, ['address', 'phone'])) : api.post('/branches', clean(v))));
    if (r) {
      onSaved();
      onClose();
    }
  };
  return (
    <Dialog open={open} onClose={onClose} title={branch ? 'Filialni tahrirlash' : 'Yangi filial'} footer={<><Button onClick={onClose}>{t("Bekor qilish")}</Button><Button variant="primary" type="submit" form="branch-form" busy={s.busy}>{t("Saqlash")}</Button></>}>
      <form id="branch-form" className="form" onSubmit={submit} noValidate>
        <TextInput label="Nomi" value={v.name} onChange={set('name')} error={s.fields.name} autoFocus />
        <TextInput label="Manzil" optional value={v.address} onChange={set('address')} error={s.fields.address} />
        <TextInput label="Telefon" optional type="tel" value={v.phone} onChange={set('phone')} error={s.fields.phone} />
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
      </form>
    </Dialog>
  );
});
