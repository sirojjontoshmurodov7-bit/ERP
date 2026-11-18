import { deflateRawSync } from 'node:zlib';
import { makeXlsx, makeZip } from '../../test/helpers/xlsx-writer.js';
import { excelSerialToIso, MAX_FILE_BYTES, parseCsv, readSpreadsheet, SpreadsheetError } from './spreadsheet.js';

const code = (fn: () => unknown): string | undefined => {
  try {
    fn();
  } catch (e) {
    return e instanceof SpreadsheetError ? e.code : `other:${String(e)}`;
  }
  return undefined;
};

describe('spreadsheet: CSV', () => {
  it("vergul, nuqtali vergul va tab ajratgichi, qo'shtirnoq, BOM, qator raqamlari", () => {
    expect(parseCsv('﻿ism,telefon\nAli,"+998 90, 123"\n"Ikki ""qator""",x\r\nSoni,y').map((r) => r.cells)).toEqual([
      ['ism', 'telefon'],
      ['Ali', '+998 90, 123'],
      ['Ikki "qator"', 'x'],
      ['Soni', 'y'],
    ]);
    expect(parseCsv('a;b;c\n1;2;3').map((r) => r.cells[2])).toEqual(['c', '3']);
    expect(parseCsv('a\tb\n1\t2').map((r) => r.cells)).toEqual([['a', 'b'], ['1', '2']]);
    expect(parseCsv('x\n\n\ny').map((r) => r.row)).toEqual([1, 2, 3, 4]); // bo'sh qatorlar raqamni siljitadi
  });

  it("readSpreadsheet: bo'sh qatorlar tashlanadi, raqamlash saqlanadi", () => {
    const rows = readSpreadsheet(Buffer.from('ism\n\nAli\n  \nVali'), 'talabalar.csv');
    expect(rows.map((r) => [r.row, r.cells[0]])).toEqual([[1, 'ism'], [3, 'Ali'], [5, 'Vali']]);
  });
});

describe('spreadsheet: XLSX', () => {
  const sample = [
    ['Ism', 'Telefon', "Tug'ilgan sana", 'Izoh'],
    ["Ali <Valiyev> & O'g'li", 998901234567, { date: '2012-05-17' }, null],
    ['Soni', '+998 90 111 22 33', { date: '1999-12-31' }, 'Izoh matni'],
  ];

  it.each([
    ['inlineStr', {}],
    ['sharedStrings', { shared: true }],
    ['siqilmagan (stored)', { shared: true, store: true }],
    ['ikkinchi varaq e\'tiborsiz', { shared: true, extraSheet: true }],
  ])('qiymatlar, sanalar va raqamlar to\'g\'ri o\'qiladi: %s', (_name, opts) => {
    const rows = readSpreadsheet(makeXlsx(sample, opts), 'a.xlsx');
    expect(rows.map((r) => r.row)).toEqual([1, 2, 3]);
    expect(rows[0]!.cells).toEqual(['Ism', 'Telefon', "Tug'ilgan sana", 'Izoh']);
    expect(rows[1]!.cells).toEqual(["Ali <Valiyev> & O'g'li", '998901234567', '2012-05-17']); // oxiridagi bo'sh hujayralar qo'shilmaydi
    expect(rows[2]!.cells).toEqual(['Soni', '+998 90 111 22 33', '1999-12-31', 'Izoh matni']);
  });

  it("Excel seriya sanasi: 1900-yil xatosi va chegaralar", () => {
    expect(excelSerialToIso(1)).toBe('1900-01-01');
    expect(excelSerialToIso(59)).toBe('1900-02-28');
    expect(excelSerialToIso(61)).toBe('1900-03-01');
    expect(excelSerialToIso(45000.75)).toBe('2023-03-15');
    expect(excelSerialToIso(0.5)).toBe('');
  });

  it('ilmiy ko\'rinishdagi uzun raqam (telefon) to\'liq raqam sifatida chiqadi', () => {
    const zip = makeZip([
      { name: 'xl/workbook.xml', data: '<workbook xmlns:r="x"><sheets><sheet name="A" r:id="rId1"/></sheets></workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', data: '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>' },
      { name: 'xl/worksheets/sheet1.xml', data: '<worksheet><sheetData><row r="1"><c r="A1"><v>9.98901234567E+11</v></c><c r="C1" t="b"><v>1</v></c></row></sheetData></worksheet>' },
    ]);
    expect(readSpreadsheet(zip, 'a.xlsx')[0]!.cells).toEqual(['998901234567', '', 'TRUE']);
  });

  it("noto'g'ri fayllar: xlsx emas, buzilgan, bo'sh, katta, qo'llab-quvvatlanmaydigan, parolli, ZIP-bomba", () => {
    expect(code(() => readSpreadsheet(Buffer.from('oddiy matn'), 'a.xlsx'))).toBe('CORRUPT_FILE');
    expect(code(() => readSpreadsheet(Buffer.from('x'), 'a.pdf'))).toBe('UNSUPPORTED_FILE');
    expect(code(() => readSpreadsheet(Buffer.alloc(0), 'a.csv'))).toBe('EMPTY_FILE');
    expect(code(() => readSpreadsheet(Buffer.from(',,\n,,'), 'a.csv'))).toBe('EMPTY_FILE');
    expect(code(() => readSpreadsheet(Buffer.alloc(MAX_FILE_BYTES + 1), 'a.csv'))).toBe('FILE_TOO_LARGE');
    expect(code(() => readSpreadsheet(makeZip([{ name: 'hello.txt', data: 'salom' }]), 'a.xlsx'))).toBe('CORRUPT_FILE'); // workbook.xml yo'q
    const good = makeXlsx([['a']]);
    expect(code(() => readSpreadsheet(good.subarray(0, good.length - 10), 'a.xlsx'))).toBe('CORRUPT_FILE'); // oxiri kesilgan
    const encrypted = Buffer.from(good);
    const cd = encrypted.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
    encrypted.writeUInt16LE(1, cd + 8); // shifrlangan bayrog'i
    expect(code(() => readSpreadsheet(encrypted, 'a.xlsx'))).toBe('CORRUPT_FILE');
    // ZIP-bomba: 25 MB nol baytlar bir necha KB ga siqiladi
    const bomb = makeZip([{ name: 'xl/workbook.xml', data: Buffer.alloc(25 * 1024 * 1024) }]);
    expect(bomb.length).toBeLessThan(100_000);
    expect(code(() => readSpreadsheet(bomb, 'a.xlsx'))).toBe('CORRUPT_FILE');
    // deklaratsiya qilingan o'lchamni aldash: kichik deb yozilgan, aslida katta
    const lying = Buffer.from(makeZip([{ name: 'xl/workbook.xml', data: Buffer.alloc(25 * 1024 * 1024) }]));
    const cdAt = lying.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
    lying.writeUInt32LE(10, cdAt + 24);
    expect(code(() => readSpreadsheet(lying, 'a.xlsx'))).toBe('CORRUPT_FILE'); // maxOutputLength ushlab qoladi
    void deflateRawSync;
  });
});
