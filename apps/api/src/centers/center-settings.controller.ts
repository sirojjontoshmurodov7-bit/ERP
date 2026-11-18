import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { z } from 'zod';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { updateCenterSettingsSchema } from './center-settings.schemas.js';
import { CenterSettingsService } from './center-settings.service.js';

const clientOf = (req: Request): ClientInfo => ({ ip: req.ip, userAgent: req.get('user-agent') });

/** O'z markazi sozlamalari: ruxsat kodi yo'q, rol bilan cheklangan (o'qish: rahbar, admin; o'zgartirish: faqat rahbar). */
@Controller('center/settings')
export class CenterSettingsController {
  constructor(private readonly settings: CenterSettingsService) {}

  @Roles('OWNER', 'ADMIN')
  @Get()
  get(@CurrentUser() actor: AuthUser) {
    return this.settings.get(actor);
  }

  @Roles('OWNER')
  @Patch()
  update(@CurrentUser() actor: AuthUser, @Body(new ZodPipe(updateCenterSettingsSchema)) body: z.infer<typeof updateCenterSettingsSchema>, @Req() req: Request) {
    return this.settings.update(actor, body, clientOf(req));
  }
}
