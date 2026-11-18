# O'quv markazlari ERP

Foydalanuvchi bilan **o'zbek tilida** gaplash. Kod, o'zgaruvchi va commit nomlari inglizcha.

## Hujjatlar (avval shularni o'qi)
- [PROGRESS.md](PROGRESS.md): **joriy holat**, qaysi qadam tayyor, muhit cheklovlari (Docker/WSL), qarorlar va keyingi qadam rejasi. Har chat boshida shuni o'qi.
- Kod grafi: `graphify-out/` (`graphify query "..."`, `GRAPH_REPORT.md`). Kod o'zgarsa `graphify update .`, hujjat o'zgarsa `/graphify --update`.
- [REJA.md](REJA.md): bozor, mahsulot, texnik reja, yo'l xaritasi, xavflar.
- [ERD-VA-RUXSATLAR.md](ERD-VA-RUXSATLAR.md): ma'lumotlar modeli (Mermaid ERD), to'lov sikllari, maosh qoidalari, ruxsatlar matritsasi, yaratish/parol qoidalari, qabul qilingan qarorlar. **Model va ruxsatlar manbasi shu hujjat.**

## Qisqacha
Ko'p markazli (multi-tenant) va ko'p filialli ERP. Rollar: SUPER_ADMIN, OWNER (rahbar), ADMIN, CASHIER, TEACHER, STUDENT. Telegram bot orqali bildirishnoma. Dasturchi yolg'iz, byudjet $0 (bepul hosting/baza), shuning uchun kod host-agnostik (Docker).

## Texnik qarorlar
- TypeScript. Backend: **NestJS** modulli monolit. Baza: **PostgreSQL** (Neon yoki Supabase bepul tarifi). Frontend: **Next.js (React)**. Bot: grammY yoki Telegraf (keyin).
- ORM: **Drizzle** (tanlandi; RLS siyosatlari va migratsiyalar qo'lda SQL bilan yoziladi). Monorepo: pnpm workspace (`@erp/api`, `@erp/web`, `@erp/shared`).
- Tenant izolyatsiyasi: har jadvalda `center_id`, PostgreSQL RLS + servis tekshiruvi.
- Har markazda kamida bitta filial: markaz yaratilganda "Asosiy filial" avtomatik. `branch_id` NOT NULL.
- Pul: `bigint` (so'm). To'lov, maosh to'lovi va audit jurnali append-only; xato teskari yozuv bilan tuzatiladi.
- Qarz saqlanmaydi, `charges` jadvalidan hisoblanadi. Ikki to'lov rejimi: `GROUP_CYCLE`, `STUDENT_CYCLE`.
- Ruxsatlar: rol + `center_role_permissions` + `user_permissions` istisnolari; scope (center/branch/own group/own record) so'rov filtri sifatida qo'llanadi.
- Parol: argon2, birinchi kirishda majburiy almashtirish (`must_change_password`).

## Skelet bosqichi (birinchi vazifa)
Maqsad: super admin markaz ochadi, rahbar kiradi, filial va xodim yaratadi.
1. Monorepo (`apps/api` NestJS, `apps/web` Next.js, umumiy tiplar), Docker Compose (lokal Postgres), `.env.example`.
2. Migratsiyalar: `plans`, `centers`, `branches`, `users`, `user_branches`, `permissions`, `center_role_permissions`, `user_permissions`, `sessions`, `audit_logs`.
3. Auth: login, JWT + refresh, majburiy parol almashtirish, rol/ruxsat guard.
4. RLS yoki tenant filtri + tenant izolyatsiya testi (boshqa markaz ma'lumoti ko'rinmasligi).
5. Super admin: markaz yaratish (avtomatik Asosiy filial + rahbar akkaunti), bloklash.
6. Rahbar: filial va xodim (admin, kassir, ustoz) yaratish, ruxsatlarni sozlash.
7. Audit jurnali va ruxsat matritsasi avtomatik testi.

Keyingi bosqichlar tartibi: guruh/o'quvchi/yozilish, davomat, to'lov va qarzdorlik, maosh, hisobotlar, Excel import, vazifa/reyting, Telegram bot.

## Ish tartibi
- Katta o'zgarishdan oldin qisqa reja ko'rsat, tasdiqlatib keyin yoz.
- Biror qaror ERD hujjatidan chetga chiqsa, avval hujjatni yangila.
- Maxfiylik: o'quvchi va moliyaviy ma'lumotni log va tashqi xizmatlarga yubormaslik.
