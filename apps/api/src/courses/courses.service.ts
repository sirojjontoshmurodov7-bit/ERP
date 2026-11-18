import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, eq, isNull } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { PermissionsService } from '../auth/permissions.service.js';
import { uniqueViolation } from '../common/pg-errors.js';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { courses, groups } from '../db/schema.js';
import type { CreateCourseInput, UpdateCourseInput } from './courses.schemas.js';

const forbidden = () => new ForbiddenException({ code: 'FORBIDDEN', message: "Bu amal uchun ruxsat yo'q" });
const notFound = () => new NotFoundException({ code: 'COURSE_NOT_FOUND', message: 'Kurs topilmadi' });
const nameTaken = () => new ConflictException({ code: 'COURSE_NAME_TAKEN', message: 'Bu nomli kurs allaqachon bor' });

type CourseRow = typeof courses.$inferSelect;
const audited = (c: CourseRow) => ({ name: c.name, defaultPrice: c.defaultPrice, archived: c.archivedAt !== null });

/**
 * Kurslar markaz darajasida (filialsiz): `group.create` / `group.edit` / `group.view` ruxsatlari bilan boshqariladi.
 * Kurs narxi faqat yangi guruh uchun sukut qiymat; moliyaviy hisob guruh narxidan olinadi, shuning uchun ustozdan yashiriladi.
 */
@Injectable()
export class CoursesService {
  constructor(
    private readonly db: DbService,
    private readonly perms: PermissionsService,
  ) {}

  private ctx(actor: AuthUser) {
    return contextOf(actor.centerId, actor.role);
  }

  private view(actor: AuthUser, c: CourseRow) {
    return {
      id: c.id,
      name: c.name,
      ...(actor.role === 'TEACHER' ? {} : { defaultPrice: c.defaultPrice }),
      archivedAt: c.archivedAt,
      createdAt: c.createdAt,
    };
  }

  async create(actor: AuthUser, input: CreateCourseInput, client: ClientInfo) {
    try {
      return await this.db.withContext(this.ctx(actor), async (tx) => {
        if (!(await this.perms.hasIn(tx, actor, 'group.create'))) throw forbidden();
        const [c] = await tx
          .insert(courses)
          .values({ centerId: actor.centerId!, name: input.name, defaultPrice: input.defaultPrice ?? null })
          .returning();
        await this.audit(tx, actor, client, 'course.create', c!.id, undefined, audited(c!));
        return this.view(actor, c!);
      });
    } catch (e) {
      if (uniqueViolation(e) !== null) throw nameTaken();
      throw e;
    }
  }

  list(actor: AuthUser, includeArchived: boolean) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'group.view'))) throw forbidden();
      const rows = await tx
        .select()
        .from(courses)
        .where(includeArchived ? undefined : isNull(courses.archivedAt))
        .orderBy(asc(courses.name));
      return { items: rows.map((c) => this.view(actor, c)) };
    });
  }

  get(actor: AuthUser, id: string) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'group.view'))) throw forbidden();
      return this.view(actor, await this.load(tx, id));
    });
  }

  async update(actor: AuthUser, id: string, patch: UpdateCourseInput, client: ClientInfo) {
    try {
      return await this.db.withContext(this.ctx(actor), async (tx) => {
        if (!(await this.perms.hasIn(tx, actor, 'group.edit'))) throw forbidden();
        const before = await this.load(tx, id);
        const set: Partial<typeof courses.$inferInsert> = {};
        if (patch.name !== undefined) set.name = patch.name;
        if (patch.defaultPrice !== undefined) set.defaultPrice = patch.defaultPrice;
        const [after] = await tx.update(courses).set(set).where(eq(courses.id, id)).returning();
        await this.audit(tx, actor, client, 'course.edit', id, audited(before), audited(after!));
        return this.view(actor, after!);
      });
    } catch (e) {
      if (uniqueViolation(e) !== null) throw nameTaken();
      throw e;
    }
  }

  /** Arxivlash: kursda arxivlanmagan guruh bo'lsa mumkin emas (avval guruhlar arxivlanadi yoki boshqa kursga o'tadi). */
  archive(actor: AuthUser, id: string, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'group.edit'))) throw forbidden();
      const before = await this.load(tx, id);
      if (before.archivedAt) throw new ConflictException({ code: 'ALREADY_ARCHIVED', message: 'Kurs allaqachon arxivlangan' });
      const [{ used } = { used: 0 }] = await tx
        .select({ used: count() })
        .from(groups)
        .where(and(eq(groups.courseId, id), isNull(groups.archivedAt)));
      if (Number(used) > 0) {
        throw new ConflictException({ code: 'COURSE_IN_USE', message: `Kursda ${used} ta faol guruh bor, avval ularni arxivlang yoki boshqa kursga o'tkazing` });
      }
      const [after] = await tx.update(courses).set({ archivedAt: new Date() }).where(eq(courses.id, id)).returning();
      await this.audit(tx, actor, client, 'course.archive', id, audited(before), audited(after!));
      return this.view(actor, after!);
    });
  }

  unarchive(actor: AuthUser, id: string, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      if (!(await this.perms.hasIn(tx, actor, 'group.edit'))) throw forbidden();
      const before = await this.load(tx, id);
      if (!before.archivedAt) throw new ConflictException({ code: 'NOT_ARCHIVED', message: 'Kurs arxivlanmagan' });
      const [after] = await tx.update(courses).set({ archivedAt: null }).where(eq(courses.id, id)).returning();
      await this.audit(tx, actor, client, 'course.unarchive', id, audited(before), audited(after!));
      return this.view(actor, after!);
    });
  }

  private async load(tx: Tx, id: string) {
    const [c] = await tx.select().from(courses).where(eq(courses.id, id));
    if (!c) throw notFound();
    return c;
  }

  private audit(tx: Tx, actor: AuthUser, client: ClientInfo, action: string, id: string, before: unknown, after: unknown) {
    return writeAudit(tx, { centerId: actor.centerId, actorId: actor.id, action, entity: 'course', entityId: id, before, after, ip: client.ip });
  }
}
