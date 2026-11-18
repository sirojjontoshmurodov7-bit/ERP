# Graph Report - ERP  (2026-11-19)

## Corpus Check
- 128 files · ~66,381 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1462 nodes · 3865 edges · 62 communities (56 shown, 6 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 212 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- decorators.ts (#0)
- @nestjs/common (#1)
- branchScope() (#2)
- EnrollmentsService (#3)
- LessonsService (#4)
- inScope() (#5)
- StudentsService (#6)
- BranchesService (#7)
- CoursesService (#8)
- auth.service.ts (#9)
- web/package.json (#10)
- billing.e2e-spec.ts (#11)
- ChargesService (#12)
- students.service.ts (#13)
- schema.ts (#14)
- enrollments table (#15)
- ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)
- CLAUDE.md (loyiha ko'rsatmalari) (#17)
- REJA.md (#18)
- PermissionsAdminService (#19)
- users table and 6 roles (#20)
- db.service.ts (#21)
- Yaratish va parol qoidalari jadvali (#22)
- compilerOptions (#23)
- devDependencies (#24)
- centers.e2e-spec.ts (#25)
- compilerOptions (#26)
- scripts (#27)
- db (#28)
- AuthUser (#29)
- centers table (tenant) (#30)
- scripts (#31)
- api/package.json (#32)
- dependencies (#33)
- permission-matrix.ts (#34)
- index.ts (#35)
- Skelet maqsadi: super admin markaz ochad (#36)
- app-config.ts (#37)
- permissions table (code catalog) (#38)
- attendance-lock.e2e-spec.ts (#39)
- shared/package.json (#40)
- attendance.e2e-spec.ts (#41)
- compilerOptions (#42)
- tenant-isolation.e2e-spec.ts (#43)
- enrollments.e2e-spec.ts (#44)
- permission-matrix.e2e-spec.ts (#45)
- payments table (#46)
- groups.e2e-spec.ts (#47)
- .oxlintrc.json (#48)
- main.ts (#49)
- ProbeController (#50)
- students.e2e-spec.ts (#51)
- tsconfig.build.json (#52)
- lessons table (#53)
- nest-cli.json (#54)
- password.ts (#55)
- allowBuilds (#56)
- vitest (#57)
- oxlint-tsgolint@^7.0.2001 (#58)
- prettier@^3.4.2 (#59)
- Environment limitation: Docker/WSL unava (#60)

## God Nodes (most connected - your core abstractions)
1. `@nestjs/common` - 60 edges
2. `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar)` - 58 edges
3. `AuthUser` - 44 edges
4. `branchScope()` - 44 edges
5. `drizzle-orm` - 38 edges
6. `CLAUDE.md (loyiha ko'rsatmalari)` - 31 edges
7. `ClientInfo` - 27 edges
8. `zod` - 26 edges
9. `GroupsService` - 26 edges
10. `LessonsService` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Frontend: Next.js (React)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `CLAUDE.md (loyiha ko'rsatmalari)` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `Backend: NestJS modulli monolit` --references--> `typescript`  [EXTRACTED]
  CLAUDE.md → apps/api/package.json
- `AuthUser` --references--> `Role`  [EXTRACTED]
  apps/api/src/auth/auth.types.ts → packages/shared/src/index.ts
- `To'lov, maosh to'lovi, audit append-only` --semantically_similar_to--> `Qoida 3: Pul append-only, teskari yozuv`  [INFERRED] [semantically similar]
  CLAUDE.md → ERD-VA-RUXSATLAR.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Billing flow: enrollments, freezes and discounts produce charges** — erd_va_ruxsatlar_enrollments, erd_va_ruxsatlar_enrollment_freezes, erd_va_ruxsatlar_enrollment_discounts, erd_va_ruxsatlar_charges, progress_billing_engine [EXTRACTED 1.00]
- **Effective permission resolution: role template, user exception, scope, guards** — erd_va_ruxsatlar_center_role_permissions, erd_va_ruxsatlar_user_permissions, erd_va_ruxsatlar_permission_scope, erd_va_ruxsatlar_permission_matrix, progress_guard_order [EXTRACTED 1.00]
- **Payment settlement: payments allocated to charges, advance remainder** — erd_va_ruxsatlar_payments, erd_va_ruxsatlar_payment_allocations, erd_va_ruxsatlar_charges, erd_va_ruxsatlar_advance_balance, progress_step_14_payments [EXTRACTED 1.00]

## Communities (62 total, 6 thin omitted)

### Community 0 - "decorators.ts (#0)"
Cohesion: 0.05
Nodes (32): AuthController, changePasswordSchema, clientOf(), loginSchema, refreshSchema, ALLOW_MUST_CHANGE, AllowMustChangePassword(), CurrentUser (+24 more)

### Community 1 - "@nestjs/common (#1)"
Cohesion: 0.05
Nodes (19): AppController, AppService, AuditController, AuditModule, AuthModule, LoginThrottle, BillingModule, BranchesModule (+11 more)

### Community 2 - "branchScope() (#2)"
Cohesion: 0.09
Nodes (26): branchScope(), clientOf(), GroupsController, AssignTeacherInput, assignTeacherSchema, BILLING_KEYS, billingMode, CreateGroupInput (+18 more)

### Community 3 - "EnrollmentsService (#3)"
Cohesion: 0.07
Nodes (21): BillingService, chunks(), clientOf(), EnrollmentsController, CreateEnrollmentInput, createEnrollmentSchema, LeaveEnrollmentInput, leaveEnrollmentSchema (+13 more)

### Community 4 - "LessonsService (#4)"
Cohesion: 0.07
Nodes (23): daysBetween(), clientOf(), LessonsController, ATTENDANCE_STATUSES, AttendanceQuery, attendanceQuerySchema, AttendanceStatus, CreateLessonInput (+15 more)

### Community 5 - "inScope() (#5)"
Cohesion: 0.07
Nodes (22): inScope(), clientOf(), StaffController, UserPasswordController, branchIds, CreateStaffInput, createStaffSchema, ListStaffQuery (+14 more)

### Community 6 - "StudentsService (#6)"
Cohesion: 0.09
Nodes (16): clientOf(), StudentsController, birthDate, CreateStudentInput, createStudentSchema, ListStudentsQuery, listStudentsSchema, login (+8 more)

### Community 7 - "BranchesService (#7)"
Cohesion: 0.10
Nodes (13): BranchesController, clientOf(), CreateBranchInput, createBranchSchema, listBranchesSchema, phone, UpdateBranchInput, updateBranchSchema (+5 more)

### Community 8 - "CoursesService (#8)"
Cohesion: 0.11
Nodes (13): clientOf(), CoursesController, CreateCourseInput, createCourseSchema, listCoursesSchema, price, UpdateCourseInput, updateCourseSchema (+5 more)

### Community 9 - "auth.service.ts (#9)"
Cohesion: 0.08
Nodes (18): accountInactive(), AuthService, centerBlocked(), invalidRefresh(), LoginResult, AccessClaims, AuthedRequest, SessionRow (+10 more)

### Community 10 - "web/package.json (#10)"
Cohesion: 0.06
Nodes (34): eslintConfig, nextConfig, dependencies, next@16.4.6, react@19.3.0, react-dom@19.3.0, devDependencies, eslint@^9 (+26 more)

### Community 11 - "billing.e2e-spec.ts (#11)"
Cohesion: 0.11
Nodes (34): BillingMode, ChargeDraft, ChargeKind, countLessons(), discountFor(), EngineContext, EngineDiscount, EngineEnrollment (+26 more)

### Community 12 - "ChargesService (#12)"
Cohesion: 0.10
Nodes (14): BillingController, clientOf(), cancelChargeSchema, CreateManualChargeInput, createManualChargeSchema, generateBillingSchema, ListChargesQuery, listChargesSchema (+6 more)

### Community 13 - "students.service.ts (#13)"
Cohesion: 0.10
Nodes (28): hashPassword(), generateTempPassword(), CreateCenterInput, ListCentersQuery, UpdateCenterInput, CreatedCenter, notFound(), SUPER (+20 more)

### Community 14 - "schema.ts (#14)"
Cohesion: 0.14
Nodes (30): GenerateOptions, ChargeRow, branchFilter(), BranchScope, todayLocal(), currentTeacher(), groupVisibility(), studentGroupIds() (+22 more)

### Community 15 - "enrollments table (#15)"
Cohesion: 0.10
Nodes (30): Ikki to'lov rejimi GROUP_CYCLE / STUDENT_CYCLE, Accepted decisions and resolved questions, Advance (unallocated balance) auto-allocation, Qaror: avans va ko'p oylik to'lov mumkin, To'lov eng eski ochiq charge ga taqsimlanadi, ortiqcha = avans, Event-driven idempotent charge generation, charges table, Ikki to'lov sikli taqqoslash jadvali (+22 more)

### Community 16 - "ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)"
Cohesion: 0.11
Nodes (31): assignments, Filialga bog'lash: OWNER hammasi, ADMIN/CASHIER user_branches, branches table, courses table, Bir o'quvchi bitta akkaunt, turli filial guruhlarida, Maosh qoidalari faqat rahbarda, O'quvchi filial reytingini to'liq ism bilan ko'radi, Ustoz bir nechta filial/guruhda ishlay oladi (+23 more)

### Community 17 - "CLAUDE.md (loyiha ko'rsatmalari) (#17)"
Cohesion: 0.10
Nodes (29): typescript@^6.0.2, typescript, Byudjet $0, host-agnostik (Docker), CLAUDE.md (loyiha ko'rsatmalari), Hujjatlarni o'qish tartibi, ORM: Drizzle, Qaror ERD dan chetga chiqsa avval hujjatni yangila, ERD hujjati model va ruxsatlar manbasi (+21 more)

### Community 18 - "REJA.md (#18)"
Cohesion: 0.09
Nodes (26): Audit jurnali: kim, nima, qachon, oldingi/keyingi, Auth: argon2, JWT + refresh, 2FA, Raqobatchilar: SchoolupCRM, UstozCRM, ALFA CRM, Umai CRM, Shaxsiy ma'lumotlar qonuni (lokalizatsiya), Birinchi 7 kunda 5 amaliy qadam, Bepul infra cheklovlari (Neon/Supabase, Render, Fly.io), 5-10 rahbar bilan suhbat (birinchi vazifa), Bozor tahlili (raqobatchilar) (+18 more)

### Community 19 - "PermissionsAdminService (#19)"
Cohesion: 0.15
Nodes (4): clientOf(), PermissionsAdminController, assertConfigurable(), PermissionsAdminService

### Community 20 - "users table and 6 roles (#20)"
Cohesion: 0.11
Nodes (24): Kassir/admin alohida rol, ruxsat orqali birlashishi mumkin, Markaz boshlang'ich settings (GROUP_CYCLE, grace 0, FULL_MONTH, NONE, uz), Markaz yaratish POST /admin/centers (bitta tranzaksiya), Ustoz moliyani ko'rmaydi (○: faqat qarz bor/yo'q), users.login global noyob (lower(login)), Ruxsatlar matritsasi (3-bo'lim), Belgilar: ✔ ○ – o f, Super admin tenant ichini ko'rmaydi; impersonate hozircha yo'q (+16 more)

### Community 21 - "db.service.ts (#21)"
Cohesion: 0.21
Nodes (11): AuditEntry, listAuditSchema, CourseRow, contextOf(), DbService, Tx, auditLogs, centerRolePermissions (+3 more)

### Community 22 - "Yaratish va parol qoidalari jadvali (#22)"
Cohesion: 0.09
Nodes (19): Parol: argon2, must_change_password, Auth: JWT access + rotating refresh, Bloklash POST /admin/centers/:id/block, unblock, owner reset-password, Bloklangan markaz: kirish rad etiladi, Center creation flow (POST /admin/centers), Yaratish va parol qoidalari jadvali, Izolyatsiya testi tenant-isolation.e2e-spec.ts, must_change_password=true bilan boshlanadi (+11 more)

### Community 23 - "compilerOptions (#23)"
Cohesion: 0.10
Nodes (20): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+12 more)

### Community 24 - "devDependencies (#24)"
Cohesion: 0.10
Nodes (19): devDependencies, drizzle-kit@^0.31.11, @electric-sql/pglite@^0.5.16, @nestjs/cli@^12.0.0, oxlint@^1.58.0, source-map-support@^0.5.21, tsx@^4.23.15, @types/express@^5.0.0 (+11 more)

### Community 25 - "centers.e2e-spec.ts (#25)"
Cohesion: 0.17
Nodes (14): @nestjs/testing@^12.0.1, supertest@^7.0.0, AppModule, DB_OPTIONS, config, config, createTestDb(), activate() (+6 more)

### Community 26 - "compilerOptions (#26)"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 27 - "scripts (#27)"
Cohesion: 0.11
Nodes (18): scripts, build, db:create-super-admin, db:generate, db:migrate, db:seed, deploy, format (+10 more)

### Community 28 - "db (#28)"
Cohesion: 0.11
Nodes (17): environment, healthcheck, image, ports, restart, volumes, POSTGRES_DB, POSTGRES_PASSWORD (+9 more)

### Community 29 - "AuthUser (#29)"
Cohesion: 0.32
Nodes (5): writeAudit(), ClientInfo, AuthUser, CentersService, inCenter()

### Community 30 - "centers table (tenant) (#30)"
Cohesion: 0.13
Nodes (17): Qarz saqlanmaydi, charges dan hisoblanadi, centers table (tenant), Trigger centers_guard_platform_columns, Qarzdor: today > due_date + grace_days va charge to'lanmagan, grace_days: markaz sukuti + groups.grace_days, import_jobs, users/centers/branches/plans ga DELETE huquqi yo'q, plans table (SaaS tariffs) (+9 more)

### Community 31 - "scripts (#31)"
Cohesion: 0.12
Nodes (16): engines, node, name, packageManager, private, scripts, build, db:create-super-admin (+8 more)

### Community 32 - "api/package.json (#32)"
Cohesion: 0.12
Nodes (15): author, description, @nestjs/mau@^0.2.6, @nestjs/schematics@^12.0.0, @types/supertest@^7.0.0, vite@^8.0.0, license, name (+7 more)

### Community 33 - "dependencies (#33)"
Cohesion: 0.12
Nodes (16): dependencies, drizzle-orm@^0.45.4, @erp/shared@workspace:*, @nestjs/common@^12.0.1, @nestjs/jwt@^12.0.5, @nestjs/platform-express@^12.0.1, @node-rs/argon2@^2.2.2, reflect-metadata@^0.2.2 (+8 more)

### Community 34 - "permission-matrix.ts (#34)"
Cohesion: 0.14
Nodes (12): DEFAULT_CENTER_SETTINGS, DEFAULT_TRIAL_DAYS, ROLE_PERMISSION_MATRIX, RoleMatrix, RolePermissionRow, TenantRole, PERMISSION_CODES, PERMISSION_MODULES (+4 more)

### Community 35 - "index.ts (#35)"
Cohesion: 0.15
Nodes (10): postgres@^4.1.1, client, permissions, client, db, PAYMENT_MODES, PaymentMode, ROLES (+2 more)

### Community 36 - "Skelet maqsadi: super admin markaz ochad (#36)"
Cohesion: 0.23
Nodes (14): Skelet 1: Monorepo, Docker Compose, .env.example (tayyor), Skelet 2: Migratsiyalar 10 jadval (tayyor), Skelet 3: Auth login, JWT+refresh, guard (tayyor), Skelet 4: RLS va tenant izolyatsiya testi (tayyor), Skelet 5: Super admin markaz yaratish/bloklash (tayyor), Skelet 6: Rahbar filial va xodim yaratish, ruxsat sozlash (keyingi), Skelet 7: Audit jurnali va ruxsat matritsasi testi (kutmoqda), Skelet maqsadi: super admin markaz ochadi, rahbar kiradi, filial va xodim yaratadi (+6 more)

### Community 37 - "app-config.ts (#37)"
Cohesion: 0.19
Nodes (9): APP_CONFIG, AppConfig, envSchema, loadConfig(), parseDuration(), UNIT_SECONDS, DB, Db (+1 more)

### Community 38 - "permissions table (code catalog) (#38)"
Cohesion: 0.21
Nodes (13): Ruxsatlar: rol + center_role_permissions + user_permissions, scope so'rov filtri, center_role_permissions (role template), Samarali ruxsat = rol shabloni ± user istisnosi, permissions pnpm db:seed orqali @erp/shared dan, Permissions matrix (checkmark / optional / never), Permission scopes (center, branch, own group, own record), permissions table (code catalog), Qoida 8: Ruxsat = rol + markaz sozlamasi + foydalanuvchi istisnosi (+5 more)

### Community 39 - "attendance-lock.e2e-spec.ts (#39)"
Cohesion: 0.26
Nodes (11): activate(), Api, Center, config, daysAgo(), makeApi(), mkStudent(), newCenter() (+3 more)

### Community 40 - "shared/package.json (#40)"
Cohesion: 0.18
Nodes (11): devDependencies, typescript@^5.9.3, typescript, main, name, private, scripts, build (+3 more)

### Community 41 - "attendance.e2e-spec.ts (#41)"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, config, daysAgo(), makeApi(), mkStudent(), newCenter() (+2 more)

### Community 42 - "compilerOptions (#42)"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, esModuleInterop, module, outDir, rootDir, skipLibCheck, strict (+2 more)

### Community 43 - "tenant-isolation.e2e-spec.ts (#43)"
Cohesion: 0.22
Nodes (5): TenantContext, rowsOf(), Fixture, TENANT_TABLES, TenantTable

### Community 44 - "enrollments.e2e-spec.ts (#44)"
Cohesion: 0.33
Nodes (9): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+1 more)

### Community 45 - "permission-matrix.e2e-spec.ts (#45)"
Cohesion: 0.25
Nodes (4): activate(), AllPermissionsProbe, config, newCenter()

### Community 46 - "payments table (#46)"
Cohesion: 0.28
Nodes (8): To'lov, maosh to'lovi, audit append-only, audit_logs (append-only), audit_logs UPDATE/DELETE/TRUNCATE triggerlar bilan bloklangan, payments table, Matritsa 3.4 Moliya, Qaytarish: status=REVERSED va reverses_payment_id, Qoida 3: Pul append-only, teskari yozuv, Step 7: GET /audit and permission matrix test

### Community 47 - "groups.e2e-spec.ts (#47)"
Cohesion: 0.39
Nodes (7): activate(), Api, Center, config, makeApi(), newCenter(), staff()

### Community 48 - ".oxlintrc.json (#48)"
Cohesion: 0.29
Nodes (6): env, node, rules, typescript/no-explicit-any, typescript/no-floating-promises, $schema

### Community 49 - "main.ts (#49)"
Cohesion: 0.29
Nodes (3): @nestjs/core@^12.0.1, envFile, @nestjs/core

### Community 51 - "students.e2e-spec.ts (#51)"
Cohesion: 0.38
Nodes (6): activate(), Center, config, newCenter(), staff(), student()

### Community 52 - "tsconfig.build.json (#52)"
Cohesion: 0.29
Nodes (6): compilerOptions, rootDir, exclude, extends, include, ./tsconfig.json

### Community 53 - "lessons table (#53)"
Cohesion: 0.33
Nodes (7): Attendance lock rule (attendance_lock_days), attendance_records table, Dars qulflanishi lessons.locked_at, attendance.edit_past, lessons table, Matritsa 3.3 Guruh, davomat, vazifa, reyting, Step 11: lessons and attendance marking, Step 12: attendance lock and reporting

### Community 54 - "nest-cli.json (#54)"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 55 - "password.ts (#55)"
Cohesion: 0.47
Nodes (4): invalidCredentials(), PARAMS, verifyAgainstDummy(), verifyPassword()

### Community 56 - "allowBuilds (#56)"
Cohesion: 0.40
Nodes (4): allowBuilds, sharp, unrs-resolver, packages

## Knowledge Gaps
- **46 isolated node(s):** `./tsconfig.json`, `Kod grafi graphify-out`, `Auth: argon2, JWT + refresh, 2FA`, `Raqobatchilar: SchoolupCRM, UstozCRM, ALFA CRM, Umai CRM`, `Shaxsiy ma'lumotlar qonuni (lokalizatsiya)` (+41 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 392 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CLAUDE.md (loyiha ko'rsatmalari)` connect `CLAUDE.md (loyiha ko'rsatmalari) (#17)` to `Skelet maqsadi: super admin markaz ochad (#36)`, `permissions table (code catalog) (#38)`, `payments table (#46)`, `enrollments table (#15)`, `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)`, `REJA.md (#18)`, `Yaratish va parol qoidalari jadvali (#22)`, `centers table (tenant) (#30)`?**
  _High betweenness centrality (0.230) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `Kod grafi graphify-out`, `Auth: argon2, JWT + refresh, 2FA` to the rest of the system?**
  _46 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `decorators.ts (#0)` be split into smaller, more focused modules?**
  _Cohesion score 0.05454545454545454 - nodes in this community are weakly interconnected._
- **Why does `typescript` connect `CLAUDE.md (loyiha ko'rsatmalari) (#17)` to `api/package.json (#32)`?**
  _High betweenness centrality (0.228) - this node is a cross-community bridge._
- **Should `@nestjs/common (#1)` be split into smaller, more focused modules?**
  _Cohesion score 0.05271629778672032 - nodes in this community are weakly interconnected._
- **Why does `@nestjs/common` connect `@nestjs/common (#1)` to `api/package.json (#32)`, `dependencies (#33)`, `decorators.ts (#0)`, `index.ts (#35)`, `app-config.ts (#37)`, `attendance-lock.e2e-spec.ts (#39)`, `auth.service.ts (#9)`, `attendance.e2e-spec.ts (#41)`, `billing.e2e-spec.ts (#11)`, `enrollments.e2e-spec.ts (#44)`, `students.service.ts (#13)`, `schema.ts (#14)`, `groups.e2e-spec.ts (#47)`, `permission-matrix.e2e-spec.ts (#45)`, `students.e2e-spec.ts (#51)`, `db.service.ts (#21)`, `centers.e2e-spec.ts (#25)`?**
  _High betweenness centrality (0.176) - this node is a cross-community bridge._
- **Should `branchScope() (#2)` be split into smaller, more focused modules?**
  _Cohesion score 0.08611670020120725 - nodes in this community are weakly interconnected._