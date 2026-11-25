import { loadConfig, parseTrustProxy } from './app-config.js';

const env = { DATABASE_URL: 'postgres://x', JWT_ACCESS_SECRET: 'a'.repeat(20), JWT_REFRESH_SECRET: 'b'.repeat(20) };

describe('app config', () => {
  it('TRUST_PROXY: raqam hop soni bo\'ladi (Express "1" satrini IP deb o\'qiydi)', () => {
    expect(parseTrustProxy('1')).toBe(1);
    expect(parseTrustProxy('2')).toBe(2);
    expect(parseTrustProxy('true')).toBe(true);
    expect(parseTrustProxy('false')).toBe(false);
    expect(parseTrustProxy('loopback, 10.0.0.0/8')).toBe('loopback, 10.0.0.0/8');
    expect(loadConfig({ ...env, TRUST_PROXY: '1' }).trustProxy).toBe(1);
  });

  it('Telegram polling va kundalik vaqt', () => {
    expect(loadConfig(env).telegramPolling).toBe(false);
    expect(loadConfig({ ...env, TELEGRAM_POLLING: 'true' }).telegramPolling).toBe(true);
    expect(loadConfig({ ...env, TELEGRAM_POLLING: '1' }).telegramPolling).toBe(true);
    expect(loadConfig({ ...env, TELEGRAM_POLLING: '' }).telegramPolling).toBe(false);
    expect(loadConfig({ ...env, NOTIFY_DAILY_AT: '09:30' }).notifyDailyAt).toBe('09:30');
    expect(() => loadConfig({ ...env, NOTIFY_DAILY_AT: '9:30' })).toThrow(/NOTIFY_DAILY_AT/);
    expect(() => loadConfig({ ...env, NOTIFY_DAILY_AT: '24:00' })).toThrow(/NOTIFY_DAILY_AT/);
  });
});
