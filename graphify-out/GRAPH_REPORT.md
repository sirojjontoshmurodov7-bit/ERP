# Graph Report - ERP  (2026-11-18)

## Corpus Check
- 117 files · ~53,474 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 5, .css 2, .example 1)

## Summary
- 1326 nodes · 3787 edges · 58 communities (51 shown, 7 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 251 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `75e09945`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- auth.service.ts
- CurrentUser
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
- AuditController
- devDependencies
- dependencies
- Arxitektura qarorlari (kodda tasdiqlangan)
- CoursesService
- app.controller.ts
- students.e2e-spec.ts
- users.service.ts
- shared/package.json
- auth.service.ts
- centers.controller.ts
- compilerOptions
- api/package.json
- groups.schemas.ts
- attendance.e2e-spec.ts
- @nestjs/common
- EnrollmentsService
- students.schemas.ts
- Buyruqlar ro'yxati
- RequirePermission
- main.ts
- staff.e2e-spec.ts
- permissions-admin.controller.ts
- .oxlintrc.json
- Qabul qilingan qarorlar va ochiq savollar (6-bo'lim)
- tsconfig.build.json
- Skelet 6: Rahbar filial va xodim yaratish, ruxsat sozlash (keyingi)
- nest-cli.json
- REJA.md
- allowBuilds
- permission-matrix.e2e-spec.ts
- vitest
- enrollments
- centers.e2e-spec.ts
- DbModule
- users.controller.ts
- oxlint-tsgolint@^7.0.2001
- hashPassword
- prettier@^3.4.2
- enrollments.e2e-spec.ts
- auth.e2e-spec.ts
- groups.e2e-spec.ts
- LessonsService

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 170 edges
2. `CurrentUser` - 69 edges
3. `ClientInfo` - 62 edges
4. `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)` - 59 edges
5. `Tx` - 54 edges
6. `@nestjs/common` - 54 edges
7. `branchScope()` - 39 edges
8. `writeAudit()` - 37 edges
9. `drizzle-orm` - 34 edges
10. `DbService` - 33 edges

## Surprising Connections (you probably didn't know these)
- `Frontend: Next.js (React)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `CLAUDE.md (loyiha ko'rsatmalari)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `Backend: NestJS modulli monolit` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `AuthUser` --references--> `Role`  [EXTRACTED]
  apps/api/src/auth/auth.types.ts → packages/shared/src/index.ts
- `AccessClaims` --references--> `Role`  [EXTRACTED]
  apps/api/src/auth/auth.types.ts → packages/shared/src/index.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **6-qadam reja elementlari** — progress_p6_1, progress_p6_2, progress_p6_3, progress_p6_4, progress_p6_5, progress_p6_6, claude_skelet_6 [EXTRACTED 1.00]
- **Ruxsat tekshirish qatlami** — erd_va_ruxsatlar_perm_code_guard, erd_va_ruxsatlar_scope, erd_va_ruxsatlar_effective_perm, erd_va_ruxsatlar_guard_order, progress_d_guard_order, progress_d_effective_perm [INFERRED 0.85]
- **RLS tenant izolyatsiya mexanizmi** — erd_va_ruxsatlar_rls_impl, erd_va_ruxsatlar_secdef_funcs, erd_va_ruxsatlar_composite_fk, erd_va_ruxsatlar_isolation_test, progress_d_rls [INFERRED 0.85]

## Communities (58 total, 7 thin omitted)

### Community 0 - "auth.service.ts"
Cohesion: 0.06
Nodes (18): AuthController, clientOf(), accountInactive(), AuthService, centerBlocked(), invalidCredentials(), invalidRefresh(), LoginResult (+10 more)

### Community 1 - "CurrentUser"
Cohesion: 0.13
Nodes (18): changePasswordSchema, loginSchema, refreshSchema, CurrentUser, Roles(), id(), listBranchesSchema, idParamSchema (+10 more)

### Community 2 - "PermissionsAdminService"
Cohesion: 0.15
Nodes (5): clientOf(), PermissionsAdminController, assertConfigurable(), PermissionsAdminService, TenantRole

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
Nodes (19): devDependencies, drizzle-kit@^0.31.11, @electric-sql/pglite@^0.5.16, @nestjs/cli@^12.0.0, oxlint@^1.58.0, source-map-support@^0.5.21, tsx@^4.23.15, @types/express@^5.0.0 (+11 more)

### Community 16 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, drizzle-orm@^0.45.4, @erp/shared@workspace:*, @nestjs/common@^12.0.1, @nestjs/jwt@^12.0.5, @nestjs/platform-express@^12.0.1, @node-rs/argon2@^2.2.2, reflect-metadata@^0.2.2 (+8 more)

### Community 17 - "Arxitektura qarorlari (kodda tasdiqlangan)"
Cohesion: 0.09
Nodes (37): To'lov, maosh to'lovi, audit append-only, ORM: Drizzle, Skelet 1: Monorepo, Docker Compose, .env.example (tayyor), Skelet 2: Migratsiyalar 10 jadval (tayyor), Skelet 3: Auth login, JWT+refresh, guard (tayyor), Skelet 4: RLS va tenant izolyatsiya testi (tayyor), Skelet 7: Audit jurnali va ruxsat matritsasi testi (kutmoqda), Skelet maqsadi: super admin markaz ochadi, rahbar kiradi, filial va xodim yaratadi (+29 more)

### Community 18 - "CoursesService"
Cohesion: 0.11
Nodes (13): clientOf(), CoursesController, CreateCourseInput, createCourseSchema, listCoursesSchema, price, UpdateCourseInput, updateCourseSchema (+5 more)

### Community 20 - "students.e2e-spec.ts"
Cohesion: 0.17
Nodes (10): TenantContext, createTestDb(), activate(), Center, config, newCenter(), staff(), Fixture (+2 more)

### Community 21 - "users.service.ts"
Cohesion: 0.08
Nodes (31): writeAudit(), ClientInfo, AuthUser, audited(), BranchesService, nameTaken(), notFound(), view() (+23 more)

### Community 22 - "shared/package.json"
Cohesion: 0.18
Nodes (11): devDependencies, typescript@^5.9.3, typescript, main, name, private, scripts, build (+3 more)

### Community 23 - "auth.service.ts"
Cohesion: 0.05
Nodes (87): AuditEntry, listAuditSchema, AuthedRequest, SessionRow, UserRow, ALLOW_MUST_CHANGE, IS_PUBLIC, PERMISSIONS_KEY (+79 more)

### Community 24 - "centers.controller.ts"
Cohesion: 0.24
Nodes (10): id(), blockCenterSchema, createCenterSchema, ListCentersQuery, listCentersSchema, phone, resetOwnerPasswordSchema, slug (+2 more)

### Community 25 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, esModuleInterop, module, outDir, rootDir, skipLibCheck, strict (+2 more)

### Community 26 - "api/package.json"
Cohesion: 0.12
Nodes (15): author, description, @nestjs/mau@^0.2.6, @nestjs/schematics@^12.0.0, @types/supertest@^7.0.0, vite@^8.0.0, license, name (+7 more)

### Community 27 - "groups.schemas.ts"
Cohesion: 0.10
Nodes (18): clientOf(), GroupsController, AssignTeacherInput, assignTeacherSchema, BILLING_KEYS, billingMode, CreateGroupInput, createGroupSchema (+10 more)

### Community 28 - "attendance.e2e-spec.ts"
Cohesion: 0.29
Nodes (9): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+1 more)

### Community 29 - "@nestjs/common"
Cohesion: 0.11
Nodes (12): AuditModule, AuthModule, BranchesModule, CentersModule, CoursesModule, EnrollmentsModule, GroupsModule, LessonsModule (+4 more)

### Community 30 - "EnrollmentsService"
Cohesion: 0.09
Nodes (19): clientOf(), EnrollmentsController, CreateEnrollmentInput, createEnrollmentSchema, LeaveEnrollmentInput, leaveEnrollmentSchema, ListEnrollmentsQuery, listEnrollmentsSchema (+11 more)

### Community 31 - "students.schemas.ts"
Cohesion: 0.10
Nodes (11): clientOf(), StudentsController, birthDate, CreateStudentInput, createStudentSchema, ListStudentsQuery, listStudentsSchema, login (+3 more)

### Community 32 - "Buyruqlar ro'yxati"
Cohesion: 0.13
Nodes (17): Kod grafi graphify-out, pnpm build, pnpm --filter @erp/api db:generate (drizzle-kit), pnpm db:migrate | db:seed | db:create-super-admin, pnpm --filter @erp/api test:e2e (PGlite, ~20 s, 98 test), graphify update ., pnpm --filter @erp/api lint (oxlint), pnpm --filter @erp/api test (unit) (+9 more)

### Community 33 - "RequirePermission"
Cohesion: 0.06
Nodes (13): RequirePermission(), BranchesController, clientOf(), CreateBranchInput, createBranchSchema, phone, UpdateBranchInput, updateBranchSchema (+5 more)

### Community 34 - "main.ts"
Cohesion: 0.29
Nodes (3): @nestjs/core@^12.0.1, envFile, @nestjs/core

### Community 35 - "staff.e2e-spec.ts"
Cohesion: 0.32
Nodes (7): @nestjs/testing@^12.0.1, activate(), Center, config, newCenter(), staff(), @nestjs/testing

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

### Community 44 - "permission-matrix.e2e-spec.ts"
Cohesion: 0.20
Nodes (6): supertest@^7.0.0, activate(), AllPermissionsProbe, config, newCenter(), supertest

### Community 46 - "enrollments"
Cohesion: 0.15
Nodes (17): Ikki to'lov rejimi GROUP_CYCLE / STUDENT_CYCLE, Qarz saqlanmaydi, charges dan hisoblanadi, Qaror: avans va ko'p oylik to'lov mumkin, To'lov eng eski ochiq charge ga taqsimlanadi, ortiqcha = avans, charges, Ikki to'lov sikli taqqoslash jadvali, Chegirma charge yaratilganda qotiriladi, enrollment_discounts (+9 more)

### Community 47 - "centers.e2e-spec.ts"
Cohesion: 0.33
Nodes (3): AppModule, rowsOf(), config

### Community 49 - "users.controller.ts"
Cohesion: 0.09
Nodes (14): clientOf(), StaffController, UserPasswordController, branchIds, CreateStaffInput, createStaffSchema, ListStaffQuery, listStaffSchema (+6 more)

### Community 51 - "hashPassword"
Cohesion: 0.17
Nodes (10): postgres@^4.1.1, hashPassword(), PARAMS, verifyAgainstDummy(), verifyPassword(), client, db, login (+2 more)

### Community 53 - "enrollments.e2e-spec.ts"
Cohesion: 0.33
Nodes (9): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+1 more)

### Community 54 - "auth.e2e-spec.ts"
Cohesion: 0.17
Nodes (12): APP_CONFIG, AppConfig, ConfigModule, envSchema, loadConfig(), parseDuration(), UNIT_SECONDS, DB (+4 more)

### Community 57 - "groups.e2e-spec.ts"
Cohesion: 0.33
Nodes (8): activate(), Api, Center, config, makeApi(), newCenter(), staff(), student()

### Community 61 - "LessonsService"
Cohesion: 0.10
Nodes (18): clientOf(), ATTENDANCE_STATUSES, AttendanceStatus, CreateLessonInput, createLessonSchema, ListLessonsQuery, MarkAttendanceInput, markAttendanceSchema (+10 more)

## Knowledge Gaps
- **34 isolated node(s):** `./tsconfig.json`, `Ruxsat kodi: NestJS guard/decorator`, `Xato javoblari { code, message }`, `pnpm build`, `pnpm --filter @erp/api db:generate (drizzle-kit)` (+29 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 336 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CLAUDE.md (loyiha ko'rsatmalari)` connect `CLAUDE.md (loyiha ko'rsatmalari)` to `Buyruqlar ro'yxati`, `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)`, `Skelet 6: Rahbar filial va xodim yaratish, ruxsat sozlash (keyingi)`, `Ruxsatlar matritsasi (3-bo'lim)`, `REJA.md`, `enrollments`, `Arxitektura qarorlari (kodda tasdiqlangan)`?**
  _High betweenness centrality (0.281) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `Ruxsat kodi: NestJS guard/decorator`, `Xato javoblari { code, message }` to the rest of the system?**
  _34 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05889724310776942 - nodes in this community are weakly interconnected._
- **Why does `typescript` connect `CLAUDE.md (loyiha ko'rsatmalari)` to `api/package.json`?**
  _High betweenness centrality (0.275) - this node is a cross-community bridge._
- **Should `CurrentUser` be split into smaller, more focused modules?**
  _Cohesion score 0.13076923076923078 - nodes in this community are weakly interconnected._
- **Why does `AuthUser` connect `users.service.ts` to `auth.service.ts`, `CurrentUser`, `RequirePermission`, `PermissionsAdminService`, `permissions-admin.controller.ts`, `users.controller.ts`, `CoursesService`, `hashPassword`, `auth.service.ts`, `centers.controller.ts`, `groups.schemas.ts`, `LessonsService`, `EnrollmentsService`, `students.schemas.ts`?**
  _High betweenness centrality (0.175) - this node is a cross-community bridge._
- **Should `web/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05758582502768549 - nodes in this community are weakly interconnected._