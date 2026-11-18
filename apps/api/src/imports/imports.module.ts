import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BillingModule } from '../billing/billing.module.js';
import { ImportsController } from './imports.controller.js';
import { ImportsService } from './imports.service.js';

@Module({
  imports: [AuthModule, BillingModule],
  controllers: [ImportsController],
  providers: [ImportsService],
})
export class ImportsModule {}
