import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, inArray, isNull, sql, type SQL } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { PermissionsService } from '../auth/permissions.service.js';
import { type BranchScope, branchFilter, branchScope, inScope } from '../common/branch-scope.js';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { branches, charges, groups, paymentAllocations, payments, userBranches, users } from '../db/schema.js';
import { AllocatorService } from './allocator.js';
import { BillingService } from './billing.service.js';
import type { CreatePaymentInput, ListPaymentsQuery } from './payments.schemas.js';

const forbidden = (message = "Bu amal uchun ruxsat yo'q") => new ForbiddenException({ code: 'FORBIDDEN', message });
const paymentNotFound = () => new NotFoundException({ code: 'PAYMENT_NOT_FOUND', message: "To'lov topilmadi" });
const studentNotFound = () => new NotFoundException({ code: 'STUDENT_NOT_FOUND', message: "O'quvchi topilmadi" });

type PaymentRow = typeof payments.$inferSelect;
const audited = (p: PaymentRow) => ({ studentId: p.studentId, branchId: p.branchId, amount: p.amount, method: p.method, status: p.status, receiptNo: p.receiptNo, reversesPaymentId: p.reversesPaymentId });

/**
 * To'lovlar: qabul qilish `payment.create`, qaytarish `payment.reverse`, ko'rish `payment.view`.
 * Qamrov: rahbar hammasi; admin/kassir to'lov filiali bo'yicha; o'quvchi faqat o'zinikini. Pul yozuvlari o'chirilmaydi (qaytarish = teskari yozuv).
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly db: DbService,
    private readonly perms: PermissionsService,
    private readonly billing: BillingService,
    private readonly allocator: AllocatorService,
  ) {}

  private ctx(actor: AuthUser) {
    return contextOf(actor.centerId, actor.role);
  }

  async create(actor: AuthUser, input: CreatePaymentInput, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'payment.create'))) throw forbidden();
      const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();
      if (paidAt.getTime() > Date.now() + 5 * 60_000) throw new BadRequestException({ code: 'DATE_IN_FUTURE', message: "To'lov sanasi kelajakda bo'lishi mumkin emas" });

      const [student] = await tx.select({ id: users.id }).from(users).where(and(eq(users.id, input.studentId), eq(users.role, 'STUDENT')));
      if (!student) throw studentNotFound();
      const scope = await branchScope(tx, actor);
      const links = (await tx.select({ branchId: userBranches.branchId }).from(userBranches).where(eq(userBranches.userId, student.id))).map((l) => l.branchId);
      if (!scope.all && !links.some((b) => inScope(scope, b))) throw studentNotFound();
      const branchId = await this.pickBranch(tx, scope, links, input.branchId);

      await this.allocator.lockStudent(tx, student.id);
      // Hisoblar yangilanadi: to'lov hozirgi qarzga taqsimlansin.
      await this.billing.generate(tx, actor.centerId!, { studentId: student.id });
      const receiptNo = await this.allocator.nextReceiptNo(tx, actor.centerId!);
      const [p] = await tx
        .insert(payments)
        .values({ centerId: actor.centerId!, branchId, studentId: student.id, amount: input.amount, method: input.method, receivedBy: actor.id, paidAt, receiptNo, note: input.note ?? null })
        .returning();
      const allocated = await this.allocator.allocate(tx, actor.centerId!, student.id);
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'payment.create', entity: 'payment', entityId: p!.id, after: { ...audited(p!), allocated }, ip: client.ip });
      return this.detail(tx, p!);
    });
  }

  async reverse(actor: AuthUser, id: string, reason: string, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'payment.reverse'))) throw forbidden();
      const before = await this.load(tx, actor, id);
      await this.allocator.lockStudent(tx, before.studentId);
      const [p] = await tx.select().from(payments).where(eq(payments.id, id)); // qulfdan keyingi holat
      if (p!.reversesPaymentId) throw new ConflictException({ code: 'NOT_REVERSIBLE', message: "Qaytarish yozuvini qaytarib bo'lmaydi" });
      if (p!.status === 'REVERSED') throw new ConflictException({ code: 'ALREADY_REVERSED', message: "To'lov allaqachon qaytarilgan" });

      // Shu to'lovdan hisoblarga taqsimlangan summalar qaytariladi (manfiy qatorlar), taqsimlanmagani (avans) shunchaki yo'qoladi.
      const net = await tx
        .select({ chargeId: paymentAllocations.chargeId, amount: sql<string>`sum(${paymentAllocations.amount})` })
        .from(paymentAllocations)
        .where(eq(paymentAllocations.paymentId, id))
        .groupBy(paymentAllocations.chargeId);
      const back = net.filter((n) => Number(n.amount) > 0);
      if (back.length) await tx.insert(paymentAllocations).values(back.map((n) => ({ centerId: actor.centerId!, paymentId: id, chargeId: n.chargeId, amount: -Number(n.amount) })));

      const receiptNo = await this.allocator.nextReceiptNo(tx, actor.centerId!);
      const [rev] = await tx
        .insert(payments)
        .values({ centerId: actor.centerId!, branchId: p!.branchId, studentId: p!.studentId, amount: -p!.amount, method: p!.method, status: 'CONFIRMED', reversesPaymentId: id, receivedBy: actor.id, receiptNo, note: reason })
        .returning();
      await tx.update(payments).set({ status: 'REVERSED' }).where(eq(payments.id, id));
      await this.allocator.syncStatuses(tx, back.map((n) => n.chargeId));
      await this.allocator.allocate(tx, actor.centerId!, p!.studentId); // boshqa avans bo'lsa qaytgan hisoblarga o'tadi
      await writeAudit(tx, {
        centerId: actor.centerId,
        actorId: actor.id,
        action: 'payment.reverse',
        entity: 'payment',
        entityId: id,
        before: audited(before),
        after: { ...audited({ ...p!, status: 'REVERSED' }), reason, reversalId: rev!.id, reversalReceiptNo: receiptNo, returnedToCharges: back.reduce((s, n) => s + Number(n.amount), 0) },
        ip: client.ip,
      });
      return this.detail(tx, { ...p!, status: 'REVERSED' });
    });
  }

  list(actor: AuthUser, q: ListPaymentsQuery) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'payment.view'))) throw forbidden();
      const scope = await branchScope(tx, actor);
      const empty = { items: [], limit: q.limit, offset: q.offset };
      if (q.branchId && actor.role !== 'STUDENT' && !inScope(scope, q.branchId)) return empty;
      const day = sql`(${payments.paidAt} at time zone 'Asia/Tashkent')::date`;
      const conds: (SQL | undefined)[] = [
        this.visibility(actor, scope),
        q.studentId ? eq(payments.studentId, q.studentId) : undefined,
        q.branchId ? eq(payments.branchId, q.branchId) : undefined,
        q.method ? eq(payments.method, q.method) : undefined,
        q.status ? eq(payments.status, q.status) : undefined,
        q.from ? sql`${day} >= ${q.from}::date` : undefined,
        q.to ? sql`${day} <= ${q.to}::date` : undefined,
      ];
      const rows = await tx.select().from(payments).where(and(...conds)).orderBy(desc(payments.paidAt), desc(payments.receiptNo)).limit(q.limit).offset(q.offset);
      return { items: await this.present(tx, rows), limit: q.limit, offset: q.offset };
    });
  }

  async get(actor: AuthUser, id: string) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'payment.view'))) throw forbidden();
      return this.detail(tx, await this.load(tx, actor, id));
    });
  }

  /** O'quvchi balansi: hisoblangan, taqsimlangan, qarz (ochiq hisoblar qoldig'i), avans. */
  balance(actor: AuthUser, studentId: string) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'payment.view'))) throw forbidden();
      if (actor.role === 'STUDENT' && actor.id !== studentId) throw studentNotFound();
      const [student] = await tx.select({ id: users.id, fullName: users.fullName }).from(users).where(and(eq(users.id, studentId), eq(users.role, 'STUDENT')));
      if (!student) throw studentNotFound();
      if (actor.role !== 'STUDENT') {
        const scope = await branchScope(tx, actor);
        if (!scope.all) {
          const links = await tx.select({ branchId: userBranches.branchId }).from(userBranches).where(eq(userBranches.userId, studentId));
          if (!links.some((l) => inScope(scope, l.branchId))) throw studentNotFound();
        }
      }
      await this.billing.generate(tx, actor.centerId!, { studentId });
      const rows = await tx.select().from(charges).where(and(eq(charges.studentId, studentId), sql`${charges.status} <> 'CANCELLED'`));
      const paid = await this.allocator.paidByCharge(tx, rows.map((c) => c.id));
      const open = rows
        .map((c) => ({ id: c.id, groupId: c.groupId, periodStart: c.periodStart, dueDate: c.dueDate, amount: c.amount, paid: paid.get(c.id) ?? 0, status: c.status }))
        .filter((c) => c.amount - c.paid > 0)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.periodStart.localeCompare(b.periodStart));
      const advance = (await this.allocator.pools(tx, studentId)).reduce((s, p) => s + p.remaining, 0);
      const [tot] = await tx
        .select({ t: sql<string>`coalesce(sum(${payments.amount}) filter (where ${payments.status} = 'CONFIRMED' and ${payments.reversesPaymentId} is null), 0)` })
        .from(payments)
        .where(eq(payments.studentId, studentId));
      return {
        studentId,
        studentName: student.fullName,
        charged: rows.reduce((s, c) => s + c.amount, 0),
        allocated: rows.reduce((s, c) => s + (paid.get(c.id) ?? 0), 0),
        debt: open.reduce((s, c) => s + (c.amount - c.paid), 0),
        advance,
        paymentsTotal: Number(tot!.t),
        openCharges: open.map((c) => ({ id: c.id, groupId: c.groupId, periodStart: c.periodStart, dueDate: c.dueDate, amount: c.amount, paid: c.paid, remaining: c.amount - c.paid, status: c.status })),
      };
    });
  }

  // --------------------------------------------------------------- yordamchilar

  private visibility(actor: AuthUser, scope: BranchScope): SQL | undefined {
    if (actor.role === 'STUDENT') return eq(payments.studentId, actor.id);
    return branchFilter(payments.branchId, scope);
  }

  private async load(tx: Tx, actor: AuthUser, id: string): Promise<PaymentRow> {
    const scope = await branchScope(tx, actor);
    const [p] = await tx.select().from(payments).where(and(eq(payments.id, id), this.visibility(actor, scope)));
    if (!p) throw paymentNotFound();
    return p;
  }

  /** To'lov filiali: berilgan bo'lsa tekshiriladi, aks holda o'quvchining qamrovdagi yagona filiali. */
  private async pickBranch(tx: Tx, scope: BranchScope, studentBranches: string[], requested?: string): Promise<string> {
    if (requested) {
      const [b] = await tx.select({ id: branches.id }).from(branches).where(and(eq(branches.id, requested), isNull(branches.archivedAt)));
      if (!b) throw new NotFoundException({ code: 'BRANCH_NOT_FOUND', message: 'Filial topilmadi' });
      if (!inScope(scope, requested)) throw forbidden("Bu filialda to'lov qabul qilish huquqingiz yo'q");
      return requested;
    }
    const cands = studentBranches.filter((b) => inScope(scope, b));
    if (cands.length !== 1) throw new BadRequestException({ code: 'BRANCH_REQUIRED', message: "To'lov filialini (branchId) ko'rsating" });
    return cands[0]!;
  }

  private async detail(tx: Tx, p: PaymentRow) {
    const [view] = await this.present(tx, [p]);
    const allocs = await tx
      .select({ chargeId: paymentAllocations.chargeId, amount: sql<string>`sum(${paymentAllocations.amount})`, periodStart: charges.periodStart, groupId: charges.groupId, groupName: groups.name })
      .from(paymentAllocations)
      .innerJoin(charges, eq(charges.id, paymentAllocations.chargeId))
      .innerJoin(groups, eq(groups.id, charges.groupId))
      .where(eq(paymentAllocations.paymentId, p.id))
      .groupBy(paymentAllocations.chargeId, charges.periodStart, charges.groupId, groups.name);
    return { ...view!, allocations: allocs.filter((a) => Number(a.amount) !== 0).map((a) => ({ ...a, amount: Number(a.amount) })).sort((x, y) => x.periodStart.localeCompare(y.periodStart)) };
  }

  private async present(tx: Tx, rows: PaymentRow[]) {
    if (!rows.length) return [];
    const userIds = [...new Set(rows.flatMap((p) => [p.studentId, p.receivedBy].filter((x): x is string => !!x)))];
    const [us, bs, used] = await Promise.all([
      tx.select({ id: users.id, fullName: users.fullName }).from(users).where(inArray(users.id, userIds)),
      tx.select({ id: branches.id, name: branches.name }).from(branches).where(inArray(branches.id, [...new Set(rows.map((p) => p.branchId))])),
      tx
        .select({ id: paymentAllocations.paymentId, used: sql<string>`sum(${paymentAllocations.amount})` })
        .from(paymentAllocations)
        .where(inArray(paymentAllocations.paymentId, rows.map((p) => p.id)))
        .groupBy(paymentAllocations.paymentId),
    ]);
    return rows.map((p) => {
      const allocated = Number(used.find((u) => u.id === p.id)?.used ?? 0);
      return {
        id: p.id,
        receiptNo: p.receiptNo,
        studentId: p.studentId,
        studentName: us.find((u) => u.id === p.studentId)?.fullName ?? null,
        branchId: p.branchId,
        branchName: bs.find((b) => b.id === p.branchId)?.name ?? null,
        amount: p.amount,
        method: p.method,
        status: p.status,
        reversesPaymentId: p.reversesPaymentId,
        receivedBy: p.receivedBy,
        receivedByName: us.find((u) => u.id === p.receivedBy)?.fullName ?? null,
        paidAt: p.paidAt,
        note: p.note,
        allocated: p.reversesPaymentId ? 0 : allocated, // hisoblarga taqsimlangan (sof)
        unallocated: p.reversesPaymentId || p.status === 'REVERSED' ? 0 : p.amount - allocated, // avans qismi
        createdAt: p.createdAt,
      };
    });
  }
}
