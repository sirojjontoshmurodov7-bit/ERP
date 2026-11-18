import { Module } from '@nestjs/common';
import { CenterSettingsController } from './center-settings.controller.js';
import { CenterSettingsService } from './center-settings.service.js';
import { CentersController } from './centers.controller.js';
import { CentersService } from './centers.service.js';

@Module({ controllers: [CentersController, CenterSettingsController], providers: [CentersService, CenterSettingsService] })
export class CentersModule {}
