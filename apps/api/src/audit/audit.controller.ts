import { Controller, Get, Query } from '@nestjs/common';
import { and, desc, eq, gte, lt, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser, RequirePermission } from '../auth/decorators.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { contextOf, DbService } from '../db/db.service.js';
import { auditLogs, users } from '../db/schema.js';

export const listAuditSchema = z.object({
  action: z.string().min(1).max(80).optional(),
  entity: z.string().min(1).max(80).optional(),
  entityId: z.uuid().optional(),
  actorId: z.uuid().optional(),
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/** Audit jurnali (faqat o'qish): markaz o'z yozuvlarini ko'radi (RLS). `audit.view`: sukut bo'yicha faqat rahbar. */
@Controller('audit')
export class AuditController {
  constructor(private readonly db: DbService) {}

  @RequirePermission('audit.view')
  @Get()
  list(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(listAuditSchema)) q: z.infer<typeof listAuditSchema>) {
    return this.db.withContext(contextOf(actor.centerId, actor.role), async (tx) => {
      const conds: (SQL | undefined)[] = [
        q.action ? eq(auditLogs.action, q.action) : undefined,
        q.entity ? eq(auditLogs.entity, q.entity) : undefined,
        q.entityId ? eq(auditLogs.entityId, q.entityId) : undefined,
        q.actorId ? eq(auditLogs.actorId, q.actorId) : undefined,
        q.from ? gte(auditLogs.at, new Date(q.from)) : undefined,
        q.to ? lt(auditLogs.at, new Date(q.to)) : undefined,
      ];
      const items = await tx
        .select({
          id: auditLogs.id,
          at: auditLogs.at,
          action: auditLogs.action,
          entity: auditLogs.entity,
          entityId: auditLogs.entityId,
          actorId: auditLogs.actorId,
          actorName: users.fullName,
          before: auditLogs.before,
          after: auditLogs.after,
          ip: auditLogs.ip,
        })
        .from(auditLogs)
        .leftJoin(users, eq(users.id, auditLogs.actorId))
        .where(and(...conds))
        .orderBy(desc(auditLogs.id))
        .limit(q.limit)
        .offset(q.offset);
      return { items, limit: q.limit, offset: q.offset };
    });
  }
}
