import type { Tx } from '../db/db.service.js';
import { auditLogs } from '../db/schema.js';

export interface AuditEntry {
  centerId: string | null;
  actorId: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
}

/**
 * Audit yozuvi shu tranzaksiya ichida yoziladi: amal bekor bo'lsa, yozuv ham bekor bo'ladi.
 * Parol, token va boshqa sirlarni before/after ga HECH QACHON qo'ymang.
 */
export async function writeAudit(tx: Tx, e: AuditEntry): Promise<void> {
  await tx.insert(auditLogs).values({
    centerId: e.centerId,
    actorId: e.actorId,
    action: e.action,
    entity: e.entity,
    entityId: e.entityId ?? null,
    before: e.before ?? null,
    after: e.after ?? null,
    ip: e.ip ?? null,
  });
}
