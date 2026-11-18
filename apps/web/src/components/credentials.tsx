'use client';
// Yangi akkaunt yoki parol tiklangandan keyin: login va vaqtinchalik parol FAQAT shu yerda, bir marta ko'rsatiladi.
import { useState } from 'react';
import { Button, Dialog } from './ui';

export interface Credentials {
  fullName: string;
  login: string;
  temporaryPassword: string;
}

export function CredentialsDialog({ value, onClose }: { value: Credentials | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(`Login: ${value.login}\nVaqtinchalik parol: ${value.temporaryPassword}`);
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
          <Button onClick={copy}>{copied ? 'Nusxa olindi' : 'Nusxa olish'}</Button>
          <Button variant="primary" onClick={onClose}>
            Tayyor
          </Button>
        </>
      }
    >
      {value ? (
        <div className="stack">
          <p>
            <strong>{value.fullName}</strong> uchun. Vaqtinchalik parol faqat hozir ko&apos;rinadi: uni egasiga bering. Birinchi kirishda yangi parol o&apos;rnatish so&apos;raladi.
          </p>
          <dl className="kv">
            <dt>Login</dt>
            <dd className="fig">{value.login}</dd>
            <dt>Parol</dt>
            <dd>
              <span className="code-box">{value.temporaryPassword}</span>
            </dd>
          </dl>
        </div>
      ) : null}
    </Dialog>
  );
}
