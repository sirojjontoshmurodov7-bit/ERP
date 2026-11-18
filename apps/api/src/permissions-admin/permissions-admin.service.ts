import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PERMISSIONS, ROLE_PERMISSION_MATRIX, type TenantRole } from '@erp/shared';
import { and, eq, inArray } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { centerRolePermissions, userPermissions, users } from '../db/schema.js';

const DEFS = new Map(PERMISSIONS.map((p) => [p.code, p]));

/**
 * Faqat ○ (optional) kodlarni sozlash mumkin: ✔ (default) kodlar rol bilan keladi, – kodlar hech qachon yoqilmaydi.
 * Shu tekshiruv matritsa buzilishining yagona yo'li (rol shabloni ham, foydalanuvchi istisnosi ham) yopadi.
 */
function assertConfigurable(role: TenantRole, codes: string[]) {
  const optional = new Set(ROLE_PERMISSION_MATRIX[role].optional);
  const bad = codes.filter((c) => !optional.has(c));
  if (bad.length) {
    throw new BadRequestException({
      code: 'PERMISSION_NOT_CONFIGURABLE',
      message: `Bu rol uchun sozlab bo'lmaydigan ruxsatlar: ${bad.join(', ')}`,
      codes: bad,
    });
  }
}

@Injectable()
export class PermissionsAdminService {
  constructor(private readonly db: DbService) {}

  private ctx(actor: AuthUser) {
    return contextOf(actor.centerId, actor.role);
  }

  /** Markazning hamma rollari bo'yicha shablon: har kod uchun turi (default/optional), holati va sozlanishi. */
  roleMatrix(actor: AuthUser) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      const rows = await tx.select().from(centerRolePermissions).where(eq(centerRolePermissions.centerId, actor.centerId!));
      const roles: Record<string, unknown[]> = {};
      for (const role of Object.keys(ROLE_PERMISSION_MATRIX) as TenantRole[]) {
        roles[role] = this.entries(role).map((e) => ({
          ...e,
          allowed: rows.find((r) => r.role === role && r.permissionCode === e.code)?.allowed ?? e.kind === 'default',
        }));
      }
      return { roles };
    });
  }

  async setRole(actor: AuthUser, role: TenantRole, changes: Record<string, boolean>, client: ClientInfo) {
    assertConfigurable(role, Object.keys(changes));
    return this.db.withContext(this.ctx(actor), async (tx) => {
      const codes = Object.keys(changes);
      const existing = await tx
        .select()
        .from(centerRolePermissions)
        .where(and(eq(centerRolePermissions.role, role), inArray(centerRolePermissions.permissionCode, codes)));
      const before: Record<string, boolean> = {};
      for (const c of codes) before[c] = existing.find((r) => r.permissionCode === c)?.allowed ?? false;

      for (const [permissionCode, allowed] of Object.entries(changes)) {
        await tx
          .insert(centerRolePermissions)
          .values({ centerId: actor.centerId!, role, permissionCode, allowed })
          .onConflictDoUpdate({
            target: [centerRolePermissions.centerId, centerRolePermissions.role, centerRolePermissions.permissionCode],
            set: { allowed },
          });
      }
      await writeAudit(tx, {
        centerId: actor.centerId,
        actorId: actor.id,
        action: 'permissions.role_update',
        entity: 'permission',
        before: { role, permissions: before },
        after: { role, permissions: changes },
        ip: client.ip,
      });
      return { role, permissions: changes };
    });
  }

  /** Foydalanuvchining samarali ruxsatlari: shablon, istisno va natija. */
  userMatrix(actor: AuthUser, userId: string) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      const target = await this.loadTarget(tx, userId);
      const role = target.role as TenantRole;
      const [templates, overrides] = await Promise.all([
        tx.select().from(centerRolePermissions).where(eq(centerRolePermissions.role, role)),
        tx.select().from(userPermissions).where(eq(userPermissions.userId, userId)),
      ]);
      return {
        user: { id: target.id, login: target.login, fullName: target.fullName, role },
        permissions: this.entries(role).map((e) => {
          const template = templates.find((t) => t.permissionCode === e.code)?.allowed ?? false;
          const override = overrides.find((o) => o.permissionCode === e.code)?.allowed ?? null;
          return { ...e, template, override, effective: override ?? template };
        }),
      };
    });
  }

  async setUser(actor: AuthUser, userId: string, changes: Record<string, boolean | null>, client: ClientInfo) {
    return this.db.withContext(this.ctx(actor), async (tx) => {
      const target = await this.loadTarget(tx, userId);
      assertConfigurable(target.role as TenantRole, Object.keys(changes));

      const codes = Object.keys(changes);
      const existing = await tx
        .select()
        .from(userPermissions)
        .where(and(eq(userPermissions.userId, userId), inArray(userPermissions.permissionCode, codes)));
      const before: Record<string, boolean | null> = {};
      for (const c of codes) before[c] = existing.find((r) => r.permissionCode === c)?.allowed ?? null;

      for (const [permissionCode, allowed] of Object.entries(changes)) {
        if (allowed === null) {
          await tx.delete(userPermissions).where(and(eq(userPermissions.userId, userId), eq(userPermissions.permissionCode, permissionCode)));
        } else {
          await tx
            .insert(userPermissions)
            .values({ userId, centerId: actor.centerId!, permissionCode, allowed })
            .onConflictDoUpdate({ target: [userPermissions.userId, userPermissions.permissionCode], set: { allowed } });
        }
      }
      await writeAudit(tx, {
        centerId: actor.centerId,
        actorId: actor.id,
        action: 'permissions.user_update',
        entity: 'permission',
        entityId: userId,
        before: { permissions: before },
        after: { permissions: changes },
        ip: client.ip,
      });
      return { userId, permissions: changes };
    });
  }

  private entries(role: TenantRole) {
    const m = ROLE_PERMISSION_MATRIX[role];
    const mk = (code: string, kind: 'default' | 'optional') => ({
      code,
      module: DEFS.get(code)?.module,
      description: DEFS.get(code)?.description,
      kind,
      configurable: kind === 'optional',
    });
    return [...m.default.map((c) => mk(c, 'default')), ...m.optional.map((c) => mk(c, 'optional'))];
  }

  /** Markaz ichidagi (RLS) tenant foydalanuvchisi; super admin va boshqa markaz 404. */
  private async loadTarget(tx: Tx, userId: string) {
    const [u] = await tx.select().from(users).where(eq(users.id, userId));
    if (!u || u.role === 'SUPER_ADMIN') throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'Foydalanuvchi topilmadi' });
    return u;
  }
}
