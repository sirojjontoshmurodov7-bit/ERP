import type { AppConfig } from '../config/app-config.js';
import { dueDay, localTime, NotifyScheduler } from './notify.scheduler.js';
import type { TelegramBotService } from './telegram-bot.service.js';
import { BOT_COMMANDS, TelegramPoller } from './telegram.poller.js';
import type { DispatchService } from './dispatch.service.js';

const base: AppConfig = { databaseUrl: 'x', port: 0, accessSecret: 'a', refreshSecret: 'b', accessTtlSeconds: 1, refreshTtlSeconds: 1 };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('TelegramPoller', () => {
  it('faqat polling yoqilgan va token bor bo\'lsa ishlaydi', () => {
    const bot = {} as TelegramBotService;
    expect(new TelegramPoller(bot, { ...base, telegramPolling: true }).enabled).toBe(false);
    expect(new TelegramPoller(bot, { ...base, telegramBotToken: 't-123456789' }).enabled).toBe(false);
    expect(new TelegramPoller(bot, { ...base, telegramPolling: true, telegramBotToken: 't-123456789' }).enabled).toBe(true);
  });

  it('yangilanishlarni botga uzatadi, offsetni suradi, bitta xato qolganini to\'xtatmaydi', async () => {
    const handled: number[] = [];
    const bot = {
      handleUpdate: (u: { update_id: number }) => {
        handled.push(u.update_id);
        return u.update_id === 11 ? Promise.reject(new Error('x')) : Promise.resolve();
      },
    } as unknown as TelegramBotService;
    const calls: { url: string; body: Record<string, unknown> }[] = [];
    const batches = [[{ update_id: 10 }, { update_id: 11 }, { update_id: 12 }], []];
    const fake = (url: string, init?: { body?: string }) => {
      calls.push({ url: url, body: JSON.parse(init?.body ?? '{}') as Record<string, unknown> });
      return Promise.resolve(json({ ok: true, result: batches.shift() ?? [] }));
    };
    const p = new TelegramPoller(bot, { ...base, telegramPolling: true, telegramBotToken: 'TOKEN-123456' }, fake as unknown as typeof fetch);
    expect(await p.pollOnce()).toBe(3);
    expect(handled).toEqual([10, 11, 12]);
    expect(await p.pollOnce()).toBe(0);
    expect(calls[0]!.url).toBe('https://api.telegram.org/botTOKEN-123456/getUpdates');
    expect(calls[0]!.body).toMatchObject({ offset: 0, timeout: 25, allowed_updates: ['message'] });
    expect(calls[1]!.body.offset).toBe(13);
  });

  it('HTTP xatosida token xabarga tushmaydi', async () => {
    const fake = () => Promise.resolve(json({ ok: false }, 401));
    const p = new TelegramPoller({} as TelegramBotService, { ...base, telegramPolling: true, telegramBotToken: 'SECRET-TOKEN-1' }, fake as unknown as typeof fetch);
    const err = await p.pollOnce().catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe('getUpdates HTTP 401');
    expect((err as Error).message).not.toContain('SECRET');
  });

  it('tayyorlashda webhook o\'chiriladi va buyruqlar o\'rnatiladi', async () => {
    const methods: string[] = [];
    const fake = (url: string, init?: { body?: string }) => {
      methods.push(url.split('/').pop()!);
      if (url.endsWith('setMyCommands')) expect(JSON.parse(init?.body ?? '{}')).toEqual({ commands: BOT_COMMANDS });
      return Promise.resolve(json({ ok: true, result: true }));
    };
    await new TelegramPoller({} as TelegramBotService, { ...base, telegramPolling: true, telegramBotToken: 't-123456789' }, fake as unknown as typeof fetch).prepare();
    expect(methods).toEqual(['deleteWebhook', 'setMyCommands']);
  });
});

describe('NotifyScheduler', () => {
  // 2026-11-26 03:59 UTC = 08:59 Toshkent
  const at = (iso: string) => new Date(iso);
  it('Toshkent vaqti va kun', () => {
    expect(localTime(at('2026-11-26T03:59:00Z'))).toBe('08:59');
    expect(dueDay(at('2026-11-26T03:59:00Z'), '09:00', null)).toBeNull();
    expect(dueDay(at('2026-11-26T04:00:00Z'), '09:00', null)).toBe('2026-11-26');
    expect(dueDay(at('2026-11-26T10:00:00Z'), '09:00', '2026-11-26')).toBeNull();
    // 19:30 UTC = ertasi 00:30 Toshkent: yangi kun, lekin vaqt hali kelmagan
    expect(dueDay(at('2026-11-26T19:30:00Z'), '09:00', '2026-11-26')).toBeNull();
  });

  it('kuniga bir marta ishga tushiradi, xato bo\'lsa ham qulf ochiladi', async () => {
    let runs = 0;
    const dispatch = {
      runAll: () => {
        runs++;
        return runs === 1 ? Promise.resolve({ centers: 1, failedCenters: 0, totals: { DEBT: { sent: 1, failed: 0 } } }) : Promise.reject(new Error('db'));
      },
    } as unknown as DispatchService;
    const s = new NotifyScheduler(dispatch, { ...base, notifyDailyAt: '09:00' });
    expect(await s.tick(at('2026-11-26T03:00:00Z'))).toBe(false);
    expect(await s.tick(at('2026-11-26T04:01:00Z'))).toBe(true);
    expect(await s.tick(at('2026-11-26T05:00:00Z'))).toBe(false);
    expect(await s.tick(at('2026-11-27T04:05:00Z'))).toBe(true);
    expect(runs).toBe(2);
    expect(await new NotifyScheduler(dispatch, base).tick(at('2026-11-26T04:01:00Z'))).toBe(false);
  });
});
