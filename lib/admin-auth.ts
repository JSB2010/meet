import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const PASSWORD_PREFIX = 'scrypt';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

export type AdminSessionPayload = {
  userId: string;
  email: string;
  role: 'owner' | 'admin';
  sessionVersion: number;
  exp: number;
};

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('base64url');
  const key = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${PASSWORD_PREFIX}:${salt}:${key.toString('base64url')}`;
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [prefix, salt, expectedKey] = passwordHash.split(':');
  if (prefix !== PASSWORD_PREFIX || !salt || !expectedKey) {
    return false;
  }

  const actual = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedKey, 'base64url');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function createAdminSessionToken(
  email: string,
  payload: AdminSessionPayload,
  secret: string,
): Promise<string> {
  const body = Buffer.from(JSON.stringify({ ...payload, email })).toString('base64url');
  const signature = sign(body, secret);
  return `${body}.${signature}`;
}

export function createAdminSessionPayload(
  user: {
    id: string;
    email: string;
    role: 'owner' | 'admin';
    sessionVersion: number;
  },
  now = new Date(),
): AdminSessionPayload {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionVersion: user.sessionVersion,
    exp: now.getTime() + SESSION_TTL_MS,
  };
}

export async function readAdminSessionToken(
  token: string | undefined,
  secret: string,
  now = new Date(),
): Promise<AdminSessionPayload | null> {
  if (!token) {
    return null;
  }

  const [body, signature] = token.split('.');
  if (!body || !signature || signature !== sign(body, secret)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as AdminSessionPayload;
    if (
      !payload.userId ||
      !payload.email ||
      !payload.role ||
      !payload.sessionVersion ||
      payload.exp <= now.getTime()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function sign(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url');
}
