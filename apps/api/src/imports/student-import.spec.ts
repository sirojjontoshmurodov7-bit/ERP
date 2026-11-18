import { todayLocal } from '../common/dates.js';
import { mapHeader, norm, parseDate, parseRow, phoneKey } from './student-import.js';

describe('student-import: sarlavha', () => {
  it("o'zbek, rus, ingliz sarlavhalari va apostrof/bo'shliq farqlari bir maydonga o'tadi", () => {
    expect(norm("Tug'ilgan sana")).toBe('tugilgansana');
    expect(norm('Tugʻilgan  sana')).toBe('tugilgansana');
    const m = mapHeader(["F.I.O", 'Telefon raqami', "Tug'ilgan sana", 'Ota-ona ismi', 'Ota-ona telefoni', 'Izoh', 'Filial', 'Guruh', "Qo'shilgan sana", 'Noma\'lum ustun']);
    expect(m.columns).toEqual({ fullName: 0, phone: 1, birthDate: 2, parentName: 3, parentPhone: 4, note: 5, branch: 6, group: 7, joinedAt: 8 });
    expect(m.unknown).toEqual(["Noma'lum ustun"]);
    expect(mapHeader(['Имя', 'Телефон', 'Группа']).columns).toEqual({ fullName: 0, phone: 1, group: 2 });
    expect(mapHeader(['name', 'phone']).columns).toEqual({ fullName: 0, phone: 1 });
  });

  it("takror sarlavha: birinchisi olinadi, ikkinchisi noma'lum", () => {
    const m = mapHeader(['Ism', 'Ism']);
    expect(m.columns).toEqual({ fullName: 0 });
    expect(m.unknown).toEqual(['Ism']);
  });
});

describe('student-import: sana va telefon', () => {
  it('sana formatlari va haqiqiy sana tekshiruvi', () => {
    expect(parseDate('2012-05-17')).toBe('2012-05-17');
    expect(parseDate('17.05.2012')).toBe('2012-05-17');
    expect(parseDate('7/5/2012')).toBe('2012-05-07');
    expect(parseDate('17-05-2012')).toBe('2012-05-17');
    expect(parseDate('31.04.2012')).toBeNull();
    expect(parseDate('2013-02-29')).toBeNull();
    expect(parseDate('2012-13-01')).toBeNull();
    expect(parseDate('kecha')).toBeNull();
    expect(parseDate('29.02.2012')).toBe('2012-02-29');
  });

  it('telefon kaliti faqat raqamlar', () => {
    expect(phoneKey('+998 (90) 123-45-67')).toBe('998901234567');
  });
});

describe('student-import: qator tekshiruvi', () => {
  const map = mapHeader(['Ism', 'Telefon', "Tug'ilgan sana", 'Ota-ona telefoni', 'Izoh', 'Guruh', "Qo'shilgan sana"]);

  it("to'g'ri qator: maydonlar tozalanadi", () => {
    const r = parseRow(5, ['  Ali   Valiyev ', '+998 90 123-45-67', '17.05.2012', '', 'Izoh', 'IELTS 1', ''], map);
    expect(r.errors).toEqual([]);
    expect(r.value).toMatchObject({ row: 5, fullName: 'Ali Valiyev', phone: '+998 90 123-45-67', birthDate: '2012-05-17', parentPhone: null, note: 'Izoh', groupName: 'IELTS 1', joinedAt: null });
  });

  it("xatolar to'planadi: qator, maydon va kod bilan (qiymatlarsiz)", () => {
    const r = parseRow(7, ['A', 'abc', '31.02.2012', '12', 'x'.repeat(501), '', todayLocal()], map);
    expect(r.value).toBeUndefined();
    expect(r.errors.map((e) => [e.field, e.code])).toEqual([
      ['fullName', 'MISSING_NAME'],
      ['phone', 'INVALID_PHONE'],
      ['birthDate', 'INVALID_DATE'],
      ['parentPhone', 'INVALID_PHONE'],
      ['note', 'TOO_LONG'],
      ['joinedAt', 'JOINED_WITHOUT_GROUP'],
    ]);
    expect(r.errors.every((e) => e.row === 7)).toBe(true);
    expect(JSON.stringify(r.errors)).not.toMatch(/abc|31\.02/); // kiritilgan qiymat xabarga tushmaydi
  });

  it("kelajak sanalari rad etiladi; ustun yo'q bo'lsa bo'sh hisoblanadi", () => {
    const future = parseRow(2, ['Ali', '', '01.01.2999', '', '', 'G', ''], map);
    expect(future.errors.map((e) => e.code)).toEqual(['DATE_IN_FUTURE']);
    const onlyName = parseRow(2, ['Vali'], mapHeader(['Ism']));
    expect(onlyName.errors).toEqual([]);
    expect(onlyName.value).toMatchObject({ fullName: 'Vali', phone: null, groupName: null });
  });
});
