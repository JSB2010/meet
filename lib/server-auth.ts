import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import {
  AdminRole,
  AdminSessionPayload,
  createAdminSessionPayload,
  createAdminSessionToken,
  readAdminSessionToken,
} from './admin-auth';

export const ADMIN_SESSION_COOKIE = 'jacob_meet_host_session';

export type AdminSession = {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  groups: string[];
};

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

  return {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    groups: payload.groups,
  };
}

export async function setAdminSessionCookie(
  response: NextResponse,
  user: {
    userId: string;
    email: string;
    name?: string;
    role: AdminRole;
    groups: string[];
  },
): Promise<void> {
  const secret = requireAuthSecret();
  const token = await createAdminSessionToken(createAdminSessionPayload(user), secret);
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

export function sessionToResponse(session: AdminSession | null) {
  return {
    authenticated: Boolean(session),
    email: session?.email ?? null,
    name: session?.name ?? null,
    role: session?.role ?? null,
    userId: session?.userId ?? null,
    groups: session?.groups ?? [],
  };
}

export function payloadToSession(payload: AdminSessionPayload): AdminSession {
  return {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    groups: payload.groups,
  };
}

function getAuthSecret(): string | undefined {
  return process.env.AUTH_SECRET;
}
