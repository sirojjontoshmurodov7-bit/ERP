import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BillingModule } from './billing/billing.module.js';
import { FinanceModule } from './finance/finance.module.js';
import { ImportsModule } from './imports/imports.module.js';
import { PayrollModule } from './payroll/payroll.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { BranchesModule } from './branches/branches.module.js';
import { CentersModule } from './centers/centers.module.js';
import { ConfigModule } from './config/app-config.js';
import { DbModule } from './db/db.module.js';
import { LessonsModule } from './lessons/lessons.module.js';
import { PermissionsAdminModule } from './permissions-admin/permissions-admin.module.js';
import { StudentsModule } from './students/students.module.js';
import { CoursesModule } from './courses/courses.module.js';
import { EnrollmentsModule } from './enrollments/enrollments.module.js';
import { GroupsModule } from './groups/groups.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [ConfigModule, DbModule, AuthModule, AuditModule, CentersModule, BranchesModule, UsersModule, StudentsModule, CoursesModule, GroupsModule, EnrollmentsModule, LessonsModule, BillingModule, PayrollModule, FinanceModule, ReportsModule, ImportsModule, PermissionsAdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
