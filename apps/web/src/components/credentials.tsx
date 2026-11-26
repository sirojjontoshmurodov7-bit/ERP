'use client';
// Yangi akkaunt yoki parol tiklangandan keyin: login va vaqtinchalik parol FAQAT shu yerda, bir marta ko'rsatiladi.
import { useT } from '@/lib/i18n';
import { useState } from 'react';
import { Button, Dialog } from './ui';

export interface Credentials {
  fullName: string;
  login: string;
  temporaryPassword: string;
}

export function CredentialsDialog({ value, onClose }: { value: Credentials | null; onClose: () => void }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(`${t('Login')}: ${value.login}\n${t('Vaqtinchalik parol')}: ${value.temporaryPassword}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <Dialog
      open={value !== null}
      onClose={onClose}
      title="Kirish ma'lumotlari"
      footer={
        <>
          <Button onClick={copy}>{copied ? t('Nusxa olindi') : t('Nusxa olish')}</Button>
          <Button variant="primary" onClick={onClose}>
            {t("Tayyor")}
          </Button>
        </>
      }
    >
      {value ? (
        <div className="stack">
          <p>
            <strong>{value.fullName}</strong> {t("uchun. Vaqtinchalik parol faqat hozir ko'rinadi: uni egasiga bering. Birinchi kirishda yangi parol o'rnatish so'raladi.")}
          </p>
          <dl className="kv">
            <dt>{t("Login")}</dt>
            <dd className="fig">{value.login}</dd>
            <dt>{t("Parol")}</dt>
            <dd>
              <span className="code-box">{value.temporaryPassword}</span>
            </dd>
          </dl>
        </div>
      ) : null}
    </Dialog>
  );
}
