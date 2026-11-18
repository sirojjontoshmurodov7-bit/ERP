import { createHmac, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ROLES } from '@erp/shared';
import { APP_CONFIG, type AppConfig } from '../config/app-config.js';
import type { AccessClaims } from './auth.types.js';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  get accessTtlSeconds(): number {
    return this.config.accessTtlSeconds;
  }

  get refreshTtlSeconds(): number {
    return this.config.refreshTtlSeconds;
  }

  signAccess(claims: AccessClaims): Promise<string> {
    return this.jwt.signAsync(
      { ...claims },
      { secret: this.config.accessSecret, expiresIn: this.config.accessTtlSeconds, algorithm: 'HS256' },
    );
  }

  async verifyAccess(token: string): Promise<AccessClaims> {
    const p = await this.jwt.verifyAsync<Partial<AccessClaims>>(token, {
      secret: this.config.accessSecret,
      algorithms: ['HS256'],
    });
    const validRole = typeof p.role === 'string' && (ROLES as readonly string[]).includes(p.role);
    if (typeof p.sub !== 'string' || typeof p.sid !== 'string' || !validRole || (p.cid != null && typeof p.cid !== 'string')) {
      throw new Error('Malformed access token');
    }
    return { sub: p.sub, sid: p.sid, cid: p.cid ?? null, role: p.role as AccessClaims['role'] };
  }

  /** Refresh token JWT emas: tasodifiy 256 bit; bazada faqat HMAC xeshi saqlanadi. */
  newRefreshToken(): string {
    return randomBytes(32).toString('base64url');
  }

  hashRefresh(token: string): string {
    return createHmac('sha256', this.config.refreshSecret).update(token).digest('hex');
  }
}
