import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { idParamSchema } from '../centers/centers.schemas.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { createCourseSchema, listCoursesSchema, updateCourseSchema } from './courses.schemas.js';
import { CoursesService } from './courses.service.js';

const clientOf = (req: Request): ClientInfo => ({ ip: req.ip, userAgent: req.get('user-agent') });
const id = () => new ZodPipe(idParamSchema);

/** Aniq ruxsat (`group.create|edit|view`) servisda tekshiriladi. O'quvchi guruhlari yozilish modulidan keyin qo'shiladi. */
@Controller('courses')
@Roles('OWNER', 'ADMIN', 'CASHIER', 'TEACHER')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Post()
  create(@CurrentUser() actor: AuthUser, @Body(new ZodPipe(createCourseSchema)) body: z.infer<typeof createCourseSchema>, @Req() req: Request) {
    return this.courses.create(actor, body, clientOf(req));
  }

  @Get()
  list(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(listCoursesSchema)) query: z.infer<typeof listCoursesSchema>) {
    return this.courses.list(actor, query.includeArchived);
  }

  @Get(':id')
  get(@CurrentUser() actor: AuthUser, @Param('id', id()) courseId: string) {
    return this.courses.get(actor, courseId);
  }

  @Patch(':id')
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id', id()) courseId: string,
    @Body(new ZodPipe(updateCourseSchema)) body: z.infer<typeof updateCourseSchema>,
    @Req() req: Request,
  ) {
    return this.courses.update(actor, courseId, body, clientOf(req));
  }

  @HttpCode(200)
  @Post(':id/archive')
  archive(@CurrentUser() actor: AuthUser, @Param('id', id()) courseId: string, @Req() req: Request) {
    return this.courses.archive(actor, courseId, clientOf(req));
  }

  @HttpCode(200)
  @Post(':id/unarchive')
  unarchive(@CurrentUser() actor: AuthUser, @Param('id', id()) courseId: string, @Req() req: Request) {
    return this.courses.unarchive(actor, courseId, clientOf(req));
  }
}
