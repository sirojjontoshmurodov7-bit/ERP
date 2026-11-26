# Graph Report - ERP  (2026-11-26)

## Corpus Check
- 324 files · ~197,559 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: (none) 10, .css 4, .example 2)

## Summary
- 3157 nodes · 10916 edges · 134 communities (116 shown, 18 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 500 edges (avg confidence: 0.84)
- Token cost: 256,812 input · 0 output

## Graph Freshness
- Built from commit: `d2a67aab`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Web: kirish va panel sahifalari
- Vazifalar xizmati va DB sxemasi
- LessonsService
- app-config.ts
- group-card.tsx
- load-seed.mjs
- TextInput
- .hasIn
- .branches
- Controller yordamchilari
- @nestjs/common
- .update
- centers.service.ts
- Button
- activate
- payroll.schemas.ts
- ci.yml
- devDependencies
- Deploy va progress hujjatlari
- [...path]/route.ts
- RequirePermission
- .run
- DataView
- pg-local.ts
- messages.ts
- ERD va ruxsatlar matritsasi
- FakeSender
- .update
- global-setup.ts
- CoursesService
- DbService
- Spreadsheet o'quvchi
- To'lov taqsimlagich (FIFO)
- with
- Xodimlar API
- CLAUDE.md qoidalari
- i18n-wrap.mjs
- reports.service.ts
- .end
- Hisoblar API
- .webhook
- REJA: bozor va mahsulot
- ERD: moliya modeli
- i18n.ts
- payroll-page.tsx
- Web package bog'liqliklari
- TokenService
- rootToken
- steps
- NotificationsController
- payroll-engine.ts
- CurrentUser
- O'quvchilar API
- API tsconfig
- Demo seed skripti
- API skriptlari
- env
- Mahsulot bosqichlari (MVP, 2, 3, 4)
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
- .changePassword
- Deploy variantlari
- e2e-browser
- enrollments.schemas.ts
- Prod docker-compose
- .withContext
- PermissionsAdminService
- .run
- test
- Kichik klaster 79
- student-import.ts
- api/package.json
- newCenter
- i18n-check.mjs
- create-super-admin.ts
- TelegramPoller
- Kichik klaster 86
- Kichik klaster 87
- notifications.schemas.ts
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
- activate
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
- activate
- activate
- activate
- NotificationsService
- load-bench.mjs
- telegram.poller.spec.ts
- .run
- AuthService
- activate
- activate
- activate
- activate
- activate
- newCenter
- oxlint@^1.58.0
- prettier@^3.4.2
- tsx@^4.23.15

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 362 edges
2. `useT()` - 169 edges
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

## Communities (134 total, 18 thin omitted)

### Community 0 - "Web: kirish va panel sahifalari"
Cohesion: 0.03
Nodes (104): LoginForm(), metadata, instant, metadata, Page(), instant, metadata, Page() (+96 more)

### Community 1 - "Vazifalar xizmati va DB sxemasi"
Cohesion: 0.07
Nodes (89): AssignmentRow, SubmissionRow, ATTENDANCE_POINTS, RankRow, TZ, AuditEntry, listAuditSchema, writeAudit() (+81 more)

### Community 2 - "LessonsService"
Cohesion: 0.21
Nodes (9): branchScope(), AttendanceQuery, bad(), conflict(), forbidden(), groupNotFound(), lessonNotFound(), LessonsService (+1 more)

### Community 3 - "app-config.ts"
Cohesion: 0.03
Nodes (143): AppModule, hashPassword(), PARAMS, BillingMode, ChargeDraft, ChargeKind, countLessons(), discountFor() (+135 more)

### Community 4 - "group-card.tsx"
Cohesion: 0.21
Nodes (24): CreateGroup, GroupsList(), GroupCard(), LessonsTab(), ScheduleTab(), StudentsTab(), AttStatus, BILLING_MODE (+16 more)

### Community 5 - "load-seed.mjs"
Cohesion: 0.10
Nodes (21): addDays(), API, BRANCHES, byGroup, CONC, GROUPS_PER_BRANCH, lessonDays, lessons (+13 more)

### Community 6 - "TextInput"
Cohesion: 0.13
Nodes (57): AssignmentsPage(), AttendancePage(), Row, Summary, AuditPage(), AuditRow, dayEnd(), dayStart() (+49 more)

### Community 7 - ".hasIn"
Cohesion: 0.11
Nodes (17): audited(), forbidden(), payoutNotFound(), PayoutsService, audited(), bad(), forbidden(), PayrollRulesService (+9 more)

### Community 8 - ".branches"
Cohesion: 0.16
Nodes (8): ReportsController, BranchesQuery, OverviewQuery, overviewQuerySchema, attendanceStats(), forbidden(), num(), ReportsService

### Community 9 - "Controller yordamchilari"
Cohesion: 0.06
Nodes (68): uuid(), changePasswordSchema, loginSchema, refreshSchema, ClientInfo, AuthedRequest, ALLOW_MUST_CHANGE, IS_PUBLIC (+60 more)

### Community 10 - "@nestjs/common"
Cohesion: 0.05
Nodes (23): AcademicModule, AppController, AppService, AuditModule, AuthModule, BillingModule, BranchesModule, CentersModule (+15 more)

### Community 11 - ".update"
Cohesion: 0.14
Nodes (6): CenterSettingsController, clientOf(), UpdateCenterSettingsInput, updateCenterSettingsSchema, CenterSettingsService, effectiveSettings()

### Community 12 - "centers.service.ts"
Cohesion: 0.09
Nodes (22): generateTempPassword(), CreateCenterInput, ListCentersQuery, UpdateCenterInput, CreatedCenter, SUPER, CYRILLIC, slugify() (+14 more)

### Community 13 - "Button"
Cohesion: 0.12
Nodes (67): Center, CentersPage(), CreateCenter, EditCenter, Plan, STATUS, Plan, PlanDialog (+59 more)

### Community 14 - "activate"
Cohesion: 0.60
Nodes (5): activate(), makeApi(), mkStudent(), newCenter(), staff()

### Community 15 - "payroll.schemas.ts"
Cohesion: 0.11
Nodes (20): CurrentUser, clientOf(), PayrollController, CreateAdjustmentInput, createAdjustmentSchema, createPayoutSchema, CreateRuleInput, createRuleSchema (+12 more)

### Community 16 - "ci.yml"
Cohesion: 0.17
Nodes (11): concurrency, cancel-in-progress, group, needs, runs-on, timeout-minutes, jobs, docker (+3 more)

### Community 17 - "devDependencies"
Cohesion: 0.10
Nodes (19): devDependencies, drizzle-kit@^0.31.11, @nestjs/cli@^12.0.0, @nestjs/schematics@^12.0.0, @nestjs/testing@^12.0.1, supertest@^7.0.0, @types/supertest@^7.0.0, typescript@^6.0.2 (+11 more)

### Community 18 - "Deploy va progress hujjatlari"
Cohesion: 0.05
Nodes (38): Daily pg_dump backup and restore testing, DEPLOY.md deploy guide, Environment variables (DATABASE_URL, JWT secrets, TRUST_PROXY, CRON_SECRET, API_URL...), Local development (pg:local, db:migrate, dev:api, dev:web), Option 2: Neon + container hosting, First super admin bootstrap (create-super-admin.js), Telegram bot setup (BotFather, setWebhook with secret_token), Topology: Caddy -> web:3000 -> api:3001 -> db:5432 (+30 more)

### Community 19 - "[...path]/route.ts"
Cohesion: 0.16
Nodes (24): POST(), POST(), BLOCKED, DELETE, GET, handle(), PASS_RESPONSE_HEADERS, PATCH (+16 more)

### Community 20 - "RequirePermission"
Cohesion: 0.05
Nodes (19): RequirePermission(), BranchesController, clientOf(), CreateBranchInput, createBranchSchema, listBranchesSchema, phone, UpdateBranchInput (+11 more)

### Community 21 - ".run"
Cohesion: 0.13
Nodes (7): clientOf(), flag, ListImportsQuery, listImportsSchema, RunImportInput, runImportSchema, UploadedFile

### Community 22 - "DataView"
Cohesion: 0.08
Nodes (68): Dashboard(), DeskView(), Greeting(), TeacherView(), Branches(), BranchRow, bucket(), Daily (+60 more)

### Community 23 - "pg-local.ts"
Cohesion: 0.14
Nodes (8): dataDir, ensureRolesAndDb(), PG_LOCAL, startLocalPg(), superUrl(), [cmd = 'info', arg], COMMANDS, envFile

### Community 24 - "messages.ts"
Cohesion: 0.21
Nodes (13): badCodeMessage(), debtMessage(), formatSom(), helpMessage(), homeworkMessage(), lessonMessage(), LINK_CODE_LENGTH, LINK_CODE_TTL_MS (+5 more)

### Community 25 - "ERD va ruxsatlar matritsasi"
Cohesion: 0.18
Nodes (8): ERD va ruxsatlar matritsasi, centers table, centers_guard_platform_columns trigger, grace_days (center default copied into group), Permission matrix (roles x permission codes), Accepted decisions and resolved questions, Six fixed roles (SUPER_ADMIN, OWNER, ADMIN, CASHIER, TEACHER, STUDENT), REJA.md

### Community 27 - ".update"
Cohesion: 0.10
Nodes (13): clientOf(), PlansController, CreatePlanInput, createPlanSchema, features, limit, UpdatePlanInput, updatePlanSchema (+5 more)

### Community 28 - "global-setup.ts"
Cohesion: 0.24
Nodes (12): firstSignIn(), signedIn(), signIn(), API, call(), DATA_FILE, E2EData, globalSetup() (+4 more)

### Community 29 - "CoursesService"
Cohesion: 0.14
Nodes (8): clientOf(), CoursesController, listCoursesSchema, audited(), CoursesService, forbidden(), nameTaken(), notFound()

### Community 30 - "DbService"
Cohesion: 0.05
Nodes (21): AuditController, LOGIN_ACCOUNT_MAX_FAILURES, LOGIN_MAX_FAILURES, LOGIN_WINDOW_SECONDS, PermissionsService, BillingService, DebtorsService, DbService (+13 more)

### Community 31 - "Spreadsheet o'quvchi"
Cohesion: 0.12
Nodes (26): attrs(), BUILTIN_DATE_FMTS, colIndex(), corrupt(), dateStyles(), decode(), ENTITIES, excelSerialToIso() (+18 more)

### Community 32 - "To'lov taqsimlagich (FIFO)"
Cohesion: 0.08
Nodes (14): AllocatorService, clientOf(), PaymentsController, CreatePaymentInput, createPaymentSchema, ListPaymentsQuery, listPaymentsSchema, note (+6 more)

### Community 33 - "with"
Cohesion: 0.15
Nodes (13): with, cache, cache-from, cache-to, context, file, name, node-version (+5 more)

### Community 34 - "Xodimlar API"
Cohesion: 0.09
Nodes (14): clientOf(), StaffController, UserPasswordController, branchIds, CreateStaffInput, createStaffSchema, ListStaffQuery, listStaffSchema (+6 more)

### Community 35 - "CLAUDE.md qoidalari"
Cohesion: 0.09
Nodes (30): To'lov, maosh to'lovi, audit append-only, Byudjet $0, host-agnostik (Docker), Qarz saqlanmaydi, charges dan hisoblanadi, CLAUDE.md (loyiha ko'rsatmalari), Hujjatlarni o'qish tartibi, ORM: Drizzle, Qaror ERD dan chetga chiqsa avval hujjatni yangila, ERD hujjati model va ruxsatlar manbasi (+22 more)

### Community 36 - "i18n-wrap.mjs"
Cohesion: 0.10
Nodes (12): files, require, SKIP_ATTR, SKIP_CALL, ts, args, ATTRS, dry (+4 more)

### Community 37 - "reports.service.ts"
Cohesion: 0.16
Nodes (12): daysBetween(), category, CreateExpenseInput, ListExpensesQuery, listExpensesSchema, MAX_REPORT_DAYS, reason, BRANCH_SORTS (+4 more)

### Community 38 - ".end"
Cohesion: 0.12
Nodes (13): clientOf(), CreateDiscountInput, createDiscountSchema, endDiscountSchema, ListDebtorsQuery, listDebtorsSchema, reason, audited() (+5 more)

### Community 39 - "Hisoblar API"
Cohesion: 0.14
Nodes (6): BillingController, clientOf(), audited(), chargeNotFound(), ChargesService, forbidden()

### Community 41 - "REJA: bozor va mahsulot"
Cohesion: 0.12
Nodes (17): Audit jurnali: kim, nima, qachon, oldingi/keyingi, Auth: argon2, JWT + refresh, 2FA, Raqobatchilar: SchoolupCRM, UstozCRM, ALFA CRM, Umai CRM, Shaxsiy ma'lumotlar qonuni (lokalizatsiya), Tashkilot > filial > guruh > o'quvchi, Birinchi 7 kunda 5 amaliy qadam, Bepul infra cheklovlari (Neon/Supabase, Render, Fly.io), Bozor tahlili (raqobatchilar) (+9 more)

### Community 42 - "ERD: moliya modeli"
Cohesion: 0.11
Nodes (20): Attendance lesson lock (attendance_lock_days, edit_past), charges table, enrollments table, ERD: charges, payments, allocations, expenses, ERD: groups, enrollments, attendance, homework, rating, ERD: payroll, notifications, import, expenses table (ACTIVE->VOIDED), Cash-basis finance report (step 17) (+12 more)

### Community 43 - "i18n.ts"
Cohesion: 0.05
Nodes (62): ChangePasswordForm(), ChangePasswordPage(), metadata, instant, PanelLayout(), ERR, LogRow, TYPE (+54 more)

### Community 44 - "payroll-page.tsx"
Cohesion: 0.18
Nodes (10): Adjustment, Employee, Item, Payout, Period, PERIOD_STATUS, Rule, RULE_TYPE (+2 more)

### Community 45 - "Web package bog'liqliklari"
Cohesion: 0.06
Nodes (36): eslintConfig, dependencies, next@16.4.6, react@19.3.0, react-dom@19.3.0, devDependencies, eslint@^9, eslint-config-next@16.4.6 (+28 more)

### Community 46 - "TokenService"
Cohesion: 0.09
Nodes (7): AccessClaims, JwtAuthGuard, PermissionsGuard, RolesGuard, unauthorized(), LoginThrottle, TokenService

### Community 47 - "rootToken"
Cohesion: 0.18
Nodes (13): call(), login(), rootToken(), activate(), makeApi(), newCenter(), staff(), activate() (+5 more)

### Community 48 - "steps"
Cohesion: 0.29
Nodes (10): steps, steps, PGPASSWORD, TEST_DATABASE_URL, env, if, name, run (+2 more)

### Community 50 - "payroll-engine.ts"
Cohesion: 0.15
Nodes (16): attachedGroups(), Attachment, EngineRule, fmt(), GroupBase, LessonCount, monthStartOf(), PayrollInput (+8 more)

### Community 51 - "CurrentUser"
Cohesion: 0.08
Nodes (27): AcademicController, clientOf(), AdjustRatingInput, adjustRatingSchema, CreateAssignmentInput, createAssignmentSchema, GradeInput, gradeSchema (+19 more)

### Community 52 - "O'quvchilar API"
Cohesion: 0.09
Nodes (16): clientOf(), StudentsController, birthDate, CreateStudentInput, createStudentSchema, ListStudentsQuery, listStudentsSchema, login (+8 more)

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

### Community 57 - "Mahsulot bosqichlari (MVP, 2, 3, 4)"
Cohesion: 0.15
Nodes (14): Excel import, 5-10 rahbar bilan suhbat (birinchi vazifa), Marketing: pilot markazlar, Excel import, Telegram kanal, MVP (1-bosqich), Pilot markazlar (3 ta, bepul 2-3 oy), 180 kun: vazifa, reyting, bot, pullik markazlar, 30 kun: suhbat, ERD, skelet, 90 kun: MVP va pilot (+6 more)

### Community 58 - "Web tsconfig"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 59 - "Dev docker-compose"
Cohesion: 0.11
Nodes (17): environment, healthcheck, image, ports, restart, volumes, POSTGRES_DB, POSTGRES_PASSWORD (+9 more)

### Community 60 - "API bog'liqliklari"
Cohesion: 0.11
Nodes (18): dependencies, drizzle-orm@^0.45.4, @erp/shared@workspace:*, @nestjs/common@^12.0.1, @nestjs/core@^12.0.1, @nestjs/jwt@^12.0.5, @nestjs/platform-express@^12.0.1, @node-rs/argon2@^2.2.2 (+10 more)

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
Cohesion: 0.09
Nodes (14): AuthUser, audited(), ExpensesService, forbidden(), notFound(), clientOf(), FinanceController, FinanceReportService (+6 more)

### Community 65 - "lessons.schemas.ts"
Cohesion: 0.06
Nodes (16): Roles(), DiscountsController, clientOf(), LessonsController, ATTENDANCE_STATUSES, attendanceQuerySchema, AttendanceStatus, CreateLessonInput (+8 more)

### Community 66 - "postgres"
Cohesion: 0.22
Nodes (9): services, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, env, image, options, ports (+1 more)

### Community 67 - "ERD: implementatsiya eslatmalari"
Cohesion: 0.15
Nodes (14): audit_logs table, GET /auth/me effective permissions for UI, Center blocking/unblocking, Center creation POST /admin/centers (single transaction), center_role_permissions (role template), ERD: tenant, branch, users, permissions, Guard order JWT -> @Roles -> @RequirePermission (@Public opt-out), JWT + rotating refresh token auth (+6 more)

### Community 68 - "groups.controller.ts"
Cohesion: 0.14
Nodes (9): clientOf(), GroupsController, ScheduleItem, bad(), conflict(), escapeLike(), forbidden(), groupNotFound() (+1 more)

### Community 69 - "Shared paket"
Cohesion: 0.18
Nodes (10): devDependencies, typescript@^5.9.3, main, name, private, scripts, build, test (+2 more)

### Community 70 - ".changePassword"
Cohesion: 0.39
Nodes (3): AuthController, clientOf(), AllowMustChangePassword()

### Community 71 - "Deploy variantlari"
Cohesion: 0.14
Nodes (12): 1-variant: bitta VPS + Docker Compose (tavsiya), 2-variant: boshqariladigan xizmatlar (Neon + konteyner hosting), Avtomatik eslatmalar (cron), Deploy qo'llanmasi, Lokal ishlab chiqish, Muhit o'zgaruvchilari, Tekshirish, Telegram bot (+4 more)

### Community 72 - "e2e-browser"
Cohesion: 0.50
Nodes (4): needs, runs-on, timeout-minutes, e2e-browser

### Community 73 - "enrollments.schemas.ts"
Cohesion: 0.09
Nodes (21): chunks(), Tx, clientOf(), EnrollmentsController, CreateEnrollmentInput, createEnrollmentSchema, LeaveEnrollmentInput, leaveEnrollmentSchema (+13 more)

### Community 74 - "Prod docker-compose"
Cohesion: 0.22
Nodes (9): condition, api, API_URL, WEB_SECURE_COOKIES, web, depends_on, environment, image (+1 more)

### Community 75 - ".withContext"
Cohesion: 0.09
Nodes (16): RankingQuery, forbidden(), nf(), RatingsService, forbidden(), CentersService, inCenter(), notFound() (+8 more)

### Community 76 - "PermissionsAdminService"
Cohesion: 0.13
Nodes (8): clientOf(), PermissionsAdminController, roleParamSchema, setRolePermissionsSchema, setUserPermissionsSchema, assertConfigurable(), PermissionsAdminService, TenantRole

### Community 77 - ".run"
Cohesion: 0.17
Nodes (6): ImportsController, bad(), forbidden(), ImportsService, jobView(), safeName()

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
Nodes (15): author, description, embedded-postgres@17.11.0-beta.19, @nestjs/mau@^0.2.6, oxlint-tsgolint@^7.0.2001, @types/node@^24.0.0, @types/node, license (+7 more)

### Community 82 - "newCenter"
Cohesion: 0.67
Nodes (4): activate(), makeApi(), newCenter(), staff()

### Community 83 - "i18n-check.mjs"
Cohesion: 0.15
Nodes (9): csp, nextConfig, securityHeaders, dict, files, keys, missing, root (+1 more)

### Community 84 - "create-super-admin.ts"
Cohesion: 0.18
Nodes (8): client, db, login, client, permissions, client, db, postgres

### Community 86 - "Kichik klaster 86"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, esModuleInterop, module, outDir, rootDir, skipLibCheck, strict (+2 more)

### Community 87 - "Kichik klaster 87"
Cohesion: 0.18
Nodes (10): allowBuilds, @embedded-postgres/darwin-arm64, @embedded-postgres/darwin-x64, @embedded-postgres/linux-arm64, @embedded-postgres/linux-x64, @embedded-postgres/windows-x64, esbuild, sharp (+2 more)

### Community 88 - "notifications.schemas.ts"
Cohesion: 0.22
Nodes (8): Candidate, ListNotificationsQuery, listNotificationsSchema, NOTIFICATION_TYPES, RUN_TYPES, RunType, sendSchema, telegramUpdateSchema

### Community 89 - "Kichik klaster 89"
Cohesion: 0.27
Nodes (7): Ikki to'lov rejimi GROUP_CYCLE / STUDENT_CYCLE, join_proration setting (FULL_MONTH / REMAINING_LESSONS), Bozor bo'shlig'i (taxmin), Moslashuvchan maosh motori (farqlovchi), Telegram-first aloqa, Ikki xil to'lov sikli (farqlovchi), Qiymat taklifi

### Community 90 - "assignment-card.tsx"
Cohesion: 0.16
Nodes (18): MODULES, AssignmentDialog, AssignmentCard(), MySubmission(), Submissions(), Assignment, LinkItem, Submission (+10 more)

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

### Community 100 - "activate"
Cohesion: 0.60
Nodes (5): activate(), makeApi(), mkStudent(), newCenter(), staff()

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
Nodes (22): LandingStage(), LoginPage(), Action(), FEATURES, Landing(), metadata, ROLES, SessionAction() (+14 more)

### Community 117 - "activate"
Cohesion: 0.60
Nodes (5): activate(), makeApi(), mkStudent(), newCenter(), staff()

### Community 118 - "activate"
Cohesion: 0.60
Nodes (5): activate(), makeApi(), mkStudent(), newCenter(), staff()

### Community 119 - "activate"
Cohesion: 0.60
Nodes (5): activate(), makeApi(), mkStudent(), newCenter(), staff()

### Community 120 - "NotificationsService"
Cohesion: 0.27
Nodes (3): forbidden(), notFound(), NotificationsService

### Community 121 - "load-bench.mjs"
Cohesion: 0.18
Nodes (9): CONC, ENDPOINTS, H, owner, rows, s, today, TOTAL (+1 more)

### Community 122 - "telegram.poller.spec.ts"
Cohesion: 0.12
Nodes (9): dueDay(), localTime(), NotifyScheduler, TelegramBotService, BOT_COMMANDS, FetchFn, base, TELEGRAM_FETCH (+1 more)

### Community 123 - ".run"
Cohesion: 0.27
Nodes (4): emptySummary(), safeEqual(), RunInput, runSchema

### Community 124 - "AuthService"
Cohesion: 0.16
Nodes (11): accountInactive(), AuthService, centerBlocked(), invalidCredentials(), invalidRefresh(), LoginResult, TokenPair, UserRow (+3 more)

### Community 125 - "activate"
Cohesion: 0.60
Nodes (5): activate(), makeApi(), mkStudent(), newCenter(), staff()

### Community 126 - "activate"
Cohesion: 0.60
Nodes (5): activate(), makeApi(), mkStudent(), newCenter(), staff()

### Community 127 - "activate"
Cohesion: 0.60
Nodes (5): activate(), makeApi(), mkStudent(), newCenter(), staff()

### Community 128 - "activate"
Cohesion: 0.60
Nodes (5): activate(), makeApi(), mkStudent(), newCenter(), staff()

### Community 129 - "activate"
Cohesion: 0.60
Nodes (5): activate(), makeApi(), mkStudent(), newCenter(), staff()

### Community 130 - "newCenter"
Cohesion: 0.67
Nodes (4): activate(), makeApi(), newCenter(), staff()

## Knowledge Gaps
- **46 isolated node(s):** `./tsconfig.json`, `Open questions: cross-branch names in rating, SaaS subscription billing`, `Daily pg_dump backup and restore testing`, `Environment variables (DATABASE_URL, JWT secrets, TRUST_PROXY, CRON_SECRET, API_URL...)`, `Option 2: Neon + container hosting` (+41 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 968 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Web: kirish va panel sahifalari` to `group-card.tsx`, `app/layout.tsx`, `TextInput`, `i18n.ts`, `Web package bog'liqliklari`, `Button`, `Kichik klaster 109`, `[...path]/route.ts`, `i18n-check.mjs`, `app/page.tsx`, `DataView`, `assignment-card.tsx`?**
  _High betweenness centrality (0.238) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `Open questions: cross-branch names in rating, SaaS subscription billing`, `Daily pg_dump backup and restore testing` to the rest of the system?**
  _46 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Web: kirish va panel sahifalari` be split into smaller, more focused modules?**
  _Cohesion score 0.02866036925719193 - nodes in this community are weakly interconnected._
- **Why does `AuthUser` connect `finance.schemas.ts` to `Vazifalar xizmati va DB sxemasi`, `LessonsService`, `.hasIn`, `.branches`, `Controller yordamchilari`, `.update`, `centers.service.ts`, `payroll.schemas.ts`, `RequirePermission`, `.run`, `.update`, `CoursesService`, `To'lov taqsimlagich (FIFO)`, `Xodimlar API`, `reports.service.ts`, `.end`, `Hisoblar API`, `NotificationsController`, `CurrentUser`, `O'quvchilar API`, `lessons.schemas.ts`, `groups.controller.ts`, `.changePassword`, `enrollments.schemas.ts`, `.withContext`, `PermissionsAdminService`, `.run`, `NotificationsService`, `.run`, `AuthService`?**
  _High betweenness centrality (0.162) - this node is a cross-community bridge._
- **Should `Vazifalar xizmati va DB sxemasi` be split into smaller, more focused modules?**
  _Cohesion score 0.07085714285714285 - nodes in this community are weakly interconnected._
- **Why does `ERD va ruxsatlar matritsasi` connect `ERD va ruxsatlar matritsasi` to `ERD: implementatsiya eslatmalari`, `CLAUDE.md qoidalari`, `Deploy variantlari`, `REJA: bozor va mahsulot`, `ERD: moliya modeli`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Should `app-config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.032138660399529964 - nodes in this community are weakly interconnected._