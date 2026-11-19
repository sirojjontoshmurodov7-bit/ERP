# Graph Report - ERP  (2026-11-19)

## Corpus Check
- 158 files · ~171,099 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2914 nodes · 9672 edges · 116 communities (104 shown, 12 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 411 edges (avg confidence: 0.84)
- Token cost: 256,812 input · 0 output

## Community Hubs (Navigation)
- Web: kirish va panel sahifalari
- Vazifalar xizmati va DB sxemasi
- Davomat va o'quvchilar xizmati
- Ilova moduli va auth asoslari
- Web: kutubxona va tariflar sahifasi
- Guruhlar API
- Web: platforma markazlari
- Yozilish va muzlatish
- Vazifa va reyting API
- Controller yordamchilari
- Nest modullari
- Maosh xizmati va DB
- Audit va markaz yaratish
- Web: vazifalar
- Hisob-kitob motori
- Maosh API
- CI workflow
- API package va drizzle config
- Deploy va progress hujjatlari
- Lokal Postgres va web lib
- Ro'yxat endpointlari
- Excel import
- Web: bosh sahifa
- Auth controller
- Yozilish API
- Hisobotlar va tenant kontekst
- Login cheklovi va konfiguratsiya
- Web: davomat sahifasi
- Tariflar API
- Kurslar va reyting so'rovlari
- Audit API
- Spreadsheet o'quvchi
- To'lov taqsimlagich (FIFO)
- Moliya API
- Xodimlar API
- CLAUDE.md qoidalari
- Ruxsat matritsasi va tokenlar
- Filiallar API
- Chegirmalar API
- Hisoblar API
- Telegram xabar matnlari
- REJA: bozor va mahsulot
- ERD: moliya modeli
- Web: guruhlar ro'yxati
- Web: maosh sahifasi
- Web package bog'liqliklari
- JWT guardlar
- To'lovlar API
- Markaz sozlamalari API
- Bildirishnomalar API
- Maosh motori
- ERD: tenant va o'quv modeli
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
- Darslar controller
- Eslatmalar dispatcheri
- ERD: implementatsiya eslatmalari
- Health endpoint
- Shared paket
- Hisoblar xizmati
- Deploy variantlari
- Vazifa e2e testlari
- Maosh e2e testlari
- Prod docker-compose
- Reyting sxemalari
- Bildirishnomalar xizmati
- Ruxsatlar xizmati
- Chegirma va qarzdorlar testlari
- Kichik klaster 79
- Kichik klaster 80
- Kichik klaster 81
- Kichik klaster 82
- Kichik klaster 83
- Kichik klaster 84
- Kichik klaster 85
- Kichik klaster 86
- Kichik klaster 87
- Kichik klaster 88
- Kichik klaster 89
- Kichik klaster 90
- Kichik klaster 91
- Kichik klaster 92
- Kichik klaster 93
- Kichik klaster 94
- Kichik klaster 95
- Kichik klaster 96
- Kichik klaster 97
- Kichik klaster 98
- Kichik klaster 99
- Kichik klaster 100
- Kichik klaster 101
- Kichik klaster 102
- Kichik klaster 103
- Kichik klaster 104
- Kichik klaster 105
- Kichik klaster 106
- Kichik klaster 107
- Kichik klaster 108
- Kichik klaster 109
- Kichik klaster 110
- Kichik klaster 115

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 268 edges
2. `CurrentUser` - 123 edges
3. `Skeleton()` - 122 edges
4. `ClientInfo` - 118 edges
5. `@nestjs/common` - 106 edges
6. `Button()` - 102 edges
7. `Tx` - 85 edges
8. `useApi()` - 84 edges
9. `DataView()` - 72 edges
10. `drizzle-orm` - 66 edges

## Surprising Connections (you probably didn't know these)
- `CLAUDE.md (loyiha ko'rsatmalari)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → packages/shared/package.json
- `Backend: NestJS modulli monolit` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → packages/shared/package.json
- `Frontend: Next.js (React)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → packages/shared/package.json
- `typescript@^5` --declares--> `typescript`  [EXTRACTED]
  apps/web/package.json → packages/shared/package.json
- `AuthUser` --references--> `Role`  [EXTRACTED]
  apps/api/src/auth/auth.types.ts → packages/shared/src/index.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Billing and payment ledger flow** — erd_va_ruxsatlar_charge_generation, erd_va_ruxsatlar_charges, erd_va_ruxsatlar_payments, erd_va_ruxsatlar_payment_allocations, erd_va_ruxsatlar_payment_reversal, erd_va_ruxsatlar_debt_computed_not_stored [EXTRACTED 1.00]
- **Effective permission model (template + exceptions + scope + guards)** — erd_va_ruxsatlar_center_role_permissions, erd_va_ruxsatlar_user_permissions, erd_va_ruxsatlar_scope_filter, erd_va_ruxsatlar_guard_chain, packages_shared_src_permission_matrix, erd_va_ruxsatlar_permission_matrix [EXTRACTED 1.00]
- **Tenant isolation mechanisms** — erd_va_ruxsatlar_rls_tenant_isolation, erd_va_ruxsatlar_cross_center_composite_fk, erd_va_ruxsatlar_security_definer_auth_functions, erd_va_ruxsatlar_centers_guard_platform_columns, apps_api_test_tenant_isolation_e2e_spec [INFERRED 0.85]
- **Billing -> payments -> debt money flow** — progress_billing_engine_plancharges, progress_fifo_allocator, progress_debt_computation, progress_append_only_ledger [INFERRED 0.85]
- **Tenant isolation mechanisms** — progress_rls_tenant_context, progress_composite_fk_pattern, progress_security_definer_functions, progress_branch_scope_helper [INFERRED 0.85]
- **Authentication and request security** — progress_auth_jwt_refresh, progress_guard_chain, progress_login_throttle_db, progress_bff_architecture [INFERRED 0.85]

## Communities (116 total, 12 thin omitted)

### Community 0 - "Web: kirish va panel sahifalari"
Cohesion: 0.03
Nodes (89): LoginForm(), LoginPage(), metadata, instant, metadata, Page(), instant, metadata (+81 more)

### Community 1 - "Vazifalar xizmati va DB sxemasi"
Cohesion: 0.07
Nodes (76): AssignmentRow, homeworkPoints(), SubmissionRow, ATTENDANCE_POINTS, RankRow, TZ, AuditEntry, listAuditSchema (+68 more)

### Community 2 - "Davomat va o'quvchilar xizmati"
Cohesion: 0.06
Nodes (25): audited(), CoursesService, forbidden(), nameTaken(), notFound(), clientOf(), LessonsController, bad() (+17 more)

### Community 3 - "Ilova moduli va auth asoslari"
Cohesion: 0.05
Nodes (58): AppModule, hashPassword(), PARAMS, verifyAgainstDummy(), verifyPassword(), client, db, login (+50 more)

### Community 4 - "Web: kutubxona va tariflar sahifasi"
Cohesion: 0.07
Nodes (44): Plan, Assignment, LinkItem, Submission, instant, PanelLayout(), ERR, LogRow (+36 more)

### Community 5 - "Guruhlar API"
Cohesion: 0.09
Nodes (24): clientOf(), GroupsController, AssignTeacherInput, assignTeacherSchema, BILLING_KEYS, billingMode, CreateGroupInput, createGroupSchema (+16 more)

### Community 6 - "Web: platforma markazlari"
Cohesion: 0.13
Nodes (57): Center, CentersPage(), CreateCenter, EditCenter, Plan, STATUS, PlanDialog, AssignmentDialog (+49 more)

### Community 7 - "Yozilish va muzlatish"
Cohesion: 0.09
Nodes (25): chunks(), branchScope(), generateLogin(), isLoginConflict(), MAX_LOGIN_TRIES, Tx, teacherProfiles, bad() (+17 more)

### Community 8 - "Vazifa va reyting API"
Cohesion: 0.08
Nodes (23): AcademicController, clientOf(), adjustRatingSchema, CreateAssignmentInput, createAssignmentSchema, GradeInput, gradeSchema, link (+15 more)

### Community 9 - "Controller yordamchilari"
Cohesion: 0.11
Nodes (34): uuid(), changePasswordSchema, loginSchema, refreshSchema, ALLOW_MUST_CHANGE, AllowMustChangePassword(), IS_PUBLIC, PERMISSIONS_KEY (+26 more)

### Community 10 - "Nest modullari"
Cohesion: 0.08
Nodes (20): AcademicModule, AuditModule, AuthModule, BillingModule, BranchesModule, CentersModule, CoursesModule, EnrollmentsModule (+12 more)

### Community 11 - "Maosh xizmati va DB"
Cohesion: 0.09
Nodes (26): lessons, payrollAdjustments, payrollItems, payrollPayouts, payrollPeriods, payrollRules, audited(), forbidden() (+18 more)

### Community 12 - "Audit va markaz yaratish"
Cohesion: 0.09
Nodes (27): writeAudit(), ClientInfo, generateTempPassword(), audited(), BranchesService, nameTaken(), notFound(), view() (+19 more)

### Community 13 - "Web: vazifalar"
Cohesion: 0.16
Nodes (49): AssignmentsPage(), AssignmentCard(), MySubmission(), Submissions(), BranchesPage(), CoursesPage(), StudentView(), GroupCard() (+41 more)

### Community 14 - "Hisob-kitob motori"
Cohesion: 0.10
Nodes (38): BillingMode, ChargeDraft, ChargeKind, countLessons(), discountFor(), EngineContext, EngineDiscount, EngineEnrollment (+30 more)

### Community 15 - "Maosh API"
Cohesion: 0.09
Nodes (21): clientOf(), PayrollController, CreateAdjustmentInput, createAdjustmentSchema, CreatePayoutInput, createPayoutSchema, CreateRuleInput, createRuleSchema (+13 more)

### Community 16 - "CI workflow"
Cohesion: 0.05
Nodes (44): concurrency, cancel-in-progress, group, needs, runs-on, steps, timeout-minutes, POSTGRES_DB (+36 more)

### Community 17 - "API package va drizzle config"
Cohesion: 0.06
Nodes (42): author, description, devDependencies, drizzle-kit@^0.31.11, @electric-sql/pglite@^0.5.16, embedded-postgres@17.11.0-beta.19, @nestjs/cli@^12.0.0, @nestjs/mau@^0.2.6 (+34 more)

### Community 18 - "Deploy va progress hujjatlari"
Cohesion: 0.05
Nodes (38): Daily pg_dump backup and restore testing, DEPLOY.md deploy guide, Environment variables (DATABASE_URL, JWT secrets, TRUST_PROXY, CRON_SECRET, API_URL...), Local development (pg:local, db:migrate, dev:api, dev:web), Option 2: Neon + container hosting, First super admin bootstrap (create-super-admin.js), Telegram bot setup (BotFather, setWebhook with secret_token), Topology: Caddy -> web:3000 -> api:3001 -> db:5432 (+30 more)

### Community 19 - "Lokal Postgres va web lib"
Cohesion: 0.10
Nodes (29): dataDir, ensureRolesAndDb(), PG_LOCAL, startLocalPg(), superUrl(), POST(), POST(), BLOCKED (+21 more)

### Community 20 - "Ro'yxat endpointlari"
Cohesion: 0.09
Nodes (6): RequirePermission(), CentersController, clientOf(), ProbeController, ProbeController, ProbeController

### Community 21 - "Excel import"
Cohesion: 0.08
Nodes (22): clientOf(), flag, ListImportsQuery, RunImportInput, runImportSchema, UploadedFile, bad(), forbidden() (+14 more)

### Community 22 - "Web: bosh sahifa"
Cohesion: 0.10
Nodes (36): Assignment, Balance, Dashboard(), DebtorRow, DebtorsPanel(), DeskView(), Group, METHOD (+28 more)

### Community 23 - "Auth controller"
Cohesion: 0.09
Nodes (8): AuthController, clientOf(), accountInactive(), AuthService, centerBlocked(), invalidCredentials(), invalidRefresh(), LoginThrottle

### Community 24 - "Yozilish API"
Cohesion: 0.10
Nodes (15): AuthUser, clientOf(), EnrollmentsController, CreateEnrollmentInput, createEnrollmentSchema, LeaveEnrollmentInput, leaveEnrollmentSchema, ListEnrollmentsQuery (+7 more)

### Community 25 - "Hisobotlar va tenant kontekst"
Cohesion: 0.10
Nodes (20): TenantContext, rowsOf(), FinanceReportService, forbidden(), num(), ReportQuery, Row, RunSummary (+12 more)

### Community 26 - "Login cheklovi va konfiguratsiya"
Cohesion: 0.08
Nodes (16): LOGIN_MAX_FAILURES, LOGIN_WINDOW_SECONDS, APP_CONFIG, AppConfig, ConfigModule, envSchema, loadConfig(), parseDuration() (+8 more)

### Community 27 - "Web: davomat sahifasi"
Cohesion: 0.15
Nodes (29): AttendancePage(), Row, Summary, Debtor, DebtorsPage(), Expense, ExpensesPage(), monthStart() (+21 more)

### Community 28 - "Tariflar API"
Cohesion: 0.09
Nodes (13): clientOf(), PlansController, CreatePlanInput, createPlanSchema, features, limit, UpdatePlanInput, updatePlanSchema (+5 more)

### Community 29 - "Kurslar va reyting so'rovlari"
Cohesion: 0.10
Nodes (12): rankingQuerySchema, CurrentUser, clientOf(), CoursesController, id(), CreateCourseInput, createCourseSchema, listCoursesSchema (+4 more)

### Community 30 - "Audit API"
Cohesion: 0.09
Nodes (7): AuditController, PermissionsService, BillingService, DebtorsService, forbidden(), ListDebtorsQuery, DbService

### Community 31 - "Spreadsheet o'quvchi"
Cohesion: 0.12
Nodes (26): attrs(), BUILTIN_DATE_FMTS, colIndex(), corrupt(), dateStyles(), decode(), ENTITIES, excelSerialToIso() (+18 more)

### Community 32 - "To'lov taqsimlagich (FIFO)"
Cohesion: 0.15
Nodes (9): AllocatorService, CreatePaymentInput, ListPaymentsQuery, audited(), forbidden(), paymentNotFound(), PaymentsService, studentNotFound() (+1 more)

### Community 33 - "Moliya API"
Cohesion: 0.11
Nodes (13): daysBetween(), clientOf(), FinanceController, category, CreateExpenseInput, createExpenseSchema, ListExpensesQuery, listExpensesSchema (+5 more)

### Community 34 - "Xodimlar API"
Cohesion: 0.10
Nodes (11): clientOf(), StaffController, UserPasswordController, branchIds, createStaffSchema, listStaffSchema, login, phone (+3 more)

### Community 35 - "CLAUDE.md qoidalari"
Cohesion: 0.10
Nodes (28): To'lov, maosh to'lovi, audit append-only, Byudjet $0, host-agnostik (Docker), Qarz saqlanmaydi, charges dan hisoblanadi, CLAUDE.md (loyiha ko'rsatmalari), Hujjatlarni o'qish tartibi, ORM: Drizzle, Qaror ERD dan chetga chiqsa avval hujjatni yangila, ERD hujjati model va ruxsatlar manbasi (+20 more)

### Community 36 - "Ruxsat matritsasi va tokenlar"
Cohesion: 0.10
Nodes (19): permissions, client, db, activate(), AllPermissionsProbe, config, newCenter(), PAYMENT_MODES (+11 more)

### Community 37 - "Filiallar API"
Cohesion: 0.13
Nodes (9): BranchesController, clientOf(), id(), CreateBranchInput, createBranchSchema, listBranchesSchema, phone, UpdateBranchInput (+1 more)

### Community 38 - "Chegirmalar API"
Cohesion: 0.14
Nodes (11): clientOf(), CreateDiscountInput, createDiscountSchema, endDiscountSchema, reason, audited(), discountNotFound(), DiscountsService (+3 more)

### Community 39 - "Hisoblar API"
Cohesion: 0.13
Nodes (10): BillingController, clientOf(), cancelChargeSchema, CreateManualChargeInput, createManualChargeSchema, generateBillingSchema, ListChargesQuery, listChargesSchema (+2 more)

### Community 40 - "Telegram xabar matnlari"
Cohesion: 0.17
Nodes (15): badCodeMessage(), debtMessage(), formatSom(), hashLinkCode(), helpMessage(), homeworkMessage(), lessonMessage(), LINK_CODE_LENGTH (+7 more)

### Community 41 - "REJA: bozor va mahsulot"
Cohesion: 0.09
Nodes (24): Audit jurnali: kim, nima, qachon, oldingi/keyingi, Auth: argon2, JWT + refresh, 2FA, Raqobatchilar: SchoolupCRM, UstozCRM, ALFA CRM, Umai CRM, Shaxsiy ma'lumotlar qonuni (lokalizatsiya), Tashkilot > filial > guruh > o'quvchi, Birinchi 7 kunda 5 amaliy qadam, Bepul infra cheklovlari (Neon/Supabase, Render, Fly.io), 5-10 rahbar bilan suhbat (birinchi vazifa) (+16 more)

### Community 42 - "ERD: moliya modeli"
Cohesion: 0.12
Nodes (20): audit_logs table, charges table, ERD: charges, payments, allocations, expenses, ERD: payroll, notifications, import, expenses table (ACTIVE->VOIDED), Cash-basis finance report (step 17), Student Excel import (import_jobs, step 19), Overview and branch compare reports (step 18) (+12 more)

### Community 43 - "Web: guruhlar ro'yxati"
Cohesion: 0.22
Nodes (18): CreateGroup, GroupsList(), instant, metadata, Page(), AttStatus, BILLING_MODE, Group (+10 more)

### Community 44 - "Web: maosh sahifasi"
Cohesion: 0.12
Nodes (20): Adjustment, Employee, Item, Payout, Period, PERIOD_STATUS, Rule, RULE_TYPE (+12 more)

### Community 45 - "Web package bog'liqliklari"
Cohesion: 0.12
Nodes (20): @types/node@^24.0.0, @types/node, eslintConfig, devDependencies, eslint@^9, eslint-config-next@16.4.6, @types/node@^20, @types/react@^19 (+12 more)

### Community 46 - "JWT guardlar"
Cohesion: 0.10
Nodes (5): JwtAuthGuard, PermissionsGuard, RolesGuard, unauthorized(), TokenService

### Community 47 - "To'lovlar API"
Cohesion: 0.16
Nodes (7): clientOf(), id(), PaymentsController, createPaymentSchema, listPaymentsSchema, note, reversePaymentSchema

### Community 48 - "Markaz sozlamalari API"
Cohesion: 0.12
Nodes (6): CenterSettingsController, clientOf(), UpdateCenterSettingsInput, updateCenterSettingsSchema, CenterSettingsService, effectiveSettings()

### Community 50 - "Maosh motori"
Cohesion: 0.16
Nodes (17): attachedGroups(), Attachment, EngineRule, fmt(), GroupBase, LessonCount, monthEndOf(), monthStartOf() (+9 more)

### Community 51 - "ERD: tenant va o'quv modeli"
Cohesion: 0.10
Nodes (17): ERD va ruxsatlar matritsasi, Attendance lesson lock (attendance_lock_days, edit_past), centers table, centers_guard_platform_columns trigger, enrollments table, ERD: groups, enrollments, attendance, homework, rating, grace_days (center default copied into group), Homework and rating rules (step 20) (+9 more)

### Community 52 - "O'quvchilar API"
Cohesion: 0.16
Nodes (5): clientOf(), StudentsController, createStudentSchema, listStudentsSchema, updateStudentSchema

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
Cohesion: 0.15
Nodes (13): SendResult, activate(), Api, Center, config, FakeSender, makeApi(), mkStudent() (+5 more)

### Community 57 - "Ruxsatlarni boshqarish API"
Cohesion: 0.18
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

### Community 64 - "Xarajatlar xizmati"
Cohesion: 0.32
Nodes (5): branchFilter(), audited(), ExpensesService, forbidden(), notFound()

### Community 65 - "Darslar controller"
Cohesion: 0.17
Nodes (13): ATTENDANCE_STATUSES, AttendanceQuery, attendanceQuerySchema, AttendanceStatus, CreateLessonInput, createLessonSchema, ListLessonsQuery, listLessonsSchema (+5 more)

### Community 66 - "Eslatmalar dispatcheri"
Cohesion: 0.16
Nodes (5): DispatchService, emptySummary(), safeEqual(), RunInput, runSchema

### Community 67 - "ERD: implementatsiya eslatmalari"
Cohesion: 0.15
Nodes (13): GET /auth/me effective permissions for UI, Center blocking/unblocking, Center creation POST /admin/centers (single transaction), center_role_permissions (role template), ERD: tenant, branch, users, permissions, Guard order JWT -> @Roles -> @RequirePermission (@Public opt-out), JWT + rotating refresh token auth, Permission check layer (code + scope + effective permission) (+5 more)

### Community 68 - "Health endpoint"
Cohesion: 0.19
Nodes (3): AppController, AppService, @nestjs/testing

### Community 69 - "Shared paket"
Cohesion: 0.15
Nodes (13): typescript@^6.0.2, Frontend: Next.js (React), devDependencies, typescript@^5.9.3, typescript, main, name, private (+5 more)

### Community 70 - "Hisoblar xizmati"
Cohesion: 0.34
Nodes (4): audited(), chargeNotFound(), ChargesService, forbidden()

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
Cohesion: 0.32
Nodes (6): AdjustRatingInput, RankingQuery, RatingEventsQuery, forbidden(), nf(), RatingsService

### Community 76 - "Bildirishnomalar xizmati"
Cohesion: 0.32
Nodes (3): forbidden(), notFound(), NotificationsService

### Community 77 - "Ruxsatlar xizmati"
Cohesion: 0.32
Nodes (3): assertConfigurable(), PermissionsAdminService, TenantRole

### Community 78 - "Chegirma va qarzdorlar testlari"
Cohesion: 0.26
Nodes (11): activate(), Api, Center, ChargeView, config, daysAgo(), makeApi(), mkStudent() (+3 more)

### Community 79 - "Kichik klaster 79"
Cohesion: 0.17
Nodes (12): environment, CRON_SECRET, DATABASE_URL, JWT_ACCESS_SECRET, JWT_ACCESS_TTL, JWT_REFRESH_SECRET, JWT_REFRESH_TTL, NODE_ENV (+4 more)

### Community 80 - "Kichik klaster 80"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), Row (+2 more)

### Community 81 - "Kichik klaster 81"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, config, D2, makeApi(), mkStudent(), newCenter() (+2 more)

### Community 82 - "Kichik klaster 82"
Cohesion: 0.25
Nodes (10): activate(), Api, Center, config, HEADER, makeApi(), newCenter(), staff() (+2 more)

### Community 83 - "Kichik klaster 83"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, ChargeView, config, makeApi(), mkStudent(), newCenter() (+2 more)

### Community 84 - "Kichik klaster 84"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+2 more)

### Community 85 - "Kichik klaster 85"
Cohesion: 0.29
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
Cohesion: 0.31
Nodes (6): Ikki to'lov rejimi GROUP_CYCLE / STUDENT_CYCLE, join_proration setting (FULL_MONTH / REMAINING_LESSONS), Bozor bo'shlig'i (taxmin), Moslashuvchan maosh motori (farqlovchi), Ikki xil to'lov sikli (farqlovchi), Qiymat taklifi

### Community 90 - "Kichik klaster 90"
Cohesion: 0.22
Nodes (8): Candidate, ListNotificationsQuery, listNotificationsSchema, NOTIFICATION_TYPES, RUN_TYPES, RunType, sendSchema, telegramUpdateSchema

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

### Community 99 - "Kichik klaster 99"
Cohesion: 0.29
Nodes (6): compilerOptions, rootDir, exclude, extends, include, ./tsconfig.json

### Community 100 - "Kichik klaster 100"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, start, test, typecheck

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

### Community 105 - "Kichik klaster 105"
Cohesion: 0.40
Nodes (5): dependencies, next@16.4.6, react@19.3.0, react-dom@19.3.0, react-dom

### Community 106 - "Kichik klaster 106"
Cohesion: 0.40
Nodes (5): healthcheck, interval, retries, test, timeout

### Community 108 - "Kichik klaster 108"
Cohesion: 0.67
Nodes (3): ChangePasswordForm(), ChangePasswordPage(), metadata

## Knowledge Gaps
- **46 isolated node(s):** `./tsconfig.json`, `To'lov, maosh to'lovi, audit append-only`, `Qarz saqlanmaydi, charges dan hisoblanadi`, `Qaror ERD dan chetga chiqsa avval hujjatni yangila`, `Kod grafi graphify-out` (+41 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 872 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `typescript` connect `Shared paket` to `API package va drizzle config`, `CLAUDE.md qoidalari`, `Web package bog'liqliklari`?**
  _High betweenness centrality (0.186) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `To'lov, maosh to'lovi, audit append-only`, `Qarz saqlanmaydi, charges dan hisoblanadi` to the rest of the system?**
  _46 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Web: kirish va panel sahifalari` be split into smaller, more focused modules?**
  _Cohesion score 0.029748283752860413 - nodes in this community are weakly interconnected._
- **Why does `@nestjs/common` connect `Nest modullari` to `Vazifalar xizmati va DB sxemasi`, `Ilova moduli va auth asoslari`, `Yozilish va muzlatish`, `Controller yordamchilari`, `Maosh xizmati va DB`, `Audit va markaz yaratish`, `Hisob-kitob motori`, `API package va drizzle config`, `Hisobotlar va tenant kontekst`, `Login cheklovi va konfiguratsiya`, `Kurslar va reyting so'rovlari`, `Ruxsat matritsasi va tokenlar`, `Filiallar API`, `Telegram xabar matnlari`, `To'lovlar API`, `Telegram e2e testlari`, `Ruxsatlarni boshqarish API`, `API bog'liqliklari`, `Darslar controller`, `Health endpoint`, `Vazifa e2e testlari`, `Maosh e2e testlari`, `Chegirma va qarzdorlar testlari`, `Kichik klaster 80`, `Kichik klaster 81`, `Kichik klaster 82`, `Kichik klaster 83`, `Kichik klaster 84`, `Kichik klaster 85`?**
  _High betweenness centrality (0.158) - this node is a cross-community bridge._
- **Should `Vazifalar xizmati va DB sxemasi` be split into smaller, more focused modules?**
  _Cohesion score 0.07254502208630649 - nodes in this community are weakly interconnected._
- **Why does `AuthUser` connect `Yozilish API` to `Vazifalar xizmati va DB sxemasi`, `Davomat va o'quvchilar xizmati`, `Guruhlar API`, `Yozilish va muzlatish`, `Vazifa va reyting API`, `Controller yordamchilari`, `Maosh xizmati va DB`, `Audit va markaz yaratish`, `Maosh API`, `Ro'yxat endpointlari`, `Excel import`, `Hisobotlar va tenant kontekst`, `Kurslar va reyting so'rovlari`, `Audit API`, `To'lov taqsimlagich (FIFO)`, `Moliya API`, `Xodimlar API`, `Filiallar API`, `Chegirmalar API`, `Hisoblar API`, `To'lovlar API`, `O'quvchilar API`, `Ruxsatlarni boshqarish API`, `Xarajatlar xizmati`, `Darslar controller`, `Hisoblar xizmati`, `Reyting sxemalari`, `Ruxsatlar xizmati`, `Kichik klaster 96`, `Kichik klaster 98`?**
  _High betweenness centrality (0.155) - this node is a cross-community bridge._
- **Should `Davomat va o'quvchilar xizmati` be split into smaller, more focused modules?**
  _Cohesion score 0.055717336439526303 - nodes in this community are weakly interconnected._