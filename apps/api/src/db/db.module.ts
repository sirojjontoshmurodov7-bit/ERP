import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import { DB, DB_OPTIONS, type Db, type DbOptions, DbService } from './db.service.js';
import * as schema from './schema.js';

@Global()
@Module({
  providers: [
    {
      provide: DB,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig): Db => drizzle(postgres(config.databaseUrl, { max: 10 }), { schema }),
    },
    { provide: DB_OPTIONS, useValue: {} satisfies DbOptions },
    DbService,
  ],
  exports: [DB, DB_OPTIONS, DbService],
})
export class DbModule {}
