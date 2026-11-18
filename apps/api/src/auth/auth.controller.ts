import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { ZodPipe } from '../common/zod.pipe.js';
import type { AuthUser } from './auth.types.js';
import { PermissionsService } from './permissions.service.js';
import { AuthService, type ClientInfo } from './auth.service.js';
import { AllowMustChangePassword, CurrentUser, Public } from './decorators.js';

const loginSchema = z.object({
  login: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(256),
});
const refreshSchema = z.object({ refreshToken: z.string().min(20).max(200) });
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(8, "Parol kamida 8 belgi bo'lsin").max(128),
});

const clientOf = (req: Request): ClientInfo => ({ ip: req.ip, userAgent: req.get('user-agent') });

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly perms: PermissionsService,
  ) {}

  @Public()
  @HttpCode(200)
  @Post('login')
  login(@Body(new ZodPipe(loginSchema)) body: z.infer<typeof loginSchema>, @Req() req: Request) {
    return this.auth.login({ ...body, ...clientOf(req) });
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  refresh(@Body(new ZodPipe(refreshSchema)) body: z.infer<typeof refreshSchema>, @Req() req: Request) {
    return this.auth.refresh(body.refreshToken, clientOf(req));
  }

  @AllowMustChangePassword()
  @HttpCode(204)
  @Post('logout')
  async logout(@CurrentUser() user: AuthUser, @Req() req: Request): Promise<void> {
    await this.auth.logout(user, clientOf(req));
  }

  @AllowMustChangePassword()
  @HttpCode(204)
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(changePasswordSchema)) body: z.infer<typeof changePasswordSchema>,
    @Req() req: Request,
  ): Promise<void> {
    await this.auth.changePassword(user, { ...body, ...clientOf(req) });
  }

  @AllowMustChangePassword()
  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    const { sessionId: _sessionId, ...profile } = user;
    // UI menyulari uchun samarali ruxsatlar va markaz nomi (ruxsat baribir har so'rovda serverda tekshiriladi)
    return { ...profile, permissions: await this.perms.effective(user), center: await this.auth.centerSummary(user) };
  }
}
