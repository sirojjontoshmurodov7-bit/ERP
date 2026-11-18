import { Module } from '@nestjs/common';
import { PermissionsAdminController } from './permissions-admin.controller.js';
import { PermissionsAdminService } from './permissions-admin.service.js';

@Module({ controllers: [PermissionsAdminController], providers: [PermissionsAdminService] })
export class PermissionsAdminModule {}
