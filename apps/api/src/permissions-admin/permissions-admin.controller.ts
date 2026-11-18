import { Body, Controller, Get, Param, Put, Req } from '@nestjs/common';
import type { TenantRole } from '@erp/shared';
import type { Request } from 'express';
import type { z } from 'zod';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser, RequirePermission } from '../auth/decorators.js';
import { idParamSchema } from '../centers/centers.schemas.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { roleParamSchema, setRolePermissionsSchema, setUserPermissionsSchema } from './permissions-admin.schemas.js';
import { PermissionsAdminService } from './permissions-admin.service.js';

const clientOf = (req: Request): ClientInfo => ({ ip: req.ip, userAgent: req.get('user-agent') });

/** Ruxsatlarni sozlash: faqat `permissions.manage` (rahbar). Faqat ○ kodlar o'zgaradi. */
@Controller('permissions')
@RequirePermission('permissions.manage')
export class PermissionsAdminController {
  constructor(private readonly svc: PermissionsAdminService) {}

  @Get('roles')
  roles(@CurrentUser() actor: AuthUser) {
    return this.svc.roleMatrix(actor);
  }

  @Put('roles/:role')
  setRole(
    @CurrentUser() actor: AuthUser,
    @Param('role', new ZodPipe(roleParamSchema)) role: TenantRole,
    @Body(new ZodPipe(setRolePermissionsSchema)) body: z.infer<typeof setRolePermissionsSchema>,
    @Req() req: Request,
  ) {
    return this.svc.setRole(actor, role, body.permissions, clientOf(req));
  }

  @Get('users/:id')
  user(@CurrentUser() actor: AuthUser, @Param('id', new ZodPipe(idParamSchema)) userId: string) {
    return this.svc.userMatrix(actor, userId);
  }

  @Put('users/:id')
  setUser(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ZodPipe(idParamSchema)) userId: string,
    @Body(new ZodPipe(setUserPermissionsSchema)) body: z.infer<typeof setUserPermissionsSchema>,
    @Req() req: Request,
  ) {
    return this.svc.setUser(actor, userId, body.permissions, clientOf(req));
  }
}
