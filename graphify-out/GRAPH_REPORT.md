# Graph Report - ERP  (2026-11-19)

## Corpus Check
- 139 files · ~77,238 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 5, .css 2, .example 1)

## Summary
- 1566 nodes · 4776 edges · 71 communities (61 shown, 10 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 314 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9ca1190e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- @nestjs/common
- app.module.ts
- branchScope() (#2)
- EnrollmentsService (#3)
- lessons.schemas.ts
- inScope() (#5)
- StudentsService (#6)
- BranchesService (#7)
- CoursesService (#8)
- TokenService
- web/package.json (#10)
- billing.e2e-spec.ts (#11)
- ChargesService (#12)
- students.service.ts (#13)
- @nestjs/common
- enrollments table (#15)
- ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)
- CLAUDE.md (loyiha ko'rsatmalari) (#17)
- REJA.md (#18)
- permissions-admin.controller.ts
- Ruxsatlar matritsasi (3-bo'lim)
- DbService
- Yaratish va parol qoidalari jadvali (#22)
- compilerOptions (#23)
- devDependencies (#24)
- enrollments.e2e-spec.ts
- compilerOptions (#26)
- scripts (#27)
- db (#28)
- .withContext
- centers table (tenant) (#30)
- scripts (#31)
- api/package.json
- dependencies (#33)
- auth.types.ts
- discounts.controller.ts
- .hasIn
- .end
- permissions table (code catalog) (#38)
- attendance-lock.e2e-spec.ts
- shared/package.json (#40)
- lessons table
- compilerOptions (#42)
- tenant-isolation.e2e-spec.ts (#43)
- StaffController
- drizzle-kit
- payments table (#46)
- @nestjs/schematics@^12.0.0
- .oxlintrc.json (#48)
- main.ts (#49)
- RequirePermission
- AuthUser
- tsconfig.build.json (#52)
- Tx
- nest-cli.json (#54)
- .login
- allowBuilds (#56)
- vitest (#57)
- payments.controller.ts
- Environment limitation: Docker/WSL unava (#60)
- StudentsService
- GROUP_CYCLE billing mode
- .hasIn
- .changePassword
- billing.e2e-spec.ts
- JwtAuthGuard
- PermissionsAdminService
- app.controller.ts
- ConfigModule
- DbModule

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 219 edges
2. `CurrentUser` - 88 edges
3. `Tx` - 82 edges
4. `ClientInfo` - 75 edges
5. `@nestjs/common` - 68 edges
6. `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)` - 58 edges
7. `branchScope()` - 53 edges
8. `writeAudit()` - 47 edges
9. `drizzle-orm` - 44 edges
10. `DbService` - 41 edges

## Surprising Connections (you probably didn't know these)
- `Frontend: Next.js (React)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `CLAUDE.md (loyiha ko'rsatmalari)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `Backend: NestJS modulli monolit` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `AccessClaims` --references--> `Role`  [EXTRACTED]
  apps/api/src/auth/auth.types.ts → packages/shared/src/index.ts
- `AuthUser` --references--> `Role`  [EXTRACTED]
  apps/api/src/auth/auth.types.ts → packages/shared/src/index.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Billing flow: enrollments, freezes and discounts produce charges** — erd_va_ruxsatlar_enrollments, erd_va_ruxsatlar_enrollment_freezes, erd_va_ruxsatlar_enrollment_discounts, erd_va_ruxsatlar_charges, progress_billing_engine [EXTRACTED 1.00]
- **Effective permission resolution: role template, user exception, scope, guards** — erd_va_ruxsatlar_center_role_permissions, erd_va_ruxsatlar_user_permissions, erd_va_ruxsatlar_permission_scope, erd_va_ruxsatlar_permission_matrix, progress_guard_order [EXTRACTED 1.00]
- **Payment settlement: payments allocated to charges, advance remainder** — erd_va_ruxsatlar_payments, erd_va_ruxsatlar_payment_allocations, erd_va_ruxsatlar_charges, erd_va_ruxsatlar_advance_balance, progress_step_14_payments [EXTRACTED 1.00]

## Communities (71 total, 10 thin omitted)

### Community 0 - "@nestjs/common"
Cohesion: 0.11
Nodes (27): changePasswordSchema, loginSchema, refreshSchema, ALLOW_MUST_CHANGE, IS_PUBLIC, PERMISSIONS_KEY, ROLES_KEY, id() (+19 more)

### Community 1 - "app.module.ts"
Cohesion: 0.09
Nodes (13): AuditModule, AuthModule, BillingModule, DebtorsService, BranchesModule, CentersModule, CoursesModule, EnrollmentsModule (+5 more)

### Community 2 - "branchScope() (#2)"
Cohesion: 0.08
Nodes (25): clientOf(), GroupsController, AssignTeacherInput, assignTeacherSchema, BILLING_KEYS, billingMode, CreateGroupInput, createGroupSchema (+17 more)

### Community 3 - "EnrollmentsService (#3)"
Cohesion: 0.08
Nodes (20): chunks(), clientOf(), EnrollmentsController, CreateEnrollmentInput, createEnrollmentSchema, LeaveEnrollmentInput, leaveEnrollmentSchema, ListEnrollmentsQuery (+12 more)

### Community 4 - "lessons.schemas.ts"
Cohesion: 0.11
Nodes (15): Roles(), clientOf(), LessonsController, ATTENDANCE_STATUSES, attendanceQuerySchema, AttendanceStatus, CreateLessonInput, createLessonSchema (+7 more)

### Community 5 - "inScope() (#5)"
Cohesion: 0.08
Nodes (19): clientOf(), UserPasswordController, branchIds, CreateStaffInput, createStaffSchema, ListStaffQuery, login, phone (+11 more)

### Community 6 - "StudentsService (#6)"
Cohesion: 0.10
Nodes (11): clientOf(), StudentsController, birthDate, CreateStudentInput, createStudentSchema, ListStudentsQuery, listStudentsSchema, login (+3 more)

### Community 7 - "BranchesService (#7)"
Cohesion: 0.16
Nodes (8): BranchesController, id(), CreateBranchInput, createBranchSchema, listBranchesSchema, phone, UpdateBranchInput, updateBranchSchema

### Community 8 - "CoursesService (#8)"
Cohesion: 0.16
Nodes (10): CurrentUser, clientOf(), CoursesController, id(), CreateCourseInput, createCourseSchema, listCoursesSchema, price (+2 more)

### Community 9 - "TokenService"
Cohesion: 0.15
Nodes (5): accountInactive(), centerBlocked(), invalidRefresh(), AccessClaims, TokenService

### Community 10 - "web/package.json (#10)"
Cohesion: 0.06
Nodes (34): eslintConfig, nextConfig, dependencies, next@16.4.6, react@19.3.0, react-dom@19.3.0, devDependencies, eslint@^9 (+26 more)

### Community 11 - "billing.e2e-spec.ts (#11)"
Cohesion: 0.15
Nodes (17): BillingMode, ChargeDraft, ChargeKind, countLessons(), discountFor(), EngineContext, EngineDiscount, EngineEnrollment (+9 more)

### Community 12 - "ChargesService (#12)"
Cohesion: 0.14
Nodes (10): BillingController, clientOf(), cancelChargeSchema, CreateManualChargeInput, createManualChargeSchema, generateBillingSchema, ListChargesQuery, listChargesSchema (+2 more)

### Community 13 - "students.service.ts (#13)"
Cohesion: 0.16
Nodes (15): CreatedCenter, SUPER, generateLogin(), isLoginConflict(), MAX_LOGIN_TRIES, pgErrorInfo(), uniqueViolation(), CYRILLIC (+7 more)

### Community 14 - "@nestjs/common"
Cohesion: 0.11
Nodes (49): AuditEntry, listAuditSchema, GenerateOptions, ChargeRow, DebtorRow, GroupRow, DiscountRow, Range (+41 more)

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

### Community 19 - "permissions-admin.controller.ts"
Cohesion: 0.22
Nodes (5): clientOf(), PermissionsAdminController, roleParamSchema, setRolePermissionsSchema, setUserPermissionsSchema

### Community 20 - "Ruxsatlar matritsasi (3-bo'lim)"
Cohesion: 0.14
Nodes (16): Kassir/admin alohida rol, ruxsat orqali birlashishi mumkin, Markaz boshlang'ich settings (GROUP_CYCLE, grace 0, FULL_MONTH, NONE, uz), Markaz yaratish POST /admin/centers (bitta tranzaksiya), Ruxsatlar matritsasi (3-bo'lim), Belgilar: ✔ ○ – o f, Super admin tenant ichini ko'rmaydi; impersonate hozircha yo'q, Matritsa 3.2 Tashkilot va foydalanuvchilar, Matritsa 3.1 Platforma (faqat SUPER_ADMIN) (+8 more)

### Community 21 - "DbService"
Cohesion: 0.20
Nodes (3): PermissionsService, BillingService, DbService

### Community 22 - "Yaratish va parol qoidalari jadvali (#22)"
Cohesion: 0.09
Nodes (29): Parol: argon2, must_change_password, Skelet 1: Monorepo, Docker Compose, .env.example (tayyor), Skelet 2: Migratsiyalar 10 jadval (tayyor), Skelet 3: Auth login, JWT+refresh, guard (tayyor), Skelet 4: RLS va tenant izolyatsiya testi (tayyor), Skelet 5: Super admin markaz yaratish/bloklash (tayyor), Skelet 6: Rahbar filial va xodim yaratish, ruxsat sozlash (keyingi), Skelet 7: Audit jurnali va ruxsat matritsasi testi (kutmoqda) (+21 more)

### Community 23 - "compilerOptions (#23)"
Cohesion: 0.10
Nodes (20): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+12 more)

### Community 24 - "devDependencies (#24)"
Cohesion: 0.10
Nodes (21): devDependencies, @electric-sql/pglite@^0.5.16, @nestjs/cli@^12.0.0, @nestjs/mau@^0.2.6, @nestjs/testing@^12.0.1, oxlint-tsgolint@^7.0.2001, supertest@^7.0.0, tsx@^4.23.15 (+13 more)

### Community 25 - "enrollments.e2e-spec.ts"
Cohesion: 0.06
Nodes (60): AppModule, APP_CONFIG, AppConfig, envSchema, loadConfig(), parseDuration(), UNIT_SECONDS, DB (+52 more)

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
Cohesion: 0.14
Nodes (12): writeAudit(), AuthService, ClientInfo, generateTempPassword(), audited(), BranchesService, nameTaken(), notFound() (+4 more)

### Community 30 - "centers table (tenant) (#30)"
Cohesion: 0.10
Nodes (21): Qarz saqlanmaydi, charges dan hisoblanadi, centers table (tenant), Trigger centers_guard_platform_columns, Qarzdor: today > due_date + grace_days va charge to'lanmagan, grace_days: markaz sukuti + groups.grace_days, import_jobs, users/centers/branches/plans ga DELETE huquqi yo'q, plans table (SaaS tariffs) (+13 more)

### Community 31 - "scripts (#31)"
Cohesion: 0.12
Nodes (16): engines, node, name, packageManager, private, scripts, build, db:create-super-admin (+8 more)

### Community 32 - "api/package.json"
Cohesion: 0.12
Nodes (15): author, description, oxlint@^1.58.0, prettier@^3.4.2, source-map-support@^0.5.21, @types/node@^24.0.0, @types/node, license (+7 more)

### Community 33 - "dependencies (#33)"
Cohesion: 0.12
Nodes (17): dependencies, drizzle-orm@^0.45.4, @erp/shared@workspace:*, @nestjs/common@^12.0.1, @nestjs/jwt@^12.0.5, @nestjs/platform-express@^12.0.1, @node-rs/argon2@^2.2.2, postgres@^4.1.1 (+9 more)

### Community 34 - "auth.types.ts"
Cohesion: 0.12
Nodes (18): AuthedRequest, UserRow, PAYMENT_MODES, PaymentMode, Role, ROLES, DEFAULT_CENTER_SETTINGS, DEFAULT_TRIAL_DAYS (+10 more)

### Community 35 - "discounts.controller.ts"
Cohesion: 0.14
Nodes (9): clientOf(), DiscountsController, id(), CreateDiscountInput, createDiscountSchema, endDiscountSchema, ListDebtorsQuery, listDebtorsSchema (+1 more)

### Community 36 - ".hasIn"
Cohesion: 0.26
Nodes (5): audited(), CoursesService, forbidden(), nameTaken(), notFound()

### Community 37 - ".end"
Cohesion: 0.31
Nodes (6): audited(), discountNotFound(), DiscountsService, enrollmentNotFound(), forbidden(), overlap()

### Community 38 - "permissions table (code catalog) (#38)"
Cohesion: 0.21
Nodes (13): Ruxsatlar: rol + center_role_permissions + user_permissions, scope so'rov filtri, center_role_permissions (role template), Samarali ruxsat = rol shabloni ± user istisnosi, permissions pnpm db:seed orqali @erp/shared dan, Permissions matrix (checkmark / optional / never), Permission scopes (center, branch, own group, own record), permissions table (code catalog), Qoida 8: Ruxsat = rol + markaz sozlamasi + foydalanuvchi istisnosi (+5 more)

### Community 39 - "attendance-lock.e2e-spec.ts"
Cohesion: 0.11
Nodes (28): addDays(), daysBetween(), fromMs(), todayLocal(), toMs(), daysAgo(), activate(), Api (+20 more)

### Community 40 - "shared/package.json (#40)"
Cohesion: 0.18
Nodes (11): devDependencies, typescript@^5.9.3, typescript, main, name, private, scripts, build (+3 more)

### Community 41 - "lessons table"
Cohesion: 0.18
Nodes (12): Accepted decisions and resolved questions, Attendance lock rule (attendance_lock_days), attendance_records table, join_proration setting (FULL_MONTH, REMAINING_LESSONS), Dars qulflanishi lessons.locked_at, attendance.edit_past, lessons table, Matritsa 3.3 Guruh, davomat, vazifa, reyting, Reyting agregatsiya orqali, alohida jadval yo'q (+4 more)

### Community 42 - "compilerOptions (#42)"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, esModuleInterop, module, outDir, rootDir, skipLibCheck, strict (+2 more)

### Community 43 - "tenant-isolation.e2e-spec.ts (#43)"
Cohesion: 0.10
Nodes (18): LoginResult, SessionRow, TokenPair, hashPassword(), PARAMS, verifyAgainstDummy(), verifyPassword(), client (+10 more)

### Community 46 - "payments table (#46)"
Cohesion: 0.28
Nodes (8): To'lov, maosh to'lovi, audit append-only, audit_logs (append-only), audit_logs UPDATE/DELETE/TRUNCATE triggerlar bilan bloklangan, payments table, Matritsa 3.4 Moliya, Qaytarish: status=REVERSED va reverses_payment_id, Qoida 3: Pul append-only, teskari yozuv, Step 7: GET /audit and permission matrix test

### Community 48 - ".oxlintrc.json (#48)"
Cohesion: 0.29
Nodes (6): env, node, rules, typescript/no-explicit-any, typescript/no-floating-promises, $schema

### Community 49 - "main.ts (#49)"
Cohesion: 0.29
Nodes (3): @nestjs/core@^12.0.1, envFile, @nestjs/core

### Community 50 - "RequirePermission"
Cohesion: 0.07
Nodes (8): AuditController, RequirePermission(), clientOf(), CentersController, clientOf(), ProbeController, ProbeController, ProbeController

### Community 51 - "AuthUser"
Cohesion: 0.18
Nodes (8): AttendanceQuery, bad(), conflict(), forbidden(), groupNotFound(), lessonNotFound(), LessonsService, rate()

### Community 52 - "tsconfig.build.json (#52)"
Cohesion: 0.29
Nodes (6): compilerOptions, rootDir, exclude, extends, include, ./tsconfig.json

### Community 53 - "Tx"
Cohesion: 0.16
Nodes (9): AllocatorService, CreatePaymentInput, ListPaymentsQuery, audited(), forbidden(), paymentNotFound(), PaymentsService, studentNotFound() (+1 more)

### Community 54 - "nest-cli.json (#54)"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 56 - "allowBuilds (#56)"
Cohesion: 0.40
Nodes (4): allowBuilds, sharp, unrs-resolver, packages

### Community 59 - "payments.controller.ts"
Cohesion: 0.16
Nodes (7): clientOf(), id(), PaymentsController, createPaymentSchema, listPaymentsSchema, note, reversePaymentSchema

### Community 61 - "StudentsService"
Cohesion: 0.22
Nodes (8): forbidden(), branchScope(), inScope(), branchNotFound(), escapeLike(), forbidden(), notFound(), StudentsService

### Community 62 - "GROUP_CYCLE billing mode"
Cohesion: 0.33
Nodes (9): Ikki to'lov rejimi GROUP_CYCLE / STUDENT_CYCLE, Ikki to'lov sikli taqqoslash jadvali, GROUP_CYCLE billing mode, Oy oxiri: 29-31 kun oyning oxirgi kuniga siljiydi, STUDENT_CYCLE billing mode, Bozor bo'shlig'i (taxmin), Moslashuvchan maosh motori (farqlovchi), Ikki xil to'lov sikli (farqlovchi) (+1 more)

### Community 64 - ".hasIn"
Cohesion: 0.37
Nodes (5): AuthUser, audited(), chargeNotFound(), ChargesService, forbidden()

### Community 65 - ".changePassword"
Cohesion: 0.27
Nodes (4): AuthController, clientOf(), AllowMustChangePassword(), Public()

### Community 66 - "billing.e2e-spec.ts"
Cohesion: 0.12
Nodes (25): dayOf(), activate(), Api, Center, ChargeView, config, daysAgo(), Group (+17 more)

### Community 67 - "JwtAuthGuard"
Cohesion: 0.21
Nodes (4): JwtAuthGuard, PermissionsGuard, RolesGuard, unauthorized()

### Community 68 - "PermissionsAdminService"
Cohesion: 0.24
Nodes (3): assertConfigurable(), PermissionsAdminService, TenantRole

## Knowledge Gaps
- **45 isolated node(s):** `./tsconfig.json`, `Qaror: avans va ko'p oylik to'lov mumkin`, `O'quvchini ko'chirish: eski enrollments yopiladi, yangisi ochiladi`, `Filialga bog'lash: OWNER hammasi, ADMIN/CASHIER user_branches`, `Markaz boshlang'ich settings (GROUP_CYCLE, grace 0, FULL_MONTH, NONE, uz)` (+40 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 400 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CLAUDE.md (loyiha ko'rsatmalari)` connect `CLAUDE.md (loyiha ko'rsatmalari) (#17)` to `permissions table (code catalog) (#38)`, `lessons table`, `payments table (#46)`, `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)`, `REJA.md (#18)`, `Yaratish va parol qoidalari jadvali (#22)`, `centers table (tenant) (#30)`, `GROUP_CYCLE billing mode`?**
  _High betweenness centrality (0.231) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `Qaror: avans va ko'p oylik to'lov mumkin`, `O'quvchini ko'chirish: eski enrollments yopiladi, yangisi ochiladi` to the rest of the system?**
  _45 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `@nestjs/common` be split into smaller, more focused modules?**
  _Cohesion score 0.10796221322537113 - nodes in this community are weakly interconnected._
- **Why does `typescript` connect `CLAUDE.md (loyiha ko'rsatmalari) (#17)` to `api/package.json`?**
  _High betweenness centrality (0.226) - this node is a cross-community bridge._
- **Should `app.module.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08534850640113797 - nodes in this community are weakly interconnected._
- **Why does `AuthUser` connect `.hasIn` to `@nestjs/common`, `branchScope() (#2)`, `EnrollmentsService (#3)`, `lessons.schemas.ts`, `inScope() (#5)`, `StudentsService (#6)`, `BranchesService (#7)`, `CoursesService (#8)`, `ChargesService (#12)`, `students.service.ts (#13)`, `@nestjs/common`, `permissions-admin.controller.ts`, `.withContext`, `auth.types.ts`, `discounts.controller.ts`, `.hasIn`, `.end`, `tenant-isolation.e2e-spec.ts (#43)`, `StaffController`, `RequirePermission`, `AuthUser`, `Tx`, `payments.controller.ts`, `StudentsService`, `.changePassword`, `PermissionsAdminService`?**
  _High betweenness centrality (0.169) - this node is a cross-community bridge._
- **Should `branchScope() (#2)` be split into smaller, more focused modules?**
  _Cohesion score 0.08312020460358056 - nodes in this community are weakly interconnected._