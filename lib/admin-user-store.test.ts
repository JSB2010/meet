import { describe, expect, it } from 'vitest';
import {
  bootstrapInitialAdminUser,
  createAdminUser,
  getAdminUserByEmail,
  setAdminUserPassword,
  verifyAdminUserCredentials,
} from './admin-user-store';
import { verifyPassword } from './admin-auth';

class FakeDb {
  calls: Array<{ text: string; values: unknown[] }> = [];
  queuedRows: unknown[][] = [];

  async query<T = unknown>(
    text: string,
    values: unknown[] = [],
  ): Promise<{ rows: T[]; rowCount: number }> {
    this.calls.push({ text, values });
    const rows = (this.queuedRows.shift() ?? []) as T[];
    return { rows, rowCount: rows.length };
  }
}

const userRow = {
  id: 'user_123',
  email: 'admin@example.com',
  name: 'Admin',
  password_hash: 'hash',
  role: 'owner',
  status: 'active',
  session_version: 1,
  created_at: new Date('2026-01-01T00:00:00.000Z'),
  updated_at: new Date('2026-01-01T00:00:00.000Z'),
  last_login_at: null,
};

describe('admin user store', () => {
  it('creates users with normalized emails and hashed passwords', async () => {
    const db = new FakeDb();
    db.queuedRows = [[userRow]];

    const user = await createAdminUser(db, {
      email: ' ADMIN@example.COM ',
      name: 'Admin',
      password: 'secret password',
      role: 'owner',
      createdByEmail: 'system',
    });

    expect(user.email).toBe('admin@example.com');
    expect(db.calls[0].values[1]).toBe('admin@example.com');
    expect(await verifyPassword('secret password', db.calls[0].values[3] as string)).toBe(true);
  });

  it('finds users by normalized email', async () => {
    const db = new FakeDb();
    db.queuedRows = [[userRow]];

    const user = await getAdminUserByEmail(db, ' ADMIN@example.COM ');

    expect(user?.email).toBe('admin@example.com');
    expect(db.calls[0].values).toEqual(['admin@example.com']);
  });

  it('verifies active user credentials and rejects disabled users', async () => {
    const passwordHash = await import('./admin-auth').then(({ hashPassword }) =>
      hashPassword('correct password'),
    );
    const db = new FakeDb();
    db.queuedRows = [[{ ...userRow, password_hash: passwordHash }], []];

    await expect(
      verifyAdminUserCredentials(db, 'admin@example.com', 'correct password'),
    ).resolves.toMatchObject({
      email: 'admin@example.com',
    });

    db.queuedRows = [[{ ...userRow, password_hash: passwordHash, status: 'disabled' }]];
    await expect(
      verifyAdminUserCredentials(db, 'admin@example.com', 'correct password'),
    ).resolves.toBeNull();
  });

  it('increments session version when changing a password', async () => {
    const db = new FakeDb();
    db.queuedRows = [[{ ...userRow, session_version: 2 }]];

    const user = await setAdminUserPassword(db, 'user_123', 'new password');

    expect(user?.sessionVersion).toBe(2);
    expect(db.calls[0].text).toContain('session_version = session_version + 1');
    expect(await verifyPassword('new password', db.calls[0].values[0] as string)).toBe(true);
  });

  it('bootstraps one owner from env only when no admin users exist', async () => {
    const db = new FakeDb();
    db.queuedRows = [[{ count: '0' }], [userRow]];

    const user = await bootstrapInitialAdminUser(db, {
      emails: 'owner@example.com,admin@example.com',
      password: 'first password',
    });

    expect(user?.email).toBe('admin@example.com');
    expect(db.calls[1].values[1]).toBe('owner@example.com');
  });
});
