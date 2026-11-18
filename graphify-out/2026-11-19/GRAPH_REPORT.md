# Graph Report - ERP  (2026-11-19)

## Corpus Check
- 134 files · ~72,853 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 5, .css 2, .example 1)

## Summary
- 1503 nodes · 4526 edges · 80 communities (67 shown, 13 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 298 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `57095fec`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- @nestjs/common
- app.module.ts
- branchScope() (#2)
- EnrollmentsService (#3)
- lessons.schemas.ts
- inScope() (#5)
- StudentsService (#6)
- BranchesService (#7)
- CoursesService (#8)
- TokenService
- web/package.json (#10)
- billing.e2e-spec.ts (#11)
- ChargesService (#12)
- students.service.ts (#13)
- schema.ts (#14)
- enrollments table (#15)
- ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)
- CLAUDE.md (loyiha ko'rsatmalari) (#17)
- REJA.md (#18)
- permissions-admin.controller.ts
- Ruxsatlar matritsasi (3-bo'lim)
- DbService
- Yaratish va parol qoidalari jadvali (#22)
- compilerOptions (#23)
- devDependencies (#24)
- enrollments.e2e-spec.ts
- compilerOptions (#26)
- scripts (#27)
- db (#28)
- .withContext
- centers table (tenant) (#30)
- scripts (#31)
- api/package.json
- dependencies (#33)
- auth.types.ts
- index.ts (#35)
- Skelet maqsadi: super admin markaz ochad (#36)
- permissions table (code catalog) (#38)
- attendance-lock.e2e-spec.ts (#39)
- shared/package.json (#40)
- attendance.e2e-spec.ts (#41)
- compilerOptions (#42)
- tenant-isolation.e2e-spec.ts (#43)
- activate
- AllPermissionsProbe
- payments table (#46)
- groups.e2e-spec.ts (#47)
- .oxlintrc.json (#48)
- main.ts (#49)
- RequirePermission
- AuthUser
- tsconfig.build.json (#52)
- Tx
- nest-cli.json (#54)
- .login
- allowBuilds (#56)
- vitest (#57)
- branchScope
- payments.controller.ts
- Environment limitation: Docker/WSL unava (#60)
- StudentsService
- GROUP_CYCLE billing mode
- schema.ts
- .hasIn
- .changePassword
- billing.e2e-spec.ts
- JwtAuthGuard
- PermissionsAdminService
- app.controller.ts
- payments.e2e-spec.ts
- .list
- audit.controller.ts
- ProbeController
- Qabul qilingan qarorlar va ochiq savollar (6-bo'lim)
- ConfigModule
- DbModule
- source-map-support@^0.5.21
- @types/supertest@^7.0.0
- CentersModule

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 206 edges
2. `CurrentUser` - 83 edges
3. `Tx` - 80 edges
4. `ClientInfo` - 71 edges
5. `@nestjs/common` - 64 edges
6. `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)` - 58 edges
7. `branchScope()` - 49 edges
8. `writeAudit()` - 44 edges
9. `drizzle-orm` - 41 edges
10. `Roles()` - 37 edges

## Surprising Connections (you probably didn't know these)
- `Frontend: Next.js (React)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `CLAUDE.md (loyiha ko'rsatmalari)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `Backend: NestJS modulli monolit` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `AuthUser` --references--> `Role`  [EXTRACTED]
  apps/api/src/auth/auth.types.ts → packages/shared/src/index.ts
- `Tenant izolyatsiyasi: center_id + RLS + servis tekshiruvi` --semantically_similar_to--> `Qoida 2: PostgreSQL RLS + servis tekshiruvi`  [INFERRED] [semantically similar]
  CLAUDE.md → ERD-VA-RUXSATLAR.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Billing flow: enrollments, freezes and discounts produce charges** — erd_va_ruxsatlar_enrollments, erd_va_ruxsatlar_enrollment_freezes, erd_va_ruxsatlar_enrollment_discounts, erd_va_ruxsatlar_charges, progress_billing_engine [EXTRACTED 1.00]
- **Effective permission resolution: role template, user exception, scope, guards** — erd_va_ruxsatlar_center_role_permissions, erd_va_ruxsatlar_user_permissions, erd_va_ruxsatlar_permission_scope, erd_va_ruxsatlar_permission_matrix, progress_guard_order [EXTRACTED 1.00]
- **Payment settlement: payments allocated to charges, advance remainder** — erd_va_ruxsatlar_payments, erd_va_ruxsatlar_payment_allocations, erd_va_ruxsatlar_charges, erd_va_ruxsatlar_advance_balance, progress_step_14_payments [EXTRACTED 1.00]

## Communities (80 total, 13 thin omitted)

### Community 0 - "@nestjs/common"
Cohesion: 0.15
Nodes (24): changePasswordSchema, loginSchema, refreshSchema, Roles(), id(), id(), blockCenterSchema, createCenterSchema (+16 more)

### Community 1 - "app.module.ts"
Cohesion: 0.14
Nodes (10): AuthModule, BillingModule, BranchesModule, CoursesModule, EnrollmentsModule, GroupsModule, LessonsModule, PermissionsAdminModule (+2 more)

### Community 2 - "branchScope() (#2)"
Cohesion: 0.10
Nodes (18): clientOf(), GroupsController, AssignTeacherInput, assignTeacherSchema, BILLING_KEYS, billingMode, CreateGroupInput, createGroupSchema (+10 more)

### Community 3 - "EnrollmentsService (#3)"
Cohesion: 0.08
Nodes (20): chunks(), clientOf(), EnrollmentsController, CreateEnrollmentInput, createEnrollmentSchema, LeaveEnrollmentInput, leaveEnrollmentSchema, ListEnrollmentsQuery (+12 more)

### Community 4 - "lessons.schemas.ts"
Cohesion: 0.10
Nodes (14): clientOf(), LessonsController, ATTENDANCE_STATUSES, attendanceQuerySchema, AttendanceStatus, CreateLessonInput, createLessonSchema, ListLessonsQuery (+6 more)

### Community 5 - "inScope() (#5)"
Cohesion: 0.07
Nodes (21): inScope(), clientOf(), UserPasswordController, branchIds, CreateStaffInput, createStaffSchema, ListStaffQuery, listStaffSchema (+13 more)

### Community 6 - "StudentsService (#6)"
Cohesion: 0.10
Nodes (11): clientOf(), StudentsController, birthDate, CreateStudentInput, createStudentSchema, ListStudentsQuery, listStudentsSchema, login (+3 more)

### Community 7 - "BranchesService (#7)"
Cohesion: 0.14
Nodes (10): CurrentUser, BranchesController, clientOf(), id(), CreateBranchInput, createBranchSchema, listBranchesSchema, phone (+2 more)

### Community 8 - "CoursesService (#8)"
Cohesion: 0.11
Nodes (13): clientOf(), CoursesController, CreateCourseInput, createCourseSchema, listCoursesSchema, price, UpdateCourseInput, updateCourseSchema (+5 more)

### Community 9 - "TokenService"
Cohesion: 0.17
Nodes (5): accountInactive(), AuthService, centerBlocked(), invalidRefresh(), TokenService

### Community 10 - "web/package.json (#10)"
Cohesion: 0.06
Nodes (34): eslintConfig, nextConfig, dependencies, next@16.4.6, react@19.3.0, react-dom@19.3.0, devDependencies, eslint@^9 (+26 more)

### Community 11 - "billing.e2e-spec.ts (#11)"
Cohesion: 0.13
Nodes (25): BillingMode, ChargeDraft, ChargeKind, countLessons(), discountFor(), EngineContext, EngineDiscount, EngineEnrollment (+17 more)

### Community 12 - "ChargesService (#12)"
Cohesion: 0.14
Nodes (10): BillingController, clientOf(), cancelChargeSchema, CreateManualChargeInput, createManualChargeSchema, generateBillingSchema, ListChargesQuery, listChargesSchema (+2 more)

### Community 13 - "students.service.ts (#13)"
Cohesion: 0.20
Nodes (14): generateTempPassword(), CreatedCenter, SUPER, generateLogin(), isLoginConflict(), MAX_LOGIN_TRIES, CYRILLIC, slugify() (+6 more)

### Community 14 - "schema.ts (#14)"
Cohesion: 0.15
Nodes (26): AuditEntry, ChargeRow, branchFilter(), BranchScope, todayLocal(), currentTeacher(), groupVisibility(), studentGroupIds() (+18 more)

### Community 15 - "enrollments table (#15)"
Cohesion: 0.16
Nodes (18): Advance (unallocated balance) auto-allocation, Qaror: avans va ko'p oylik to'lov mumkin, To'lov eng eski ochiq charge ga taqsimlanadi, ortiqcha = avans, Event-driven idempotent charge generation, charges table, Chegirma charge yaratilganda qotiriladi, enrollment_discounts table, enrollment_freezes table (+10 more)

### Community 16 - "ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)"
Cohesion: 0.11
Nodes (33): assignments, Filialga bog'lash: OWNER hammasi, ADMIN/CASHIER user_branches, branches table, Markaz boshlang'ich settings (GROUP_CYCLE, grace 0, FULL_MONTH, NONE, uz), courses table, Markaz yaratish POST /admin/centers (bitta tranzaksiya), Ustoz bir nechta filial/guruhda ishlay oladi, ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (+25 more)

### Community 17 - "CLAUDE.md (loyiha ko'rsatmalari) (#17)"
Cohesion: 0.10
Nodes (28): typescript, Byudjet $0, host-agnostik (Docker), CLAUDE.md (loyiha ko'rsatmalari), Hujjatlarni o'qish tartibi, ORM: Drizzle, Qaror ERD dan chetga chiqsa avval hujjatni yangila, ERD hujjati model va ruxsatlar manbasi, Kod grafi graphify-out (+20 more)

### Community 18 - "REJA.md (#18)"
Cohesion: 0.11
Nodes (20): Audit jurnali: kim, nima, qachon, oldingi/keyingi, Auth: argon2, JWT + refresh, 2FA, Raqobatchilar: SchoolupCRM, UstozCRM, ALFA CRM, Umai CRM, Shaxsiy ma'lumotlar qonuni (lokalizatsiya), Birinchi 7 kunda 5 amaliy qadam, Bepul infra cheklovlari (Neon/Supabase, Render, Fly.io), 5-10 rahbar bilan suhbat (birinchi vazifa), Bozor tahlili (raqobatchilar) (+12 more)

### Community 19 - "permissions-admin.controller.ts"
Cohesion: 0.17
Nodes (5): clientOf(), PermissionsAdminController, roleParamSchema, setRolePermissionsSchema, setUserPermissionsSchema

### Community 20 - "Ruxsatlar matritsasi (3-bo'lim)"
Cohesion: 0.12
Nodes (19): Attendance lock rule (attendance_lock_days), attendance_records table, Kassir/admin alohida rol, ruxsat orqali birlashishi mumkin, Dars qulflanishi lessons.locked_at, attendance.edit_past, lessons table, Ruxsatlar matritsasi (3-bo'lim), Belgilar: ✔ ○ – o f, Super admin tenant ichini ko'rmaydi; impersonate hozircha yo'q (+11 more)

### Community 21 - "DbService"
Cohesion: 0.19
Nodes (3): PermissionsService, BillingService, DbService

### Community 22 - "Yaratish va parol qoidalari jadvali (#22)"
Cohesion: 0.09
Nodes (19): Parol: argon2, must_change_password, Auth: JWT access + rotating refresh, Bloklash POST /admin/centers/:id/block, unblock, owner reset-password, Bloklangan markaz: kirish rad etiladi, Center creation flow (POST /admin/centers), Yaratish va parol qoidalari jadvali, Izolyatsiya testi tenant-isolation.e2e-spec.ts, must_change_password=true bilan boshlanadi (+11 more)

### Community 23 - "compilerOptions (#23)"
Cohesion: 0.10
Nodes (20): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+12 more)

### Community 24 - "devDependencies (#24)"
Cohesion: 0.10
Nodes (20): devDependencies, drizzle-kit@^0.31.11, @electric-sql/pglite@^0.5.16, @nestjs/mau@^0.2.6, @nestjs/schematics@^12.0.0, oxlint@^1.58.0, tsx@^4.23.15, @types/express@^5.0.0 (+12 more)

### Community 25 - "enrollments.e2e-spec.ts"
Cohesion: 0.09
Nodes (40): @nestjs/testing@^12.0.1, supertest@^7.0.0, AppModule, hashPassword(), PARAMS, verifyAgainstDummy(), verifyPassword(), APP_CONFIG (+32 more)

### Community 26 - "compilerOptions (#26)"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 27 - "scripts (#27)"
Cohesion: 0.11
Nodes (18): scripts, build, db:create-super-admin, db:generate, db:migrate, db:seed, deploy, format (+10 more)

### Community 28 - "db (#28)"
Cohesion: 0.11
Nodes (17): environment, healthcheck, image, ports, restart, volumes, POSTGRES_DB, POSTGRES_PASSWORD (+9 more)

### Community 29 - ".withContext"
Cohesion: 0.15
Nodes (13): writeAudit(), ClientInfo, audited(), BranchesService, nameTaken(), notFound(), view(), CreateCenterInput (+5 more)

### Community 30 - "centers table (tenant) (#30)"
Cohesion: 0.13
Nodes (17): Qarz saqlanmaydi, charges dan hisoblanadi, centers table (tenant), Trigger centers_guard_platform_columns, Qarzdor: today > due_date + grace_days va charge to'lanmagan, grace_days: markaz sukuti + groups.grace_days, import_jobs, users/centers/branches/plans ga DELETE huquqi yo'q, plans table (SaaS tariffs) (+9 more)

### Community 31 - "scripts (#31)"
Cohesion: 0.12
Nodes (16): engines, node, name, packageManager, private, scripts, build, db:create-super-admin (+8 more)

### Community 32 - "api/package.json"
Cohesion: 0.12
Nodes (15): author, description, @nestjs/cli@^12.0.0, oxlint-tsgolint@^7.0.2001, prettier@^3.4.2, @vitest/coverage-v8@^4.1.2, license, name (+7 more)

### Community 33 - "dependencies (#33)"
Cohesion: 0.12
Nodes (16): dependencies, drizzle-orm@^0.45.4, @erp/shared@workspace:*, @nestjs/common@^12.0.1, @nestjs/jwt@^12.0.5, @nestjs/platform-express@^12.0.1, @node-rs/argon2@^2.2.2, reflect-metadata@^0.2.2 (+8 more)

### Community 34 - "auth.types.ts"
Cohesion: 0.09
Nodes (26): AccessClaims, AuthedRequest, UserRow, ALLOW_MUST_CHANGE, IS_PUBLIC, PERMISSIONS_KEY, ROLES_KEY, centerRolePermissions (+18 more)

### Community 35 - "index.ts (#35)"
Cohesion: 0.25
Nodes (6): postgres@^4.1.1, client, permissions, client, db, postgres

### Community 36 - "Skelet maqsadi: super admin markaz ochad (#36)"
Cohesion: 0.23
Nodes (14): Skelet 1: Monorepo, Docker Compose, .env.example (tayyor), Skelet 2: Migratsiyalar 10 jadval (tayyor), Skelet 3: Auth login, JWT+refresh, guard (tayyor), Skelet 4: RLS va tenant izolyatsiya testi (tayyor), Skelet 5: Super admin markaz yaratish/bloklash (tayyor), Skelet 6: Rahbar filial va xodim yaratish, ruxsat sozlash (keyingi), Skelet 7: Audit jurnali va ruxsat matritsasi testi (kutmoqda), Skelet maqsadi: super admin markaz ochadi, rahbar kiradi, filial va xodim yaratadi (+6 more)

### Community 38 - "permissions table (code catalog) (#38)"
Cohesion: 0.21
Nodes (13): Ruxsatlar: rol + center_role_permissions + user_permissions, scope so'rov filtri, center_role_permissions (role template), Samarali ruxsat = rol shabloni ± user istisnosi, permissions pnpm db:seed orqali @erp/shared dan, Permissions matrix (checkmark / optional / never), Permission scopes (center, branch, own group, own record), permissions table (code catalog), Qoida 8: Ruxsat = rol + markaz sozlamasi + foydalanuvchi istisnosi (+5 more)

### Community 39 - "attendance-lock.e2e-spec.ts (#39)"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), Row (+2 more)

### Community 40 - "shared/package.json (#40)"
Cohesion: 0.18
Nodes (11): devDependencies, typescript@^5.9.3, typescript, main, name, private, scripts, build (+3 more)

### Community 41 - "attendance.e2e-spec.ts (#41)"
Cohesion: 0.33
Nodes (9): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+1 more)

### Community 42 - "compilerOptions (#42)"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, esModuleInterop, module, outDir, rootDir, skipLibCheck, strict (+2 more)

### Community 43 - "tenant-isolation.e2e-spec.ts (#43)"
Cohesion: 0.20
Nodes (10): LoginResult, SessionRow, TokenPair, contextOf(), NO_CONTEXT, TenantContext, rowsOf(), Fixture (+2 more)

### Community 44 - "activate"
Cohesion: 0.60
Nodes (5): activate(), makeApi(), mkStudent(), newCenter(), staff()

### Community 46 - "payments table (#46)"
Cohesion: 0.28
Nodes (8): To'lov, maosh to'lovi, audit append-only, audit_logs (append-only), audit_logs UPDATE/DELETE/TRUNCATE triggerlar bilan bloklangan, payments table, Matritsa 3.4 Moliya, Qaytarish: status=REVERSED va reverses_payment_id, Qoida 3: Pul append-only, teskari yozuv, Step 7: GET /audit and permission matrix test

### Community 47 - "groups.e2e-spec.ts (#47)"
Cohesion: 0.33
Nodes (8): activate(), Api, Center, config, makeApi(), newCenter(), staff(), student()

### Community 48 - ".oxlintrc.json (#48)"
Cohesion: 0.29
Nodes (6): env, node, rules, typescript/no-explicit-any, typescript/no-floating-promises, $schema

### Community 49 - "main.ts (#49)"
Cohesion: 0.29
Nodes (3): @nestjs/core@^12.0.1, envFile, @nestjs/core

### Community 50 - "RequirePermission"
Cohesion: 0.13
Nodes (5): RequirePermission(), CentersController, clientOf(), ProbeController, ProbeController

### Community 51 - "AuthUser"
Cohesion: 0.21
Nodes (9): AuthUser, AttendanceQuery, bad(), conflict(), forbidden(), groupNotFound(), lessonNotFound(), LessonsService (+1 more)

### Community 52 - "tsconfig.build.json (#52)"
Cohesion: 0.29
Nodes (6): compilerOptions, rootDir, exclude, extends, include, ./tsconfig.json

### Community 53 - "Tx"
Cohesion: 0.17
Nodes (7): AllocatorService, audited(), forbidden(), paymentNotFound(), PaymentsService, studentNotFound(), Tx

### Community 54 - "nest-cli.json (#54)"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 56 - "allowBuilds (#56)"
Cohesion: 0.40
Nodes (4): allowBuilds, sharp, unrs-resolver, packages

### Community 58 - "branchScope"
Cohesion: 0.26
Nodes (8): branchScope(), ScheduleItem, bad(), conflict(), escapeLike(), forbidden(), groupNotFound(), GroupsService

### Community 59 - "payments.controller.ts"
Cohesion: 0.14
Nodes (9): clientOf(), id(), PaymentsController, CreatePaymentInput, createPaymentSchema, ListPaymentsQuery, listPaymentsSchema, note (+1 more)

### Community 61 - "StudentsService"
Cohesion: 0.26
Nodes (5): branchNotFound(), escapeLike(), forbidden(), notFound(), StudentsService

### Community 62 - "GROUP_CYCLE billing mode"
Cohesion: 0.13
Nodes (20): Ikki to'lov rejimi GROUP_CYCLE / STUDENT_CYCLE, Accepted decisions and resolved questions, Ikki to'lov sikli taqqoslash jadvali, GROUP_CYCLE billing mode, join_proration setting (FULL_MONTH, REMAINING_LESSONS), Oy oxiri: 29-31 kun oyning oxirgi kuniga siljiydi, Reyting agregatsiya orqali, alohida jadval yo'q, rating_points (event-based rating) (+12 more)

### Community 63 - "schema.ts"
Cohesion: 0.22
Nodes (14): GenerateOptions, PaymentRow, centers, charges, createdAt(), enrollmentDiscounts, enrollmentFreezes, enrollments (+6 more)

### Community 64 - ".hasIn"
Cohesion: 0.31
Nodes (4): audited(), chargeNotFound(), ChargesService, forbidden()

### Community 65 - ".changePassword"
Cohesion: 0.30
Nodes (4): AuthController, clientOf(), AllowMustChangePassword(), Public()

### Community 66 - "billing.e2e-spec.ts"
Cohesion: 0.22
Nodes (13): activate(), Api, Center, ChargeView, config, daysAgo(), Group, makeApi() (+5 more)

### Community 67 - "JwtAuthGuard"
Cohesion: 0.18
Nodes (4): JwtAuthGuard, PermissionsGuard, RolesGuard, unauthorized()

### Community 68 - "PermissionsAdminService"
Cohesion: 0.32
Nodes (3): assertConfigurable(), PermissionsAdminService, TenantRole

### Community 70 - "payments.e2e-spec.ts"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, ChargeView, config, makeApi(), mkStudent(), newCenter() (+2 more)

### Community 72 - "audit.controller.ts"
Cohesion: 0.25
Nodes (6): listAuditSchema, client, db, login, auditLogs, users

### Community 74 - "Qabul qilingan qarorlar va ochiq savollar (6-bo'lim)"
Cohesion: 0.29
Nodes (8): Bir o'quvchi bitta akkaunt, turli filial guruhlarida, Maosh qoidalari faqat rahbarda, O'quvchi filial reytingini to'liq ism bilan ko'radi, Ustoz moliyani ko'rmaydi (○: faqat qarz bor/yo'q), Qabul qilingan qarorlar va ochiq savollar (6-bo'lim), Ochiq savol: markaz reytingida boshqa filial ismlari ko'rinsinmi, Reyting: guruh, filial, markaz; oylik va umumiy, Rol TEACHER (ustoz)

## Knowledge Gaps
- **45 isolated node(s):** `./tsconfig.json`, `Qaror: avans va ko'p oylik to'lov mumkin`, `Oy oxiri: 29-31 kun oyning oxirgi kuniga siljiydi`, `O'quvchini ko'chirish: eski enrollments yopiladi, yangisi ochiladi`, `Filialga bog'lash: OWNER hammasi, ADMIN/CASHIER user_branches` (+40 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 383 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CLAUDE.md (loyiha ko'rsatmalari)` connect `CLAUDE.md (loyiha ko'rsatmalari) (#17)` to `Skelet maqsadi: super admin markaz ochad (#36)`, `permissions table (code catalog) (#38)`, `payments table (#46)`, `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)`, `REJA.md (#18)`, `Yaratish va parol qoidalari jadvali (#22)`, `centers table (tenant) (#30)`, `GROUP_CYCLE billing mode`?**
  _High betweenness centrality (0.254) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `Qaror: avans va ko'p oylik to'lov mumkin`, `Oy oxiri: 29-31 kun oyning oxirgi kuniga siljiydi` to the rest of the system?**
  _45 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `@nestjs/common` be split into smaller, more focused modules?**
  _Cohesion score 0.14979757085020243 - nodes in this community are weakly interconnected._
- **Why does `typescript` connect `CLAUDE.md (loyiha ko'rsatmalari) (#17)` to `api/package.json`, `devDependencies (#24)`?**
  _High betweenness centrality (0.251) - this node is a cross-community bridge._
- **Should `app.module.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13793103448275862 - nodes in this community are weakly interconnected._
- **Why does `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)` connect `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)` to `Skelet maqsadi: super admin markaz ochad (#36)`, `permissions table (code catalog) (#38)`, `Qabul qilingan qarorlar va ochiq savollar (6-bo'lim)`, `payments table (#46)`, `enrollments table (#15)`, `CLAUDE.md (loyiha ko'rsatmalari) (#17)`, `REJA.md (#18)`, `Ruxsatlar matritsasi (3-bo'lim)`, `Yaratish va parol qoidalari jadvali (#22)`, `GROUP_CYCLE billing mode`, `centers table (tenant) (#30)`?**
  _High betweenness centrality (0.200) - this node is a cross-community bridge._
- **Should `branchScope() (#2)` be split into smaller, more focused modules?**
  _Cohesion score 0.09851551956815115 - nodes in this community are weakly interconnected._