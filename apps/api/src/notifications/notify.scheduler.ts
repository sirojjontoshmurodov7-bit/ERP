import { Inject, Injectable, Logger, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { todayLocal } from '../common/dates.js';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { DispatchService } from './dispatch.service.js';

const TASHKENT_OFFSET_MS = 5 * 3_600_000;
const TICK_MS = 60_000;

/** Toshkent vaqti "HH:MM". */
export const localTime = (now: Date): string => new Date(now.getTime() + TASHKENT_OFFSET_MS).toISOString().slice(11, 16);

/**
 * Bugun ishga tushirish kerakmi: belgilangan vaqt o'tgan va bugun hali ishlamagan. Ishga tushirilishi kerak bo'lgan
 * Toshkent sanasini qaytaradi, aks holda null. Server vaqtdan keyin yoqilsa o'sha kuni bir marta ishlaydi.
 */
export function dueDay(now: Date, at: string, lastDay: string | null): string | null {
  const day = todayLocal(now);
  if (lastDay === day) return null;
  return localTime(now) >= at ? day : null;
}

/**
 * Ichki kundalik eslatma (`NOTIFY_DAILY_AT`, masalan 09:00): tashqi cron (cron-job.org) kerak emas.
 * Bir nechta API nusxasi bo'lsa ham takror xabar ketmaydi: `notification_log` dedupe kaliti yuborilganini eslab qoladi.
 */
@Injectable()
export class NotifyScheduler implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly log = new Logger('NotifyScheduler');
  private timer: NodeJS.Timeout | null = null;
  private lastDay: string | null = null;
  private busy = false;

  constructor(
    private readonly dispatch: DispatchService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  onApplicationBootstrap(): void {
    const at = this.config.notifyDailyAt;
    if (!at) return;
    // Ishga tushganda o'tgan vaqt uchun darrov ishlamaymiz: birinchi tekshiruv bir daqiqadan keyin
    this.timer = setInterval(() => void this.tick(), TICK_MS);
    this.timer.unref();
    this.log.log(`Kundalik eslatmalar har kuni ${at} da (Asia/Tashkent)`);
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** Bitta tekshiruv (testda to'g'ridan-to'g'ri chaqiriladi). Ishga tushgan bo'lsa true. */
  async tick(now: Date = new Date()): Promise<boolean> {
    const at = this.config.notifyDailyAt;
    if (!at || this.busy) return false;
    const day = dueDay(now, at, this.lastDay);
    if (!day) return false;
    this.busy = true;
    this.lastDay = day;
    try {
      const r = await this.dispatch.runAll({}, now);
      const sent = Object.values(r.totals).reduce((s, t) => s + t.sent, 0);
      const failed = Object.values(r.totals).reduce((s, t) => s + t.failed, 0);
      this.log.log(`Kundalik eslatmalar: ${r.centers} markaz, ${sent} yuborildi, ${failed} xato`);
    } catch (e) {
      this.log.error(`Kundalik eslatmalar xatosi: ${e instanceof Error ? e.message : 'noma\'lum'}`);
    } finally {
      this.busy = false;
    }
    return true;
  }
}
