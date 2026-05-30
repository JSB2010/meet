import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSessionToken, readAdminSessionToken, verifyPassword } from './admin-auth';

export const ADMIN_SESSION_COOKIE = 'jacob_meet_host_session';

export async function authenticateAdmin(email: string, password: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  const allowedEmails = getAdminEmails();
  if (!allowedEmails.includes(normalizedEmail)) {
    return false;
  }

  const passwordHash = process.env.HOST_ADMIN_PASSWORD_HASH;
  if (passwordHash) {
    return verifyPassword(password, passwordHash);
  }

  const configuredPassword = process.env.HOST_ADMIN_PASSWORD;
  if (!configuredPassword) {
    return false;
  }

  return safeEqual(password, configuredPassword);
}

export async function getAdminSession(request: NextRequest): Promise<{ email: string } | null> {
  const secret = getAuthSecret();
  if (!secret) {
    return null;
  }

  return readAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value, secret);
}

export async function setAdminSessionCookie(response: NextResponse, email: string): Promise<void> {
  const secret = requireAuthSecret();
  const token = await createAdminSessionToken(email.trim().toLowerCase(), secret);
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

function getAdminEmails(): string[] {
  return (process.env.HOST_ADMIN_EMAILS ?? process.env.HOST_ADMIN_EMAIL ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function safeEqual(value: string, expected: string): boolean {
  const valueDigest = createHmac('sha256', expected).update(value).digest();
  const expectedDigest = createHmac('sha256', expected).update(expected).digest();
  return timingSafeEqual(valueDigest, expectedDigest);
}
