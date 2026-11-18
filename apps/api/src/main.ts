import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

// Lokal ishlab chiqarishda ildizdagi .env ni yuklaymiz (production'da o'zgaruvchilar muhitdan keladi).
const envFile = fileURLToPath(new URL('../../../.env', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  await app.listen(process.env.API_PORT ?? 3001);
}
await bootstrap();
