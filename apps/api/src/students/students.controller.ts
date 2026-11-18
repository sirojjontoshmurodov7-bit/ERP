import { Body, Controller, Get, Header, HttpCode, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { idParamSchema } from '../centers/centers.schemas.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { createStudentSchema, listStudentsSchema, updateStudentSchema } from './students.schemas.js';
import { StudentsService } from './students.service.js';

const clientOf = (req: Request): ClientInfo => ({ ip: req.ip, userAgent: req.get('user-agent') });
const id = () => new ZodPipe(idParamSchema);

/** O'quvchilar. Aniq ruxsat (`student.*`) va filial qamrovi servisda tekshiriladi. Ustoz faqat o'z guruhlaridagi o'quvchilarni ko'radi (list/get). */
@Controller('students')
@Roles('OWNER', 'ADMIN', 'CASHIER')
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  // Javobda vaqtinchalik parol bor: kesh va oraliq saqlashga yo'l qo'yilmaydi.
  @Header('Cache-Control', 'no-store')
  @Post()
  create(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodPipe(createStudentSchema)) body: z.infer<typeof createStudentSchema>,
    @Req() req: Request,
  ) {
    return this.students.create(actor, body, clientOf(req));
  }

  @Roles('OWNER', 'ADMIN', 'CASHIER', 'TEACHER')
  @Get()
  list(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(listStudentsSchema)) query: z.infer<typeof listStudentsSchema>) {
    return this.students.list(actor, query);
  }

  @Roles('OWNER', 'ADMIN', 'CASHIER', 'TEACHER', 'STUDENT')
  @Get(':id')
  get(@CurrentUser() actor: AuthUser, @Param('id', id()) studentId: string) {
    return this.students.get(actor, studentId);
  }

  @Patch(':id')
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id', id()) studentId: string,
    @Body(new ZodPipe(updateStudentSchema)) body: z.infer<typeof updateStudentSchema>,
    @Req() req: Request,
  ) {
    return this.students.update(actor, studentId, body, clientOf(req));
  }

  @HttpCode(200)
  @Post(':id/archive')
  archive(@CurrentUser() actor: AuthUser, @Param('id', id()) studentId: string, @Req() req: Request) {
    return this.students.archive(actor, studentId, clientOf(req));
  }

  @HttpCode(200)
  @Post(':id/unarchive')
  unarchive(@CurrentUser() actor: AuthUser, @Param('id', id()) studentId: string, @Req() req: Request) {
    return this.students.unarchive(actor, studentId, clientOf(req));
  }
}
