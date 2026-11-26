'use client';
import { useT } from '@/lib/i18n';
import { useState } from 'react';
import { ChangePasswordForm } from '@/app/change-password/form';
import { Button, Confirm, PageHead, Tag, useToast } from '@/components/ui';
import { api, errorText } from '@/lib/api';
import { dateTime } from '@/lib/format';
import { ROLE_LABEL, useSession } from '@/lib/session';
import { useApi } from '@/lib/use-api';

export function ProfilePage() {
  const t = useT();
  const { me, is } = useSession();
  const toast = useToast();
  const link = useApi<{ linked: boolean; botConfigured: boolean }>(is('SUPER_ADMIN') ? null : '/notifications/link');
  const [code, setCode] = useState<{ code: string; deepLink: string | null; expiresAt: string } | null>(null);
  const [unlink, setUnlink] = useState(false);
  const getCode = async () => {
    try {
      setCode(await api.post('/notifications/link-code'));
    } catch (e) {
      toast(errorText(e), 'error');
    }
  };
  return (
    <>
      <PageHead title="Profil" sub={`${me.fullName}, ${ROLE_LABEL[me.role].toLowerCase()}`} />
      <div className="grid-2">
        <section className="panel panel-body stack">
          <h2>{t("Parolni almashtirish")}</h2>
          <ChangePasswordForm onDone={() => toast('Parol almashtirildi. Boshqa qurilmalardagi sessiyalar yopildi.')} />
        </section>
        <div className="stack">
          <section className="panel panel-body stack-sm">
            <h2>{t("Hisob")}</h2>
            <dl className="kv">
              <dt>{t("Login")}</dt>
              <dd className="fig">{me.login}</dd>
              <dt>{t("Rol")}</dt>
              <dd>{ROLE_LABEL[me.role]}</dd>
              {me.center ? (
                <>
                  <dt>{t("Markaz")}</dt>
                  <dd>{me.center.name}</dd>
                </>
              ) : null}
            </dl>
          </section>
          {!is('SUPER_ADMIN') ? (
            <section className="panel panel-body stack-sm">
              <div className="row" data-between>
                <h2>{t("Telegram eslatmalari")}</h2>
                {link.data ? link.data.linked ? <Tag kind="ok">{t("Ulangan")}</Tag> : <Tag kind="mute">{t("Ulanmagan")}</Tag> : null}
              </div>
              <p className="muted">{t("Dars, vazifa, to'lov va maosh eslatmalari Telegram orqali keladi.")}</p>
              {link.data && !link.data.botConfigured ? <p className="small muted">{t("Markazda bot hali sozlanmagan: kodni olishingiz mumkin, lekin xabarlar bot sozlangach keladi.")}</p> : null}
              {code ? (
                <div className="stack-sm">
                  <p>Botga quyidagi buyruqni yuboring ({dateTime(code.expiresAt).slice(11)} gacha amal qiladi):</p>
                  <span className="code-box">/start {code.code}</span>
                  {code.deepLink ? (
                    <a className="link" href={code.deepLink} target="_blank" rel="noreferrer">
                      {t("Botni ochish")}
                    </a>
                  ) : null}
                  <div>
                    <Button size="sm" onClick={() => { setCode(null); link.reload(); }}>
                      {t("Ulandi, tekshirish")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="row">
                  <Button onClick={getCode}>{link.data?.linked ? t('Boshqa chatga ulash') : t('Ulash kodini olish')}</Button>
                  {link.data?.linked ? (
                    <Button variant="ghost" onClick={() => setUnlink(true)}>
                      {t("Uzish")}
                    </Button>
                  ) : null}
                </div>
              )}
            </section>
          ) : null}
        </div>
      </div>
      <Confirm
        open={unlink}
        onClose={() => setUnlink(false)}
        title="Telegram'ni uzish"
        text="Eslatmalar endi kelmaydi. Keyin yana ulash mumkin."
        confirmLabel="Uzish"
        onConfirm={async () => {
          await api.del('/notifications/link');
          link.reload();
        }}
      />
    </>
  );
}
