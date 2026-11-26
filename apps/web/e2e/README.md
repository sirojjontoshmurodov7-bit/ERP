# Brauzer e2e (Playwright)

Ishlab turgan stack'ga qarshi yuradi: Postgres + API + web. Ma'lumotni `global-setup.ts` API orqali o'zi yaratadi
(har ishga tushirishda yangi "E2E Markaz ...": rahbar, ustoz, bugungi jadvalli guruh, o'quvchi). Mavjud markazlarga tegmaydi.

Oqimlar (`flows.spec.ts`): landing va noto'g'ri parol, sessiyasiz sahifa → login → qaytish, rahbar bosh sahifasi
(KPI, mavzu saqlanishi, yon panel), o'quvchi qo'shish + to'lov kvitansiyasi, ustozning birinchi kirishi va davomat,
o'quvchi portali, super admin paneli, mobil menyu (`@mobile`, Pixel 7).

## Lokal

1. Bir marta e2e super admin (faqat lokal baza):
   ```bash
   SUPER_ADMIN_LOGIN=e2e.root SUPER_ADMIN_PASSWORD=<parol> pnpm --filter @erp/api db:create-super-admin
   ```
   Birinchi ishga tushirishda setup parolni `<parol>-e2e` ga almashtiradi (majburiy almashtirish), keyingilarida shuni ishlatadi.
2. API va web ishlab tursin (production rejimi CSP'ni ham sinaydi):
   ```bash
   pnpm --filter @erp/api build && node apps/api/dist/main
   pnpm --filter @erp/web build && cd apps/web && API_URL=http://localhost:3001 WEB_SECURE_COOKIES=false npx next start -p 3000
   ```
3. Testlar (Windows'da o'rnatilgan Edge bilan, brauzer yuklab olinmaydi):
   ```bash
   E2E_ROOT_LOGIN=e2e.root E2E_ROOT_PASSWORD=<parol> E2E_CHANNEL=msedge pnpm --filter @erp/web e2e
   ```
   `E2E_BASE_URL` (sukut `http://localhost:3000`) va `E2E_API_URL` (sukut `http://localhost:3001`) bilan boshqa portlar.

CI'da `e2e-browser` job'i hammasini o'zi ko'taradi (`.github/workflows/ci.yml`); xatoda hisobot va loglar artefakt bo'ladi.
