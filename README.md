# O'quv markazlari ERP

Ko'p markazli (multi-tenant) va ko'p filialli o'quv markazlari boshqaruv tizimi: o'quvchilar, guruhlar, davomat, to'lov va qarzdorlik, maosh, xarajat, hisobotlar, vazifa va reyting, Excel import, Telegram eslatmalari.

- **API:** NestJS, PostgreSQL (RLS bilan tenant izolyatsiyasi), Drizzle ORM — `apps/api`
- **Web panel:** Next.js 16, BFF (tokenlar faqat `httpOnly` cookie'da) — `apps/web`
- **Umumiy tiplar va ruxsatlar:** `packages/shared`

Rollar: super admin, rahbar, administrator, kassir, ustoz, o'quvchi. Ruxsatlar rol shabloni va foydalanuvchi istisnolari bilan sozlanadi.

## Hujjatlar

- [DEPLOY.md](DEPLOY.md): ishga tushirish va deploy (Docker Compose + Caddy, Neon), Telegram, cron, zaxira nusxa
- [PROGRESS.md](PROGRESS.md): bosqichlar holati, arxitektura qarorlari, buyruqlar
- [ERD-VA-RUXSATLAR.md](ERD-VA-RUXSATLAR.md): ma'lumotlar modeli va ruxsatlar matritsasi
- [REJA.md](REJA.md): mahsulot rejasi

## Tez boshlash (lokal)

```bash
pnpm install
pnpm --filter @erp/api pg:local      # Docker'siz Postgres 17
pnpm build && pnpm --filter @erp/api test:e2e
```

Batafsil: [DEPLOY.md](DEPLOY.md#lokal-ishlab-chiqish).
