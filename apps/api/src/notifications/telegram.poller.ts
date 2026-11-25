import { Inject, Injectable, Logger, type OnApplicationBootstrap, type OnApplicationShutdown, Optional } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { TelegramBotService } from './telegram-bot.service.js';

/** Testda soxta `fetch` berish uchun. */
export const TELEGRAM_FETCH = Symbol('TELEGRAM_FETCH');
type FetchFn = typeof fetch;

const POLL_TIMEOUT_S = 25;
const MAX_BACKOFF_MS = 60_000;

/** Bot menyusidagi buyruqlar (setMyCommands). */
export const BOT_COMMANDS = [
  { command: 'start', description: "Akkauntni ulash: /start KOD" },
  { command: 'stop', description: "Bildirishnomalarni o'chirish" },
  { command: 'help', description: 'Yordam' },
];

interface Update {
  update_id: number;
}

/**
 * Long polling (getUpdates): webhook o'rniga, ommaviy HTTPS manzil kerak emas (lokal ishlab chiqish, oddiy VPS).
 * `TELEGRAM_POLLING=true` va token bo'lsa ishga tushadi. Faqat bitta API nusxasida yoqing: ikkinchisi 409 oladi.
 * Token, xabar matni va chat ma'lumoti logga yozilmaydi.
 */
@Injectable()
export class TelegramPoller implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly log = new Logger('TelegramPoller');
  private readonly fetchFn: FetchFn;
  private abort: AbortController | null = null;
  private loop: Promise<void> | null = null;
  private offset = 0;

  constructor(
    private readonly bot: TelegramBotService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Optional() @Inject(TELEGRAM_FETCH) fetchFn?: FetchFn,
  ) {
    this.fetchFn = fetchFn ?? ((...a) => fetch(...a));
  }

  get enabled(): boolean {
    return Boolean(this.config.telegramPolling && this.config.telegramBotToken);
  }

  onApplicationBootstrap(): void {
    if (!this.enabled) return;
    if (this.config.telegramWebhookSecret) this.log.warn('TELEGRAM_POLLING yoqilgan: webhook o\'chiriladi (ikkalasi birga ishlamaydi)');
    this.abort = new AbortController();
    this.loop = this.run(this.abort.signal);
  }

  async onApplicationShutdown(): Promise<void> {
    this.abort?.abort();
    await this.loop?.catch(() => {});
    this.loop = null;
  }

  private async run(signal: AbortSignal): Promise<void> {
    await this.prepare(signal);
    let backoff = 1000;
    while (!signal.aborted) {
      try {
        await this.pollOnce(signal);
        backoff = 1000;
      } catch (e) {
        if (signal.aborted) break;
        this.log.warn(`getUpdates xatosi (${e instanceof Error ? e.message : 'noma\'lum'}), ${Math.round(backoff / 1000)} s dan keyin qayta`);
        await sleep(backoff, signal);
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      }
    }
  }

  /** Webhook'ni olib tashlaydi (aks holda getUpdates 409) va buyruqlar menyusini o'rnatadi. Xato bo'lsa davom etamiz. */
  async prepare(signal?: AbortSignal): Promise<void> {
    try {
      await this.call('deleteWebhook', { drop_pending_updates: false }, signal);
      await this.call('setMyCommands', { commands: BOT_COMMANDS }, signal);
      this.log.log('Telegram long polling ishga tushdi');
    } catch (e) {
      this.log.warn(`Botni tayyorlash xatosi: ${e instanceof Error ? e.message : 'noma\'lum'}`);
    }
  }

  /** Bitta getUpdates sikli: har yangilanish bot mantiqiga uzatiladi, offset oldinga suriladi. Qayta ishlangan yangilanishlar soni. */
  async pollOnce(signal?: AbortSignal): Promise<number> {
    const updates = await this.call<Update[]>('getUpdates', { offset: this.offset, timeout: POLL_TIMEOUT_S, allowed_updates: ['message'] }, signal, (POLL_TIMEOUT_S + 10) * 1000);
    for (const u of updates) {
      this.offset = Math.max(this.offset, u.update_id + 1);
      try {
        await this.bot.handleUpdate(u);
      } catch {
        // bitta yangilanish xatosi qolganlarini to'xtatmaydi (ma'lumot logga yozilmaydi)
      }
    }
    return updates.length;
  }

  private async call<T = unknown>(method: string, body: object, signal?: AbortSignal, timeoutMs = 15_000): Promise<T> {
    const timeout = AbortSignal.timeout(timeoutMs);
    const res = await this.fetchFn(`https://api.telegram.org/bot${this.config.telegramBotToken}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (!res.ok) throw new Error(`${method} HTTP ${res.status}`); // 401: token noto'g'ri, 409: boshqa nusxa yoki webhook
    const json = (await res.json()) as { ok: boolean; result: T };
    if (!json.ok) throw new Error(`${method} ok=false`);
    return json.result;
  }
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      resolve();
    }, { once: true });
  });
}
