'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, TextInput } from '@/components/ui';
import { ApiError, api, auth, errorText } from '@/lib/api';

export function ChangePasswordForm({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fe: Record<string, string> = {};
    if (!current) fe.current = 'Joriy parolni kiriting';
    if (next.length < 8) fe.next = "Kamida 8 belgi bo'lsin";
    else if (next === current) fe.next = "Yangi parol eskisidan farq qilsin";
    if (repeat !== next) fe.repeat = 'Parollar mos emas';
    setErrors(fe);
    if (Object.keys(fe).length) return;
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/change-password', { currentPassword: current, newPassword: next });
      if (onDone) {
        setCurrent('');
        setNext('');
        setRepeat('');
        onDone();
      } else router.replace('/');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_CREDENTIALS') setErrors({ current: "Joriy parol noto'g'ri" });
      else if (err instanceof ApiError && err.status === 401) router.replace('/login');
      else if (err instanceof ApiError && err.code === 'PASSWORD_UNCHANGED') setErrors({ next: 'Yangi parol eskisidan farq qilsin' });
      else setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form" onSubmit={submit} noValidate>
      <TextInput label="Joriy parol" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={errors.current} />
      <TextInput label="Yangi parol" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} error={errors.next} hint="Kamida 8 belgi" />
      <TextInput label="Yangi parolni takrorlang" type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} error={errors.repeat} />
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="row">
        <Button type="submit" variant="primary" busy={busy}>
          Parolni saqlash
        </Button>
        {!onDone ? (
          <Button
            variant="ghost"
            onClick={async () => {
              await auth.logout().catch(() => {});
              router.replace('/login');
            }}
          >
            Chiqish
          </Button>
        ) : null}
      </div>
    </form>
  );
}
