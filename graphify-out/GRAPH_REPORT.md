# Graph Report - ERP  (2026-11-19)

## Corpus Check
- 296 files · ~171,972 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: (none) 10, .css 3, .example 2)

## Summary
- 2907 nodes · 10045 edges · 123 communities (107 shown, 16 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 478 edges (avg confidence: 0.84)
- Token cost: 256,812 input · 0 output

## Graph Freshness
- Built from commit: `91eb5c5b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Web: kirish va panel sahifalari
- Vazifalar xizmati va DB sxemasi
- LessonsService
- Ilova moduli va auth asoslari
- Web: kutubxona va tariflar sahifasi
- Guruhlar API
- TextInput
- .generate
- Vazifa va reyting API
- Controller yordamchilari
- Nest modullari
- .hasIn
- centers.service.ts
- Web: vazifalar
- Hisob-kitob motori
- Maosh API
- CI workflow
- devDependencies
- Deploy va progress hujjatlari
- Lokal Postgres va web lib
- Ro'yxat endpointlari
- Excel import
- money
- Public
- ImportsController
- reports.service.ts
- app-config.ts
- student-card.tsx
- Tariflar API
- Kurslar va reyting so'rovlari
- Audit API
- Spreadsheet o'quvchi
- To'lov taqsimlagich (FIFO)
- CurrentUser
- Xodimlar API
- CLAUDE.md qoidalari
- index.ts
- Filiallar API
- Chegirmalar API
- Hisoblar API
- Telegram xabar matnlari
- REJA: bozor va mahsulot
- ERD: moliya modeli
- group-card.tsx
- payroll-page.tsx
- Web package bog'liqliklari
- auth.service.ts
- To'lovlar API
- Markaz sozlamalari API
- notifications.schemas.ts
- Maosh motori
- writeAudit
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
- Xarajatlar xizmati
- lessons.schemas.ts
- users.service.ts
- ERD: implementatsiya eslatmalari
- groups.controller.ts
- Shared paket
- debtors.service.ts
- Deploy variantlari
- Vazifa e2e testlari
- Maosh e2e testlari
- Prod docker-compose
- Reyting sxemalari
- AssignmentsService
- .withContext
- Chegirma va qarzdorlar testlari
- Kichik klaster 79
- Kichik klaster 80
- api/package.json
- Kichik klaster 82
- Kichik klaster 83
- Kichik klaster 84
- Kichik klaster 85
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
- PayrollRulesService
- .create
- attendance.e2e-spec.ts
- Kichik klaster 99
- enrollments.e2e-spec.ts
- Kichik klaster 101
- Kichik klaster 102
- Kichik klaster 103
- Kichik klaster 104
- ProbeController
- Kichik klaster 106
- Kichik klaster 107
- Kichik klaster 108
- Kichik klaster 109
- Kichik klaster 110
- Kichik klaster 115
- app/page.tsx
- embedded-postgres
- @nestjs/mau@^0.2.6
- oxlint-tsgolint@^7.0.2001
- prettier@^3.4.2
- source-map-support@^0.5.21
- @types/supertest@^7.0.0

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 362 edges
2. `CurrentUser` - 147 edges
3. `Skeleton()` - 122 edges
4. `Tx` - 119 edges
5. `ClientInfo` - 118 edges
6. `@nestjs/common` - 106 edges
7. `Button()` - 102 edges
8. `useApi()` - 84 edges
9. `writeAudit()` - 83 edges
10. `DbService` - 74 edges

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

## Communities (123 total, 16 thin omitted)

### Community 0 - "Web: kirish va panel sahifalari"
Cohesion: 0.03
Nodes (84): LoginForm(), LoginPage(), metadata, instant, metadata, Page(), instant, metadata (+76 more)

### Community 1 - "Vazifalar xizmati va DB sxemasi"
Cohesion: 0.07
Nodes (69): AssignmentRow, homeworkPoints(), SubmissionRow, AuditEntry, GenerateOptions, ChargeRow, DiscountRow, Range (+61 more)

### Community 2 - "LessonsService"
Cohesion: 0.18
Nodes (9): daysBetween(), AttendanceQuery, bad(), conflict(), forbidden(), groupNotFound(), lessonNotFound(), LessonsService (+1 more)

### Community 3 - "Ilova moduli va auth asoslari"
Cohesion: 0.06
Nodes (56): AppModule, LOGIN_MAX_FAILURES, LOGIN_WINDOW_SECONDS, APP_CONFIG, AppConfig, DB, Db, DB_OPTIONS (+48 more)

### Community 4 - "Web: kutubxona va tariflar sahifasi"
Cohesion: 0.08
Nodes (42): Plan, instant, PanelLayout(), ERR, LogRow, TYPE, CenterSettings, BranchChecks() (+34 more)

### Community 5 - "Guruhlar API"
Cohesion: 0.14
Nodes (17): AssignTeacherInput, BILLING_KEYS, billingMode, CreateGroupInput, hhmm, ListGroupsQuery, price, ScheduleItem (+9 more)

### Community 6 - "TextInput"
Cohesion: 0.14
Nodes (57): CreateCenter, PlanDialog, AttendancePage(), Summary, BranchDialog, CourseDialog, Debtor, DebtorsPage() (+49 more)

### Community 7 - ".generate"
Cohesion: 0.10
Nodes (18): chunks(), clientOf(), EnrollmentsController, CreateEnrollmentInput, createEnrollmentSchema, LeaveEnrollmentInput, leaveEnrollmentSchema, ListEnrollmentsQuery (+10 more)

### Community 8 - "Vazifa va reyting API"
Cohesion: 0.10
Nodes (17): AcademicController, clientOf(), adjustRatingSchema, CreateAssignmentInput, createAssignmentSchema, GradeInput, gradeSchema, link (+9 more)

### Community 9 - "Controller yordamchilari"
Cohesion: 0.14
Nodes (33): uuid(), changePasswordSchema, loginSchema, refreshSchema, ClientInfo, AuthedRequest, UserRow, Roles() (+25 more)

### Community 10 - "Nest modullari"
Cohesion: 0.07
Nodes (23): AcademicModule, AppController, AppService, AuditModule, AuthModule, BillingModule, BranchesModule, CentersModule (+15 more)

### Community 11 - ".hasIn"
Cohesion: 0.33
Nodes (6): ListPeriodsQuery, forbidden(), locked(), PayrollService, periodNotFound(), periodView()

### Community 12 - "centers.service.ts"
Cohesion: 0.09
Nodes (24): generateTempPassword(), CreateCenterInput, ListCentersQuery, UpdateCenterInput, CreatedCenter, notFound(), SUPER, generateLogin() (+16 more)

### Community 13 - "Web: vazifalar"
Cohesion: 0.13
Nodes (67): Center, CentersPage(), EditCenter, Plan, STATUS, AssignmentsPage(), AssignmentCard(), Submissions() (+59 more)

### Community 14 - "Hisob-kitob motori"
Cohesion: 0.10
Nodes (38): BillingMode, ChargeDraft, ChargeKind, countLessons(), discountFor(), EngineContext, EngineDiscount, EngineEnrollment (+30 more)

### Community 15 - "Maosh API"
Cohesion: 0.09
Nodes (21): clientOf(), PayrollController, CreateAdjustmentInput, createAdjustmentSchema, CreatePayoutInput, createPayoutSchema, CreateRuleInput, createRuleSchema (+13 more)

### Community 16 - "CI workflow"
Cohesion: 0.05
Nodes (44): concurrency, cancel-in-progress, group, needs, runs-on, steps, timeout-minutes, POSTGRES_DB (+36 more)

### Community 17 - "devDependencies"
Cohesion: 0.10
Nodes (19): devDependencies, drizzle-kit@^0.31.11, @nestjs/cli@^12.0.0, @nestjs/testing@^12.0.1, oxlint@^1.58.0, supertest@^7.0.0, tsx@^4.23.15, @types/express@^5.0.0 (+11 more)

### Community 18 - "Deploy va progress hujjatlari"
Cohesion: 0.05
Nodes (38): Daily pg_dump backup and restore testing, DEPLOY.md deploy guide, Environment variables (DATABASE_URL, JWT secrets, TRUST_PROXY, CRON_SECRET, API_URL...), Local development (pg:local, db:migrate, dev:api, dev:web), Option 2: Neon + container hosting, First super admin bootstrap (create-super-admin.js), Telegram bot setup (BotFather, setWebhook with secret_token), Topology: Caddy -> web:3000 -> api:3001 -> db:5432 (+30 more)

### Community 19 - "Lokal Postgres va web lib"
Cohesion: 0.10
Nodes (29): dataDir, ensureRolesAndDb(), PG_LOCAL, startLocalPg(), superUrl(), POST(), POST(), BLOCKED (+21 more)

### Community 20 - "Ro'yxat endpointlari"
Cohesion: 0.09
Nodes (8): AuditController, listAuditSchema, RequirePermission(), CentersController, clientOf(), PlansController, ProbeController, ProbeController

### Community 21 - "Excel import"
Cohesion: 0.08
Nodes (23): clientOf(), flag, ListImportsQuery, RunImportInput, runImportSchema, UploadedFile, bad(), forbidden() (+15 more)

### Community 22 - "money"
Cohesion: 0.10
Nodes (34): Assignment, Balance, Dashboard(), DebtorRow, DebtorsPanel(), DeskView(), Group, METHOD (+26 more)

### Community 23 - "Public"
Cohesion: 0.17
Nodes (4): AuthController, clientOf(), AllowMustChangePassword(), Public()

### Community 25 - "reports.service.ts"
Cohesion: 0.14
Nodes (13): ReportsController, BRANCH_SORTS, BranchesQuery, branchesQuerySchema, OverviewQuery, overviewQuerySchema, range, AttendanceCounts (+5 more)

### Community 26 - "app-config.ts"
Cohesion: 0.15
Nodes (9): @nestjs/core@^12.0.1, ConfigModule, envSchema, loadConfig(), parseDuration(), parseTrustProxy(), UNIT_SECONDS, envFile (+1 more)

### Community 27 - "student-card.tsx"
Cohesion: 0.14
Nodes (15): Row, AttRow, Balance, Charge, CHARGE_STATUS, Discount, DiscountDialog(), TransferDialog() (+7 more)

### Community 28 - "Tariflar API"
Cohesion: 0.10
Nodes (14): clientOf(), CreatePlanInput, createPlanSchema, features, limit, UpdatePlanInput, updatePlanSchema, audited() (+6 more)

### Community 29 - "Kurslar va reyting so'rovlari"
Cohesion: 0.11
Nodes (14): clientOf(), CoursesController, CreateCourseInput, createCourseSchema, listCoursesSchema, price, UpdateCourseInput, updateCourseSchema (+6 more)

### Community 30 - "Audit API"
Cohesion: 0.10
Nodes (4): PermissionsService, BillingService, DbService, TelegramSender

### Community 31 - "Spreadsheet o'quvchi"
Cohesion: 0.12
Nodes (26): attrs(), BUILTIN_DATE_FMTS, colIndex(), corrupt(), dateStyles(), decode(), ENTITIES, excelSerialToIso() (+18 more)

### Community 32 - "To'lov taqsimlagich (FIFO)"
Cohesion: 0.17
Nodes (9): AllocatorService, audited(), forbidden(), paymentNotFound(), PaymentsService, studentNotFound(), inScope(), Tx (+1 more)

### Community 33 - "CurrentUser"
Cohesion: 0.07
Nodes (13): rankingQuerySchema, CurrentUser, listChargesSchema, DiscountsController, listDebtorsSchema, listEnrollmentsSchema, clientOf(), FinanceController (+5 more)

### Community 34 - "Xodimlar API"
Cohesion: 0.13
Nodes (6): clientOf(), StaffController, UserPasswordController, createStaffSchema, listStaffSchema, updateStaffSchema

### Community 35 - "CLAUDE.md qoidalari"
Cohesion: 0.09
Nodes (30): To'lov, maosh to'lovi, audit append-only, Byudjet $0, host-agnostik (Docker), Qarz saqlanmaydi, charges dan hisoblanadi, CLAUDE.md (loyiha ko'rsatmalari), Hujjatlarni o'qish tartibi, ORM: Drizzle, Qaror ERD dan chetga chiqsa avval hujjatni yangila, ERD hujjati model va ruxsatlar manbasi (+22 more)

### Community 36 - "index.ts"
Cohesion: 0.13
Nodes (11): client, db, login, client, permissions, client, db, PAYMENT_MODES (+3 more)

### Community 37 - "Filiallar API"
Cohesion: 0.12
Nodes (14): AuthUser, BranchesController, clientOf(), id(), CreateBranchInput, createBranchSchema, listBranchesSchema, phone (+6 more)

### Community 38 - "Chegirmalar API"
Cohesion: 0.14
Nodes (11): clientOf(), CreateDiscountInput, createDiscountSchema, endDiscountSchema, reason, audited(), discountNotFound(), DiscountsService (+3 more)

### Community 39 - "Hisoblar API"
Cohesion: 0.12
Nodes (13): BillingController, clientOf(), cancelChargeSchema, CreateManualChargeInput, createManualChargeSchema, generateBillingSchema, ListChargesQuery, money (+5 more)

### Community 40 - "Telegram xabar matnlari"
Cohesion: 0.09
Nodes (22): Candidate, Row, RunSummary, SQLText, badCodeMessage(), debtMessage(), formatSom(), hashLinkCode() (+14 more)

### Community 41 - "REJA: bozor va mahsulot"
Cohesion: 0.09
Nodes (24): Audit jurnali: kim, nima, qachon, oldingi/keyingi, Auth: argon2, JWT + refresh, 2FA, Raqobatchilar: SchoolupCRM, UstozCRM, ALFA CRM, Umai CRM, Shaxsiy ma'lumotlar qonuni (lokalizatsiya), Tashkilot > filial > guruh > o'quvchi, Birinchi 7 kunda 5 amaliy qadam, Bepul infra cheklovlari (Neon/Supabase, Render, Fly.io), 5-10 rahbar bilan suhbat (birinchi vazifa) (+16 more)

### Community 42 - "ERD: moliya modeli"
Cohesion: 0.11
Nodes (21): audit_logs table, charges table, ERD: charges, payments, allocations, expenses, ERD: payroll, notifications, import, expenses table (ACTIVE->VOIDED), Cash-basis finance report (step 17), Student Excel import (import_jobs, step 19), Overview and branch compare reports (step 18) (+13 more)

### Community 43 - "group-card.tsx"
Cohesion: 0.14
Nodes (19): AttStatus, BILLING_MODE, Group, GROUP_STATUS, Lesson, mainTeacher(), OPTIONS, scheduleBody() (+11 more)

### Community 44 - "payroll-page.tsx"
Cohesion: 0.14
Nodes (14): instant, metadata, Page(), Adjustment, Employee, Item, Payout, PayrollPage() (+6 more)

### Community 45 - "Web package bog'liqliklari"
Cohesion: 0.07
Nodes (32): eslintConfig, dependencies, next@16.4.6, react@19.3.0, react-dom@19.3.0, devDependencies, eslint@^9, eslint-config-next@16.4.6 (+24 more)

### Community 46 - "auth.service.ts"
Cohesion: 0.07
Nodes (19): accountInactive(), AuthService, centerBlocked(), invalidCredentials(), invalidRefresh(), LoginResult, AccessClaims, SessionRow (+11 more)

### Community 47 - "To'lovlar API"
Cohesion: 0.13
Nodes (8): clientOf(), PaymentsController, CreatePaymentInput, createPaymentSchema, ListPaymentsQuery, listPaymentsSchema, note, reversePaymentSchema

### Community 48 - "Markaz sozlamalari API"
Cohesion: 0.13
Nodes (6): CenterSettingsController, clientOf(), UpdateCenterSettingsInput, updateCenterSettingsSchema, CenterSettingsService, effectiveSettings()

### Community 49 - "notifications.schemas.ts"
Cohesion: 0.09
Nodes (15): DispatchService, emptySummary(), clientOf(), NotificationsController, safeEqual(), ListNotificationsQuery, NOTIFICATION_TYPES, RUN_TYPES (+7 more)

### Community 50 - "Maosh motori"
Cohesion: 0.16
Nodes (17): attachedGroups(), Attachment, EngineRule, fmt(), GroupBase, LessonCount, monthEndOf(), monthStartOf() (+9 more)

### Community 51 - "writeAudit"
Cohesion: 0.14
Nodes (16): writeAudit(), branchScope(), teacherStudentIds(), birthDate, CreateStudentInput, ListStudentsQuery, login, phone (+8 more)

### Community 52 - "O'quvchilar API"
Cohesion: 0.17
Nodes (4): clientOf(), StudentsController, createStudentSchema, listStudentsSchema

### Community 53 - "API tsconfig"
Cohesion: 0.10
Nodes (20): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+12 more)

### Community 54 - "Demo seed skripti"
Cohesion: 0.12
Nodes (16): activate(), call(), femaleish, first, groups, groupsDef, last, logins (+8 more)

### Community 55 - "API skriptlari"
Cohesion: 0.11
Nodes (19): scripts, build, db:create-super-admin, db:generate, db:migrate, db:seed, deploy, format (+11 more)

### Community 56 - "Telegram e2e testlari"
Cohesion: 0.10
Nodes (14): HttpTelegramSender, SendResult, activate(), Api, Center, config, FakeSender, makeApi() (+6 more)

### Community 57 - "Ruxsatlarni boshqarish API"
Cohesion: 0.13
Nodes (8): clientOf(), PermissionsAdminController, roleParamSchema, setRolePermissionsSchema, setUserPermissionsSchema, assertConfigurable(), PermissionsAdminService, TenantRole

### Community 58 - "Web tsconfig"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 59 - "Dev docker-compose"
Cohesion: 0.11
Nodes (17): environment, healthcheck, image, ports, restart, volumes, POSTGRES_DB, POSTGRES_PASSWORD (+9 more)

### Community 60 - "API bog'liqliklari"
Cohesion: 0.12
Nodes (17): dependencies, drizzle-orm@^0.45.4, @erp/shared@workspace:*, @nestjs/common@^12.0.1, @nestjs/jwt@^12.0.5, @nestjs/platform-express@^12.0.1, @node-rs/argon2@^2.2.2, postgres@^4.1.1 (+9 more)

### Community 61 - "Smoke test skripti"
Cohesion: 0.12
Nodes (14): branch, c, charges, course, enr, first, group, lesson (+6 more)

### Community 62 - "Root package.json"
Cohesion: 0.12
Nodes (16): engines, node, name, packageManager, private, scripts, build, db:create-super-admin (+8 more)

### Community 63 - "PROGRESS: arxitektura qarorlari"
Cohesion: 0.13
Nodes (16): Billing engine planCharges() pure function, Debt computed from open charges past due_date + grace_days, Effective permission = user_permissions override > center_role_permissions > deny, FIFO payment allocator with advance balance, Guard chain JwtAuthGuard -> RolesGuard -> PermissionsGuard, Payroll engine (FIXED, PER_GROUP, PER_LESSON, PERCENT), Permission matrix in packages/shared/src/permission-matrix.ts, Step 13: billing charges and enrollment_freezes (+8 more)

### Community 64 - "Xarajatlar xizmati"
Cohesion: 0.16
Nodes (11): expenses, audited(), ExpenseRow, ExpensesService, forbidden(), notFound(), category, CreateExpenseInput (+3 more)

### Community 65 - "lessons.schemas.ts"
Cohesion: 0.11
Nodes (14): clientOf(), LessonsController, ATTENDANCE_STATUSES, attendanceQuerySchema, AttendanceStatus, CreateLessonInput, createLessonSchema, ListLessonsQuery (+6 more)

### Community 66 - "users.service.ts"
Cohesion: 0.13
Nodes (18): isLoginConflict(), teacherProfiles, branchIds, CreateStaffInput, ListStaffQuery, login, phone, STAFF_ROLES (+10 more)

### Community 67 - "ERD: implementatsiya eslatmalari"
Cohesion: 0.09
Nodes (21): ERD va ruxsatlar matritsasi, GET /auth/me effective permissions for UI, Center blocking/unblocking, Center creation POST /admin/centers (single transaction), center_role_permissions (role template), centers table, centers_guard_platform_columns trigger, ERD: tenant, branch, users, permissions (+13 more)

### Community 68 - "groups.controller.ts"
Cohesion: 0.16
Nodes (9): clientOf(), GroupsController, id(), assignTeacherSchema, createGroupSchema, endTeacherSchema, listGroupsSchema, setScheduleSchema (+1 more)

### Community 69 - "Shared paket"
Cohesion: 0.18
Nodes (10): devDependencies, typescript@^5.9.3, main, name, private, scripts, build, test (+2 more)

### Community 70 - "debtors.service.ts"
Cohesion: 0.16
Nodes (10): DebtorRow, DebtorsService, forbidden(), GroupRow, ListDebtorsQuery, rowsOf(), FinanceReportService, forbidden() (+2 more)

### Community 71 - "Deploy variantlari"
Cohesion: 0.14
Nodes (12): 1-variant: bitta VPS + Docker Compose (tavsiya), 2-variant: boshqariladigan xizmatlar (Neon + konteyner hosting), Avtomatik eslatmalar (cron), Deploy qo'llanmasi, Lokal ishlab chiqish, Muhit o'zgaruvchilari, Tekshirish, Telegram bot (+4 more)

### Community 72 - "Vazifa e2e testlari"
Cohesion: 0.23
Nodes (12): activate(), Api, Center, config, FUTURE, makeApi(), mkStudent(), newCenter() (+4 more)

### Community 73 - "Maosh e2e testlari"
Cohesion: 0.21
Nodes (11): activate(), Api, Center, config, M, makeApi(), newCenter(), NEXT (+3 more)

### Community 74 - "Prod docker-compose"
Cohesion: 0.17
Nodes (13): condition, context, dockerfile, api, API_URL, WEB_SECURE_COOKIES, build, web (+5 more)

### Community 75 - "Reyting sxemalari"
Cohesion: 0.23
Nodes (9): AdjustRatingInput, RankingQuery, RatingEventsQuery, ATTENDANCE_POINTS, forbidden(), nf(), RankRow, RatingsService (+1 more)

### Community 76 - "AssignmentsService"
Cohesion: 0.28
Nodes (6): ListAssignmentsQuery, AssignmentsService, conflict(), forbidden(), isLate(), notFound()

### Community 77 - ".withContext"
Cohesion: 0.22
Nodes (3): LoginThrottle, CentersService, inCenter()

### Community 78 - "Chegirma va qarzdorlar testlari"
Cohesion: 0.26
Nodes (11): activate(), Api, Center, ChargeView, config, daysAgo(), makeApi(), mkStudent() (+3 more)

### Community 79 - "Kichik klaster 79"
Cohesion: 0.17
Nodes (12): environment, CRON_SECRET, DATABASE_URL, JWT_ACCESS_SECRET, JWT_ACCESS_TTL, JWT_REFRESH_SECRET, JWT_REFRESH_TTL, NODE_ENV (+4 more)

### Community 80 - "Kichik klaster 80"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), Row (+2 more)

### Community 81 - "api/package.json"
Cohesion: 0.12
Nodes (15): author, description, @electric-sql/pglite@^0.5.16, @nestjs/schematics@^12.0.0, vite@^8.0.0, @vitest/coverage-v8@^4.1.2, license, name (+7 more)

### Community 82 - "Kichik klaster 82"
Cohesion: 0.18
Nodes (14): hashPassword(), PARAMS, verifyAgainstDummy(), verifyPassword(), activate(), Api, Center, config (+6 more)

### Community 83 - "Kichik klaster 83"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, ChargeView, config, makeApi(), mkStudent(), newCenter() (+2 more)

### Community 84 - "Kichik klaster 84"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+2 more)

### Community 85 - "Kichik klaster 85"
Cohesion: 0.33
Nodes (9): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+1 more)

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
Cohesion: 0.41
Nodes (10): AssignmentDialog, GradeDialog, MySubmission(), Assignment, LinkItem, Submission, cleanLinks(), LinkList() (+2 more)

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

### Community 96 - "PayrollRulesService"
Cohesion: 0.37
Nodes (5): audited(), bad(), forbidden(), PayrollRulesService, ruleNotFound()

### Community 97 - ".create"
Cohesion: 0.32
Nodes (4): audited(), forbidden(), payoutNotFound(), PayoutsService

### Community 98 - "attendance.e2e-spec.ts"
Cohesion: 0.33
Nodes (9): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+1 more)

### Community 99 - "Kichik klaster 99"
Cohesion: 0.29
Nodes (6): compilerOptions, rootDir, exclude, extends, include, ./tsconfig.json

### Community 100 - "enrollments.e2e-spec.ts"
Cohesion: 0.33
Nodes (9): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+1 more)

### Community 101 - "Kichik klaster 101"
Cohesion: 0.29
Nodes (4): geistMono, metadata, onest, viewport

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

### Community 108 - "Kichik klaster 108"
Cohesion: 0.67
Nodes (3): ChangePasswordForm(), ChangePasswordPage(), metadata

### Community 116 - "app/page.tsx"
Cohesion: 0.32
Nodes (6): Action(), FEATURES, Landing(), metadata, ROLES, SessionAction()

## Knowledge Gaps
- **46 isolated node(s):** `./tsconfig.json`, `Open questions: cross-branch names in rating, SaaS subscription billing`, `Daily pg_dump backup and restore testing`, `Environment variables (DATABASE_URL, JWT secrets, TRUST_PROXY, CRON_SECRET, API_URL...)`, `Option 2: Neon + container hosting` (+41 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 858 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Web: kirish va panel sahifalari` to `Web: kutubxona va tariflar sahifasi`, `Kichik klaster 101`, `TextInput`, `Kichik klaster 107`, `Kichik klaster 108`, `Web package bog'liqliklari`, `group-card.tsx`, `payroll-page.tsx`, `Kichik klaster 109`, `Lokal Postgres va web lib`, `app/page.tsx`, `money`, `Kichik klaster 88`, `assignment-card.tsx`, `student-card.tsx`?**
  _High betweenness centrality (0.223) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `Open questions: cross-branch names in rating, SaaS subscription billing`, `Daily pg_dump backup and restore testing` to the rest of the system?**
  _46 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Web: kirish va panel sahifalari` be split into smaller, more focused modules?**
  _Cohesion score 0.03109072375127421 - nodes in this community are weakly interconnected._
- **Why does `AuthUser` connect `Filiallar API` to `Vazifalar xizmati va DB sxemasi`, `LessonsService`, `Guruhlar API`, `.generate`, `Vazifa va reyting API`, `Controller yordamchilari`, `.hasIn`, `centers.service.ts`, `Maosh API`, `Ro'yxat endpointlari`, `Excel import`, `Public`, `ImportsController`, `reports.service.ts`, `Tariflar API`, `Kurslar va reyting so'rovlari`, `To'lov taqsimlagich (FIFO)`, `CurrentUser`, `Xodimlar API`, `Chegirmalar API`, `Hisoblar API`, `auth.service.ts`, `To'lovlar API`, `Markaz sozlamalari API`, `notifications.schemas.ts`, `writeAudit`, `O'quvchilar API`, `Ruxsatlarni boshqarish API`, `Xarajatlar xizmati`, `lessons.schemas.ts`, `users.service.ts`, `groups.controller.ts`, `debtors.service.ts`, `Reyting sxemalari`, `AssignmentsService`, `.withContext`, `Kichik klaster 82`, `PayrollRulesService`, `.create`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Should `Vazifalar xizmati va DB sxemasi` be split into smaller, more focused modules?**
  _Cohesion score 0.06853303471444569 - nodes in this community are weakly interconnected._
- **Why does `@nestjs/common` connect `Nest modullari` to `Vazifalar xizmati va DB sxemasi`, `Ilova moduli va auth asoslari`, `Controller yordamchilari`, `centers.service.ts`, `Hisob-kitob motori`, `Ro'yxat endpointlari`, `reports.service.ts`, `app-config.ts`, `Tariflar API`, `Kurslar va reyting so'rovlari`, `index.ts`, `Filiallar API`, `Telegram xabar matnlari`, `auth.service.ts`, `writeAudit`, `Telegram e2e testlari`, `Ruxsatlarni boshqarish API`, `API bog'liqliklari`, `Xarajatlar xizmati`, `users.service.ts`, `groups.controller.ts`, `debtors.service.ts`, `Vazifa e2e testlari`, `Maosh e2e testlari`, `Reyting sxemalari`, `Chegirma va qarzdorlar testlari`, `Kichik klaster 80`, `api/package.json`, `Kichik klaster 82`, `Kichik klaster 83`, `Kichik klaster 84`, `Kichik klaster 85`, `attendance.e2e-spec.ts`, `enrollments.e2e-spec.ts`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `Ilova moduli va auth asoslari` be split into smaller, more focused modules?**
  _Cohesion score 0.0645045045045045 - nodes in this community are weakly interconnected._