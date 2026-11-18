# Graph Report - ERP  (2026-11-18)

## Corpus Check
- 84 files · ~27,996 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 5, .css 2, .example 1)

## Summary
- 945 nodes · 2187 edges · 51 communities (43 shown, 8 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 154 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- .login
- users.controller.ts
- index.ts
- web/package.json
- REJA.md
- CLAUDE.md (loyiha ko'rsatmalari)
- Yaratish va parol qoidalari jadvali
- ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)
- compilerOptions
- Ruxsatlar matritsasi (3-bo'lim)
- compilerOptions
- scripts
- db
- scripts
- @nestjs/common
- devDependencies
- dependencies
- Arxitektura qarorlari (kodda tasdiqlangan)
- enrollments
- db.service.ts
- centers.e2e-spec.ts
- users.service.ts
- shared/package.json
- auth.service.ts
- PermissionsAdminService
- compilerOptions
- api/package.json
- seed.ts
- ProbeController
- @nestjs/common
- .resetPassword
- payments
- Buyruqlar ro'yxati
- RequirePermission
- CurrentUser
- guards.ts
- AuthUser
- .oxlintrc.json
- main.ts
- tsconfig.build.json
- users
- nest-cli.json
- Bozor tahlili (raqobatchilar)
- allowBuilds
- branches.controller.ts
- vitest
- ProbeController
- ProbeController
- @types/express@^5.0.0
- oxlint-tsgolint@^7.0.2001
- source-map-support@^0.5.21

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 67 edges
2. `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)` - 59 edges
3. `@nestjs/common` - 32 edges
4. `CLAUDE.md (loyiha ko'rsatmalari)` - 32 edges
5. `RequirePermission()` - 30 edges
6. `CurrentUser` - 29 edges
7. `writeAudit()` - 24 edges
8. `ClientInfo` - 24 edges
9. `users` - 24 edges
10. `drizzle-orm` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Frontend: Next.js (React)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `CLAUDE.md (loyiha ko'rsatmalari)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `Backend: NestJS modulli monolit` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `To'lov tizimlari: Payme, Click, Uzum` --references--> `payments`  [INFERRED]
  REJA.md → ERD-VA-RUXSATLAR.md
- `3-bosqich: Payme/Click, SMS, AI hisobot` --references--> `payments`  [INFERRED]
  REJA.md → ERD-VA-RUXSATLAR.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **6-qadam reja elementlari** — progress_p6_1, progress_p6_2, progress_p6_3, progress_p6_4, progress_p6_5, progress_p6_6, claude_skelet_6 [EXTRACTED 1.00]
- **Ruxsat tekshirish qatlami** — erd_va_ruxsatlar_perm_code_guard, erd_va_ruxsatlar_scope, erd_va_ruxsatlar_effective_perm, erd_va_ruxsatlar_guard_order, progress_d_guard_order, progress_d_effective_perm [INFERRED 0.85]
- **RLS tenant izolyatsiya mexanizmi** — erd_va_ruxsatlar_rls_impl, erd_va_ruxsatlar_secdef_funcs, erd_va_ruxsatlar_composite_fk, erd_va_ruxsatlar_isolation_test, progress_d_rls [INFERRED 0.85]

## Communities (51 total, 8 thin omitted)

### Community 0 - ".login"
Cohesion: 0.09
Nodes (12): AuthController, clientOf(), accountInactive(), AuthService, centerBlocked(), invalidCredentials(), invalidRefresh(), LoginResult (+4 more)

### Community 1 - "users.controller.ts"
Cohesion: 0.17
Nodes (14): id(), blockCenterSchema, createCenterSchema, idParamSchema, phone, resetOwnerPasswordSchema, slug, updateCenterSchema (+6 more)

### Community 2 - "index.ts"
Cohesion: 0.11
Nodes (16): PAYMENT_MODES, PaymentMode, ROLES, DEFAULT_CENTER_SETTINGS, DEFAULT_TRIAL_DAYS, defaultRolePermissionRows(), ROLE_PERMISSION_MATRIX, RoleMatrix (+8 more)

### Community 3 - "web/package.json"
Cohesion: 0.06
Nodes (34): eslintConfig, nextConfig, dependencies, next@16.4.6, react@19.3.0, react-dom@19.3.0, devDependencies, eslint@^9 (+26 more)

### Community 4 - "REJA.md"
Cohesion: 0.07
Nodes (34): Qarz saqlanmaydi, charges dan hisoblanadi, centers (tenant), Trigger centers_guard_platform_columns, Qarzdor: today > due_date + grace_days va charge to'lanmagan, grace_days: markaz sukuti + groups.grace_days, import_jobs, users/centers/branches/plans ga DELETE huquqi yo'q, plans (tarif) (+26 more)

### Community 5 - "CLAUDE.md (loyiha ko'rsatmalari)"
Cohesion: 0.08
Nodes (33): typescript@^6.0.2, typescript, Byudjet $0, host-agnostik (Docker), CLAUDE.md (loyiha ko'rsatmalari), Hujjatlarni o'qish tartibi, Qaror ERD dan chetga chiqsa avval hujjatni yangila, ERD hujjati model va ruxsatlar manbasi, Til qoidasi: o'zbekcha suhbat, inglizcha kod (+25 more)

### Community 6 - "Yaratish va parol qoidalari jadvali"
Cohesion: 0.14
Nodes (15): Parol: argon2, must_change_password, Tenant izolyatsiyasi: center_id + RLS + servis tekshiruvi, Bloklash POST /admin/centers/:id/block, unblock, owner reset-password, Bloklangan markaz: kirish rad etiladi, Yaratish va parol qoidalari jadvali, must_change_password=true bilan boshlanadi, Parolni tiklash: yuqori rol quyi rolni, RLS implementatsiyasi: erp_app roli, app.center_id, app.is_super_admin (+7 more)

### Community 7 - "ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)"
Cohesion: 0.11
Nodes (32): assignments, attendance_records, branches, courses, Bir o'quvchi bitta akkaunt, turli filial guruhlarida, Maosh qoidalari faqat rahbarda, O'quvchi filial reytingini to'liq ism bilan ko'radi, Ustoz bir nechta filial/guruhda ishlay oladi (+24 more)

### Community 8 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+12 more)

### Community 9 - "Ruxsatlar matritsasi (3-bo'lim)"
Cohesion: 0.23
Nodes (12): Ruxsatlar: rol + center_role_permissions + user_permissions, scope so'rov filtri, center_role_permissions, Kross-markaz havola himoyasi: kompozit FK, Samarali ruxsat = rol shabloni ± user istisnosi, Belgilar: ✔ ○ – o f, Matritsa 3.2 Tashkilot va foydalanuvchilar, permissions pnpm db:seed orqali @erp/shared dan, permissions (+4 more)

### Community 10 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 11 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, db:create-super-admin, db:generate, db:migrate, db:seed, deploy, format (+10 more)

### Community 12 - "db"
Cohesion: 0.11
Nodes (17): environment, healthcheck, image, ports, restart, volumes, POSTGRES_DB, POSTGRES_PASSWORD (+9 more)

### Community 13 - "scripts"
Cohesion: 0.12
Nodes (16): engines, node, name, packageManager, private, scripts, build, db:create-super-admin (+8 more)

### Community 15 - "devDependencies"
Cohesion: 0.10
Nodes (19): devDependencies, drizzle-kit@^0.31.11, @electric-sql/pglite@^0.5.16, @nestjs/schematics@^12.0.0, @nestjs/testing@^12.0.1, oxlint@^1.58.0, prettier@^3.4.2, supertest@^7.0.0 (+11 more)

### Community 16 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, drizzle-orm@^0.45.4, @erp/shared@workspace:*, @nestjs/common@^12.0.1, @nestjs/jwt@^12.0.5, @nestjs/platform-express@^12.0.1, @node-rs/argon2@^2.2.2, reflect-metadata@^0.2.2 (+7 more)

### Community 17 - "Arxitektura qarorlari (kodda tasdiqlangan)"
Cohesion: 0.09
Nodes (37): ORM: Drizzle, Skelet 1: Monorepo, Docker Compose, .env.example (tayyor), Skelet 2: Migratsiyalar 10 jadval (tayyor), Skelet 3: Auth login, JWT+refresh, guard (tayyor), Skelet 4: RLS va tenant izolyatsiya testi (tayyor), Skelet 5: Super admin markaz yaratish/bloklash (tayyor), Skelet 6: Rahbar filial va xodim yaratish, ruxsat sozlash (keyingi), Skelet maqsadi: super admin markaz ochadi, rahbar kiradi, filial va xodim yaratadi (+29 more)

### Community 18 - "enrollments"
Cohesion: 0.14
Nodes (19): Ikki to'lov rejimi GROUP_CYCLE / STUDENT_CYCLE, Qaror: avans va ko'p oylik to'lov mumkin, To'lov eng eski ochiq charge ga taqsimlanadi, ortiqcha = avans, charges, Ikki to'lov sikli taqqoslash jadvali, Chegirma charge yaratilganda qotiriladi, enrollment_discounts, enrollments (+11 more)

### Community 19 - "db.service.ts"
Cohesion: 0.14
Nodes (12): DB, Db, DB_OPTIONS, DbOptions, DbService, enterCenter(), NO_CONTEXT, TenantContext (+4 more)

### Community 20 - "centers.e2e-spec.ts"
Cohesion: 0.14
Nodes (21): AppModule, hashPassword(), PARAMS, verifyAgainstDummy(), verifyPassword(), APP_CONFIG, AppConfig, envSchema (+13 more)

### Community 21 - "users.service.ts"
Cohesion: 0.06
Nodes (42): writeAudit(), ClientInfo, PermissionsService, generateTempPassword(), CreateBranchInput, UpdateBranchInput, audited(), BranchesService (+34 more)

### Community 22 - "shared/package.json"
Cohesion: 0.18
Nodes (11): devDependencies, typescript@^5.9.3, typescript, main, name, private, scripts, build (+3 more)

### Community 23 - "auth.service.ts"
Cohesion: 0.20
Nodes (19): AuditEntry, SessionRow, CreatedCenter, SUPER, contextOf(), Tx, auditLogs, branches (+11 more)

### Community 24 - "PermissionsAdminService"
Cohesion: 0.15
Nodes (5): clientOf(), PermissionsAdminController, assertConfigurable(), PermissionsAdminService, TenantRole

### Community 25 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, esModuleInterop, module, outDir, rootDir, skipLibCheck, strict (+2 more)

### Community 26 - "api/package.json"
Cohesion: 0.12
Nodes (15): author, description, @nestjs/cli@^12.0.0, @nestjs/mau@^0.2.6, @types/supertest@^7.0.0, vite@^8.0.0, license, name (+7 more)

### Community 27 - "seed.ts"
Cohesion: 0.15
Nodes (10): postgres@^4.1.1, client, db, login, client, permissions, client, db (+2 more)

### Community 29 - "@nestjs/common"
Cohesion: 0.13
Nodes (8): AuthModule, BranchesModule, CentersModule, ConfigModule, DbModule, PermissionsAdminModule, UsersModule, @nestjs/common

### Community 30 - ".resetPassword"
Cohesion: 0.12
Nodes (7): Roles(), clientOf(), StaffController, UserPasswordController, createStaffSchema, listStaffSchema, updateStaffSchema

### Community 31 - "payments"
Cohesion: 0.17
Nodes (16): To'lov, maosh to'lovi, audit append-only, Skelet 7: Audit jurnali va ruxsat matritsasi testi (kutmoqda), audit_logs, Moliya va rol/ruxsat o'zgarishi auditga majburiy, audit_logs UPDATE/DELETE/TRUNCATE triggerlar bilan bloklangan, Har rol x ruxsat avtomatik matritsa testi (403/404), payments, Ruxsat kodi: NestJS guard/decorator (+8 more)

### Community 32 - "Buyruqlar ro'yxati"
Cohesion: 0.22
Nodes (9): Kod grafi graphify-out, pnpm build, pnpm --filter @erp/api db:generate (drizzle-kit), pnpm db:migrate | db:seed | db:create-super-admin, graphify update ., pnpm --filter @erp/api lint (oxlint), pnpm --filter @erp/api test (unit), Buyruqlar ro'yxati (+1 more)

### Community 33 - "RequirePermission"
Cohesion: 0.21
Nodes (4): RequirePermission(), CentersController, clientOf(), listCentersSchema

### Community 34 - "CurrentUser"
Cohesion: 0.24
Nodes (3): CurrentUser, BranchesController, clientOf()

### Community 35 - "guards.ts"
Cohesion: 0.15
Nodes (8): ALLOW_MUST_CHANGE, IS_PUBLIC, PERMISSIONS_KEY, ROLES_KEY, JwtAuthGuard, PermissionsGuard, RolesGuard, unauthorized()

### Community 36 - "AuthUser"
Cohesion: 0.24
Nodes (9): changePasswordSchema, loginSchema, refreshSchema, AccessClaims, AuthedRequest, AuthUser, UserRow, AllowMustChangePassword() (+1 more)

### Community 37 - ".oxlintrc.json"
Cohesion: 0.29
Nodes (6): env, node, rules, typescript/no-explicit-any, typescript/no-floating-promises, $schema

### Community 38 - "main.ts"
Cohesion: 0.29
Nodes (3): @nestjs/core@^12.0.1, envFile, @nestjs/core

### Community 39 - "tsconfig.build.json"
Cohesion: 0.29
Nodes (6): compilerOptions, rootDir, exclude, extends, include, ./tsconfig.json

### Community 40 - "users"
Cohesion: 0.13
Nodes (24): Filialga bog'lash: OWNER hammasi, ADMIN/CASHIER user_branches, Kassir/admin alohida rol, ruxsat orqali birlashishi mumkin, Ustoz moliyani ko'rmaydi (○: faqat qarz bor/yo'q), users.login global noyob (lower(login)), Ruxsatlar matritsasi (3-bo'lim), Super admin tenant ichini ko'rmaydi; impersonate hozircha yo'q, notification_log, Matritsa 3.1 Platforma (faqat SUPER_ADMIN) (+16 more)

### Community 41 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 42 - "Bozor tahlili (raqobatchilar)"
Cohesion: 0.18
Nodes (11): Audit jurnali: kim, nima, qachon, oldingi/keyingi, Raqobatchilar: SchoolupCRM, UstozCRM, ALFA CRM, Umai CRM, Shaxsiy ma'lumotlar qonuni (lokalizatsiya), Bepul infra cheklovlari (Neon/Supabase, Render, Fly.io), Bozor tahlili (raqobatchilar), To'lov tizimlari: Payme, Click, Uzum, Xavf: murakkab domen qoidalari xatosi, Xavf: bepul infra cheklovlari (+3 more)

### Community 43 - "allowBuilds"
Cohesion: 0.40
Nodes (4): allowBuilds, sharp, unrs-resolver, packages

### Community 44 - "branches.controller.ts"
Cohesion: 0.43
Nodes (5): id(), createBranchSchema, listBranchesSchema, phone, updateBranchSchema

## Knowledge Gaps
- **34 isolated node(s):** `./tsconfig.json`, `Xato javoblari { code, message }`, `Qaror: avans va ko'p oylik to'lov mumkin`, `O'quvchini ko'chirish: eski enrollments yopiladi, yangisi ochiladi`, `localhost:5432 da boshqa Postgres ishlayapti` (+29 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 265 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CLAUDE.md (loyiha ko'rsatmalari)` connect `CLAUDE.md (loyiha ko'rsatmalari)` to `Buyruqlar ro'yxati`, `REJA.md`, `Yaratish va parol qoidalari jadvali`, `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)`, `Ruxsatlar matritsasi (3-bo'lim)`, `Arxitektura qarorlari (kodda tasdiqlangan)`, `enrollments`, `payments`?**
  _High betweenness centrality (0.302) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `Xato javoblari { code, message }`, `Qaror: avans va ko'p oylik to'lov mumkin` to the rest of the system?**
  _34 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `.login` be split into smaller, more focused modules?**
  _Cohesion score 0.08527131782945736 - nodes in this community are weakly interconnected._
- **Why does `typescript` connect `CLAUDE.md (loyiha ko'rsatmalari)` to `api/package.json`?**
  _High betweenness centrality (0.291) - this node is a cross-community bridge._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11255411255411256 - nodes in this community are weakly interconnected._
- **Why does `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)` connect `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)` to `REJA.md`, `CLAUDE.md (loyiha ko'rsatmalari)`, `Yaratish va parol qoidalari jadvali`, `users`, `Ruxsatlar matritsasi (3-bo'lim)`, `Arxitektura qarorlari (kodda tasdiqlangan)`, `enrollments`, `payments`?**
  _High betweenness centrality (0.162) - this node is a cross-community bridge._
- **Should `web/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05758582502768549 - nodes in this community are weakly interconnected._