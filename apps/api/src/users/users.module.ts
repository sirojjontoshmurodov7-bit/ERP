import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { StaffController, UserPasswordController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({ imports: [AuthModule], controllers: [StaffController, UserPasswordController], providers: [UsersService] })
export class UsersModule {}
