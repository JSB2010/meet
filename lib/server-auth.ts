import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import {
  createAdminSessionPayload,
  createAdminSessionToken,
  readAdminSessionToken,
} from './admin-auth';
import { AdminUser, getAdminUserById, verifyAdminUserCredentials } from './admin-user-store';
import { getReadyDb } from './db';

export const ADMIN_SESSION_COOKIE = 'jacob_meet_host_session';

export type AdminSession = {
  userId: string;
  email: string;
  role: 'owner' | 'admin';
};

export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<AdminUser | null> {
  const db = await getReadyDb();
  return verifyAdminUserCredentials(db, email, password);
}

export async function getAdminSession(request: NextRequest): Promise<AdminSession | null> {
  const secret = getAuthSecret();
  if (!secret) {
    return null;
  }

  const payload = await readAdminSessionToken(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
    secret,
  );
  if (!payload) {
    return null;
  }

  const db = await getReadyDb();
  const user = await getAdminUserById(db, payload.userId);
  if (
    !user ||
    user.status !== 'active' ||
    user.sessionVersion !== payload.sessionVersion ||
    user.email !== payload.email
  ) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
}

export async function setAdminSessionCookie(
  response: NextResponse,
  user: AdminUser,
): Promise<void> {
  const secret = requireAuthSecret();
  const token = await createAdminSessionToken(user.email, createAdminSessionPayload(user), secret);
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
}

export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function requireAuthSecret(): string {
  const secret = getAuthSecret();
  if (!secret) {
    throw new Error('AUTH_SECRET is not defined');
  }
  return secret;
}

function getAuthSecret(): string | undefined {
  return process.env.AUTH_SECRET;
}
