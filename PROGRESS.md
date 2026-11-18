# Progress: skelet bosqichi holati

Oxirgi yangilanish: 2026-11-18 (skelet 1-7 va 8-qadam o'quvchilar tayyor; keyingi 9: kurs va guruhlar). Keyingi chatda **avval shu faylni o'qi**, so'ng [CLAUDE.md](CLAUDE.md), kerak bo'lsa [ERD-VA-RUXSATLAR.md](ERD-VA-RUXSATLAR.md). Kod bo'yicha savollar uchun `graphify-out/graph.json` (`graphify query "..."`).

## Holat
| Qadam | Holat | Qayerda |
|---|---|---|
| 1. Monorepo, Docker Compose, .env.example | tayyor | `apps/api`, `apps/web`, `packages/shared`, `docker-compose.yml` |
| 2. Migratsiyalar (10 jadval, RLS, huquqlar, triggerlar) | tayyor | `apps/api/src/db/schema.ts`, `apps/api/drizzle/0000..0003` |
| 3. Auth (login, JWT+refresh, majburiy parol, guardlar) | tayyor | `apps/api/src/auth/` |
| 4. Tenant izolyatsiya testlari | tayyor | `apps/api/test/tenant-isolation.e2e-spec.ts` |
| 5. Super admin: markaz yaratish/bloklash | tayyor | `apps/api/src/centers/`, `test/centers.e2e-spec.ts` |
| 6. Rahbar: filial va xodim yaratish, ruxsatlarni sozlash | tayyor | `apps/api/src/{branches,users,permissions-admin}/`, `common/branch-scope.ts`, `drizzle/0004`, `test/staff.e2e-spec.ts` |
| 7. Audit jurnali va ruxsat matritsasi avtomatik testi | tayyor | `apps/api/src/audit/`, `test/permission-matrix.e2e-spec.ts` |
| 8. O'quvchilar (`student_profiles`, `/students`) | tayyor | `apps/api/src/students/`, `drizzle/0005`, `test/students.e2e-spec.ts` |
| **9. Kurslar va guruhlar** | **keyingi** | hali yozilmagan |

Commitlar: skelet 1-7 `6e73b51`. 8-qadam (o'quvchilar) o'zgarishlari **commit qilinmagan**; commitni foydalanuvchi so'raganda qil.

## Muhit holati (muhim)
- **Docker ishlamaydi:** Docker Desktop o'rnatilgan, lekin kompyuterda **WSL yo'q**, dvigatel ko'tarilmaydi. Tuzatish: administrator PowerShell'da `wsl --install`, qayta yoqish.
- `localhost:5432` da **boshqa** Postgres ishlayapti (parol rad etadi, bizniki emas); unga tegma.
- Shuning uchun **hamma testlar PGlite'da** (xotiradagi Postgres, haqiqiy migratsiyalar, `erp_app` roliga `SET LOCAL ROLE` bilan RLS yoqilgan). `db:migrate`, `db:seed`, `db:create-super-admin` skriptlari **haqiqiy Postgres'da hali sinalmagan**.
- Boshqa yo'l: Neon bepul bazasi; `.env` da `DATABASE_URL` (erp_app roli) va `DATABASE_MIGRATION_URL` (egasi), `erp_app` rolini o'zing yarat (`docker/initdb/01-app-role.sql` ga qara).
- Windows, Git Bash + PowerShell. Python yo'q. Node 24, pnpm 12. Katta heredoc'li bash buyruqlari ba'zan buziladi: fayllarni Write bilan yoz.

## Buyruqlar
```bash
pnpm build                                   # hamma paket
pnpm --filter @erp/api test                  # unit (tez)
pnpm --filter @erp/api test:e2e              # integratsiya (PGlite), ~20 s, 164 test
pnpm --filter @erp/api lint                  # oxlint
pnpm --filter @erp/api db:generate           # drizzle-kit: sxemadan migratsiya; custom: `drizzle-kit generate --custom --name=...`
pnpm db:migrate | db:seed | db:create-super-admin   # haqiqiy bazani talab qiladi
graphify update .                            # kod grafini yangilash (hujjat o'zgarsa: /graphify --update)
```

## Arxitektura qarorlari (kodda tasdiqlangan)
- **ORM Drizzle**, migratsiya: drizzle-kit (jadvallar) + qo'lda SQL (RLS, trigger, huquq). `--> statement-breakpoint` har bayonot orasida. drizzle-kit FK'ni UNIQUE'dan oldin yozishi mumkin: **tartibni tekshir**.
- **RLS:** ilova `erp_app` bilan ulanadi (superuser emas, egasi emas). Har tranzaksiya `DbService.withContext({centerId, isSuperAdmin}, fn)` orqali: `app.center_id` va `app.is_super_admin` (`set_config(..., true)`). Super admin bayrog'i faqat tasdiqlangan JWT rolidan. Markaz yaratishda `enterCenter(tx, id)` bilan o'sha tranzaksiyada markaz kontekstiga o'tiladi.
- Super admin faqat `centers`, `plans`, `users(SUPER_ADMIN|OWNER)` va platforma audit yozuvlarini ko'radi; tenant ichki ma'lumotini ko'rmaydi.
- **Kompozit FK** `(user_id|branch_id, center_id)` bog'lovchi jadvallarda (kross-markaz havolani bazaning o'zi rad etadi). Yangi tenant jadval shu naqshga amal qilsin va `tenant-isolation` testidagi `TENANT_TABLES` ga qo'shilsin (meta-test majburlaydi).
- `centers` platforma maydonlari (`status`, `plan_id`, `trial_ends_at`, `blocked_*`, `slug`) triggerda faqat super admin kontekstida o'zgaradi.
- `audit_logs`: append-only (trigger + huquq). `users/centers/branches/plans`: DELETE huquqi yo'q (yumshoq o'chirish).
- Login/refresh qidiruvi RLS'ni chetlab o'tuvchi 2 ta `SECURITY DEFINER` funksiya orqali: `app_auth_find_user`, `app_auth_find_session`.
- **Auth:** access JWT 15 daqiqa (`sub, sid, cid, role`); refresh = tasodifiy 256 bit, bazada HMAC xesh; har refresh yangi sessiya, ishlatilgan refresh qayta kelsa hamma sessiya yopiladi. Har so'rovda sessiya/foydalanuvchi/markaz holati bazadan tekshiriladi. Login cheklovi xotirada (ip+login, 5 xato/15 daqiqa).
- **Guard tartibi:** `JwtAuthGuard` (+ `must_change_password`) → `RolesGuard` → `PermissionsGuard`; marshrutlar sukut bo'yicha yopiq (`@Public`, `@AllowMustChangePassword`, `@Roles`, `@RequirePermission`).
- **Samarali ruxsat** = `user_permissions` istisnosi, bo'lmasa `center_role_permissions`, yo'q bo'lsa taqiq. Platforma ruxsatlari faqat SUPER_ADMIN (`PLATFORM_ONLY_PERMISSIONS`). Keshsiz.
- **Matritsa kodda:** `packages/shared/src/permission-matrix.ts` (✔ default allowed=true, ○ optional allowed=false, – yo'q). Hujjat bilan birga yangilanadi.
- Markaz sukutlari: TRIAL 14 kun, `GROUP_CYCLE`, `grace_days=0`, `FULL_MONTH`, `rounding=NONE`, `locale=uz`. Vaqtinchalik parol `xxxx-xxxx-xxxx`, bir marta ko'rsatiladi.
- Xato javoblari `{ code, message }` (kodlar: `INVALID_CREDENTIALS`, `CENTER_BLOCKED`, `PASSWORD_CHANGE_REQUIRED`, `SESSION_INVALID`, `FORBIDDEN`, `SLUG_TAKEN`, ...).

## 6-qadam: nima qilindi (API)
Barcha marshrutlar `Authorization: Bearer`; xato javoblari `{ code, message }`. Vaqtinchalik parol javobda bir marta (`Cache-Control: no-store`), auditga yozilmaydi.
- **Filial** `/branches`: `POST`, `PATCH :id`, `POST :id/archive|unarchive` (`branch.manage`, rahbar); `GET` ro'yxat/`:id` (OWNER/ADMIN/CASHIER/TEACHER, qamrov bo'yicha). Nom markaz ichida noyob (`BRANCH_NAME_TAKEN`), oxirgi faol filialni arxivlab bo'lmaydi (`LAST_BRANCH`), `plans.max_branches` faol filiallarga qo'llanadi (`PLAN_BRANCH_LIMIT`, tarif yo'q/NULL = cheksiz).
- **Xodim** `/staff` (OWNER, ADMIN): `POST` (`role`: ADMIN|CASHIER|TEACHER, `branchIds` kamida 1 ta; rahbar uchta rolni, admin faqat o'z filialida ustozni; ruxsat `staff.create`/`teacher.create` servisda `PermissionsService.hasIn(tx, ...)` bilan), `GET` (+`role`, `branchId`, `status`), `GET/PATCH :id`. Login berilmasa `markaz-slug.ism` (band bo'lsa `2`, `3`...). Filial biriktirish va holat (`ACTIVE|SUSPENDED`) faqat rahbar; SUSPENDED sessiyalarni yopadi. Qamrovdan tashqari yoki boshqa markaz yozuvi: 404.
- **`teacher_profiles`** migratsiya `0004` (RLS, kompozit FK, `TENANT_TABLES` ga qo'shilgan).
- **Parolni tiklash** `POST /users/:id/reset-password` (`user.reset_password`): rahbar ADMIN/CASHIER/TEACHER/STUDENT'ni; admin faqat o'z filialidagi TEACHER/STUDENT'ni; rahbar parolini faqat super admin (404). O'zini tiklash 400 `USE_CHANGE_PASSWORD`. Sessiyalar yopiladi, `must_change_password=true`.
- **Ruxsatlar** `/permissions` (`permissions.manage`): `GET roles`, `PUT roles/:role`, `GET/PUT users/:id`. Faqat ○ (optional) kodlar o'zgaradi (✔ va – kodlar, platforma kodlari va noma'lum kodlar: 400 `PERMISSION_NOT_CONFIGURABLE`, aralash so'rovda hech narsa o'zgarmaydi). Foydalanuvchi istisnosida `null` istisnoni olib tashlaydi. Audit: `permissions.role_update`, `permissions.user_update`.
- **Qamrov yordamchisi** `apps/api/src/common/branch-scope.ts`: `branchScope(tx, user)`, `branchFilter(column, scope)`, `inScope(scope, id)`. Keyingi modullar (guruh, o'quvchi...) shuni ishlatsin.
- Audit amallari: `branch.create|edit|archive|unarchive`, `staff.create`, `teacher.create`, `staff.edit`, `teacher.edit`, `user.suspend|activate`, `user.reset_password`, `permissions.*`.
- **Ma'lum cheklov:** admin o'quvchi parolini tiklashi uchun o'quvchining filiali kerak; `student_profiles`/`enrollments` yo'qligi uchun hozir faqat `user_branches` orqali tekshiriladi. O'quvchi moduli kelganda qamrovni yoz.
- Test: `apps/api/test/staff.e2e-spec.ts` (32 ta), umumiy 130 e2e + 14 unit.

## 7-qadam: nima qilindi
- **`GET /audit`** (`audit.view`, sukut bo'yicha faqat rahbar; ○ ham emas, shuning uchun boshqa rolga berib bo'lmaydi; super admin ham 403): filtrlar `action`, `entity`, `entityId`, `actorId`, `from`, `to`, `limit` (<=200), `offset`; yangilari birinchi, ijrochi ismi bilan; faqat o'z markazi (RLS). Kod: `apps/api/src/audit/audit.controller.ts`.
- **Matritsa testi** (`test/permission-matrix.e2e-spec.ts`): har ruxsat kodi uchun dinamik `GET /p/<kod>` marshruti; 5 rol × barcha kodlar sukut shablonida (✔ 200, qolgani 403), ○ kodlar yoqilgandan keyin (✔+○ 200, – 403), super admin (faqat platforma kodlari 200), tokensiz 401, boshqa markaz shabloni mustaqil.
- Audit testlari: boshqa markaz yozuvlari ko'rinmaydi, filtr va sahifalash, parol/xesh yo'qligi, append-only (UPDATE/DELETE rad).
- **Eslatma:** moliyaviy amallar (to'lov, maosh) hali yo'q, ularning auditi o'sha modullar bilan yoziladi; yangi modul `writeAudit` ni ishlatsin va matritsa testi yangi kodlarni avtomatik qamraydi (kod `PERMISSIONS` ga qo'shilishi kifoya).

## Keyingi bosqich (guruh, o'quvchi, yozilish): 8, 9, 10-qadamlar
Reja (tasdiqlangan): 8 o'quvchilar, 9 kurs va guruhlar (`courses`, `groups`, `group_schedules`, `group_teachers`; migratsiya 0006), 10 yozilish (`enrollments`, `enrollment_discounts`; 0007: qo'shish, muzlatish, chiqarish, ko'chirish; boshqa filial guruhiga yozilsa `user_branches` ga avtomatik qo'shiladi). Qarorlar: o'quvchi arxivlanganda yozilishlari `LEFT` bo'ladi; ustoz guruhga faqat o'z filialidan biriktiriladi. Qarz/to'lov keyingi bosqichda.

### 8-qadam: o'quvchilar (tayyor)
- `student_profiles` (migratsiya `0005`, RLS, kompozit FK, `TENANT_TABLES` da). Filial `user_branches` orqali (yaratishda bitta `branchId`; qo'shimcha filiallar yozilishda qo'shiladi).
- `/students` (OWNER, ADMIN, CASHIER; `GET :id` ga STUDENT ham): `POST` (`student.create`; vaqtinchalik parol bir marta, login `markaz.ism[N]`), `GET` (`student.view`; `q` ism/login/telefon, `branchId`, `status` ACTIVE|ARCHIVED, `limit`, `offset`), `GET :id`, `PATCH :id` (`student.edit`; ism, telefon, tug'ilgan sana, ota-ona, izoh), `POST :id/archive|unarchive` (`student.archive`; admin uchun ○). Arxivlash sessiyalarni yopadi.
- Qamrov: rahbar hammasi, admin/kassir `user_branches` bo'yicha (tashqarisi 404). O'quvchi faqat o'zini ko'radi (boshqasi 404). **Ustoz hozircha 403**: o'z guruhi o'quvchilarini ko'rishi yozilish modulidan keyin (`student.view` scope `o`).
- `plans.max_students` faol o'quvchilarga (`PLAN_STUDENT_LIMIT`; arxivdan qaytarishda ham).
- Admin o'quvchi parolini tiklashi endi ishlaydi (6-qadam cheklovi yopildi).
- Umumiy yordamchi: `common/login.ts` (`generateLogin`, `isLoginConflict`), xodim va o'quvchi shuni ishlatadi.
- Test: `test/students.e2e-spec.ts` (20 ta); umumiy 164 e2e + 14 unit. Audit: `student.create|edit|archive|unarchive`.

## Ochiq savollar
- Markaz reytingida boshqa filial o'quvchilarining to'liq ismi ko'rinsinmi (sukut: ha).
- Tariflar (`plans`) yaratish endpointi hali yo'q (SaaS billing minimumi keyinroq).
- Login cheklovi ko'p nusxaga o'tganda umumiy xotiraga (Redis/baza) ko'chirilishi kerak.
