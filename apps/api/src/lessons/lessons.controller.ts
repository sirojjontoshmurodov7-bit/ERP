import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { idParamSchema } from '../centers/centers.schemas.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { attendanceQuerySchema, createLessonSchema, listLessonsSchema, markAttendanceSchema, updateLessonSchema } from './lessons.schemas.js';
import { LessonsService } from './lessons.service.js';

const clientOf = (req: Request): ClientInfo => ({ ip: req.ip, userAgent: req.get('user-agent') });
const id = () => new ZodPipe(idParamSchema);

/** Aniq ruxsat (`attendance.mark|view`) va qamrov servisda tekshiriladi. Kassir davomatga kirmaydi. */
@Controller()
@Roles('OWNER', 'ADMIN', 'TEACHER')
export class LessonsController {
  constructor(private readonly lessons: LessonsService) {}

  @Post('groups/:groupId/lessons')
  createLesson(
    @CurrentUser() actor: AuthUser,
    @Param('groupId', id()) groupId: string,
    @Body(new ZodPipe(createLessonSchema)) body: z.infer<typeof createLessonSchema>,
    @Req() req: Request,
  ) {
    return this.lessons.createLesson(actor, groupId, body, clientOf(req));
  }

  @Roles('OWNER', 'ADMIN', 'TEACHER', 'STUDENT')
  @Get('groups/:groupId/lessons')
  listLessons(
    @CurrentUser() actor: AuthUser,
    @Param('groupId', id()) groupId: string,
    @Query(new ZodPipe(listLessonsSchema)) query: z.infer<typeof listLessonsSchema>,
  ) {
    return this.lessons.listLessons(actor, groupId, query);
  }

  @Roles('OWNER', 'ADMIN', 'TEACHER', 'STUDENT')
  @Get('lessons/:id')
  getLesson(@CurrentUser() actor: AuthUser, @Param('id', id()) lessonId: string) {
    return this.lessons.getLesson(actor, lessonId);
  }

  @Patch('lessons/:id')
  updateLesson(
    @CurrentUser() actor: AuthUser,
    @Param('id', id()) lessonId: string,
    @Body(new ZodPipe(updateLessonSchema)) body: z.infer<typeof updateLessonSchema>,
    @Req() req: Request,
  ) {
    return this.lessons.updateLesson(actor, lessonId, body, clientOf(req));
  }

  /** Bir so'rovda ko'p o'quvchi; qayta yuborilsa yangilaydi. */
  @Put('lessons/:id/attendance')
  markAttendance(
    @CurrentUser() actor: AuthUser,
    @Param('id', id()) lessonId: string,
    @Body(new ZodPipe(markAttendanceSchema)) body: z.infer<typeof markAttendanceSchema>,
    @Req() req: Request,
  ) {
    return this.lessons.markAttendance(actor, lessonId, body, clientOf(req));
  }

  @Roles('OWNER', 'ADMIN', 'TEACHER', 'STUDENT')
  @Get('attendance')
  listAttendance(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(attendanceQuerySchema)) query: z.infer<typeof attendanceQuerySchema>) {
    return this.lessons.listAttendance(actor, query);
  }

  /** Yig'ma: guruh berilsa o'quvchilar kesimida, aks holda guruhlar kesimida. */
  @Roles('OWNER', 'ADMIN', 'TEACHER', 'STUDENT')
  @Get('attendance/summary')
  attendanceSummary(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(attendanceQuerySchema)) query: z.infer<typeof attendanceQuerySchema>) {
    return this.lessons.attendanceSummary(actor, query);
  }
}
