import { Injectable } from '@nestjs/common';
import { PERMISSION_CODES, PLATFORM_ONLY_PERMISSIONS } from '@erp/shared';
import { and, eq } from 'drizzle-orm';
import { contextOf, DbService, type Tx } from '../db/db.service.js';
import { centerRolePermissions, userPermissions } from '../db/schema.js';
import type { AuthUser } from './auth.types.js';

@Injectable()
export class PermissionsService {
  constructor(private readonly db: DbService) {}

  /**
   * Samarali ruxsat = foydalanuvchi istisnosi bo'lsa shu, bo'lmasa markazning rol shabloni; ikkalasi ham yo'q bo'lsa taqiqlangan.
   * Platforma ruxsatlari faqat SUPER_ADMIN'da va sozlanmaydi; SUPER_ADMIN markaz ichki ruxsatlariga ega emas.
   * Keshsiz: har tekshiruv 1-2 ta indeksli so'rov. Kerak bo'lsa keyin kesh qo'shiladi (o'zgarganda bekor qilinadi).
   */
  async has(user: AuthUser, code: string): Promise<boolean> {
    if (!PERMISSION_CODES.has(code)) throw new Error(`Unknown permission code: ${code}`);
    if (PLATFORM_ONLY_PERMISSIONS.has(code)) return user.role === 'SUPER_ADMIN';
    if (user.role === 'SUPER_ADMIN' || !user.centerId) return false;

    return this.db.withContext(contextOf(user.centerId, user.role), (tx) => this.hasIn(tx, user, code));
  }

  /** `has` bilan bir xil qoida, lekin chaqiruvchining tranzaksiyasida (servis ichida ruxsat tekshirish uchun). */
  async hasIn(tx: Tx, user: AuthUser, code: string): Promise<boolean> {
    if (!PERMISSION_CODES.has(code)) throw new Error(`Unknown permission code: ${code}`);
    if (PLATFORM_ONLY_PERMISSIONS.has(code)) return user.role === 'SUPER_ADMIN';
    if (user.role === 'SUPER_ADMIN' || !user.centerId) return false;

    const centerId = user.centerId;
    const [override] = await tx
      .select({ allowed: userPermissions.allowed })
      .from(userPermissions)
      .where(and(eq(userPermissions.userId, user.id), eq(userPermissions.permissionCode, code)));
    if (override) return override.allowed;

    const [template] = await tx
      .select({ allowed: centerRolePermissions.allowed })
      .from(centerRolePermissions)
      .where(
        and(
          eq(centerRolePermissions.centerId, centerId),
          eq(centerRolePermissions.role, user.role),
          eq(centerRolePermissions.permissionCode, code),
        ),
      );
    return template?.allowed ?? false;
  }
}
