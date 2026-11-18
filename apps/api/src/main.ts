import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { APP_CONFIG, type AppConfig } from './config/app-config.js';

// Lokal ishlab chiqarishda ildizdagi .env ni yuklaymiz (production'da o'zgaruvchilar muhitdan keladi).
const envFile = fileURLToPath(new URL('../../../.env', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<AppConfig>(APP_CONFIG);
  if (config.trustProxy !== undefined) app.set('trust proxy', config.trustProxy);
  app.disable('x-powered-by');
  app.enableShutdownHooks();
  await app.listen(config.port);
}
await bootstrap();
