import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { idParamSchema } from '../centers/centers.schemas.js';
import { ZodPipe } from '../common/zod.pipe.js';
import {
  adjustRatingSchema,
  createAssignmentSchema,
  gradeSchema,
  listAssignmentsSchema,
  rankingQuerySchema,
  ratingEventsSchema,
  submitSchema,
  updateAssignmentSchema,
} from './academic.schemas.js';
import { AssignmentsService } from './assignments.service.js';
import { RatingsService } from './ratings.service.js';

const clientOf = (req: Request): ClientInfo => ({ ip: req.ip, userAgent: req.get('user-agent') });
const uuid = () => new ZodPipe(idParamSchema);

/** Vazifa (`homework.*`) va reyting (`rating.*`): aniq ruxsat va qamrov servislarda tekshiriladi; kassir kirmaydi. */
@Controller()
@Roles('OWNER', 'ADMIN', 'TEACHER', 'STUDENT')
export class AcademicController {
  constructor(
    private readonly assignments: AssignmentsService,
    private readonly ratings: RatingsService,
  ) {}

  // --- vazifa
  @Post('groups/:groupId/assignments')
  create(@CurrentUser() actor: AuthUser, @Param('groupId', uuid()) groupId: string, @Body(new ZodPipe(createAssignmentSchema)) body: z.infer<typeof createAssignmentSchema>, @Req() req: Request) {
    return this.assignments.create(actor, groupId, body, clientOf(req));
  }

  @Get('assignments')
  list(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(listAssignmentsSchema)) query: z.infer<typeof listAssignmentsSchema>) {
    return this.assignments.list(actor, query);
  }

  @Get('assignments/:id')
  get(@CurrentUser() actor: AuthUser, @Param('id', uuid()) assignmentId: string) {
    return this.assignments.get(actor, assignmentId);
  }

  @Patch('assignments/:id')
  update(@CurrentUser() actor: AuthUser, @Param('id', uuid()) assignmentId: string, @Body(new ZodPipe(updateAssignmentSchema)) body: z.infer<typeof updateAssignmentSchema>, @Req() req: Request) {
    return this.assignments.update(actor, assignmentId, body, clientOf(req));
  }

  @HttpCode(200)
  @Post('assignments/:id/archive')
  archive(@CurrentUser() actor: AuthUser, @Param('id', uuid()) assignmentId: string, @Req() req: Request) {
    return this.assignments.archive(actor, assignmentId, clientOf(req));
  }

  @HttpCode(200)
  @Post('assignments/:id/submission')
  submit(@CurrentUser() actor: AuthUser, @Param('id', uuid()) assignmentId: string, @Body(new ZodPipe(submitSchema)) body: z.infer<typeof submitSchema>) {
    return this.assignments.submit(actor, assignmentId, body);
  }

  @HttpCode(200)
  @Post('assignments/:id/submissions/:studentId/grade')
  grade(
    @CurrentUser() actor: AuthUser,
    @Param('id', uuid()) assignmentId: string,
    @Param('studentId', uuid()) studentId: string,
    @Body(new ZodPipe(gradeSchema)) body: z.infer<typeof gradeSchema>,
    @Req() req: Request,
  ) {
    return this.assignments.grade(actor, assignmentId, studentId, body, clientOf(req));
  }

  // --- reyting
  @Get('ratings')
  ranking(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(rankingQuerySchema)) query: z.infer<typeof rankingQuerySchema>) {
    return this.ratings.ranking(actor, query);
  }

  @Post('ratings/adjust')
  adjust(@CurrentUser() actor: AuthUser, @Body(new ZodPipe(adjustRatingSchema)) body: z.infer<typeof adjustRatingSchema>, @Req() req: Request) {
    return this.ratings.adjust(actor, body, clientOf(req));
  }

  @Get('ratings/students/:studentId/events')
  events(@CurrentUser() actor: AuthUser, @Param('studentId', uuid()) studentId: string, @Query(new ZodPipe(ratingEventsSchema)) query: z.infer<typeof ratingEventsSchema>) {
    return this.ratings.events(actor, studentId, query);
  }
}
