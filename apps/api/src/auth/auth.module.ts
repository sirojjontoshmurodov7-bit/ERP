import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard, PermissionsGuard, RolesGuard } from './guards.js';
import { LoginThrottle } from './login-throttle.js';
import { PermissionsService } from './permissions.service.js';
import { TokenService } from './token.service.js';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    PermissionsService,
    LoginThrottle,
    // Tartib muhim: avval autentifikatsiya, keyin rol, keyin ruxsat. Hamma marshrut sukut bo'yicha yopiq (@Public bilan ochiladi).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [PermissionsService],
})
export class AuthModule {}
