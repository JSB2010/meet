import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

export type AdminRole = 'owner' | 'admin';

export type AdminSessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  groups: string[];
  exp: number;
};

export type RoleGroups = {
  ownerGroup: string;
  adminGroup: string;
};

export function createAdminSessionPayload(
  user: {
    userId: string;
    email: string;
    name?: string;
    role: AdminRole;
    groups: string[];
  },
  now = new Date(),
): AdminSessionPayload {
  return {
    userId: user.userId,
    email: user.email,
    name: user.name?.trim() || user.email,
    role: user.role,
    groups: normalizeGroups(user.groups),
    exp: now.getTime() + SESSION_TTL_MS,
  };
}

export async function createAdminSessionToken(
  payload: AdminSessionPayload,
  secret: string,
): Promise<string> {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = sign(body, secret);
  return `${body}.${signature}`;
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
  if (!body || !signature || !isValidSignature(signature, sign(body, secret))) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as AdminSessionPayload;
    if (
      !payload.userId ||
      !payload.email ||
      !payload.name ||
      (payload.role !== 'owner' && payload.role !== 'admin') ||
      !Array.isArray(payload.groups) ||
      payload.exp <= now.getTime()
    ) {
      return null;
    }
    return {
      ...payload,
      groups: normalizeGroups(payload.groups),
    };
  } catch {
    return null;
  }
}

export function normalizeGroups(value: unknown): string[] {
  if (Array.isArray(value)) {
    return [...new Set(value.flatMap((item) => normalizeGroups(item)))];
  }
  if (typeof value !== 'string') {
    return [];
  }
  return [
    ...new Set(
      value
        .split(/[,\s]+/)
        .map((group) => group.trim())
        .filter(Boolean),
    ),
  ];
}

export function resolveAdminRole(groups: unknown, roleGroups: RoleGroups): AdminRole | null {
  const normalizedGroups = normalizeGroups(groups);
  if (normalizedGroups.includes(roleGroups.ownerGroup)) {
    return 'owner';
  }
  if (normalizedGroups.includes(roleGroups.adminGroup)) {
    return 'admin';
  }
  return null;
}

function sign(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url');
}

function isValidSignature(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return (
    actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
  );
}
