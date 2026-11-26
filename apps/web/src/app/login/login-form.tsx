'use client';
import { useT } from '@/lib/i18n';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button, TextInput } from '@/components/ui';
import { ApiError, auth, errorText } from '@/lib/api';
import { safeNext } from '@/lib/safe-next';

export function LoginForm() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !password) {
      setError(t('Login va parolni kiriting'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await auth.login(login.trim(), password);
      router.replace(r.mustChangePassword ? '/change-password' : safeNext(params.get('next')));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setError(t("Login yoki parol noto'g'ri"));
      else if (err instanceof ApiError && err.code === 'TOO_MANY_ATTEMPTS') setError(t("Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring"));
      else if (err instanceof ApiError && err.code === 'CENTER_BLOCKED') setError(t('Markaz bloklangan. Platforma administratoriga murojaat qiling'));
      else if (err instanceof ApiError && err.code === 'ACCOUNT_INACTIVE') setError(t('Akkaunt faol emas. Markaz administratoriga murojaat qiling'));
      else setError(errorText(err));
      setBusy(false);
    }
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      <TextInput label="Login" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} value={login} onChange={(e) => setLogin(e.target.value)} autoFocus />
      <TextInput label="Parol" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="primary" busy={busy}>
        {t("Kirish")}
      </Button>
    </form>
  );
}
