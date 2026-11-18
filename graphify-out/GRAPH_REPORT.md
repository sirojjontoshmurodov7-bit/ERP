# Graph Report - ERP  (2026-11-18)

## Corpus Check
- 104 files · ~41,531 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 5, .css 2, .example 1)

## Summary
- 1170 nodes · 3140 edges · 51 communities (45 shown, 6 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 219 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b332edae`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- auth.service.ts
- groups.controller.ts
- PermissionsAdminService
- web/package.json
- centers (tenant)
- CLAUDE.md (loyiha ko'rsatmalari)
- Markaz yaratish POST /admin/centers (bitta tranzaksiya)
- ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)
- compilerOptions
- Ruxsatlar matritsasi (3-bo'lim)
- compilerOptions
- scripts
- db
- scripts
- .list
- devDependencies
- dependencies
- Arxitektura qarorlari (kodda tasdiqlangan)
- courses.service.ts
- .changePassword
- centers.e2e-spec.ts
- users.service.ts
- shared/package.json
- groups.service.ts
- centers.service.ts
- compilerOptions
- api/package.json
- JwtAuthGuard
- DbService
- @nestjs/common
- CurrentUser
- students.controller.ts
- Buyruqlar ro'yxati
- RequirePermission
- main.ts
- guards.ts
- permissions-admin.controller.ts
- .oxlintrc.json
- Qabul qilingan qarorlar va ochiq savollar (6-bo'lim)
- tsconfig.build.json
- Skelet 6: Rahbar filial va xodim yaratish, ruxsat sozlash (keyingi)
- nest-cli.json
- REJA.md
- allowBuilds
- auth.controller.ts
- vitest
- enrollments
- users.service.ts
- @nestjs/mau@^0.2.6
- @nestjs/schematics@^12.0.0
- tsx@^4.23.15

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 127 edges
2. `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)` - 59 edges
3. `CurrentUser` - 55 edges
4. `ClientInfo` - 47 edges
5. `@nestjs/common` - 46 edges
6. `Tx` - 36 edges
7. `writeAudit()` - 33 edges
8. `RequirePermission()` - 33 edges
9. `CLAUDE.md (loyiha ko'rsatmalari)` - 32 edges
10. `DbService` - 29 edges

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

## Communities (51 total, 6 thin omitted)

### Community 0 - "auth.service.ts"
Cohesion: 0.11
Nodes (10): accountInactive(), AuthService, centerBlocked(), invalidCredentials(), invalidRefresh(), LoginResult, SessionRow, TokenPair (+2 more)

### Community 1 - "groups.controller.ts"
Cohesion: 0.15
Nodes (19): Roles(), id(), id(), blockCenterSchema, createCenterSchema, idParamSchema, listCentersSchema, phone (+11 more)

### Community 2 - "PermissionsAdminService"
Cohesion: 0.08
Nodes (17): clientOf(), PermissionsAdminController, assertConfigurable(), PermissionsAdminService, DEFAULT_CENTER_SETTINGS, DEFAULT_TRIAL_DAYS, defaultRolePermissionRows(), ROLE_PERMISSION_MATRIX (+9 more)

### Community 3 - "web/package.json"
Cohesion: 0.06
Nodes (34): eslintConfig, nextConfig, dependencies, next@16.4.6, react@19.3.0, react-dom@19.3.0, devDependencies, eslint@^9 (+26 more)

### Community 4 - "centers (tenant)"
Cohesion: 0.16
Nodes (15): centers (tenant), Trigger centers_guard_platform_columns, courses, import_jobs, users/centers/branches/plans ga DELETE huquqi yo'q, plans (tarif), Qoida 6: Yumshoq o'chirish archived_at, Qoida 1: Tenant = centers, har jadvalda center_id (+7 more)

### Community 5 - "CLAUDE.md (loyiha ko'rsatmalari)"
Cohesion: 0.10
Nodes (28): typescript@^6.0.2, typescript, Byudjet $0, host-agnostik (Docker), CLAUDE.md (loyiha ko'rsatmalari), Hujjatlarni o'qish tartibi, Qaror ERD dan chetga chiqsa avval hujjatni yangila, ERD hujjati model va ruxsatlar manbasi, Til qoidasi: o'zbekcha suhbat, inglizcha kod (+20 more)

### Community 6 - "Markaz yaratish POST /admin/centers (bitta tranzaksiya)"
Cohesion: 0.43
Nodes (7): Skelet 5: Super admin markaz yaratish/bloklash (tayyor), Markaz boshlang'ich settings (GROUP_CYCLE, grace 0, FULL_MONTH, NONE, uz), Markaz yaratish POST /admin/centers (bitta tranzaksiya), Vaqtinchalik parol bir marta ko'rsatiladi, Markaz sukutlari: TRIAL 14 kun, GROUP_CYCLE, grace 0, FULL_MONTH, NONE, uz; parol xxxx-xxxx-xxxx, enterCenter(tx, id) markaz yaratishda kontekstga o'tish, Progress 5: Super admin markaz yaratish/bloklash (tayyor)

### Community 7 - "ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)"
Cohesion: 0.12
Nodes (34): assignments, attendance_records, Bloklash POST /admin/centers/:id/block, unblock, owner reset-password, branches, Ustoz bir nechta filial/guruhda ishlay oladi, ERD-VA-RUXSATLAR.md (ERD va ruxsatlar), expenses, group_schedules (+26 more)

### Community 8 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+12 more)

### Community 9 - "Ruxsatlar matritsasi (3-bo'lim)"
Cohesion: 0.11
Nodes (25): Ruxsatlar: rol + center_role_permissions + user_permissions, scope so'rov filtri, Kassir/admin alohida rol, ruxsat orqali birlashishi mumkin, center_role_permissions, Kross-markaz havola himoyasi: kompozit FK, Samarali ruxsat = rol shabloni ± user istisnosi, Ruxsatlar matritsasi (3-bo'lim), Belgilar: ✔ ○ – o f, Super admin tenant ichini ko'rmaydi; impersonate hozircha yo'q (+17 more)

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
Nodes (19): devDependencies, drizzle-kit@^0.31.11, @electric-sql/pglite@^0.5.16, @nestjs/cli@^12.0.0, @nestjs/testing@^12.0.1, oxlint@^1.58.0, oxlint-tsgolint@^7.0.2001, prettier@^3.4.2 (+11 more)

### Community 16 - "dependencies"
Cohesion: 0.14
Nodes (14): dependencies, drizzle-orm@^0.45.4, @erp/shared@workspace:*, @nestjs/common@^12.0.1, @nestjs/platform-express@^12.0.1, @node-rs/argon2@^2.2.2, reflect-metadata@^0.2.2, rxjs@^7.8.1 (+6 more)

### Community 17 - "Arxitektura qarorlari (kodda tasdiqlangan)"
Cohesion: 0.09
Nodes (37): To'lov, maosh to'lovi, audit append-only, ORM: Drizzle, Skelet 1: Monorepo, Docker Compose, .env.example (tayyor), Skelet 2: Migratsiyalar 10 jadval (tayyor), Skelet 3: Auth login, JWT+refresh, guard (tayyor), Skelet 4: RLS va tenant izolyatsiya testi (tayyor), Skelet 7: Audit jurnali va ruxsat matritsasi testi (kutmoqda), Skelet maqsadi: super admin markaz ochadi, rahbar kiradi, filial va xodim yaratadi (+29 more)

### Community 18 - "courses.service.ts"
Cohesion: 0.11
Nodes (16): pgErrorInfo(), uniqueViolation(), clientOf(), CoursesController, CreateCourseInput, createCourseSchema, listCoursesSchema, price (+8 more)

### Community 19 - ".changePassword"
Cohesion: 0.15
Nodes (6): AppController, AppService, AuthController, clientOf(), AllowMustChangePassword(), Public()

### Community 20 - "centers.e2e-spec.ts"
Cohesion: 0.05
Nodes (61): postgres@^4.1.1, AppModule, hashPassword(), PARAMS, verifyAgainstDummy(), verifyPassword(), APP_CONFIG, AppConfig (+53 more)

### Community 21 - "users.service.ts"
Cohesion: 0.07
Nodes (29): writeAudit(), ClientInfo, AuthUser, generateTempPassword(), audited(), BranchesService, nameTaken(), view() (+21 more)

### Community 22 - "shared/package.json"
Cohesion: 0.18
Nodes (11): devDependencies, typescript@^5.9.3, typescript, main, name, private, scripts, build (+3 more)

### Community 23 - "groups.service.ts"
Cohesion: 0.16
Nodes (18): AuditEntry, notFound(), branchFilter(), auditLogs, branches, centers, courses, createdAt() (+10 more)

### Community 24 - "centers.service.ts"
Cohesion: 0.16
Nodes (10): CreateCenterInput, ListCentersQuery, UpdateCenterInput, CreatedCenter, notFound(), SUPER, CYRILLIC, slugify() (+2 more)

### Community 25 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, esModuleInterop, module, outDir, rootDir, skipLibCheck, strict (+2 more)

### Community 26 - "api/package.json"
Cohesion: 0.12
Nodes (15): author, description, @types/express@^5.0.0, @types/supertest@^7.0.0, vite@^8.0.0, @vitest/coverage-v8@^4.1.2, license, name (+7 more)

### Community 27 - "JwtAuthGuard"
Cohesion: 0.20
Nodes (4): JwtAuthGuard, PermissionsGuard, RolesGuard, unauthorized()

### Community 29 - "@nestjs/common"
Cohesion: 0.12
Nodes (12): @nestjs/jwt@^12.0.5, AuditModule, AuthModule, BranchesModule, CentersModule, CoursesModule, GroupsModule, PermissionsAdminModule (+4 more)

### Community 30 - "CurrentUser"
Cohesion: 0.07
Nodes (23): CurrentUser, clientOf(), GroupsController, AssignTeacherInput, assignTeacherSchema, BILLING_KEYS, billingMode, CreateGroupInput (+15 more)

### Community 31 - "students.controller.ts"
Cohesion: 0.16
Nodes (12): studentProfiles, birthDate, CreateStudentInput, createStudentSchema, ListStudentsQuery, login, phone, UpdateStudentInput (+4 more)

### Community 32 - "Buyruqlar ro'yxati"
Cohesion: 0.13
Nodes (17): Kod grafi graphify-out, pnpm build, pnpm --filter @erp/api db:generate (drizzle-kit), pnpm db:migrate | db:seed | db:create-super-admin, pnpm --filter @erp/api test:e2e (PGlite, ~20 s, 98 test), graphify update ., pnpm --filter @erp/api lint (oxlint), pnpm --filter @erp/api test (unit) (+9 more)

### Community 33 - "RequirePermission"
Cohesion: 0.06
Nodes (14): RequirePermission(), BranchesController, clientOf(), CreateBranchInput, createBranchSchema, listBranchesSchema, phone, UpdateBranchInput (+6 more)

### Community 34 - "main.ts"
Cohesion: 0.29
Nodes (3): @nestjs/core@^12.0.1, envFile, @nestjs/core

### Community 35 - "guards.ts"
Cohesion: 0.18
Nodes (16): listAuditSchema, AccessClaims, AuthedRequest, UserRow, ALLOW_MUST_CHANGE, IS_PUBLIC, PERMISSIONS_KEY, ROLES_KEY (+8 more)

### Community 36 - "permissions-admin.controller.ts"
Cohesion: 0.53
Nodes (3): roleParamSchema, setRolePermissionsSchema, setUserPermissionsSchema

### Community 37 - ".oxlintrc.json"
Cohesion: 0.29
Nodes (6): env, node, rules, typescript/no-explicit-any, typescript/no-floating-promises, $schema

### Community 38 - "Qabul qilingan qarorlar va ochiq savollar (6-bo'lim)"
Cohesion: 0.17
Nodes (13): Bir o'quvchi bitta akkaunt, turli filial guruhlarida, Maosh qoidalari faqat rahbarda, O'quvchi filial reytingini to'liq ism bilan ko'radi, Ustoz moliyani ko'rmaydi (○: faqat qarz bor/yo'q), Qabul qilingan qarorlar va ochiq savollar (6-bo'lim), Ochiq savol: markaz reytingida boshqa filial ismlari ko'rinsinmi, Reyting: guruh, filial, markaz; oylik va umumiy, Rol TEACHER (ustoz) (+5 more)

### Community 39 - "tsconfig.build.json"
Cohesion: 0.29
Nodes (6): compilerOptions, rootDir, exclude, extends, include, ./tsconfig.json

### Community 40 - "Skelet 6: Rahbar filial va xodim yaratish, ruxsat sozlash (keyingi)"
Cohesion: 0.18
Nodes (16): Parol: argon2, must_change_password, Skelet 6: Rahbar filial va xodim yaratish, ruxsat sozlash (keyingi), Bloklangan markaz: kirish rad etiladi, Filialga bog'lash: OWNER hammasi, ADMIN/CASHIER user_branches, Yaratish va parol qoidalari jadvali, must_change_password=true bilan boshlanadi, Parolni tiklash: yuqori rol quyi rolni, Scope: center, branch, own_group, own_record (so'rov filtri) (+8 more)

### Community 41 - "nest-cli.json"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 42 - "REJA.md"
Cohesion: 0.07
Nodes (33): Qarzdor: today > due_date + grace_days va charge to'lanmagan, grace_days: markaz sukuti + groups.grace_days, Audit jurnali: kim, nima, qachon, oldingi/keyingi, Auth: argon2, JWT + refresh, 2FA, Raqobatchilar: SchoolupCRM, UstozCRM, ALFA CRM, Umai CRM, Shaxsiy ma'lumotlar qonuni (lokalizatsiya), Birinchi 7 kunda 5 amaliy qadam, Bepul infra cheklovlari (Neon/Supabase, Render, Fly.io) (+25 more)

### Community 43 - "allowBuilds"
Cohesion: 0.40
Nodes (4): allowBuilds, sharp, unrs-resolver, packages

### Community 44 - "auth.controller.ts"
Cohesion: 0.50
Nodes (3): changePasswordSchema, loginSchema, refreshSchema

### Community 46 - "enrollments"
Cohesion: 0.15
Nodes (17): Ikki to'lov rejimi GROUP_CYCLE / STUDENT_CYCLE, Qarz saqlanmaydi, charges dan hisoblanadi, Qaror: avans va ko'p oylik to'lov mumkin, To'lov eng eski ochiq charge ga taqsimlanadi, ortiqcha = avans, charges, Ikki to'lov sikli taqqoslash jadvali, Chegirma charge yaratilganda qotiriladi, enrollment_discounts (+9 more)

### Community 47 - "users.service.ts"
Cohesion: 0.14
Nodes (17): generateLogin(), isLoginConflict(), MAX_LOGIN_TRIES, teacherProfiles, branchIds, CreateStaffInput, ListStaffQuery, login (+9 more)

## Knowledge Gaps
- **34 isolated node(s):** `./tsconfig.json`, `Ruxsat kodi: NestJS guard/decorator`, `Xato javoblari { code, message }`, `pnpm build`, `pnpm --filter @erp/api db:generate (drizzle-kit)` (+29 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 307 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `typescript` connect `CLAUDE.md (loyiha ko'rsatmalari)` to `api/package.json`?**
  _High betweenness centrality (0.239) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `Ruxsat kodi: NestJS guard/decorator`, `Xato javoblari { code, message }` to the rest of the system?**
  _34 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10795454545454546 - nodes in this community are weakly interconnected._
- **Why does `CLAUDE.md (loyiha ko'rsatmalari)` connect `CLAUDE.md (loyiha ko'rsatmalari)` to `Buyruqlar ro'yxati`, `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)`, `Skelet 6: Rahbar filial va xodim yaratish, ruxsat sozlash (keyingi)`, `Ruxsatlar matritsasi (3-bo'lim)`, `REJA.md`, `enrollments`, `Arxitektura qarorlari (kodda tasdiqlangan)`?**
  _High betweenness centrality (0.237) - this node is a cross-community bridge._
- **Should `groups.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14772727272727273 - nodes in this community are weakly interconnected._
- **Why does `AuthUser` connect `users.service.ts` to `auth.service.ts`, `groups.controller.ts`, `RequirePermission`, `guards.ts`, `permissions-admin.controller.ts`, `PermissionsAdminService`, `auth.controller.ts`, `.list`, `users.service.ts`, `courses.service.ts`, `.changePassword`, `groups.service.ts`, `centers.service.ts`, `CurrentUser`, `students.controller.ts`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Should `PermissionsAdminService` be split into smaller, more focused modules?**
  _Cohesion score 0.08205128205128205 - nodes in this community are weakly interconnected._