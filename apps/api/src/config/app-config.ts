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
}

const UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86400 } as const;

export function parseDuration(value: string): number {
  const m = /^(\d+)([smhd])$/.exec(value.trim());
  if (!m) throw new Error(`Invalid duration "${value}" (use e.g. 15m, 12h, 30d)`);
  return Number(m[1]) * UNIT_SECONDS[m[2] as keyof typeof UNIT_SECONDS];
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  API_PORT: z.coerce.number().int().positive().default(3001),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
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
  };
}

@Global()
@Module({
  providers: [{ provide: APP_CONFIG, useFactory: () => loadConfig() }],
  exports: [APP_CONFIG],
})
export class ConfigModule {}
