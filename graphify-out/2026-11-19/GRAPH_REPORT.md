# Graph Report - ERP  (2026-11-19)

## Corpus Check
- 181 files · ~115,766 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1974 nodes · 6514 edges · 89 communities (81 shown, 8 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 417 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- branchScope() (#2)
- Community 3
- Community 4
- inScope() (#5)
- StudentsService (#6)
- Community 7
- CoursesService (#8)
- Community 9
- web/package.json (#10)
- Community 11
- ChargesService (#12)
- students.service.ts (#13)
- Community 14
- enrollments table (#15)
- ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)
- CLAUDE.md (loyiha ko'rsatmalari) (#17)
- REJA.md (#18)
- Community 19
- Community 20
- Community 21
- Yaratish va parol qoidalari jadvali (#22)
- compilerOptions (#23)
- Community 24
- Community 25
- compilerOptions (#26)
- scripts (#27)
- db (#28)
- Community 29
- centers table (tenant) (#30)
- scripts (#31)
- Community 32
- dependencies (#33)
- Community 34
- Community 35
- Community 36
- Community 37
- permissions table (code catalog) (#38)
- Community 39
- shared/package.json (#40)
- Community 41
- compilerOptions (#42)
- Community 43
- Community 44
- Community 45
- payments table (#46)
- Community 47
- .oxlintrc.json (#48)
- Community 49
- Community 50
- Community 51
- tsconfig.build.json (#52)
- Community 53
- nest-cli.json (#54)
- Community 55
- allowBuilds (#56)
- vitest (#57)
- Community 58
- Community 59
- Environment limitation: Docker/WSL unava (#60)
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 87
- Community 88

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 327 edges
2. `CurrentUser` - 130 edges
3. `Tx` - 110 edges
4. `ClientInfo` - 104 edges
5. `@nestjs/common` - 92 edges
6. `writeAudit()` - 72 edges
7. `branchScope()` - 68 edges
8. `DbService` - 59 edges
9. `todayLocal()` - 57 edges
10. `drizzle-orm` - 57 edges

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

## Communities (89 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (44): daysBetween(), todayLocal(), category, CreateExpenseInput, createExpenseSchema, ListExpensesQuery, listExpensesSchema, MAX_REPORT_DAYS (+36 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (11): RequirePermission(), CentersController, clientOf(), ListCentersQuery, UpdateCenterInput, CentersService, inCenter(), notFound() (+3 more)

### Community 2 - "branchScope() (#2)"
Cohesion: 0.08
Nodes (29): uuid(), AdjustRatingInput, adjustRatingSchema, CreateAssignmentInput, createAssignmentSchema, GradeInput, gradeSchema, link (+21 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (18): AcademicModule, AuditModule, AuthModule, BillingModule, BranchesModule, CentersModule, CoursesModule, EnrollmentsModule (+10 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (13): AppController, AppService, AuthController, clientOf(), accountInactive(), AuthService, centerBlocked(), invalidCredentials() (+5 more)

### Community 5 - "inScope() (#5)"
Cohesion: 0.08
Nodes (28): audited(), forbidden(), payoutNotFound(), PayoutsService, attachedGroups(), Attachment, EngineRule, fmt() (+20 more)

### Community 6 - "StudentsService (#6)"
Cohesion: 0.09
Nodes (36): AuditEntry, AuditController, listAuditSchema, GenerateOptions, ChargeRow, DiscountRow, Range, PaymentRow (+28 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (16): clientOf(), StudentsController, birthDate, CreateStudentInput, createStudentSchema, ListStudentsQuery, listStudentsSchema, login (+8 more)

### Community 8 - "CoursesService (#8)"
Cohesion: 0.08
Nodes (19): clientOf(), branchIds, CreateStaffInput, createStaffSchema, ListStaffQuery, listStaffSchema, login, phone (+11 more)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (29): ATTENDANCE_POINTS, RankRow, TZ, DebtorRow, GroupRow, branchFilter(), BranchScope, inScope() (+21 more)

### Community 10 - "web/package.json (#10)"
Cohesion: 0.10
Nodes (36): BillingMode, ChargeDraft, ChargeKind, countLessons(), discountFor(), EngineContext, EngineDiscount, EngineEnrollment (+28 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (37): Attendance lock rule (attendance_lock_days), Audit log (append-only, GET /audit), Auth design (JWT 15 min, refresh rotation, HMAC hash), Billing engine planCharges (pure function), Branch scope helper (branch-scope.ts), Drizzle migrations plus handwritten SQL, ERD-VA-RUXSATLAR.md (rules source), FIFO payment allocation (AllocatorService) (+29 more)

### Community 12 - "ChargesService (#12)"
Cohesion: 0.06
Nodes (34): eslintConfig, nextConfig, dependencies, next@16.4.6, react@19.3.0, react-dom@19.3.0, devDependencies, eslint@^9 (+26 more)

### Community 13 - "students.service.ts (#13)"
Cohesion: 0.10
Nodes (13): BranchesController, clientOf(), CreateBranchInput, createBranchSchema, listBranchesSchema, phone, UpdateBranchInput, updateBranchSchema (+5 more)

### Community 14 - "Community 14"
Cohesion: 0.08
Nodes (16): clientOf(), PermissionsAdminController, assertConfigurable(), PermissionsAdminService, DEFAULT_CENTER_SETTINGS, DEFAULT_TRIAL_DAYS, ROLE_PERMISSION_MATRIX, RoleMatrix (+8 more)

### Community 15 - "enrollments table (#15)"
Cohesion: 0.10
Nodes (18): clientOf(), GroupsController, AssignTeacherInput, assignTeacherSchema, BILLING_KEYS, billingMode, CreateGroupInput, createGroupSchema (+10 more)

### Community 16 - "ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)"
Cohesion: 0.11
Nodes (14): BillingController, clientOf(), cancelChargeSchema, CreateManualChargeInput, createManualChargeSchema, generateBillingSchema, ListChargesQuery, listChargesSchema (+6 more)

### Community 17 - "CLAUDE.md (loyiha ko'rsatmalari) (#17)"
Cohesion: 0.19
Nodes (7): AcademicController, clientOf(), clientOf(), DiscountsController, clientOf(), clientOf(), PayrollController

### Community 18 - "REJA.md (#18)"
Cohesion: 0.17
Nodes (5): AuthUser, CurrentUser, FinanceController, ImportsController, ReportsController

### Community 19 - "Community 19"
Cohesion: 0.09
Nodes (22): APP_CONFIG, AppConfig, ConfigModule, envSchema, loadConfig(), parseDuration(), UNIT_SECONDS, DbModule (+14 more)

### Community 20 - "Community 20"
Cohesion: 0.18
Nodes (9): chunks(), Tx, bad(), conflict(), enrollmentNotFound(), EnrollmentsService, forbidden(), groupNotFound() (+1 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (21): writeAudit(), generateTempPassword(), CreateCenterInput, CreatedCenter, SUPER, generateLogin(), isLoginConflict(), MAX_LOGIN_TRIES (+13 more)

### Community 22 - "Yaratish va parol qoidalari jadvali (#22)"
Cohesion: 0.12
Nodes (26): attrs(), BUILTIN_DATE_FMTS, colIndex(), corrupt(), dateStyles(), decode(), ENTITIES, excelSerialToIso() (+18 more)

### Community 23 - "compilerOptions (#23)"
Cohesion: 0.10
Nodes (14): clientOf(), LessonsController, ATTENDANCE_STATUSES, attendanceQuerySchema, AttendanceStatus, CreateLessonInput, createLessonSchema, ListLessonsQuery (+6 more)

### Community 24 - "Community 24"
Cohesion: 0.09
Nodes (31): typescript@^6.0.2, typescript, To'lov, maosh to'lovi, audit append-only, Byudjet $0, host-agnostik (Docker), Qarz saqlanmaydi, charges dan hisoblanadi, CLAUDE.md (loyiha ko'rsatmalari), Hujjatlarni o'qish tartibi, ORM: Drizzle (+23 more)

### Community 25 - "Community 25"
Cohesion: 0.11
Nodes (18): LoginResult, AccessClaims, AuthedRequest, SessionRow, TokenPair, UserRow, JwtAuthGuard, PermissionsGuard (+10 more)

### Community 26 - "compilerOptions (#26)"
Cohesion: 0.13
Nodes (13): clientOf(), EnrollmentsController, id(), CreateEnrollmentInput, createEnrollmentSchema, LeaveEnrollmentInput, leaveEnrollmentSchema, ListEnrollmentsQuery (+5 more)

### Community 27 - "scripts (#27)"
Cohesion: 0.26
Nodes (8): branchScope(), ScheduleItem, bad(), conflict(), escapeLike(), forbidden(), groupNotFound(), GroupsService

### Community 28 - "db (#28)"
Cohesion: 0.19
Nodes (8): AttendanceQuery, bad(), conflict(), forbidden(), groupNotFound(), lessonNotFound(), LessonsService, rate()

### Community 29 - "Community 29"
Cohesion: 0.15
Nodes (3): PermissionsService, BillingService, DbService

### Community 30 - "centers table (tenant) (#30)"
Cohesion: 0.21
Nodes (13): changePasswordSchema, loginSchema, refreshSchema, ClientInfo, ALLOW_MUST_CHANGE, IS_PUBLIC, PERMISSIONS_KEY, Roles() (+5 more)

### Community 31 - "scripts (#31)"
Cohesion: 0.18
Nodes (6): AllocatorService, audited(), forbidden(), paymentNotFound(), PaymentsService, studentNotFound()

### Community 32 - "Community 32"
Cohesion: 0.10
Nodes (22): Audit jurnali: kim, nima, qachon, oldingi/keyingi, Auth: argon2, JWT + refresh, 2FA, Raqobatchilar: SchoolupCRM, UstozCRM, ALFA CRM, Umai CRM, Shaxsiy ma'lumotlar qonuni (lokalizatsiya), Birinchi 7 kunda 5 amaliy qadam, Bepul infra cheklovlari (Neon/Supabase, Render, Fly.io), 5-10 rahbar bilan suhbat (birinchi vazifa), Bozor tahlili (raqobatchilar) (+14 more)

### Community 33 - "dependencies (#33)"
Cohesion: 0.14
Nodes (18): @nestjs/testing@^12.0.1, supertest@^7.0.0, AppModule, activate(), Api, Center, config, makeApi() (+10 more)

### Community 34 - "Community 34"
Cohesion: 0.11
Nodes (17): id(), id(), CreateDiscountInput, createDiscountSchema, endDiscountSchema, ListDebtorsQuery, listDebtorsSchema, reason (+9 more)

### Community 35 - "Community 35"
Cohesion: 0.14
Nodes (15): TenantContext, createTestDb(), activate(), Api, Center, config, makeApi(), mkStudent() (+7 more)

### Community 36 - "Community 36"
Cohesion: 0.10
Nodes (20): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+12 more)

### Community 37 - "Community 37"
Cohesion: 0.14
Nodes (21): assignments, attendance_records, branches, expenses, Moliyaviy hisobot (kassa asosida), group_schedules, group_teachers, groups (+13 more)

### Community 38 - "permissions table (code catalog) (#38)"
Cohesion: 0.10
Nodes (19): devDependencies, drizzle-kit@^0.31.11, @electric-sql/pglite@^0.5.16, @nestjs/cli@^12.0.0, oxlint@^1.58.0, oxlint-tsgolint@^7.0.2001, prettier@^3.4.2, source-map-support@^0.5.21 (+11 more)

### Community 39 - "Community 39"
Cohesion: 0.18
Nodes (8): DebtorsService, forbidden(), audited(), discountNotFound(), DiscountsService, enrollmentNotFound(), forbidden(), overlap()

### Community 40 - "shared/package.json (#40)"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 41 - "Community 41"
Cohesion: 0.11
Nodes (18): scripts, build, db:create-super-admin, db:generate, db:migrate, db:seed, deploy, format (+10 more)

### Community 43 - "Community 43"
Cohesion: 0.18
Nodes (16): CreateAdjustmentInput, createAdjustmentSchema, createPayoutSchema, createRuleSchema, endRuleSchema, listPayoutsSchema, listPeriodsSchema, ListRulesQuery (+8 more)

### Community 44 - "Community 44"
Cohesion: 0.11
Nodes (17): environment, healthcheck, image, ports, restart, volumes, POSTGRES_DB, POSTGRES_PASSWORD (+9 more)

### Community 45 - "Community 45"
Cohesion: 0.12
Nodes (16): engines, node, name, packageManager, private, scripts, build, db:create-super-admin (+8 more)

### Community 46 - "payments table (#46)"
Cohesion: 0.12
Nodes (15): author, description, @nestjs/mau@^0.2.6, @types/node@^24.0.0, @types/supertest@^7.0.0, vite@^8.0.0, @types/node, license (+7 more)

### Community 48 - ".oxlintrc.json (#48)"
Cohesion: 0.37
Nodes (5): audited(), CoursesService, forbidden(), nameTaken(), notFound()

### Community 49 - "Community 49"
Cohesion: 0.33
Nodes (4): audited(), ExpensesService, forbidden(), notFound()

### Community 50 - "Community 50"
Cohesion: 0.18
Nodes (15): Ikki to'lov rejimi GROUP_CYCLE / STUDENT_CYCLE, Biznes sanasi Asia/Tashkent, Charge yaratish (idempotent, hodisalar bilan), charges, enrollment_discounts, enrollment_freezes, enrollments, GROUP_CYCLE (Najot usuli) (+7 more)

### Community 51 - "Community 51"
Cohesion: 0.14
Nodes (16): Avans (taqsimlanmagan qoldiq), Qabul qilingan qarorlar va ochiq savollar, ERD va ruxsatlar matritsasi, join_proration (FULL_MONTH, REMAINING_LESSONS), Umumiy hisobotlar (overview, branch_compare), Moliya ruxsatlari (payment, debtors, expense, payroll), Tashkilot ruxsatlari (branch.manage, staff.create, student.*), Platforma ruxsatlari (center.create, owner.create, plan.manage) (+8 more)

### Community 52 - "tsconfig.build.json (#52)"
Cohesion: 0.13
Nodes (15): dependencies, drizzle-orm@^0.45.4, @erp/shared@workspace:*, @nestjs/common@^12.0.1, @nestjs/jwt@^12.0.5, @nestjs/platform-express@^12.0.1, @node-rs/argon2@^2.2.2, reflect-metadata@^0.2.2 (+7 more)

### Community 53 - "Community 53"
Cohesion: 0.15
Nodes (10): postgres@^4.1.1, client, permissions, client, db, PAYMENT_MODES, PaymentMode, ROLES (+2 more)

### Community 54 - "nest-cli.json (#54)"
Cohesion: 0.23
Nodes (12): activate(), Api, Center, config, FUTURE, makeApi(), mkStudent(), newCenter() (+4 more)

### Community 55 - "Community 55"
Cohesion: 0.21
Nodes (11): activate(), Api, Center, config, M, makeApi(), newCenter(), NEXT (+3 more)

### Community 56 - "allowBuilds (#56)"
Cohesion: 0.26
Nodes (11): activate(), Api, Center, config, daysAgo(), makeApi(), mkStudent(), newCenter() (+3 more)

### Community 57 - "vitest (#57)"
Cohesion: 0.26
Nodes (11): activate(), Api, Center, ChargeView, config, daysAgo(), makeApi(), mkStudent() (+3 more)

### Community 58 - "Community 58"
Cohesion: 0.27
Nodes (12): Skelet 1: Monorepo, Docker Compose, .env.example (tayyor), Skelet 2: Migratsiyalar 10 jadval (tayyor), Skelet 3: Auth login, JWT+refresh, guard (tayyor), Skelet 4: RLS va tenant izolyatsiya testi (tayyor), Skelet 5: Super admin markaz yaratish/bloklash (tayyor), Skelet 6: Rahbar filial va xodim yaratish, ruxsat sozlash (keyingi), Skelet 7: Audit jurnali va ruxsat matritsasi testi (kutmoqda), Skelet maqsadi: super admin markaz ochadi, rahbar kiradi, filial va xodim yaratadi (+4 more)

### Community 59 - "Community 59"
Cohesion: 0.18
Nodes (11): devDependencies, typescript@^5.9.3, typescript, main, name, private, scripts, build (+3 more)

### Community 60 - "Environment limitation: Docker/WSL unava (#60)"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, config, daysAgo(), makeApi(), mkStudent(), newCenter() (+2 more)

### Community 61 - "Community 61"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, config, D2, makeApi(), mkStudent(), newCenter() (+2 more)

### Community 62 - "Community 62"
Cohesion: 0.25
Nodes (10): activate(), Api, Center, config, HEADER, makeApi(), newCenter(), staff() (+2 more)

### Community 63 - "Community 63"
Cohesion: 0.29
Nodes (10): activate(), Api, Center, ChargeView, config, makeApi(), mkStudent(), newCenter() (+2 more)

### Community 64 - "Community 64"
Cohesion: 0.22
Nodes (10): audit_logs, center_role_permissions, notification_log, Ruxsatni tekshirish qatlami (kod + scope + samarali ruxsat), permissions, student_profiles, teacher_profiles, user_branches (+2 more)

### Community 65 - "Community 65"
Cohesion: 0.22
Nodes (11): Markaz yaratish (POST /admin/centers), centers (tenant), courses, import_jobs, Ko'p filialli model (Asosiy filial avtomatik), plans, saas_invoices, Excel import (+3 more)

### Community 66 - "Community 66"
Cohesion: 0.18
Nodes (10): compilerOptions, declaration, esModuleInterop, module, outDir, rootDir, skipLibCheck, strict (+2 more)

### Community 67 - "Community 67"
Cohesion: 0.29
Nodes (7): hashPassword(), PARAMS, verifyAgainstDummy(), verifyPassword(), client, db, login

### Community 68 - "Community 68"
Cohesion: 0.31
Nodes (8): id(), blockCenterSchema, createCenterSchema, listCentersSchema, phone, resetOwnerPasswordSchema, slug, updateCenterSchema

### Community 69 - "Community 69"
Cohesion: 0.36
Nodes (4): FinanceReportService, forbidden(), num(), ReportQuery

### Community 70 - "Community 70"
Cohesion: 0.27
Nodes (7): clientOf(), flag, ListImportsQuery, listImportsSchema, RunImportInput, runImportSchema, UploadedFile

### Community 71 - "Community 71"
Cohesion: 0.33
Nodes (9): activate(), Api, Center, config, makeApi(), mkStudent(), newCenter(), staff() (+1 more)

### Community 72 - "Community 72"
Cohesion: 0.22
Nodes (10): payroll_adjustments, Maosh oqimi: DRAFT, APPROVED, PAID, payroll_items, payroll_payouts, payroll_periods, payroll_rules, O'quv ruxsatlari (group, attendance, homework, rating), Rol ADMIN (+2 more)

### Community 73 - "Community 73"
Cohesion: 0.31
Nodes (7): id(), CreatePaymentInput, createPaymentSchema, ListPaymentsQuery, listPaymentsSchema, note, reversePaymentSchema

### Community 74 - "Community 74"
Cohesion: 0.31
Nodes (7): id(), CreateCourseInput, createCourseSchema, listCoursesSchema, price, UpdateCourseInput, updateCourseSchema

### Community 75 - "Community 75"
Cohesion: 0.29
Nodes (6): AssignmentRow, homeworkPoints(), SubmissionRow, assignments, ratingPoints, submissions

### Community 76 - "Community 76"
Cohesion: 0.29
Nodes (6): env, node, rules, typescript/no-explicit-any, typescript/no-floating-promises, $schema

### Community 77 - "Community 77"
Cohesion: 0.29
Nodes (3): @nestjs/core@^12.0.1, envFile, @nestjs/core

### Community 78 - "Community 78"
Cohesion: 0.29
Nodes (6): compilerOptions, rootDir, exclude, extends, include, ./tsconfig.json

### Community 79 - "Community 79"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 80 - "Community 80"
Cohesion: 0.53
Nodes (3): roleParamSchema, setRolePermissionsSchema, setUserPermissionsSchema

### Community 81 - "Community 81"
Cohesion: 0.40
Nodes (4): allowBuilds, sharp, unrs-resolver, packages

### Community 83 - "Community 83"
Cohesion: 0.67
Nodes (4): Environment constraint: Docker/WSL unavailable, PGlite in-memory Postgres testing, Roadmap: deploy and operations, Roadmap: test on real Postgres

## Knowledge Gaps
- **53 isolated node(s):** `./tsconfig.json`, `Qaror ERD dan chetga chiqsa avval hujjatni yangila`, `Kod grafi graphify-out`, `Til qoidasi: o'zbekcha suhbat, inglizcha kod`, `Pul: bigint (so'm)` (+48 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 502 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthUser` connect `REJA.md (#18)` to `Community 0`, `Community 1`, `branchScope() (#2)`, `Community 4`, `inScope() (#5)`, `StudentsService (#6)`, `Community 7`, `CoursesService (#8)`, `Community 9`, `students.service.ts (#13)`, `Community 14`, `enrollments table (#15)`, `ERD-VA-RUXSATLAR.md (ERD va ruxsatlar) (#16)`, `CLAUDE.md (loyiha ko'rsatmalari) (#17)`, `Community 20`, `Community 21`, `compilerOptions (#23)`, `Community 25`, `compilerOptions (#26)`, `scripts (#27)`, `db (#28)`, `centers table (tenant) (#30)`, `scripts (#31)`, `Community 34`, `Community 39`, `compilerOptions (#42)`, `Community 43`, `Community 47`, `.oxlintrc.json (#48)`, `Community 49`, `Community 67`, `Community 68`, `Community 69`, `Community 70`, `Community 73`, `Community 74`, `Community 75`, `Community 80`?**
  _High betweenness centrality (0.234) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `Qaror ERD dan chetga chiqsa avval hujjatni yangila`, `Kod grafi graphify-out` to the rest of the system?**
  _53 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0528169014084507 - nodes in this community are weakly interconnected._
- **Why does `@nestjs/common` connect `Community 3` to `branchScope() (#2)`, `Community 4`, `StudentsService (#6)`, `Community 9`, `web/package.json (#10)`, `Community 19`, `Community 21`, `Community 25`, `compilerOptions (#26)`, `centers table (tenant) (#30)`, `dependencies (#33)`, `Community 34`, `Community 35`, `Community 43`, `payments table (#46)`, `tsconfig.build.json (#52)`, `nest-cli.json (#54)`, `Community 55`, `allowBuilds (#56)`, `vitest (#57)`, `Environment limitation: Docker/WSL unava (#60)`, `Community 61`, `Community 62`, `Community 63`, `Community 68`, `Community 70`, `Community 71`, `Community 73`, `Community 74`, `Community 75`, `Community 80`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07474747474747474 - nodes in this community are weakly interconnected._
- **Why does `CLAUDE.md (loyiha ko'rsatmalari)` connect `Community 24` to `Community 32`, `Community 50`, `Community 51`, `Community 58`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Should `branchScope() (#2)` be split into smaller, more focused modules?**
  _Cohesion score 0.08176100628930817 - nodes in this community are weakly interconnected._