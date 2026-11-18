import { Body, Controller, Get, Header, HttpCode, Param, Post, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import type { z } from 'zod';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { idParamSchema } from '../centers/centers.schemas.js';
import { MAX_FILE_BYTES } from '../common/spreadsheet.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { listImportsSchema, runImportSchema, type UploadedFile as Upload } from './imports.schemas.js';
import { ImportsService } from './imports.service.js';

const clientOf = (req: Request): ClientInfo => ({ ip: req.ip, userAgent: req.get('user-agent') });

/** Excel/CSV import: `import.run` servisda tekshiriladi (rahbar ✔, admin ○ o'z filialida). */
@Controller('imports')
@Roles('OWNER', 'ADMIN')
export class ImportsController {
  constructor(private readonly imports: ImportsService) {}

  /** multipart/form-data: `file` (.xlsx yoki .csv) + `type`, `branchId`, `dryRun`, `skipInvalid`. Javobda vaqtinchalik parollar bor: keshlanmaydi. */
  @Post()
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_BYTES, files: 1, fields: 10 } }))
  run(@CurrentUser() actor: AuthUser, @UploadedFile() file: Upload | undefined, @Body(new ZodPipe(runImportSchema)) body: z.infer<typeof runImportSchema>, @Req() req: Request) {
    return this.imports.run(actor, file, body, clientOf(req));
  }

  // `template` `:id` dan oldin bo'lishi shart
  @Get('template')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="oquvchilar-shablon.csv"')
  template(@CurrentUser() actor: AuthUser) {
    return this.imports.template(actor);
  }

  @Get()
  list(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(listImportsSchema)) query: z.infer<typeof listImportsSchema>) {
    return this.imports.list(actor, query);
  }

  @Get(':id')
  get(@CurrentUser() actor: AuthUser, @Param('id', new ZodPipe(idParamSchema)) id: string) {
    return this.imports.get(actor, id);
  }
}
