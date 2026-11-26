'use client';
// Panelning umumiy komponentlari: tugma, maydonlar, holatlar (yuklanish/bo'sh/xato), dialog, sahifalash, xabarlar.
import Link from 'next/link';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { errorText } from '@/lib/api';
import { Icon } from './icons';

// ---------------------------------------------------------------- tugma
type BtnVariant = 'default' | 'primary' | 'ghost' | 'danger' | 'danger-primary';
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: 'md' | 'sm';
  busy?: boolean;
  icon?: ReactNode;
}
const btnClass = (variant: BtnVariant = 'default', size: 'md' | 'sm' = 'md', extra = '') =>
  ['btn', variant === 'primary' && 'btn--primary', variant === 'ghost' && 'btn--ghost', variant === 'danger' && 'btn--danger', variant === 'danger-primary' && 'btn--danger btn--primary', size === 'sm' && 'btn--sm', extra].filter(Boolean).join(' ');

export function Button({ variant, size, busy, icon, className, children, disabled, type = 'button', ...rest }: BtnProps) {
  return (
    <button type={type} className={btnClass(variant, size, className)} disabled={disabled || busy} aria-busy={busy || undefined} {...rest}>
      {busy ? <span className="spinner" aria-hidden /> : icon}
      {children}
    </button>
  );
}
export function ButtonLink({ href, variant, size, icon, children }: { href: string; variant?: BtnVariant; size?: 'md' | 'sm'; icon?: ReactNode; children: ReactNode }) {
  return (
    <Link href={href} className={btnClass(variant, size)}>
      {icon}
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------- maydonlar
interface FieldProps {
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  className?: string;
  children: (id: string, describedBy: string | undefined, invalid: boolean) => ReactNode;
}
export function Field({ label, error, hint, optional, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      <label className="field-label" htmlFor={id}>
        {label}
        {optional ? <span className="opt"> (ixtiyoriy)</span> : null}
      </label>
      {children(id, [hintId, errId].filter(Boolean).join(' ') || undefined, Boolean(error))}
      {hint && !error ? <span className="field-hint" id={hintId}>{hint}</span> : null}
      {error ? <span className="field-error" id={errId} role="alert">{error}</span> : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: ReactNode; optional?: boolean; fieldClass?: string };
export function TextInput({ label, error, hint, optional, fieldClass, className, ...rest }: InputProps) {
  return (
    <Field label={label} error={error} hint={hint} optional={optional} className={fieldClass}>
      {(id, d, invalid) =>
        rest.type === 'password' ? (
          <PasswordField id={id} describedBy={d} invalid={invalid} className={className} {...rest} />
        ) : (
          <input id={id} aria-describedby={d} aria-invalid={invalid || undefined} className={['input', className].filter(Boolean).join(' ')} {...rest} />
        )
      }
    </Field>
  );
}

// Parol maydoni: ko'rsatish/yashirish tugmasi bilan
function PasswordField({ id, describedBy, invalid, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { id: string; describedBy?: string; invalid?: boolean }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="input-wrap">
      <input id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined} className={['input', 'input--eye', className].filter(Boolean).join(' ')} {...props} type={shown ? 'text' : 'password'} />
      <button type="button" className="eye-btn" aria-label={shown ? 'Parolni yashirish' : "Parolni ko'rsatish"} aria-pressed={shown} onClick={() => setShown((v) => !v)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          {shown ? <path d="M4 4l16 16" /> : null}
        </svg>
      </button>
    </div>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; hint?: ReactNode; optional?: boolean; fieldClass?: string; options: { value: string; label: string }[]; placeholder?: string };
export function SelectInput({ label, error, hint, optional, fieldClass, options, placeholder, ...rest }: SelectProps) {
  return (
    <Field label={label} error={error} hint={hint} optional={optional} className={fieldClass}>
      {(id, d, invalid) => (
        <select id={id} aria-describedby={d} aria-invalid={invalid || undefined} className="select" {...rest}>
          {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

type AreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; hint?: ReactNode; optional?: boolean; fieldClass?: string };
export function TextArea({ label, error, hint, optional, fieldClass, ...rest }: AreaProps) {
  return (
    <Field label={label} error={error} hint={hint} optional={optional} className={fieldClass}>
      {(id, d, invalid) => <textarea id={id} aria-describedby={d} aria-invalid={invalid || undefined} className="textarea" {...rest} />}
    </Field>
  );
}

/** Pul maydoni: kiritishda bo'shliq bilan guruhlaydi, qiymat butun son (so'm). */
export function MoneyInput({ label, value, onChange, error, hint, optional, fieldClass, ...rest }: Omit<InputProps, 'value' | 'onChange'> & { value: number | ''; onChange: (v: number | '') => void }) {
  const shown = value === '' ? '' : value.toLocaleString('ru-RU').replace(/\s| /g, ' ');
  return (
    <Field label={label} error={error} hint={hint ?? "so'm"} optional={optional} className={fieldClass}>
      {(id, d, invalid) => (
        <input
          id={id}
          aria-describedby={d}
          aria-invalid={invalid || undefined}
          className="input num"
          inputMode="numeric"
          autoComplete="off"
          value={shown}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 13);
            onChange(digits === '' ? '' : Number(digits));
          }}
          {...rest}
        />
      )}
    </Field>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- sahifa sarlavhasi
export function PageHead({ title, sub, actions, crumbs }: { title: string; sub?: ReactNode; actions?: ReactNode; crumbs?: { href: string; label: string }[] }) {
  return (
    <div className="page-head">
      <div className="page-head-text">
        {crumbs?.length ? (
          <nav className="crumbs" aria-label="Yo'l">
            {crumbs.map((c) => (
              <Link key={c.href} href={c.href}>
                {c.label}
              </Link>
            ))}
          </nav>
        ) : null}
        <h1>{title}</h1>
        {sub ? <p className="page-head-sub">{sub}</p> : null}
      </div>
      {actions ? <div className="actions">{actions}</div> : null}
    </div>
  );
}

// ---------------------------------------------------------------- holatlar
export function Skeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="skeleton-rows" aria-busy="true" aria-label="Yuklanmoqda">
      {Array.from({ length: rows }, (_, i) => (
        <div className="skeleton-row" key={i} style={{ gridTemplateColumns: `2fr repeat(${cols - 1}, 1fr)` }}>
          {Array.from({ length: cols }, (_, j) => (
            <span className="skeleton" key={j} style={{ width: `${60 + ((i * 7 + j * 13) % 35)}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Empty({ title, text, action }: { title: string; text?: ReactNode; action?: ReactNode }) {
  return (
    <div className="state">
      <p className="state-title">{title}</p>
      {text ? <p className="state-text">{text}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="state state--error" role="alert">
      <p className="state-title">Ma&apos;lumot yuklanmadi</p>
      <p className="state-text">{errorText(error)}</p>
      {onRetry ? (
        <Button size="sm" onClick={onRetry}>
          Qayta urinish
        </Button>
      ) : null}
    </div>
  );
}

/** Ma'lumot bloki: yuklanish, xato, bo'sh va to'liq holatlarni bir joyda hal qiladi. */
export function DataView<T>({ state, empty, skeleton, children }: { state: { data: T | undefined; error: unknown; loading: boolean; reload: () => void }; empty?: (d: T) => ReactNode | null; skeleton?: ReactNode; children: (d: T) => ReactNode }) {
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (state.data === undefined) return <>{skeleton ?? <Skeleton />}</>;
  const e = empty?.(state.data);
  if (e) return <>{e}</>;
  return <>{children(state.data)}</>;
}

// ---------------------------------------------------------------- sahifalash
export function Pager({ offset, limit, count, total, onChange }: { offset: number; limit: number; count: number; total?: number; onChange: (offset: number) => void }) {
  if (offset === 0 && count < limit && total === undefined) return null;
  const from = count ? offset + 1 : 0;
  const to = offset + count;
  const hasNext = total !== undefined ? to < total : count === limit;
  return (
    <div className="table-foot">
      <span className="fig">
        {from}-{to}
        {total !== undefined ? ` / ${total}` : ''}
      </span>
      <div className="pager">
        <Button size="sm" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - limit))}>
          Oldingi
        </Button>
        <Button size="sm" disabled={!hasNext} onClick={() => onChange(offset + limit)}>
          Keyingi
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- dialog
export function Dialog({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  // id sarlavha matnidan emas: bo'shliqli id aria-labelledby'da ikki id bo'lib o'qiladi va dialog nomsiz qoladi
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className={wide ? 'dialog dialog--wide' : 'dialog'} onClose={onClose} onCancel={onClose} aria-labelledby={titleId}>
      {open ? (
        <div className="dialog-inner">
          <div className="dialog-head">
            <h2 id={titleId}>{title}</h2>
            <Button variant="ghost" className="btn--icon" aria-label="Yopish" onClick={onClose} icon={<Icon.close />} />
          </div>
          <div className="dialog-body">{children}</div>
          {footer ? <div className="dialog-foot">{footer}</div> : null}
        </div>
      ) : null}
    </dialog>
  );
}

/**
 * Dialog faqat ochiqligida mount bo'ladi: ichki forma holati har ochilishda boshidan boshlanadi (tozalash effektlari kerak emas).
 * Yopilganda komponent butunlay olib tashlanadi.
 */
export function whenOpen<P extends { open: boolean }>(Inner: (p: P) => ReactNode) {
  function WhenOpen(p: P) {
    return p.open ? <Inner {...p} /> : null;
  }
  return WhenOpen;
}

type ConfirmProps = { open: boolean; onClose: () => void; title: string; text: ReactNode; confirmLabel: string; danger?: boolean; reason?: { label: string; required?: boolean }; onConfirm: (reason: string) => Promise<void> };
/** Tasdiqlash (qaytarib bo'lmaydigan amallar uchun): ixtiyoriy sabab maydoni bilan. */
export const Confirm = whenOpen(function ConfirmInner({ open, onClose, title, text, confirmLabel, danger, reason, onConfirm }: ConfirmProps) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [why, setWhy] = useState('');
  const go = async () => {
    if (reason?.required && why.trim().length < 3) {
      setErr("Sababni yozing (kamida 3 belgi)");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await onConfirm(why.trim());
      onClose();
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button onClick={onClose}>Bekor qilish</Button>
          <Button variant={danger ? 'danger-primary' : 'primary'} busy={busy} onClick={go}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="stack">
        <p>{text}</p>
        {reason ? <TextArea label={reason.label} value={why} onChange={(e) => setWhy(e.target.value)} optional={!reason.required} maxLength={500} /> : null}
        {err ? <p className="form-error">{err}</p> : null}
      </div>
    </Dialog>
  );
});

// ---------------------------------------------------------------- xabarlar
interface ToastItem {
  id: number;
  text: string;
  kind: 'ok' | 'error';
}
const ToastCtx = createContext<(text: string, kind?: 'ok' | 'error') => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, kind: 'ok' | 'error' = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs.slice(-3), { id, text, kind }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), kind === 'error' ? 7000 : 4000);
  }, []);
  return (
    <ToastCtx value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={t.kind === 'error' ? 'toast toast--error' : 'toast'}>
            <span className="toast-text">{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx>
  );
}

// ---------------------------------------------------------------- holat yorlig'i
export function Tag({ kind = 'default', children }: { kind?: 'default' | 'ok' | 'warn' | 'bad' | 'mute' | 'info' | 'violet'; children: ReactNode }) {
  return <span className={kind === 'default' ? 'tag' : `tag tag--${kind}`}>{children}</span>;
}

export function Stat({ label, value, note, tone }: { label: string; value: ReactNode; note?: ReactNode; tone?: 'debt' }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className={tone === 'debt' ? 'stat-value stat-value--debt' : 'stat-value'}>{value}</span>
      {note ? <span className="stat-note">{note}</span> : null}
    </div>
  );
}
