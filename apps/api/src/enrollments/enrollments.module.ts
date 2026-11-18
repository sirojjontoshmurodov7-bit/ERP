import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BillingModule } from '../billing/billing.module.js';
import { EnrollmentsController } from './enrollments.controller.js';
import { EnrollmentsService } from './enrollments.service.js';

@Module({ imports: [AuthModule, BillingModule], controllers: [EnrollmentsController], providers: [EnrollmentsService] })
export class EnrollmentsModule {}
