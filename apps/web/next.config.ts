import path from 'node:path';
import type { NextConfig } from 'next';

// Docker build'da `NEXT_OUTPUT=standalone`: node_modules'siz mustaqil server (monorepo ildizidan kuzatiladi).
const standalone = process.env.NEXT_OUTPUT === 'standalone';

const isDev = process.env.NODE_ENV === 'development';

// CSP: nonce varianti cacheComponents (PPR) bilan mos emas (statik qobiq skriptlari nonce ololmaydi), shuning uchun
// skriptlar faqat o'z domenimizdan + Next'ning inline oqim skriptlari ('unsafe-inline'). Tashqi skript, iframe,
// <base> almashtirish, boshqa domenga forma yuborish va tashqi ulanish taqiqlangan. React matnni doim ekranlaydi.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // HTTPS'da brauzer keyingi 1 yil faqat HTTPS bilan kiradi (http'da e'tiborsiz qilinadi)
  ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]),
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'same-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  ...(standalone ? { output: 'standalone' as const, outputFileTracingRoot: path.resolve(process.cwd(), '../..') } : {}),
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
