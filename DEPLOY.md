# Deploy qo'llanmasi

Tizim uch qismdan iborat: **API** (NestJS), **web panel** (Next.js, BFF) va **PostgreSQL**. Brauzer faqat web panel bilan gaplashadi; tokenlar `httpOnly` cookie'da turadi, web panel ularni ichki tarmoq orqali API'ga uzatadi.

```
Internet ──443──► Caddy (HTTPS) ──► web:3000 ──/api/*──► api:3001 ──► db:5432
                     │
                     └── /telegram/webhook, /notifications/cron ──► api:3001 (sir sarlavhasi bilan)
```

## 1-variant: bitta VPS + Docker Compose (tavsiya)

Talablar: Linux server (2 GB RAM yetarli), Docker va Docker Compose, domen (A yozuvi server IP'siga).

```bash
git clone https://github.com/<foydalanuvchi>/ERP.git && cd ERP
cp .env.production.example .env.production
# .env.production ni to'ldiring: sirlar uchun   openssl rand -hex 32
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Birinchi ishga tushirishda `migrate` xizmati migratsiyalarni va ruxsatlar ro'yxatini yozadi, so'ng `api`, `web` va `caddy` ko'tariladi. Caddy HTTPS sertifikatini o'zi oladi.

**Birinchi super admin** (bir marta):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm \
  -e DATABASE_MIGRATION_URL="postgresql://erp:<POSTGRES_PASSWORD>@db:5432/erp" \
  -e SUPER_ADMIN_LOGIN=superadmin api node dist/db/create-super-admin.js
```

Vaqtinchalik parol terminalga bir marta chiqadi; birinchi kirishda almashtirish so'raladi. So'ng `https://<DOMAIN>/login` orqali kirib, **Platforma → Tariflar** va **Markazlar** bo'limida birinchi markazni yarating.

**Yangilash:**

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Migratsiyalar har safar avtomatik qo'llanadi (allaqachon qo'llanganlari o'tkazib yuboriladi).

## 2-variant: boshqariladigan xizmatlar (Neon + konteyner hosting)

- **Baza:** Neon (yoki Supabase) Postgres 17. Egasi rolining ulanishi `DATABASE_MIGRATION_URL`, ilova uchun alohida rol yarating:
  ```sql
  CREATE ROLE erp_app LOGIN PASSWORD '<hex parol>' NOSUPERUSER NOBYPASSRLS;
  GRANT CONNECT ON DATABASE <baza> TO erp_app;
  ```
  Migratsiyalar superuser bo'lmagan egasi bilan ishlaydi (lokal Postgres 17 da sinalgan).
- **API:** `apps/api/Dockerfile` obrazi. Ishga tushirishdan oldin `node dist/db/migrate.js && node dist/db/seed.js`. Muhit: `DATABASE_URL` (erp_app), JWT sirlari, `TRUST_PROXY=1` (faqat API'ga tashqaridan to'g'ridan-to'g'ri kirib bo'lmasa).
- **Web:** `apps/web/Dockerfile` obrazi. Muhit: `API_URL` (API'ning ichki manzili), `WEB_SECURE_COOKIES=true`.

## 3-variant: bepul bulut (Neon + Render, $0)

Bitta Render bepul servisi (API + web bitta konteynerda: `Dockerfile.render`, `deploy/render/start.mjs`) va Neon bepul Postgres. Cheklovlar (2026-noyabr): Render bepul servisi oyiga 750 soat (bitta servis 24/7 ga yetadi), 15 daqiqa so'rovsiz qolsa uxlaydi (uyg'onish ~1 daqiqa), 512 MB RAM, istalgan payt qayta ishga tushishi mumkin; Neon bepul: 1 GB, oyiga 100 CU-soat, 5 daqiqa ishlatilmasa uxlaydi (ma'lumot o'chmaydi). Haqiqiy mijozlar ko'paysa: Render pullik ($7) yoki VPS (1-variant).

1. **Neon** (neon.com, GitHub bilan kirish): yangi loyiha, Postgres 17, region **Frankfurt (eu-central-1)**. Connection details: **Pooled connection o'chiq** (to'g'ridan-to'g'ri host), rol egasi (`neondb_owner`) bilan ulanish satri, oxirida `?sslmode=require`. Bu `DATABASE_MIGRATION_URL`.
2. **Render** (render.com, GitHub bilan kirish): New > Blueprint > `ERP` repozitoriysi (`render.yaml` topiladi). So'raladigan qiymatlar:
   - `DATABASE_MIGRATION_URL`: 1-qadamdagi satr;
   - `SUPER_ADMIN_PASSWORD`: kamida 8 belgi (birinchi kirishda almashtiriladi; login `superadmin`);
   - `TELEGRAM_BOT_TOKEN`: BotFather'dan (bo'sh qoldirsa bot o'chiq).
   Qolgan sirlar (`JWT_*`, `APP_DB_PASSWORD`, `TELEGRAM_WEBHOOK_SECRET`, `CRON_SECRET`) Render tomonidan yaratiladi.
3. Birinchi deploy (~5-8 daqiqa) loglarida: `migrations applied`, `Super admin created`, `API tayyor`, `Telegram webhook: https://...onrender.com/telegram/webhook`. Konteyner har ishga tushishda o'zi: `erp_app` rolini (NOSUPERUSER NOBYPASSRLS, aks holda to'xtaydi) ta'minlaydi, migratsiya va seed yuritadi, Telegram webhook'ni o'rnatadi.
4. **cron-job.org** (bepul): har kuni **08:55** (Asia/Tashkent) da `GET https://<servis>.onrender.com/ping`. Servis uyg'onadi va 09:00 da kundalik eslatmalar ketadi, keyin 15 daqiqada uxlaydi. **24/7 ping qilmang**: Render'ning 750 bepul soati butun workspace uchun umumiy (bitta doim uyg'oq servis ~744 soat), oshsa workspace'dagi hamma bepul servislar oy oxirigacha to'xtaydi. Bot va sayt so'rov kelganda o'zi uyg'onadi (birinchi javob ~1 daqiqa). Haqiqiy mijozlar kelganda servisni Starter ($7/oy) ga o'tkazing: u bepul soatga kirmaydi va uxlamaydi.
5. Tekshirish: `https://<servis>.onrender.com/login`, super admin bilan kirish, parolni almashtirish, markaz ochish; Telegram: `/start KOD`.

Eslatma: bepul servisda fayl tizimi vaqtinchalik (bizga kerak emas: hamma narsa bazada). Zaxira nusxa: Neon 6 soatlik tiklash tarixi; qo'shimcha `pg_dump` uchun lokal kompyuterdan `DATABASE_MIGRATION_URL` bilan.

## Muhit o'zgaruvchilari

| O'zgaruvchi | Qayerda | Izoh |
|---|---|---|
| `DATABASE_URL` | api | `erp_app` roli (RLS ishlashi uchun superuser EMAS) |
| `DATABASE_MIGRATION_URL` | migrate | baza egasi |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | api | kamida 32 belgi; `change-me` bilan boshlansa prod'da ishga tushmaydi |
| `TRUST_PROXY` | api | API oldidagi ishonchli proksilar soni; compose'da `1` |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` | api | ixtiyoriy |
| `TELEGRAM_POLLING` | api | `true`: webhook o’rniga polling (bitta nusxa) |
| `NOTIFY_DAILY_AT` | api | ichki kundalik eslatma vaqti, masalan `09:00` |
| `APP_DB_PASSWORD` | Render | `erp_app` roli paroli; `DATABASE_URL` shundan `start.mjs` da yasaladi |
| `SUPER_ADMIN_LOGIN`, `SUPER_ADMIN_PASSWORD` | Render | birinchi super admin (bor bo'lsa o'zgarmaydi) |
| `CRON_SECRET` | api | tashqi cron uchun |
| `API_URL` | web | masalan `http://api:3001` |
| `WEB_SECURE_COOKIES` | web | HTTPS orqasida `true` |

## Telegram bot

1. Telegram'da **@BotFather** → `/newbot` → bot nomi va `..._bot` bilan tugaydigan username. Tokenni `TELEGRAM_BOT_TOKEN` ga, username'ni (`@` siz) `TELEGRAM_BOT_USERNAME` ga yozing.
2. Rejimni tanlang:
   - **Polling (eng oson, ommaviy HTTPS manzil kerak emas):** `TELEGRAM_POLLING=true`. API o'zi Telegram'dan yangilanishlarni so'raydi (webhook avtomatik o'chiriladi). Faqat **bitta** API nusxasida yoqing (ikkinchisi 409 oladi). Lokal ishlab chiqish va oddiy VPS uchun.
   - **Webhook (bir nechta nusxa yoki serverless):** `TELEGRAM_WEBHOOK_SECRET` ga tasodifiy qiymat (`openssl rand -hex 32`), `TELEGRAM_POLLING` bo'sh, so'ng:
     ```bash
     pnpm --filter @erp/api telegram:setup webhook https://<DOMAIN>
     ```
3. Tekshirish: `pnpm --filter @erp/api telegram:setup info` (bot nomi, webhook holati, oxirgi xato; token chiqmaydi).
4. Foydalanuvchi panelda **Profil → Telegram** (yoki rahbar o'quvchi kartochkasida) kod oladi va botga `/start KOD` yuboradi. `/stop` uzadi.

## Avtomatik eslatmalar

Ikki yo'l (birini tanlang; ikkalasi birga bo'lsa ham takror xabar ketmaydi, `notification_log` eslab qoladi):

- **Ichki jadval:** `NOTIFY_DAILY_AT=09:00` (Asia/Tashkent). API jarayoni har kuni shu vaqtda hamma faol markaz uchun qarz, ertangi dars, vazifa va maosh eslatmalarini yuboradi. Server o'sha vaqtdan keyin yoqilsa, o'sha kuni bir marta ishlaydi. Doim ishlab turadigan server (VPS, compose) uchun.
- **Tashqi trigger:** uxlab qoladigan bepul hostingda cron-job.org (yoki serverdagi `cron`) kuniga bir marta:
  ```bash
  curl -X POST "https://<DOMAIN>/notifications/cron" -H "x-cron-secret: <CRON_SECRET>" -H "content-type: application/json" -d '{}'
  ```

Rahbar ham panelda **Telegram xabarlar → Eslatmalarni hozir yuborish** tugmasi bilan qo'lda yuborishi mumkin.

## Zaxira nusxa

Kunlik `pg_dump` (serverdagi cron):

```bash
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U erp -Fc erp > backup-$(date +%F).dump
```

Nusxalarni boshqa joyga (masalan obyekt saqlash) ko'chiring va tiklashni vaqti-vaqti bilan sinab turing:
`pg_restore -U erp -d erp --clean backup-YYYY-MM-DD.dump`.

## Tekshirish

- `https://<DOMAIN>/login` ochiladi; API holati: `docker compose ... exec api wget -qO- http://127.0.0.1:3001/health` → `{"status":"ok"}`.
- Staging'da to'liq oqim: `SMOKE_API=<api manzili> SMOKE_LOGIN=... SMOKE_PASSWORD=... node apps/api/scripts/smoke.mjs` (yangi markaz yaratadi, faqat staging uchun).
- CI (`.github/workflows/ci.yml`): lint, unit, build, e2e (PGlite va haqiqiy Postgres 17) va ikkala Docker obrazini yig'ish.

## Lokal ishlab chiqish

```bash
pnpm install
pnpm --filter @erp/api pg:local          # Docker'siz Postgres 17 (54329-port); ulanish satrlarini chiqaradi
# boshqa terminalda: chiqarilgan DATABASE_MIGRATION_URL bilan
pnpm db:migrate && pnpm db:seed && pnpm db:create-super-admin
pnpm dev:api                              # API: 3001
pnpm dev:web                              # panel: 3000 (apps/web/.env.local da API_URL)
node apps/api/scripts/demo-seed.mjs      # ixtiyoriy: namuna markaz (DEMO_* o'zgaruvchilari bilan)
```
