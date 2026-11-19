import { Controller, Get, Header, ServiceUnavailableException } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { Public } from './auth/decorators.js';
import { AppService } from './app.service.js';
import { DbService, NO_CONTEXT } from './db/db.service.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly db: DbService,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Konteyner/monitoring uchun: API va baza ulanishi. Ichki ma'lumot chiqarmaydi. */
  @Public()
  @Get('health')
  @Header('Cache-Control', 'no-store')
  async health() {
    try {
      await this.db.withContext(NO_CONTEXT, (tx) => tx.execute(sql`select 1`));
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException({ status: 'db_unavailable' });
    }
  }
}
