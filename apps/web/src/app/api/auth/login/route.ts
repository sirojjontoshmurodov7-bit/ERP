// Kirish: API'dan token juftini oladi va faqat httpOnly cookie'ga yozadi; brauzerga tokensiz javob qaytadi.
import { type NextRequest, NextResponse } from 'next/server';
import { API_URL, clientHeaders, cookieOptions, csrfOk, pairCookies, type TokenPair, unavailable } from '@/lib/bff';

export async function POST(req: NextRequest) {
  if (!csrfOk(req)) return Response.json({ code: 'CSRF', message: "So'rov rad etildi" }, { status: 403 });
  let input: unknown;
  try {
    input = await req.json();
  } catch {
    return Response.json({ code: 'VALIDATION_ERROR', message: "So'rov ma'lumotlari noto'g'ri" }, { status: 400 });
  }
  const { login, password } = (input ?? {}) as { login?: unknown; password?: unknown };
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...clientHeaders(req) },
      body: JSON.stringify({ login, password }),
      cache: 'no-store',
    });
  } catch {
    return unavailable();
  }
  const data = (await res.json().catch(() => ({}))) as Partial<TokenPair> & { mustChangePassword?: boolean; user?: unknown };
  if (!res.ok || !data.accessToken || !data.refreshToken) return Response.json(data, { status: res.ok ? 502 : res.status });

  const out = NextResponse.json({ mustChangePassword: Boolean(data.mustChangePassword), user: data.user }, { headers: { 'cache-control': 'no-store' } });
  for (const w of pairCookies(data as TokenPair)) out.cookies.set(w.name, w.value, cookieOptions(w.maxAge));
  return out;
}
