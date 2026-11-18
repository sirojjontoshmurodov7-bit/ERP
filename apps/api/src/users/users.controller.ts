import { Body, Controller, Get, Header, HttpCode, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser, RequirePermission, Roles } from '../auth/decorators.js';
import { idParamSchema } from '../centers/centers.schemas.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { createStaffSchema, listStaffSchema, updateStaffSchema } from './users.schemas.js';
import { UsersService } from './users.service.js';

const clientOf = (req: Request): ClientInfo => ({ ip: req.ip, userAgent: req.get('user-agent') });
const id = () => new ZodPipe(idParamSchema);

/** Xodimlar (admin, kassir, ustoz). Aniq ruxsat (`staff.create` / `teacher.create` / `teacher.edit`) rolga qarab servisda tekshiriladi. */
@Controller('staff')
@Roles('OWNER', 'ADMIN')
export class StaffController {
  constructor(private readonly users: UsersService) {}

  // Javobda vaqtinchalik parol bor: kesh va oraliq saqlashga yo'l qo'yilmaydi.
  @Header('Cache-Control', 'no-store')
  @Post()
  create(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodPipe(createStaffSchema)) body: z.infer<typeof createStaffSchema>,
    @Req() req: Request,
  ) {
    return this.users.create(actor, body, clientOf(req));
  }

  @Get()
  list(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(listStaffSchema)) query: z.infer<typeof listStaffSchema>) {
    return this.users.list(actor, query);
  }

  @Get(':id')
  get(@CurrentUser() actor: AuthUser, @Param('id', id()) userId: string) {
    return this.users.get(actor, userId);
  }

  @Patch(':id')
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id', id()) userId: string,
    @Body(new ZodPipe(updateStaffSchema)) body: z.infer<typeof updateStaffSchema>,
    @Req() req: Request,
  ) {
    return this.users.update(actor, userId, body, clientOf(req));
  }
}

@Controller('users')
export class UserPasswordController {
  constructor(private readonly users: UsersService) {}

  @RequirePermission('user.reset_password')
  @Header('Cache-Control', 'no-store')
  @HttpCode(200)
  @Post(':id/reset-password')
  resetPassword(@CurrentUser() actor: AuthUser, @Param('id', id()) userId: string, @Req() req: Request) {
    return this.users.resetPassword(actor, userId, clientOf(req));
  }
}
