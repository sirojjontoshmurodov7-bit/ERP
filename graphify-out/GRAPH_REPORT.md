# Graph Report - ERP  (2026-11-19)

## Corpus Check
- 193 files · ~124,436 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 5, .css 2, .example 1)

## Summary
- 2145 nodes · 7002 edges · 91 communities (84 shown, 7 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 450 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ecb3ea07`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- .run
- @nestjs/common
- academic.controller.ts
- EnrollmentsService
- auth.controller.ts
- payroll.schemas.ts
- schema.ts
- BranchesService
- CoursesService (#8)
- auth.service.ts
- web/package.json (#10)
- todayLocal
- ChargesService (#12)
- students.service.ts (#13)
- Tx
- enrollments table (#15)
- ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)
- telegram-bot.service.ts
- .branches
- hashPassword
- Ruxsatlar matritsasi (3-bo'lim)
- DbService
- Yaratish va parol qoidalari jadvali (#22)
- compilerOptions (#23)
- devDependencies
- TokenService
- compilerOptions (#26)
- Tx
- db (#28)
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
- .run
- payroll-engine.ts
- .generate
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
- Environment limitation: Docker/WSL unava (#60)
- payroll.controller.ts
- GROUP_CYCLE billing mode
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
- permission-matrix.ts
- .hasIn
- .login
- hashPassword
- .changePassword
- imports.controller.ts
- attendance-lock.e2e-spec.ts
- PayrollRulesService
- payments.e2e-spec.ts
- reports.e2e-spec.ts
- permissions-admin.controller.ts
- Public
- LoginThrottle
- .webhook
- app.controller.ts
- centers.schemas.ts
- DbModule
- @nestjs/mau@^0.2.6

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 344 edges
2. `CurrentUser` - 139 edges
3. `Tx` - 114 edges
4. `ClientInfo` - 109 edges
5. `@nestjs/common` - 100 edges
6. `writeAudit()` - 78 edges
7. `branchScope()` - 71 edges
8. `DbService` - 65 edges
9. `drizzle-orm` - 61 edges
10. `Roles()` - 60 edges

## Surprising Connections (you probably didn't know these)
- `Frontend: Next.js (React)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `CLAUDE.md (loyiha ko'rsatmalari)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `Backend: NestJS modulli monolit` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `AuthUser` --references--> `Role`  [EXTRACTED]
  apps/api/src/auth/auth.types.ts → packages/shared/src/index.ts
- `AccessClaims` --references--> `Role`  [EXTRACTED]
  apps/api/src/auth/auth.types.ts → packages/shared/src/index.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Hisob-kitob, to'lov va qarz oqimi** — erd_va_ruxsatlar_enrollments, erd_va_ruxsatlar_charges, erd_va_ruxsatlar_payment_allocations, erd_va_ruxsatlar_payments [EXTRACTED 1.00]
- **Samarali ruxsat: rol shabloni va foydalanuvchi istisnosi** — erd_va_ruxsatlar_permissions, erd_va_ruxsatlar_center_role_permissions, erd_va_ruxsatlar_user_permissions, erd_va_ruxsatlar_permission_layer [EXTRACTED 1.00]
- **Append-only pul va audit jadvallari** — erd_va_ruxsatlar_payments, erd_va_ruxsatlar_payroll_payouts, erd_va_ruxsatlar_audit_logs, erd_va_ruxsatlar_expenses [EXTRACTED 1.00]
- **Money flow: charges, payments, payroll, finance** — progress_step13_billing_charges, progress_step14_payments, progress_step16_payroll, progress_step17_expenses_finance [INFERRED 0.85]
- **Tenant security foundation** — progress_rls_tenant_isolation, progress_composite_fk_pattern, progress_auth_design, progress_permission_model [INFERRED 0.85]

## Communities (91 total, 7 thin omitted)

### Community 0 - ".run"
Cohesion: 0.14
Nodes (16): bad(), forbidden(), ImportsService, jobView(), safeName(), ALIASES, HeaderMap, LOOKUP (+8 more)

### Community 1 - "@nestjs/common"
Cohesion: 0.06
Nodes (18): AuditController, RequirePermission(), CentersController, clientOf(), id(), blockCenterSchema, createCenterSchema, ListCentersQuery (+10 more)

### Community 2 - "academic.controller.ts"
Cohesion: 0.10
Nodes (20): AcademicController, clientOf(), uuid(), adjustRatingSchema, CreateAssignmentInput, createAssignmentSchema, GradeInput, gradeSchema (+12 more)

### Community 3 - "EnrollmentsService"
Cohesion: 0.08
Nodes (19): AcademicModule, AuditModule, AuthModule, BillingModule, BranchesModule, CentersModule, CoursesModule, EnrollmentsModule (+11 more)

### Community 4 - "auth.controller.ts"
Cohesion: 0.23
Nodes (6): AuthController, changePasswordSchema, clientOf(), loginSchema, refreshSchema, AllowMustChangePassword()

### Community 5 - "payroll.schemas.ts"
Cohesion: 0.07
Nodes (31): audited(), forbidden(), payoutNotFound(), PayoutsService, clientOf(), PayrollController, CreateAdjustmentInput, createAdjustmentSchema (+23 more)

### Community 6 - "schema.ts"
Cohesion: 0.12
Nodes (31): AssignmentRow, homeworkPoints(), SubmissionRow, AuditEntry, GenerateOptions, ChargeRow, DiscountRow, Range (+23 more)

### Community 7 - "BranchesService"
Cohesion: 0.12
Nodes (8): clientOf(), StudentsController, birthDate, createStudentSchema, listStudentsSchema, login, phone, updateStudentSchema

### Community 8 - "CoursesService (#8)"
Cohesion: 0.07
Nodes (21): clientOf(), StaffController, UserPasswordController, branchIds, CreateStaffInput, createStaffSchema, ListStaffQuery, listStaffSchema (+13 more)

### Community 9 - "auth.service.ts"
Cohesion: 0.08
Nodes (41): listAuditSchema, AuthedRequest, SessionRow, UserRow, DebtorRow, forbidden(), GroupRow, ListDebtorsQuery (+33 more)

### Community 10 - "web/package.json (#10)"
Cohesion: 0.10
Nodes (38): BillingMode, ChargeDraft, ChargeKind, countLessons(), discountFor(), EngineContext, EngineDiscount, EngineEnrollment (+30 more)

### Community 11 - "todayLocal"
Cohesion: 0.06
Nodes (37): Attendance lock rule (attendance_lock_days), Audit log (append-only, GET /audit), Auth design (JWT 15 min, refresh rotation, HMAC hash), Billing engine planCharges (pure function), Branch scope helper (branch-scope.ts), Drizzle migrations plus handwritten SQL, ERD-VA-RUXSATLAR.md (rules source), FIFO payment allocation (AllocatorService) (+29 more)

### Community 12 - "ChargesService (#12)"
Cohesion: 0.06
Nodes (34): eslintConfig, nextConfig, dependencies, next@16.4.6, react@19.3.0, react-dom@19.3.0, devDependencies, eslint@^9 (+26 more)

### Community 13 - "students.service.ts (#13)"
Cohesion: 0.10
Nodes (13): BranchesController, clientOf(), CreateBranchInput, createBranchSchema, listBranchesSchema, phone, UpdateBranchInput, updateBranchSchema (+5 more)

### Community 14 - "Tx"
Cohesion: 0.13
Nodes (5): clientOf(), PermissionsAdminController, assertConfigurable(), PermissionsAdminService, TenantRole

### Community 15 - "enrollments table (#15)"
Cohesion: 0.08
Nodes (25): clientOf(), GroupsController, AssignTeacherInput, assignTeacherSchema, BILLING_KEYS, billingMode, CreateGroupInput, createGroupSchema (+17 more)

### Community 16 - "ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)"
Cohesion: 0.13
Nodes (11): BillingController, clientOf(), id(), cancelChargeSchema, CreateManualChargeInput, createManualChargeSchema, generateBillingSchema, ListChargesQuery (+3 more)

### Community 17 - "telegram-bot.service.ts"
Cohesion: 0.05
Nodes (33): Candidate, DispatchService, emptySummary(), badCodeMessage(), debtMessage(), formatSom(), hashLinkCode(), helpMessage() (+25 more)

### Community 18 - ".branches"
Cohesion: 0.13
Nodes (12): daysBetween(), ReportsController, BRANCH_SORTS, BranchesQuery, branchesQuerySchema, OverviewQuery, overviewQuerySchema, range (+4 more)

### Community 19 - "hashPassword"
Cohesion: 0.09
Nodes (37): AppModule, hashPassword(), PARAMS, verifyAgainstDummy(), verifyPassword(), DB, Db, DB_OPTIONS (+29 more)

### Community 20 - "Ruxsatlar matritsasi (3-bo'lim)"
Cohesion: 0.18
Nodes (8): chunks(), bad(), conflict(), enrollmentNotFound(), EnrollmentsService, forbidden(), groupNotFound(), studentNotFound()

### Community 21 - "DbService"
Cohesion: 0.14
Nodes (24): writeAudit(), generateTempPassword(), CreateCenterInput, CreatedCenter, SUPER, generateLogin(), isLoginConflict(), MAX_LOGIN_TRIES (+16 more)

### Community 22 - "Yaratish va parol qoidalari jadvali (#22)"
Cohesion: 0.12
Nodes (26): attrs(), BUILTIN_DATE_FMTS, colIndex(), corrupt(), dateStyles(), decode(), ENTITIES, excelSerialToIso() (+18 more)

### Community 23 - "compilerOptions (#23)"
Cohesion: 0.09
Nodes (16): Roles(), clientOf(), LessonsController, ATTENDANCE_STATUSES, attendanceQuerySchema, AttendanceStatus, CreateLessonInput, createLessonSchema (+8 more)

### Community 24 - "devDependencies"
Cohesion: 0.09
Nodes (31): typescript@^6.0.2, typescript, To'lov, maosh to'lovi, audit append-only, Byudjet $0, host-agnostik (Docker), Qarz saqlanmaydi, charges dan hisoblanadi, CLAUDE.md (loyiha ko'rsatmalari), Hujjatlarni o'qish tartibi, ORM: Drizzle (+23 more)

### Community 25 - "TokenService"
Cohesion: 0.11
Nodes (6): AccessClaims, JwtAuthGuard, PermissionsGuard, RolesGuard, unauthorized(), TokenService

### Community 26 - "compilerOptions (#26)"
Cohesion: 0.14
Nodes (14): CurrentUser, clientOf(), EnrollmentsController, id(), CreateEnrollmentInput, createEnrollmentSchema, LeaveEnrollmentInput, leaveEnrollmentSchema (+6 more)

### Community 27 - "Tx"
Cohesion: 0.21
Nodes (11): branchScope(), inScope(), Tx, CreateStudentInput, ListStudentsQuery, UpdateStudentInput, branchNotFound(), escapeLike() (+3 more)

### Community 28 - "db (#28)"
Cohesion: 0.19
Nodes (8): AttendanceQuery, bad(), conflict(), forbidden(), groupNotFound(), lessonNotFound(), LessonsService, rate()

### Community 29 - "Param"
Cohesion: 0.13
Nodes (3): PermissionsService, BillingService, DbService

### Community 30 - "ClientInfo"
Cohesion: 0.15
Nodes (23): ClientInfo, ALLOW_MUST_CHANGE, IS_PUBLIC, PERMISSIONS_KEY, ROLES_KEY, id(), idParamSchema, phone (+15 more)

### Community 31 - "scripts (#31)"
Cohesion: 0.17
Nodes (6): AllocatorService, audited(), forbidden(), paymentNotFound(), PaymentsService, studentNotFound()

### Community 32 - "api/package.json"
Cohesion: 0.10
Nodes (22): Audit jurnali: kim, nima, qachon, oldingi/keyingi, Auth: argon2, JWT + refresh, 2FA, Raqobatchilar: SchoolupCRM, UstozCRM, ALFA CRM, Umai CRM, Shaxsiy ma'lumotlar qonuni (lokalizatsiya), Birinchi 7 kunda 5 amaliy qadam, Bepul infra cheklovlari (Neon/Supabase, Render, Fly.io), 5-10 rahbar bilan suhbat (birinchi vazifa), Bozor tahlili (raqobatchilar) (+14 more)

### Community 33 - "lessons.service.ts"
Cohesion: 0.14
Nodes (19): AdjustRatingInput, RankingQuery, RatingEventsQuery, ATTENDANCE_POINTS, forbidden(), nf(), RankRow, RatingsService (+11 more)

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
Nodes (21): devDependencies, drizzle-kit@^0.31.11, @nestjs/cli@^12.0.0, @nestjs/schematics@^12.0.0, @nestjs/testing@^12.0.1, oxlint-tsgolint@^7.0.2001, prettier@^3.4.2, supertest@^7.0.0 (+13 more)

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
Cohesion: 0.10
Nodes (14): HttpTelegramSender, SendResult, activate(), Api, Center, config, FakeSender, makeApi() (+6 more)

### Community 44 - "attendance.e2e-spec.ts"
Cohesion: 0.11
Nodes (17): environment, healthcheck, image, ports, restart, volumes, POSTGRES_DB, POSTGRES_PASSWORD (+9 more)

### Community 45 - "spreadsheet.ts"
Cohesion: 0.12
Nodes (16): engines, node, name, packageManager, private, scripts, build, db:create-super-admin (+8 more)

### Community 46 - "payments table (#46)"
Cohesion: 0.11
Nodes (17): author, description, @electric-sql/pglite@^0.5.16, oxlint@^1.58.0, source-map-support@^0.5.21, tsx@^4.23.15, @types/node@^24.0.0, @types/node (+9 more)

### Community 47 - ".run"
Cohesion: 0.14
Nodes (9): clientOf(), id(), PaymentsController, CreatePaymentInput, createPaymentSchema, ListPaymentsQuery, listPaymentsSchema, note (+1 more)

### Community 48 - "payroll-engine.ts"
Cohesion: 0.16
Nodes (17): attachedGroups(), Attachment, EngineRule, fmt(), GroupBase, LessonCount, monthEndOf(), monthStartOf() (+9 more)

### Community 49 - ".generate"
Cohesion: 0.32
Nodes (5): branchFilter(), audited(), ExpensesService, forbidden(), notFound()

### Community 50 - "RequirePermission"
Cohesion: 0.18
Nodes (15): Ikki to'lov rejimi GROUP_CYCLE / STUDENT_CYCLE, Biznes sanasi Asia/Tashkent, Charge yaratish (idempotent, hodisalar bilan), charges, enrollment_discounts, enrollment_freezes, enrollments, GROUP_CYCLE (Najot usuli) (+7 more)

### Community 51 - "writeAudit"
Cohesion: 0.14
Nodes (16): Avans (taqsimlanmagan qoldiq), Qabul qilingan qarorlar va ochiq savollar, ERD va ruxsatlar matritsasi, join_proration (FULL_MONTH, REMAINING_LESSONS), Umumiy hisobotlar (overview, branch_compare), Moliya ruxsatlari (payment, debtors, expense, payroll), Tashkilot ruxsatlari (branch.manage, staff.create, student.*), Platforma ruxsatlari (center.create, owner.create, plan.manage) (+8 more)

### Community 52 - "tsconfig.build.json (#52)"
Cohesion: 0.13
Nodes (15): dependencies, drizzle-orm@^0.45.4, @erp/shared@workspace:*, @nestjs/common@^12.0.1, @nestjs/jwt@^12.0.5, @nestjs/platform-express@^12.0.1, @node-rs/argon2@^2.2.2, reflect-metadata@^0.2.2 (+7 more)

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
Cohesion: 0.26
Nodes (11): activate(), Api, Center, ChargeView, config, daysAgo(), makeApi(), mkStudent() (+3 more)

### Community 58 - "Module"
Cohesion: 0.27
Nodes (12): Skelet 1: Monorepo, Docker Compose, .env.example (tayyor), Skelet 2: Migratsiyalar 10 jadval (tayyor), Skelet 3: Auth login, JWT+refresh, guard (tayyor), Skelet 4: RLS va tenant izolyatsiya testi (tayyor), Skelet 5: Super admin markaz yaratish/bloklash (tayyor), Skelet 6: Rahbar filial va xodim yaratish, ruxsat sozlash (keyingi), Skelet 7: Audit jurnali va ruxsat matritsasi testi (kutmoqda), Skelet maqsadi: super admin markaz ochadi, rahbar kiradi, filial va xodim yaratadi (+4 more)

### Community 59 - "academic.controller.ts"
Cohesion: 0.18
Nodes (11): devDependencies, typescript@^5.9.3, typescript, main, name, private, scripts, build (+3 more)

### Community 60 - "Environment limitation: Docker/WSL unava (#60)"
Cohesion: 0.33
Nodes (9): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+1 more)

### Community 61 - "payroll.controller.ts"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, config, D2, makeApi(), mkStudent(), newCenter() (+2 more)

### Community 62 - "GROUP_CYCLE billing mode"
Cohesion: 0.25
Nodes (10): activate(), Api, Center, config, HEADER, makeApi(), newCenter(), staff() (+2 more)

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
Nodes (15): APP_CONFIG, AppConfig, ConfigModule, envSchema, loadConfig(), parseDuration(), UNIT_SECONDS, client (+7 more)

### Community 68 - "AuthUser"
Cohesion: 0.33
Nodes (6): AssignmentsService, conflict(), forbidden(), isLate(), notFound(), AuthUser

### Community 69 - "finance.schemas.ts"
Cohesion: 0.09
Nodes (15): clientOf(), FinanceController, FinanceReportService, forbidden(), num(), category, CreateExpenseInput, createExpenseSchema (+7 more)

### Community 70 - ".run"
Cohesion: 0.10
Nodes (8): clientOf(), ImportsController, flag, ListImportsQuery, listImportsSchema, RunImportInput, runImportSchema, UploadedFile

### Community 71 - ".create"
Cohesion: 0.33
Nodes (9): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+1 more)

### Community 72 - "@nestjs/common"
Cohesion: 0.22
Nodes (10): payroll_adjustments, Maosh oqimi: DRAFT, APPROVED, PAID, payroll_items, payroll_payouts, payroll_periods, payroll_rules, O'quv ruxsatlari (group, attendance, homework, rating), Rol ADMIN (+2 more)

### Community 73 - "permission-matrix.ts"
Cohesion: 0.14
Nodes (12): DEFAULT_CENTER_SETTINGS, DEFAULT_TRIAL_DAYS, defaultRolePermissionRows(), ROLE_PERMISSION_MATRIX, RoleMatrix, RolePermissionRow, PERMISSION_CODES, PERMISSION_MODULES (+4 more)

### Community 74 - ".hasIn"
Cohesion: 0.34
Nodes (4): audited(), chargeNotFound(), ChargesService, forbidden()

### Community 75 - ".login"
Cohesion: 0.21
Nodes (7): accountInactive(), AuthService, centerBlocked(), invalidCredentials(), invalidRefresh(), LoginResult, TokenPair

### Community 76 - "hashPassword"
Cohesion: 0.29
Nodes (6): env, node, rules, typescript/no-explicit-any, typescript/no-floating-promises, $schema

### Community 77 - ".changePassword"
Cohesion: 0.29
Nodes (3): @nestjs/core@^12.0.1, envFile, @nestjs/core

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

### Community 84 - "Public"
Cohesion: 0.27
Nodes (3): AppController, AppService, Public()

## Knowledge Gaps
- **53 isolated node(s):** `./tsconfig.json`, `Attendance lock rule (attendance_lock_days)`, `Auth design (JWT 15 min, refresh rotation, HMAC hash)`, `Branch scope helper (branch-scope.ts)`, `Drizzle migrations plus handwritten SQL` (+48 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 556 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthUser` connect `AuthUser` to `.run`, `@nestjs/common`, `academic.controller.ts`, `auth.controller.ts`, `payroll.schemas.ts`, `schema.ts`, `BranchesService`, `CoursesService (#8)`, `auth.service.ts`, `students.service.ts (#13)`, `Tx`, `enrollments table (#15)`, `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)`, `telegram-bot.service.ts`, `.branches`, `Ruxsatlar matritsasi (3-bo'lim)`, `DbService`, `compilerOptions (#23)`, `compilerOptions (#26)`, `Tx`, `db (#28)`, `ClientInfo`, `scripts (#31)`, `lessons.service.ts`, `discounts.controller.ts`, `CurrentUser`, `CoursesService`, `.run`, `.generate`, `finance.schemas.ts`, `.run`, `.hasIn`, `PayrollRulesService`?**
  _High betweenness centrality (0.232) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `Attendance lock rule (attendance_lock_days)`, `Auth design (JWT 15 min, refresh rotation, HMAC hash)` to the rest of the system?**
  _53 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `.run` be split into smaller, more focused modules?**
  _Cohesion score 0.14245014245014245 - nodes in this community are weakly interconnected._
- **Why does `@nestjs/common` connect `EnrollmentsService` to `@nestjs/common`, `academic.controller.ts`, `auth.controller.ts`, `schema.ts`, `auth.service.ts`, `web/package.json (#10)`, `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)`, `telegram-bot.service.ts`, `hashPassword`, `DbService`, `compilerOptions (#26)`, `ClientInfo`, `lessons.service.ts`, `discounts.controller.ts`, `.hasIn`, `notifications.e2e-spec.ts`, `payments table (#46)`, `.run`, `tsconfig.build.json (#52)`, `nest-cli.json (#54)`, `payroll.e2e-spec.ts`, `allowBuilds (#56)`, `vitest (#57)`, `Environment limitation: Docker/WSL unava (#60)`, `payroll.controller.ts`, `GROUP_CYCLE billing mode`, `discounts.controller.ts`, `app-config.ts`, `.create`, `Public`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Should `@nestjs/common` be split into smaller, more focused modules?**
  _Cohesion score 0.05794556628621598 - nodes in this community are weakly interconnected._
- **Why does `typescript` connect `devDependencies` to `payments table (#46)`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Should `academic.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10104529616724739 - nodes in this community are weakly interconnected._