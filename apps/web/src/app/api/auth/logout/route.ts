// Chiqish: API sessiyasini yopadi (xato bo'lsa ham) va cookie'larni o'chiradi.
import { type NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, API_URL, clearCookies, clientHeaders, cookieOptions, csrfOk } from '@/lib/bff';

export async function POST(req: NextRequest) {
  if (!csrfOk(req)) return Response.json({ code: 'CSRF', message: "So'rov rad etildi" }, { status: 403 });
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  if (access) {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: 'POST', headers: { authorization: `Bearer ${access}`, ...clientHeaders(req) }, cache: 'no-store' });
    } catch {
      // API ishlamasa ham brauzer tomonida chiqamiz
    }
  }
  const out = new NextResponse(null, { status: 204 });
  for (const w of clearCookies()) out.cookies.set(w.name, w.value, cookieOptions(w.maxAge));
  return out;
}
