import type { Role } from '@erp/shared';
import type { Request } from 'express';

export interface AuthUser {
  id: string;
  login: string;
  fullName: string;
  role: Role;
  centerId: string | null;
  sessionId: string;
  mustChangePassword: boolean;
}

export interface AccessClaims {
  sub: string; // user id
  sid: string; // session id
  cid: string | null; // center id
  role: Role;
}

export type AuthedRequest = Request & { user?: AuthUser };

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// `app_auth_find_user` / `app_auth_find_session` xom qatorlari
export interface UserRow {
  id: string;
  center_id: string | null;
  role: Role;
  login: string;
  password_hash: string;
  must_change_password: boolean;
  full_name: string;
  status: string;
}

export interface SessionRow {
  id: string;
  user_id: string;
  center_id: string | null;
  expires_at: string | Date;
  revoked_at: string | Date | null;
}
