// Kirish talab qilinadigan sahifalar: sessiya cookie'si bo'lmasa /login ga yo'naltiradi. Bu faqat qulaylik:
// haqiqiy ruxsat har API so'rovida serverda tekshiriladi.
import { type NextRequest, NextResponse } from 'next/server';

const PUBLIC = ['/login'];

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hasSession = req.cookies.has('erp_rt');
  if (PUBLIC.includes(pathname)) return NextResponse.next();
  if (!hasSession) {
    const url = new URL('/login', req.url);
    if (pathname !== '/') url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)'],
};
