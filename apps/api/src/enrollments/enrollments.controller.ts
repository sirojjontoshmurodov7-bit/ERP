import { Body, Controller, Get, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { idParamSchema } from '../centers/centers.schemas.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { createEnrollmentSchema, leaveEnrollmentSchema, listEnrollmentsSchema, transferEnrollmentSchema } from './enrollments.schemas.js';
import { EnrollmentsService } from './enrollments.service.js';

const clientOf = (req: Request): ClientInfo => ({ ip: req.ip, userAgent: req.get('user-agent') });
const id = () => new ZodPipe(idParamSchema);

/** Ko'rish: `group.view` + qamrov (ustoz o'z guruhi, o'quvchi o'zi). O'zgartirish: `enrollment.manage` (servisda). */
@Controller('enrollments')
@Roles('OWNER', 'ADMIN')
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  @Post()
  create(@CurrentUser() actor: AuthUser, @Body(new ZodPipe(createEnrollmentSchema)) body: z.infer<typeof createEnrollmentSchema>, @Req() req: Request) {
    return this.enrollments.create(actor, body, clientOf(req));
  }

  @Roles('OWNER', 'ADMIN', 'CASHIER', 'TEACHER', 'STUDENT')
  @Get()
  list(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(listEnrollmentsSchema)) query: z.infer<typeof listEnrollmentsSchema>) {
    return this.enrollments.list(actor, query);
  }

  @Roles('OWNER', 'ADMIN', 'CASHIER', 'TEACHER', 'STUDENT')
  @Get(':id')
  get(@CurrentUser() actor: AuthUser, @Param('id', id()) enrollmentId: string) {
    return this.enrollments.get(actor, enrollmentId);
  }

  @HttpCode(200)
  @Post(':id/freeze')
  freeze(@CurrentUser() actor: AuthUser, @Param('id', id()) enrollmentId: string, @Req() req: Request) {
    return this.enrollments.freeze(actor, enrollmentId, clientOf(req));
  }

  @HttpCode(200)
  @Post(':id/unfreeze')
  unfreeze(@CurrentUser() actor: AuthUser, @Param('id', id()) enrollmentId: string, @Req() req: Request) {
    return this.enrollments.unfreeze(actor, enrollmentId, clientOf(req));
  }

  @HttpCode(200)
  @Post(':id/leave')
  leave(
    @CurrentUser() actor: AuthUser,
    @Param('id', id()) enrollmentId: string,
    @Body(new ZodPipe(leaveEnrollmentSchema)) body: z.infer<typeof leaveEnrollmentSchema>,
    @Req() req: Request,
  ) {
    return this.enrollments.leave(actor, enrollmentId, body, clientOf(req));
  }

  @HttpCode(200)
  @Post(':id/transfer')
  transfer(
    @CurrentUser() actor: AuthUser,
    @Param('id', id()) enrollmentId: string,
    @Body(new ZodPipe(transferEnrollmentSchema)) body: z.infer<typeof transferEnrollmentSchema>,
    @Req() req: Request,
  ) {
    return this.enrollments.transfer(actor, enrollmentId, body, clientOf(req));
  }
}
