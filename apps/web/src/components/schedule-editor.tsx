'use client';
// Haftalik jadval: kun, boshlanish, tugash, xona. Guruh yaratish va "Jadval" tabida ishlatiladi.
import { tr, useT } from '@/lib/i18n';
import { WEEKDAYS } from '@/lib/format';
import { Icon } from './icons';
import { Button } from './ui';

export interface Slot {
  weekday: number;
  startTime: string;
  endTime: string;
  room?: string | null;
}

export function ScheduleEditor({ value, onChange, disabled }: { value: Slot[]; onChange: (v: Slot[]) => void; disabled?: boolean }) {
  const t = useT();
  const set = (i: number, patch: Partial<Slot>) => onChange(value.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const add = () => {
    const last = value.at(-1);
    onChange([...value, last ? { ...last, weekday: (last.weekday % 7) + 1 } : { weekday: 1, startTime: '09:00', endTime: '10:30', room: '' }]);
  };
  return (
    <div className="stack-sm">
      {value.length ? (
        <table className="table schedule-table">
          <thead>
            <tr>
              <th>{t("Kun")}</th>
              <th>{t("Boshlanish")}</th>
              <th>{t("Tugash")}</th>
              <th>{t("Xona")}</th>
              <th className="actions-cell" aria-label={t("Amallar")} />
            </tr>
          </thead>
          <tbody>
            {value.map((s, i) => {
              const bad = s.endTime <= s.startTime;
              return (
                <tr key={i}>
                  <td>
                    <select className="select" aria-label={t("Hafta kuni")} value={s.weekday} disabled={disabled} onChange={(e) => set(i, { weekday: Number(e.target.value) })}>
                      {WEEKDAYS.map((d, k) => (
                        <option key={d} value={k + 1}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input className="input num" type="time" aria-label={t("Boshlanish vaqti")} value={s.startTime} disabled={disabled} onChange={(e) => set(i, { startTime: e.target.value })} />
                  </td>
                  <td>
                    <input className="input num" type="time" aria-label={t("Tugash vaqti")} aria-invalid={bad || undefined} value={s.endTime} disabled={disabled} onChange={(e) => set(i, { endTime: e.target.value })} />
                  </td>
                  <td>
                    <input className="input" aria-label={t("Xona")} value={s.room ?? ''} maxLength={60} disabled={disabled} onChange={(e) => set(i, { room: e.target.value })} placeholder={t("Ixtiyoriy")} />
                  </td>
                  <td className="actions-cell">
                    <Button variant="ghost" size="sm" disabled={disabled} aria-label="Qatorni o'chirish" onClick={() => onChange(value.filter((_, j) => j !== i))} icon={<Icon.close />} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="muted">{t("Jadval belgilanmagan.")}</p>
      )}
      <div>
        <Button size="sm" disabled={disabled || value.length >= 21} onClick={add} icon={<Icon.plus />}>
          {t("Kun qo'shish")}
        </Button>
      </div>
    </div>
  );
}

/** API uchun: bo'sh xonani olib tashlaydi. */
export const scheduleBody = (v: Slot[]) => v.map((s) => ({ weekday: s.weekday, startTime: s.startTime, endTime: s.endTime, ...(s.room?.trim() ? { room: s.room.trim() } : {}) }));
export const scheduleText = (v: Slot[]) => (v.length ? v.map((s) => `${WEEKDAYS[s.weekday - 1]?.slice(0, 2)} ${s.startTime}`).join(', ') : tr("yo'q"));
