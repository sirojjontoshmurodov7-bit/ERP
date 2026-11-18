import { ForbiddenException, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { and, eq, isNull, ne, sql } from 'drizzle-orm';
import { writeAudit } from '../audit/audit.js';
import { contextOf, DbService, NO_CONTEXT, type Tx } from '../db/db.service.js';
import { rowsOf } from '../db/rows.js';
import { centers, sessions, users } from '../db/schema.js';
import type { AuthUser, SessionRow, TokenPair, UserRow } from './auth.types.js';
import { LoginThrottle } from './login-throttle.js';
import { hashPassword, verifyAgainstDummy, verifyPassword } from './password.js';
import { TokenService } from './token.service.js';

export interface ClientInfo {
  ip?: string;
  userAgent?: string;
}

export interface LoginResult extends TokenPair {
  mustChangePassword: boolean;
  user: { id: string; login: string; fullName: string; role: string; centerId: string | null };
}

const invalidCredentials = () =>
  new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: "Login yoki parol noto'g'ri" });
const invalidRefresh = () =>
  new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN', message: 'Sessiya yaroqsiz, qayta kiring' });
const centerBlocked = () =>
  new ForbiddenException({ code: 'CENTER_BLOCKED', message: 'Markaz bloklangan' });
const accountInactive = () =>
  new ForbiddenException({ code: 'ACCOUNT_INACTIVE', message: 'Akkaunt faol emas' });

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DbService,
    private readonly tokens: TokenService,
    private readonly throttle: LoginThrottle,
  ) {}

  async login(input: { login: string; password: string } & ClientInfo): Promise<LoginResult> {
    await this.throttle.assertAllowed(input.ip, input.login);

    // Kirishdan oldin tenant noma'lum: faqat tor SECURITY DEFINER funksiya orqali qidiramiz.
    const found = rowsOf<UserRow>(
      await this.db.withContext(NO_CONTEXT, (tx) => tx.execute(sql`select * from app_auth_find_user(${input.login})`)),
    )[0];

    if (!found) {
      await verifyAgainstDummy(input.password);
      await this.throttle.recordFailure(input.ip, input.login);
      throw invalidCredentials();
    }

    const ctx = contextOf(found.center_id, found.role);

    if (!(await verifyPassword(found.password_hash, input.password))) {
      await this.throttle.recordFailure(input.ip, input.login);
      await this.db.withContext(ctx, (tx) =>
        writeAudit(tx, {
          centerId: found.center_id,
          actorId: found.id,
          action: 'auth.login_failed',
          entity: 'user',
          entityId: found.id,
          ip: input.ip,
        }),
      );
      throw invalidCredentials();
    }
    if (found.status !== 'ACTIVE') throw accountInactive();

    const result = await this.db.withContext(ctx, async (tx) => {
      if (found.center_id) {
        const [center] = await tx.select({ status: centers.status }).from(centers).where(eq(centers.id, found.center_id));
        if (!center || center.status === 'BLOCKED') return null;
      }
      const pair = await this.createSession(tx, found, input);
      await tx.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, found.id));
      await writeAudit(tx, {
        centerId: found.center_id,
        actorId: found.id,
        action: 'auth.login',
        entity: 'user',
        entityId: found.id,
        ip: input.ip,
      });
      return pair;
    });
    if (!result) throw centerBlocked();

    await this.throttle.reset(input.ip, input.login);
    return {
      ...result,
      mustChangePassword: found.must_change_password,
      user: {
        id: found.id,
        login: found.login,
        fullName: found.full_name,
        role: found.role,
        centerId: found.center_id,
      },
    };
  }

  /** Refresh rotatsiyasi: har safar yangi sessiya, eskisi bekor. Bekor qilingan token qayta kelsa, hamma sessiya yopiladi. */
  async refresh(refreshToken: string, client: ClientInfo): Promise<TokenPair> {
    const hash = this.tokens.hashRefresh(refreshToken);
    const session = rowsOf<SessionRow>(
      await this.db.withContext(NO_CONTEXT, (tx) => tx.execute(sql`select * from app_auth_find_session(${hash})`)),
    )[0];
    if (!session) throw invalidRefresh();

    // Markazsiz sessiya faqat super admin'niki.
    const ctx = session.center_id ? { centerId: session.center_id, isSuperAdmin: false } : { centerId: null, isSuperAdmin: true };

    const outcome = await this.db.withContext(ctx, async (tx) => {
      const revokeAll = () =>
        tx.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, session.user_id), isNull(sessions.revokedAt)));

      if (session.revoked_at) {
        await revokeAll();
        await writeAudit(tx, {
          centerId: session.center_id,
          actorId: session.user_id,
          action: 'auth.refresh_reuse_detected',
          entity: 'session',
          entityId: session.id,
          ip: client.ip,
        });
        return { kind: 'invalid' } as const;
      }
      if (new Date(session.expires_at).getTime() <= Date.now()) return { kind: 'invalid' } as const;

      const [row] = await tx
        .select({ user: users, centerStatus: centers.status })
        .from(users)
        .leftJoin(centers, eq(centers.id, users.centerId))
        .where(eq(users.id, session.user_id));
      if (!row || row.user.status !== 'ACTIVE') {
        await revokeAll();
        return { kind: 'inactive' } as const;
      }
      if (row.centerStatus === 'BLOCKED') {
        await revokeAll();
        return { kind: 'blocked' } as const;
      }

      await tx.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, session.id));
      const pair = await this.createSession(
        tx,
        { id: row.user.id, center_id: row.user.centerId, role: row.user.role as UserRow['role'] },
        client,
      );
      return { kind: 'ok', pair } as const;
    });

    if (outcome.kind === 'blocked') throw centerBlocked();
    if (outcome.kind === 'inactive') throw accountInactive();
    if (outcome.kind === 'invalid') throw invalidRefresh();
    return outcome.pair;
  }

  async logout(user: AuthUser, client: ClientInfo): Promise<void> {
    await this.db.withContext(contextOf(user.centerId, user.role), async (tx) => {
      await tx.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.id, user.sessionId), isNull(sessions.revokedAt)));
      await writeAudit(tx, {
        centerId: user.centerId,
        actorId: user.id,
        action: 'auth.logout',
        entity: 'session',
        entityId: user.sessionId,
        ip: client.ip,
      });
    });
  }

  async changePassword(user: AuthUser, input: { currentPassword: string; newPassword: string } & ClientInfo): Promise<void> {
    if (input.currentPassword === input.newPassword) {
      throw new BadRequestException({ code: 'PASSWORD_UNCHANGED', message: 'Yangi parol joriy paroldan farq qilishi kerak' });
    }
    const newHash = await hashPassword(input.newPassword);

    const ok = await this.db.withContext(contextOf(user.centerId, user.role), async (tx) => {
      const [row] = await tx.select({ hash: users.passwordHash }).from(users).where(eq(users.id, user.id));
      if (!row || !(await verifyPassword(row.hash, input.currentPassword))) return false;

      await tx.update(users).set({ passwordHash: newHash, mustChangePassword: false, updatedAt: new Date() }).where(eq(users.id, user.id));
      // Boshqa barcha qurilmalardagi sessiyalar yopiladi, joriysi qoladi.
      await tx
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(sessions.userId, user.id), ne(sessions.id, user.sessionId), isNull(sessions.revokedAt)));
      await writeAudit(tx, {
        centerId: user.centerId,
        actorId: user.id,
        action: 'user.password_changed',
        entity: 'user',
        entityId: user.id,
        ip: input.ip,
      });
      return true;
    });
    if (!ok) throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: "Joriy parol noto'g'ri" });
  }

  private async createSession(
    tx: Tx,
    user: Pick<UserRow, 'id' | 'center_id' | 'role'>,
    client: ClientInfo,
  ): Promise<TokenPair> {
    const refreshToken = this.tokens.newRefreshToken();
    const [created] = await tx
      .insert(sessions)
      .values({
        userId: user.id,
        centerId: user.center_id,
        refreshHash: this.tokens.hashRefresh(refreshToken),
        expiresAt: new Date(Date.now() + this.tokens.refreshTtlSeconds * 1000),
        ip: client.ip ?? null,
        userAgent: client.userAgent?.slice(0, 300) ?? null,
      })
      .returning({ id: sessions.id });
    const accessToken = await this.tokens.signAccess({ sub: user.id, sid: created!.id, cid: user.center_id, role: user.role });
    return { accessToken, refreshToken, expiresIn: this.tokens.accessTtlSeconds };
  }
}
