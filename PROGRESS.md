# Progress: skelet bosqichi holati

Oxirgi yangilanish: 2026-11-18 (skelet 1-7, 8 (o'quvchilar), 9 (kurs va guruhlar), 10 (yozilish), 11 (darslar va davomat), 12 (davomat qulfi va ko'rish), 13 (hisob-kitob) tayyor; keyingi 14: to'lovlar). Keyingi chatda **avval shu faylni o'qi**, so'ng [CLAUDE.md](CLAUDE.md), kerak bo'lsa [ERD-VA-RUXSATLAR.md](ERD-VA-RUXSATLAR.md). Kod bo'yicha savollar uchun `graphify-out/graph.json` (`graphify query "..."`).

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
| 9. Kurslar va guruhlar | tayyor | `apps/api/src/{courses,groups}/`, `drizzle/0006`, `test/groups.e2e-spec.ts` |
| 10. Yozilish (`enrollments`) | tayyor | `apps/api/src/enrollments/`, `common/group-access.ts`, `drizzle/0007`, `test/enrollments.e2e-spec.ts` |
| 11. Darslar va davomat belgilash | tayyor | `apps/api/src/lessons/`, `drizzle/0008`, `test/attendance.e2e-spec.ts` |
| 12. Davomat qulfi va ko'rish (`GET /attendance`) | tayyor | `apps/api/src/lessons/`, `test/attendance-lock.e2e-spec.ts` |
| 13. Hisob-kitob (`charges`, `enrollment_freezes`) | tayyor | `apps/api/src/billing/`, `common/dates.ts`, `drizzle/0009`, `test/billing.e2e-spec.ts` |
| **14. To'lovlar (`payments`)** | **keyingi** | hali yozilmagan |

Commitlar: skelet 1-7 `6e73b51`, 8 `b332eda`, 9 `af89a71`, 10 `75e0994`, 11 `55a443e`, 12 `5e88ce8`, 13 `c2f7d5c`. Ish daraxti toza; commitni foydalanuvchi so'raganda qil.

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
pnpm --filter @erp/api test:e2e              # integratsiya (PGlite), ~60 s, 317 test; unit 36 ta
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

### 9-qadam: kurslar va guruhlar (tayyor)
- Migratsiya `0006`: `courses`, `groups`, `group_schedules`, `group_teachers` (RLS, kompozit FK `(branch_id|course_id|group_id|teacher_id, center_id)`, `TENANT_TABLES` da). Bazada qoidalar: `billing_day` faqat GROUP_CYCLE'da 1-28 (CHECK; NULL tuzog'i `is not null` bilan yopilgan), guruh nomi filial ichida noyob (registrsiz), kurs nomi markazda noyob, bitta vaqtda bitta MAIN ustoz (qisman UNIQUE). `courses`/`groups`/`group_teachers` dan DELETE huquqi yo'q (arxiv, tarix saqlanadi); `group_schedules` dan bor (jadval almashtiriladi).
- `/courses` (OWNER, ADMIN, CASHIER, TEACHER; ruxsat servisda): `POST` (`group.create`), `GET`, `GET :id` (`group.view`), `PATCH`, `POST :id/archive|unarchive` (`group.edit`). Kurs markaz darajasida (filialsiz), admin ham boshqaradi. Arxivlash: kursda arxivlanmagan guruh bo'lsa 409 `COURSE_IN_USE`.
- `/groups`: `POST` (`group.create`; admin faqat o'z filialida), `GET` (`q`, `branchId`, `courseId`, `teacherId`, `status`, `includeArchived`, `limit`, `offset`), `GET :id`, `PATCH :id` (`group.edit`; filial o'zgarmaydi), `POST :id/archive|unarchive`, `PUT :id/schedule` (jadvalni to'liq almashtiradi; bir kunda darslar kesishmaydi), `POST :id/teachers` (`{teacherId, kind: MAIN|ASSISTANT, fromDate?}`), `POST :id/teachers/:teacherId/end` (`{toDate?}`).
- **Moliyaviy maydonlar** (`priceMonthly`, `billingMode`, `billingDay`, `graceDays`) berilsa `group.billing_settings` kerak (admin uchun ○). Berilmasa: narx kursning `default_price`'idan (u ham yo'q bo'lsa 400 `PRICE_REQUIRED`; 0 = bepul ruxsat), rejim va grace markaz `settings`'idan, to'lov kuni boshlanish sanasining kuni (28 dan oshmasin) yoki 1. Rejim almashganda `billingDay` avtomatik tozalanadi/talab qilinadi.
- **Ustoz** guruhga: TEACHER roli, ACTIVE va guruh filialiga biriktirilgan bo'lishi shart (`TEACHER_NOT_IN_BRANCH`); asosiy ustoz bor bo'lsa avval uni tugatish kerak (`MAIN_TEACHER_EXISTS`). "Amaldagi" = `to_date` yo'q yoki bugundan oldin emas.
- **Qamrov:** rahbar hammasi, admin/kassir `user_branches` bo'yicha, **ustoz faqat amaldagi biriktirilgan guruhlari** (tashqarisi 404). **Ustozga narx va sikl maydonlari ko'rsatilmaydi** (kurs `defaultPrice` ham). O'quvchi (`group.view` scope `o`) yozilish modulidan keyin; hozir 403.
- **Ochiq:** guruhni arxivlashda faol yozilishlar tekshiruvi (10-qadamda); guruh narxi/rejimi o'zgarganda mavjud `charges` ga ta'siri (to'lov bosqichida hal qilinadi); ustoz jadvali to'qnashuvi tekshirilmaydi.
- Audit: `course.create|edit|archive|unarchive`, `group.create|edit|archive|unarchive|schedule_update|teacher_assign|teacher_end`.
- Test: `test/groups.e2e-spec.ts` (22 ta) + izolyatsiya testida 4 yangi jadval va kross-markaz/qoida testlari; umumiy 208 e2e + 14 unit.

### 10-qadam: yozilish (tayyor)
- Migratsiya `0007`: `enrollments`, `enrollment_discounts` (RLS, kompozit FK `(group_id|student_id|enrollment_id, center_id)`, `TENANT_TABLES` da). Bazada qoidalar: bitta o'quvchi bitta guruhda bir vaqtda faqat bitta tugallanmagan (ACTIVE/FROZEN) yozilishga ega (qisman UNIQUE), `status='LEFT'` <=> `left_at` bor, `left_at >= joined_at`, narx >= 0; chegirmada `PERCENT` 1-100, `AMOUNT` > 0, `FREE` qiymatsiz. DELETE huquqi yo'q: chiqish/ko'chirish `LEFT` bilan yopiladi, tarix saqlanadi. `enrollment_discounts` faqat jadval: chegirma berish (`discount.grant`) moliya bosqichida.
- `/enrollments`: `POST` (`{groupId, studentId, joinedAt?, priceOverride?}`), `GET` (`groupId`, `studentId`, `branchId`, `status`, `limit`, `offset`), `GET :id`, `POST :id/freeze|unfreeze`, `POST :id/leave` (`{reason?, leftAt?}`), `POST :id/transfer` (`{toGroupId, reason?, transferDate?, priceOverride?}`: eski `LEFT` + `left_reason='TRANSFER[: sabab]'`, yangi guruhda yangi ACTIVE qator; bitta tranzaksiya, xatoda hech narsa o'zgarmaydi; eski individual narx ko'chmaydi).
- Ruxsat: o'zgartirish `enrollment.manage` (OWNER, ADMIN f), `priceOverride` uchun qo'shimcha `group.billing_settings`. Admin ham guruh, ham o'quvchi o'z filial qamrovida bo'lishi shart (tashqarisi 404). Ko'rish `group.view`: rahbar hammasi, admin/kassir guruh filiali bo'yicha, **ustoz o'z amaldagi guruhlari** (individual narxsiz), **o'quvchi faqat o'zinikini**.
- `billing_anchor`: guruh `STUDENT_CYCLE` bo'lsa yozilish (yoki ko'chirish) sanasi, aks holda NULL. Muzlatilgan yozilish ham "ochiq" (qayta yozib bo'lmaydi, guruhni arxivlashga to'sqinlik qiladi).
- Boshqa filial guruhiga yozilsa/ko'chirilsa o'quvchiga o'sha filial `user_branches` ga avtomatik qo'shiladi.
- **Boshqa modullarga ta'siri:** `/students` ni ustoz endi ko'radi (faqat o'z guruhlaridagi tugallanmagan yozilishli o'quvchilar, `student.view` scope `o`); `/groups` list/get ni o'quvchi ko'radi (faqat yozilgan guruhlari, narxi bilan, `studentCount`siz; `group.view` scope `o`); `GroupsService` guruh arxivlashda `GROUP_HAS_STUDENTS` tekshiradi va `studentCount` beradi; o'quvchi arxivlanganda tugallanmagan yozilishlari `LEFT` (`STUDENT_ARCHIVED`), qaytarilganda tiklanmaydi. Umumiy qamrov yordamchilari: `common/group-access.ts` (`teacherGroupIds`, `studentGroupIds`, `teacherStudentIds`).
- **Ochiq:** muzlatish davri sanalari saqlanmaydi (faqat holat va audit): to'lov bosqichida kerak bo'lsa `frozen_from/to` qo'shiladi (avval ERD yangilanadi); guruh `FINISHED` bo'lganda yozilishlarni avtomatik yopish yo'q; `/courses` o'quvchiga yopiq.
- Audit: `enrollment.create|freeze|unfreeze|leave|transfer`, `student.archive` (`closedEnrollments`).
- Test: `test/enrollments.e2e-spec.ts` (21 ta) + izolyatsiya testida 2 jadval va bazaviy qoidalar; umumiy 241 e2e + 14 unit.

### 11-qadam: darslar va davomat belgilash (tayyor)
- Migratsiya `0008`: `lessons` (guruh, `lesson_date`, `teacher_id` (NULL mumkin), `topic`, `status` HELD|CANCELLED, `locked_at`), `attendance_records` (PK `(lesson_id, student_id)`, `status` PRESENT|ABSENT|LATE|EXCUSED, `note`, `marked_by`, `marked_at`). RLS, kompozit FK `(group_id|teacher_id|lesson_id|student_id, center_id)`, `TENANT_TABLES` da. Bazada: guruhda sana noyob (`lessons_group_date_uq`), holatlar CHECK. DELETE huquqi yo'q (tuzatish UPDATE + audit).
- Endpointlar (`@Controller()` ildizida): `POST groups/:groupId/lessons` (`{lessonDate, topic?, teacherId?}`), `GET groups/:groupId/lessons` (`from`, `to`, `status`, `limit`, `offset`), `GET lessons/:id` (qatnashchilar ro'yxati bilan), `PATCH lessons/:id` (`topic`, `teacherId`, `status`), `PUT lessons/:id/attendance` (`{records:[{studentId,status,note?}]}`: upsert, yuborilmaganlar o'zgarmaydi).
- **Qoidalar:** dars qo'lda ochiladi (jadvaldan avtomatik emas), kelajak sanasi 400 `LESSON_IN_FUTURE`, takror sana 409 `LESSON_EXISTS`, arxivlangan guruhda 409. Ustoz sukut: ochgan ustoz (o'zi), rahbar/admin ochsa guruhning amaldagi asosiy ustozi (yo'q bo'lsa NULL); ko'rsatilsa guruhga amalda biriktirilgan bo'lishi shart (`TEACHER_NOT_IN_GROUP`); ustoz boshqa ustoz nomidan ocha olmaydi. Belgilanadiganlar: dars kuni guruhda bo'lgan o'quvchilar = `joined_at <= dars sanasi` va (`ACTIVE` yoki `LEFT` va `left_at >= dars sanasi`); **muzlatilganlar chiqarib tashlanadi** (`STUDENT_NOT_IN_LESSON`, `studentIds` bilan; so'rov to'liq rad etiladi). Davomat belgilangan darsni bekor qilib bo'lmaydi (`LESSON_HAS_ATTENDANCE`); bekor qilinganga belgilanmaydi (`LESSON_CANCELLED`); qayta HELD qilish mumkin. Keyin muzlatilgan/chiqqan o'quvchining eski yozuvi ro'yxatda saqlanadi.
- **Ruxsat/qamrov:** yozish (dars ochish, tahrirlash, belgilash) `attendance.mark` (rahbar, ustoz o'z amaldagi guruhida, admin uchun ○ o'z filialida); ko'rish `attendance.view` (rahbar, admin f, ustoz o'z guruhi, o'quvchi faqat o'z qatori: yig'ma va boshqalar yashirin, `myStatus`); kassir davomatga kirmaydi. Qamrovdan tashqari/boshqa markaz: 404. Ustoz guruhdan olib tashlangach kirish huquqi yo'qoladi. Umumiy yordamchi: `groupVisibility()` (`common/group-access.ts`), `GroupsService` ham shuni ishlatadi.
- Audit: `lesson.create|edit`, `attendance.mark` (har belgilashda `before/after` yozuvlar).
- **Qulflash:** 12-qadamda qo'shildi (pastga qarang).
- Test: `test/attendance.e2e-spec.ts` (15 ta) + izolyatsiya testida 2 jadval va bazaviy qoidalar; umumiy 268 e2e + 14 unit.

### 12-qadam: davomat qulfi va ko'rish (tayyor)
- **Qulf qoidasi:** dars qulflangan, agar `locked_at` qo'yilgan bo'lsa yoki `bugun - dars sanasi > attendance_lock_days`. Sozlama `centers.settings.attendance_lock_days` (butun 0-365; yo'q yoki yaroqsiz bo'lsa sukut **3**, `DEFAULT_ATTENDANCE_LOCK_DAYS`); sozlamani o'zgartiruvchi endpoint hali yo'q (super admin / to'g'ridan-to'g'ri baza). Chegara: aniq `lock_days` kun oldingi dars hali ochiq.
- **Qulflangan darsga** belgilash, tahrirlash (`PATCH`, bekor qilish) va **eski (qulflangan) sanaga dars ochish** faqat `attendance.edit_past` egasiga (rahbar ✔, admin ○; ikkala holatda admin uchun `attendance.mark` ham kerak); aks holda 403 `LESSON_LOCKED`. Qulflangan darsdagi tuzatish alohida audit amali bilan yoziladi: `attendance.edit_past`, `lesson.edit_past` (before/after bilan), oddiy `attendance.mark`/`lesson.edit` emas.
- Dars javobida `locked` (effektiv) va `lockedAt` bor (o'quvchiga ham). Qo'lda qulflash/ochish endpointi yo'q (`locked_at` faqat bazada).
- **`GET /attendance`** (`attendance.view`; OWNER, ADMIN, TEACHER, STUDENT): `groupId`, `studentId`, `from`, `to`, `status`, `limit` (<=500, sukut 100), `offset`; yozuvlar sana kamayishi va ism bo'yicha. Qamrov: rahbar hammasi, admin filiali, ustoz o'z guruhi; o'quvchi faqat o'zi (`studentId` filtri e'tiborsiz). Qamrovdan tashqari guruh filtri bo'sh natija beradi (404 emas).
- **`GET /attendance/summary`**: `totals` (`present, absent, late, excused, total, rate`); `groupId` berilsa `byStudent` (ism bo'yicha), aks holda `byGroup`; o'quvchi uchun doim faqat o'zi va faqat `byGroup`. `rate` = (kelgan + kech qolgan) / (kelgan + kech qolgan + kelmagan) * 100, 1 xona, sababli (EXCUSED) hisobga olinmaydi, maxraj 0 bo'lsa `null`.
- **Ochiq:** qulf muddatini rahbar o'zgartiradigan sozlamalar endpointi (markaz sozlamalari moduli); qo'lda qulflash/ochish; davomatdan reyting ball va ustozning dars-boshiga maoshi (reyting va maosh bosqichlari bu jadvallar ustiga quriladi).
- Test: `test/attendance-lock.e2e-spec.ts` (14 ta; qulf chegarasi, ruxsatlar, sozlama, audit, ko'rish/yig'ma, qamrov); `attendance.e2e-spec.ts` testlari uchun qulf muddati 365 ga uzaytirilgan. Umumiy 282 e2e + 14 unit.

### 13-qadam: hisob-kitob (`charges`) (tayyor)
To'lov bosqichining 1-qadami (reja: 13 hisob-kitob, 14 to'lovlar, 15 qarzdorlar va chegirmalar). Qoidalar manbasi: ERD 2.3 ("Charge yaratish (implementatsiya, 13-qadam)").
- **Migratsiya `0009`:** `charges` (yozilish, `student_id`/`group_id` nusxasi, `period_start/end`, `due_date`, `base_amount`, `discount_amount`, `amount`, `status` OPEN|PARTIAL|PAID|CANCELLED, `kind` REGULAR|FIRST_PRORATED|MANUAL, `note`, `cancelled_at/reason`) va `enrollment_freezes` (`[from_date, to_date)`, `to_date` NULL = hozir muzlatilgan). Bazada: davr boshiga bitta avtomatik charge (`charges_cycle_uq`; bekor qilingani ham qayta yaratilmaydi), `amount = base - discount`, qo'lda hisobga sabab majburiy, `CANCELLED <=> cancelled_at`, bitta ochiq muzlatish. DELETE huquqi yo'q. Oldin muzlatilgan yozilishlar uchun ochiq muzlatish yozuvi qo'shilgan (backfill). RLS, kompozit FK, `TENANT_TABLES` da.
- **Hisoblash motori** `apps/api/src/billing/billing-engine.ts`: sof funksiya `planCharges()` (DB'ga tegmaydi, 22 ta unit test: sana, oy oxiri siljishi, proratsiya, muzlatish, chiqish, guruh holati, narx, chegirma). `BillingService.generate(tx, centerId, {asOf?, enrollmentIds?, groupId?, studentId?, leftAt?})` motorni DB bilan bog'laydi (partiyalab so'rov, `onConflictDoNothing`); faqat `ACTIVE` yozilishlar hisoblanadi.
- **Qachon hisoblanadi (cron yo'q):** yozilish; muzlatishdan oldin (keyin muzlatish davri ochiladi); qaytarishdan keyin (davr yopiladi); chiqish/ko'chirishdan oldin (chiqish sanasi bilan chegaralab); o'quvchi arxivlanishidan oldin; guruh narxi o'zgarishi yoki `FINISHED` bo'lishidan oldin; `POST /billing/generate`; `GET /charges` va `GET /charges/:id` oldidan. `groups.billing_mode/billing_day` ni hisob bor guruhda o'zgartirib bo'lmaydi (409 `BILLING_HAS_CHARGES`; narx o'zgartirish mumkin).
- **Endpointlar:** `POST /billing/generate` (`{asOf?}` <= bugun; `debtors.view`: rahbar, kassir f, admin ○; audit `billing.generate`; javob `{asOf, created}`), `GET /charges` (`studentId`, `groupId`, `enrollmentId`, `branchId`, `status`, `kind`, `dueFrom`, `dueTo`, `limit`, `offset`), `GET /charges/:id` (`payment.view`: rahbar, admin ○ f, kassir f, o'quvchi faqat o'zinikini; ustoz kirmaydi), `POST /charges` (qo'lda `MANUAL`, `{enrollmentId, amount, dueDate?, note}`, `charge.adjust`: faqat rahbar), `POST /charges/:id/cancel` (`{reason}`, `charge.adjust`; faqat `OPEN`; to'langan 409 `CHARGE_NOT_CANCELLABLE`, takror 409 `ALREADY_CANCELLED`). Audit: `charge.create_manual`, `charge.cancel`.
- **Muhim xulq:** guruh sukut bo'yicha `PLANNED` yaratiladi va `PLANNED` guruhga (boshlanish sanasiz) hisob yozilmaydi: rahbar guruhni `ACTIVE` qilishi yoki `startDate` qo'yishi kerak. Chegirma (`enrollment_discounts`) charge yaratilganda qotiriladi (endpoint yo'q: 15-qadamda; hozir faqat jadval). Orqaga sanali yozilishda hamma o'tgan davrlar darrov yaratiladi; keyin sanani "oldinroq chiqish" ga o'zgartirish ularni o'chirmaydi (rahbar qo'lda bekor qiladi).
- **Vaqt mintaqasi:** biznes sanasi Asia/Tashkent (UTC+5): `common/dates.ts` (`todayLocal`, `addDays`, `daysBetween`, `clampedDate` ...). Hamma servislar (guruh, yozilish, davomat, o'quvchi) va `currentTeacher()` shunga o'tkazildi; testlar ham `todayLocal()` ishlatadi (yarim tundan o'tish paytida bir marta ishga tushirilgan test sanasi farq qilishi mumkin, qayta yurgizish yetarli).
- **13-qadamga kirmadi:** `GET /students/:id/balance` (to'lovlar bilan birga, 14-qadamda); to'lov taqsimoti va qarz (14-15).
- Test: `test/billing.e2e-spec.ts` (23 ta) + `src/billing/billing-engine.spec.ts` (22 ta unit) + izolyatsiya testida 2 jadval va bazaviy qoidalar. Umumiy 317 e2e + 36 unit.

### 14-qadam (keyingi): to'lovlar
`payments`, `payment_allocations` (migratsiya 0010): `POST /payments` (`payment.create`, kassir o'z filialida, chek raqami markaz bo'yicha ketma-ket), eng eski ochiq charge'ga FIFO taqsimlash (`PARTIAL`/`PAID`), ortiqcha summa avans (keyingi charge'larga avtomatik), qaytarish `payment.reverse` (teskari yozuv, original faqat `CONFIRMED -> REVERSED`, trigger bilan), `GET /payments`, `GET /students/:id/balance`. To'langan charge'ni bekor qilish shu qadamda qayta ko'rib chiqiladi.

### 15-qadam: qarzdorlar va chegirmalar
`GET /debtors` (`debtors.view`, `today > due_date + grace_days`, filial/guruh filtrlari, o'quvchi o'z qarzi, ustoz (○) faqat "qarz bor/yo'q"), `enrollment_discounts` endpointlari (`discount.grant`: PERCENT/AMOUNT/FREE, muddat).

## Ochiq savollar
- Markaz reytingida boshqa filial o'quvchilarining to'liq ismi ko'rinsinmi (sukut: ha).
- Tariflar (`plans`) yaratish endpointi hali yo'q (SaaS billing minimumi keyinroq).
- Login cheklovi ko'p nusxaga o'tganda umumiy xotiraga (Redis/baza) ko'chirilishi kerak.
