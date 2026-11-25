import { createHmac } from 'node:crypto';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { DbService, NO_CONTEXT } from '../db/db.service.js';

export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_WINDOW_SECONDS = 15 * 60;
/** Faqat login bo'yicha (IP'dan qat'i nazar): IP sarlavhasi soxtalashtirilsa ham bitta parolni cheksiz tanlab bo'lmaydi. */
export const LOGIN_ACCOUNT_MAX_FAILURES = 20;

/**
 * (ip + login) uchun oynada `LOGIN_MAX_FAILURES` xatodan keyin, faqat login uchun `LOGIN_ACCOUNT_MAX_FAILURES` dan keyin bloklaydi. Holat bazada (`login_throttle`), shuning uchun
 * ko'p nusxada ham umumiy. Kalit HMAC xesh (xom login/IP saqlanmaydi); jadvalga faqat tor SECURITY DEFINER funksiyalar tegadi.
 * Oyna birinchi xatodan boshlanadi va `LOGIN_WINDOW_SECONDS` dan keyin tozalanadi. Muvaffaqiyatli kirish hisoblagichni nolga tushiradi.
 */
@Injectable()
export class LoginThrottle {
  constructor(
    private readonly db: DbService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  private key(ip: string | undefined, login: string): string {
    return createHmac('sha256', this.config.accessSecret).update(`login-throttle:${ip ?? '-'}|${login.toLowerCase()}`).digest('hex');
  }

  private accountKey(login: string): string {
    return createHmac('sha256', this.config.accessSecret).update(`login-throttle-account:${login.toLowerCase()}`).digest('hex');
  }

  async assertAllowed(ip: string | undefined, login: string): Promise<void> {
    const blocked = await this.db.withContext(NO_CONTEXT, async (tx) => {
      const res = (await tx.execute(
        sql`select app_login_throttle_blocked(${this.key(ip, login)}, ${LOGIN_MAX_FAILURES}, ${LOGIN_WINDOW_SECONDS})
               or app_login_throttle_blocked(${this.accountKey(login)}, ${LOGIN_ACCOUNT_MAX_FAILURES}, ${LOGIN_WINDOW_SECONDS}) as blocked`,
      )) as unknown;
      const rows = Array.isArray(res) ? res : ((res as { rows?: unknown[] }).rows ?? []);
      return (rows[0] as { blocked?: boolean } | undefined)?.blocked === true;
    });
    if (blocked) {
      throw new HttpException({ code: 'TOO_MANY_ATTEMPTS', message: "Juda ko'p urinish. Keyinroq qayta urinib ko'ring" }, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  async recordFailure(ip: string | undefined, login: string): Promise<void> {
    await this.db.withContext(NO_CONTEXT, async (tx) => {
      await tx.execute(sql`select app_login_throttle_fail(${this.key(ip, login)}, ${LOGIN_WINDOW_SECONDS})`);
      await tx.execute(sql`select app_login_throttle_fail(${this.accountKey(login)}, ${LOGIN_WINDOW_SECONDS})`);
    });
  }

  async reset(ip: string | undefined, login: string): Promise<void> {
    await this.db.withContext(NO_CONTEXT, async (tx) => {
      await tx.execute(sql`select app_login_throttle_reset(${this.key(ip, login)})`);
      await tx.execute(sql`select app_login_throttle_reset(${this.accountKey(login)})`);
    });
  }
}
