// BFF xavfsizlik mantig'i: CSRF, refresh birlashtirish, cookie muddati, ochiq redirect.
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ACCESS_COOKIE, csrfOk, pairCookies, REFRESH_COOKIE, refreshPair } from '@/lib/bff';
import { safeNext } from '@/lib/safe-next';

const req = (method: string, headers: Record<string, string> = {}) => new NextRequest('http://panel.test/api/students', { method, headers: { host: 'panel.test', ...headers } });

describe('csrfOk', () => {
  it("GET/HEAD har doim o'tadi", () => {
    expect(csrfOk(req('GET'))).toBe(true);
    expect(csrfOk(req('HEAD'))).toBe(true);
  });
  it("o'zgartiruvchi so'rov maxsus sarlavhasiz rad etiladi", () => {
    expect(csrfOk(req('POST'))).toBe(false);
    expect(csrfOk(req('DELETE', { 'x-erp-request': '0' }))).toBe(false);
  });
  it("sarlavha bor, Origin o'z hostimiz yoki yo'q bo'lsa o'tadi; begona Origin rad etiladi", () => {
    expect(csrfOk(req('POST', { 'x-erp-request': '1' }))).toBe(true);
    expect(csrfOk(req('POST', { 'x-erp-request': '1', origin: 'http://panel.test' }))).toBe(true);
    expect(csrfOk(req('POST', { 'x-erp-request': '1', origin: 'http://evil.test' }))).toBe(false);
    expect(csrfOk(req('PATCH', { 'x-erp-request': '1', origin: 'not a url' }))).toBe(false);
  });
});

describe('pairCookies', () => {
  it("access cookie token muddatidan 30 s oldin tugaydi, refresh 30 kun", () => {
    const c = pairCookies({ accessToken: 'a', refreshToken: 'r', expiresIn: 900 });
    expect(c.find((x) => x.name === ACCESS_COOKIE)?.maxAge).toBe(870);
    expect(c.find((x) => x.name === REFRESH_COOKIE)?.maxAge).toBe(30 * 24 * 3600);
  });
});

describe('refreshPair', () => {
  afterEach(() => vi.unstubAllGlobals());

  it("bir refresh token bilan parallel so'rovlar API'ga bitta so'rov yuboradi va natija qisqa muddat eslab qolinadi", async () => {
    const fetchMock = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 20));
      return new Response(JSON.stringify({ accessToken: 'A2', refreshToken: 'R2', expiresIn: 900 }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const [a, b, c] = await Promise.all([refreshPair('R1-parallel', {}), refreshPair('R1-parallel', {}), refreshPair('R1-parallel', {})]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
    expect(b).toEqual(c);
    expect(await refreshPair('R1-parallel', {})).toEqual(a); // kech kelgan so'rov ham eski cookie bilan yangi juftni oladi
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('API rad etsa null, tarmoq xatosida null; muvaffaqiyatsiz natija eslab qolinmaydi', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })));
    expect(await refreshPair('R-bad', {})).toBeNull();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('down'); }));
    expect(await refreshPair('R-bad', {})).toBeNull();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ accessToken: 'x', refreshToken: 'y', expiresIn: 900 }), { status: 200 })));
    expect(await refreshPair('R-bad', {})).toMatchObject({ accessToken: 'x' });
  });
});

describe('safeNext (login dan keyingi yo\'naltirish)', () => {
  it("faqat o'z ilovamizdagi nisbiy yo'l", () => {
    expect(safeNext('/students?tab=1')).toBe('/students?tab=1');
    expect(safeNext(null)).toBe('/dashboard');
    expect(safeNext('https://evil.test')).toBe('/dashboard');
    expect(safeNext('//evil.test')).toBe('/dashboard');
    expect(safeNext('/\\evil.test')).toBe('/dashboard');
    expect(safeNext('/api/auth/logout')).toBe('/dashboard');
  });
});
