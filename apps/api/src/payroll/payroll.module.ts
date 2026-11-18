import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BillingModule } from '../billing/billing.module.js';
import { PayoutsService } from './payouts.service.js';
import { PayrollRulesService } from './payroll-rules.service.js';
import { PayrollController } from './payroll.controller.js';
import { PayrollService } from './payroll.service.js';

@Module({
  imports: [AuthModule, BillingModule],
  controllers: [PayrollController],
  providers: [PayrollRulesService, PayrollService, PayoutsService],
})
export class PayrollModule {}
