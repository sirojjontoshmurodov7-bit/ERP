import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BranchesModule } from './branches/branches.module.js';
import { CentersModule } from './centers/centers.module.js';
import { ConfigModule } from './config/app-config.js';
import { DbModule } from './db/db.module.js';
import { PermissionsAdminModule } from './permissions-admin/permissions-admin.module.js';
import { StudentsModule } from './students/students.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [ConfigModule, DbModule, AuthModule, AuditModule, CentersModule, BranchesModule, UsersModule, StudentsModule, PermissionsAdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
