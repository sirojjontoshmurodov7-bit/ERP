import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { and, eq } from 'drizzle-orm';
import { contextOf, DbService } from '../db/db.service.js';
import { centers, sessions, users } from '../db/schema.js';
import type { AuthedRequest } from './auth.types.js';
import { ALLOW_MUST_CHANGE, IS_PUBLIC, PERMISSIONS_KEY, ROLES_KEY } from './decorators.js';
import { PermissionsService } from './permissions.service.js';
import { TokenService } from './token.service.js';
import type { PermissionCode, Role } from '@erp/shared';

const unauthorized = (code: string, message = "Avtorizatsiya talab qilinadi") =>
  new UnauthorizedException({ code, message });

/**
 * 1-guard: tokenni tekshiradi va HAR so'rovda sessiya/foydalanuvchi/markaz holatini bazadan o'qiydi,
 * shuning uchun bloklash, parol almashtirish va logout darhol kuchga kiradi (access token qisqa umrli bo'lsa ham).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
    private readonly db: DbService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;

    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw unauthorized('MISSING_TOKEN');

    let claims;
    try {
      claims = await this.tokens.verifyAccess(token);
    } catch {
      throw unauthorized('INVALID_TOKEN');
    }

    const [row] = await this.db.withContext(contextOf(claims.cid, claims.role), (tx) =>
      tx
        .select({
          sessionUserId: sessions.userId,
          revokedAt: sessions.revokedAt,
          expiresAt: sessions.expiresAt,
          userId: users.id,
          login: users.login,
          fullName: users.fullName,
          role: users.role,
          status: users.status,
          centerId: users.centerId,
          mustChange: users.mustChangePassword,
          centerStatus: centers.status,
        })
        .from(sessions)
        .innerJoin(users, eq(users.id, sessions.userId))
        .leftJoin(centers, eq(centers.id, users.centerId))
        .where(and(eq(sessions.id, claims.sid), eq(users.id, claims.sub))),
    );

    if (!row || row.revokedAt || row.expiresAt.getTime() <= Date.now()) throw unauthorized('SESSION_INVALID');
    if (row.role !== claims.role || (row.centerId ?? null) !== claims.cid) throw unauthorized('INVALID_TOKEN');
    if (row.status !== 'ACTIVE') throw new ForbiddenException({ code: 'ACCOUNT_INACTIVE', message: 'Akkaunt faol emas' });
    if (row.centerStatus === 'BLOCKED') throw new ForbiddenException({ code: 'CENTER_BLOCKED', message: 'Markaz bloklangan' });

    req.user = {
      id: row.userId,
      login: row.login,
      fullName: row.fullName,
      role: row.role as Role,
      centerId: row.centerId,
      sessionId: claims.sid,
      mustChangePassword: row.mustChange,
    };

    if (row.mustChange && !this.reflector.getAllAndOverride<boolean>(ALLOW_MUST_CHANGE, targets)) {
      throw new ForbiddenException({
        code: 'PASSWORD_CHANGE_REQUIRED',
        message: 'Davom etishdan oldin parolni almashtiring',
      });
    }
    return true;
  }
}

/** 2-guard: `@Roles(...)`. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!roles?.length) return true;
    const user = context.switchToHttp().getRequest<AuthedRequest>().user;
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: "Bu amal uchun ruxsat yo'q" });
    }
    return true;
  }
}

/** 3-guard: `@RequirePermission(...)`. Qamrov (filial/o'z guruhi/o'z yozuvi) so'rov filtrida qo'llanadi, bu yerda emas. */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const codes = this.reflector.getAllAndOverride<PermissionCode[] | undefined>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!codes?.length) return true;
    const user = context.switchToHttp().getRequest<AuthedRequest>().user;
    if (!user) throw unauthorized('MISSING_TOKEN');
    for (const code of codes) {
      if (!(await this.permissions.has(user, code))) {
        throw new ForbiddenException({ code: 'FORBIDDEN', message: "Bu amal uchun ruxsat yo'q" });
      }
    }
    return true;
  }
}
