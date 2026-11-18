import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ExpensesService } from './expenses.service.js';
import { FinanceController } from './finance.controller.js';
import { FinanceReportService } from './finance-report.service.js';

@Module({
  imports: [AuthModule],
  controllers: [FinanceController],
  providers: [ExpensesService, FinanceReportService],
})
export class FinanceModule {}
