import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AcademicController } from './academic.controller.js';
import { AssignmentsService } from './assignments.service.js';
import { RatingsService } from './ratings.service.js';

@Module({
  imports: [AuthModule],
  controllers: [AcademicController],
  providers: [AssignmentsService, RatingsService],
})
export class AcademicModule {}
