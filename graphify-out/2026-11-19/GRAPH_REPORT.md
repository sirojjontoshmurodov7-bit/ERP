# Graph Report - ERP  (2026-11-19)

## Corpus Check
- 202 files · ~129,266 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 5, .css 2, .example 1)

## Summary
- 2233 nodes · 7320 edges · 91 communities (82 shown, 9 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 469 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d54b1944`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- student-import.ts
- @nestjs/common
- academic.controller.ts
- EnrollmentsService
- .update
- payroll.schemas.ts
- center-settings.service.ts
- BranchesService
- CoursesService (#8)
- Tx
- web/package.json (#10)
- todayLocal
- ChargesService (#12)
- writeAudit
- Tx
- enrollments table (#15)
- ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)
- telegram-bot.service.ts
- .branches
- hashPassword
- Ruxsatlar matritsasi (3-bo'lim)
- DbService
- Yaratish va parol qoidalari jadvali (#22)
- LessonsController
- devDependencies
- decorators.ts
- @nestjs/common
- users.controller.ts
- lessons.service.ts
- Param
- ClientInfo
- scripts (#31)
- api/package.json
- lessons.service.ts
- discounts.controller.ts
- .hasIn
- todayLocal
- .end
- permissions table (code catalog) (#38)
- CurrentUser
- shared/package.json (#40)
- lessons table
- CoursesService
- notifications.e2e-spec.ts
- attendance.e2e-spec.ts
- spreadsheet.ts
- payments table (#46)
- centers.schemas.ts
- payroll-engine.ts
- .create
- RequirePermission
- writeAudit
- tsconfig.build.json (#52)
- Tx
- nest-cli.json (#54)
- payroll.e2e-spec.ts
- allowBuilds (#56)
- vitest (#57)
- Module
- academic.controller.ts
- settings-plans.e2e-spec.ts
- payroll.controller.ts
- permissions-admin.controller.ts
- discounts.controller.ts
- payroll-engine.ts
- branchFilter
- schema.ts
- app-config.ts
- AuthUser
- finance.schemas.ts
- .run
- .create
- @nestjs/common
- audit.controller.ts
- TokenService
- hashPassword
- @types/express@^5.0.0
- imports.controller.ts
- attendance-lock.e2e-spec.ts
- PayrollRulesService
- payments.e2e-spec.ts
- reports.e2e-spec.ts
- permissions-admin.controller.ts
- .withContext
- dispatch.service.ts
- app.controller.ts
- centers.schemas.ts
- @nestjs/mau@^0.2.6

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 360 edges
2. `CurrentUser` - 147 edges
3. `Tx` - 119 edges
4. `ClientInfo` - 118 edges
5. `@nestjs/common` - 106 edges
6. `writeAudit()` - 83 edges
7. `branchScope()` - 73 edges
8. `DbService` - 71 edges
9. `drizzle-orm` - 65 edges
10. `Roles()` - 63 edges

## Surprising Connections (you probably didn't know these)
- `Frontend: Next.js (React)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `CLAUDE.md (loyiha ko'rsatmalari)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `Backend: NestJS modulli monolit` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `AuthUser` --references--> `Role`  [EXTRACTED]
  apps/api/src/auth/auth.types.ts → packages/shared/src/index.ts
- `UserRow` --references--> `Role`  [EXTRACTED]
  apps/api/src/auth/auth.types.ts → packages/shared/src/index.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Hisob-kitob, to'lov va qarz oqimi** — erd_va_ruxsatlar_enrollments, erd_va_ruxsatlar_charges, erd_va_ruxsatlar_payment_allocations, erd_va_ruxsatlar_payments [EXTRACTED 1.00]
- **Samarali ruxsat: rol shabloni va foydalanuvchi istisnosi** — erd_va_ruxsatlar_permissions, erd_va_ruxsatlar_center_role_permissions, erd_va_ruxsatlar_user_permissions, erd_va_ruxsatlar_permission_layer [EXTRACTED 1.00]
- **Append-only pul va audit jadvallari** — erd_va_ruxsatlar_payments, erd_va_ruxsatlar_payroll_payouts, erd_va_ruxsatlar_audit_logs, erd_va_ruxsatlar_expenses [EXTRACTED 1.00]
- **Money flow: charges, payments, payroll, finance** — progress_step13_billing_charges, progress_step14_payments, progress_step16_payroll, progress_step17_expenses_finance [INFERRED 0.85]
- **Tenant security foundation** — progress_rls_tenant_isolation, progress_composite_fk_pattern, progress_auth_design, progress_permission_model [INFERRED 0.85]

## Communities (91 total, 9 thin omitted)

### Community 0 - "student-import.ts"
Cohesion: 0.22
Nodes (12): ALIASES, HeaderMap, LOOKUP, mapHeader(), MAX_IMPORT_ROWS, norm(), parseDate(), ParsedStudent (+4 more)

### Community 1 - "@nestjs/common"
Cohesion: 0.06
Nodes (14): RequirePermission(), BranchesController, clientOf(), createBranchSchema, listBranchesSchema, phone, updateBranchSchema, CentersController (+6 more)

### Community 2 - "academic.controller.ts"
Cohesion: 0.09
Nodes (19): AcademicController, clientOf(), adjustRatingSchema, CreateAssignmentInput, createAssignmentSchema, GradeInput, gradeSchema, link (+11 more)

### Community 3 - "EnrollmentsService"
Cohesion: 0.04
Nodes (21): AcademicModule, AuditModule, BranchesModule, CentersModule, CoursesModule, DbModule, Db, DbOptions (+13 more)

### Community 4 - ".update"
Cohesion: 0.10
Nodes (13): clientOf(), PlansController, CreatePlanInput, createPlanSchema, features, limit, UpdatePlanInput, updatePlanSchema (+5 more)

### Community 5 - "payroll.schemas.ts"
Cohesion: 0.09
Nodes (21): clientOf(), PayrollController, CreateAdjustmentInput, createAdjustmentSchema, CreatePayoutInput, createPayoutSchema, CreateRuleInput, createRuleSchema (+13 more)

### Community 6 - "center-settings.service.ts"
Cohesion: 0.13
Nodes (7): CenterSettingsController, clientOf(), UpdateCenterSettingsInput, updateCenterSettingsSchema, CenterSettingsService, effectiveSettings(), KEYS

### Community 7 - "BranchesService"
Cohesion: 0.08
Nodes (16): clientOf(), StudentsController, birthDate, CreateStudentInput, createStudentSchema, ListStudentsQuery, listStudentsSchema, login (+8 more)

### Community 8 - "CoursesService (#8)"
Cohesion: 0.12
Nodes (21): branchScope(), inScope(), isLoginConflict(), teacherProfiles, branchIds, CreateStaffInput, ListStaffQuery, listStaffSchema (+13 more)

### Community 9 - "Tx"
Cohesion: 0.10
Nodes (54): AuditEntry, GenerateOptions, ChargeRow, DebtorRow, forbidden(), GroupRow, ListDebtorsQuery, DiscountRow (+46 more)

### Community 10 - "web/package.json (#10)"
Cohesion: 0.09
Nodes (39): BillingMode, ChargeDraft, ChargeKind, countLessons(), discountFor(), EngineContext, EngineDiscount, EngineEnrollment (+31 more)

### Community 11 - "todayLocal"
Cohesion: 0.06
Nodes (37): Attendance lock rule (attendance_lock_days), Audit log (append-only, GET /audit), Auth design (JWT 15 min, refresh rotation, HMAC hash), Billing engine planCharges (pure function), Branch scope helper (branch-scope.ts), Drizzle migrations plus handwritten SQL, ERD-VA-RUXSATLAR.md (rules source), FIFO payment allocation (AllocatorService) (+29 more)

### Community 12 - "ChargesService (#12)"
Cohesion: 0.06
Nodes (34): eslintConfig, nextConfig, dependencies, next@16.4.6, react@19.3.0, react-dom@19.3.0, devDependencies, eslint@^9 (+26 more)

### Community 13 - "writeAudit"
Cohesion: 0.25
Nodes (9): writeAudit(), CreateBranchInput, UpdateBranchInput, audited(), BranchesService, nameTaken(), notFound(), view() (+1 more)

### Community 14 - "Tx"
Cohesion: 0.08
Nodes (15): clientOf(), PermissionsAdminController, assertConfigurable(), PermissionsAdminService, DEFAULT_CENTER_SETTINGS, DEFAULT_TRIAL_DAYS, ROLE_PERMISSION_MATRIX, RoleMatrix (+7 more)

### Community 15 - "enrollments table (#15)"
Cohesion: 0.08
Nodes (26): currentTeacher(), clientOf(), GroupsController, AssignTeacherInput, assignTeacherSchema, BILLING_KEYS, billingMode, CreateGroupInput (+18 more)

### Community 16 - "ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)"
Cohesion: 0.10
Nodes (14): BillingController, clientOf(), cancelChargeSchema, CreateManualChargeInput, createManualChargeSchema, generateBillingSchema, ListChargesQuery, listChargesSchema (+6 more)

### Community 17 - "telegram-bot.service.ts"
Cohesion: 0.08
Nodes (16): DispatchService, emptySummary(), clientOf(), NotificationsController, safeEqual(), ListNotificationsQuery, listNotificationsSchema, NOTIFICATION_TYPES (+8 more)

### Community 18 - ".branches"
Cohesion: 0.14
Nodes (12): BRANCH_SORTS, BranchesQuery, branchesQuerySchema, OverviewQuery, overviewQuerySchema, range, AttendanceCounts, attendanceStats() (+4 more)

### Community 19 - "hashPassword"
Cohesion: 0.08
Nodes (46): AppModule, hashPassword(), PARAMS, client, db, login, DB, DB_OPTIONS (+38 more)

### Community 20 - "Ruxsatlar matritsasi (3-bo'lim)"
Cohesion: 0.08
Nodes (20): chunks(), clientOf(), EnrollmentsController, CreateEnrollmentInput, createEnrollmentSchema, LeaveEnrollmentInput, leaveEnrollmentSchema, ListEnrollmentsQuery (+12 more)

### Community 21 - "DbService"
Cohesion: 0.13
Nodes (21): generateTempPassword(), CreateCenterInput, CreatedCenter, SUPER, generateLogin(), MAX_LOGIN_TRIES, pgErrorInfo(), uniqueViolation() (+13 more)

### Community 22 - "Yaratish va parol qoidalari jadvali (#22)"
Cohesion: 0.12
Nodes (26): attrs(), BUILTIN_DATE_FMTS, colIndex(), corrupt(), dateStyles(), decode(), ENTITIES, excelSerialToIso() (+18 more)

### Community 23 - "LessonsController"
Cohesion: 0.33
Nodes (3): LessonsController, attendanceQuerySchema, listLessonsSchema

### Community 24 - "devDependencies"
Cohesion: 0.09
Nodes (31): typescript@^6.0.2, typescript, To'lov, maosh to'lovi, audit append-only, Byudjet $0, host-agnostik (Docker), Qarz saqlanmaydi, charges dan hisoblanadi, CLAUDE.md (loyiha ko'rsatmalari), Hujjatlarni o'qish tartibi, ORM: Drizzle (+23 more)

### Community 25 - "decorators.ts"
Cohesion: 0.10
Nodes (17): changePasswordSchema, loginSchema, refreshSchema, AccessClaims, AuthedRequest, ALLOW_MUST_CHANGE, AllowMustChangePassword(), IS_PUBLIC (+9 more)

### Community 26 - "@nestjs/common"
Cohesion: 0.25
Nodes (4): AuthModule, BillingModule, ReportsController, @nestjs/common

### Community 27 - "users.controller.ts"
Cohesion: 0.16
Nodes (6): clientOf(), id(), StaffController, UserPasswordController, createStaffSchema, updateStaffSchema

### Community 28 - "lessons.service.ts"
Cohesion: 0.09
Nodes (25): daysBetween(), groupVisibility(), attendanceRecords, clientOf(), ATTENDANCE_STATUSES, AttendanceQuery, AttendanceStatus, CreateLessonInput (+17 more)

### Community 29 - "Param"
Cohesion: 0.13
Nodes (3): PermissionsService, BillingService, DbService

### Community 30 - "ClientInfo"
Cohesion: 0.18
Nodes (24): uuid(), ClientInfo, LoginResult, SessionRow, TokenPair, UserRow, CurrentUser, Roles() (+16 more)

### Community 31 - "scripts (#31)"
Cohesion: 0.08
Nodes (14): AllocatorService, clientOf(), PaymentsController, CreatePaymentInput, createPaymentSchema, ListPaymentsQuery, listPaymentsSchema, note (+6 more)

### Community 32 - "api/package.json"
Cohesion: 0.10
Nodes (22): Audit jurnali: kim, nima, qachon, oldingi/keyingi, Auth: argon2, JWT + refresh, 2FA, Raqobatchilar: SchoolupCRM, UstozCRM, ALFA CRM, Umai CRM, Shaxsiy ma'lumotlar qonuni (lokalizatsiya), Birinchi 7 kunda 5 amaliy qadam, Bepul infra cheklovlari (Neon/Supabase, Render, Fly.io), 5-10 rahbar bilan suhbat (birinchi vazifa), Bozor tahlili (raqobatchilar) (+14 more)

### Community 33 - "lessons.service.ts"
Cohesion: 0.14
Nodes (18): AdjustRatingInput, RankingQuery, RatingEventsQuery, AssignmentRow, homeworkPoints(), SubmissionRow, ATTENDANCE_POINTS, forbidden() (+10 more)

### Community 34 - "discounts.controller.ts"
Cohesion: 0.13
Nodes (9): DebtorsService, clientOf(), DiscountsController, id(), CreateDiscountInput, createDiscountSchema, endDiscountSchema, listDebtorsSchema (+1 more)

### Community 35 - ".hasIn"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+2 more)

### Community 36 - "todayLocal"
Cohesion: 0.10
Nodes (20): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+12 more)

### Community 37 - ".end"
Cohesion: 0.14
Nodes (21): assignments, attendance_records, branches, expenses, Moliyaviy hisobot (kassa asosida), group_schedules, group_teachers, groups (+13 more)

### Community 38 - "permissions table (code catalog) (#38)"
Cohesion: 0.09
Nodes (21): devDependencies, drizzle-kit@^0.31.11, @electric-sql/pglite@^0.5.16, @nestjs/schematics@^12.0.0, @nestjs/testing@^12.0.1, oxlint@^1.58.0, prettier@^3.4.2, source-map-support@^0.5.21 (+13 more)

### Community 39 - "CurrentUser"
Cohesion: 0.31
Nodes (6): audited(), discountNotFound(), DiscountsService, enrollmentNotFound(), forbidden(), overlap()

### Community 40 - "shared/package.json (#40)"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 41 - "lessons table"
Cohesion: 0.11
Nodes (18): scripts, build, db:create-super-admin, db:generate, db:migrate, db:seed, deploy, format (+10 more)

### Community 42 - "CoursesService"
Cohesion: 0.11
Nodes (13): clientOf(), CoursesController, CreateCourseInput, createCourseSchema, listCoursesSchema, price, UpdateCourseInput, updateCourseSchema (+5 more)

### Community 43 - "notifications.e2e-spec.ts"
Cohesion: 0.09
Nodes (16): AppConfig, HttpTelegramSender, SendResult, TelegramSender, activate(), Api, Center, config (+8 more)

### Community 44 - "attendance.e2e-spec.ts"
Cohesion: 0.11
Nodes (17): environment, healthcheck, image, ports, restart, volumes, POSTGRES_DB, POSTGRES_PASSWORD (+9 more)

### Community 45 - "spreadsheet.ts"
Cohesion: 0.12
Nodes (16): engines, node, name, packageManager, private, scripts, build, db:create-super-admin (+8 more)

### Community 46 - "payments table (#46)"
Cohesion: 0.12
Nodes (15): author, description, @nestjs/cli@^12.0.0, oxlint-tsgolint@^7.0.2001, @types/node@^24.0.0, vite@^8.0.0, @types/node, license (+7 more)

### Community 47 - "centers.schemas.ts"
Cohesion: 0.18
Nodes (11): id(), blockCenterSchema, createCenterSchema, ListCentersQuery, listCentersSchema, phone, resetOwnerPasswordSchema, slug (+3 more)

### Community 48 - "payroll-engine.ts"
Cohesion: 0.16
Nodes (17): attachedGroups(), Attachment, EngineRule, fmt(), GroupBase, LessonCount, monthEndOf(), monthStartOf() (+9 more)

### Community 49 - ".create"
Cohesion: 0.32
Nodes (4): audited(), forbidden(), payoutNotFound(), PayoutsService

### Community 50 - "RequirePermission"
Cohesion: 0.18
Nodes (15): Ikki to'lov rejimi GROUP_CYCLE / STUDENT_CYCLE, Biznes sanasi Asia/Tashkent, Charge yaratish (idempotent, hodisalar bilan), charges, enrollment_discounts, enrollment_freezes, enrollments, GROUP_CYCLE (Najot usuli) (+7 more)

### Community 51 - "writeAudit"
Cohesion: 0.14
Nodes (16): Avans (taqsimlanmagan qoldiq), Qabul qilingan qarorlar va ochiq savollar, ERD va ruxsatlar matritsasi, join_proration (FULL_MONTH, REMAINING_LESSONS), Umumiy hisobotlar (overview, branch_compare), Moliya ruxsatlari (payment, debtors, expense, payroll), Tashkilot ruxsatlari (branch.manage, staff.create, student.*), Platforma ruxsatlari (center.create, owner.create, plan.manage) (+8 more)

### Community 52 - "tsconfig.build.json (#52)"
Cohesion: 0.12
Nodes (17): dependencies, drizzle-orm@^0.45.4, @erp/shared@workspace:*, @nestjs/common@^12.0.1, @nestjs/core@^12.0.1, @nestjs/jwt@^12.0.5, @nestjs/platform-express@^12.0.1, @node-rs/argon2@^2.2.2 (+9 more)

### Community 53 - "Tx"
Cohesion: 0.25
Nodes (6): postgres@^4.1.1, client, permissions, client, db, postgres

### Community 54 - "nest-cli.json (#54)"
Cohesion: 0.23
Nodes (12): activate(), Api, Center, config, FUTURE, makeApi(), mkStudent(), newCenter() (+4 more)

### Community 55 - "payroll.e2e-spec.ts"
Cohesion: 0.21
Nodes (11): activate(), Api, Center, config, M, makeApi(), newCenter(), NEXT (+3 more)

### Community 56 - "allowBuilds (#56)"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), Row (+2 more)

### Community 57 - "vitest (#57)"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, ChargeView, config, makeApi(), mkStudent(), newCenter() (+2 more)

### Community 58 - "Module"
Cohesion: 0.27
Nodes (12): Skelet 1: Monorepo, Docker Compose, .env.example (tayyor), Skelet 2: Migratsiyalar 10 jadval (tayyor), Skelet 3: Auth login, JWT+refresh, guard (tayyor), Skelet 4: RLS va tenant izolyatsiya testi (tayyor), Skelet 5: Super admin markaz yaratish/bloklash (tayyor), Skelet 6: Rahbar filial va xodim yaratish, ruxsat sozlash (keyingi), Skelet 7: Audit jurnali va ruxsat matritsasi testi (kutmoqda), Skelet maqsadi: super admin markaz ochadi, rahbar kiradi, filial va xodim yaratadi (+4 more)

### Community 59 - "academic.controller.ts"
Cohesion: 0.18
Nodes (11): devDependencies, typescript@^5.9.3, typescript, main, name, private, scripts, build (+3 more)

### Community 60 - "settings-plans.e2e-spec.ts"
Cohesion: 0.29
Nodes (9): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+1 more)

### Community 61 - "payroll.controller.ts"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, config, D2, makeApi(), mkStudent(), newCenter() (+2 more)

### Community 62 - "permissions-admin.controller.ts"
Cohesion: 0.43
Nodes (3): roleParamSchema, setRolePermissionsSchema, setUserPermissionsSchema

### Community 63 - "discounts.controller.ts"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, ChargeView, config, makeApi(), mkStudent(), newCenter() (+2 more)

### Community 64 - "payroll-engine.ts"
Cohesion: 0.22
Nodes (10): audit_logs, center_role_permissions, notification_log, Ruxsatni tekshirish qatlami (kod + scope + samarali ruxsat), permissions, student_profiles, teacher_profiles, user_branches (+2 more)

### Community 65 - "branchFilter"
Cohesion: 0.22
Nodes (11): Markaz yaratish (POST /admin/centers), centers (tenant), courses, import_jobs, Ko'p filialli model (Asosiy filial avtomatik), plans, saas_invoices, Excel import (+3 more)

### Community 66 - "schema.ts"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, esModuleInterop, module, outDir, rootDir, skipLibCheck, strict (+2 more)

### Community 67 - "app-config.ts"
Cohesion: 0.10
Nodes (20): LOGIN_MAX_FAILURES, LOGIN_WINDOW_SECONDS, APP_CONFIG, ConfigModule, envSchema, loadConfig(), parseDuration(), UNIT_SECONDS (+12 more)

### Community 68 - "AuthUser"
Cohesion: 0.33
Nodes (6): AssignmentsService, conflict(), forbidden(), isLate(), notFound(), AuthUser

### Community 69 - "finance.schemas.ts"
Cohesion: 0.07
Nodes (19): audited(), ExpensesService, forbidden(), notFound(), clientOf(), FinanceController, FinanceReportService, forbidden() (+11 more)

### Community 70 - ".run"
Cohesion: 0.09
Nodes (13): clientOf(), ImportsController, flag, ListImportsQuery, listImportsSchema, RunImportInput, runImportSchema, UploadedFile (+5 more)

### Community 71 - ".create"
Cohesion: 0.33
Nodes (9): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+1 more)

### Community 72 - "@nestjs/common"
Cohesion: 0.22
Nodes (10): payroll_adjustments, Maosh oqimi: DRAFT, APPROVED, PAID, payroll_items, payroll_payouts, payroll_periods, payroll_rules, O'quv ruxsatlari (group, attendance, homework, rating), Rol ADMIN (+2 more)

### Community 75 - "TokenService"
Cohesion: 0.07
Nodes (13): AppController, AppService, AuthController, clientOf(), accountInactive(), AuthService, centerBlocked(), invalidCredentials() (+5 more)

### Community 76 - "hashPassword"
Cohesion: 0.29
Nodes (6): env, node, rules, typescript/no-explicit-any, typescript/no-floating-promises, $schema

### Community 78 - "imports.controller.ts"
Cohesion: 0.29
Nodes (6): compilerOptions, rootDir, exclude, extends, include, ./tsconfig.json

### Community 79 - "attendance-lock.e2e-spec.ts"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 80 - "PayrollRulesService"
Cohesion: 0.33
Nodes (5): audited(), bad(), forbidden(), PayrollRulesService, ruleNotFound()

### Community 81 - "payments.e2e-spec.ts"
Cohesion: 0.40
Nodes (4): allowBuilds, sharp, unrs-resolver, packages

### Community 83 - "permissions-admin.controller.ts"
Cohesion: 0.67
Nodes (4): Environment constraint: Docker/WSL unavailable, PGlite in-memory Postgres testing, Roadmap: deploy and operations, Roadmap: test on real Postgres

### Community 85 - ".withContext"
Cohesion: 0.19
Nodes (7): LoginThrottle, ListPeriodsQuery, forbidden(), locked(), PayrollService, periodNotFound(), periodView()

### Community 86 - "dispatch.service.ts"
Cohesion: 0.07
Nodes (28): NO_CONTEXT, TenantContext, rowsOf(), Candidate, Row, RunSummary, SQLText, badCodeMessage() (+20 more)

## Knowledge Gaps
- **53 isolated node(s):** `./tsconfig.json`, `Attendance lock rule (attendance_lock_days)`, `Auth design (JWT 15 min, refresh rotation, HMAC hash)`, `Branch scope helper (branch-scope.ts)`, `Drizzle migrations plus handwritten SQL` (+48 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 582 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthUser` connect `AuthUser` to `@nestjs/common`, `academic.controller.ts`, `.update`, `payroll.schemas.ts`, `center-settings.service.ts`, `BranchesService`, `CoursesService (#8)`, `Tx`, `writeAudit`, `Tx`, `enrollments table (#15)`, `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)`, `telegram-bot.service.ts`, `.branches`, `Ruxsatlar matritsasi (3-bo'lim)`, `DbService`, `LessonsController`, `decorators.ts`, `users.controller.ts`, `lessons.service.ts`, `ClientInfo`, `scripts (#31)`, `lessons.service.ts`, `discounts.controller.ts`, `CurrentUser`, `CoursesService`, `centers.schemas.ts`, `.create`, `permissions-admin.controller.ts`, `finance.schemas.ts`, `.run`, `audit.controller.ts`, `.list`, `TokenService`, `PayrollRulesService`, `.withContext`?**
  _High betweenness centrality (0.240) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `Attendance lock rule (attendance_lock_days)`, `Auth design (JWT 15 min, refresh rotation, HMAC hash)` to the rest of the system?**
  _53 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `@nestjs/common` be split into smaller, more focused modules?**
  _Cohesion score 0.055130784708249496 - nodes in this community are weakly interconnected._
- **Why does `@nestjs/common` connect `@nestjs/common` to `EnrollmentsService`, `center-settings.service.ts`, `CoursesService (#8)`, `Tx`, `web/package.json (#10)`, `writeAudit`, `.branches`, `hashPassword`, `DbService`, `decorators.ts`, `users.controller.ts`, `lessons.service.ts`, `ClientInfo`, `lessons.service.ts`, `discounts.controller.ts`, `.hasIn`, `notifications.e2e-spec.ts`, `payments table (#46)`, `centers.schemas.ts`, `tsconfig.build.json (#52)`, `nest-cli.json (#54)`, `payroll.e2e-spec.ts`, `allowBuilds (#56)`, `vitest (#57)`, `settings-plans.e2e-spec.ts`, `payroll.controller.ts`, `permissions-admin.controller.ts`, `discounts.controller.ts`, `app-config.ts`, `.create`, `audit.controller.ts`, `TokenService`, `dispatch.service.ts`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Should `academic.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09268292682926829 - nodes in this community are weakly interconnected._
- **Why does `CLAUDE.md (loyiha ko'rsatmalari)` connect `devDependencies` to `api/package.json`, `RequirePermission`, `writeAudit`, `Module`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Should `EnrollmentsService` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._