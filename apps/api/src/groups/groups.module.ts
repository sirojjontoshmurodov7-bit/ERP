import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BillingModule } from '../billing/billing.module.js';
import { GroupsController } from './groups.controller.js';
import { GroupsService } from './groups.service.js';

@Module({ imports: [AuthModule, BillingModule], controllers: [GroupsController], providers: [GroupsService] })
export class GroupsModule {}
