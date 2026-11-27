# Graph Report - ERP  (2026-11-27)

## Corpus Check
- 331 files · ~208,027 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 18 file(s) not represented in the graph (top: (none) 10, .css 4, .example 2)

## Summary
- 3217 nodes · 11012 edges · 148 communities (129 shown, 19 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 503 edges (avg confidence: 0.84)
- Token cost: 256,812 input · 0 output

## Graph Freshness
- Built from commit: `ae8cd72f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Skeleton
- Vazifalar xizmati va DB sxemasi
- LessonsService
- centers.service.ts
- group-card.tsx
- load-seed.mjs
- audit-page.tsx
- .resetOwnerPassword
- reports.service.ts
- ClientInfo
- @nestjs/common
- .update
- imports.e2e-spec.ts
- Button
- academic.e2e-spec.ts
- payroll.controller.ts
- ci.yml
- devDependencies
- Deploy va progress hujjatlari
- [...path]/route.ts
- .update
- CurrentUser
- DataView
- pg-local.ts
- messages.ts
- ERD va ruxsatlar matritsasi
- notifications.e2e-spec.ts
- .update
- global-setup.ts
- CoursesService
- DbService
- Spreadsheet o'quvchi
- payments.controller.ts
- with
- Xodimlar API
- CLAUDE.md qoidalari
- i18n-wrap.mjs
- dates.ts
- discounts.controller.ts
- Hisoblar API
- .hasIn
- REJA: bozor va mahsulot
- ERD: moliya modeli
- react
- useApi
- Web package bog'liqliklari
- TokenService
- payments.service.ts
- steps
- Roles
- payroll-engine.ts
- AuthUser
- StudentsService
- API tsconfig
- Demo seed skripti
- API skriptlari
- env
- billing.controller.ts
- Web tsconfig
- Dev docker-compose
- API bog'liqliklari
- Smoke test skripti
- Root package.json
- PROGRESS: arxitektura qarorlari
- FinanceController
- lessons.schemas.ts
- postgres
- ERD: implementatsiya eslatmalari
- groups.controller.ts
- Shared paket
- .changePassword
- Deploy variantlari
- e2e-browser
- .generate
- Prod docker-compose
- users.service.ts
- .withContext
- .run
- test
- Kichik klaster 79
- student-import.ts
- api/package.json
- shell.tsx
- i18n-check.mjs
- start.mjs
- groups.e2e-spec.ts
- Kichik klaster 86
- Kichik klaster 87
- services
- Kichik klaster 89
- assignment-card.tsx
- Kichik klaster 91
- Kichik klaster 92
- Kichik klaster 93
- Kichik klaster 94
- Kichik klaster 95
- on
- Brauzer e2e (Playwright)
- academic.controller.ts
- Kichik klaster 99
- ExpensesService
- app/layout.tsx
- Kichik klaster 102
- Kichik klaster 103
- Kichik klaster 104
- source-map-support@^0.5.21
- Kichik klaster 106
- StudentsController
- build
- Kichik klaster 109
- Kichik klaster 110
- Kichik klaster 115
- i18n.ts
- attendance-lock.e2e-spec.ts
- BranchesService
- .setRole
- dispatch.service.ts
- load-bench.mjs
- app-config.ts
- attendance.e2e-spec.ts
- centers.e2e-spec.ts
- .withContext
- PayrollRulesService
- RequirePermission
- payroll.e2e-spec.ts
- oxlint-tsgolint@^7.0.2001
- globe.tsx
- @types/supertest@^7.0.0
- reports.e2e-spec.ts
- .events
- settings-plans.e2e-spec.ts
- discounts-debtors.e2e-spec.ts
- finance.e2e-spec.ts
- payments.e2e-spec.ts
- students.schemas.ts
- enrollments.e2e-spec.ts
- translit.ts
- branches.schemas.ts
- ProbeController
- main.ts
- HttpTelegramSender
- i18n-en.ts
- prettier@^3.4.2
- typescript@^6.0.2

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 362 edges
2. `useT()` - 170 edges
3. `CurrentUser` - 147 edges
4. `Skeleton()` - 128 edges
5. `Tx` - 119 edges
6. `ClientInfo` - 118 edges
7. `@nestjs/common` - 108 edges
8. `Button()` - 100 edges
9. `useApi()` - 91 edges
10. `writeAudit()` - 83 edges

## Surprising Connections (you probably didn't know these)
- `Frontend: Next.js (React)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → packages/shared/package.json
- `CLAUDE.md (loyiha ko'rsatmalari)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → packages/shared/package.json
- `Backend: NestJS modulli monolit` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → packages/shared/package.json
- `AuthUser` --references--> `Role`  [EXTRACTED]
  apps/api/src/auth/auth.types.ts → packages/shared/src/index.ts
- `To'lov tizimlari: Payme, Click, Uzum` --references--> `payments table`  [INFERRED]
  REJA.md → ERD-VA-RUXSATLAR.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Effective permission model (template + exceptions + scope + guards)** — erd_va_ruxsatlar_center_role_permissions, erd_va_ruxsatlar_user_permissions, erd_va_ruxsatlar_scope_filter, erd_va_ruxsatlar_guard_chain, packages_shared_src_permission_matrix, erd_va_ruxsatlar_permission_matrix [EXTRACTED 1.00]
- **Billing and payment ledger flow** — erd_va_ruxsatlar_charge_generation, erd_va_ruxsatlar_charges, erd_va_ruxsatlar_payments, erd_va_ruxsatlar_payment_allocations, erd_va_ruxsatlar_payment_reversal, erd_va_ruxsatlar_debt_computed_not_stored [EXTRACTED 1.00]
- **Authentication and request security** — progress_auth_jwt_refresh, progress_guard_chain, progress_login_throttle_db, progress_bff_architecture [INFERRED 0.85]
- **Tenant isolation mechanisms** — erd_va_ruxsatlar_rls_tenant_isolation, erd_va_ruxsatlar_cross_center_composite_fk, erd_va_ruxsatlar_security_definer_auth_functions, erd_va_ruxsatlar_centers_guard_platform_columns, apps_api_test_tenant_isolation_e2e_spec [INFERRED 0.85]
- **Billing -> payments -> debt money flow** — progress_billing_engine_plancharges, progress_fifo_allocator, progress_debt_computation, progress_append_only_ledger [INFERRED 0.85]
- **Tenant isolation mechanisms** — progress_rls_tenant_context, progress_composite_fk_pattern, progress_security_definer_functions, progress_branch_scope_helper [INFERRED 0.85]

## Communities (148 total, 19 thin omitted)

### Community 0 - "Skeleton"
Cohesion: 0.03
Nodes (98): LoginForm(), LoginPage(), metadata, instant, metadata, Page(), instant, metadata (+90 more)

### Community 1 - "Vazifalar xizmati va DB sxemasi"
Cohesion: 0.08
Nodes (78): AssignmentRow, homeworkPoints(), SubmissionRow, ATTENDANCE_POINTS, RankRow, TZ, AuditEntry, writeAudit() (+70 more)

### Community 2 - "LessonsService"
Cohesion: 0.21
Nodes (9): branchScope(), AttendanceQuery, bad(), conflict(), forbidden(), groupNotFound(), lessonNotFound(), LessonsService (+1 more)

### Community 3 - "centers.service.ts"
Cohesion: 0.06
Nodes (35): hashPassword(), PARAMS, verifyAgainstDummy(), verifyPassword(), CreateCenterInput, ListCentersQuery, UpdateCenterInput, CreatedCenter (+27 more)

### Community 4 - "group-card.tsx"
Cohesion: 0.17
Nodes (20): GroupsList(), instant, metadata, Page(), AttStatus, BILLING_MODE, Group, GROUP_STATUS (+12 more)

### Community 5 - "load-seed.mjs"
Cohesion: 0.10
Nodes (21): addDays(), API, BRANCHES, byGroup, CONC, GROUPS_PER_BRANCH, lessonDays, lessons (+13 more)

### Community 6 - "audit-page.tsx"
Cohesion: 0.29
Nodes (8): AuditPage(), AuditRow, dayEnd(), dayStart(), ENTITY, instant, metadata, Page()

### Community 8 - "reports.service.ts"
Cohesion: 0.10
Nodes (20): daysBetween(), toMs(), category, CreateExpenseInput, createExpenseSchema, ListExpensesQuery, listExpensesSchema, MAX_REPORT_DAYS (+12 more)

### Community 9 - "ClientInfo"
Cohesion: 0.10
Nodes (47): uuid(), listAuditSchema, changePasswordSchema, loginSchema, refreshSchema, ClientInfo, LoginResult, AccessClaims (+39 more)

### Community 10 - "@nestjs/common"
Cohesion: 0.05
Nodes (23): AcademicModule, AppController, AppService, AuditModule, AuthModule, BillingModule, DebtorsService, BranchesModule (+15 more)

### Community 11 - ".update"
Cohesion: 0.15
Nodes (4): CenterSettingsController, clientOf(), CenterSettingsService, effectiveSettings()

### Community 12 - "imports.e2e-spec.ts"
Cohesion: 0.15
Nodes (14): activate(), Api, Center, config, HEADER, makeApi(), newCenter(), staff() (+6 more)

### Community 13 - "Button"
Cohesion: 0.19
Nodes (55): CreateCenter, EditCenter, PlanDialog, AssignmentDialog, GradeDialog, BranchDialog, CourseDialog, DebtorsPage() (+47 more)

### Community 14 - "academic.e2e-spec.ts"
Cohesion: 0.23
Nodes (12): activate(), Api, Center, config, FUTURE, makeApi(), mkStudent(), newCenter() (+4 more)

### Community 15 - "payroll.controller.ts"
Cohesion: 0.09
Nodes (21): clientOf(), PayrollController, CreateAdjustmentInput, createAdjustmentSchema, CreatePayoutInput, createPayoutSchema, CreateRuleInput, createRuleSchema (+13 more)

### Community 16 - "ci.yml"
Cohesion: 0.17
Nodes (11): concurrency, cancel-in-progress, group, needs, runs-on, timeout-minutes, jobs, docker (+3 more)

### Community 17 - "devDependencies"
Cohesion: 0.10
Nodes (19): devDependencies, drizzle-kit@^0.31.11, @electric-sql/pglite@^0.5.16, embedded-postgres@17.11.0-beta.19, @nestjs/cli@^12.0.0, @nestjs/mau@^0.2.6, @nestjs/schematics@^12.0.0, @types/express@^5.0.0 (+11 more)

### Community 18 - "Deploy va progress hujjatlari"
Cohesion: 0.05
Nodes (38): Daily pg_dump backup and restore testing, DEPLOY.md deploy guide, Environment variables (DATABASE_URL, JWT secrets, TRUST_PROXY, CRON_SECRET, API_URL...), Local development (pg:local, db:migrate, dev:api, dev:web), Option 2: Neon + container hosting, First super admin bootstrap (create-super-admin.js), Telegram bot setup (BotFather, setWebhook with secret_token), Topology: Caddy -> web:3000 -> api:3001 -> db:5432 (+30 more)

### Community 19 - "[...path]/route.ts"
Cohesion: 0.15
Nodes (25): POST(), POST(), BLOCKED, DELETE, GET, handle(), PASS_RESPONSE_HEADERS, PATCH (+17 more)

### Community 21 - "CurrentUser"
Cohesion: 0.26
Nodes (3): AcademicController, clientOf(), CurrentUser

### Community 22 - "DataView"
Cohesion: 0.09
Nodes (61): MODULES, Dashboard(), DeskView(), Greeting(), TeacherView(), Branches(), BranchRow, BranchTable() (+53 more)

### Community 23 - "pg-local.ts"
Cohesion: 0.14
Nodes (8): dataDir, ensureRolesAndDb(), PG_LOCAL, startLocalPg(), superUrl(), [cmd = 'info', arg], COMMANDS, envFile

### Community 24 - "messages.ts"
Cohesion: 0.06
Nodes (19): badCodeMessage(), debtMessage(), formatSom(), hashLinkCode(), helpMessage(), homeworkMessage(), lessonMessage(), LINK_CODE_LENGTH (+11 more)

### Community 25 - "ERD va ruxsatlar matritsasi"
Cohesion: 0.17
Nodes (8): ERD va ruxsatlar matritsasi, centers table, centers_guard_platform_columns trigger, Permission matrix (roles x permission codes), Accepted decisions and resolved questions, Six fixed roles (SUPER_ADMIN, OWNER, ADMIN, CASHIER, TEACHER, STUDENT), Telegram bot and notifications (step 21), REJA.md

### Community 26 - "notifications.e2e-spec.ts"
Cohesion: 0.13
Nodes (16): call(), login(), rootToken(), SendResult, activate(), Api, Center, config (+8 more)

### Community 27 - ".update"
Cohesion: 0.10
Nodes (13): clientOf(), PlansController, CreatePlanInput, createPlanSchema, features, limit, UpdatePlanInput, updatePlanSchema (+5 more)

### Community 28 - "global-setup.ts"
Cohesion: 0.24
Nodes (12): firstSignIn(), signedIn(), signIn(), API, call(), DATA_FILE, E2EData, globalSetup() (+4 more)

### Community 29 - "CoursesService"
Cohesion: 0.11
Nodes (13): clientOf(), CoursesController, CreateCourseInput, createCourseSchema, listCoursesSchema, price, UpdateCourseInput, updateCourseSchema (+5 more)

### Community 30 - "DbService"
Cohesion: 0.10
Nodes (4): AuditController, PermissionsService, BillingService, DbService

### Community 31 - "Spreadsheet o'quvchi"
Cohesion: 0.12
Nodes (26): attrs(), BUILTIN_DATE_FMTS, colIndex(), corrupt(), dateStyles(), decode(), ENTITIES, excelSerialToIso() (+18 more)

### Community 32 - "payments.controller.ts"
Cohesion: 0.13
Nodes (8): clientOf(), PaymentsController, CreatePaymentInput, createPaymentSchema, ListPaymentsQuery, listPaymentsSchema, note, reversePaymentSchema

### Community 33 - "with"
Cohesion: 0.15
Nodes (13): with, cache, cache-from, cache-to, context, file, name, node-version (+5 more)

### Community 34 - "Xodimlar API"
Cohesion: 0.10
Nodes (11): clientOf(), StaffController, UserPasswordController, branchIds, createStaffSchema, listStaffSchema, login, phone (+3 more)

### Community 35 - "CLAUDE.md qoidalari"
Cohesion: 0.09
Nodes (30): To'lov, maosh to'lovi, audit append-only, Byudjet $0, host-agnostik (Docker), Qarz saqlanmaydi, charges dan hisoblanadi, CLAUDE.md (loyiha ko'rsatmalari), Hujjatlarni o'qish tartibi, ORM: Drizzle, Qaror ERD dan chetga chiqsa avval hujjatni yangila, ERD hujjati model va ruxsatlar manbasi (+22 more)

### Community 36 - "i18n-wrap.mjs"
Cohesion: 0.10
Nodes (12): files, require, SKIP_ATTR, SKIP_CALL, ts, args, ATTRS, dry (+4 more)

### Community 37 - "dates.ts"
Cohesion: 0.09
Nodes (37): BillingMode, ChargeDraft, ChargeKind, countLessons(), discountFor(), EngineContext, EngineDiscount, EngineEnrollment (+29 more)

### Community 38 - "discounts.controller.ts"
Cohesion: 0.10
Nodes (13): clientOf(), DiscountsController, CreateDiscountInput, createDiscountSchema, endDiscountSchema, listDebtorsSchema, reason, audited() (+5 more)

### Community 39 - "Hisoblar API"
Cohesion: 0.34
Nodes (4): audited(), chargeNotFound(), ChargesService, forbidden()

### Community 40 - ".hasIn"
Cohesion: 0.19
Nodes (10): audited(), forbidden(), payoutNotFound(), PayoutsService, ListPeriodsQuery, forbidden(), locked(), PayrollService (+2 more)

### Community 41 - "REJA: bozor va mahsulot"
Cohesion: 0.09
Nodes (24): Audit jurnali: kim, nima, qachon, oldingi/keyingi, Auth: argon2, JWT + refresh, 2FA, Raqobatchilar: SchoolupCRM, UstozCRM, ALFA CRM, Umai CRM, Shaxsiy ma'lumotlar qonuni (lokalizatsiya), Tashkilot > filial > guruh > o'quvchi, Birinchi 7 kunda 5 amaliy qadam, Bepul infra cheklovlari (Neon/Supabase, Render, Fly.io), 5-10 rahbar bilan suhbat (birinchi vazifa) (+16 more)

### Community 42 - "ERD: moliya modeli"
Cohesion: 0.11
Nodes (21): audit_logs table, charges table, ERD: charges, payments, allocations, expenses, ERD: payroll, notifications, import, expenses table (ACTIVE->VOIDED), Cash-basis finance report (step 17), grace_days (center default copied into group), Student Excel import (import_jobs, step 19) (+13 more)

### Community 43 - "react"
Cohesion: 0.07
Nodes (42): instant, metadata, Page(), limit(), Plan, PlansPage(), Debtor, ERR (+34 more)

### Community 44 - "useApi"
Cohesion: 0.10
Nodes (73): Center, CentersPage(), Plan, STATUS, AssignmentsPage(), AttendancePage(), Row, Summary (+65 more)

### Community 45 - "Web package bog'liqliklari"
Cohesion: 0.06
Nodes (36): eslintConfig, dependencies, next@16.4.6, react@19.3.0, react-dom@19.3.0, devDependencies, eslint@^9, eslint-config-next@16.4.6 (+28 more)

### Community 46 - "TokenService"
Cohesion: 0.07
Nodes (15): accountInactive(), centerBlocked(), invalidCredentials(), invalidRefresh(), ALLOW_MUST_CHANGE, IS_PUBLIC, PERMISSIONS_KEY, ROLES_KEY (+7 more)

### Community 47 - "payments.service.ts"
Cohesion: 0.18
Nodes (6): AllocatorService, audited(), forbidden(), paymentNotFound(), PaymentsService, studentNotFound()

### Community 48 - "steps"
Cohesion: 0.29
Nodes (10): steps, steps, PGPASSWORD, TEST_DATABASE_URL, env, if, name, run (+2 more)

### Community 49 - "Roles"
Cohesion: 0.16
Nodes (6): Roles(), clientOf(), NotificationsController, safeEqual(), listNotificationsSchema, runSchema

### Community 50 - "payroll-engine.ts"
Cohesion: 0.16
Nodes (17): attachedGroups(), Attachment, EngineRule, fmt(), GroupBase, LessonCount, monthEndOf(), monthStartOf() (+9 more)

### Community 51 - "AuthUser"
Cohesion: 0.20
Nodes (7): AssignmentsService, conflict(), forbidden(), isLate(), notFound(), AuthService, AuthUser

### Community 52 - "StudentsService"
Cohesion: 0.26
Nodes (5): branchNotFound(), escapeLike(), forbidden(), notFound(), StudentsService

### Community 53 - "API tsconfig"
Cohesion: 0.10
Nodes (20): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+12 more)

### Community 54 - "Demo seed skripti"
Cohesion: 0.12
Nodes (16): activate(), call(), femaleish, first, groups, groupsDef, last, logins (+8 more)

### Community 55 - "API skriptlari"
Cohesion: 0.10
Nodes (20): scripts, build, db:create-super-admin, db:generate, db:migrate, db:seed, deploy, format (+12 more)

### Community 56 - "env"
Cohesion: 0.20
Nodes (10): env, API_PORT, DATABASE_MIGRATION_URL, DATABASE_URL, E2E_API_URL, E2E_BASE_URL, E2E_ROOT_LOGIN, E2E_ROOT_PASSWORD (+2 more)

### Community 57 - "billing.controller.ts"
Cohesion: 0.13
Nodes (10): BillingController, clientOf(), cancelChargeSchema, CreateManualChargeInput, createManualChargeSchema, generateBillingSchema, ListChargesQuery, listChargesSchema (+2 more)

### Community 58 - "Web tsconfig"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 59 - "Dev docker-compose"
Cohesion: 0.11
Nodes (17): environment, healthcheck, image, ports, restart, volumes, POSTGRES_DB, POSTGRES_PASSWORD (+9 more)

### Community 60 - "API bog'liqliklari"
Cohesion: 0.14
Nodes (14): dependencies, drizzle-orm@^0.45.4, @erp/shared@workspace:*, @nestjs/common@^12.0.1, @nestjs/jwt@^12.0.5, @node-rs/argon2@^2.2.2, postgres@^4.1.1, reflect-metadata@^0.2.2 (+6 more)

### Community 61 - "Smoke test skripti"
Cohesion: 0.12
Nodes (14): branch, c, charges, course, enr, first, group, lesson (+6 more)

### Community 62 - "Root package.json"
Cohesion: 0.12
Nodes (16): engines, node, name, packageManager, private, scripts, build, db:create-super-admin (+8 more)

### Community 63 - "PROGRESS: arxitektura qarorlari"
Cohesion: 0.13
Nodes (16): Billing engine planCharges() pure function, Debt computed from open charges past due_date + grace_days, Effective permission = user_permissions override > center_role_permissions > deny, FIFO payment allocator with advance balance, Guard chain JwtAuthGuard -> RolesGuard -> PermissionsGuard, Payroll engine (FIXED, PER_GROUP, PER_LESSON, PERCENT), Permission matrix in packages/shared/src/permission-matrix.ts, Step 13: billing charges and enrollment_freezes (+8 more)

### Community 65 - "lessons.schemas.ts"
Cohesion: 0.11
Nodes (14): clientOf(), LessonsController, ATTENDANCE_STATUSES, attendanceQuerySchema, AttendanceStatus, CreateLessonInput, createLessonSchema, ListLessonsQuery (+6 more)

### Community 66 - "postgres"
Cohesion: 0.22
Nodes (9): services, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, env, image, options, ports (+1 more)

### Community 67 - "ERD: implementatsiya eslatmalari"
Cohesion: 0.15
Nodes (13): GET /auth/me effective permissions for UI, Center blocking/unblocking, Center creation POST /admin/centers (single transaction), center_role_permissions (role template), ERD: tenant, branch, users, permissions, Guard order JWT -> @Roles -> @RequirePermission (@Public opt-out), JWT + rotating refresh token auth, Permission check layer (code + scope + effective permission) (+5 more)

### Community 68 - "groups.controller.ts"
Cohesion: 0.09
Nodes (25): clientOf(), GroupsController, AssignTeacherInput, assignTeacherSchema, BILLING_KEYS, billingMode, CreateGroupInput, createGroupSchema (+17 more)

### Community 69 - "Shared paket"
Cohesion: 0.18
Nodes (10): devDependencies, typescript@^5.9.3, main, name, private, scripts, build, test (+2 more)

### Community 70 - ".changePassword"
Cohesion: 0.35
Nodes (3): AuthController, clientOf(), AllowMustChangePassword()

### Community 71 - "Deploy variantlari"
Cohesion: 0.14
Nodes (12): 1-variant: bitta VPS + Docker Compose (tavsiya), 2-variant: boshqariladigan xizmatlar (Neon + konteyner hosting), Avtomatik eslatmalar (cron), Deploy qo'llanmasi, Lokal ishlab chiqish, Muhit o'zgaruvchilari, Tekshirish, Telegram bot (+4 more)

### Community 72 - "e2e-browser"
Cohesion: 0.50
Nodes (4): needs, runs-on, timeout-minutes, e2e-browser

### Community 73 - ".generate"
Cohesion: 0.06
Nodes (25): chunks(), clientOf(), EnrollmentsController, CreateEnrollmentInput, createEnrollmentSchema, LeaveEnrollmentInput, leaveEnrollmentSchema, ListEnrollmentsQuery (+17 more)

### Community 74 - "Prod docker-compose"
Cohesion: 0.22
Nodes (9): condition, api, API_URL, WEB_SECURE_COOKIES, web, depends_on, environment, image (+1 more)

### Community 75 - "users.service.ts"
Cohesion: 0.13
Nodes (18): generateTempPassword(), generateLogin(), isLoginConflict(), MAX_LOGIN_TRIES, CYRILLIC, slugify(), teacherProfiles, CreateStaffInput (+10 more)

### Community 76 - ".withContext"
Cohesion: 0.13
Nodes (5): CentersService, inCenter(), notFound(), assertConfigurable(), PermissionsAdminService

### Community 77 - ".run"
Cohesion: 0.09
Nodes (13): clientOf(), ImportsController, flag, ListImportsQuery, listImportsSchema, RunImportInput, runImportSchema, UploadedFile (+5 more)

### Community 78 - "test"
Cohesion: 0.50
Nodes (4): test, runs-on, services, timeout-minutes

### Community 79 - "Kichik klaster 79"
Cohesion: 0.14
Nodes (14): environment, CRON_SECRET, DATABASE_URL, JWT_ACCESS_SECRET, JWT_ACCESS_TTL, JWT_REFRESH_SECRET, JWT_REFRESH_TTL, NODE_ENV (+6 more)

### Community 80 - "student-import.ts"
Cohesion: 0.24
Nodes (11): ALIASES, HeaderMap, LOOKUP, mapHeader(), MAX_IMPORT_ROWS, norm(), parseDate(), parseRow() (+3 more)

### Community 81 - "api/package.json"
Cohesion: 0.12
Nodes (15): author, description, oxlint@^1.58.0, tsx@^4.23.15, vite@^8.0.0, vitest@^4.1.2, vitest, license (+7 more)

### Community 82 - "shell.tsx"
Cohesion: 0.12
Nodes (24): instant, PanelLayout(), Account(), BRAND, FootCard(), initials(), isActive(), ROLE_SCOPE (+16 more)

### Community 83 - "i18n-check.mjs"
Cohesion: 0.15
Nodes (9): csp, nextConfig, securityHeaders, dict, files, keys, missing, root (+1 more)

### Community 84 - "start.mjs"
Cohesion: 0.12
Nodes (14): api, API_DIR, apiEnv, die(), ensureAppRole(), log(), PORT, proxy (+6 more)

### Community 85 - "groups.e2e-spec.ts"
Cohesion: 0.11
Nodes (24): @nestjs/testing@^12.0.1, supertest@^7.0.0, AppModule, DB_OPTIONS, activate(), Api, Center, config (+16 more)

### Community 86 - "Kichik klaster 86"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, esModuleInterop, module, outDir, rootDir, skipLibCheck, strict (+2 more)

### Community 87 - "Kichik klaster 87"
Cohesion: 0.18
Nodes (10): allowBuilds, @embedded-postgres/darwin-arm64, @embedded-postgres/darwin-x64, @embedded-postgres/linux-arm64, @embedded-postgres/linux-x64, @embedded-postgres/windows-x64, esbuild, sharp (+2 more)

### Community 88 - "services"
Cohesion: 0.12
Nodes (15): generateValue, key, sync, value, services, autoDeploy, dockerContext, dockerfilePath (+7 more)

### Community 89 - "Kichik klaster 89"
Cohesion: 0.15
Nodes (14): Ikki to'lov rejimi GROUP_CYCLE / STUDENT_CYCLE, Attendance lesson lock (attendance_lock_days, edit_past), enrollments table, ERD: groups, enrollments, attendance, homework, rating, Homework and rating rules (step 20), join_proration setting (FULL_MONTH / REMAINING_LESSONS), rating_points event table, Center settings, plans, lesson lock, login throttle (step 22) (+6 more)

### Community 90 - "assignment-card.tsx"
Cohesion: 0.29
Nodes (12): AssignmentCard(), MySubmission(), Submissions(), instant, metadata, Page(), Assignment, LinkItem (+4 more)

### Community 91 - "Kichik klaster 91"
Cohesion: 0.22
Nodes (9): condition, db, DATABASE_MIGRATION_URL, command, depends_on, environment, image, restart (+1 more)

### Community 92 - "Kichik klaster 92"
Cohesion: 0.22
Nodes (9): environment, image, restart, volumes, APP_DB_PASSWORD, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER (+1 more)

### Community 93 - "Kichik klaster 93"
Cohesion: 0.50
Nodes (8): Skelet 1: Monorepo, Docker Compose, .env.example (tayyor), Skelet 2: Migratsiyalar 10 jadval (tayyor), Skelet 3: Auth login, JWT+refresh, guard (tayyor), Skelet 4: RLS va tenant izolyatsiya testi (tayyor), Skelet 5: Super admin markaz yaratish/bloklash (tayyor), Skelet 6: Rahbar filial va xodim yaratish, ruxsat sozlash (keyingi), Skelet 7: Audit jurnali va ruxsat matritsasi testi (kutmoqda), Skelet maqsadi: super admin markaz ochadi, rahbar kiradi, filial va xodim yaratadi

### Community 94 - "Kichik klaster 94"
Cohesion: 0.25
Nodes (8): depends_on, environment, image, ports, restart, volumes, DOMAIN, caddy

### Community 95 - "Kichik klaster 95"
Cohesion: 0.29
Nodes (6): env, node, rules, typescript/no-explicit-any, typescript/no-floating-promises, $schema

### Community 96 - "on"
Cohesion: 0.50
Nodes (4): on, pull_request, push, branches

### Community 98 - "academic.controller.ts"
Cohesion: 0.13
Nodes (19): AdjustRatingInput, adjustRatingSchema, CreateAssignmentInput, createAssignmentSchema, GradeInput, gradeSchema, link, Link (+11 more)

### Community 99 - "Kichik klaster 99"
Cohesion: 0.29
Nodes (6): compilerOptions, rootDir, exclude, extends, include, ./tsconfig.json

### Community 100 - "ExpensesService"
Cohesion: 0.33
Nodes (4): audited(), ExpensesService, forbidden(), notFound()

### Community 101 - "app/layout.tsx"
Cohesion: 0.15
Nodes (12): inter, metadata, mono, RootLayout(), viewport, Fx(), THEME_INIT, THEME_KEY (+4 more)

### Community 102 - "Kichik klaster 102"
Cohesion: 0.29
Nodes (6): name, services, volumes, caddy_config, caddy_data, pgdata

### Community 103 - "Kichik klaster 103"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 104 - "Kichik klaster 104"
Cohesion: 0.33
Nodes (6): depends_on, image, restart, migrate, condition, api

### Community 106 - "Kichik klaster 106"
Cohesion: 0.40
Nodes (5): healthcheck, interval, retries, test, timeout

### Community 107 - "StudentsController"
Cohesion: 0.17
Nodes (3): clientOf(), StudentsController, listStudentsSchema

### Community 108 - "build"
Cohesion: 0.67
Nodes (4): context, dockerfile, build, build

### Community 116 - "i18n.ts"
Cohesion: 0.08
Nodes (30): ChangePasswordForm(), ChangePasswordPage(), metadata, Action(), FEATURES, Landing(), metadata, ROLES (+22 more)

### Community 117 - "attendance-lock.e2e-spec.ts"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), Row (+2 more)

### Community 118 - "BranchesService"
Cohesion: 0.30
Nodes (5): audited(), BranchesService, nameTaken(), notFound(), view()

### Community 119 - ".setRole"
Cohesion: 0.19
Nodes (5): clientOf(), PermissionsAdminController, roleParamSchema, setRolePermissionsSchema, setUserPermissionsSchema

### Community 120 - "dispatch.service.ts"
Cohesion: 0.10
Nodes (22): LOGIN_MAX_FAILURES, LOGIN_WINDOW_SECONDS, APP_CONFIG, NO_CONTEXT, TenantContext, notificationLog, telegramLinkCodes, Candidate (+14 more)

### Community 121 - "load-bench.mjs"
Cohesion: 0.18
Nodes (9): CONC, ENDPOINTS, H, owner, rows, s, today, TOTAL (+1 more)

### Community 122 - "app-config.ts"
Cohesion: 0.08
Nodes (19): AppConfig, ConfigModule, envSchema, loadConfig(), parseDuration(), parseTrustProxy(), env, UNIT_SECONDS (+11 more)

### Community 123 - "attendance.e2e-spec.ts"
Cohesion: 0.21
Nodes (13): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+5 more)

### Community 124 - "centers.e2e-spec.ts"
Cohesion: 0.11
Nodes (14): DebtorRow, forbidden(), GroupRow, ListDebtorsQuery, rowsOf(), FinanceModule, FinanceReportService, forbidden() (+6 more)

### Community 126 - "PayrollRulesService"
Cohesion: 0.37
Nodes (5): audited(), bad(), forbidden(), PayrollRulesService, ruleNotFound()

### Community 127 - "RequirePermission"
Cohesion: 0.19
Nodes (3): RequirePermission(), ProbeController, ProbeController

### Community 128 - "payroll.e2e-spec.ts"
Cohesion: 0.21
Nodes (11): activate(), Api, Center, config, M, makeApi(), newCenter(), NEXT (+3 more)

### Community 130 - "globe.tsx"
Cohesion: 0.26
Nodes (12): LandingStage(), buildPoints(), fbm(), Globe(), draw(), GlobeNode, hash3(), mulberry32() (+4 more)

### Community 132 - "reports.e2e-spec.ts"
Cohesion: 0.26
Nodes (11): DB, activate(), Api, Center, config, makeApi(), mkStudent(), newCenter() (+3 more)

### Community 133 - ".events"
Cohesion: 0.36
Nodes (4): RankingQuery, forbidden(), nf(), RatingsService

### Community 134 - "settings-plans.e2e-spec.ts"
Cohesion: 0.29
Nodes (10): LOGIN_ACCOUNT_MAX_FAILURES, activate(), Api, Center, config, makeApi(), mkStudent(), newCenter() (+2 more)

### Community 135 - "discounts-debtors.e2e-spec.ts"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, ChargeView, config, makeApi(), mkStudent(), newCenter() (+2 more)

### Community 136 - "finance.e2e-spec.ts"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, config, D2, makeApi(), mkStudent(), newCenter() (+2 more)

### Community 137 - "payments.e2e-spec.ts"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, ChargeView, config, makeApi(), mkStudent(), newCenter() (+2 more)

### Community 138 - "students.schemas.ts"
Cohesion: 0.20
Nodes (8): birthDate, CreateStudentInput, createStudentSchema, ListStudentsQuery, login, phone, UpdateStudentInput, updateStudentSchema

### Community 139 - "enrollments.e2e-spec.ts"
Cohesion: 0.33
Nodes (9): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+1 more)

### Community 140 - "translit.ts"
Cohesion: 0.31
Nodes (9): cache, cased(), isApos(), isLetter(), isUpper(), LOWER, OVERRIDES, toCyrillic() (+1 more)

### Community 141 - "branches.schemas.ts"
Cohesion: 0.22
Nodes (6): CreateBranchInput, createBranchSchema, listBranchesSchema, phone, UpdateBranchInput, updateBranchSchema

### Community 143 - "main.ts"
Cohesion: 0.29
Nodes (5): @nestjs/core@^12.0.1, @nestjs/platform-express@^12.0.1, envFile, @nestjs/core, @nestjs/platform-express

### Community 145 - "i18n-en.ts"
Cohesion: 0.47
Nodes (3): EN_1, EN_2, EN

## Knowledge Gaps
- **46 isolated node(s):** `./tsconfig.json`, `Open questions: cross-branch names in rating, SaaS subscription billing`, `Daily pg_dump backup and restore testing`, `Environment variables (DATABASE_URL, JWT secrets, TRUST_PROXY, CRON_SECRET, API_URL...)`, `Option 2: Neon + container hosting` (+41 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1002 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Skeleton` to `group-card.tsx`, `app/layout.tsx`, `audit-page.tsx`, `react`, `useApi`, `Web package bog'liqliklari`, `Button`, `Kichik klaster 109`, `shell.tsx`, `[...path]/route.ts`, `i18n-check.mjs`, `i18n.ts`, `DataView`, `assignment-card.tsx`?**
  _High betweenness centrality (0.230) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `Open questions: cross-branch names in rating, SaaS subscription billing`, `Daily pg_dump backup and restore testing` to the rest of the system?**
  _46 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Skeleton` be split into smaller, more focused modules?**
  _Cohesion score 0.02825806451612903 - nodes in this community are weakly interconnected._
- **Why does `AuthUser` connect `AuthUser` to `Vazifalar xizmati va DB sxemasi`, `LessonsService`, `centers.service.ts`, `.events`, `.resetOwnerPassword`, `reports.service.ts`, `ClientInfo`, `.update`, `branches.schemas.ts`, `payroll.controller.ts`, `.update`, `CurrentUser`, `.update`, `CoursesService`, `payments.controller.ts`, `Xodimlar API`, `discounts.controller.ts`, `Hisoblar API`, `.hasIn`, `payments.service.ts`, `Roles`, `StudentsService`, `billing.controller.ts`, `FinanceController`, `lessons.schemas.ts`, `groups.controller.ts`, `.changePassword`, `.generate`, `users.service.ts`, `.withContext`, `.run`, `academic.controller.ts`, `ExpensesService`, `StudentsController`, `BranchesService`, `.setRole`, `dispatch.service.ts`, `centers.e2e-spec.ts`, `PayrollRulesService`, `RequirePermission`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Should `Vazifalar xizmati va DB sxemasi` be split into smaller, more focused modules?**
  _Cohesion score 0.08168916580131533 - nodes in this community are weakly interconnected._
- **Why does `@nestjs/common` connect `ClientInfo` to `payroll.e2e-spec.ts`, `Vazifalar xizmati va DB sxemasi`, `centers.service.ts`, `reports.e2e-spec.ts`, `settings-plans.e2e-spec.ts`, `discounts-debtors.e2e-spec.ts`, `reports.service.ts`, `finance.e2e-spec.ts`, `@nestjs/common`, `enrollments.e2e-spec.ts`, `imports.e2e-spec.ts`, `payments.e2e-spec.ts`, `academic.e2e-spec.ts`, `notifications.e2e-spec.ts`, `dates.ts`, `TokenService`, `API bog'liqliklari`, `groups.controller.ts`, `users.service.ts`, `api/package.json`, `groups.e2e-spec.ts`, `academic.controller.ts`, `attendance-lock.e2e-spec.ts`, `dispatch.service.ts`, `app-config.ts`, `attendance.e2e-spec.ts`, `centers.e2e-spec.ts`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `centers.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05952380952380952 - nodes in this community are weakly interconnected._