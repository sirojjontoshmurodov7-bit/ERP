# Graph Report - ERP  (2026-11-19)

## Corpus Check
- 173 files · ~107,060 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 5, .css 2, .example 1)

## Summary
- 1905 nodes · 6179 edges · 88 communities (81 shown, 7 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 402 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2efb36ac`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- auth.service.ts
- @nestjs/common
- branchScope() (#2)
- EnrollmentsService
- lessons.schemas.ts
- inScope() (#5)
- StudentsService (#6)
- BranchesService
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
- permission-matrix.e2e-spec.ts
- Ruxsatlar matritsasi (3-bo'lim)
- DbService
- Yaratish va parol qoidalari jadvali (#22)
- compilerOptions (#23)
- devDependencies (#24)
- app-config.ts
- compilerOptions (#26)
- scripts (#27)
- db (#28)
- .hasIn
- centers table (tenant) (#30)
- scripts (#31)
- api/package.json
- dependencies (#33)
- decorators.ts
- .hasIn
- finance.schemas.ts
- .end
- permissions table (code catalog) (#38)
- CurrentUser
- shared/package.json (#40)
- lessons table
- compilerOptions (#42)
- enrollments.e2e-spec.ts
- attendance.e2e-spec.ts
- spreadsheet.ts
- payments table (#46)
- .run
- .oxlintrc.json (#48)
- .generate
- RequirePermission
- payroll.service.ts
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
- todayLocal
- PayrollRulesService
- .create
- AuthUser
- db.service.ts
- .create
- centers.e2e-spec.ts
- finance.e2e-spec.ts
- seed.ts
- imports.e2e-spec.ts
- hashPassword
- .changePassword
- imports.controller.ts
- attendance-lock.e2e-spec.ts
- discounts-debtors.e2e-spec.ts
- payments.e2e-spec.ts
- reports.e2e-spec.ts
- permissions-admin.controller.ts
- @nestjs/cli@^12.0.0
- @nestjs/mau@^0.2.6
- vite@^8.0.0
- source-map-support@^0.5.21

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 296 edges
2. `CurrentUser` - 119 edges
3. `Tx` - 102 edges
4. `ClientInfo` - 96 edges
5. `@nestjs/common` - 87 edges
6. `writeAudit()` - 65 edges
7. `branchScope()` - 62 edges
8. `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)` - 58 edges
9. `DbService` - 55 edges
10. `todayLocal()` - 54 edges

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
- **Billing flow: enrollments, freezes and discounts produce charges** — erd_va_ruxsatlar_enrollments, erd_va_ruxsatlar_enrollment_freezes, erd_va_ruxsatlar_enrollment_discounts, erd_va_ruxsatlar_charges, progress_billing_engine [EXTRACTED 1.00]
- **Effective permission resolution: role template, user exception, scope, guards** — erd_va_ruxsatlar_center_role_permissions, erd_va_ruxsatlar_user_permissions, erd_va_ruxsatlar_permission_scope, erd_va_ruxsatlar_permission_matrix, progress_guard_order [EXTRACTED 1.00]
- **Payment settlement: payments allocated to charges, advance remainder** — erd_va_ruxsatlar_payments, erd_va_ruxsatlar_payment_allocations, erd_va_ruxsatlar_charges, erd_va_ruxsatlar_advance_balance, progress_step_14_payments [EXTRACTED 1.00]

## Communities (88 total, 7 thin omitted)

### Community 0 - "auth.service.ts"
Cohesion: 0.10
Nodes (37): listAuditSchema, LoginResult, SessionRow, TokenPair, UserRow, Roles(), id(), id() (+29 more)

### Community 1 - "@nestjs/common"
Cohesion: 0.09
Nodes (18): AuditModule, AuthModule, BillingModule, BranchesModule, CentersModule, CoursesModule, EnrollmentsModule, FinanceModule (+10 more)

### Community 2 - "branchScope() (#2)"
Cohesion: 0.08
Nodes (25): clientOf(), GroupsController, AssignTeacherInput, assignTeacherSchema, BILLING_KEYS, billingMode, CreateGroupInput, createGroupSchema (+17 more)

### Community 3 - "EnrollmentsService"
Cohesion: 0.09
Nodes (19): clientOf(), EnrollmentsController, CreateEnrollmentInput, createEnrollmentSchema, LeaveEnrollmentInput, leaveEnrollmentSchema, ListEnrollmentsQuery, listEnrollmentsSchema (+11 more)

### Community 4 - "lessons.schemas.ts"
Cohesion: 0.10
Nodes (14): clientOf(), LessonsController, ATTENDANCE_STATUSES, attendanceQuerySchema, AttendanceStatus, CreateLessonInput, createLessonSchema, ListLessonsQuery (+6 more)

### Community 5 - "inScope() (#5)"
Cohesion: 0.10
Nodes (12): clientOf(), branchIds, CreateStaffInput, createStaffSchema, ListStaffQuery, listStaffSchema, login, phone (+4 more)

### Community 6 - "StudentsService (#6)"
Cohesion: 0.10
Nodes (11): clientOf(), StudentsController, birthDate, CreateStudentInput, createStudentSchema, ListStudentsQuery, listStudentsSchema, login (+3 more)

### Community 7 - "BranchesService"
Cohesion: 0.37
Nodes (4): audited(), BranchesService, nameTaken(), view()

### Community 8 - "CoursesService (#8)"
Cohesion: 0.13
Nodes (8): clientOf(), CoursesController, CreateCourseInput, createCourseSchema, listCoursesSchema, price, UpdateCourseInput, updateCourseSchema

### Community 9 - ".login"
Cohesion: 0.13
Nodes (8): accountInactive(), AuthService, centerBlocked(), invalidCredentials(), invalidRefresh(), AccessClaims, LoginThrottle, TokenService

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
Cohesion: 0.10
Nodes (27): generateTempPassword(), CreateCenterInput, ListCentersQuery, UpdateCenterInput, CreatedCenter, notFound(), SUPER, generateLogin() (+19 more)

### Community 14 - "schema.ts"
Cohesion: 0.10
Nodes (36): AuditEntry, ChargeRow, paymentNotFound(), PaymentRow, notFound(), branchFilter(), BranchScope, CourseRow (+28 more)

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

### Community 19 - "permission-matrix.e2e-spec.ts"
Cohesion: 0.08
Nodes (18): clientOf(), assertConfigurable(), PermissionsAdminService, activate(), AllPermissionsProbe, config, newCenter(), DEFAULT_CENTER_SETTINGS (+10 more)

### Community 20 - "Ruxsatlar matritsasi (3-bo'lim)"
Cohesion: 0.14
Nodes (16): Kassir/admin alohida rol, ruxsat orqali birlashishi mumkin, Markaz boshlang'ich settings (GROUP_CYCLE, grace 0, FULL_MONTH, NONE, uz), Markaz yaratish POST /admin/centers (bitta tranzaksiya), Ruxsatlar matritsasi (3-bo'lim), Belgilar: ✔ ○ – o f, Super admin tenant ichini ko'rmaydi; impersonate hozircha yo'q, Matritsa 3.2 Tashkilot va foydalanuvchilar, Matritsa 3.1 Platforma (faqat SUPER_ADMIN) (+8 more)

### Community 21 - "DbService"
Cohesion: 0.12
Nodes (3): PermissionsService, BillingService, DbService

### Community 22 - "Yaratish va parol qoidalari jadvali (#22)"
Cohesion: 0.09
Nodes (29): Parol: argon2, must_change_password, Skelet 1: Monorepo, Docker Compose, .env.example (tayyor), Skelet 2: Migratsiyalar 10 jadval (tayyor), Skelet 3: Auth login, JWT+refresh, guard (tayyor), Skelet 4: RLS va tenant izolyatsiya testi (tayyor), Skelet 5: Super admin markaz yaratish/bloklash (tayyor), Skelet 6: Rahbar filial va xodim yaratish, ruxsat sozlash (keyingi), Skelet 7: Audit jurnali va ruxsat matritsasi testi (kutmoqda) (+21 more)

### Community 23 - "compilerOptions (#23)"
Cohesion: 0.10
Nodes (20): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+12 more)

### Community 24 - "devDependencies (#24)"
Cohesion: 0.11
Nodes (17): devDependencies, drizzle-kit@^0.31.11, @electric-sql/pglite@^0.5.16, @nestjs/schematics@^12.0.0, oxlint@^1.58.0, oxlint-tsgolint@^7.0.2001, prettier@^3.4.2, @types/supertest@^7.0.0 (+9 more)

### Community 25 - "app-config.ts"
Cohesion: 0.09
Nodes (25): APP_CONFIG, AppConfig, ConfigModule, envSchema, loadConfig(), parseDuration(), UNIT_SECONDS, DbModule (+17 more)

### Community 26 - "compilerOptions (#26)"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 27 - "scripts (#27)"
Cohesion: 0.11
Nodes (18): scripts, build, db:create-super-admin, db:generate, db:migrate, db:seed, deploy, format (+10 more)

### Community 28 - "db (#28)"
Cohesion: 0.11
Nodes (17): environment, healthcheck, image, ports, restart, volumes, POSTGRES_DB, POSTGRES_PASSWORD (+9 more)

### Community 29 - ".hasIn"
Cohesion: 0.37
Nodes (4): audited(), CoursesService, forbidden(), nameTaken()

### Community 30 - "centers table (tenant) (#30)"
Cohesion: 0.10
Nodes (21): Qarz saqlanmaydi, charges dan hisoblanadi, centers table (tenant), Trigger centers_guard_platform_columns, Qarzdor: today > due_date + grace_days va charge to'lanmagan, grace_days: markaz sukuti + groups.grace_days, import_jobs, users/centers/branches/plans ga DELETE huquqi yo'q, plans table (SaaS tariffs) (+13 more)

### Community 31 - "scripts (#31)"
Cohesion: 0.12
Nodes (16): engines, node, name, packageManager, private, scripts, build, db:create-super-admin (+8 more)

### Community 32 - "api/package.json"
Cohesion: 0.14
Nodes (13): author, description, tsx@^4.23.15, @types/express@^5.0.0, @types/node@^24.0.0, @types/node, license, name (+5 more)

### Community 33 - "dependencies (#33)"
Cohesion: 0.12
Nodes (16): dependencies, drizzle-orm@^0.45.4, @erp/shared@workspace:*, @nestjs/common@^12.0.1, @nestjs/core@^12.0.1, @nestjs/jwt@^12.0.5, @nestjs/platform-express@^12.0.1, @node-rs/argon2@^2.2.2 (+8 more)

### Community 34 - "decorators.ts"
Cohesion: 0.08
Nodes (21): changePasswordSchema, loginSchema, refreshSchema, AuthedRequest, ALLOW_MUST_CHANGE, AllowMustChangePassword(), IS_PUBLIC, PERMISSIONS_KEY (+13 more)

### Community 35 - ".hasIn"
Cohesion: 0.19
Nodes (10): writeAudit(), ClientInfo, CentersService, inCenter(), ListPeriodsQuery, forbidden(), locked(), PayrollService (+2 more)

### Community 36 - "finance.schemas.ts"
Cohesion: 0.16
Nodes (15): daysBetween(), id(), category, CreateExpenseInput, createExpenseSchema, ListExpensesQuery, listExpensesSchema, MAX_REPORT_DAYS (+7 more)

### Community 37 - ".end"
Cohesion: 0.36
Nodes (3): audited(), DiscountsService, forbidden()

### Community 38 - "permissions table (code catalog) (#38)"
Cohesion: 0.21
Nodes (13): Ruxsatlar: rol + center_role_permissions + user_permissions, scope so'rov filtri, center_role_permissions (role template), Samarali ruxsat = rol shabloni ± user istisnosi, permissions pnpm db:seed orqali @erp/shared dan, Permissions matrix (checkmark / optional / never), Permission scopes (center, branch, own group, own record), permissions table (code catalog), Qoida 8: Ruxsat = rol + markaz sozlamasi + foydalanuvchi istisnosi (+5 more)

### Community 39 - "CurrentUser"
Cohesion: 0.13
Nodes (10): CurrentUser, clientOf(), DiscountsController, clientOf(), FinanceController, ImportsController, clientOf(), PayrollController (+2 more)

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
Cohesion: 0.26
Nodes (11): @nestjs/testing@^12.0.1, activate(), Api, Center, config, makeApi(), mkStudent(), newCenter() (+3 more)

### Community 44 - "attendance.e2e-spec.ts"
Cohesion: 0.26
Nodes (10): AppModule, activate(), Api, Center, config, makeApi(), mkStudent(), newCenter() (+2 more)

### Community 45 - "spreadsheet.ts"
Cohesion: 0.12
Nodes (26): attrs(), BUILTIN_DATE_FMTS, colIndex(), corrupt(), dateStyles(), decode(), ENTITIES, excelSerialToIso() (+18 more)

### Community 46 - "payments table (#46)"
Cohesion: 0.28
Nodes (8): To'lov, maosh to'lovi, audit append-only, audit_logs (append-only), audit_logs UPDATE/DELETE/TRUNCATE triggerlar bilan bloklangan, payments table, Matritsa 3.4 Moliya, Qaytarish: status=REVERSED va reverses_payment_id, Qoida 3: Pul append-only, teskari yozuv, Step 7: GET /audit and permission matrix test

### Community 47 - ".run"
Cohesion: 0.13
Nodes (17): bad(), forbidden(), ImportsService, jobView(), safeName(), ALIASES, HeaderMap, LOOKUP (+9 more)

### Community 48 - ".oxlintrc.json (#48)"
Cohesion: 0.29
Nodes (6): env, node, rules, typescript/no-explicit-any, typescript/no-floating-promises, $schema

### Community 49 - ".generate"
Cohesion: 0.34
Nodes (4): audited(), chargeNotFound(), ChargesService, forbidden()

### Community 50 - "RequirePermission"
Cohesion: 0.05
Nodes (15): AuditController, RequirePermission(), BranchesController, clientOf(), CreateBranchInput, createBranchSchema, listBranchesSchema, phone (+7 more)

### Community 51 - "payroll.service.ts"
Cohesion: 0.11
Nodes (23): lessons, payrollAdjustments, payrollItems, payrollPayouts, payrollPeriods, payrollRules, payoutNotFound(), PayoutRow (+15 more)

### Community 52 - "tsconfig.build.json (#52)"
Cohesion: 0.29
Nodes (6): compilerOptions, rootDir, exclude, extends, include, ./tsconfig.json

### Community 53 - "Tx"
Cohesion: 0.21
Nodes (6): AllocatorService, audited(), forbidden(), PaymentsService, studentNotFound(), Tx

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
Nodes (8): clientOf(), PaymentsController, CreatePaymentInput, createPaymentSchema, ListPaymentsQuery, listPaymentsSchema, note, reversePaymentSchema

### Community 61 - "branchScope"
Cohesion: 0.31
Nodes (4): branchScope(), forbidden(), notFound(), StudentsService

### Community 62 - "GROUP_CYCLE billing mode"
Cohesion: 0.33
Nodes (9): Ikki to'lov rejimi GROUP_CYCLE / STUDENT_CYCLE, Ikki to'lov sikli taqqoslash jadvali, GROUP_CYCLE billing mode, Oy oxiri: 29-31 kun oyning oxirgi kuniga siljiydi, STUDENT_CYCLE billing mode, Bozor bo'shlig'i (taxmin), Moslashuvchan maosh motori (farqlovchi), Ikki xil to'lov sikli (farqlovchi) (+1 more)

### Community 63 - "discounts.controller.ts"
Cohesion: 0.21
Nodes (8): DebtorsService, id(), CreateDiscountInput, createDiscountSchema, endDiscountSchema, ListDebtorsQuery, listDebtorsSchema, reason

### Community 64 - "payroll-engine.ts"
Cohesion: 0.15
Nodes (16): attachedGroups(), Attachment, EngineRule, fmt(), GroupBase, LessonCount, monthStartOf(), PayrollInput (+8 more)

### Community 65 - "branchFilter"
Cohesion: 0.37
Nodes (3): audited(), ExpensesService, forbidden()

### Community 66 - "todayLocal"
Cohesion: 0.12
Nodes (27): chunks(), GenerateOptions, discountNotFound(), DiscountRow, enrollmentNotFound(), overlap(), Range, todayLocal() (+19 more)

### Community 67 - "PayrollRulesService"
Cohesion: 0.37
Nodes (5): audited(), bad(), forbidden(), PayrollRulesService, ruleNotFound()

### Community 68 - ".create"
Cohesion: 0.34
Nodes (4): inScope(), forbidden(), manageableRoles(), UsersService

### Community 69 - "AuthUser"
Cohesion: 0.25
Nodes (6): AuthUser, AttendanceQuery, bad(), conflict(), forbidden(), LessonsService

### Community 70 - "db.service.ts"
Cohesion: 0.12
Nodes (17): DebtorRow, forbidden(), GroupRow, contextOf(), rowsOf(), FinanceReportService, forbidden(), num() (+9 more)

### Community 71 - ".create"
Cohesion: 0.36
Nodes (3): audited(), forbidden(), PayoutsService

### Community 72 - "centers.e2e-spec.ts"
Cohesion: 0.16
Nodes (7): NO_CONTEXT, TenantContext, config, createTestDb(), Fixture, TENANT_TABLES, TenantTable

### Community 73 - "finance.e2e-spec.ts"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, config, D2, makeApi(), mkStudent(), newCenter() (+2 more)

### Community 74 - "seed.ts"
Cohesion: 0.22
Nodes (7): postgres@^4.1.1, client, permissions, client, db, PERMISSIONS, postgres

### Community 75 - "imports.e2e-spec.ts"
Cohesion: 0.21
Nodes (12): supertest@^7.0.0, activate(), Api, Center, config, HEADER, makeApi(), newCenter() (+4 more)

### Community 76 - "hashPassword"
Cohesion: 0.26
Nodes (9): hashPassword(), PARAMS, verifyAgainstDummy(), verifyPassword(), activate(), Center, config, newCenter() (+1 more)

### Community 77 - ".changePassword"
Cohesion: 0.16
Nodes (5): AppController, AppService, AuthController, clientOf(), Public()

### Community 78 - "imports.controller.ts"
Cohesion: 0.27
Nodes (7): clientOf(), flag, ListImportsQuery, listImportsSchema, RunImportInput, runImportSchema, UploadedFile

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
Cohesion: 0.25
Nodes (4): PermissionsAdminController, roleParamSchema, setRolePermissionsSchema, setUserPermissionsSchema

## Knowledge Gaps
- **45 isolated node(s):** `./tsconfig.json`, `Qaror: avans va ko'p oylik to'lov mumkin`, `O'quvchini ko'chirish: eski enrollments yopiladi, yangisi ochiladi`, `Filialga bog'lash: OWNER hammasi, ADMIN/CASHIER user_branches`, `users.login global noyob (lower(login))` (+40 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 471 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthUser` connect `AuthUser` to `auth.service.ts`, `branchScope() (#2)`, `EnrollmentsService`, `lessons.schemas.ts`, `inScope() (#5)`, `StudentsService (#6)`, `BranchesService`, `CoursesService (#8)`, `ChargesService (#12)`, `students.service.ts (#13)`, `schema.ts`, `permission-matrix.e2e-spec.ts`, `.hasIn`, `decorators.ts`, `.hasIn`, `finance.schemas.ts`, `.end`, `CurrentUser`, `.run`, `.generate`, `RequirePermission`, `payroll.service.ts`, `Tx`, `payments.controller.ts`, `branchScope`, `discounts.controller.ts`, `branchFilter`, `todayLocal`, `PayrollRulesService`, `.create`, `db.service.ts`, `.create`, `hashPassword`, `.changePassword`, `imports.controller.ts`, `permissions-admin.controller.ts`?**
  _High betweenness centrality (0.223) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `Qaror: avans va ko'p oylik to'lov mumkin`, `O'quvchini ko'chirish: eski enrollments yopiladi, yangisi ochiladi` to the rest of the system?**
  _45 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09877264757451783 - nodes in this community are weakly interconnected._
- **Why does `CLAUDE.md (loyiha ko'rsatmalari)` connect `CLAUDE.md (loyiha ko'rsatmalari) (#17)` to `permissions table (code catalog) (#38)`, `lessons table`, `payments table (#46)`, `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)`, `REJA.md (#18)`, `Yaratish va parol qoidalari jadvali (#22)`, `centers table (tenant) (#30)`, `GROUP_CYCLE billing mode`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **Should `@nestjs/common` be split into smaller, more focused modules?**
  _Cohesion score 0.08708272859216255 - nodes in this community are weakly interconnected._
- **Why does `typescript` connect `CLAUDE.md (loyiha ko'rsatmalari) (#17)` to `api/package.json`?**
  _High betweenness centrality (0.177) - this node is a cross-community bridge._
- **Should `branchScope() (#2)` be split into smaller, more focused modules?**
  _Cohesion score 0.08322026232473993 - nodes in this community are weakly interconnected._