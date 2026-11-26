// Tarjima: lug'at butunligi, o'zgaruvchilar, hook'siz yordamchilar (serverda sukut o'zbekcha).
import { describe, expect, it } from 'vitest';
import { WEEKDAYS, monthLabel } from '../src/lib/format';
import { translate, trMap } from '../src/lib/i18n';
import { RU } from '../src/lib/i18n-ru';

const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

describe('i18n', () => {
  it("lug'atdagi har tarjima kalitdagi o'zgaruvchilarni saqlaydi", () => {
    const bad = Object.entries(RU).filter(([k, v]) => vars(k) !== vars(v));
    expect(bad).toEqual([]);
  });

  it("o'zgaruvchilarni qo'yadi, yo'q kalitda asl matn qaytadi", () => {
    expect(translate('ru', 'Jami {n} ta qarzdor', { n: 5 })).toBe('Всего должников: 5');
    expect(translate('uz', 'Jami {n} ta qarzdor', { n: 5 })).toBe('Jami 5 ta qarzdor');
    expect(translate('ru', 'Lugatda yoq matn')).toBe('Lugatda yoq matn');
  });

  it("asosiy sahifa va menyu matnlari tarjima qilingan", () => {
    for (const k of ["O'quvchilar", 'Guruhlar', "To'lovlar", 'Markaz boshqaruv paneli', 'Saqlash', 'Bekor qilish', "Login yoki parol noto'g'ri", 'Dushanba', 'Noyabr', 'noyabr']) {
      expect(RU[k], k).toBeTruthy();
    }
  });

  it("serverda (document yo'q) yordamchilar o'zbekcha qaytaradi", () => {
    expect(WEEKDAYS[0]).toBe('Dushanba');
    expect(WEEKDAYS.length).toBe(7);
    expect(monthLabel('2026-11')).toBe('Noyabr 2026');
    expect(trMap({ A: 'Faol' }).A).toBe('Faol');
  });
});
