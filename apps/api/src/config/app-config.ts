import { Global, Module } from '@nestjs/common';
import { z } from 'zod';

export const APP_CONFIG = Symbol('APP_CONFIG');

export interface AppConfig {
  databaseUrl: string;
  port: number;
  accessSecret: string;
  refreshSecret: string;
  accessTtlSeconds: number;
  refreshTtlSeconds: number;
  /** Telegram (21-qadam): hammasi ixtiyoriy; token bo'lmasa yuborish "sozlanmagan" xatosi bilan tugaydi. */
  telegramBotToken?: string;
  telegramBotUsername?: string;
  telegramWebhookSecret?: string;
  /** Tashqi cron-trigger (POST /notifications/cron) sirri. */
  cronSecret?: string;
}

const UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86400 } as const;

export function parseDuration(value: string): number {
  const m = /^(\d+)([smhd])$/.exec(value.trim());
  if (!m) throw new Error(`Invalid duration "${value}" (use e.g. 15m, 12h, 30d)`);
  return Number(m[1]) * UNIT_SECONDS[m[2] as keyof typeof UNIT_SECONDS];
}

/** Bo'sh qator (.env.example dagi `KEY=`) "berilmagan" deb olinadi. */
const optionalEnv = <T extends z.ZodType>(schema: T) => z.preprocess((v) => (v === '' ? undefined : v), schema.optional());

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  API_PORT: z.coerce.number().int().positive().default(3001),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  TELEGRAM_BOT_TOKEN: optionalEnv(z.string().min(10)),
  TELEGRAM_BOT_USERNAME: optionalEnv(z.string().min(3)),
  TELEGRAM_WEBHOOK_SECRET: optionalEnv(z.string().regex(/^[A-Za-z0-9_-]{16,256}$/)),
  CRON_SECRET: optionalEnv(z.string().min(16)),
  NODE_ENV: z.string().optional(),
});

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((i) => i.path.join('.')))].join(', ');
    throw new Error(`Invalid environment configuration: ${fields}`);
  }
  const e = parsed.data;
  if (e.NODE_ENV === 'production') {
    for (const secret of [e.JWT_ACCESS_SECRET, e.JWT_REFRESH_SECRET]) {
      if (secret.startsWith('change-me')) throw new Error('Placeholder JWT secret used in production');
    }
  }
  return {
    databaseUrl: e.DATABASE_URL,
    port: e.API_PORT,
    accessSecret: e.JWT_ACCESS_SECRET,
    refreshSecret: e.JWT_REFRESH_SECRET,
    accessTtlSeconds: parseDuration(e.JWT_ACCESS_TTL),
    refreshTtlSeconds: parseDuration(e.JWT_REFRESH_TTL),
    telegramBotToken: e.TELEGRAM_BOT_TOKEN,
    telegramBotUsername: e.TELEGRAM_BOT_USERNAME?.replace(/^@/, ''),
    telegramWebhookSecret: e.TELEGRAM_WEBHOOK_SECRET,
    cronSecret: e.CRON_SECRET,
  };
}

@Global()
@Module({
  providers: [{ provide: APP_CONFIG, useFactory: () => loadConfig() }],
  exports: [APP_CONFIG],
})
export class ConfigModule {}
