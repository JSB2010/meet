import { randomUUID } from 'crypto';
import { hashPassword, verifyPassword } from './admin-auth';

export type AdminRole = 'owner' | 'admin';
export type AdminUserStatus = 'active' | 'disabled';

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  status: AdminUserStatus;
  sessionVersion: number;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
};

export type AdminUserWithPassword = AdminUser & {
  passwordHash: string;
};

export type Queryable = {
  query<T = unknown>(
    text: string,
    values?: unknown[],
  ): Promise<{
    rows: T[];
    rowCount: number;
  }>;
};

type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  password_hash: string;
  role: AdminRole;
  status: AdminUserStatus;
  session_version: number;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
};

export async function ensureAdminUserSchema(db: Queryable): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id text PRIMARY KEY,
      email text NOT NULL UNIQUE,
      name text,
      password_hash text NOT NULL,
      role text NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin')),
      status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
      session_version integer NOT NULL DEFAULT 1,
      created_by_email text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      last_login_at timestamptz
    )
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS admin_users_status_role_idx
    ON admin_users (status, role)
  `);
}

export async function bootstrapInitialAdminUser(
  db: Queryable,
  input: { emails?: string; password?: string; passwordHash?: string },
): Promise<AdminUser | null> {
  const count = await db.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM admin_users',
  );
  if (Number(count.rows[0]?.count ?? '0') > 0) {
    return null;
  }

  const email = parseBootstrapEmail(input.emails);
  const passwordHash =
    input.passwordHash ?? (input.password ? await hashPassword(input.password) : undefined);
  if (!email || !passwordHash) {
    return null;
  }

  return createAdminUserWithHash(db, {
    email,
    name: 'Owner',
    passwordHash,
    role: 'owner',
    createdByEmail: 'system',
  });
}

export async function createAdminUser(
  db: Queryable,
  input: {
    email: string;
    name: string;
    password: string;
    role: AdminRole;
    createdByEmail: string;
  },
): Promise<AdminUser> {
  return createAdminUserWithHash(db, {
    ...input,
    passwordHash: await hashPassword(input.password),
  });
}

export async function createAdminUserWithHash(
  db: Queryable,
  input: {
    email: string;
    name: string;
    passwordHash: string;
    role: AdminRole;
    createdByEmail: string;
  },
): Promise<AdminUser> {
  const result = await db.query<AdminUserRow>(
    `
      INSERT INTO admin_users (id, email, name, password_hash, role, created_by_email)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, name, password_hash, role, status, session_version, created_at, updated_at, last_login_at
    `,
    [
      randomUUID(),
      normalizeEmail(input.email),
      input.name.trim(),
      input.passwordHash,
      input.role,
      input.createdByEmail,
    ],
  );

  return mapAdminUser(result.rows[0]);
}

export async function listAdminUsers(db: Queryable): Promise<AdminUser[]> {
  const result = await db.query<AdminUserRow>(`
    SELECT id, email, name, password_hash, role, status, session_version, created_at, updated_at, last_login_at
    FROM admin_users
    ORDER BY created_at ASC
  `);

  return result.rows.map(mapAdminUser);
}

export async function getAdminUserByEmail(
  db: Queryable,
  email: string,
): Promise<AdminUserWithPassword | null> {
  const result = await db.query<AdminUserRow>(
    `
      SELECT id, email, name, password_hash, role, status, session_version, created_at, updated_at, last_login_at
      FROM admin_users
      WHERE email = $1
      LIMIT 1
    `,
    [normalizeEmail(email)],
  );

  return result.rows[0] ? mapAdminUserWithPassword(result.rows[0]) : null;
}

export async function getAdminUserById(
  db: Queryable,
  id: string,
): Promise<AdminUserWithPassword | null> {
  const result = await db.query<AdminUserRow>(
    `
      SELECT id, email, name, password_hash, role, status, session_version, created_at, updated_at, last_login_at
      FROM admin_users
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ? mapAdminUserWithPassword(result.rows[0]) : null;
}

export async function verifyAdminUserCredentials(
  db: Queryable,
  email: string,
  password: string,
): Promise<AdminUser | null> {
  const user = await getAdminUserByEmail(db, email);
  if (!user || user.status !== 'active') {
    return null;
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return null;
  }

  await db.query('UPDATE admin_users SET last_login_at = now() WHERE id = $1', [user.id]);
  return user;
}

export async function setAdminUserPassword(
  db: Queryable,
  id: string,
  password: string,
): Promise<AdminUser | null> {
  const result = await db.query<AdminUserRow>(
    `
      UPDATE admin_users
      SET password_hash = $1, session_version = session_version + 1, updated_at = now()
      WHERE id = $2
      RETURNING id, email, name, password_hash, role, status, session_version, created_at, updated_at, last_login_at
    `,
    [await hashPassword(password), id],
  );

  return result.rows[0] ? mapAdminUser(result.rows[0]) : null;
}

export async function setAdminUserStatus(
  db: Queryable,
  id: string,
  status: AdminUserStatus,
): Promise<AdminUser | null> {
  const result = await db.query<AdminUserRow>(
    `
      UPDATE admin_users
      SET status = $1, session_version = session_version + 1, updated_at = now()
      WHERE id = $2
      RETURNING id, email, name, password_hash, role, status, session_version, created_at, updated_at, last_login_at
    `,
    [status, id],
  );

  return result.rows[0] ? mapAdminUser(result.rows[0]) : null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function parseBootstrapEmail(value: string | undefined): string | undefined {
  return value?.split(',').map(normalizeEmail).filter(Boolean)[0];
}

function mapAdminUser(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? '',
    role: row.role,
    status: row.status,
    sessionVersion: row.session_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
  };
}

function mapAdminUserWithPassword(row: AdminUserRow): AdminUserWithPassword {
  return {
    ...mapAdminUser(row),
    passwordHash: row.password_hash,
  };
}
