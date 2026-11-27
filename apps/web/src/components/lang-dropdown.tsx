'use client';
// Til tanlash: bayroq + qisqa nom tugmasi, ochilganda 4 tilli ro'yxat (✓ tanlangani). Tanlov cookie'da; sahifa qayta yuklanadi,
// shunda hamma matn, sana va xato xabarlari bir tilda bo'ladi. Panel yuqori qatorida, bosh sahifada va kirish sahifasida ishlatiladi.
import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { Icon } from '@/components/icons';
import { type Lang, LANGS, setLang, useLang, useT } from '@/lib/i18n';

const FLAG_PROPS = { width: 24, height: 17, viewBox: '0 0 24 17', 'aria-hidden': true, className: 'flag' } as const;

function FlagUz() {
  return (
    <svg {...FLAG_PROPS}>
      <rect width="24" height="17" rx="2.5" fill="#fff" />
      <path fill="#0099B5" d="M0 2.5A2.5 2.5 0 0 1 2.5 0h19A2.5 2.5 0 0 1 24 2.5V5.5H0z" />
      <path fill="#1EB53A" d="M0 11.5h24v3a2.5 2.5 0 0 1-2.5 2.5h-19A2.5 2.5 0 0 1 0 14.5z" />
      <path fill="#CE1126" d="M0 5.5h24v.8H0zM0 10.7h24v.8H0z" />
      <circle cx="4.6" cy="2.9" r="1.5" fill="#fff" />
      <circle cx="5.4" cy="2.9" r="1.3" fill="#0099B5" />
      <g fill="#fff">
        <circle cx="8" cy="1.7" r=".36" />
        <circle cx="9.6" cy="1.7" r=".36" />
        <circle cx="9.6" cy="3.2" r=".36" />
        <circle cx="11.2" cy="3.2" r=".36" />
      </g>
    </svg>
  );
}
function FlagRu() {
  return (
    <svg {...FLAG_PROPS}>
      <rect width="24" height="17" rx="2.5" fill="#fff" />
      <path fill="#0039A6" d="M0 5.67h24v5.66H0z" />
      <path fill="#D52B1E" d="M0 11.33h24v3.17a2.5 2.5 0 0 1-2.5 2.5h-19A2.5 2.5 0 0 1 0 14.5z" />
      <path fill="#fff" d="M0 2.5A2.5 2.5 0 0 1 2.5 0h19A2.5 2.5 0 0 1 24 2.5v3.17H0z" />
    </svg>
  );
}
function FlagEn() {
  return (
    <svg {...FLAG_PROPS}>
      <rect width="24" height="17" rx="2.5" fill="#1F3A93" />
      <path stroke="#fff" strokeWidth="3.4" d="M0 0l24 17M24 0 0 17" />
      <path stroke="#D52B1E" strokeWidth="1.4" d="M0 0l24 17M24 0 0 17" />
      <path stroke="#fff" strokeWidth="5.4" d="M12 0v17M0 8.5h24" />
      <path stroke="#D52B1E" strokeWidth="3.2" d="M12 0v17M0 8.5h24" />
    </svg>
  );
}
const FLAG: Record<Lang, () => ReactNode> = { uz: FlagUz, 'uz-cyrl': FlagUz, ru: FlagRu, en: FlagEn };

export function LangDropdown({ align = 'right' }: { align?: 'left' | 'right' }) {
  const t = useT();
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const listId = useId();
  const current = LANGS.find((l) => l.value === lang) ?? LANGS[0];
  const Current = FLAG[current.value];

  useEffect(() => {
    if (!open) return;
    items.current[LANGS.findIndex((l) => l.value === lang)]?.focus();
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open, lang]);

  const choose = (value: Lang) => {
    setOpen(false);
    if (value === lang) return;
    setLang(value);
    window.location.reload();
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation();
      setOpen(false);
      btn.current?.focus();
      return;
    }
    if (!open) return;
    const at = items.current.findIndex((el) => el === document.activeElement);
    const go = (i: number) => {
      e.preventDefault();
      items.current[(i + LANGS.length) % LANGS.length]?.focus();
    };
    if (e.key === 'ArrowDown') go(at + 1);
    else if (e.key === 'ArrowUp') go(at - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(LANGS.length - 1);
    else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div className="lang-dd" ref={box} onKeyDown={onKey}>
      <button
        ref={btn}
        type="button"
        className="lang-dd-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${t('Til')}: ${current.label}`}
        onClick={() => setOpen((o) => !o)}
      >
        <Current />
        <span className="lang-dd-code">{current.short}</span>
        <Icon.chevron className="lang-dd-chev" />
      </button>
      {open ? (
        <div className="lang-dd-menu" data-align={align} role="listbox" id={listId} aria-label={t('Til')}>
          {LANGS.map((l, i) => {
            const Flag = FLAG[l.value];
            const on = l.value === lang;
            return (
              <button
                key={l.value}
                ref={(el) => {
                  items.current[i] = el;
                }}
                type="button"
                role="option"
                aria-selected={on}
                lang={l.value === 'uz-cyrl' ? 'uz-Cyrl' : l.value}
                className="lang-dd-item"
                tabIndex={-1}
                onClick={() => choose(l.value)}
              >
                <Flag />
                <span className="lang-dd-name">{l.label}</span>
                {on ? <Icon.check className="lang-dd-tick" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
