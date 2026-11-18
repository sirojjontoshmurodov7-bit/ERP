import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { asc, count, eq } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { uniqueViolation } from '../common/pg-errors.js';
import { DbService, type Tx } from '../db/db.service.js';
import { centers, plans } from '../db/schema.js';
import type { CreatePlanInput, UpdatePlanInput } from './plans.schemas.js';

const SUPER = { centerId: null, isSuperAdmin: true } as const;
const notFound = () => new NotFoundException({ code: 'PLAN_NOT_FOUND', message: 'Tarif topilmadi' });
const nameTaken = () => new ConflictException({ code: 'PLAN_NAME_TAKEN', message: 'Bu nomli tarif allaqachon bor' });

type PlanRow = typeof plans.$inferSelect;
const view = (p: PlanRow, centersCount?: number) => ({
  id: p.id,
  name: p.name,
  priceMonthly: p.priceMonthly,
  maxStudents: p.maxStudents,
  maxBranches: p.maxBranches,
  features: p.features,
  createdAt: p.createdAt,
  ...(centersCount === undefined ? {} : { centers: centersCount }),
});
const audited = (p: PlanRow) => ({ name: p.name, priceMonthly: p.priceMonthly, maxStudents: p.maxStudents, maxBranches: p.maxBranches, features: p.features });

/**
 * Tariflar (`plan.manage`, faqat super admin). O'chirilmaydi (DELETE huquqi yo'q). Chegarani pasaytirish mavjud
 * o'quvchi/filiallarga tegmaydi: u faqat yangi yaratishni to'sadi. Markazga biriktirish: `PATCH /admin/centers/:id` (`planId`).
 */
@Injectable()
export class PlansService {
  constructor(private readonly db: DbService) {}

  async create(actor: AuthUser, input: CreatePlanInput, client: ClientInfo) {
    try {
      return await this.db.withContext(SUPER, async (tx) => {
        const [p] = await tx.insert(plans).values({ name: input.name, priceMonthly: input.priceMonthly, maxStudents: input.maxStudents, maxBranches: input.maxBranches, features: input.features }).returning();
        await writeAudit(tx, { centerId: null, actorId: actor.id, action: 'plan.create', entity: 'plan', entityId: p!.id, after: audited(p!), ip: client.ip });
        return view(p!, 0);
      });
    } catch (e) {
      if (uniqueViolation(e) !== null) throw nameTaken();
      throw e;
    }
  }

  list() {
    return this.db.withContext(SUPER, async (tx) => {
      const rows = await tx
        .select({ plan: plans, centers: count(centers.id) })
        .from(plans)
        .leftJoin(centers, eq(centers.planId, plans.id))
        .groupBy(plans.id)
        .orderBy(asc(plans.priceMonthly), asc(plans.name));
      return { items: rows.map((r) => view(r.plan, Number(r.centers))) };
    });
  }

  get(id: string) {
    return this.db.withContext(SUPER, async (tx) => view(await this.load(tx, id), await this.usage(tx, id)));
  }

  async update(actor: AuthUser, id: string, patch: UpdatePlanInput, client: ClientInfo) {
    try {
      return await this.db.withContext(SUPER, async (tx) => {
        const before = await this.load(tx, id);
        const [after] = await tx.update(plans).set(patch).where(eq(plans.id, id)).returning();
        await writeAudit(tx, { centerId: null, actorId: actor.id, action: 'plan.edit', entity: 'plan', entityId: id, before: audited(before), after: audited(after!), ip: client.ip });
        return view(after!, await this.usage(tx, id));
      });
    } catch (e) {
      if (uniqueViolation(e) !== null) throw nameTaken();
      throw e;
    }
  }

  private async load(tx: Tx, id: string) {
    const [p] = await tx.select().from(plans).where(eq(plans.id, id));
    if (!p) throw notFound();
    return p;
  }

  private async usage(tx: Tx, id: string): Promise<number> {
    const [r] = await tx.select({ n: count() }).from(centers).where(eq(centers.planId, id));
    return Number(r?.n ?? 0);
  }
}
