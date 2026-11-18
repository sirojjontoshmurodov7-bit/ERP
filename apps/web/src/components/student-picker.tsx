'use client';
// O'quvchini ism/telefon bo'yicha qidirib tanlash (combobox). Natijalar qamrov bo'yicha serverdan.
import { useEffect, useId, useRef, useState } from 'react';
import { api } from '@/lib/api';

export interface PickedStudent {
  id: string;
  fullName: string;
  login: string;
  phone: string | null;
  branchIds: string[];
}

export function StudentPicker({ value, onChange, label = "O'quvchi", error }: { value: PickedStudent | null; onChange: (s: PickedStudent | null) => void; label?: string; error?: string }) {
  const id = useId();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<PickedStudent[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const tooShort = q.trim().length < 2;

  useEffect(() => {
    if (value || q.trim().length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      api
        .get<{ items: PickedStudent[] }>('/students', { q: q.trim(), status: 'ACTIVE', limit: 8 }, ctrl.signal)
        .then((r) => {
          setItems(r.items);
          setActive(0);
          setOpen(true);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, value]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (value) {
    return (
      <div className="field">
        <span className="field-label">{label}</span>
        <div className="row" data-between>
          <span>
            <span className="cell-main">{value.fullName}</span> <span className="cell-sub fig">{value.phone ?? value.login}</span>
          </span>
          <button type="button" className="link-btn small" onClick={() => onChange(null)}>
            O&apos;zgartirish
          </button>
        </div>
      </div>
    );
  }

  const pick = (s: PickedStudent) => {
    onChange(s);
    setQ('');
    setOpen(false);
  };

  return (
    <div className="field picker" ref={box}>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="input"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-invalid={error ? true : undefined}
        autoComplete="off"
        placeholder="Ism yoki telefon (kamida 2 belgi)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (!open || !items.length) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(items.length - 1, a + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            pick(items[active]!);
          } else if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && !tooShort ? (
        <ul className="picker-list" id={`${id}-list`} role="listbox">
          {loading && !items.length ? <li className="picker-empty">Qidirilmoqda</li> : null}
          {!loading && !items.length ? <li className="picker-empty">Topilmadi</li> : null}
          {items.map((s, i) => (
            <li key={s.id} role="option" aria-selected={i === active} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)} onMouseEnter={() => setActive(i)}>
              <span className="cell-main">{s.fullName}</span>
              <span className="cell-sub fig"> {s.phone ?? s.login}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}
