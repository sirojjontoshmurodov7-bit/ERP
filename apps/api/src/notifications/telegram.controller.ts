import { Body, Controller, ForbiddenException, Headers, HttpCode, Inject, NotFoundException, Post } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { Public } from '../auth/decorators.js';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { TelegramBotService } from './telegram-bot.service.js';

const safeEqual = (a: string, b: string): boolean => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** Telegram webhook. Autentifikatsiya: `x-telegram-bot-api-secret-token` (setWebhook'dagi `secret_token`). Sozlanmagan bo'lsa yo'l yopiq. */
@Controller('telegram')
export class TelegramController {
  constructor(
    private readonly bot: TelegramBotService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Public()
  @Post('webhook')
  @HttpCode(200)
  async webhook(@Headers('x-telegram-bot-api-secret-token') secret: string | undefined, @Body() body: unknown) {
    const expected = this.config.telegramWebhookSecret;
    if (!expected) throw new NotFoundException();
    if (typeof secret !== 'string' || !safeEqual(secret, expected)) throw new ForbiddenException({ code: 'FORBIDDEN', message: "Bu amal uchun ruxsat yo'q" });
    try {
      await this.bot.handleUpdate(body);
    } catch {
      // Telegram qayta yuborib yubormasligi uchun har doim 200 (xato kodi/ma'lumot logga yozilmaydi)
    }
    return { ok: true };
  }
}
