import { generateTempPassword } from '../auth/temp-password.js';
import { slugify } from './slug.js';

describe('slugify', () => {
  it.each([
    ["Najot Ta'lim", 'najot-talim'],
    ['Нажот Таълим', 'najot-talim'],
    ['O‘quv markazi №1', 'oquv-markazi-1'],
    ['  Éverest   Academy!! ', 'everest-academy'],
    ['Қўқон ғазна ҳунар', 'qoqon-gazna-hunar'],
    ['!!!', ''],
  ])('%s -> %s', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it('uzun nomni 40 belgigacha qisqartiradi va oxirida "-" qoldirmaydi', () => {
    const slug = slugify('a'.repeat(39) + ' ' + 'b'.repeat(10));
    expect(slug.length).toBeLessThanOrEqual(40);
    expect(slug.endsWith('-')).toBe(false);
  });
});

describe('generateTempPassword', () => {
  it('format va tasodifiylik', () => {
    const set = new Set(Array.from({ length: 200 }, generateTempPassword));
    expect(set.size).toBe(200);
    for (const p of set) expect(p).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);
  });
});
