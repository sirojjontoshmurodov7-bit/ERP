// /api/<yo'l> -> API_URL/<yo'l>. Access token cookie'dan Authorization sarlavhasiga qo'yiladi; muddati o'tgan bo'lsa refresh
// cookie bilan bir marta yangilanib, so'rov qaytariladi. API'ning Set-Cookie'si va ichki sarlavhalari brauzerga chiqmaydi.
import { type NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, API_URL, clearCookies, clientHeaders, cookieOptions, type CookieWrite, csrfOk, pairCookies, REFRESH_COOKIE, refreshPair, unavailable } from '@/lib/bff';

const PASS_RESPONSE_HEADERS = ['content-type', 'content-disposition', 'cache-control'];
const MAX_BODY = 6 * 1024 * 1024; // import fayli 5 MB + multipart chegarasi

// Brauzerdan to'g'ridan-to'g'ri ochilmasligi kerak bo'lgan yo'llar: ularning o'z autentifikatsiyasi bor (sir sarlavhasi)
const BLOCKED = [/^telegram\/webhook$/, /^notifications\/cron$/, /^auth\/(login|refresh|logout)$/];

async function handle(req: NextRequest, ctx: RouteContext<'/api/[...path]'>): Promise<Response> {
  const { path } = await ctx.params;
  const rel = path.map(encodeURIComponent).join('/');
  if (BLOCKED.some((r) => r.test(path.join('/')))) return Response.json({ code: 'NOT_FOUND', message: 'Topilmadi' }, { status: 404 });
  if (!csrfOk(req)) return Response.json({ code: 'CSRF', message: "So'rov rad etildi" }, { status: 403 });

  let body: ArrayBuffer | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const len = Number(req.headers.get('content-length') ?? 0);
    if (len > MAX_BODY) return Response.json({ code: 'PAYLOAD_TOO_LARGE', message: 'Fayl juda katta' }, { status: 413 });
    body = await req.arrayBuffer();
    if (body.byteLength > MAX_BODY) return Response.json({ code: 'PAYLOAD_TOO_LARGE', message: 'Fayl juda katta' }, { status: 413 });
  }

  const target = `${API_URL}/${rel}${req.nextUrl.search}`;
  const fwd = clientHeaders(req);
  const contentType = req.headers.get('content-type');
  const send = (token: string | undefined) =>
    fetch(target, {
      method: req.method,
      headers: { ...fwd, ...(contentType ? { 'content-type': contentType } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}), accept: 'application/json' },
      body: body && body.byteLength ? body : undefined,
      cache: 'no-store',
      redirect: 'manual',
    });

  let access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;
  const writes: CookieWrite[] = [];

  try {
    if (!access && refresh) {
      const pair = await refreshPair(refresh, fwd);
      if (pair) {
        access = pair.accessToken;
        writes.push(...pairCookies(pair));
      } else writes.push(...clearCookies());
    }
    let res = await send(access);
    if (res.status === 401 && refresh && !writes.length) {
      const pair = await refreshPair(refresh, fwd);
      if (pair) {
        writes.push(...pairCookies(pair));
        res = await send(pair.accessToken);
      } else writes.push(...clearCookies());
    }

    const headers = new Headers();
    for (const h of PASS_RESPONSE_HEADERS) {
      const v = res.headers.get(h);
      if (v) headers.set(h, v);
    }
    if (!headers.has('cache-control')) headers.set('cache-control', 'no-store');
    const out = new NextResponse(res.status === 204 ? null : res.body, { status: res.status, headers });
    for (const w of writes) out.cookies.set(w.name, w.value, cookieOptions(w.maxAge));
    return out;
  } catch {
    return unavailable();
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
