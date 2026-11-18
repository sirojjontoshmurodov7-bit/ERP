import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

/**
 * Xotirada ishlovchi oddiy cheklov: (ip + login) uchun oynada MAX_FAILURES xatodan keyin bloklaydi.
 * Bitta nusxali deploy uchun yetarli; ko'p nusxaga o'tilganda umumiy xotiraga (Redis/baza) ko'chiriladi.
 */
@Injectable()
export class LoginThrottle {
  private readonly failures = new Map<string, { count: number; resetAt: number }>();

  private readonly maxFailures = 5;
  private readonly windowMs = 15 * 60_000;

  private key(ip: string | undefined, login: string): string {
    return `${ip ?? '-'}|${login.toLowerCase()}`;
  }

  assertAllowed(ip: string | undefined, login: string, now = Date.now()): void {
    const entry = this.failures.get(this.key(ip, login));
    if (entry && entry.resetAt > now && entry.count >= this.maxFailures) {
      throw new HttpException(
        { code: 'TOO_MANY_ATTEMPTS', message: "Juda ko'p urinish. Keyinroq qayta urinib ko'ring" },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  recordFailure(ip: string | undefined, login: string, now = Date.now()): void {
    const k = this.key(ip, login);
    const entry = this.failures.get(k);
    if (!entry || entry.resetAt <= now) this.failures.set(k, { count: 1, resetAt: now + this.windowMs });
    else entry.count += 1;
    if (this.failures.size > 10_000) this.prune(now);
  }

  reset(ip: string | undefined, login: string): void {
    this.failures.delete(this.key(ip, login));
  }

  private prune(now: number): void {
    for (const [k, v] of this.failures) if (v.resetAt <= now) this.failures.delete(k);
  }
}
