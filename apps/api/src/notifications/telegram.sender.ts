import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';

export type SendResult = { ok: true } | { ok: false; code: string; blocked?: boolean };

/**
 * Telegram bilan aloqa shu interfeys orqasida: testlarda soxta, ishlab chiqarishda `HttpTelegramSender`.
 * Natijada token va xabar matni hech qachon xato kodiga tushmaydi.
 */
export abstract class TelegramSender {
  /** Token berilganmi (yo'q bo'lsa yuborishga urinmaymiz). */
  abstract isConfigured(): boolean;
  abstract send(chatId: number, text: string): Promise<SendResult>;
}

/** Bot API `sendMessage` (kutubxonasiz: bizga faqat shu bitta chaqiriq kerak). */
@Injectable()
export class HttpTelegramSender extends TelegramSender {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {
    super();
  }

  isConfigured(): boolean {
    return Boolean(this.config.telegramBotToken);
  }

  async send(chatId: number, text: string): Promise<SendResult> {
    const token = this.config.telegramBotToken;
    if (!token) return { ok: false, code: 'NOT_CONFIGURED' };
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) return { ok: true };
      if (res.status === 403) return { ok: false, code: 'BLOCKED', blocked: true }; // foydalanuvchi botni to'sgan
      if (res.status === 429) return { ok: false, code: 'RATE_LIMITED' };
      return { ok: false, code: `TELEGRAM_${res.status}` };
    } catch {
      return { ok: false, code: 'NETWORK' };
    }
  }
}
