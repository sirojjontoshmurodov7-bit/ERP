import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, desc, eq, inArray, isNull, sql, type SQL } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { PermissionsService } from '../auth/permissions.service.js';
import { branchFilter, branchScope, type BranchScope } from '../common/branch-scope.js';
import { studentGroupIds, teacherGroupIds } from '../common/group-access.js';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { assignments, enrollments, groups, ratingPoints, submissions, users } from '../db/schema.js';
import type { CreateAssignmentInput, GradeInput, ListAssignmentsQuery, SubmitInput, UpdateAssignmentInput } from './academic.schemas.js';

const forbidden = (message = "Bu amal uchun ruxsat yo'q") => new ForbiddenException({ code: 'FORBIDDEN', message });
const notFound = () => new NotFoundException({ code: 'ASSIGNMENT_NOT_FOUND', message: 'Vazifa topilmadi' });
const conflict = (code: string, message: string) => new ConflictException({ code, message });

type AssignmentRow = typeof assignments.$inferSelect;
type SubmissionRow = typeof submissions.$inferSelect;

/** Vazifa bahosi reyting balliga: 10 ballik shkala (maksimal baho = 10 ball), yaxlitlanadi. */
export const homeworkPoints = (score: number, maxScore: number): number => Math.round((10 * score) / maxScore);

const isLate = (a: Pick<AssignmentRow, 'dueAt'>, s: Pick<SubmissionRow, 'submittedAt'>): boolean => !!a.dueAt && s.submittedAt.getTime() > a.dueAt.getTime();

/**
 * Vazifa: yaratish/tahrirlash/baholash faqat ustozda (`homework.create|grade`, o'z amaldagi guruhi), topshirish o'quvchida
 * (`homework.submit`, faol yozilish), ko'rish `homework.view` (rahbar, admin filial, ustoz o'z guruhi, o'quvchi o'z guruhi).
 * Baho reytingga voqea sifatida yoziladi (qayta baholashda faqat farq).
 */
@Injectable()
export class AssignmentsService {
  constructor(
    private readonly db: DbService,
    private readonly perms: PermissionsService,
  ) {}

  private ctx(actor: AuthUser) {
    return contextOf(actor.centerId, actor.role);
  }

  // ------------------------------------------------------------------ yaratish va tahrirlash

  create(actor: AuthUser, groupId: string, input: CreateAssignmentInput, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'homework.create'))) throw forbidden();
      await this.teacherGroup(tx, actor, groupId);
      const [a] = await tx
        .insert(assignments)
        .values({
          centerId: actor.centerId!,
          groupId,
          teacherId: actor.id,
          title: input.title,
          description: input.description ?? null,
          attachments: input.attachments ?? [],
          dueAt: input.dueAt ? new Date(input.dueAt) : null,
          maxScore: input.maxScore ?? 100,
        })
        .returning();
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'assignment.create', entity: 'assignment', entityId: a!.id, after: { groupId, title: a!.title, maxScore: a!.maxScore, dueAt: a!.dueAt }, ip: client.ip });
      return this.detail(tx, actor, a!);
    });
  }

  update(actor: AuthUser, id: string, input: UpdateAssignmentInput, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'homework.create'))) throw forbidden();
      const before = await this.load(tx, actor, id);
      await this.teacherGroup(tx, actor, before.groupId);
      if (before.archivedAt) throw conflict('ASSIGNMENT_ARCHIVED', 'Vazifa arxivlangan');
      if (input.maxScore !== undefined && input.maxScore !== before.maxScore) {
        const [{ graded } = { graded: 0 }] = await tx.select({ graded: count() }).from(submissions).where(and(eq(submissions.assignmentId, id), sql`${submissions.score} is not null`));
        if (Number(graded) > 0) throw conflict('HAS_GRADES', "Baholangan topshiriq bor: maksimal ballni o'zgartirib bo'lmaydi");
      }
      const set: Partial<typeof assignments.$inferInsert> = { updatedAt: new Date() };
      if (input.title !== undefined) set.title = input.title;
      if (input.description !== undefined) set.description = input.description;
      if (input.attachments !== undefined) set.attachments = input.attachments;
      if (input.dueAt !== undefined) set.dueAt = input.dueAt ? new Date(input.dueAt) : null;
      if (input.maxScore !== undefined) set.maxScore = input.maxScore;
      const [after] = await tx.update(assignments).set(set).where(eq(assignments.id, id)).returning();
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'assignment.edit', entity: 'assignment', entityId: id, before: { title: before.title, dueAt: before.dueAt, maxScore: before.maxScore }, after: { title: after!.title, dueAt: after!.dueAt, maxScore: after!.maxScore }, ip: client.ip });
      return this.detail(tx, actor, after!);
    });
  }

  archive(actor: AuthUser, id: string, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'homework.create'))) throw forbidden();
      const a = await this.load(tx, actor, id);
      await this.teacherGroup(tx, actor, a.groupId);
      if (a.archivedAt) throw conflict('ALREADY_ARCHIVED', 'Vazifa allaqachon arxivlangan');
      const [after] = await tx.update(assignments).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(assignments.id, id)).returning();
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'assignment.archive', entity: 'assignment', entityId: id, ip: client.ip });
      return this.detail(tx, actor, after!);
    });
  }

  // ------------------------------------------------------------------ topshirish va baholash

  submit(actor: AuthUser, id: string, input: SubmitInput) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'homework.submit'))) throw forbidden();
      const a = await this.load(tx, actor, id);
      if (a.archivedAt) throw conflict('ASSIGNMENT_ARCHIVED', 'Vazifa arxivlangan');
      const [e] = await tx.select({ status: enrollments.status }).from(enrollments).where(and(eq(enrollments.groupId, a.groupId), eq(enrollments.studentId, actor.id), sql`${enrollments.status} <> 'LEFT'`));
      if (e?.status !== 'ACTIVE') throw conflict('ENROLLMENT_NOT_ACTIVE', "Muzlatilgan o'quvchi vazifa topshira olmaydi");
      const [existing] = await tx.select().from(submissions).where(and(eq(submissions.assignmentId, id), eq(submissions.studentId, actor.id)));
      if (existing?.gradedAt) throw conflict('ALREADY_GRADED', "Baholangan topshiriqni o'zgartirib bo'lmaydi");
      const now = new Date();
      const values = { text: input.text ?? null, files: input.files ?? [], submittedAt: now };
      const [s] = existing
        ? await tx.update(submissions).set(values).where(eq(submissions.id, existing.id)).returning()
        : await tx.insert(submissions).values({ centerId: actor.centerId!, assignmentId: id, studentId: actor.id, ...values }).returning();
      return this.submissionView(s!, a);
    });
  }

  grade(actor: AuthUser, id: string, studentId: string, input: GradeInput, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'homework.grade'))) throw forbidden();
      const a = await this.load(tx, actor, id);
      const group = await this.teacherGroup(tx, actor, a.groupId);
      if (input.score > a.maxScore) throw new ConflictException({ code: 'SCORE_EXCEEDS_MAX', message: `Baho ${a.maxScore} dan oshmasligi kerak` });
      const [before] = await tx.select().from(submissions).where(and(eq(submissions.assignmentId, id), eq(submissions.studentId, studentId)));
      if (!before) throw new NotFoundException({ code: 'SUBMISSION_NOT_FOUND', message: 'Topshiriq topilmadi' });
      const now = new Date();
      const [after] = await tx.update(submissions).set({ score: input.score, feedback: input.feedback ?? null, gradedBy: actor.id, gradedAt: now }).where(eq(submissions.id, before.id)).returning();

      // Reyting: bu topshiriq uchun berilgan ball yig'indisi bilan yangi ball farqi yoziladi (voqealar o'zgarmaydi)
      const target = homeworkPoints(input.score, a.maxScore);
      const [{ given } = { given: '0' }] = await tx.select({ given: sql<string>`coalesce(sum(${ratingPoints.points}), 0)` }).from(ratingPoints).where(and(eq(ratingPoints.sourceId, before.id), eq(ratingPoints.source, 'HOMEWORK')));
      const delta = target - Number(given);
      if (delta !== 0) {
        await tx.insert(ratingPoints).values({ centerId: actor.centerId!, branchId: group.branchId, groupId: a.groupId, studentId, source: 'HOMEWORK', sourceId: before.id, points: delta, createdBy: actor.id });
      }
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'homework.grade', entity: 'submission', entityId: before.id, before: { score: before.score }, after: { score: after!.score, points: target, delta }, ip: client.ip });
      return this.submissionView(after!, a);
    });
  }

  // ------------------------------------------------------------------ ko'rish

  list(actor: AuthUser, q: ListAssignmentsQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'homework.view'))) throw forbidden();
      const scope = await branchScope(tx, actor);
      const now = new Date();
      const conds: (SQL | undefined)[] = [
        this.visible(tx, actor, scope),
        q.includeArchived && actor.role !== 'STUDENT' ? undefined : isNull(assignments.archivedAt),
        q.groupId ? eq(assignments.groupId, q.groupId) : undefined,
        q.status === 'open' ? sql`(${assignments.dueAt} is null or ${assignments.dueAt} > ${now})` : undefined,
        q.status === 'overdue' ? sql`${assignments.dueAt} < ${now}` : undefined,
      ];
      const rows = await tx.select().from(assignments).where(and(...conds)).orderBy(desc(assignments.createdAt), desc(assignments.id)).limit(q.limit).offset(q.offset);
      return { items: await this.present(tx, actor, rows), limit: q.limit, offset: q.offset };
    });
  }

  get(actor: AuthUser, id: string) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'homework.view'))) throw forbidden();
      return this.detail(tx, actor, await this.load(tx, actor, id));
    });
  }

  // ------------------------------------------------------------------ yordamchilar

  /** Qamrov: ustoz o'z guruhlari, o'quvchi yozilgan guruhlari, qolganlar filial bo'yicha (rahbar hammasi). */
  private visible(tx: Tx, actor: AuthUser, scope: BranchScope): SQL {
    if (actor.role === 'TEACHER') return inArray(assignments.groupId, teacherGroupIds(tx, actor.id));
    if (actor.role === 'STUDENT') return inArray(assignments.groupId, studentGroupIds(tx, actor.id));
    return inArray(assignments.groupId, tx.select({ id: groups.id }).from(groups).where(branchFilter(groups.branchId, scope)));
  }

  private async load(tx: Tx, actor: AuthUser, id: string): Promise<AssignmentRow> {
    const scope = await branchScope(tx, actor);
    const [a] = await tx.select().from(assignments).where(and(eq(assignments.id, id), this.visible(tx, actor, scope)));
    if (!a || (a.archivedAt && actor.role === 'STUDENT')) throw notFound();
    return a;
  }

  /** Guruh ustozning amaldagi guruhi bo'lishi shart (aks holda 404: mavjudligi sezilmasin). */
  private async teacherGroup(tx: Tx, actor: AuthUser, groupId: string) {
    const [g] = await tx.select().from(groups).where(and(eq(groups.id, groupId), inArray(groups.id, teacherGroupIds(tx, actor.id))));
    if (!g) throw new NotFoundException({ code: 'GROUP_NOT_FOUND', message: 'Guruh topilmadi' });
    if (g.archivedAt) throw conflict('GROUP_ARCHIVED', 'Guruh arxivlangan');
    return g;
  }

  private submissionView(s: SubmissionRow, a: AssignmentRow) {
    return {
      id: s.id,
      assignmentId: s.assignmentId,
      studentId: s.studentId,
      text: s.text,
      files: s.files,
      submittedAt: s.submittedAt,
      late: isLate(a, s),
      score: s.score,
      maxScore: a.maxScore,
      feedback: s.feedback,
      gradedAt: s.gradedAt,
    };
  }

  private async present(tx: Tx, actor: AuthUser, rows: AssignmentRow[]) {
    if (!rows.length) return [];
    const ids = rows.map((a) => a.id);
    const gs = await tx.select({ id: groups.id, name: groups.name }).from(groups).where(inArray(groups.id, [...new Set(rows.map((a) => a.groupId))]));
    const ts = await tx.select({ id: users.id, fullName: users.fullName }).from(users).where(inArray(users.id, [...new Set(rows.map((a) => a.teacherId))]));
    const subs = await tx.select().from(submissions).where(inArray(submissions.assignmentId, ids));
    const enrolled = new Map<string, number>();
    if (actor.role !== 'STUDENT') {
      for (const r of await tx.select({ groupId: enrollments.groupId, n: count() }).from(enrollments).where(and(inArray(enrollments.groupId, [...new Set(rows.map((a) => a.groupId))]), eq(enrollments.status, 'ACTIVE'))).groupBy(enrollments.groupId)) enrolled.set(r.groupId, Number(r.n));
    }
    return rows.map((a) => {
      const mine = subs.filter((s) => s.assignmentId === a.id);
      const base = {
        id: a.id,
        groupId: a.groupId,
        groupName: gs.find((g) => g.id === a.groupId)?.name ?? null,
        teacherId: a.teacherId,
        teacherName: ts.find((t) => t.id === a.teacherId)?.fullName ?? null,
        title: a.title,
        description: a.description,
        attachments: a.attachments,
        dueAt: a.dueAt,
        maxScore: a.maxScore,
        archivedAt: a.archivedAt,
        createdAt: a.createdAt,
      };
      if (actor.role === 'STUDENT') {
        const s = mine.find((x) => x.studentId === actor.id);
        return { ...base, mySubmission: s ? { submittedAt: s.submittedAt, late: isLate(a, s), score: s.score, graded: s.gradedAt !== null } : null };
      }
      return { ...base, counts: { students: enrolled.get(a.groupId) ?? 0, submitted: mine.length, graded: mine.filter((s) => s.gradedAt).length } };
    });
  }

  /** Vazifa tafsiloti: xodimga hamma topshiriqlar, o'quvchiga faqat o'zining topshirig'i (matn, havola, baho, izoh). */
  private async detail(tx: Tx, actor: AuthUser, a: AssignmentRow) {
    const [base] = await this.present(tx, actor, [a]);
    if (actor.role === 'STUDENT') {
      const [s] = await tx.select().from(submissions).where(and(eq(submissions.assignmentId, a.id), eq(submissions.studentId, actor.id)));
      return { ...base!, submission: s ? this.submissionView(s, a) : null };
    }
    const subs = await tx.select().from(submissions).where(eq(submissions.assignmentId, a.id)).orderBy(asc(submissions.submittedAt), asc(submissions.id));
    const names = subs.length ? await tx.select({ id: users.id, fullName: users.fullName }).from(users).where(inArray(users.id, subs.map((s) => s.studentId))) : [];
    return { ...base!, submissions: subs.map((s) => ({ ...this.submissionView(s, a), studentName: names.find((n) => n.id === s.studentId)?.fullName ?? null })) };
  }
}
