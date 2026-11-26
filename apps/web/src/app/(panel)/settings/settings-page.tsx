'use client';
import { useT } from '@/lib/i18n';
import { useState } from 'react';
import { Button, DataView, PageHead, SelectInput, Skeleton, TextInput, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { date, money } from '@/lib/format';
import { useSubmit } from '@/lib/forms';
import { useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';

interface CenterSettings {
  name: string;
  status: 'TRIAL' | 'ACTIVE' | 'BLOCKED';
  trialEndsAt: string | null;
  plan: { name: string; maxStudents: number | null; maxBranches: number | null } | null;
  settings: { billingMode: 'GROUP_CYCLE' | 'STUDENT_CYCLE'; graceDays: number; joinProration: 'FULL_MONTH' | 'REMAINING_LESSONS'; attendanceLockDays: number; locale: 'uz' | 'ru' | 'en' };
}

export function SettingsPage() {
  const state = useApi<CenterSettings>('/center/settings');
  return (
    <>
      <PageHead title="Markaz sozlamalari" sub="O'zgarishlar faqat yangi guruhlar va keyingi hisoblarga ta'sir qiladi." />
      <DataView state={state} skeleton={<Skeleton rows={5} cols={2} />}>
        {(d) => <SettingsForm key={JSON.stringify(d.settings)} data={d} onSaved={state.reload} />}
      </DataView>
    </>
  );
}

function SettingsForm({ data, onSaved }: { data: CenterSettings; onSaved: () => void }) {
  const t = useT();
  const { is } = useSession();
  const toast = useToast();
  const readOnly = !is('OWNER');
  const [v, setV] = useState({ ...data.settings, graceDays: String(data.settings.graceDays), attendanceLockDays: String(data.settings.attendanceLockDays) });
  const s = useSubmit();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = { billingMode: v.billingMode, graceDays: Number(v.graceDays), joinProration: v.joinProration, attendanceLockDays: Number(v.attendanceLockDays), locale: v.locale };
    const body = Object.fromEntries(Object.entries(next).filter(([k, x]) => x !== data.settings[k as keyof typeof data.settings]));
    if (!Object.keys(body).length) return toast("O'zgarish yo'q");
    const r = await s.run(() => api.patch('/center/settings', body));
    if (r) {
      toast('Sozlamalar saqlandi');
      onSaved();
    }
  };
  return (
    <div className="split">
      <form className="panel panel-body form" onSubmit={submit} noValidate>
        <h2>{t("Hisob-kitob")}</h2>
        <div className="form-grid">
          <SelectInput
            label="Yangi guruhlar uchun hisob sikli"
            value={v.billingMode}
            disabled={readOnly}
            onChange={set('billingMode')}
            options={[
              { value: 'GROUP_CYCLE', label: "Guruh sikli: hamma bir kunda to'laydi" },
              { value: 'STUDENT_CYCLE', label: "O'quvchi sikli: qo'shilgan kunidan" },
            ]}
          />
          <TextInput label="Imtiyozli kunlar" type="number" min={0} max={60} value={v.graceDays} disabled={readOnly} onChange={set('graceDays')} error={s.fields.graceDays} hint="To'lov muddatidan keyin qarzdor deb hisoblanguncha" />
          <SelectInput
            label="Oy o'rtasida qo'shilganda"
            fieldClass="span-2"
            value={v.joinProration}
            disabled={readOnly}
            onChange={set('joinProration')}
            options={[
              { value: 'FULL_MONTH', label: "To'liq oy narxi olinadi" },
              { value: 'REMAINING_LESSONS', label: 'Faqat qolgan darslar uchun' },
            ]}
            hint="Guruh siklidagi birinchi hisobga ta'sir qiladi"
          />
        </div>
        <h2>{t("Davomat va til")}</h2>
        <div className="form-grid">
          <TextInput label="Davomat necha kundan keyin qulflanadi" type="number" min={0} max={365} value={v.attendanceLockDays} disabled={readOnly} onChange={set('attendanceLockDays')} error={s.fields.attendanceLockDays} hint="Qulflangan darsni faqat ruxsati bor xodim tuzatadi" />
          <SelectInput
            label="Til"
            value={v.locale}
            disabled={readOnly}
            onChange={set('locale')}
            options={[
              { value: 'uz', label: "O'zbekcha" },
              { value: 'ru', label: 'Ruscha' },
              { value: 'en', label: 'Inglizcha' },
            ]}
            hint="Markaz tili Telegram xabarlari uchun; interfeys tilini har kim profil menyusida tanlaydi"
          />
        </div>
        {s.error ? <p className="form-error" role="alert">{s.error}</p> : null}
        {!readOnly ? (
          <div>
            <Button type="submit" variant="primary" busy={s.busy}>
              {t("Saqlash")}
            </Button>
          </div>
        ) : (
          <p className="muted small">{t("Sozlamalarni faqat rahbar o'zgartiradi.")}</p>
        )}
      </form>
      <aside className="panel panel-body stack-sm">
        <h2>{t("Obuna")}</h2>
        <dl className="kv">
          <dt>{t("Markaz")}</dt>
          <dd>{data.name}</dd>
          <dt>{t("Holat")}</dt>
          <dd>{t(data.status === 'TRIAL' ? 'Sinov muddati' : data.status === 'ACTIVE' ? 'Faol' : 'Bloklangan')}</dd>
          {data.trialEndsAt ? (
            <>
              <dt>{t("Sinov tugaydi")}</dt>
              <dd className="fig">{date(data.trialEndsAt.slice(0, 10))}</dd>
            </>
          ) : null}
          <dt>{t("Tarif")}</dt>
          <dd>{data.plan?.name ?? t('Biriktirilmagan')}</dd>
          {data.plan ? (
            <>
              <dt>{t("O'quvchi chegarasi")}</dt>
              <dd className="fig">{data.plan.maxStudents === null ? 'cheksiz' : money(data.plan.maxStudents)}</dd>
              <dt>{t("Filial chegarasi")}</dt>
              <dd className="fig">{data.plan.maxBranches === null ? 'cheksiz' : money(data.plan.maxBranches)}</dd>
            </>
          ) : null}
        </dl>
      </aside>
    </div>
  );
}
