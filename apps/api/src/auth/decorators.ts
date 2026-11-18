import { createParamDecorator, type ExecutionContext, SetMetadata } from '@nestjs/common';
import type { PermissionCode, Role } from '@erp/shared';
import type { AuthedRequest, AuthUser } from './auth.types.js';

export const IS_PUBLIC = 'auth:public';
export const ALLOW_MUST_CHANGE = 'auth:allow-must-change';
export const ROLES_KEY = 'auth:roles';
export const PERMISSIONS_KEY = 'auth:permissions';

/** Tokensiz kirish mumkin (login, refresh, health). */
export const Public = () => SetMetadata(IS_PUBLIC, true);
/** Parol almashtirilmaguncha ham chaqirish mumkin (me, logout, change-password). */
export const AllowMustChangePassword = () => SetMetadata(ALLOW_MUST_CHANGE, true);
/** Ro'yxatdagi rollardan biri bo'lishi kerak. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
/** Barcha ko'rsatilgan ruxsatlar samarali bo'lishi kerak (rol shabloni ± foydalanuvchi istisnosi). */
export const RequirePermission = (...codes: PermissionCode[]) => SetMetadata(PERMISSIONS_KEY, codes);

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  const user = ctx.switchToHttp().getRequest<AuthedRequest>().user;
  if (!user) throw new Error('CurrentUser used on a route without authentication');
  return user;
});
