# Graph Report - ERP  (2026-11-19)

## Corpus Check
- 295 files · ~171,088 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 15 file(s) not represented in the graph (top: (none) 10, .example 2, .css 2)

## Summary
- 2899 nodes · 10053 edges · 127 communities (107 shown, 20 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 474 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `918e77cb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- student-import.ts
- @nestjs/common
- academic.controller.ts
- EnrollmentsService
- .update
- payroll.schemas.ts
- index.ts
- StudentsService
- CoursesService (#8)
- Tx
- web/package.json (#10)
- todayLocal
- ChargesService (#12)
- writeAudit
- Tx
- branchScope
- ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)
- NotificationsController
- .branches
- hashPassword
- Ruxsatlar matritsasi (3-bo'lim)
- writeAudit
- Yaratish va parol qoidalari jadvali (#22)
- Roles
- devDependencies
- JwtAuthGuard
- plans.module.ts
- Skeleton
- lessons.service.ts
- Param
- ClientInfo
- scripts (#31)
- api/package.json
- .events
- discounts.controller.ts
- .hasIn
- todayLocal
- groups
- api/package.json
- CurrentUser
- shared/package.json (#40)
- lessons table
- CoursesService
- notifications.e2e-spec.ts
- attendance.e2e-spec.ts
- spreadsheet.ts
- react
- Button
- payroll-engine.ts
- db.service.ts
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
- permissions-admin.module.ts
- discounts.controller.ts
- payments
- useApi
- schema.ts
- attendance.e2e-spec.ts
- AuthUser
- finance.schemas.ts
- .run
- .create
- users
- audit.module.ts
- with
- TokenService
- hashPassword
- money
- imports.controller.ts
- attendance-lock.e2e-spec.ts
- PageHead
- allowBuilds
- main.ts
- permissions-admin.controller.ts
- [...path]/route.ts
- .withContext
- dispatch.service.ts
- app.controller.ts
- centers.schemas.ts
- group-card.tsx
- payroll-page.tsx
- groups.controller.ts
- imports.e2e-spec.ts
- demo-seed.mjs
- CurrentUser
- GroupsController
- StudentsController
- smoke.mjs
- .reverse
- Deploy qo'llanmasi
- app.controller.ts
- Public
- web
- environment
- discounts.service.ts
- .update
- audit-page.tsx
- migrate
- db
- LoginThrottle
- caddy
- app/layout.tsx
- services
- ERD va ruxsatlar matritsasi
- HttpTelegramSender
- api
- healthcheck
- next.config.ts
- ChangePasswordForm
- proxy.ts
- DebtorsService
- ConfigModule
- DbModule
- BranchesModule
- CentersModule
- 01-app-role.sh

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
  CLAUDE.md → apps/api/package.json
- `CLAUDE.md (loyiha ko'rsatmalari)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `Backend: NestJS modulli monolit` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `AuthUser` --references--> `Role`  [EXTRACTED]
  apps/api/src/auth/auth.types.ts → packages/shared/src/index.ts
- `To'lov tizimlari: Payme, Click, Uzum` --references--> `payments`  [INFERRED]
  REJA.md → ERD-VA-RUXSATLAR.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Hisob-kitob, to'lov va qarz oqimi** — erd_va_ruxsatlar_enrollments, erd_va_ruxsatlar_charges, erd_va_ruxsatlar_payment_allocations, erd_va_ruxsatlar_payments [EXTRACTED 1.00]
- **Samarali ruxsat: rol shabloni va foydalanuvchi istisnosi** — erd_va_ruxsatlar_permissions, erd_va_ruxsatlar_center_role_permissions, erd_va_ruxsatlar_user_permissions, erd_va_ruxsatlar_permission_layer [EXTRACTED 1.00]
- **Append-only pul va audit jadvallari** — erd_va_ruxsatlar_payments, erd_va_ruxsatlar_payroll_payouts, erd_va_ruxsatlar_audit_logs, erd_va_ruxsatlar_expenses [EXTRACTED 1.00]
- **Money flow: charges, payments, payroll, finance** — progress_step13_billing_charges, progress_step14_payments, progress_step16_payroll, progress_step17_expenses_finance [INFERRED 0.85]
- **Tenant security foundation** — progress_rls_tenant_isolation, progress_composite_fk_pattern, progress_auth_design, progress_permission_model [INFERRED 0.85]

## Communities (127 total, 20 thin omitted)

### Community 0 - "student-import.ts"
Cohesion: 0.24
Nodes (11): ALIASES, HeaderMap, LOOKUP, mapHeader(), MAX_IMPORT_ROWS, norm(), parseDate(), parseRow() (+3 more)

### Community 1 - "@nestjs/common"
Cohesion: 0.08
Nodes (7): AuditController, RequirePermission(), CentersController, clientOf(), ProbeController, ProbeController, ProbeController

### Community 2 - "academic.controller.ts"
Cohesion: 0.08
Nodes (25): AcademicController, clientOf(), adjustRatingSchema, CreateAssignmentInput, createAssignmentSchema, GradeInput, gradeSchema, link (+17 more)

### Community 3 - "EnrollmentsService"
Cohesion: 0.11
Nodes (14): AcademicModule, AuthModule, BillingModule, CoursesModule, EnrollmentsModule, FinanceModule, GroupsModule, ImportsModule (+6 more)

### Community 4 - ".update"
Cohesion: 0.10
Nodes (13): clientOf(), PlansController, CreatePlanInput, createPlanSchema, features, limit, UpdatePlanInput, updatePlanSchema (+5 more)

### Community 5 - "payroll.schemas.ts"
Cohesion: 0.08
Nodes (26): clientOf(), PayrollController, audited(), bad(), forbidden(), PayrollRulesService, ruleNotFound(), CreateAdjustmentInput (+18 more)

### Community 6 - "index.ts"
Cohesion: 0.08
Nodes (20): UpdateCenterSettingsInput, updateCenterSettingsSchema, CenterSettingsService, effectiveSettings(), KEYS, DEFAULT_ATTENDANCE_LOCK_DAYS, PAYMENT_MODES, PaymentMode (+12 more)

### Community 7 - "StudentsService"
Cohesion: 0.24
Nodes (5): branchNotFound(), escapeLike(), forbidden(), notFound(), StudentsService

### Community 8 - "CoursesService (#8)"
Cohesion: 0.07
Nodes (21): clientOf(), StaffController, UserPasswordController, branchIds, CreateStaffInput, createStaffSchema, ListStaffQuery, listStaffSchema (+13 more)

### Community 9 - "Tx"
Cohesion: 0.09
Nodes (50): rankingQuerySchema, AssignmentRow, SubmissionRow, ATTENDANCE_POINTS, RankRow, TZ, AuditEntry, branchFilter() (+42 more)

### Community 10 - "web/package.json (#10)"
Cohesion: 0.09
Nodes (38): BillingMode, ChargeDraft, ChargeKind, countLessons(), discountFor(), EngineContext, EngineDiscount, EngineEnrollment (+30 more)

### Community 11 - "todayLocal"
Cohesion: 0.06
Nodes (37): Attendance lock rule (attendance_lock_days), Audit log (append-only, GET /audit), Auth design (JWT 15 min, refresh rotation, HMAC hash), Billing engine planCharges (pure function), Branch scope helper (branch-scope.ts), Drizzle migrations plus handwritten SQL, ERD-VA-RUXSATLAR.md (rules source), FIFO payment allocation (AllocatorService) (+29 more)

### Community 12 - "ChargesService (#12)"
Cohesion: 0.07
Nodes (32): eslintConfig, dependencies, next@16.4.6, react@19.3.0, react-dom@19.3.0, devDependencies, eslint@^9, eslint-config-next@16.4.6 (+24 more)

### Community 13 - "writeAudit"
Cohesion: 0.19
Nodes (11): CreateBranchInput, createBranchSchema, listBranchesSchema, phone, UpdateBranchInput, updateBranchSchema, audited(), BranchesService (+3 more)

### Community 14 - "Tx"
Cohesion: 0.12
Nodes (8): clientOf(), PermissionsAdminController, roleParamSchema, setRolePermissionsSchema, setUserPermissionsSchema, assertConfigurable(), PermissionsAdminService, TenantRole

### Community 15 - "branchScope"
Cohesion: 0.26
Nodes (8): branchScope(), ScheduleItem, bad(), conflict(), escapeLike(), forbidden(), groupNotFound(), GroupsService

### Community 16 - "ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)"
Cohesion: 0.10
Nodes (14): BillingController, clientOf(), cancelChargeSchema, CreateManualChargeInput, createManualChargeSchema, generateBillingSchema, ListChargesQuery, listChargesSchema (+6 more)

### Community 17 - "NotificationsController"
Cohesion: 0.15
Nodes (5): clientOf(), NotificationsController, safeEqual(), listNotificationsSchema, runSchema

### Community 18 - ".branches"
Cohesion: 0.13
Nodes (11): ReportsController, BRANCH_SORTS, BranchesQuery, branchesQuerySchema, OverviewQuery, overviewQuerySchema, range, attendanceStats() (+3 more)

### Community 19 - "hashPassword"
Cohesion: 0.07
Nodes (38): @nestjs/testing@^12.0.1, supertest@^7.0.0, AppModule, AppConfig, envSchema, loadConfig(), parseDuration(), parseTrustProxy() (+30 more)

### Community 20 - "Ruxsatlar matritsasi (3-bo'lim)"
Cohesion: 0.08
Nodes (20): chunks(), clientOf(), EnrollmentsController, CreateEnrollmentInput, createEnrollmentSchema, LeaveEnrollmentInput, leaveEnrollmentSchema, ListEnrollmentsQuery (+12 more)

### Community 21 - "writeAudit"
Cohesion: 0.07
Nodes (39): writeAudit(), generateTempPassword(), CreateCenterInput, ListCentersQuery, UpdateCenterInput, CentersService, CreatedCenter, inCenter() (+31 more)

### Community 22 - "Yaratish va parol qoidalari jadvali (#22)"
Cohesion: 0.12
Nodes (26): attrs(), BUILTIN_DATE_FMTS, colIndex(), corrupt(), dateStyles(), decode(), ENTITIES, excelSerialToIso() (+18 more)

### Community 23 - "Roles"
Cohesion: 0.11
Nodes (15): Roles(), clientOf(), LessonsController, ATTENDANCE_STATUSES, attendanceQuerySchema, AttendanceStatus, CreateLessonInput, createLessonSchema (+7 more)

### Community 24 - "devDependencies"
Cohesion: 0.09
Nodes (31): typescript@^6.0.2, typescript, To'lov, maosh to'lovi, audit append-only, Byudjet $0, host-agnostik (Docker), Qarz saqlanmaydi, charges dan hisoblanadi, CLAUDE.md (loyiha ko'rsatmalari), Hujjatlarni o'qish tartibi, ORM: Drizzle (+23 more)

### Community 25 - "JwtAuthGuard"
Cohesion: 0.18
Nodes (4): JwtAuthGuard, PermissionsGuard, RolesGuard, unauthorized()

### Community 27 - "Skeleton"
Cohesion: 0.03
Nodes (89): LoginForm(), LoginPage(), metadata, instant, metadata, Page(), instant, metadata (+81 more)

### Community 28 - "lessons.service.ts"
Cohesion: 0.19
Nodes (9): daysBetween(), AttendanceQuery, bad(), conflict(), forbidden(), groupNotFound(), lessonNotFound(), LessonsService (+1 more)

### Community 29 - "Param"
Cohesion: 0.11
Nodes (3): PermissionsService, BillingService, DbService

### Community 30 - "ClientInfo"
Cohesion: 0.11
Nodes (44): uuid(), listAuditSchema, changePasswordSchema, loginSchema, refreshSchema, ClientInfo, LoginResult, AccessClaims (+36 more)

### Community 31 - "scripts (#31)"
Cohesion: 0.12
Nodes (20): AllocatorService, GenerateOptions, ChargeRow, CreatePaymentInput, createPaymentSchema, ListPaymentsQuery, listPaymentsSchema, note (+12 more)

### Community 32 - "api/package.json"
Cohesion: 0.10
Nodes (22): Audit jurnali: kim, nima, qachon, oldingi/keyingi, Auth: argon2, JWT + refresh, 2FA, Raqobatchilar: SchoolupCRM, UstozCRM, ALFA CRM, Umai CRM, Shaxsiy ma'lumotlar qonuni (lokalizatsiya), Birinchi 7 kunda 5 amaliy qadam, Bepul infra cheklovlari (Neon/Supabase, Render, Fly.io), 5-10 rahbar bilan suhbat (birinchi vazifa), Bozor tahlili (raqobatchilar) (+14 more)

### Community 33 - ".events"
Cohesion: 0.32
Nodes (5): AdjustRatingInput, RankingQuery, forbidden(), nf(), RatingsService

### Community 34 - "discounts.controller.ts"
Cohesion: 0.20
Nodes (3): clientOf(), DiscountsController, listDebtorsSchema

### Community 35 - ".hasIn"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+2 more)

### Community 36 - "todayLocal"
Cohesion: 0.10
Nodes (20): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+12 more)

### Community 37 - "groups"
Cohesion: 0.11
Nodes (24): assignments, attendance_records, branches, Markaz yaratish (POST /admin/centers), centers (tenant), courses, group_schedules, groups (+16 more)

### Community 38 - "api/package.json"
Cohesion: 0.07
Nodes (40): author, description, devDependencies, drizzle-kit@^0.31.11, @electric-sql/pglite@^0.5.16, @nestjs/cli@^12.0.0, @nestjs/mau@^0.2.6, @nestjs/schematics@^12.0.0 (+32 more)

### Community 39 - "CurrentUser"
Cohesion: 0.31
Nodes (6): audited(), discountNotFound(), DiscountsService, enrollmentNotFound(), forbidden(), overlap()

### Community 40 - "shared/package.json (#40)"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 41 - "lessons table"
Cohesion: 0.11
Nodes (19): scripts, build, db:create-super-admin, db:generate, db:migrate, db:seed, deploy, format (+11 more)

### Community 42 - "CoursesService"
Cohesion: 0.11
Nodes (13): clientOf(), CoursesController, CreateCourseInput, createCourseSchema, listCoursesSchema, price, UpdateCourseInput, updateCourseSchema (+5 more)

### Community 43 - "notifications.e2e-spec.ts"
Cohesion: 0.15
Nodes (13): SendResult, activate(), Api, Center, config, FakeSender, makeApi(), mkStudent() (+5 more)

### Community 44 - "attendance.e2e-spec.ts"
Cohesion: 0.11
Nodes (17): environment, healthcheck, image, ports, restart, volumes, POSTGRES_DB, POSTGRES_PASSWORD (+9 more)

### Community 45 - "spreadsheet.ts"
Cohesion: 0.12
Nodes (16): engines, node, name, packageManager, private, scripts, build, db:create-super-admin (+8 more)

### Community 46 - "react"
Cohesion: 0.07
Nodes (44): Plan, Assignment, LinkItem, Submission, instant, PanelLayout(), ERR, LogRow (+36 more)

### Community 47 - "Button"
Cohesion: 0.13
Nodes (57): Center, CentersPage(), CreateCenter, EditCenter, Plan, STATUS, PlanDialog, AssignmentDialog (+49 more)

### Community 48 - "payroll-engine.ts"
Cohesion: 0.16
Nodes (17): attachedGroups(), Attachment, EngineRule, fmt(), GroupBase, LessonCount, monthEndOf(), monthStartOf() (+9 more)

### Community 49 - "db.service.ts"
Cohesion: 0.08
Nodes (33): LOGIN_MAX_FAILURES, LOGIN_WINDOW_SECONDS, DebtorRow, GroupRow, APP_CONFIG, contextOf(), NO_CONTEXT, TenantContext (+25 more)

### Community 50 - "RequirePermission"
Cohesion: 0.20
Nodes (14): Ikki to'lov rejimi GROUP_CYCLE / STUDENT_CYCLE, Biznes sanasi Asia/Tashkent, Charge yaratish (idempotent, hodisalar bilan), charges, enrollment_discounts, enrollment_freezes, enrollments, GROUP_CYCLE (Najot usuli) (+6 more)

### Community 51 - "writeAudit"
Cohesion: 0.19
Nodes (13): center_role_permissions, Umumiy hisobotlar (overview, branch_compare), Moliya ruxsatlari (payment, debtors, expense, payroll), Tashkilot ruxsatlari (branch.manage, staff.create, student.*), Platforma ruxsatlari (center.create, owner.create, plan.manage), Tizim ruxsatlari (report, audit.view, import.run, telegram), Ruxsatni tekshirish qatlami (kod + scope + samarali ruxsat), Ruxsatlar matritsasi (✔ ○ – o f) (+5 more)

### Community 52 - "tsconfig.build.json (#52)"
Cohesion: 0.14
Nodes (14): dependencies, drizzle-orm@^0.45.4, @erp/shared@workspace:*, @nestjs/common@^12.0.1, @nestjs/jwt@^12.0.5, @node-rs/argon2@^2.2.2, reflect-metadata@^0.2.2, rxjs@^7.8.1 (+6 more)

### Community 53 - "Tx"
Cohesion: 0.22
Nodes (7): postgres@^4.1.1, client, permissions, client, db, PERMISSIONS, postgres

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
Cohesion: 0.42
Nodes (9): Skelet 1: Monorepo, Docker Compose, .env.example (tayyor), Skelet 2: Migratsiyalar 10 jadval (tayyor), Skelet 3: Auth login, JWT+refresh, guard (tayyor), Skelet 4: RLS va tenant izolyatsiya testi (tayyor), Skelet 5: Super admin markaz yaratish/bloklash (tayyor), Skelet 6: Rahbar filial va xodim yaratish, ruxsat sozlash (keyingi), Skelet 7: Audit jurnali va ruxsat matritsasi testi (kutmoqda), Skelet maqsadi: super admin markaz ochadi, rahbar kiradi, filial va xodim yaratadi (+1 more)

### Community 59 - "academic.controller.ts"
Cohesion: 0.18
Nodes (11): devDependencies, typescript@^5.9.3, typescript, main, name, private, scripts, build (+3 more)

### Community 60 - "settings-plans.e2e-spec.ts"
Cohesion: 0.33
Nodes (9): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+1 more)

### Community 61 - "payroll.controller.ts"
Cohesion: 0.19
Nodes (14): activate(), Api, Center, config, D2, makeApi(), mkStudent(), newCenter() (+6 more)

### Community 63 - "discounts.controller.ts"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, ChargeView, config, makeApi(), mkStudent(), newCenter() (+2 more)

### Community 64 - "payments"
Cohesion: 0.24
Nodes (10): audit_logs, expenses, Moliyaviy hisobot (kassa asosida), payment_allocations, To'lovni qaytarish (manfiy yozuv), payments, payroll_adjustments, Maosh oqimi: DRAFT, APPROVED, PAID (+2 more)

### Community 65 - "useApi"
Cohesion: 0.16
Nodes (49): AssignmentsPage(), AssignmentCard(), MySubmission(), Submissions(), BranchesPage(), CoursesPage(), StudentView(), GroupCard() (+41 more)

### Community 66 - "schema.ts"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, esModuleInterop, module, outDir, rootDir, skipLibCheck, strict (+2 more)

### Community 67 - "attendance.e2e-spec.ts"
Cohesion: 0.33
Nodes (9): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+1 more)

### Community 68 - "AuthUser"
Cohesion: 0.22
Nodes (5): AuthUser, forbidden(), forbidden(), notFound(), NotificationsService

### Community 69 - "finance.schemas.ts"
Cohesion: 0.08
Nodes (19): audited(), ExpensesService, forbidden(), notFound(), clientOf(), FinanceController, FinanceReportService, forbidden() (+11 more)

### Community 70 - ".run"
Cohesion: 0.09
Nodes (13): clientOf(), ImportsController, flag, ListImportsQuery, listImportsSchema, RunImportInput, runImportSchema, UploadedFile (+5 more)

### Community 71 - ".create"
Cohesion: 0.33
Nodes (9): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+1 more)

### Community 72 - "users"
Cohesion: 0.12
Nodes (18): Auth implementatsiyasi (JWT + refresh rotatsiya), Markazni bloklash (BLOCKED), group_teachers, Dars qulflanishi (locked_at, attendance.edit_past), lessons, notification_log, Maosh motori (planPayroll), payroll_items (+10 more)

### Community 74 - "with"
Cohesion: 0.05
Nodes (44): concurrency, cancel-in-progress, group, needs, runs-on, steps, timeout-minutes, POSTGRES_DB (+36 more)

### Community 75 - "TokenService"
Cohesion: 0.15
Nodes (6): accountInactive(), AuthService, centerBlocked(), invalidCredentials(), invalidRefresh(), TokenService

### Community 76 - "hashPassword"
Cohesion: 0.29
Nodes (6): env, node, rules, typescript/no-explicit-any, typescript/no-floating-promises, $schema

### Community 77 - "money"
Cohesion: 0.10
Nodes (36): Assignment, Balance, Dashboard(), DebtorRow, DebtorsPanel(), DeskView(), Group, METHOD (+28 more)

### Community 78 - "imports.controller.ts"
Cohesion: 0.29
Nodes (6): compilerOptions, rootDir, exclude, extends, include, ./tsconfig.json

### Community 79 - "attendance-lock.e2e-spec.ts"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 80 - "PageHead"
Cohesion: 0.15
Nodes (29): AttendancePage(), Row, Summary, Debtor, DebtorsPage(), Expense, ExpensesPage(), monthStart() (+21 more)

### Community 81 - "allowBuilds"
Cohesion: 0.18
Nodes (10): allowBuilds, @embedded-postgres/darwin-arm64, @embedded-postgres/darwin-x64, @embedded-postgres/linux-arm64, @embedded-postgres/linux-x64, @embedded-postgres/windows-x64, esbuild, sharp (+2 more)

### Community 82 - "main.ts"
Cohesion: 0.11
Nodes (12): @nestjs/core@^12.0.1, @nestjs/platform-express@^12.0.1, embedded-postgres@17.11.0-beta.19, dataDir, ensureRolesAndDb(), PG_LOCAL, startLocalPg(), superUrl() (+4 more)

### Community 83 - "permissions-admin.controller.ts"
Cohesion: 0.67
Nodes (4): Environment constraint: Docker/WSL unavailable, PGlite in-memory Postgres testing, Roadmap: deploy and operations, Roadmap: test on real Postgres

### Community 84 - "[...path]/route.ts"
Cohesion: 0.16
Nodes (24): POST(), POST(), BLOCKED, DELETE, GET, handle(), PASS_RESPONSE_HEADERS, PATCH (+16 more)

### Community 85 - ".withContext"
Cohesion: 0.19
Nodes (10): audited(), forbidden(), payoutNotFound(), PayoutsService, ListPeriodsQuery, forbidden(), locked(), PayrollService (+2 more)

### Community 86 - "dispatch.service.ts"
Cohesion: 0.07
Nodes (20): DispatchService, emptySummary(), badCodeMessage(), debtMessage(), formatSom(), hashLinkCode(), helpMessage(), homeworkMessage() (+12 more)

### Community 89 - "group-card.tsx"
Cohesion: 0.22
Nodes (18): CreateGroup, GroupsList(), instant, metadata, Page(), AttStatus, BILLING_MODE, Group (+10 more)

### Community 90 - "payroll-page.tsx"
Cohesion: 0.12
Nodes (20): Adjustment, Employee, Item, Payout, Period, PERIOD_STATUS, Rule, RULE_TYPE (+12 more)

### Community 91 - "groups.controller.ts"
Cohesion: 0.12
Nodes (17): id(), AssignTeacherInput, assignTeacherSchema, BILLING_KEYS, billingMode, CreateGroupInput, createGroupSchema, endTeacherSchema (+9 more)

### Community 92 - "imports.e2e-spec.ts"
Cohesion: 0.14
Nodes (17): hashPassword(), PARAMS, verifyAgainstDummy(), verifyPassword(), client, db, login, activate() (+9 more)

### Community 93 - "demo-seed.mjs"
Cohesion: 0.12
Nodes (16): activate(), call(), femaleish, first, groups, groupsDef, last, logins (+8 more)

### Community 94 - "CurrentUser"
Cohesion: 0.22
Nodes (3): CurrentUser, BranchesController, clientOf()

### Community 96 - "StudentsController"
Cohesion: 0.19
Nodes (3): clientOf(), StudentsController, listStudentsSchema

### Community 97 - "smoke.mjs"
Cohesion: 0.12
Nodes (14): branch, c, charges, course, enr, first, group, lesson (+6 more)

### Community 99 - "Deploy qo'llanmasi"
Cohesion: 0.14
Nodes (12): 1-variant: bitta VPS + Docker Compose (tavsiya), 2-variant: boshqariladigan xizmatlar (Neon + konteyner hosting), Avtomatik eslatmalar (cron), Deploy qo'llanmasi, Lokal ishlab chiqish, Muhit o'zgaruvchilari, Tekshirish, Telegram bot (+4 more)

### Community 101 - "Public"
Cohesion: 0.36
Nodes (4): AuthController, clientOf(), AllowMustChangePassword(), Public()

### Community 102 - "web"
Cohesion: 0.17
Nodes (13): condition, context, dockerfile, api, API_URL, WEB_SECURE_COOKIES, build, web (+5 more)

### Community 103 - "environment"
Cohesion: 0.17
Nodes (12): environment, CRON_SECRET, DATABASE_URL, JWT_ACCESS_SECRET, JWT_ACCESS_TTL, JWT_REFRESH_SECRET, JWT_REFRESH_TTL, NODE_ENV (+4 more)

### Community 104 - "discounts.service.ts"
Cohesion: 0.22
Nodes (8): CreateDiscountInput, createDiscountSchema, endDiscountSchema, ListDebtorsQuery, reason, DiscountRow, Range, enrollmentDiscounts

### Community 106 - "audit-page.tsx"
Cohesion: 0.29
Nodes (8): AuditPage(), AuditRow, dayEnd(), dayStart(), ENTITY, instant, metadata, Page()

### Community 107 - "migrate"
Cohesion: 0.22
Nodes (9): condition, db, DATABASE_MIGRATION_URL, command, depends_on, environment, image, restart (+1 more)

### Community 108 - "db"
Cohesion: 0.22
Nodes (9): environment, image, restart, volumes, APP_DB_PASSWORD, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER (+1 more)

### Community 110 - "caddy"
Cohesion: 0.25
Nodes (8): depends_on, environment, image, ports, restart, volumes, DOMAIN, caddy

### Community 111 - "app/layout.tsx"
Cohesion: 0.29
Nodes (4): geistMono, metadata, onest, viewport

### Community 112 - "services"
Cohesion: 0.29
Nodes (6): name, services, volumes, caddy_config, caddy_data, pgdata

### Community 113 - "ERD va ruxsatlar matritsasi"
Cohesion: 0.29
Nodes (7): Avans (taqsimlanmagan qoldiq), Qabul qilingan qarorlar va ochiq savollar, ERD va ruxsatlar matritsasi, join_proration (FULL_MONTH, REMAINING_LESSONS), RLS implementatsiyasi (erp_app, SECURITY DEFINER), Tenant izolyatsiyasi (RLS + servis tekshiruvi), Izolyatsiya testi (tenant-isolation.e2e-spec)

### Community 115 - "api"
Cohesion: 0.33
Nodes (6): depends_on, image, restart, migrate, condition, api

### Community 116 - "healthcheck"
Cohesion: 0.40
Nodes (5): healthcheck, interval, retries, test, timeout

### Community 118 - "ChangePasswordForm"
Cohesion: 0.67
Nodes (3): ChangePasswordForm(), ChangePasswordPage(), metadata

## Knowledge Gaps
- **53 isolated node(s):** `./tsconfig.json`, `Attendance lock rule (attendance_lock_days)`, `Auth design (JWT 15 min, refresh rotation, HMAC hash)`, `Branch scope helper (branch-scope.ts)`, `Drizzle migrations plus handwritten SQL` (+48 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 856 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Skeleton` to `audit-page.tsx`, `ChargesService (#12)`, `money`, `react`, `app/layout.tsx`, `PageHead`, `Button`, `[...path]/route.ts`, `next.config.ts`, `ChangePasswordForm`, `proxy.ts`, `group-card.tsx`, `payroll-page.tsx`?**
  _High betweenness centrality (0.210) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `Attendance lock rule (attendance_lock_days)`, `Auth design (JWT 15 min, refresh rotation, HMAC hash)` to the rest of the system?**
  _53 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `@nestjs/common` be split into smaller, more focused modules?**
  _Cohesion score 0.08140610545790934 - nodes in this community are weakly interconnected._
- **Why does `AuthUser` connect `AuthUser` to `@nestjs/common`, `academic.controller.ts`, `.update`, `payroll.schemas.ts`, `index.ts`, `StudentsService`, `CoursesService (#8)`, `Tx`, `writeAudit`, `Tx`, `branchScope`, `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)`, `NotificationsController`, `.branches`, `Ruxsatlar matritsasi (3-bo'lim)`, `writeAudit`, `Roles`, `lessons.service.ts`, `ClientInfo`, `scripts (#31)`, `.events`, `discounts.controller.ts`, `CurrentUser`, `CoursesService`, `db.service.ts`, `finance.schemas.ts`, `.run`, `TokenService`, `.withContext`, `groups.controller.ts`, `imports.e2e-spec.ts`, `CurrentUser`, `GroupsController`, `StudentsController`, `.reverse`, `Public`, `discounts.service.ts`, `.update`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Should `academic.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07704918032786885 - nodes in this community are weakly interconnected._
- **Why does `CLAUDE.md (loyiha ko'rsatmalari)` connect `devDependencies` to `api/package.json`, `ERD va ruxsatlar matritsasi`, `RequirePermission`, `Module`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Should `EnrollmentsService` be split into smaller, more focused modules?**
  _Cohesion score 0.10631229235880399 - nodes in this community are weakly interconnected._