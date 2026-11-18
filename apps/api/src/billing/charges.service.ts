import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, gte, inArray, lte, sql, type SQL } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { PermissionsService } from '../auth/permissions.service.js';
import { type BranchScope, branchFilter, branchScope, inScope } from '../common/branch-scope.js';
import { todayLocal } from '../common/dates.js';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { branches, charges, enrollments, groups, paymentAllocations, users } from '../db/schema.js';
import { AllocatorService } from './allocator.js';
import { BillingService } from './billing.service.js';
import type { CreateManualChargeInput, ListChargesQuery } from './charges.schemas.js';

const forbidden = (message = "Bu amal uchun ruxsat yo'q") => new ForbiddenException({ code: 'FORBIDDEN', message });
const chargeNotFound = () => new NotFoundException({ code: 'CHARGE_NOT_FOUND', message: 'Hisob topilmadi' });

type ChargeRow = typeof charges.$inferSelect;
const audited = (c: ChargeRow) => ({
  enrollmentId: c.enrollmentId,
  periodStart: c.periodStart,
  dueDate: c.dueDate,
  baseAmount: c.baseAmount,
  discountAmount: c.discountAmount,
  amount: c.amount,
  status: c.status,
  kind: c.kind,
});

/**
 * Hisob-kitoblar (charges): ko'rish `payment.view` (rahbar, admin ○ f, kassir f, o'quvchi o'zinikini), qo'lda tuzatish `charge.adjust` (rahbar).
 * O'qishdan oldin markaz uchun yetishmayotgan charge'lar yaratiladi (cron yo'q: bepul hostingda fon jarayoniga tayanmaymiz).
 */
@Injectable()
export class ChargesService {
  constructor(
    private readonly db: DbService,
    private readonly perms: PermissionsService,
    private readonly billing: BillingService,
    private readonly allocator: AllocatorService,
  ) {}

  private ctx(actor: AuthUser) {
    return contextOf(actor.centerId, actor.role);
  }

  /** Markaz bo'yicha hisob-kitobni hozirgacha to'ldiradi (`debtors.view`); audit: `billing.generate`. */
  async generate(actor: AuthUser, asOf: string | undefined, client: ClientInfo) {
    const date = asOf ?? todayLocal();
    if (date > todayLocal()) throw new BadRequestException({ code: 'DATE_IN_FUTURE', message: "Kelajak sanasi uchun hisob-kitob yaratib bo'lmaydi" });
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'debtors.view'))) throw forbidden();
      const created = await this.billing.generate(tx, actor.centerId!, { asOf: date });
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'billing.generate', entity: 'billing', after: { asOf: date, created }, ip: client.ip });
      return { asOf: date, created };
    });
  }

  list(actor: AuthUser, q: ListChargesQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'payment.view'))) throw forbidden();
      const scope = await branchScope(tx, actor);
      const empty = { items: [], limit: q.limit, offset: q.offset };
      if (q.branchId && actor.role !== 'STUDENT' && !inScope(scope, q.branchId)) return empty;
      await this.billing.generate(tx, actor.centerId!);

      const conds: (SQL | undefined)[] = [
        this.visibility(tx, actor, scope),
        q.studentId ? eq(charges.studentId, q.studentId) : undefined,
        q.groupId ? eq(charges.groupId, q.groupId) : undefined,
        q.enrollmentId ? eq(charges.enrollmentId, q.enrollmentId) : undefined,
        q.status ? eq(charges.status, q.status) : undefined,
        q.kind ? eq(charges.kind, q.kind) : undefined,
        q.dueFrom ? gte(charges.dueDate, q.dueFrom) : undefined,
        q.dueTo ? lte(charges.dueDate, q.dueTo) : undefined,
        q.branchId ? inArray(charges.groupId, tx.select({ id: groups.id }).from(groups).where(eq(groups.branchId, q.branchId))) : undefined,
      ];
      const rows = await tx
        .select()
        .from(charges)
        .where(and(...conds))
        .orderBy(desc(charges.dueDate), desc(charges.createdAt), desc(charges.id))
        .limit(q.limit)
        .offset(q.offset);
      return { items: await this.present(tx, rows), limit: q.limit, offset: q.offset };
    });
  }

  get(actor: AuthUser, id: string) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'payment.view'))) throw forbidden();
      await this.billing.generate(tx, actor.centerId!);
      return (await this.present(tx, [await this.load(tx, actor, id)]))[0]!;
    });
  }

  /** Qo'lda hisob (MANUAL): sabab majburiy; faqat rahbar (`charge.adjust`). */
  async createManual(actor: AuthUser, input: CreateManualChargeInput, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'charge.adjust'))) throw forbidden();
      const [e] = await tx.select().from(enrollments).where(eq(enrollments.id, input.enrollmentId));
      if (!e) throw new NotFoundException({ code: 'ENROLLMENT_NOT_FOUND', message: 'Yozilish topilmadi' });
      const due = input.dueDate ?? todayLocal();
      const [c] = await tx
        .insert(charges)
        .values({
          centerId: actor.centerId!,
          enrollmentId: e.id,
          studentId: e.studentId,
          groupId: e.groupId,
          periodStart: due,
          periodEnd: due,
          dueDate: due,
          baseAmount: input.amount,
          discountAmount: 0,
          amount: input.amount,
          status: 'OPEN',
          kind: 'MANUAL',
          note: input.note,
          createdBy: actor.id,
        })
        .returning();
      await this.allocator.allocate(tx, actor.centerId!, e.studentId); // avans bo'lsa yangi hisobga o'tadi
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'charge.create_manual', entity: 'charge', entityId: c!.id, after: { ...audited(c!), note: input.note }, ip: client.ip });
      const [fresh] = await tx.select().from(charges).where(eq(charges.id, c!.id));
      return (await this.present(tx, [fresh!]))[0]!;
    });
  }

  /**
   * Bekor qilish (`charge.adjust`): qator o'chirilmaydi va avtomatik hisob qayta yaratilmaydi.
   * To'langan (PARTIAL/PAID) hisobda unga taqsimlangan pul manfiy taqsimot bilan qaytariladi va avans bo'ladi
   * (so'ng o'quvchining boshqa ochiq hisoblariga avtomatik taqsimlanadi).
   */
  async cancel(actor: AuthUser, id: string, reason: string, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'charge.adjust'))) throw forbidden();
      const [found] = await tx.select().from(charges).where(eq(charges.id, id));
      if (!found) throw chargeNotFound();
      await this.allocator.lockStudent(tx, found.studentId);
      const [before] = await tx.select().from(charges).where(eq(charges.id, id)); // qulfdan keyingi holat
      if (before!.status === 'CANCELLED') throw new ConflictException({ code: 'ALREADY_CANCELLED', message: 'Hisob allaqachon bekor qilingan' });

      const net = await tx
        .select({ paymentId: paymentAllocations.paymentId, amount: sql<string>`sum(${paymentAllocations.amount})` })
        .from(paymentAllocations)
        .where(eq(paymentAllocations.chargeId, id))
        .groupBy(paymentAllocations.paymentId);
      const back = net.filter((n) => Number(n.amount) > 0);
      if (back.length) await tx.insert(paymentAllocations).values(back.map((n) => ({ centerId: actor.centerId!, paymentId: n.paymentId, chargeId: id, amount: -Number(n.amount) })));
      const refunded = back.reduce((s, n) => s + Number(n.amount), 0);

      const now = new Date();
      const [after] = await tx.update(charges).set({ status: 'CANCELLED', cancelledAt: now, cancelReason: reason, updatedAt: now }).where(eq(charges.id, id)).returning();
      if (refunded > 0) await this.allocator.allocate(tx, actor.centerId!, before!.studentId);
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'charge.cancel', entity: 'charge', entityId: id, before: audited(before!), after: { ...audited(after!), reason, refunded }, ip: client.ip });
      return (await this.present(tx, [after!]))[0]!;
    });
  }

  // --------------------------------------------------------------- yordamchilar

  /** O'quvchi o'zinikini; rahbar hammasini; admin/kassir guruh filiali qamrovida. */
  private visibility(tx: Tx, actor: AuthUser, scope: BranchScope): SQL | undefined {
    if (actor.role === 'STUDENT') return eq(charges.studentId, actor.id);
    if (scope.all) return undefined;
    return inArray(charges.groupId, tx.select({ id: groups.id }).from(groups).where(branchFilter(groups.branchId, scope)));
  }

  private async load(tx: Tx, actor: AuthUser, id: string): Promise<ChargeRow> {
    const scope = await branchScope(tx, actor);
    const [c] = await tx.select().from(charges).where(and(eq(charges.id, id), this.visibility(tx, actor, scope)));
    if (!c) throw chargeNotFound();
    return c;
  }

  private async present(tx: Tx, rows: ChargeRow[]) {
    if (!rows.length) return [];
    const [students, groupRows] = await Promise.all([
      tx.select({ id: users.id, fullName: users.fullName }).from(users).where(inArray(users.id, [...new Set(rows.map((c) => c.studentId))])),
      tx
        .select({ id: groups.id, name: groups.name, branchId: groups.branchId, branchName: branches.name })
        .from(groups)
        .innerJoin(branches, eq(branches.id, groups.branchId))
        .where(inArray(groups.id, [...new Set(rows.map((c) => c.groupId))])),
    ]);
    return rows.map((c) => {
      const g = groupRows.find((x) => x.id === c.groupId);
      return {
        id: c.id,
        enrollmentId: c.enrollmentId,
        studentId: c.studentId,
        studentName: students.find((s) => s.id === c.studentId)?.fullName ?? null,
        groupId: c.groupId,
        groupName: g?.name ?? null,
        branchId: g?.branchId ?? null,
        branchName: g?.branchName ?? null,
        periodStart: c.periodStart,
        periodEnd: c.periodEnd,
        dueDate: c.dueDate,
        baseAmount: c.baseAmount,
        discountAmount: c.discountAmount,
        amount: c.amount,
        status: c.status,
        kind: c.kind,
        note: c.note,
        cancelledAt: c.cancelledAt,
        cancelReason: c.cancelReason,
        createdAt: c.createdAt,
      };
    });
  }
}
