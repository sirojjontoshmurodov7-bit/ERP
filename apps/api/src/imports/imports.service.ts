import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, isNull, sql } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { hashPassword } from '../auth/password.js';
import { PermissionsService } from '../auth/permissions.service.js';
import { generateTempPassword } from '../auth/temp-password.js';
import { BillingService } from '../billing/billing.service.js';
import { type BranchScope, branchScope, inScope } from '../common/branch-scope.js';
import { todayLocal } from '../common/dates.js';
import { slugify } from '../common/slug.js';
import { readSpreadsheet, type SheetRow, SpreadsheetError } from '../common/spreadsheet.js';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { branches, centers, enrollments, groups, importJobs, plans, studentProfiles, userBranches, users } from '../db/schema.js';
import type { ListImportsQuery, RunImportInput, UploadedFile } from './imports.schemas.js';
import { mapHeader, MAX_IMPORT_ROWS, type ParsedStudent, parseRow, phoneKey, type RowError } from './student-import.js';

const forbidden = (message = "Bu amal uchun ruxsat yo'q") => new ForbiddenException({ code: 'FORBIDDEN', message });
const bad = (code: string, message: string) => new BadRequestException({ code, message });
const MAX_REPORTED_ERRORS = 200;
const HASH_PARALLEL = 8;

export const TEMPLATE_CSV = `﻿Ism;Telefon;Tug'ilgan sana;Ota-ona ismi;Ota-ona telefoni;Izoh;Filial;Guruh;Qo'shilgan sana\r\nAli Valiyev;+998 90 123-45-67;17.05.2012;Vali Valiyev;+998 91 765-43-21;Izoh (ixtiyoriy);Asosiy filial;IELTS 1;01.09.2026\r\n`;

type JobRow = typeof importJobs.$inferSelect;
const jobView = (j: JobRow) => ({
  id: j.id,
  type: j.type,
  fileName: j.fileName,
  status: j.status,
  totalRows: j.totalRows,
  createdRows: j.createdRows,
  errorRows: j.errorRows,
  skipInvalid: j.skipInvalid,
  createdBy: j.createdBy,
  createdAt: j.createdAt,
});

const safeName = (n: string): string => (n.split(/[\\/]/).pop() ?? 'fayl').split('').filter((ch) => ch.charCodeAt(0) >= 32).join('').slice(0, 120) || 'fayl';

/**
 * Excel/CSV import (`import.run`: rahbar, admin ○ o'z filialida). Hozir faqat o'quvchilar (+ ixtiyoriy guruhga yozish).
 * Fayl saqlanmaydi (shaxsiy ma'lumot); tarixga faqat natija hisoboti (qator raqami, maydon, xato kodi: qiymatlarsiz) yoziladi.
 * Sukut: bitta xato bo'lsa hech narsa yaratilmaydi; `skipInvalid` bilan to'g'ri qatorlar yaratiladi. Vaqtinchalik parollar faqat javobda.
 */
@Injectable()
export class ImportsService {
  constructor(
    private readonly db: DbService,
    private readonly perms: PermissionsService,
    private readonly billing: BillingService,
  ) {}

  private ctx(actor: AuthUser) {
    return contextOf(actor.centerId, actor.role);
  }

  private mayImport(actor: AuthUser) {
    return this.db.withContext(this.ctx(actor), (tx) => this.perms.hasIn(tx, actor, 'import.run'));
  }

  async template(actor: AuthUser): Promise<string> {
    if (!(await this.mayImport(actor))) throw forbidden();
    return TEMPLATE_CSV;
  }

  async run(actor: AuthUser, file: UploadedFile | undefined, input: RunImportInput, client: ClientInfo) {
    if (!(await this.mayImport(actor))) throw forbidden();
    if (!file) throw bad('FILE_REQUIRED', "Fayl yuboring (maydon nomi: file)");
    if (input.type !== 'STUDENTS') throw bad('IMPORT_TYPE_NOT_SUPPORTED', "Hozircha faqat o'quvchilar (STUDENTS) importi mavjud");

    let rows: SheetRow[];
    try {
      rows = readSpreadsheet(file.buffer, file.originalname);
    } catch (e) {
      if (e instanceof SpreadsheetError) throw bad(`IMPORT_${e.code}`, e.message);
      throw e;
    }
    const header = rows[0]!;
    const map = mapHeader(header.cells);
    if (map.columns.fullName === undefined) throw bad('IMPORT_MISSING_COLUMN', "Birinchi qatorda \"Ism\" ustuni topilmadi");
    const dataRows = rows.slice(1);
    if (!dataRows.length) throw bad('IMPORT_EMPTY', "Sarlavhadan keyin ma'lumot qatorlari yo'q");
    if (dataRows.length > MAX_IMPORT_ROWS) throw bad('IMPORT_TOO_MANY_ROWS', `Bir importda eng ko'pi ${MAX_IMPORT_ROWS} qator; faylni bo'ling`);
    const fileName = safeName(file.originalname);

    return this.db.withContext(this.ctx(actor), async (tx) => {
      const scope = await branchScope(tx, actor);
      const activeBranches = await tx.select({ id: branches.id, name: branches.name }).from(branches).where(isNull(branches.archivedAt));
      const branchByName = new Map(activeBranches.map((b) => [b.name.trim().toLowerCase(), b.id]));
      const defaultBranch = await this.defaultBranch(tx, scope, input.branchId, map.columns.branch !== undefined, activeBranches.map((b) => b.id));

      const groupRows = await tx.select({ id: groups.id, name: groups.name, branchId: groups.branchId, status: groups.status, billingMode: groups.billingMode }).from(groups).where(isNull(groups.archivedAt));
      const phones = new Set((await tx.select({ phone: users.phone }).from(users).where(and(eq(users.role, 'STUDENT'), sql`${users.phone} is not null`))).map((u) => phoneKey(u.phone!)));

      const errors: RowError[] = [];
      const valid: (ParsedStudent & { branchId: string; group?: (typeof groupRows)[number] })[] = [];
      const seenPhones = new Set<string>();
      for (const r of dataRows) {
        const parsed = parseRow(r.row, r.cells, map);
        if (!parsed.value) {
          errors.push(...parsed.errors);
          continue;
        }
        const v = parsed.value;
        const rowErrors: RowError[] = [];
        const err = (field: RowError['field'], code: string, message: string) => rowErrors.push({ row: v.row, field, code, message });

        let branchId = defaultBranch;
        if (v.branchName) {
          branchId = branchByName.get(v.branchName.toLowerCase()) ?? null;
          if (!branchId) err('branch', 'UNKNOWN_BRANCH', 'Bunday filial yo\'q');
          else if (!inScope(scope, branchId)) err('branch', 'BRANCH_OUT_OF_SCOPE', "Bu filialga o'quvchi qo'shish huquqingiz yo'q");
        } else if (!branchId) err('branch', 'BRANCH_REQUIRED', 'Filial ko\'rsatilmagan');

        let group: (typeof groupRows)[number] | undefined;
        if (v.groupName && branchId) {
          group = groupRows.find((g) => g.branchId === branchId && g.name.trim().toLowerCase() === v.groupName!.toLowerCase());
          if (!group) err('group', 'UNKNOWN_GROUP', 'Bu filialda bunday guruh yo\'q');
          else if (group.status === 'FINISHED') err('group', 'GROUP_FINISHED', 'Guruh tugagan');
        }
        if (v.phone) {
          const k = phoneKey(v.phone);
          if (phones.has(k)) err('phone', 'DUPLICATE_PHONE', "Bunday telefonli o'quvchi allaqachon bor");
          else if (seenPhones.has(k)) err('phone', 'DUPLICATE_IN_FILE', 'Bu telefon faylda takrorlangan');
          seenPhones.add(k);
        }
        if (rowErrors.length) errors.push(...rowErrors);
        else valid.push({ ...v, branchId: branchId!, group });
      }

      const errorRows = new Set(errors.map((e) => e.row)).size;
      const reported = errors.slice(0, MAX_REPORTED_ERRORS);
      const base = { fileName, totalRows: dataRows.length, ignoredColumns: map.unknown, errors: reported, errorsTruncated: errors.length > reported.length };

      if (input.dryRun) return { dryRun: true as const, job: null, ...base, validRows: valid.length, errorRows, created: [] };

      const toCreate = errors.length && !input.skipInvalid ? [] : valid;
      if (toCreate.length) await this.assertWithinPlanLimit(tx, actor.centerId!, toCreate.length);
      const created = toCreate.length ? await this.create(tx, actor, toCreate, client) : [];

      const status = created.length ? 'DONE' : 'REJECTED';
      const [job] = await tx
        .insert(importJobs)
        .values({
          centerId: actor.centerId!,
          type: 'STUDENTS',
          fileName,
          status,
          totalRows: dataRows.length,
          createdRows: created.length,
          errorRows,
          skipInvalid: input.skipInvalid,
          report: { errors: reported, truncated: errors.length > reported.length, ignoredColumns: map.unknown },
          createdBy: actor.id,
        })
        .returning();
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'import.students', entity: 'import', entityId: job!.id, after: { status, totalRows: dataRows.length, created: created.length, errorRows, skipInvalid: input.skipInvalid }, ip: client.ip });
      return { dryRun: false as const, job: jobView(job!), ...base, validRows: valid.length, errorRows, created };
    });
  }

  list(actor: AuthUser, q: ListImportsQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'import.run'))) throw forbidden();
      const rows = await tx.select().from(importJobs).where(actor.role === 'OWNER' ? undefined : eq(importJobs.createdBy, actor.id)).orderBy(desc(importJobs.createdAt), desc(importJobs.id)).limit(q.limit).offset(q.offset);
      return { items: rows.map(jobView), limit: q.limit, offset: q.offset };
    });
  }

  get(actor: AuthUser, id: string) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'import.run'))) throw forbidden();
      const [j] = await tx.select().from(importJobs).where(and(eq(importJobs.id, id), actor.role === 'OWNER' ? undefined : eq(importJobs.createdBy, actor.id)));
      if (!j) throw new NotFoundException({ code: 'IMPORT_NOT_FOUND', message: 'Import topilmadi' });
      return { ...jobView(j), report: j.report };
    });
  }

  // --------------------------------------------------------------- yordamchilar

  /** Sukut filial: berilgan (tekshiriladi) yoki qamrovdagi yagona faol filial; "Filial" ustuni bor bo'lsa majburiy emas. */
  private async defaultBranch(tx: Tx, scope: BranchScope, requested: string | undefined, hasColumn: boolean, activeIds: string[]): Promise<string | null> {
    if (requested) {
      if (!activeIds.includes(requested)) throw new NotFoundException({ code: 'BRANCH_NOT_FOUND', message: 'Filial topilmadi' });
      if (!inScope(scope, requested)) throw forbidden("Bu filialga o'quvchi qo'shish huquqingiz yo'q");
      return requested;
    }
    const cands = scope.all ? activeIds : activeIds.filter((b) => scope.branchIds.includes(b));
    if (cands.length === 1) return cands[0]!;
    if (hasColumn) return null; // har qator o'z filialini ko'rsatishi kerak
    throw bad('BRANCH_REQUIRED', "Filialni (branchId) ko'rsating yoki faylga \"Filial\" ustunini qo'shing");
  }

  private async assertWithinPlanLimit(tx: Tx, centerId: string, adding: number) {
    const [row] = await tx.select({ max: plans.maxStudents }).from(centers).leftJoin(plans, eq(plans.id, centers.planId)).where(eq(centers.id, centerId));
    const max = row?.max;
    if (max === null || max === undefined) return;
    const [{ active } = { active: 0 }] = await tx.select({ active: count() }).from(users).where(and(eq(users.role, 'STUDENT'), eq(users.status, 'ACTIVE')));
    if (Number(active) + adding > max) {
      throw new ForbiddenException({ code: 'PLAN_STUDENT_LIMIT', message: `Tarifingizda ${max} tagacha faol o'quvchi mumkin (hozir ${Number(active)}, import ${adding} ta qo'shadi)` });
    }
  }

  /** Hamma yozuv chaqiruvchi tranzaksiyasida: xato bo'lsa hech narsa qolmaydi. */
  private async create(tx: Tx, actor: AuthUser, items: (ParsedStudent & { branchId: string; group?: { id: string; branchId: string; billingMode: string } })[], client: ClientInfo) {
    const centerId = actor.centerId!;
    const [center] = await tx.select({ slug: centers.slug }).from(centers).where(eq(centers.id, centerId));
    const taken = new Set((await tx.select({ login: users.login }).from(users).where(sql`lower(${users.login}) like ${center!.slug.toLowerCase() + '.%'}`)).map((u) => u.login.toLowerCase()));
    const loginFor = (fullName: string): string => {
      const base = `${center!.slug}.${slugify(fullName.split(/\s+/)[0] ?? '', 20) || 'oquvchi'}`;
      for (let n = 1; ; n++) {
        const candidate = `${base}${n > 1 ? n : ''}`;
        if (!taken.has(candidate.toLowerCase())) {
          taken.add(candidate.toLowerCase());
          return candidate;
        }
      }
    };

    const prepared = items.map((it) => ({ it, login: loginFor(it.fullName), password: generateTempPassword() }));
    const hashes: string[] = [];
    for (let i = 0; i < prepared.length; i += HASH_PARALLEL) {
      hashes.push(...(await Promise.all(prepared.slice(i, i + HASH_PARALLEL).map((p) => hashPassword(p.password)))));
    }

    const created: { row: number; studentId: string; fullName: string; login: string; temporaryPassword: string; branchId: string; groupId: string | null; enrollmentId: string | null }[] = [];
    const enrollmentIds: string[] = [];
    for (let i = 0; i < prepared.length; i++) {
      const { it, login, password } = prepared[i]!;
      const [u] = await tx
        .insert(users)
        .values({ centerId, role: 'STUDENT', login, passwordHash: hashes[i]!, mustChangePassword: true, fullName: it.fullName, phone: it.phone, createdBy: actor.id })
        .returning({ id: users.id });
      await tx.insert(userBranches).values({ userId: u!.id, branchId: it.branchId, centerId });
      await tx.insert(studentProfiles).values({ userId: u!.id, centerId, birthDate: it.birthDate, parentName: it.parentName, parentPhone: it.parentPhone, note: it.note });
      await writeAudit(tx, { centerId, actorId: actor.id, action: 'student.create', entity: 'student', entityId: u!.id, after: { login, fullName: it.fullName, branchId: it.branchId, source: 'import' }, ip: client.ip }); // parolsiz

      let enrollmentId: string | null = null;
      if (it.group) {
        const joinedAt = it.joinedAt ?? todayLocal();
        const [e] = await tx
          .insert(enrollments)
          .values({ centerId, groupId: it.group.id, studentId: u!.id, joinedAt, billingAnchor: it.group.billingMode === 'STUDENT_CYCLE' ? joinedAt : null, createdBy: actor.id })
          .returning({ id: enrollments.id });
        enrollmentId = e!.id;
        enrollmentIds.push(e!.id);
        await writeAudit(tx, { centerId, actorId: actor.id, action: 'enrollment.create', entity: 'enrollment', entityId: e!.id, after: { groupId: it.group.id, studentId: u!.id, joinedAt, source: 'import' }, ip: client.ip });
      }
      created.push({ row: it.row, studentId: u!.id, fullName: it.fullName, login, temporaryPassword: password, branchId: it.branchId, groupId: it.group?.id ?? null, enrollmentId });
    }
    if (enrollmentIds.length) await this.billing.generate(tx, centerId, { enrollmentIds }); // birinchi davr hisoblari
    return created;
  }
}
