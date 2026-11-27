// Tarjima: lug'at butunligi, o'zgaruvchilar, hook'siz yordamchilar (serverda sukut o'zbekcha).
import { describe, expect, it } from 'vitest';
import { WEEKDAYS, monthLabel } from '../src/lib/format';
import { translate, trMap } from '../src/lib/i18n';
import { EN } from '../src/lib/i18n-en';
import { RU } from '../src/lib/i18n-ru';
import { toCyrillic } from '../src/lib/translit';

const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

describe('i18n', () => {
  it("lug'atdagi har tarjima kalitdagi o'zgaruvchilarni saqlaydi", () => {
    const bad = Object.entries(RU).filter(([k, v]) => vars(k) !== vars(v));
    expect(bad).toEqual([]);
  });

  it("inglizcha lug'at ruscha bilan bir xil kalitlarda, o'zgaruvchilar saqlangan", () => {
    expect(Object.keys(EN).sort()).toEqual(Object.keys(RU).sort());
    const bad = Object.entries(EN).filter(([k, v]) => vars(k) !== vars(v));
    expect(bad).toEqual([]);
    expect(translate('en', 'Jami {n} ta qarzdor', { n: 5 })).toBe('5 debtors in total');
  });

  it("kirill o'zbekcha: lotindan o'giriladi, o'zgaruvchi va texnik so'zlar saqlanadi", () => {
    expect(toCyrillic("O'quvchilar")).toBe('Ўқувчилар');
    expect(toCyrillic("Yo'l")).toBe('Йўл');
    expect(toCyrillic('Yozish')).toBe('Ёзиш');
    expect(toCyrillic("Ma'lumot yo'q")).toBe('Маълумот йўқ');
    expect(toCyrillic('Eski sana, Eng kam')).toBe('Эски сана, Энг кам');
    expect(toCyrillic('Shanba, Chorshanba')).toBe('Шанба, Чоршанба');
    expect(toCyrillic('{n} ta qarzdor')).toBe('{n} та қарздор');
    expect(toCyrillic('Noyabr')).toBe('Ноябр');
    expect(toCyrillic("Telegram'ga ulash")).toBe('Телеграмга улаш');
    expect(toCyrillic('masalan: payment.create')).toBe('масалан: payment.create');
    expect(translate('uz-cyrl', 'Jami {n} ta qarzdor', { n: 5 })).toBe('Жами 5 та қарздор');
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
