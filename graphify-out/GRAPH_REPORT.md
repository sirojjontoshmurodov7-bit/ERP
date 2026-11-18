# Graph Report - ERP  (2026-11-19)

## Corpus Check
- 162 files · ~98,452 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 5, .css 2, .example 1)

## Summary
- 1808 nodes · 5837 edges · 89 communities (81 shown, 8 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 388 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4e5c2c51`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- @nestjs/common
- @nestjs/common
- branchScope() (#2)
- EnrollmentsService
- lessons.schemas.ts
- inScope() (#5)
- StudentsService (#6)
- BranchesService (#7)
- CoursesService (#8)
- .login
- web/package.json (#10)
- todayLocal
- ChargesService (#12)
- students.service.ts (#13)
- schema.ts
- enrollments table (#15)
- ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)
- CLAUDE.md (loyiha ko'rsatmalari) (#17)
- REJA.md (#18)
- PermissionsAdminService
- Ruxsatlar matritsasi (3-bo'lim)
- DbService
- Yaratish va parol qoidalari jadvali (#22)
- compilerOptions (#23)
- devDependencies (#24)
- centers.e2e-spec.ts
- compilerOptions (#26)
- scripts (#27)
- db (#28)
- .withContext
- centers table (tenant) (#30)
- scripts (#31)
- api/package.json
- dependencies (#33)
- permission-matrix.ts
- .hasIn
- finance.schemas.ts
- .end
- permissions table (code catalog) (#38)
- Param
- shared/package.json (#40)
- lessons table
- compilerOptions (#42)
- enrollments.e2e-spec.ts
- attendance.e2e-spec.ts
- PayrollController
- payments table (#46)
- payroll.controller.ts
- .oxlintrc.json (#48)
- .generate
- RequirePermission
- Tx
- tsconfig.build.json (#52)
- Tx
- nest-cli.json (#54)
- payroll.e2e-spec.ts
- allowBuilds (#56)
- vitest (#57)
- payments.controller.ts
- Environment limitation: Docker/WSL unava (#60)
- branchScope
- GROUP_CYCLE billing mode
- discounts.controller.ts
- payroll-engine.ts
- branchFilter
- groups.service.ts
- PayrollRulesService
- .create
- FinanceReportService
- db.service.ts
- .create
- main.ts
- finance.e2e-spec.ts
- seed.ts
- auth.service.ts
- centers.schemas.ts
- app.controller.ts
- .branches
- attendance-lock.e2e-spec.ts
- discounts-debtors.e2e-spec.ts
- payments.e2e-spec.ts
- reports.e2e-spec.ts
- permissions-admin.controller.ts
- StaffController
- activate
- ConfigModule
- DbModule
- source-map-support@^0.5.21

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 283 edges
2. `CurrentUser` - 114 edges
3. `Tx` - 98 edges
4. `ClientInfo` - 92 edges
5. `@nestjs/common` - 83 edges
6. `writeAudit()` - 62 edges
7. `branchScope()` - 60 edges
8. `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)` - 58 edges
9. `DbService` - 53 edges
10. `drizzle-orm` - 52 edges

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

## Communities (89 total, 8 thin omitted)

### Community 0 - "@nestjs/common"
Cohesion: 0.17
Nodes (21): changePasswordSchema, loginSchema, refreshSchema, ClientInfo, ALLOW_MUST_CHANGE, IS_PUBLIC, PERMISSIONS_KEY, Roles() (+13 more)

### Community 1 - "@nestjs/common"
Cohesion: 0.10
Nodes (16): AuditModule, AuthModule, BillingModule, BranchesModule, CentersModule, CoursesModule, EnrollmentsModule, FinanceModule (+8 more)

### Community 2 - "branchScope() (#2)"
Cohesion: 0.08
Nodes (25): clientOf(), GroupsController, AssignTeacherInput, assignTeacherSchema, BILLING_KEYS, billingMode, CreateGroupInput, createGroupSchema (+17 more)

### Community 3 - "EnrollmentsService"
Cohesion: 0.08
Nodes (20): chunks(), clientOf(), EnrollmentsController, CreateEnrollmentInput, createEnrollmentSchema, LeaveEnrollmentInput, leaveEnrollmentSchema, ListEnrollmentsQuery (+12 more)

### Community 4 - "lessons.schemas.ts"
Cohesion: 0.08
Nodes (22): clientOf(), LessonsController, ATTENDANCE_STATUSES, AttendanceQuery, attendanceQuerySchema, AttendanceStatus, CreateLessonInput, createLessonSchema (+14 more)

### Community 5 - "inScope() (#5)"
Cohesion: 0.10
Nodes (12): clientOf(), branchIds, CreateStaffInput, createStaffSchema, ListStaffQuery, listStaffSchema, login, phone (+4 more)

### Community 6 - "StudentsService (#6)"
Cohesion: 0.10
Nodes (11): clientOf(), StudentsController, birthDate, CreateStudentInput, createStudentSchema, ListStudentsQuery, listStudentsSchema, login (+3 more)

### Community 7 - "BranchesService (#7)"
Cohesion: 0.10
Nodes (13): BranchesController, clientOf(), CreateBranchInput, createBranchSchema, listBranchesSchema, phone, UpdateBranchInput, updateBranchSchema (+5 more)

### Community 8 - "CoursesService (#8)"
Cohesion: 0.11
Nodes (13): clientOf(), CoursesController, CreateCourseInput, createCourseSchema, listCoursesSchema, price, UpdateCourseInput, updateCourseSchema (+5 more)

### Community 9 - ".login"
Cohesion: 0.06
Nodes (15): AuthController, clientOf(), accountInactive(), AuthService, centerBlocked(), invalidCredentials(), invalidRefresh(), AllowMustChangePassword() (+7 more)

### Community 10 - "web/package.json (#10)"
Cohesion: 0.06
Nodes (34): eslintConfig, nextConfig, dependencies, next@16.4.6, react@19.3.0, react-dom@19.3.0, devDependencies, eslint@^9 (+26 more)

### Community 11 - "todayLocal"
Cohesion: 0.09
Nodes (39): BillingMode, ChargeDraft, ChargeKind, countLessons(), discountFor(), EngineContext, EngineDiscount, EngineEnrollment (+31 more)

### Community 12 - "ChargesService (#12)"
Cohesion: 0.13
Nodes (10): BillingController, clientOf(), cancelChargeSchema, CreateManualChargeInput, createManualChargeSchema, generateBillingSchema, ListChargesQuery, listChargesSchema (+2 more)

### Community 13 - "students.service.ts (#13)"
Cohesion: 0.12
Nodes (21): generateTempPassword(), CreateCenterInput, CreatedCenter, SUPER, generateLogin(), isLoginConflict(), MAX_LOGIN_TRIES, CYRILLIC (+13 more)

### Community 14 - "schema.ts"
Cohesion: 0.18
Nodes (23): GenerateOptions, ChargeRow, DiscountRow, Range, PaymentRow, branchFilter(), BranchScope, branches (+15 more)

### Community 15 - "enrollments table (#15)"
Cohesion: 0.16
Nodes (18): Advance (unallocated balance) auto-allocation, Qaror: avans va ko'p oylik to'lov mumkin, To'lov eng eski ochiq charge ga taqsimlanadi, ortiqcha = avans, Event-driven idempotent charge generation, charges table, Chegirma charge yaratilganda qotiriladi, enrollment_discounts table, enrollment_freezes table (+10 more)

### Community 16 - "ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)"
Cohesion: 0.10
Nodes (37): assignments, Filialga bog'lash: OWNER hammasi, ADMIN/CASHIER user_branches, branches table, courses table, Bir o'quvchi bitta akkaunt, turli filial guruhlarida, Maosh qoidalari faqat rahbarda, O'quvchi filial reytingini to'liq ism bilan ko'radi, Ustoz moliyani ko'rmaydi (○: faqat qarz bor/yo'q) (+29 more)

### Community 17 - "CLAUDE.md (loyiha ko'rsatmalari) (#17)"
Cohesion: 0.10
Nodes (29): typescript@^6.0.2, typescript, Byudjet $0, host-agnostik (Docker), CLAUDE.md (loyiha ko'rsatmalari), Hujjatlarni o'qish tartibi, ORM: Drizzle, Qaror ERD dan chetga chiqsa avval hujjatni yangila, ERD hujjati model va ruxsatlar manbasi (+21 more)

### Community 18 - "REJA.md (#18)"
Cohesion: 0.09
Nodes (26): Audit jurnali: kim, nima, qachon, oldingi/keyingi, Auth: argon2, JWT + refresh, 2FA, Raqobatchilar: SchoolupCRM, UstozCRM, ALFA CRM, Umai CRM, Shaxsiy ma'lumotlar qonuni (lokalizatsiya), Birinchi 7 kunda 5 amaliy qadam, Bepul infra cheklovlari (Neon/Supabase, Render, Fly.io), 5-10 rahbar bilan suhbat (birinchi vazifa), Bozor tahlili (raqobatchilar) (+18 more)

### Community 19 - "PermissionsAdminService"
Cohesion: 0.15
Nodes (5): clientOf(), PermissionsAdminController, assertConfigurable(), PermissionsAdminService, TenantRole

### Community 20 - "Ruxsatlar matritsasi (3-bo'lim)"
Cohesion: 0.14
Nodes (16): Kassir/admin alohida rol, ruxsat orqali birlashishi mumkin, Markaz boshlang'ich settings (GROUP_CYCLE, grace 0, FULL_MONTH, NONE, uz), Markaz yaratish POST /admin/centers (bitta tranzaksiya), Ruxsatlar matritsasi (3-bo'lim), Belgilar: ✔ ○ – o f, Super admin tenant ichini ko'rmaydi; impersonate hozircha yo'q, Matritsa 3.2 Tashkilot va foydalanuvchilar, Matritsa 3.1 Platforma (faqat SUPER_ADMIN) (+8 more)

### Community 21 - "DbService"
Cohesion: 0.13
Nodes (4): PermissionsService, AllocatorService, BillingService, DbService

### Community 22 - "Yaratish va parol qoidalari jadvali (#22)"
Cohesion: 0.09
Nodes (29): Parol: argon2, must_change_password, Skelet 1: Monorepo, Docker Compose, .env.example (tayyor), Skelet 2: Migratsiyalar 10 jadval (tayyor), Skelet 3: Auth login, JWT+refresh, guard (tayyor), Skelet 4: RLS va tenant izolyatsiya testi (tayyor), Skelet 5: Super admin markaz yaratish/bloklash (tayyor), Skelet 6: Rahbar filial va xodim yaratish, ruxsat sozlash (keyingi), Skelet 7: Audit jurnali va ruxsat matritsasi testi (kutmoqda) (+21 more)

### Community 23 - "compilerOptions (#23)"
Cohesion: 0.10
Nodes (20): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+12 more)

### Community 24 - "devDependencies (#24)"
Cohesion: 0.09
Nodes (21): devDependencies, drizzle-kit@^0.31.11, @electric-sql/pglite@^0.5.16, @nestjs/cli@^12.0.0, @nestjs/mau@^0.2.6, @nestjs/schematics@^12.0.0, @nestjs/testing@^12.0.1, oxlint@^1.58.0 (+13 more)

### Community 25 - "centers.e2e-spec.ts"
Cohesion: 0.10
Nodes (38): AppModule, hashPassword(), PARAMS, verifyAgainstDummy(), verifyPassword(), APP_CONFIG, AppConfig, envSchema (+30 more)

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
Cohesion: 0.22
Nodes (5): writeAudit(), forbidden(), CentersService, inCenter(), notFound()

### Community 30 - "centers table (tenant) (#30)"
Cohesion: 0.10
Nodes (21): Qarz saqlanmaydi, charges dan hisoblanadi, centers table (tenant), Trigger centers_guard_platform_columns, Qarzdor: today > due_date + grace_days va charge to'lanmagan, grace_days: markaz sukuti + groups.grace_days, import_jobs, users/centers/branches/plans ga DELETE huquqi yo'q, plans table (SaaS tariffs) (+13 more)

### Community 31 - "scripts (#31)"
Cohesion: 0.12
Nodes (16): engines, node, name, packageManager, private, scripts, build, db:create-super-admin (+8 more)

### Community 32 - "api/package.json"
Cohesion: 0.11
Nodes (17): author, description, oxlint-tsgolint@^7.0.2001, prettier@^3.4.2, tsx@^4.23.15, @types/express@^5.0.0, vite@^8.0.0, license (+9 more)

### Community 33 - "dependencies (#33)"
Cohesion: 0.12
Nodes (16): dependencies, drizzle-orm@^0.45.4, @erp/shared@workspace:*, @nestjs/common@^12.0.1, @nestjs/jwt@^12.0.5, @nestjs/platform-express@^12.0.1, @node-rs/argon2@^2.2.2, reflect-metadata@^0.2.2 (+8 more)

### Community 34 - "permission-matrix.ts"
Cohesion: 0.15
Nodes (11): PAYMENT_MODES, PaymentMode, ROLES, ROLE_PERMISSION_MATRIX, PERMISSION_CODES, PERMISSION_MODULES, PermissionCode, PermissionDef (+3 more)

### Community 35 - ".hasIn"
Cohesion: 0.33
Nodes (6): ListPeriodsQuery, forbidden(), locked(), PayrollService, periodNotFound(), periodView()

### Community 36 - "finance.schemas.ts"
Cohesion: 0.15
Nodes (13): daysBetween(), category, CreateExpenseInput, ListExpensesQuery, listExpensesSchema, MAX_REPORT_DAYS, reason, voidExpenseSchema (+5 more)

### Community 37 - ".end"
Cohesion: 0.31
Nodes (6): audited(), discountNotFound(), DiscountsService, enrollmentNotFound(), forbidden(), overlap()

### Community 38 - "permissions table (code catalog) (#38)"
Cohesion: 0.21
Nodes (13): Ruxsatlar: rol + center_role_permissions + user_permissions, scope so'rov filtri, center_role_permissions (role template), Samarali ruxsat = rol shabloni ± user istisnosi, permissions pnpm db:seed orqali @erp/shared dan, Permissions matrix (checkmark / optional / never), Permission scopes (center, branch, own group, own record), permissions table (code catalog), Qoida 8: Ruxsat = rol + markaz sozlamasi + foydalanuvchi istisnosi (+5 more)

### Community 39 - "Param"
Cohesion: 0.25
Nodes (5): clientOf(), clientOf(), createExpenseSchema, clientOf(), PayrollController

### Community 40 - "shared/package.json (#40)"
Cohesion: 0.18
Nodes (11): devDependencies, typescript@^5.9.3, typescript, main, name, private, scripts, build (+3 more)

### Community 41 - "lessons table"
Cohesion: 0.18
Nodes (12): Accepted decisions and resolved questions, Attendance lock rule (attendance_lock_days), attendance_records table, join_proration setting (FULL_MONTH, REMAINING_LESSONS), Dars qulflanishi lessons.locked_at, attendance.edit_past, lessons table, Matritsa 3.3 Guruh, davomat, vazifa, reyting, Reyting agregatsiya orqali, alohida jadval yo'q (+4 more)

### Community 42 - "compilerOptions (#42)"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, esModuleInterop, module, outDir, rootDir, skipLibCheck, strict (+2 more)

### Community 43 - "enrollments.e2e-spec.ts"
Cohesion: 0.33
Nodes (9): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+1 more)

### Community 44 - "attendance.e2e-spec.ts"
Cohesion: 0.33
Nodes (9): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+1 more)

### Community 45 - "PayrollController"
Cohesion: 0.23
Nodes (5): CurrentUser, DiscountsController, FinanceController, reportQuerySchema, ReportsController

### Community 46 - "payments table (#46)"
Cohesion: 0.28
Nodes (8): To'lov, maosh to'lovi, audit append-only, audit_logs (append-only), audit_logs UPDATE/DELETE/TRUNCATE triggerlar bilan bloklangan, payments table, Matritsa 3.4 Moliya, Qaytarish: status=REVERSED va reverses_payment_id, Qoida 3: Pul append-only, teskari yozuv, Step 7: GET /audit and permission matrix test

### Community 47 - "payroll.controller.ts"
Cohesion: 0.18
Nodes (16): id(), month(), CreateAdjustmentInput, createAdjustmentSchema, createPayoutSchema, createRuleSchema, endRuleSchema, listPayoutsSchema (+8 more)

### Community 48 - ".oxlintrc.json (#48)"
Cohesion: 0.29
Nodes (6): env, node, rules, typescript/no-explicit-any, typescript/no-floating-promises, $schema

### Community 49 - ".generate"
Cohesion: 0.37
Nodes (5): AuthUser, audited(), chargeNotFound(), ChargesService, forbidden()

### Community 50 - "RequirePermission"
Cohesion: 0.08
Nodes (7): AuditController, RequirePermission(), CentersController, clientOf(), ProbeController, ProbeController, ProbeController

### Community 51 - "Tx"
Cohesion: 0.11
Nodes (19): AuditEntry, listAuditSchema, client, db, login, Tx, auditLogs, groupTeachers (+11 more)

### Community 52 - "tsconfig.build.json (#52)"
Cohesion: 0.29
Nodes (6): compilerOptions, rootDir, exclude, extends, include, ./tsconfig.json

### Community 53 - "Tx"
Cohesion: 0.20
Nodes (6): audited(), forbidden(), paymentNotFound(), PaymentsService, studentNotFound(), inScope()

### Community 54 - "nest-cli.json (#54)"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 55 - "payroll.e2e-spec.ts"
Cohesion: 0.21
Nodes (11): activate(), Api, Center, config, M, makeApi(), newCenter(), NEXT (+3 more)

### Community 56 - "allowBuilds (#56)"
Cohesion: 0.40
Nodes (4): allowBuilds, sharp, unrs-resolver, packages

### Community 59 - "payments.controller.ts"
Cohesion: 0.13
Nodes (9): clientOf(), id(), PaymentsController, CreatePaymentInput, createPaymentSchema, ListPaymentsQuery, listPaymentsSchema, note (+1 more)

### Community 61 - "branchScope"
Cohesion: 0.26
Nodes (6): branchScope(), branchNotFound(), escapeLike(), forbidden(), notFound(), StudentsService

### Community 62 - "GROUP_CYCLE billing mode"
Cohesion: 0.33
Nodes (9): Ikki to'lov rejimi GROUP_CYCLE / STUDENT_CYCLE, Ikki to'lov sikli taqqoslash jadvali, GROUP_CYCLE billing mode, Oy oxiri: 29-31 kun oyning oxirgi kuniga siljiydi, STUDENT_CYCLE billing mode, Bozor bo'shlig'i (taxmin), Moslashuvchan maosh motori (farqlovchi), Ikki xil to'lov sikli (farqlovchi) (+1 more)

### Community 63 - "discounts.controller.ts"
Cohesion: 0.21
Nodes (8): DebtorsService, id(), CreateDiscountInput, createDiscountSchema, endDiscountSchema, ListDebtorsQuery, listDebtorsSchema, reason

### Community 64 - "payroll-engine.ts"
Cohesion: 0.16
Nodes (17): attachedGroups(), Attachment, EngineRule, fmt(), GroupBase, LessonCount, monthEndOf(), monthStartOf() (+9 more)

### Community 65 - "branchFilter"
Cohesion: 0.33
Nodes (4): audited(), ExpensesService, forbidden(), notFound()

### Community 66 - "groups.service.ts"
Cohesion: 0.17
Nodes (15): currentTeacher(), groupVisibility(), studentGroupIds(), teacherGroupIds(), teacherStudentIds(), pgErrorInfo(), uniqueViolation(), CourseRow (+7 more)

### Community 67 - "PayrollRulesService"
Cohesion: 0.27
Nodes (8): audited(), bad(), forbidden(), PayrollRulesService, ruleNotFound(), CreateRuleInput, ListRulesQuery, UpdateRuleInput

### Community 68 - ".create"
Cohesion: 0.24
Nodes (7): branchNotFound(), createCode(), editCode(), forbidden(), manageableRoles(), userNotFound(), UsersService

### Community 69 - "FinanceReportService"
Cohesion: 0.36
Nodes (4): FinanceReportService, forbidden(), num(), ReportQuery

### Community 70 - "db.service.ts"
Cohesion: 0.16
Nodes (14): DebtorRow, GroupRow, contextOf(), NO_CONTEXT, TenantContext, rowsOf(), centerRolePermissions, userPermissions (+6 more)

### Community 71 - ".create"
Cohesion: 0.25
Nodes (6): audited(), forbidden(), payoutNotFound(), PayoutsService, CreatePayoutInput, ListPayoutsQuery

### Community 72 - "main.ts"
Cohesion: 0.29
Nodes (3): @nestjs/core@^12.0.1, envFile, @nestjs/core

### Community 73 - "finance.e2e-spec.ts"
Cohesion: 0.26
Nodes (10): activate(), Api, Center, config, D2, makeApi(), mkStudent(), newCenter() (+2 more)

### Community 74 - "seed.ts"
Cohesion: 0.25
Nodes (6): postgres@^4.1.1, client, permissions, client, db, postgres

### Community 75 - "auth.service.ts"
Cohesion: 0.32
Nodes (9): LoginResult, AccessClaims, AuthedRequest, SessionRow, TokenPair, UserRow, centers, sessions (+1 more)

### Community 76 - "centers.schemas.ts"
Cohesion: 0.24
Nodes (10): id(), blockCenterSchema, createCenterSchema, ListCentersQuery, listCentersSchema, phone, resetOwnerPasswordSchema, slug (+2 more)

### Community 78 - ".branches"
Cohesion: 0.27
Nodes (5): BranchesQuery, attendanceStats(), forbidden(), num(), ReportsService

### Community 79 - "attendance-lock.e2e-spec.ts"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), Row (+2 more)

### Community 80 - "discounts-debtors.e2e-spec.ts"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, ChargeView, config, makeApi(), mkStudent(), newCenter() (+2 more)

### Community 81 - "payments.e2e-spec.ts"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, ChargeView, config, makeApi(), mkStudent(), newCenter() (+2 more)

### Community 82 - "reports.e2e-spec.ts"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+2 more)

### Community 83 - "permissions-admin.controller.ts"
Cohesion: 0.53
Nodes (3): roleParamSchema, setRolePermissionsSchema, setUserPermissionsSchema

### Community 85 - "activate"
Cohesion: 0.67
Nodes (4): activate(), makeApi(), newCenter(), staff()

## Knowledge Gaps
- **45 isolated node(s):** `./tsconfig.json`, `Qaror: avans va ko'p oylik to'lov mumkin`, `O'quvchini ko'chirish: eski enrollments yopiladi, yangisi ochiladi`, `Filialga bog'lash: OWNER hammasi, ADMIN/CASHIER user_branches`, `users.login global noyob (lower(login))` (+40 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 449 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthUser` connect `.generate` to `@nestjs/common`, `branchScope() (#2)`, `EnrollmentsService`, `lessons.schemas.ts`, `inScope() (#5)`, `StudentsService (#6)`, `BranchesService (#7)`, `CoursesService (#8)`, `.login`, `ChargesService (#12)`, `students.service.ts (#13)`, `schema.ts`, `PermissionsAdminService`, `.withContext`, `.hasIn`, `.end`, `Param`, `PayrollController`, `payroll.controller.ts`, `RequirePermission`, `Tx`, `Tx`, `payments.controller.ts`, `branchScope`, `discounts.controller.ts`, `branchFilter`, `groups.service.ts`, `PayrollRulesService`, `.create`, `FinanceReportService`, `db.service.ts`, `.create`, `auth.service.ts`, `centers.schemas.ts`, `.branches`, `permissions-admin.controller.ts`?**
  _High betweenness centrality (0.217) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `Qaror: avans va ko'p oylik to'lov mumkin`, `O'quvchini ko'chirish: eski enrollments yopiladi, yangisi ochiladi` to the rest of the system?**
  _45 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `@nestjs/common` be split into smaller, more focused modules?**
  _Cohesion score 0.09805735430157261 - nodes in this community are weakly interconnected._
- **Why does `CLAUDE.md (loyiha ko'rsatmalari)` connect `CLAUDE.md (loyiha ko'rsatmalari) (#17)` to `permissions table (code catalog) (#38)`, `lessons table`, `payments table (#46)`, `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)`, `REJA.md (#18)`, `Yaratish va parol qoidalari jadvali (#22)`, `centers table (tenant) (#30)`, `GROUP_CYCLE billing mode`?**
  _High betweenness centrality (0.183) - this node is a cross-community bridge._
- **Should `branchScope() (#2)` be split into smaller, more focused modules?**
  _Cohesion score 0.08322026232473993 - nodes in this community are weakly interconnected._
- **Why does `typescript` connect `CLAUDE.md (loyiha ko'rsatmalari) (#17)` to `api/package.json`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **Should `EnrollmentsService` be split into smaller, more focused modules?**
  _Cohesion score 0.08416130917592052 - nodes in this community are weakly interconnected._