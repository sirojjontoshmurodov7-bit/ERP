import { Body, Controller, Delete, ForbiddenException, Get, Header, Headers, HttpCode, NotFoundException, Param, Post, Query, Req, ServiceUnavailableException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import type { z } from 'zod';
import { Inject } from '@nestjs/common';
import type { ClientInfo } from '../auth/auth.service.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser, Public, Roles } from '../auth/decorators.js';
import { PermissionsService } from '../auth/permissions.service.js';
import { idParamSchema } from '../centers/centers.schemas.js';
import { ZodPipe } from '../common/zod.pipe.js';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { DispatchService } from './dispatch.service.js';
import { listNotificationsSchema, runSchema, sendSchema } from './notifications.schemas.js';
import { NotificationsService } from './notifications.service.js';

const clientOf = (req: Request): ClientInfo => ({ ip: req.ip, userAgent: req.get('user-agent') });
const uuid = () => new ZodPipe(idParamSchema);

const safeEqual = (a: string, b: string): boolean => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** Telegram ulash, qo'lda xabar, jurnal va yuborishni ishga tushirish. Aniq ruxsat va qamrov servislarda tekshiriladi. */
@Controller()
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly dispatch: DispatchService,
    private readonly perms: PermissionsService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  // --- o'z hisobi (ruxsat kodi kerak emas)
  @Post('notifications/link-code')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @Roles('OWNER', 'ADMIN', 'CASHIER', 'TEACHER', 'STUDENT')
  myLinkCode(@CurrentUser() actor: AuthUser, @Req() req: Request) {
    return this.notifications.linkCode(actor, undefined, clientOf(req));
  }

  @Get('notifications/link')
  @Roles('OWNER', 'ADMIN', 'CASHIER', 'TEACHER', 'STUDENT')
  myStatus(@CurrentUser() actor: AuthUser) {
    return this.notifications.status(actor);
  }

  @Delete('notifications/link')
  @Roles('OWNER', 'ADMIN', 'CASHIER', 'TEACHER', 'STUDENT')
  myUnlink(@CurrentUser() actor: AuthUser, @Req() req: Request) {
    return this.notifications.unlink(actor, undefined, clientOf(req));
  }

  // --- boshqa foydalanuvchi uchun (`telegram.settings`)
  @Post('users/:userId/telegram/link-code')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @Roles('OWNER', 'ADMIN')
  linkCodeFor(@CurrentUser() actor: AuthUser, @Param('userId', uuid()) userId: string, @Req() req: Request) {
    return this.notifications.linkCode(actor, userId, clientOf(req));
  }

  @Delete('users/:userId/telegram')
  @Roles('OWNER', 'ADMIN')
  unlinkFor(@CurrentUser() actor: AuthUser, @Param('userId', uuid()) userId: string, @Req() req: Request) {
    return this.notifications.unlink(actor, userId, clientOf(req));
  }

  // --- xabar va jurnal (`notification.send`)
  @Post('notifications/send')
  @HttpCode(200)
  @Roles('OWNER', 'ADMIN')
  send(@CurrentUser() actor: AuthUser, @Body(new ZodPipe(sendSchema)) body: z.infer<typeof sendSchema>, @Req() req: Request) {
    return this.notifications.send(actor, body, clientOf(req));
  }

  @Get('notifications')
  @Roles('OWNER', 'ADMIN')
  list(@CurrentUser() actor: AuthUser, @Query(new ZodPipe(listNotificationsSchema)) query: z.infer<typeof listNotificationsSchema>) {
    return this.notifications.list(actor, query);
  }

  /** Rahbar o'z markazi uchun eslatmalarni hoziroq yuboradi (`notification.send`, faqat rahbar). */
  @Post('notifications/run')
  @HttpCode(200)
  @Roles('OWNER')
  async run(@CurrentUser() actor: AuthUser, @Body(new ZodPipe(runSchema)) body: z.infer<typeof runSchema>) {
    if (!(await this.perms.has(actor, 'notification.send'))) throw new ForbiddenException({ code: 'FORBIDDEN', message: "Bu amal uchun ruxsat yo'q" });
    if (!this.dispatch.isConfigured()) throw new ServiceUnavailableException({ code: 'TELEGRAM_NOT_CONFIGURED', message: 'Telegram bot sozlanmagan' });
    return this.dispatch.runForCenter(actor.centerId!, body);
  }

  /** Tashqi cron-trigger (masalan cron-job.org): hamma markaz uchun. Sir `x-cron-secret` sarlavhasida; sozlanmagan bo'lsa yo'l yopiq. */
  @Public()
  @Post('notifications/cron')
  @HttpCode(200)
  async cron(@Headers('x-cron-secret') secret: string | undefined, @Body(new ZodPipe(runSchema)) body: z.infer<typeof runSchema>) {
    const expected = this.config.cronSecret;
    if (!expected) throw new NotFoundException();
    if (typeof secret !== 'string' || !safeEqual(secret, expected)) throw new ForbiddenException({ code: 'FORBIDDEN', message: "Bu amal uchun ruxsat yo'q" });
    if (!this.dispatch.isConfigured()) throw new ServiceUnavailableException({ code: 'TELEGRAM_NOT_CONFIGURED', message: 'Telegram bot sozlanmagan' });
    return this.dispatch.runAll(body);
  }
}
