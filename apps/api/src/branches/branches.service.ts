import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, eq, isNull } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { branchFilter, branchScope } from '../common/branch-scope.js';
import { uniqueViolation } from '../common/pg-errors.js';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { branches, centers, plans } from '../db/schema.js';
import type { CreateBranchInput, UpdateBranchInput } from './branches.schemas.js';

const notFound = () => new NotFoundException({ code: 'BRANCH_NOT_FOUND', message: 'Filial topilmadi' });
const nameTaken = () => new ConflictException({ code: 'BRANCH_NAME_TAKEN', message: 'Bu nomli filial allaqachon bor' });

const view = (b: typeof branches.$inferSelect) => ({
  id: b.id,
  name: b.name,
  address: b.address,
  phone: b.phone,
  archivedAt: b.archivedAt,
  createdAt: b.createdAt,
});
const audited = (b: typeof branches.$inferSelect) => ({ name: b.name, address: b.address, phone: b.phone, archived: b.archivedAt !== null });

@Injectable()
export class BranchesService {
  constructor(private readonly db: DbService) {}

  private ctx(actor: AuthUser) {
    return contextOf(actor.centerId, actor.role);
  }

  async create(actor: AuthUser, input: CreateBranchInput, client: ClientInfo) {
    try {
      return await this.db.withContext(this.ctx(actor), async (tx) => {
        await this.assertWithinPlanLimit(tx, actor.centerId!);
        const [b] = await tx
          .insert(branches)
          .values({ centerId: actor.centerId!, name: input.name, address: input.address ?? null, phone: input.phone ?? null })
          .returning();
        await writeAudit(tx, {
          centerId: actor.centerId,
          actorId: actor.id,
          action: 'branch.create',
          entity: 'branch',
          entityId: b!.id,
          after: audited(b!),
          ip: client.ip,
        });
        return view(b!);
      });
    } catch (e) {
      if (uniqueViolation(e) !== null) throw nameTaken();
      throw e;
    }
  }

  /** Qamrov bo'yicha: rahbar hammasini, boshqalar faqat o'z filiallarini ko'radi. */
  list(actor: AuthUser, includeArchived: boolean) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      const scope = await branchScope(tx, actor);
      const rows = await tx
        .select()
        .from(branches)
        .where(and(branchFilter(branches.id, scope), includeArchived && actor.role === 'OWNER' ? undefined : isNull(branches.archivedAt)))
        .orderBy(asc(branches.createdAt));
      return { items: rows.map(view) };
    });
  }

  get(actor: AuthUser, id: string) {
    return this.db.withContext(this.ctx(actor), async (tx) => view(await this.load(tx, actor, id)));
  }

  async update(actor: AuthUser, id: string, patch: UpdateBranchInput, client: ClientInfo) {
    try {
      return await this.db.withContext(this.ctx(actor), async (tx) => {
        const before = await this.load(tx, actor, id);
        const set: Partial<typeof branches.$inferInsert> = {};
        if (patch.name !== undefined) set.name = patch.name;
        if (patch.address !== undefined) set.address = patch.address;
        if (patch.phone !== undefined) set.phone = patch.phone;
        const [after] = await tx.update(branches).set(set).where(eq(branches.id, id)).returning();
        await writeAudit(tx, {
          centerId: actor.centerId,
          actorId: actor.id,
          action: 'branch.edit',
          entity: 'branch',
          entityId: id,
          before: audited(before),
          after: audited(after!),
          ip: client.ip,
        });
        return view(after!);
      });
    } catch (e) {
      if (uniqueViolation(e) !== null) throw nameTaken();
      throw e;
    }
  }

  /** Arxivlash yumshoq o'chirish: yozuv saqlanadi. Oxirgi faol filialni arxivlab bo'lmaydi (har markazda kamida bitta). */
  async archive(actor: AuthUser, id: string, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      const before = await this.load(tx, actor, id);
      if (before.archivedAt) throw new ConflictException({ code: 'ALREADY_ARCHIVED', message: 'Filial allaqachon arxivlangan' });
      const [{ active } = { active: 0 }] = await tx
        .select({ active: count() })
        .from(branches)
        .where(isNull(branches.archivedAt));
      if (Number(active) <= 1) {
        throw new ConflictException({ code: 'LAST_BRANCH', message: "Oxirgi faol filialni arxivlab bo'lmaydi" });
      }
      const [after] = await tx.update(branches).set({ archivedAt: new Date() }).where(eq(branches.id, id)).returning();
      await writeAudit(tx, {
        centerId: actor.centerId,
        actorId: actor.id,
        action: 'branch.archive',
        entity: 'branch',
        entityId: id,
        before: audited(before),
        after: audited(after!),
        ip: client.ip,
      });
      return view(after!);
    });
  }

  async unarchive(actor: AuthUser, id: string, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      const before = await this.load(tx, actor, id);
      if (!before.archivedAt) throw new ConflictException({ code: 'NOT_ARCHIVED', message: 'Filial arxivlanmagan' });
      await this.assertWithinPlanLimit(tx, actor.centerId!);
      const [after] = await tx.update(branches).set({ archivedAt: null }).where(eq(branches.id, id)).returning();
      await writeAudit(tx, {
        centerId: actor.centerId,
        actorId: actor.id,
        action: 'branch.unarchive',
        entity: 'branch',
        entityId: id,
        before: audited(before),
        after: audited(after!),
        ip: client.ip,
      });
      return view(after!);
    });
  }

  /** Tarifda `max_branches` bo'lsa faol filiallar soni undan oshmasligi kerak; tarif yo'q yoki NULL = cheksiz. */
  private async assertWithinPlanLimit(tx: Tx, centerId: string) {
    const [row] = await tx
      .select({ max: plans.maxBranches })
      .from(centers)
      .leftJoin(plans, eq(plans.id, centers.planId))
      .where(eq(centers.id, centerId));
    const max = row?.max;
    if (max === null || max === undefined) return;
    const [{ active } = { active: 0 }] = await tx.select({ active: count() }).from(branches).where(isNull(branches.archivedAt));
    if (Number(active) >= max) {
      throw new ForbiddenException({ code: 'PLAN_BRANCH_LIMIT', message: `Tarifingizda ${max} tagacha filial mumkin` });
    }
  }

  /** RLS boshqa markaz filialini ko'rsatmaydi; qamrovdan tashqari filial ham 404 (mavjudligi sezilmasin). */
  private async load(tx: Tx, actor: AuthUser, id: string) {
    const scope = await branchScope(tx, actor);
    const [b] = await tx
      .select()
      .from(branches)
      .where(and(eq(branches.id, id), branchFilter(branches.id, scope)));
    if (!b) throw notFound();
    return b;
  }
}
