import { formatSom, hashLinkCode, newLinkCode, normalizeLinkCode, payrollMessage } from './messages.js';

describe('Telegram xabar yordamchilari', () => {
  it("formatSom ming ajratgich bilan", () => {
    expect(formatSom(0)).toBe("0 so'm");
    expect(formatSom(999)).toBe("999 so'm");
    expect(formatSom(1_250_000)).toBe("1 250 000 so'm");
  });

  it("kod: 10 belgi, noyob alfavit, normallashtirish va xesh barqaror", () => {
    const codes = new Set(Array.from({ length: 200 }, () => newLinkCode()));
    expect(codes.size).toBe(200);
    for (const c of codes) {
      expect(c).toMatch(/^[A-HJ-NP-Z2-9]{10}$/);
      expect(normalizeLinkCode(c.toLowerCase())).toBe(c);
    }
    expect(hashLinkCode('ABCDEFGHJK', 'k')).toBe(hashLinkCode('ABCDEFGHJK', 'k'));
    expect(hashLinkCode('ABCDEFGHJK', 'k')).toMatch(/^[0-9a-f]{64}$/);
  });

  it("maosh xabari", () => {
    expect(payrollMessage('Ali', '2026-11', 4_800_000)).toBe("Hurmatli Ali, 2026-11 oyi uchun maosh hisoblandi: 4 800 000 so'm.");
  });
});
