import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { PermissionsService } from '../auth/permissions.service.js';
import { branchScope, inScope } from '../common/branch-scope.js';
import { todayLocal } from '../common/dates.js';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { enrollmentDiscounts, enrollments, groups } from '../db/schema.js';
import { BillingService } from './billing.service.js';
import type { CreateDiscountInput } from './discounts.schemas.js';

const forbidden = () => new ForbiddenException({ code: 'FORBIDDEN', message: "Bu amal uchun ruxsat yo'q" });
const enrollmentNotFound = () => new NotFoundException({ code: 'ENROLLMENT_NOT_FOUND', message: 'Yozilish topilmadi' });
const discountNotFound = () => new NotFoundException({ code: 'DISCOUNT_NOT_FOUND', message: 'Chegirma topilmadi' });

type DiscountRow = typeof enrollmentDiscounts.$inferSelect;
const audited = (d: DiscountRow) => ({ enrollmentId: d.enrollmentId, type: d.type, value: d.value, reason: d.reason, fromDate: d.fromDate, toDate: d.toDate });
type Range = { fromDate: string | null; toDate: string | null };
const overlap = (a: Range, b: Range) => (a.fromDate ?? '') <= (b.toDate ?? '9999-12-31') && (b.fromDate ?? '') <= (a.toDate ?? '9999-12-31');

/**
 * Chegirma/imtiyoz (`discount.grant`: rahbar, admin/kassir ○ o'z filialida). Faqat KEYINGI hisoblarga ta'sir qiladi:
 * `charges.discount_amount` yaratilganda qotiriladi, shuning uchun berish/tugatishdan oldin yozilish hisobi hozirgacha yaratiladi.
 * Qator o'chirilmaydi: tugatish `to_date` qo'yadi. Bir yozilishdagi chegirmalar qo'shiladi (asos summadan oshmaydi).
 */
@Injectable()
export class DiscountsService {
  constructor(
    private readonly db: DbService,
    private readonly perms: PermissionsService,
    private readonly billing: BillingService,
  ) {}

  private ctx(actor: AuthUser) {
    return contextOf(actor.centerId, actor.role);
  }

  grant(actor: AuthUser, enrollmentId: string, input: CreateDiscountInput, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'discount.grant'))) throw forbidden();
      const e = await this.manageable(tx, actor, enrollmentId);
      if (e.status === 'LEFT') throw new ConflictException({ code: 'ALREADY_LEFT', message: 'Yozilish tugagan' });
      await this.billing.generate(tx, actor.centerId!, { enrollmentIds: [e.id] }); // o'tgan davrlar eski narxda qotadi

      const existing = await tx.select().from(enrollmentDiscounts).where(eq(enrollmentDiscounts.enrollmentId, e.id));
      const next: Range = { fromDate: input.fromDate ?? null, toDate: input.toDate ?? null };
      const overlaps = existing.filter((d) => overlap(d, next)).map((d) => d.id).sort();
      const [d] = await tx
        .insert(enrollmentDiscounts)
        .values({ centerId: actor.centerId!, enrollmentId: e.id, type: input.type, value: input.value ?? null, reason: input.reason, fromDate: next.fromDate, toDate: next.toDate, grantedBy: actor.id })
        .returning();
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'discount.grant', entity: 'discount', entityId: d!.id, after: audited(d!), ip: client.ip });
      return { ...this.present(d!), overlaps };
    });
  }

  end(actor: AuthUser, id: string, toDate: string | undefined, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'discount.grant'))) throw forbidden();
      const [d] = await tx.select().from(enrollmentDiscounts).where(eq(enrollmentDiscounts.id, id));
      if (!d) throw discountNotFound();
      const e = await this.manageable(tx, actor, d.enrollmentId).catch(() => {
        throw discountNotFound();
      });
      const to = toDate ?? todayLocal();
      if (d.fromDate && to < d.fromDate) throw new BadRequestException({ code: 'INVALID_DATES', message: "Tugash sanasi boshlanish sanasidan oldin bo'lishi mumkin emas" });
      if (d.toDate && d.toDate <= to) throw new ConflictException({ code: 'ALREADY_ENDED', message: 'Chegirma allaqachon tugagan' });
      await this.billing.generate(tx, actor.centerId!, { enrollmentIds: [e.id] }); // tugatishdan oldingi davrlar chegirma bilan qotadi
      const [after] = await tx.update(enrollmentDiscounts).set({ toDate: to }).where(eq(enrollmentDiscounts.id, id)).returning();
      await writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action: 'discount.end', entity: 'discount', entityId: id, before: audited(d), after: audited(after!), ip: client.ip });
      return this.present(after!);
    });
  }

  list(actor: AuthUser, enrollmentId: string) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      const may = (await this.perms.hasIn(tx, actor, 'payment.view')) || (await this.perms.hasIn(tx, actor, 'discount.grant'));
      if (!may) throw forbidden();
      const e = await this.manageable(tx, actor, enrollmentId);
      const rows = await tx.select().from(enrollmentDiscounts).where(eq(enrollmentDiscounts.enrollmentId, e.id)).orderBy(asc(enrollmentDiscounts.createdAt), asc(enrollmentDiscounts.id));
      return { items: rows.map((r) => this.present(r)) };
    });
  }

  /** Yozilish qamrovda bo'lsa qaytaradi: o'quvchi o'zinikini, rahbar hammasini, admin/kassir guruh filiali bo'yicha. */
  private async manageable(tx: Tx, actor: AuthUser, enrollmentId: string) {
    const [row] = await tx.select({ e: enrollments, branchId: groups.branchId }).from(enrollments).innerJoin(groups, eq(groups.id, enrollments.groupId)).where(eq(enrollments.id, enrollmentId));
    if (!row) throw enrollmentNotFound();
    if (actor.role === 'STUDENT') {
      if (row.e.studentId !== actor.id) throw enrollmentNotFound();
    } else if (!inScope(await branchScope(tx, actor), row.branchId)) throw enrollmentNotFound();
    return row.e;
  }

  private present(d: DiscountRow) {
    const t = todayLocal();
    return {
      id: d.id,
      enrollmentId: d.enrollmentId,
      type: d.type,
      value: d.value,
      reason: d.reason,
      fromDate: d.fromDate,
      toDate: d.toDate,
      active: (!d.fromDate || d.fromDate <= t) && (!d.toDate || d.toDate >= t),
      grantedBy: d.grantedBy,
      createdAt: d.createdAt,
    };
  }
}
