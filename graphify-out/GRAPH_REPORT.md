# Graph Report - ERP  (2026-11-18)

## Corpus Check
- 87 files · ~29,466 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 5, .css 2, .example 1)

## Summary
- 966 nodes · 2253 edges · 57 communities (49 shown, 8 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 155 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- .login
- centers.controller.ts
- index.ts
- web/package.json
- centers (tenant)
- CLAUDE.md (loyiha ko'rsatmalari)
- Arxitektura qarorlari (kodda tasdiqlangan)
- ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)
- compilerOptions
- Ruxsatlar matritsasi (3-bo'lim)
- compilerOptions
- scripts
- db
- scripts
- auth.service.ts
- devDependencies
- dependencies
- Arxitektura qarorlari (kodda tasdiqlangan)
- enrollments
- tenant-isolation.e2e-spec.ts
- centers.e2e-spec.ts
- users.service.ts
- shared/package.json
- auth.service.ts
- centers.service.ts
- compilerOptions
- api/package.json
- postgres
- DbService
- @nestjs/common
- .resetPassword
- payments
- Buyruqlar ro'yxati
- RequirePermission
- Muhit holati (muhim)
- guards.ts
- branches.controller.ts
- .oxlintrc.json
- Qabul qilingan qarorlar va ochiq savollar (6-bo'lim)
- tsconfig.build.json
- users
- nest-cli.json
- Bozor tahlili (raqobatchilar)
- allowBuilds
- permissions-admin.controller.ts
- vitest
- enrollments
- users.schemas.ts
- Yo'l xaritasi 30/90/180 kun
- seed.ts
- @electric-sql/pglite
- @nestjs/schematics@^12.0.0
- oxlint@^1.58.0
- prettier@^3.4.2
- tsx@^4.23.15
- @types/supertest@^7.0.0
- @vitest/coverage-v8@^4.1.2

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 69 edges
2. `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)` - 59 edges
3. `@nestjs/common` - 35 edges
4. `RequirePermission()` - 33 edges
5. `CLAUDE.md (loyiha ko'rsatmalari)` - 32 edges
6. `CurrentUser` - 31 edges
7. `ClientInfo` - 24 edges
8. `writeAudit()` - 24 edges
9. `users` - 24 edges
10. `DbService` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Frontend: Next.js (React)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `CLAUDE.md (loyiha ko'rsatmalari)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `Backend: NestJS modulli monolit` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `AuthUser` --references--> `Role`  [EXTRACTED]
  apps/api/src/auth/auth.types.ts → packages/shared/src/index.ts
- `To'lov, maosh to'lovi, audit append-only` --semantically_similar_to--> `Qoida 3: Pul append-only, teskari yozuv`  [INFERRED] [semantically similar]
  CLAUDE.md → ERD-VA-RUXSATLAR.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **6-qadam reja elementlari** — progress_p6_1, progress_p6_2, progress_p6_3, progress_p6_4, progress_p6_5, progress_p6_6, claude_skelet_6 [EXTRACTED 1.00]
- **Ruxsat tekshirish qatlami** — erd_va_ruxsatlar_perm_code_guard, erd_va_ruxsatlar_scope, erd_va_ruxsatlar_effective_perm, erd_va_ruxsatlar_guard_order, progress_d_guard_order, progress_d_effective_perm [INFERRED 0.85]
- **RLS tenant izolyatsiya mexanizmi** — erd_va_ruxsatlar_rls_impl, erd_va_ruxsatlar_secdef_funcs, erd_va_ruxsatlar_composite_fk, erd_va_ruxsatlar_isolation_test, progress_d_rls [INFERRED 0.85]

## Communities (57 total, 8 thin omitted)

### Community 0 - ".login"
Cohesion: 0.09
Nodes (11): AuthController, clientOf(), accountInactive(), AuthService, centerBlocked(), invalidCredentials(), invalidRefresh(), AllowMustChangePassword() (+3 more)

### Community 1 - "centers.controller.ts"
Cohesion: 0.33
Nodes (8): blockCenterSchema, createCenterSchema, idParamSchema, listCentersSchema, phone, resetOwnerPasswordSchema, slug, updateCenterSchema

### Community 2 - "index.ts"
Cohesion: 0.15
Nodes (11): DEFAULT_CENTER_SETTINGS, DEFAULT_TRIAL_DAYS, defaultRolePermissionRows(), ROLE_PERMISSION_MATRIX, RoleMatrix, RolePermissionRow, PERMISSION_CODES, PERMISSION_MODULES (+3 more)

### Community 3 - "web/package.json"
Cohesion: 0.06
Nodes (34): eslintConfig, nextConfig, dependencies, next@16.4.6, react@19.3.0, react-dom@19.3.0, devDependencies, eslint@^9 (+26 more)

### Community 4 - "centers (tenant)"
Cohesion: 0.16
Nodes (15): To'lov, maosh to'lovi, audit append-only, centers (tenant), Trigger centers_guard_platform_columns, import_jobs, users/centers/branches/plans ga DELETE huquqi yo'q, plans (tarif), Qoida 6: Yumshoq o'chirish archived_at, Qoida 1: Tenant = centers, har jadvalda center_id (+7 more)

### Community 5 - "CLAUDE.md (loyiha ko'rsatmalari)"
Cohesion: 0.12
Nodes (23): typescript@^6.0.2, typescript, Qarz saqlanmaydi, charges dan hisoblanadi, CLAUDE.md (loyiha ko'rsatmalari), Hujjatlarni o'qish tartibi, Qaror ERD dan chetga chiqsa avval hujjatni yangila, ERD hujjati model va ruxsatlar manbasi, Til qoidasi: o'zbekcha suhbat, inglizcha kod (+15 more)

### Community 6 - "Arxitektura qarorlari (kodda tasdiqlangan)"
Cohesion: 0.13
Nodes (22): Tenant izolyatsiyasi: center_id + RLS + servis tekshiruvi, Bloklash POST /admin/centers/:id/block, unblock, owner reset-password, Bloklangan markaz: kirish rad etiladi, Markaz boshlang'ich settings (GROUP_CYCLE, grace 0, FULL_MONTH, NONE, uz), Kross-markaz havola himoyasi: kompozit FK, Markaz yaratish POST /admin/centers (bitta tranzaksiya), Guard tartibi: JWT -> @Roles -> @RequirePermission, RLS implementatsiyasi: erp_app roli, app.center_id, app.is_super_admin (+14 more)

### Community 7 - "ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)"
Cohesion: 0.17
Nodes (22): assignments, attendance_records, branches, courses, ERD-VA-RUXSATLAR.md (ERD va ruxsatlar), expenses, group_schedules, groups (+14 more)

### Community 8 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+12 more)

### Community 9 - "Ruxsatlar matritsasi (3-bo'lim)"
Cohesion: 0.21
Nodes (13): Ruxsatlar: rol + center_role_permissions + user_permissions, scope so'rov filtri, center_role_permissions, Samarali ruxsat = rol shabloni ± user istisnosi, Belgilar: ✔ ○ – o f, Matritsa 3.2 Tashkilot va foydalanuvchilar, permissions pnpm db:seed orqali @erp/shared dan, permissions, Rol shabloni kodda permission-matrix.ts (+5 more)

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

### Community 14 - "auth.service.ts"
Cohesion: 0.29
Nodes (9): LoginResult, AccessClaims, SessionRow, TokenPair, UserRow, PAYMENT_MODES, PaymentMode, Role (+1 more)

### Community 15 - "devDependencies"
Cohesion: 0.12
Nodes (15): devDependencies, drizzle-kit@^0.31.11, @nestjs/cli@^12.0.0, @nestjs/mau@^0.2.6, @nestjs/testing@^12.0.1, oxlint-tsgolint@^7.0.2001, source-map-support@^0.5.21, supertest@^7.0.0 (+7 more)

### Community 16 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, drizzle-orm@^0.45.4, @erp/shared@workspace:*, @nestjs/common@^12.0.1, @nestjs/core@^12.0.1, @nestjs/jwt@^12.0.5, @nestjs/platform-express@^12.0.1, @node-rs/argon2@^2.2.2 (+10 more)

### Community 17 - "Arxitektura qarorlari (kodda tasdiqlangan)"
Cohesion: 0.10
Nodes (36): Parol: argon2, must_change_password, Skelet 1: Monorepo, Docker Compose, .env.example (tayyor), Skelet 2: Migratsiyalar 10 jadval (tayyor), Skelet 3: Auth login, JWT+refresh, guard (tayyor), Skelet 4: RLS va tenant izolyatsiya testi (tayyor), Skelet 5: Super admin markaz yaratish/bloklash (tayyor), Skelet 6: Rahbar filial va xodim yaratish, ruxsat sozlash (keyingi), Skelet 7: Audit jurnali va ruxsat matritsasi testi (kutmoqda) (+28 more)

### Community 18 - "enrollments"
Cohesion: 0.24
Nodes (11): Ikki to'lov rejimi GROUP_CYCLE / STUDENT_CYCLE, Ikki to'lov sikli taqqoslash jadvali, GROUP_CYCLE (Najot usuli), settings.join_proration: FULL_MONTH / REMAINING_LESSONS / BY_DAYS / NEXT_CYCLE, Oy oxiri: 29-31 kun oyning oxirgi kuniga siljiydi, STUDENT_CYCLE (Everest usuli), Bozor bo'shlig'i (taxmin), Moslashuvchan maosh motori (farqlovchi) (+3 more)

### Community 19 - "tenant-isolation.e2e-spec.ts"
Cohesion: 0.22
Nodes (6): NO_CONTEXT, TenantContext, rowsOf(), Fixture, TENANT_TABLES, TenantTable

### Community 20 - "centers.e2e-spec.ts"
Cohesion: 0.05
Nodes (37): AppController, AppModule, AppService, AuditModule, hashPassword(), PARAMS, verifyAgainstDummy(), verifyPassword() (+29 more)

### Community 21 - "users.service.ts"
Cohesion: 0.07
Nodes (33): writeAudit(), ClientInfo, AuthUser, CreateBranchInput, phone, UpdateBranchInput, audited(), BranchesService (+25 more)

### Community 22 - "shared/package.json"
Cohesion: 0.18
Nodes (11): devDependencies, typescript@^5.9.3, typescript, main, name, private, scripts, build (+3 more)

### Community 23 - "auth.service.ts"
Cohesion: 0.17
Nodes (20): AuditEntry, listAuditSchema, client, db, login, contextOf(), Tx, auditLogs (+12 more)

### Community 24 - "centers.service.ts"
Cohesion: 0.22
Nodes (8): generateTempPassword(), CreatedCenter, SUPER, CYRILLIC, slugify(), enterCenter(), centers, sessions

### Community 25 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, esModuleInterop, module, outDir, rootDir, skipLibCheck, strict (+2 more)

### Community 26 - "api/package.json"
Cohesion: 0.17
Nodes (11): author, description, @types/node@^24.0.0, vite@^8.0.0, @types/node, license, name, private (+3 more)

### Community 27 - "postgres"
Cohesion: 0.50
Nodes (3): postgres@^4.1.1, client, postgres

### Community 28 - "DbService"
Cohesion: 0.20
Nodes (3): AuditController, PermissionsService, DbService

### Community 29 - "@nestjs/common"
Cohesion: 0.24
Nodes (4): AuthModule, CentersModule, UsersModule, @nestjs/common

### Community 30 - ".resetPassword"
Cohesion: 0.14
Nodes (7): Roles(), clientOf(), StaffController, UserPasswordController, createStaffSchema, listStaffSchema, updateStaffSchema

### Community 31 - "payments"
Cohesion: 0.17
Nodes (13): Qaror: avans va ko'p oylik to'lov mumkin, To'lov eng eski ochiq charge ga taqsimlanadi, ortiqcha = avans, payment_allocations, payments, Matritsa 3.4 Moliya, Reyting agregatsiya orqali, alohida jadval yo'q, rating_points, Qaytarish: status=REVERSED va reverses_payment_id (+5 more)

### Community 32 - "Buyruqlar ro'yxati"
Cohesion: 0.22
Nodes (9): Kod grafi graphify-out, pnpm build, pnpm --filter @erp/api db:generate (drizzle-kit), pnpm db:migrate | db:seed | db:create-super-admin, graphify update ., pnpm --filter @erp/api lint (oxlint), pnpm --filter @erp/api test (unit), Buyruqlar ro'yxati (+1 more)

### Community 33 - "RequirePermission"
Cohesion: 0.05
Nodes (14): CurrentUser, RequirePermission(), BranchesController, clientOf(), createBranchSchema, listBranchesSchema, updateBranchSchema, CentersController (+6 more)

### Community 34 - "Muhit holati (muhim)"
Cohesion: 0.22
Nodes (11): Byudjet $0, host-agnostik (Docker), ORM: Drizzle, Baza: PostgreSQL (Neon/Supabase bepul), pnpm --filter @erp/api test:e2e (PGlite, ~20 s, 98 test), Docker ishlamaydi: kompyuterda WSL yo'q, Muhit holati (muhim), Muqobil: Neon bepul bazasi (DATABASE_URL va DATABASE_MIGRATION_URL), Hamma testlar PGlite da (xotiradagi Postgres) (+3 more)

### Community 35 - "guards.ts"
Cohesion: 0.14
Nodes (10): AuthedRequest, ALLOW_MUST_CHANGE, IS_PUBLIC, PERMISSIONS_KEY, ROLES_KEY, JwtAuthGuard, PermissionsGuard, RolesGuard (+2 more)

### Community 36 - "branches.controller.ts"
Cohesion: 0.22
Nodes (8): changePasswordSchema, loginSchema, refreshSchema, id(), id(), ZodPipe, id(), zod

### Community 37 - ".oxlintrc.json"
Cohesion: 0.29
Nodes (6): env, node, rules, typescript/no-explicit-any, typescript/no-floating-promises, $schema

### Community 38 - "Qabul qilingan qarorlar va ochiq savollar (6-bo'lim)"
Cohesion: 0.20
Nodes (11): Bir o'quvchi bitta akkaunt, turli filial guruhlarida, Maosh qoidalari faqat rahbarda, O'quvchi filial reytingini to'liq ism bilan ko'radi, Qabul qilingan qarorlar va ochiq savollar (6-bo'lim), Ochiq savol: markaz reytingida boshqa filial ismlari ko'rinsinmi, Reyting: guruh, filial, markaz; oylik va umumiy, Login cheklovi xotirada (ip+login, 5 xato/15 daq), Ochiq savollar (+3 more)

### Community 39 - "tsconfig.build.json"
Cohesion: 0.29
Nodes (6): compilerOptions, rootDir, exclude, extends, include, ./tsconfig.json

### Community 40 - "users"
Cohesion: 0.13
Nodes (24): Filialga bog'lash: OWNER hammasi, ADMIN/CASHIER user_branches, Kassir/admin alohida rol, ruxsat orqali birlashishi mumkin, Ustoz moliyani ko'rmaydi (○: faqat qarz bor/yo'q), Ustoz bir nechta filial/guruhda ishlay oladi, group_teachers, users.login global noyob (lower(login)), Ruxsatlar matritsasi (3-bo'lim), Super admin tenant ichini ko'rmaydi; impersonate hozircha yo'q (+16 more)

### Community 41 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 42 - "Bozor tahlili (raqobatchilar)"
Cohesion: 0.14
Nodes (15): Audit jurnali: kim, nima, qachon, oldingi/keyingi, Auth: argon2, JWT + refresh, 2FA, Raqobatchilar: SchoolupCRM, UstozCRM, ALFA CRM, Umai CRM, Shaxsiy ma'lumotlar qonuni (lokalizatsiya), Birinchi 7 kunda 5 amaliy qadam, Bepul infra cheklovlari (Neon/Supabase, Render, Fly.io), Bozor tahlili (raqobatchilar), Modulli monolit modullari (auth, tenancy, org, billing, payroll...) (+7 more)

### Community 43 - "allowBuilds"
Cohesion: 0.40
Nodes (4): allowBuilds, sharp, unrs-resolver, packages

### Community 44 - "permissions-admin.controller.ts"
Cohesion: 0.27
Nodes (4): PermissionsAdminModule, roleParamSchema, setRolePermissionsSchema, setUserPermissionsSchema

### Community 46 - "enrollments"
Cohesion: 0.24
Nodes (10): charges, Qarzdor: today > due_date + grace_days va charge to'lanmagan, Chegirma charge yaratilganda qotiriladi, enrollment_discounts, enrollments, FROZEN/LEFT yozilishga charge yaratilmaydi, grace_days: markaz sukuti + groups.grace_days, Qoida 4: Qarz hisoblanadi (charges), saqlanmaydi (+2 more)

### Community 47 - "users.schemas.ts"
Cohesion: 0.22
Nodes (8): branchIds, CreateStaffInput, ListStaffQuery, login, phone, STAFF_ROLES, StaffRole, UpdateStaffInput

### Community 48 - "Yo'l xaritasi 30/90/180 kun"
Cohesion: 0.29
Nodes (7): 5-10 rahbar bilan suhbat (birinchi vazifa), Marketing: pilot markazlar, Excel import, Telegram kanal, Pilot markazlar (3 ta, bepul 2-3 oy), 180 kun: vazifa, reyting, bot, pullik markazlar, 30 kun: suhbat, ERD, skelet, 90 kun: MVP va pilot, Yo'l xaritasi 30/90/180 kun

### Community 49 - "seed.ts"
Cohesion: 0.50
Nodes (3): permissions, client, db

## Knowledge Gaps
- **34 isolated node(s):** `./tsconfig.json`, `Xato javoblari { code, message }`, `Hech narsa commit qilinmagan`, `Qaror: avans va ko'p oylik to'lov mumkin`, `Oy oxiri: 29-31 kun oyning oxirgi kuniga siljiydi` (+29 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 276 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CLAUDE.md (loyiha ko'rsatmalari)` connect `CLAUDE.md (loyiha ko'rsatmalari)` to `Buyruqlar ro'yxati`, `Muhit holati (muhim)`, `centers (tenant)`, `Arxitektura qarorlari (kodda tasdiqlangan)`, `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)`, `Ruxsatlar matritsasi (3-bo'lim)`, `Bozor tahlili (raqobatchilar)`, `Arxitektura qarorlari (kodda tasdiqlangan)`, `enrollments`?**
  _High betweenness centrality (0.299) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `Xato javoblari { code, message }`, `Hech narsa commit qilinmagan` to the rest of the system?**
  _34 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `.login` be split into smaller, more focused modules?**
  _Cohesion score 0.08710801393728224 - nodes in this community are weakly interconnected._
- **Why does `typescript` connect `CLAUDE.md (loyiha ko'rsatmalari)` to `api/package.json`?**
  _High betweenness centrality (0.290) - this node is a cross-community bridge._
- **Should `web/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05758582502768549 - nodes in this community are weakly interconnected._
- **Why does `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)` connect `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)` to `centers (tenant)`, `CLAUDE.md (loyiha ko'rsatmalari)`, `Arxitektura qarorlari (kodda tasdiqlangan)`, `Qabul qilingan qarorlar va ochiq savollar (6-bo'lim)`, `users`, `Ruxsatlar matritsasi (3-bo'lim)`, `Bozor tahlili (raqobatchilar)`, `enrollments`, `Arxitektura qarorlari (kodda tasdiqlangan)`, `enrollments`, `payments`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **Should `CLAUDE.md (loyiha ko'rsatmalari)` be split into smaller, more focused modules?**
  _Cohesion score 0.11857707509881422 - nodes in this community are weakly interconnected._