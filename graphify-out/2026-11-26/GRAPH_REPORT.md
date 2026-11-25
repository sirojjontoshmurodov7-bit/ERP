# Graph Report - ERP  (2026-11-26)

## Corpus Check
- 311 files · ~182,698 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 17 file(s) not represented in the graph (top: (none) 10, .css 4, .example 2)

## Summary
- 3017 nodes · 10430 edges · 123 communities (106 shown, 17 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 482 edges (avg confidence: 0.84)
- Token cost: 256,812 input · 0 output

## Graph Freshness
- Built from commit: `2949bbaa`
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
- Tx
- Vazifa va reyting API
- Controller yordamchilari
- Nest modullari
- .hasIn
- centers.service.ts
- Button
- Hisob-kitob motori
- Maosh API
- CI workflow
- devDependencies
- Deploy va progress hujjatlari
- Lokal Postgres va web lib
- Ro'yxat endpointlari
- .run
- DataView
- .withContext
- .run
- .branches
- messages.ts
- .update
- Tariflar API
- Kurslar va reyting so'rovlari
- Audit API
- Spreadsheet o'quvchi
- To'lov taqsimlagich (FIFO)
- ClientInfo
- Xodimlar API
- CLAUDE.md qoidalari
- permissions-page.tsx
- Filiallar API
- .end
- Hisoblar API
- TelegramBotService
- REJA: bozor va mahsulot
- ERD: moliya modeli
- shell.tsx
- payroll-page.tsx
- Web package bog'liqliklari
- TokenService
- To'lovlar API
- Markaz sozlamalari API
- notifications.schemas.ts
- Maosh motori
- StudentsService
- O'quvchilar API
- API tsconfig
- Demo seed skripti
- API skriptlari
- Telegram e2e testlari
- Ruxsatlarni boshqarish API
- Web tsconfig
- Dev docker-compose
- API bog'liqliklari
- Smoke test skripti
- Root package.json
- PROGRESS: arxitektura qarorlari
- finance.schemas.ts
- lessons.schemas.ts
- users.service.ts
- ERD: implementatsiya eslatmalari
- groups.controller.ts
- Shared paket
- ERD va ruxsatlar matritsasi
- Deploy variantlari
- Vazifa e2e testlari
- enrollments.schemas.ts
- Prod docker-compose
- .events
- AuthUser
- BranchesService
- branchFilter
- Kichik klaster 79
- student-import.ts
- api/package.json
- Mahsulot bosqichlari (MVP, 2, 3, 4)
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
- create-super-admin.ts
- telegram.poller.spec.ts
- DispatchService
- Kichik klaster 99
- NotifyScheduler
- app/layout.tsx
- Kichik klaster 102
- Kichik klaster 103
- Kichik klaster 104
- .webhook
- Kichik klaster 106
- Kichik klaster 107
- build
- Kichik klaster 109
- Kichik klaster 110
- Kichik klaster 115
- app/page.tsx
- @electric-sql/pglite
- source-map-support@^0.5.21
- oxlint-tsgolint@^7.0.2001
- @types/express@^5.0.0
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

## Communities (123 total, 17 thin omitted)

### Community 0 - "Web: kirish va panel sahifalari"
Cohesion: 0.03
Nodes (101): ChangePasswordForm(), ChangePasswordPage(), metadata, instant, metadata, Page(), instant, metadata (+93 more)

### Community 1 - "Vazifalar xizmati va DB sxemasi"
Cohesion: 0.07
Nodes (90): AssignmentRow, homeworkPoints(), SubmissionRow, ATTENDANCE_POINTS, RankRow, TZ, AuditEntry, listAuditSchema (+82 more)

### Community 2 - "LessonsService"
Cohesion: 0.19
Nodes (10): daysBetween(), groupVisibility(), AttendanceQuery, bad(), conflict(), forbidden(), groupNotFound(), lessonNotFound() (+2 more)

### Community 3 - "app-config.ts"
Cohesion: 0.03
Nodes (140): AppModule, hashPassword(), PARAMS, verifyAgainstDummy(), verifyPassword(), APP_CONFIG, AppConfig, envSchema (+132 more)

### Community 4 - "Web: kutubxona va tariflar sahifasi"
Cohesion: 0.07
Nodes (47): LoginForm(), LoginPage(), metadata, Plan, AttStatus, BILLING_MODE, Group, GROUP_STATUS (+39 more)

### Community 5 - "Guruhlar API"
Cohesion: 0.24
Nodes (8): branchScope(), ScheduleItem, bad(), conflict(), escapeLike(), forbidden(), groupNotFound(), GroupsService

### Community 6 - "TextInput"
Cohesion: 0.15
Nodes (46): AssignmentsPage(), AttendancePage(), Row, Summary, Debtor, DebtorsPage(), Expense, ExpenseDialog (+38 more)

### Community 7 - "Tx"
Cohesion: 0.17
Nodes (9): chunks(), Tx, bad(), conflict(), enrollmentNotFound(), EnrollmentsService, forbidden(), groupNotFound() (+1 more)

### Community 8 - "Vazifa va reyting API"
Cohesion: 0.10
Nodes (23): AcademicController, clientOf(), uuid(), AdjustRatingInput, adjustRatingSchema, CreateAssignmentInput, createAssignmentSchema, GradeInput (+15 more)

### Community 9 - "Controller yordamchilari"
Cohesion: 0.11
Nodes (33): changePasswordSchema, loginSchema, refreshSchema, ALLOW_MUST_CHANGE, IS_PUBLIC, PERMISSIONS_KEY, ROLES_KEY, id() (+25 more)

### Community 10 - "Nest modullari"
Cohesion: 0.05
Nodes (27): AcademicModule, AppController, AppService, AuditModule, AuthModule, BillingModule, BranchesModule, CentersModule (+19 more)

### Community 11 - ".hasIn"
Cohesion: 0.30
Nodes (6): ListPeriodsQuery, forbidden(), locked(), PayrollService, periodNotFound(), periodView()

### Community 12 - "centers.service.ts"
Cohesion: 0.10
Nodes (20): generateTempPassword(), CreateCenterInput, CreatedCenter, SUPER, CYRILLIC, slugify(), enterCenter(), DEFAULT_CENTER_SETTINGS (+12 more)

### Community 13 - "Button"
Cohesion: 0.12
Nodes (58): Center, CentersPage(), CreateCenter, EditCenter, Plan, STATUS, PlanDialog, GradeDialog (+50 more)

### Community 14 - "Hisob-kitob motori"
Cohesion: 0.06
Nodes (53): BillingMode, ChargeDraft, ChargeKind, countLessons(), discountFor(), EngineContext, EngineDiscount, EngineEnrollment (+45 more)

### Community 15 - "Maosh API"
Cohesion: 0.07
Nodes (30): audited(), forbidden(), payoutNotFound(), PayoutsService, clientOf(), PayrollController, audited(), bad() (+22 more)

### Community 16 - "CI workflow"
Cohesion: 0.05
Nodes (44): concurrency, cancel-in-progress, group, needs, runs-on, steps, timeout-minutes, POSTGRES_DB (+36 more)

### Community 17 - "devDependencies"
Cohesion: 0.10
Nodes (19): devDependencies, drizzle-kit@^0.31.11, @nestjs/cli@^12.0.0, @nestjs/mau@^0.2.6, @nestjs/schematics@^12.0.0, @nestjs/testing@^12.0.1, oxlint@^1.58.0, prettier@^3.4.2 (+11 more)

### Community 18 - "Deploy va progress hujjatlari"
Cohesion: 0.05
Nodes (38): Daily pg_dump backup and restore testing, DEPLOY.md deploy guide, Environment variables (DATABASE_URL, JWT secrets, TRUST_PROXY, CRON_SECRET, API_URL...), Local development (pg:local, db:migrate, dev:api, dev:web), Option 2: Neon + container hosting, First super admin bootstrap (create-super-admin.js), Telegram bot setup (BotFather, setWebhook with secret_token), Topology: Caddy -> web:3000 -> api:3001 -> db:5432 (+30 more)

### Community 19 - "Lokal Postgres va web lib"
Cohesion: 0.08
Nodes (32): dataDir, ensureRolesAndDb(), PG_LOCAL, startLocalPg(), superUrl(), [cmd = 'info', arg], COMMANDS, envFile (+24 more)

### Community 20 - "Ro'yxat endpointlari"
Cohesion: 0.09
Nodes (7): RequirePermission(), CentersController, clientOf(), ListCentersQuery, ProbeController, ProbeController, ProbeController

### Community 21 - ".run"
Cohesion: 0.09
Nodes (8): clientOf(), ImportsController, flag, ListImportsQuery, listImportsSchema, RunImportInput, runImportSchema, UploadedFile

### Community 22 - "DataView"
Cohesion: 0.12
Nodes (62): CoursesPage(), Dashboard(), DeskView(), Greeting(), TeacherView(), Branches(), BranchRow, BranchTable() (+54 more)

### Community 23 - ".withContext"
Cohesion: 0.15
Nodes (8): writeAudit(), audited(), chargeNotFound(), ChargesService, forbidden(), forbidden(), notFound(), NotificationsService

### Community 24 - ".run"
Cohesion: 0.28
Nodes (5): bad(), forbidden(), ImportsService, jobView(), safeName()

### Community 25 - ".branches"
Cohesion: 0.13
Nodes (11): ReportsController, BRANCH_SORTS, BranchesQuery, branchesQuerySchema, OverviewQuery, overviewQuerySchema, range, attendanceStats() (+3 more)

### Community 26 - "messages.ts"
Cohesion: 0.23
Nodes (12): Candidate, debtMessage(), formatSom(), hashLinkCode(), homeworkMessage(), lessonMessage(), LINK_CODE_LENGTH, LINK_CODE_TTL_MS (+4 more)

### Community 27 - ".update"
Cohesion: 0.12
Nodes (8): clientOf(), PlansController, CreatePlanInput, createPlanSchema, features, limit, UpdatePlanInput, updatePlanSchema

### Community 28 - "Tariflar API"
Cohesion: 0.27
Nodes (5): audited(), nameTaken(), notFound(), PlansService, view()

### Community 29 - "Kurslar va reyting so'rovlari"
Cohesion: 0.13
Nodes (8): clientOf(), CoursesController, CreateCourseInput, createCourseSchema, listCoursesSchema, price, UpdateCourseInput, updateCourseSchema

### Community 30 - "Audit API"
Cohesion: 0.06
Nodes (16): AuditController, LOGIN_MAX_FAILURES, LOGIN_WINDOW_SECONDS, PermissionsService, AllocatorService, BillingService, DbService, NO_CONTEXT (+8 more)

### Community 31 - "Spreadsheet o'quvchi"
Cohesion: 0.12
Nodes (26): attrs(), BUILTIN_DATE_FMTS, colIndex(), corrupt(), dateStyles(), decode(), ENTITIES, excelSerialToIso() (+18 more)

### Community 32 - "To'lov taqsimlagich (FIFO)"
Cohesion: 0.21
Nodes (5): audited(), forbidden(), paymentNotFound(), PaymentsService, studentNotFound()

### Community 33 - "ClientInfo"
Cohesion: 0.17
Nodes (10): ClientInfo, UpdateCenterInput, CentersService, inCenter(), notFound(), audited(), CoursesService, forbidden() (+2 more)

### Community 34 - "Xodimlar API"
Cohesion: 0.09
Nodes (14): clientOf(), StaffController, UserPasswordController, branchIds, CreateStaffInput, createStaffSchema, ListStaffQuery, listStaffSchema (+6 more)

### Community 35 - "CLAUDE.md qoidalari"
Cohesion: 0.09
Nodes (30): To'lov, maosh to'lovi, audit append-only, Byudjet $0, host-agnostik (Docker), Qarz saqlanmaydi, charges dan hisoblanadi, CLAUDE.md (loyiha ko'rsatmalari), Hujjatlarni o'qish tartibi, ORM: Drizzle, Qaror ERD dan chetga chiqsa avval hujjatni yangila, ERD hujjati model va ruxsatlar manbasi (+22 more)

### Community 36 - "permissions-page.tsx"
Cohesion: 0.21
Nodes (12): instant, metadata, Page(), byModule(), MODULES, PermissionsPage(), RolePerm, ROLES (+4 more)

### Community 37 - "Filiallar API"
Cohesion: 0.13
Nodes (8): BranchesController, clientOf(), CreateBranchInput, createBranchSchema, listBranchesSchema, phone, UpdateBranchInput, updateBranchSchema

### Community 38 - ".end"
Cohesion: 0.12
Nodes (9): DebtorsService, clientOf(), DiscountsController, CreateDiscountInput, createDiscountSchema, endDiscountSchema, ListDebtorsQuery, listDebtorsSchema (+1 more)

### Community 39 - "Hisoblar API"
Cohesion: 0.13
Nodes (10): BillingController, clientOf(), cancelChargeSchema, CreateManualChargeInput, createManualChargeSchema, generateBillingSchema, ListChargesQuery, listChargesSchema (+2 more)

### Community 40 - "TelegramBotService"
Cohesion: 0.24
Nodes (5): badCodeMessage(), helpMessage(), linkedMessage(), unlinkedMessage(), TelegramBotService

### Community 41 - "REJA: bozor va mahsulot"
Cohesion: 0.12
Nodes (17): Audit jurnali: kim, nima, qachon, oldingi/keyingi, Auth: argon2, JWT + refresh, 2FA, Raqobatchilar: SchoolupCRM, UstozCRM, ALFA CRM, Umai CRM, Shaxsiy ma'lumotlar qonuni (lokalizatsiya), Tashkilot > filial > guruh > o'quvchi, Birinchi 7 kunda 5 amaliy qadam, Bepul infra cheklovlari (Neon/Supabase, Render, Fly.io), Bozor tahlili (raqobatchilar) (+9 more)

### Community 42 - "ERD: moliya modeli"
Cohesion: 0.11
Nodes (20): Attendance lesson lock (attendance_lock_days, edit_past), charges table, enrollments table, ERD: charges, payments, allocations, expenses, ERD: groups, enrollments, attendance, homework, rating, ERD: payroll, notifications, import, expenses table (ACTIVE->VOIDED), Cash-basis finance report (step 17) (+12 more)

### Community 43 - "shell.tsx"
Cohesion: 0.11
Nodes (28): instant, PanelLayout(), Account(), BRAND, FootCard(), initials(), isActive(), ROLE_SCOPE (+20 more)

### Community 44 - "payroll-page.tsx"
Cohesion: 0.15
Nodes (13): instant, metadata, Page(), Adjustment, Employee, Item, Payout, PayrollPage() (+5 more)

### Community 45 - "Web package bog'liqliklari"
Cohesion: 0.07
Nodes (32): eslintConfig, dependencies, next@16.4.6, react@19.3.0, react-dom@19.3.0, devDependencies, eslint@^9, eslint-config-next@16.4.6 (+24 more)

### Community 46 - "TokenService"
Cohesion: 0.09
Nodes (10): AuthController, clientOf(), accountInactive(), AuthService, centerBlocked(), invalidCredentials(), invalidRefresh(), AllowMustChangePassword() (+2 more)

### Community 47 - "To'lovlar API"
Cohesion: 0.13
Nodes (9): clientOf(), id(), PaymentsController, CreatePaymentInput, createPaymentSchema, ListPaymentsQuery, listPaymentsSchema, note (+1 more)

### Community 48 - "Markaz sozlamalari API"
Cohesion: 0.14
Nodes (4): CenterSettingsController, clientOf(), CenterSettingsService, effectiveSettings()

### Community 49 - "notifications.schemas.ts"
Cohesion: 0.10
Nodes (13): Public(), Roles(), clientOf(), NotificationsController, safeEqual(), uuid(), ListNotificationsQuery, listNotificationsSchema (+5 more)

### Community 50 - "Maosh motori"
Cohesion: 0.15
Nodes (16): attachedGroups(), Attachment, EngineRule, fmt(), GroupBase, LessonCount, monthStartOf(), PayrollInput (+8 more)

### Community 51 - "StudentsService"
Cohesion: 0.26
Nodes (5): branchNotFound(), escapeLike(), forbidden(), notFound(), StudentsService

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

### Community 56 - "Telegram e2e testlari"
Cohesion: 0.10
Nodes (14): HttpTelegramSender, SendResult, activate(), Api, Center, config, FakeSender, makeApi() (+6 more)

### Community 57 - "Ruxsatlarni boshqarish API"
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
Cohesion: 0.09
Nodes (15): clientOf(), FinanceController, FinanceReportService, forbidden(), num(), category, CreateExpenseInput, createExpenseSchema (+7 more)

### Community 65 - "lessons.schemas.ts"
Cohesion: 0.11
Nodes (14): clientOf(), LessonsController, ATTENDANCE_STATUSES, attendanceQuerySchema, AttendanceStatus, CreateLessonInput, createLessonSchema, ListLessonsQuery (+6 more)

### Community 66 - "users.service.ts"
Cohesion: 0.20
Nodes (9): forbidden(), inScope(), branchNotFound(), createCode(), editCode(), forbidden(), manageableRoles(), userNotFound() (+1 more)

### Community 67 - "ERD: implementatsiya eslatmalari"
Cohesion: 0.15
Nodes (14): audit_logs table, GET /auth/me effective permissions for UI, Center blocking/unblocking, Center creation POST /admin/centers (single transaction), center_role_permissions (role template), ERD: tenant, branch, users, permissions, Guard order JWT -> @Roles -> @RequirePermission (@Public opt-out), JWT + rotating refresh token auth (+6 more)

### Community 68 - "groups.controller.ts"
Cohesion: 0.10
Nodes (18): clientOf(), GroupsController, AssignTeacherInput, assignTeacherSchema, BILLING_KEYS, billingMode, CreateGroupInput, createGroupSchema (+10 more)

### Community 69 - "Shared paket"
Cohesion: 0.18
Nodes (10): devDependencies, typescript@^5.9.3, main, name, private, scripts, build, test (+2 more)

### Community 70 - "ERD va ruxsatlar matritsasi"
Cohesion: 0.18
Nodes (8): ERD va ruxsatlar matritsasi, centers table, centers_guard_platform_columns trigger, grace_days (center default copied into group), Permission matrix (roles x permission codes), Accepted decisions and resolved questions, Six fixed roles (SUPER_ADMIN, OWNER, ADMIN, CASHIER, TEACHER, STUDENT), REJA.md

### Community 71 - "Deploy variantlari"
Cohesion: 0.14
Nodes (12): 1-variant: bitta VPS + Docker Compose (tavsiya), 2-variant: boshqariladigan xizmatlar (Neon + konteyner hosting), Avtomatik eslatmalar (cron), Deploy qo'llanmasi, Lokal ishlab chiqish, Muhit o'zgaruvchilari, Tekshirish, Telegram bot (+4 more)

### Community 72 - "Vazifa e2e testlari"
Cohesion: 0.23
Nodes (12): activate(), Api, Center, config, FUTURE, makeApi(), mkStudent(), newCenter() (+4 more)

### Community 73 - "enrollments.schemas.ts"
Cohesion: 0.13
Nodes (12): clientOf(), EnrollmentsController, CreateEnrollmentInput, createEnrollmentSchema, LeaveEnrollmentInput, leaveEnrollmentSchema, ListEnrollmentsQuery, listEnrollmentsSchema (+4 more)

### Community 74 - "Prod docker-compose"
Cohesion: 0.22
Nodes (9): condition, api, API_URL, WEB_SECURE_COOKIES, web, depends_on, environment, image (+1 more)

### Community 75 - ".events"
Cohesion: 0.32
Nodes (6): RankingQuery, forbidden(), nf(), RatingsService, teacherGroupIds(), teacherStudentIds()

### Community 76 - "AuthUser"
Cohesion: 0.14
Nodes (8): AssignmentsService, conflict(), forbidden(), isLate(), notFound(), AuthUser, assertConfigurable(), PermissionsAdminService

### Community 77 - "BranchesService"
Cohesion: 0.30
Nodes (5): audited(), BranchesService, nameTaken(), notFound(), view()

### Community 78 - "branchFilter"
Cohesion: 0.32
Nodes (5): branchFilter(), audited(), ExpensesService, forbidden(), notFound()

### Community 79 - "Kichik klaster 79"
Cohesion: 0.14
Nodes (14): environment, CRON_SECRET, DATABASE_URL, JWT_ACCESS_SECRET, JWT_ACCESS_TTL, JWT_REFRESH_SECRET, JWT_REFRESH_TTL, NODE_ENV (+6 more)

### Community 80 - "student-import.ts"
Cohesion: 0.22
Nodes (12): ALIASES, HeaderMap, LOOKUP, mapHeader(), MAX_IMPORT_ROWS, norm(), parseDate(), ParsedStudent (+4 more)

### Community 81 - "api/package.json"
Cohesion: 0.12
Nodes (15): author, description, embedded-postgres@17.11.0-beta.19, tsx@^4.23.15, typescript@^6.0.2, vite@^8.0.0, typescript, license (+7 more)

### Community 82 - "Mahsulot bosqichlari (MVP, 2, 3, 4)"
Cohesion: 0.15
Nodes (14): Excel import, 5-10 rahbar bilan suhbat (birinchi vazifa), Marketing: pilot markazlar, Excel import, Telegram kanal, MVP (1-bosqich), Pilot markazlar (3 ta, bepul 2-3 oy), 180 kun: vazifa, reyting, bot, pullik markazlar, 30 kun: suhbat, ERD, skelet, 90 kun: MVP va pilot (+6 more)

### Community 83 - "AccessClaims"
Cohesion: 0.17
Nodes (5): AccessClaims, JwtAuthGuard, PermissionsGuard, RolesGuard, unauthorized()

### Community 84 - ".end"
Cohesion: 0.31
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
Cohesion: 0.27
Nodes (7): Ikki to'lov rejimi GROUP_CYCLE / STUDENT_CYCLE, join_proration setting (FULL_MONTH / REMAINING_LESSONS), Bozor bo'shlig'i (taxmin), Moslashuvchan maosh motori (farqlovchi), Telegram-first aloqa, Ikki xil to'lov sikli (farqlovchi), Qiymat taklifi

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

### Community 96 - "create-super-admin.ts"
Cohesion: 0.17
Nodes (8): client, db, login, client, permissions, client, db, postgres

### Community 97 - "telegram.poller.spec.ts"
Cohesion: 0.24
Nodes (7): dueDay(), localTime(), BOT_COMMANDS, FetchFn, base, TELEGRAM_FETCH, Update

### Community 98 - "DispatchService"
Cohesion: 0.36
Nodes (3): DispatchService, emptySummary(), RunInput

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 891 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Web: kirish va panel sahifalari` to `Web: kutubxona va tariflar sahifasi`, `app/layout.tsx`, `TextInput`, `permissions-page.tsx`, `Kichik klaster 107`, `payroll-page.tsx`, `Web package bog'liqliklari`, `Button`, `shell.tsx`, `Kichik klaster 109`, `Lokal Postgres va web lib`, `app/page.tsx`, `DataView`, `Kichik klaster 88`, `assignment-card.tsx`?**
  _High betweenness centrality (0.264) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `Open questions: cross-branch names in rating, SaaS subscription billing`, `Daily pg_dump backup and restore testing` to the rest of the system?**
  _46 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Web: kirish va panel sahifalari` be split into smaller, more focused modules?**
  _Cohesion score 0.028051181102362203 - nodes in this community are weakly interconnected._
- **Why does `AuthUser` connect `AuthUser` to `Vazifalar xizmati va DB sxemasi`, `LessonsService`, `Guruhlar API`, `Tx`, `Vazifa va reyting API`, `Controller yordamchilari`, `.hasIn`, `centers.service.ts`, `Maosh API`, `Ro'yxat endpointlari`, `.run`, `.withContext`, `.run`, `.branches`, `.update`, `Tariflar API`, `Kurslar va reyting so'rovlari`, `Audit API`, `To'lov taqsimlagich (FIFO)`, `ClientInfo`, `Xodimlar API`, `Filiallar API`, `.end`, `Hisoblar API`, `TokenService`, `To'lovlar API`, `Markaz sozlamalari API`, `notifications.schemas.ts`, `StudentsService`, `O'quvchilar API`, `Ruxsatlarni boshqarish API`, `finance.schemas.ts`, `lessons.schemas.ts`, `users.service.ts`, `groups.controller.ts`, `enrollments.schemas.ts`, `.events`, `BranchesService`, `branchFilter`, `.end`?**
  _High betweenness centrality (0.170) - this node is a cross-community bridge._
- **Should `Vazifalar xizmati va DB sxemasi` be split into smaller, more focused modules?**
  _Cohesion score 0.0655757874015748 - nodes in this community are weakly interconnected._
- **Why does `ERD va ruxsatlar matritsasi` connect `ERD va ruxsatlar matritsasi` to `ERD: implementatsiya eslatmalari`, `CLAUDE.md qoidalari`, `Deploy variantlari`, `REJA: bozor va mahsulot`, `ERD: moliya modeli`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Should `app-config.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03087800303008441 - nodes in this community are weakly interconnected._