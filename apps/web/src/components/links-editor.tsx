'use client';
// Havolalar ro'yxati (vazifa biriktirmalari / topshiriq fayllari): fayl yuklash yo'q, faqat http(s) havola.
import { useT } from '@/lib/i18n';
import type { LinkItem } from '@/app/(panel)/assignments/types';
import { Icon } from './icons';
import { Button } from './ui';

export function LinksEditor({ value, onChange, max = 10 }: { value: LinkItem[]; onChange: (v: LinkItem[]) => void; max?: number }) {
  const t = useT();
  const set = (i: number, patch: Partial<LinkItem>) => onChange(value.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div className="stack-sm">
      {value.map((l, i) => (
        <div className="row links-row" key={i}>
          <input className="input" aria-label={t("Havola nomi")} placeholder={t("Nomi")} value={l.name} maxLength={100} onChange={(e) => set(i, { name: e.target.value })} />
          <input className="input" aria-label={t("Havola manzili")} placeholder={t("https://...")} inputMode="url" value={l.url} maxLength={500} onChange={(e) => set(i, { url: e.target.value })} />
          <Button variant="ghost" size="sm" aria-label="Havolani o'chirish" onClick={() => onChange(value.filter((_, j) => j !== i))} icon={<Icon.close />} />
        </div>
      ))}
      {value.length < max ? (
        <div>
          <Button size="sm" onClick={() => onChange([...value, { name: '', url: '' }])} icon={<Icon.plus />}>
            {t("Havola qo'shish")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export const cleanLinks = (v: LinkItem[]) => v.map((l) => ({ name: l.name.trim() || l.url.trim(), url: l.url.trim() })).filter((l) => l.url);

export function LinkList({ items }: { items: LinkItem[] }) {
  if (!items.length) return null;
  return (
    <ul className="link-list">
      {items.map((l) => (
        <li key={l.url}>
          <a className="link" href={l.url} target="_blank" rel="noreferrer noopener">
            {l.name}
          </a>
        </li>
      ))}
    </ul>
  );
}
