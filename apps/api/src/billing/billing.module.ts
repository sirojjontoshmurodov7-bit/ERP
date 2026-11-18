import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AllocatorService } from './allocator.js';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';
import { ChargesService } from './charges.service.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';

@Module({
  imports: [AuthModule],
  controllers: [BillingController, PaymentsController],
  providers: [AllocatorService, BillingService, ChargesService, PaymentsService],
  exports: [BillingService],
})
export class BillingModule {}
