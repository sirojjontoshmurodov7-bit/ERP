import { Body, Controller, Get, HttpCode, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { idParamSchema } from '../centers/centers.schemas.js';
import { ZodPipe } from '../common/zod.pipe.js';
import {
  assignTeacherSchema,
  createGroupSchema,
  endTeacherSchema,
  listGroupsSchema,
  setScheduleSchema,
  updateGroupSchema,
} from './groups.schemas.js';
import { GroupsService } from './groups.service.js';

const clientOf = (req: Request): ClientInfo => ({ ip: req.ip, userAgent: req.get('user-agent') });
const id = () => new ZodPipe(idParamSchema);

/** Aniq ruxsat (`group.create|edit|billing_settings|view`) va qamrov servisda tekshiriladi. O'quvchi faqat o'z guruhlarini ko'radi (list/get). */
@Controller('groups')
@Roles('OWNER', 'ADMIN', 'CASHIER', 'TEACHER')
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Post()
  create(@CurrentUser() actor: AuthUser, @Body(new ZodPipe(createGroupSchema)) body: z.infer<typeof createGroupSchema>, @Req() req: Request) {
    return this.groups.create(actor, body, clientOf(req));
  }

  @Roles('OWNER', 'ADMIN', 'CASHIER', 'TEACHER', 'STUDENT')
  @Get()
  list(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(listGroupsSchema)) query: z.infer<typeof listGroupsSchema>) {
    return this.groups.list(actor, query);
  }

  @Roles('OWNER', 'ADMIN', 'CASHIER', 'TEACHER', 'STUDENT')
  @Get(':id')
  get(@CurrentUser() actor: AuthUser, @Param('id', id()) groupId: string) {
    return this.groups.get(actor, groupId);
  }

  @Patch(':id')
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id', id()) groupId: string,
    @Body(new ZodPipe(updateGroupSchema)) body: z.infer<typeof updateGroupSchema>,
    @Req() req: Request,
  ) {
    return this.groups.update(actor, groupId, body, clientOf(req));
  }

  @HttpCode(200)
  @Post(':id/archive')
  archive(@CurrentUser() actor: AuthUser, @Param('id', id()) groupId: string, @Req() req: Request) {
    return this.groups.archive(actor, groupId, clientOf(req));
  }

  @HttpCode(200)
  @Post(':id/unarchive')
  unarchive(@CurrentUser() actor: AuthUser, @Param('id', id()) groupId: string, @Req() req: Request) {
    return this.groups.unarchive(actor, groupId, clientOf(req));
  }

  /** Dars jadvalini to'liq almashtiradi. */
  @Put(':id/schedule')
  setSchedule(
    @CurrentUser() actor: AuthUser,
    @Param('id', id()) groupId: string,
    @Body(new ZodPipe(setScheduleSchema)) body: z.infer<typeof setScheduleSchema>,
    @Req() req: Request,
  ) {
    return this.groups.setSchedule(actor, groupId, body.schedule, clientOf(req));
  }

  @HttpCode(200)
  @Post(':id/teachers')
  assignTeacher(
    @CurrentUser() actor: AuthUser,
    @Param('id', id()) groupId: string,
    @Body(new ZodPipe(assignTeacherSchema)) body: z.infer<typeof assignTeacherSchema>,
    @Req() req: Request,
  ) {
    return this.groups.assignTeacher(actor, groupId, body, clientOf(req));
  }

  @HttpCode(200)
  @Post(':id/teachers/:teacherId/end')
  endTeacher(
    @CurrentUser() actor: AuthUser,
    @Param('id', id()) groupId: string,
    @Param('teacherId', id()) teacherId: string,
    @Body(new ZodPipe(endTeacherSchema)) body: z.infer<typeof endTeacherSchema>,
    @Req() req: Request,
  ) {
    return this.groups.endTeacher(actor, groupId, teacherId, body.toDate, clientOf(req));
  }
}
