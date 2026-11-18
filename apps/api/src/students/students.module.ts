import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BillingModule } from '../billing/billing.module.js';
import { StudentsController } from './students.controller.js';
import { StudentsService } from './students.service.js';

@Module({ imports: [AuthModule, BillingModule], controllers: [StudentsController], providers: [StudentsService] })
export class StudentsModule {}
