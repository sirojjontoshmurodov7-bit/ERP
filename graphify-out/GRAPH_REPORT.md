# Graph Report - ERP  (2026-11-26)

## Corpus Check
- 315 files · ~185,401 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: (none) 10, .css 4, .example 2)

## Summary
- 3063 nodes · 10503 edges · 119 communities (103 shown, 16 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 482 edges (avg confidence: 0.84)
- Token cost: 256,812 input · 0 output

## Graph Freshness
- Built from commit: `710bd6a9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Web: kirish va panel sahifalari
- Vazifalar xizmati va DB sxemasi
- LessonsService
- app-config.ts
- Web: kutubxona va tariflar sahifasi
- Guruhlar API
- TextInput
- StudentsService
- enrollments.controller.ts
- Controller yordamchilari
- @nestjs/common
- ExpensesService
- permission-matrix.ts
- Button
- billing.e2e-spec.ts
- payroll.schemas.ts
- ci.yml
- devDependencies
- Deploy va progress hujjatlari
- [...path]/route.ts
- RequirePermission
- .run
- DataView
- .run
- ChargesService
- ERD va ruxsatlar matritsasi
- notifications.e2e-spec.ts
- .update
- Tariflar API
- CoursesService
- DbService
- Spreadsheet o'quvchi
- To'lov taqsimlagich (FIFO)
- with
- Xodimlar API
- CLAUDE.md qoidalari
- permissions-page.tsx
- Filiallar API
- .end
- Hisoblar API
- .webhook
- REJA: bozor va mahsulot
- ERD: moliya modeli
- shell.tsx
- payroll-page.tsx
- Web package bog'liqliklari
- TokenService
- To'lovlar API
- steps
- notifications.schemas.ts
- Maosh motori
- CurrentUser
- O'quvchilar API
- API tsconfig
- Demo seed skripti
- API skriptlari
- env
- permissions-admin.controller.ts
- Web tsconfig
- Dev docker-compose
- API bog'liqliklari
- Smoke test skripti
- Root package.json
- PROGRESS: arxitektura qarorlari
- finance.schemas.ts
- lessons.schemas.ts
- postgres
- ERD: implementatsiya eslatmalari
- groups.controller.ts
- Shared paket
- PayrollRulesService
- Deploy variantlari
- e2e-browser
- enrollments.schemas.ts
- Prod docker-compose
- .events
- AuthUser
- .withContext
- test
- Kichik klaster 79
- student-import.ts
- api/package.json
- settings-plans.e2e-spec.ts
- AccessClaims
- .end
- TelegramPoller
- Kichik klaster 86
- Kichik klaster 87
- Kichik klaster 88
- Kichik klaster 89
- assignment-card.tsx
- Kichik klaster 91
- Kichik klaster 92
- Kichik klaster 93
- Kichik klaster 94
- Kichik klaster 95
- on
- Brauzer e2e (Playwright)
- @electric-sql/pglite
- Kichik klaster 99
- oxlint-tsgolint@^7.0.2001
- app/layout.tsx
- Kichik klaster 102
- Kichik klaster 103
- Kichik klaster 104
- source-map-support@^0.5.21
- Kichik klaster 106
- @types/express@^5.0.0
- build
- Kichik klaster 109
- Kichik klaster 110
- Kichik klaster 115
- app/page.tsx
- @types/node@^24.0.0
- @types/supertest@^7.0.0

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 362 edges
2. `CurrentUser` - 147 edges
3. `Skeleton()` - 127 edges
4. `Tx` - 119 edges
5. `ClientInfo` - 118 edges
6. `@nestjs/common` - 108 edges
7. `Button()` - 100 edges
8. `useApi()` - 91 edges
9. `writeAudit()` - 83 edges
10. `DataView()` - 77 edges

## Surprising Connections (you probably didn't know these)
- `Frontend: Next.js (React)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → packages/shared/package.json
- `CLAUDE.md (loyiha ko'rsatmalari)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → packages/shared/package.json
- `Backend: NestJS modulli monolit` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → packages/shared/package.json
- `AuthUser` --references--> `Role`  [EXTRACTED]
  apps/api/src/auth/auth.types.ts → packages/shared/src/index.ts
- `AccessClaims` --references--> `Role`  [EXTRACTED]
  apps/api/src/auth/auth.types.ts → packages/shared/src/index.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Effective permission model (template + exceptions + scope + guards)** — erd_va_ruxsatlar_center_role_permissions, erd_va_ruxsatlar_user_permissions, erd_va_ruxsatlar_scope_filter, erd_va_ruxsatlar_guard_chain, packages_shared_src_permission_matrix, erd_va_ruxsatlar_permission_matrix [EXTRACTED 1.00]
- **Billing and payment ledger flow** — erd_va_ruxsatlar_charge_generation, erd_va_ruxsatlar_charges, erd_va_ruxsatlar_payments, erd_va_ruxsatlar_payment_allocations, erd_va_ruxsatlar_payment_reversal, erd_va_ruxsatlar_debt_computed_not_stored [EXTRACTED 1.00]
- **Authentication and request security** — progress_auth_jwt_refresh, progress_guard_chain, progress_login_throttle_db, progress_bff_architecture [INFERRED 0.85]
- **Tenant isolation mechanisms** — erd_va_ruxsatlar_rls_tenant_isolation, erd_va_ruxsatlar_cross_center_composite_fk, erd_va_ruxsatlar_security_definer_auth_functions, erd_va_ruxsatlar_centers_guard_platform_columns, apps_api_test_tenant_isolation_e2e_spec [INFERRED 0.85]
- **Billing -> payments -> debt money flow** — progress_billing_engine_plancharges, progress_fifo_allocator, progress_debt_computation, progress_append_only_ledger [INFERRED 0.85]
- **Tenant isolation mechanisms** — progress_rls_tenant_context, progress_composite_fk_pattern, progress_security_definer_functions, progress_branch_scope_helper [INFERRED 0.85]

## Communities (119 total, 16 thin omitted)

### Community 0 - "Web: kirish va panel sahifalari"
Cohesion: 0.03
Nodes (101): ChangePasswordForm(), ChangePasswordPage(), metadata, instant, metadata, Page(), instant, metadata (+93 more)

### Community 1 - "Vazifalar xizmati va DB sxemasi"
Cohesion: 0.07
Nodes (92): AssignmentRow, homeworkPoints(), SubmissionRow, ATTENDANCE_POINTS, RankRow, TZ, AuditEntry, listAuditSchema (+84 more)

### Community 2 - "LessonsService"
Cohesion: 0.19
Nodes (8): AttendanceQuery, bad(), conflict(), forbidden(), groupNotFound(), lessonNotFound(), LessonsService, rate()

### Community 3 - "app-config.ts"
Cohesion: 0.03
Nodes (138): AppModule, hashPassword(), PARAMS, APP_CONFIG, envSchema, loadConfig(), parseDuration(), parseTrustProxy() (+130 more)

### Community 4 - "Web: kutubxona va tariflar sahifasi"
Cohesion: 0.07
Nodes (47): LoginForm(), LoginPage(), metadata, Plan, AttStatus, BILLING_MODE, Group, GROUP_STATUS (+39 more)

### Community 5 - "Guruhlar API"
Cohesion: 0.26
Nodes (8): branchScope(), ScheduleItem, bad(), conflict(), escapeLike(), forbidden(), groupNotFound(), GroupsService

### Community 6 - "TextInput"
Cohesion: 0.15
Nodes (46): AssignmentsPage(), AttendancePage(), Row, Summary, Debtor, DebtorsPage(), Expense, ExpenseDialog (+38 more)

### Community 7 - "StudentsService"
Cohesion: 0.26
Nodes (5): branchNotFound(), escapeLike(), forbidden(), notFound(), StudentsService

### Community 8 - "enrollments.controller.ts"
Cohesion: 0.16
Nodes (11): id(), CreateEnrollmentInput, createEnrollmentSchema, LeaveEnrollmentInput, leaveEnrollmentSchema, ListEnrollmentsQuery, listEnrollmentsSchema, price (+3 more)

### Community 9 - "Controller yordamchilari"
Cohesion: 0.07
Nodes (36): uuid(), changePasswordSchema, loginSchema, refreshSchema, ALLOW_MUST_CHANGE, IS_PUBLIC, PERMISSIONS_KEY, ROLES_KEY (+28 more)

### Community 10 - "@nestjs/common"
Cohesion: 0.06
Nodes (25): AcademicModule, AppController, AppService, AuditModule, AuthModule, BillingModule, BranchesModule, CentersModule (+17 more)

### Community 11 - "ExpensesService"
Cohesion: 0.33
Nodes (4): audited(), ExpensesService, forbidden(), notFound()

### Community 12 - "permission-matrix.ts"
Cohesion: 0.14
Nodes (13): DEFAULT_CENTER_SETTINGS, DEFAULT_TRIAL_DAYS, defaultRolePermissionRows(), ROLE_PERMISSION_MATRIX, RoleMatrix, RolePermissionRow, TenantRole, PERMISSION_CODES (+5 more)

### Community 13 - "Button"
Cohesion: 0.12
Nodes (58): Center, CentersPage(), CreateCenter, EditCenter, Plan, STATUS, PlanDialog, GradeDialog (+50 more)

### Community 14 - "billing.e2e-spec.ts"
Cohesion: 0.07
Nodes (43): countLessons(), addDays(), dayOf(), fromMs(), isoWeekday(), toMs(), daysAgo(), activate() (+35 more)

### Community 15 - "payroll.schemas.ts"
Cohesion: 0.06
Nodes (31): audited(), forbidden(), payoutNotFound(), PayoutsService, clientOf(), PayrollController, CreateAdjustmentInput, createAdjustmentSchema (+23 more)

### Community 16 - "ci.yml"
Cohesion: 0.17
Nodes (11): concurrency, cancel-in-progress, group, needs, runs-on, timeout-minutes, jobs, docker (+3 more)

### Community 17 - "devDependencies"
Cohesion: 0.10
Nodes (19): devDependencies, drizzle-kit@^0.31.11, @nestjs/cli@^12.0.0, @nestjs/mau@^0.2.6, @nestjs/schematics@^12.0.0, @nestjs/testing@^12.0.1, oxlint@^1.58.0, prettier@^3.4.2 (+11 more)

### Community 18 - "Deploy va progress hujjatlari"
Cohesion: 0.05
Nodes (38): Daily pg_dump backup and restore testing, DEPLOY.md deploy guide, Environment variables (DATABASE_URL, JWT secrets, TRUST_PROXY, CRON_SECRET, API_URL...), Local development (pg:local, db:migrate, dev:api, dev:web), Option 2: Neon + container hosting, First super admin bootstrap (create-super-admin.js), Telegram bot setup (BotFather, setWebhook with secret_token), Topology: Caddy -> web:3000 -> api:3001 -> db:5432 (+30 more)

### Community 19 - "[...path]/route.ts"
Cohesion: 0.06
Nodes (47): dataDir, ensureRolesAndDb(), PG_LOCAL, startLocalPg(), superUrl(), [cmd = 'info', arg], COMMANDS, envFile (+39 more)

### Community 20 - "RequirePermission"
Cohesion: 0.09
Nodes (6): RequirePermission(), CentersController, clientOf(), ProbeController, ProbeController, ProbeController

### Community 21 - ".run"
Cohesion: 0.11
Nodes (8): clientOf(), ImportsController, flag, ListImportsQuery, listImportsSchema, RunImportInput, runImportSchema, UploadedFile

### Community 22 - "DataView"
Cohesion: 0.12
Nodes (62): CoursesPage(), Dashboard(), DeskView(), Greeting(), TeacherView(), Branches(), BranchRow, BranchTable() (+54 more)

### Community 23 - ".run"
Cohesion: 0.28
Nodes (5): bad(), forbidden(), ImportsService, jobView(), safeName()

### Community 24 - "ChargesService"
Cohesion: 0.34
Nodes (4): audited(), chargeNotFound(), ChargesService, forbidden()

### Community 25 - "ERD va ruxsatlar matritsasi"
Cohesion: 0.17
Nodes (8): ERD va ruxsatlar matritsasi, centers table, centers_guard_platform_columns trigger, Permission matrix (roles x permission codes), Accepted decisions and resolved questions, Six fixed roles (SUPER_ADMIN, OWNER, ADMIN, CASHIER, TEACHER, STUDENT), Telegram bot and notifications (step 21), REJA.md

### Community 26 - "notifications.e2e-spec.ts"
Cohesion: 0.04
Nodes (43): AppConfig, DispatchService, emptySummary(), badCodeMessage(), debtMessage(), formatSom(), hashLinkCode(), helpMessage() (+35 more)

### Community 27 - ".update"
Cohesion: 0.12
Nodes (8): clientOf(), PlansController, CreatePlanInput, createPlanSchema, features, limit, UpdatePlanInput, updatePlanSchema

### Community 28 - "Tariflar API"
Cohesion: 0.27
Nodes (5): audited(), nameTaken(), notFound(), PlansService, view()

### Community 29 - "CoursesService"
Cohesion: 0.11
Nodes (13): clientOf(), CoursesController, CreateCourseInput, createCourseSchema, listCoursesSchema, price, UpdateCourseInput, updateCourseSchema (+5 more)

### Community 30 - "DbService"
Cohesion: 0.06
Nodes (19): AuditController, PermissionsService, BillingService, DebtorRow, DebtorsService, GroupRow, DbService, TenantContext (+11 more)

### Community 31 - "Spreadsheet o'quvchi"
Cohesion: 0.12
Nodes (26): attrs(), BUILTIN_DATE_FMTS, colIndex(), corrupt(), dateStyles(), decode(), ENTITIES, excelSerialToIso() (+18 more)

### Community 32 - "To'lov taqsimlagich (FIFO)"
Cohesion: 0.14
Nodes (10): AllocatorService, forbidden(), audited(), forbidden(), paymentNotFound(), PaymentsService, studentNotFound(), inScope() (+2 more)

### Community 33 - "with"
Cohesion: 0.15
Nodes (13): with, cache, cache-from, cache-to, context, file, name, node-version (+5 more)

### Community 34 - "Xodimlar API"
Cohesion: 0.07
Nodes (27): generateLogin(), isLoginConflict(), teacherProfiles, clientOf(), id(), StaffController, UserPasswordController, UsersModule (+19 more)

### Community 35 - "CLAUDE.md qoidalari"
Cohesion: 0.09
Nodes (30): To'lov, maosh to'lovi, audit append-only, Byudjet $0, host-agnostik (Docker), Qarz saqlanmaydi, charges dan hisoblanadi, CLAUDE.md (loyiha ko'rsatmalari), Hujjatlarni o'qish tartibi, ORM: Drizzle, Qaror ERD dan chetga chiqsa avval hujjatni yangila, ERD hujjati model va ruxsatlar manbasi (+22 more)

### Community 36 - "permissions-page.tsx"
Cohesion: 0.21
Nodes (12): instant, metadata, Page(), byModule(), MODULES, PermissionsPage(), RolePerm, ROLES (+4 more)

### Community 37 - "Filiallar API"
Cohesion: 0.13
Nodes (9): BranchesController, clientOf(), id(), CreateBranchInput, createBranchSchema, listBranchesSchema, phone, UpdateBranchInput (+1 more)

### Community 38 - ".end"
Cohesion: 0.14
Nodes (8): clientOf(), DiscountsController, CreateDiscountInput, createDiscountSchema, endDiscountSchema, ListDebtorsQuery, listDebtorsSchema, reason

### Community 39 - "Hisoblar API"
Cohesion: 0.13
Nodes (10): BillingController, clientOf(), cancelChargeSchema, CreateManualChargeInput, createManualChargeSchema, generateBillingSchema, ListChargesQuery, listChargesSchema (+2 more)

### Community 41 - "REJA: bozor va mahsulot"
Cohesion: 0.09
Nodes (24): Audit jurnali: kim, nima, qachon, oldingi/keyingi, Auth: argon2, JWT + refresh, 2FA, Raqobatchilar: SchoolupCRM, UstozCRM, ALFA CRM, Umai CRM, Shaxsiy ma'lumotlar qonuni (lokalizatsiya), Tashkilot > filial > guruh > o'quvchi, Birinchi 7 kunda 5 amaliy qadam, Bepul infra cheklovlari (Neon/Supabase, Render, Fly.io), 5-10 rahbar bilan suhbat (birinchi vazifa) (+16 more)

### Community 42 - "ERD: moliya modeli"
Cohesion: 0.11
Nodes (21): audit_logs table, charges table, ERD: charges, payments, allocations, expenses, ERD: payroll, notifications, import, expenses table (ACTIVE->VOIDED), Cash-basis finance report (step 17), grace_days (center default copied into group), Student Excel import (import_jobs, step 19) (+13 more)

### Community 43 - "shell.tsx"
Cohesion: 0.11
Nodes (28): instant, PanelLayout(), Account(), BRAND, FootCard(), initials(), isActive(), ROLE_SCOPE (+20 more)

### Community 44 - "payroll-page.tsx"
Cohesion: 0.15
Nodes (13): instant, metadata, Page(), Adjustment, Employee, Item, Payout, PayrollPage() (+5 more)

### Community 45 - "Web package bog'liqliklari"
Cohesion: 0.07
Nodes (35): eslintConfig, dependencies, next@16.4.6, react@19.3.0, react-dom@19.3.0, devDependencies, eslint@^9, eslint-config-next@16.4.6 (+27 more)

### Community 46 - "TokenService"
Cohesion: 0.09
Nodes (12): AuthController, clientOf(), accountInactive(), AuthService, centerBlocked(), invalidCredentials(), invalidRefresh(), AllowMustChangePassword() (+4 more)

### Community 47 - "To'lovlar API"
Cohesion: 0.13
Nodes (9): clientOf(), id(), PaymentsController, CreatePaymentInput, createPaymentSchema, ListPaymentsQuery, listPaymentsSchema, note (+1 more)

### Community 48 - "steps"
Cohesion: 0.29
Nodes (10): steps, steps, PGPASSWORD, TEST_DATABASE_URL, env, if, name, run (+2 more)

### Community 49 - "notifications.schemas.ts"
Cohesion: 0.09
Nodes (12): Public(), clientOf(), NotificationsController, safeEqual(), uuid(), ListNotificationsQuery, listNotificationsSchema, NOTIFICATION_TYPES (+4 more)

### Community 50 - "Maosh motori"
Cohesion: 0.08
Nodes (32): BillingMode, ChargeDraft, ChargeKind, discountFor(), EngineContext, EngineDiscount, EngineEnrollment, EngineGroup (+24 more)

### Community 51 - "CurrentUser"
Cohesion: 0.10
Nodes (22): AcademicController, clientOf(), AdjustRatingInput, adjustRatingSchema, CreateAssignmentInput, createAssignmentSchema, GradeInput, gradeSchema (+14 more)

### Community 52 - "O'quvchilar API"
Cohesion: 0.10
Nodes (11): clientOf(), StudentsController, birthDate, CreateStudentInput, createStudentSchema, ListStudentsQuery, listStudentsSchema, login (+3 more)

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

### Community 57 - "permissions-admin.controller.ts"
Cohesion: 0.22
Nodes (5): clientOf(), PermissionsAdminController, roleParamSchema, setRolePermissionsSchema, setUserPermissionsSchema

### Community 58 - "Web tsconfig"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 59 - "Dev docker-compose"
Cohesion: 0.11
Nodes (17): environment, healthcheck, image, ports, restart, volumes, POSTGRES_DB, POSTGRES_PASSWORD (+9 more)

### Community 60 - "API bog'liqliklari"
Cohesion: 0.12
Nodes (17): dependencies, drizzle-orm@^0.45.4, @erp/shared@workspace:*, @nestjs/common@^12.0.1, @nestjs/core@^12.0.1, @nestjs/jwt@^12.0.5, @nestjs/platform-express@^12.0.1, @node-rs/argon2@^2.2.2 (+9 more)

### Community 61 - "Smoke test skripti"
Cohesion: 0.12
Nodes (14): branch, c, charges, course, enr, first, group, lesson (+6 more)

### Community 62 - "Root package.json"
Cohesion: 0.12
Nodes (16): engines, node, name, packageManager, private, scripts, build, db:create-super-admin (+8 more)

### Community 63 - "PROGRESS: arxitektura qarorlari"
Cohesion: 0.13
Nodes (16): Billing engine planCharges() pure function, Debt computed from open charges past due_date + grace_days, Effective permission = user_permissions override > center_role_permissions > deny, FIFO payment allocator with advance balance, Guard chain JwtAuthGuard -> RolesGuard -> PermissionsGuard, Payroll engine (FIXED, PER_GROUP, PER_LESSON, PERCENT), Permission matrix in packages/shared/src/permission-matrix.ts, Step 13: billing charges and enrollment_freezes (+8 more)

### Community 64 - "finance.schemas.ts"
Cohesion: 0.06
Nodes (26): daysBetween(), clientOf(), FinanceController, FinanceReportService, num(), category, CreateExpenseInput, createExpenseSchema (+18 more)

### Community 65 - "lessons.schemas.ts"
Cohesion: 0.11
Nodes (16): Roles(), clientOf(), id(), LessonsController, ATTENDANCE_STATUSES, attendanceQuerySchema, AttendanceStatus, CreateLessonInput (+8 more)

### Community 66 - "postgres"
Cohesion: 0.22
Nodes (9): services, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, env, image, options, ports (+1 more)

### Community 67 - "ERD: implementatsiya eslatmalari"
Cohesion: 0.15
Nodes (13): GET /auth/me effective permissions for UI, Center blocking/unblocking, Center creation POST /admin/centers (single transaction), center_role_permissions (role template), ERD: tenant, branch, users, permissions, Guard order JWT -> @Roles -> @RequirePermission (@Public opt-out), JWT + rotating refresh token auth, Permission check layer (code + scope + effective permission) (+5 more)

### Community 68 - "groups.controller.ts"
Cohesion: 0.10
Nodes (18): clientOf(), GroupsController, AssignTeacherInput, assignTeacherSchema, BILLING_KEYS, billingMode, CreateGroupInput, createGroupSchema (+10 more)

### Community 69 - "Shared paket"
Cohesion: 0.18
Nodes (10): devDependencies, typescript@^5.9.3, main, name, private, scripts, build, test (+2 more)

### Community 70 - "PayrollRulesService"
Cohesion: 0.37
Nodes (5): audited(), bad(), forbidden(), PayrollRulesService, ruleNotFound()

### Community 71 - "Deploy variantlari"
Cohesion: 0.14
Nodes (12): 1-variant: bitta VPS + Docker Compose (tavsiya), 2-variant: boshqariladigan xizmatlar (Neon + konteyner hosting), Avtomatik eslatmalar (cron), Deploy qo'llanmasi, Lokal ishlab chiqish, Muhit o'zgaruvchilari, Tekshirish, Telegram bot (+4 more)

### Community 72 - "e2e-browser"
Cohesion: 0.50
Nodes (4): needs, runs-on, timeout-minutes, e2e-browser

### Community 73 - "enrollments.schemas.ts"
Cohesion: 0.12
Nodes (10): chunks(), clientOf(), EnrollmentsController, bad(), conflict(), enrollmentNotFound(), EnrollmentsService, forbidden() (+2 more)

### Community 74 - "Prod docker-compose"
Cohesion: 0.22
Nodes (9): condition, api, API_URL, WEB_SECURE_COOKIES, web, depends_on, environment, image (+1 more)

### Community 75 - ".events"
Cohesion: 0.36
Nodes (4): RankingQuery, forbidden(), nf(), RatingsService

### Community 76 - "AuthUser"
Cohesion: 0.14
Nodes (8): AssignmentsService, conflict(), forbidden(), isLate(), notFound(), AuthUser, assertConfigurable(), PermissionsAdminService

### Community 77 - ".withContext"
Cohesion: 0.10
Nodes (15): writeAudit(), ClientInfo, generateTempPassword(), audited(), BranchesService, nameTaken(), notFound(), view() (+7 more)

### Community 78 - "test"
Cohesion: 0.50
Nodes (4): test, runs-on, services, timeout-minutes

### Community 79 - "Kichik klaster 79"
Cohesion: 0.14
Nodes (14): environment, CRON_SECRET, DATABASE_URL, JWT_ACCESS_SECRET, JWT_ACCESS_TTL, JWT_REFRESH_SECRET, JWT_REFRESH_TTL, NODE_ENV (+6 more)

### Community 80 - "student-import.ts"
Cohesion: 0.22
Nodes (12): ALIASES, HeaderMap, LOOKUP, mapHeader(), MAX_IMPORT_ROWS, norm(), parseDate(), ParsedStudent (+4 more)

### Community 81 - "api/package.json"
Cohesion: 0.12
Nodes (15): author, description, embedded-postgres@17.11.0-beta.19, tsx@^4.23.15, typescript@^6.0.2, vite@^8.0.0, typescript, license (+7 more)

### Community 82 - "settings-plans.e2e-spec.ts"
Cohesion: 0.13
Nodes (15): LOGIN_ACCOUNT_MAX_FAILURES, LOGIN_MAX_FAILURES, LOGIN_WINDOW_SECONDS, CYRILLIC, slugify(), NO_CONTEXT, activate(), Api (+7 more)

### Community 83 - "AccessClaims"
Cohesion: 0.17
Nodes (5): AccessClaims, JwtAuthGuard, PermissionsGuard, RolesGuard, unauthorized()

### Community 84 - ".end"
Cohesion: 0.27
Nodes (6): audited(), discountNotFound(), DiscountsService, enrollmentNotFound(), forbidden(), overlap()

### Community 86 - "Kichik klaster 86"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, esModuleInterop, module, outDir, rootDir, skipLibCheck, strict (+2 more)

### Community 87 - "Kichik klaster 87"
Cohesion: 0.18
Nodes (10): allowBuilds, @embedded-postgres/darwin-arm64, @embedded-postgres/darwin-x64, @embedded-postgres/linux-arm64, @embedded-postgres/linux-x64, @embedded-postgres/windows-x64, esbuild, sharp (+2 more)

### Community 88 - "Kichik klaster 88"
Cohesion: 0.29
Nodes (8): AuditPage(), AuditRow, dayEnd(), dayStart(), ENTITY, instant, metadata, Page()

### Community 89 - "Kichik klaster 89"
Cohesion: 0.15
Nodes (14): Ikki to'lov rejimi GROUP_CYCLE / STUDENT_CYCLE, Attendance lesson lock (attendance_lock_days, edit_past), enrollments table, ERD: groups, enrollments, attendance, homework, rating, Homework and rating rules (step 20), join_proration setting (FULL_MONTH / REMAINING_LESSONS), rating_points event table, Center settings, plans, lesson lock, login throttle (step 22) (+6 more)

### Community 90 - "assignment-card.tsx"
Cohesion: 0.29
Nodes (14): AssignmentDialog, AssignmentCard(), MySubmission(), Submissions(), instant, metadata, Page(), Assignment (+6 more)

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

### Community 99 - "Kichik klaster 99"
Cohesion: 0.29
Nodes (6): compilerOptions, rootDir, exclude, extends, include, ./tsconfig.json

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

### Community 108 - "build"
Cohesion: 0.67
Nodes (4): context, dockerfile, build, build

### Community 116 - "app/page.tsx"
Cohesion: 0.13
Nodes (21): LandingStage(), MODULES, Action(), FEATURES, Landing(), metadata, ROLES, SessionAction() (+13 more)

## Knowledge Gaps
- **46 isolated node(s):** `./tsconfig.json`, `Open questions: cross-branch names in rating, SaaS subscription billing`, `Daily pg_dump backup and restore testing`, `Environment variables (DATABASE_URL, JWT secrets, TRUST_PROXY, CRON_SECRET, API_URL...)`, `Option 2: Neon + container hosting` (+41 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 914 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Web: kirish va panel sahifalari` to `Web: kutubxona va tariflar sahifasi`, `app/layout.tsx`, `TextInput`, `permissions-page.tsx`, `shell.tsx`, `payroll-page.tsx`, `Web package bog'liqliklari`, `Button`, `Kichik klaster 109`, `[...path]/route.ts`, `app/page.tsx`, `DataView`, `Kichik klaster 88`, `assignment-card.tsx`?**
  _High betweenness centrality (0.227) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `Open questions: cross-branch names in rating, SaaS subscription billing`, `Daily pg_dump backup and restore testing` to the rest of the system?**
  _46 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Web: kirish va panel sahifalari` be split into smaller, more focused modules?**
  _Cohesion score 0.028051181102362203 - nodes in this community are weakly interconnected._
- **Why does `AuthUser` connect `AuthUser` to `Vazifalar xizmati va DB sxemasi`, `LessonsService`, `Guruhlar API`, `StudentsService`, `enrollments.controller.ts`, `Controller yordamchilari`, `ExpensesService`, `payroll.schemas.ts`, `RequirePermission`, `.run`, `.run`, `ChargesService`, `.update`, `Tariflar API`, `CoursesService`, `DbService`, `To'lov taqsimlagich (FIFO)`, `Xodimlar API`, `Filiallar API`, `.end`, `Hisoblar API`, `TokenService`, `To'lovlar API`, `notifications.schemas.ts`, `CurrentUser`, `O'quvchilar API`, `permissions-admin.controller.ts`, `finance.schemas.ts`, `lessons.schemas.ts`, `groups.controller.ts`, `PayrollRulesService`, `enrollments.schemas.ts`, `.events`, `.withContext`, `.end`?**
  _High betweenness centrality (0.169) - this node is a cross-community bridge._
- **Should `Vazifalar xizmati va DB sxemasi` be split into smaller, more focused modules?**
  _Cohesion score 0.06746608527131782 - nodes in this community are weakly interconnected._
- **Why does `@nestjs/common` connect `@nestjs/common` to `Vazifalar xizmati va DB sxemasi`, `lessons.schemas.ts`, `app-config.ts`, `Xodimlar API`, `Filiallar API`, `enrollments.controller.ts`, `Controller yordamchilari`, `billing.e2e-spec.ts`, `To'lovlar API`, `api/package.json`, `settings-plans.e2e-spec.ts`, `CurrentUser`, `notifications.schemas.ts`, `.run`, `permissions-admin.controller.ts`, `notifications.e2e-spec.ts`, `API bog'liqliklari`, `DbService`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Should `app-config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.02849722242262463 - nodes in this community are weakly interconnected._