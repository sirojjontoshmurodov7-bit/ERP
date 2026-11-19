// BFF (backend-for-frontend): brauzer API'ga to'g'ridan-to'g'ri murojaat qilmaydi va tokenlarni ko'rmaydi.
// Access va refresh token faqat httpOnly cookie'da; Next.js route handler'lari ularni API'ga Authorization sarlavhasi qilib uzatadi.
import 'server-only';
import type { NextRequest } from 'next/server';

export const ACCESS_COOKIE = 'erp_at';
export const REFRESH_COOKIE = 'erp_rt';
const REFRESH_MAX_AGE = 30 * 24 * 3600;

export const API_URL = (process.env.API_URL ?? 'http://localhost:3001').replace(/\/+$/, '');

/** Prod'da Secure; lokal http uchun `WEB_SECURE_COOKIES=false`. */
const secure = process.env.WEB_SECURE_COOKIES ? process.env.WEB_SECURE_COOKIES === 'true' : process.env.NODE_ENV === 'production';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface CookieWrite {
  name: string;
  value: string;
  maxAge: number;
}

export const cookieOptions = (maxAge: number) => ({ httpOnly: true, secure, sameSite: 'strict' as const, path: '/', maxAge });

export function pairCookies(pair: TokenPair): CookieWrite[] {
  return [
    // access cookie token muddatidan biroz oldin tugaydi: muddati o'tgan tokenni yubormaslik uchun
    { name: ACCESS_COOKIE, value: pair.accessToken, maxAge: Math.max(30, pair.expiresIn - 30) },
    { name: REFRESH_COOKIE, value: pair.refreshToken, maxAge: REFRESH_MAX_AGE },
  ];
}

export const clearCookies = (): CookieWrite[] => [
  { name: ACCESS_COOKIE, value: '', maxAge: 0 },
  { name: REFRESH_COOKIE, value: '', maxAge: 0 },
];

/** Mijoz IP va user-agent'ni API'ga uzatish (API `TRUST_PROXY` bilan ishonsa, login cheklovi haqiqiy IP bo'yicha). */
export function clientHeaders(req: NextRequest): Record<string, string> {
  const h: Record<string, string> = {};
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) h['x-forwarded-for'] = fwd;
  const ua = req.headers.get('user-agent');
  if (ua) h['user-agent'] = ua.slice(0, 300);
  return h;
}

/**
 * CSRF: o'zgartiruvchi so'rovlar faqat o'z ilovamizdan. Cookie'lar SameSite=Strict, ustiga maxsus sarlavha
 * (boshqa sayt uni CORS preflight'siz yubora olmaydi) va Origin bo'lsa u o'z hostimiz bo'lishi shart.
 */
export function csrfOk(req: NextRequest): boolean {
  if (req.method === 'GET' || req.method === 'HEAD') return true;
  if (req.headers.get('x-erp-request') !== '1') return false;
  const origin = req.headers.get('origin');
  if (!origin) return true;
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// Bir refresh token bilan parallel yangilashlar bitta so'rovga birlashtiriladi: API ishlatilgan refresh tokenni qayta ko'rsa
// HAMMA sessiyani yopadi (o'g'irlik belgisi), shuning uchun bir nechta tab/so'rov bir vaqtda yangilasa foydalanuvchi chiqib ketmasin.
// Natija qisqa muddat eslab qolinadi: eski cookie bilan kech kelgan so'rov ham yangi juftni oladi.
const inflight = new Map<string, Promise<TokenPair | null>>();
const recent = new Map<string, { pair: TokenPair; until: number }>();
const RECENT_MS = 60_000;

export async function refreshPair(refreshToken: string, headers: Record<string, string>): Promise<TokenPair | null> {
  const now = Date.now();
  for (const [k, v] of recent) if (v.until <= now) recent.delete(k);
  const hit = recent.get(refreshToken);
  if (hit) return hit.pair;
  let p = inflight.get(refreshToken);
  if (!p) {
    p = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...headers },
          body: JSON.stringify({ refreshToken }),
          cache: 'no-store',
        });
        if (!res.ok) return null;
        const pair = (await res.json()) as TokenPair;
        recent.set(refreshToken, { pair, until: Date.now() + RECENT_MS });
        return pair;
      } catch {
        return null;
      } finally {
        inflight.delete(refreshToken);
      }
    })();
    inflight.set(refreshToken, p);
  }
  return p;
}

/** Tarmoq uzilsa ham API xatosi bilan bir xil shakldagi javob. */
export const unavailable = () => Response.json({ code: 'API_UNAVAILABLE', message: "Server bilan aloqa yo'q. Birozdan keyin qayta urinib ko'ring" }, { status: 503 });
