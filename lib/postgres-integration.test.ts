import pg from 'pg';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import {
  bootstrapInitialAdminUser,
  createAdminUser,
  ensureAdminUserSchema,
  getAdminUserByEmail,
  setAdminUserPassword,
  verifyAdminUserCredentials,
} from './admin-user-store';
import {
  createMeetingRoom,
  endMeetingRoom,
  ensureRoomSchema,
  findActiveMeetingRoom,
} from './room-store';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const maybeDescribe = testDatabaseUrl ? describe : describe.skip;
const { Pool } = pg;

maybeDescribe('postgres integration', () => {
  const pool = new Pool({ connectionString: testDatabaseUrl });

  beforeAll(async () => {
    await pool.query('DROP TABLE IF EXISTS meeting_rooms');
    await pool.query('DROP TABLE IF EXISTS admin_users');
    await ensureRoomSchema(pool);
    await ensureAdminUserSchema(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('bootstraps an owner and authenticates from Postgres', async () => {
    const owner = await bootstrapInitialAdminUser(pool, {
      emails: 'owner@example.com',
      password: 'correct horse battery staple',
    });

    expect(owner).toMatchObject({
      email: 'owner@example.com',
      role: 'owner',
      status: 'active',
    });

    await expect(
      verifyAdminUserCredentials(pool, 'owner@example.com', 'correct horse battery staple'),
    ).resolves.toMatchObject({ email: 'owner@example.com' });
    await expect(
      verifyAdminUserCredentials(pool, 'owner@example.com', 'wrong password'),
    ).resolves.toBeNull();
  });

  it('creates admins and invalidates old sessions by incrementing session version', async () => {
    const admin = await createAdminUser(pool, {
      email: 'admin@example.com',
      name: 'Admin User',
      password: 'temporary password',
      role: 'admin',
      createdByEmail: 'owner@example.com',
    });

    expect(admin.sessionVersion).toBe(1);
    const changed = await setAdminUserPassword(pool, admin.id, 'replacement password');
    expect(changed?.sessionVersion).toBe(2);

    const stored = await getAdminUserByEmail(pool, 'admin@example.com');
    expect(stored?.sessionVersion).toBe(2);
    await expect(
      verifyAdminUserCredentials(pool, 'admin@example.com', 'replacement password'),
    ).resolves.toMatchObject({ email: 'admin@example.com' });
  });

  it('persists room lifecycle in Postgres', async () => {
    const created = await createMeetingRoom(pool, {
      code: 'ab12-cd34',
      createdByEmail: 'owner@example.com',
    });

    expect(created.code).toBe('AB12CD34');
    await expect(findActiveMeetingRoom(pool, 'ab12 cd34')).resolves.toMatchObject({
      code: 'AB12CD34',
      status: 'active',
    });

    await endMeetingRoom(pool, 'AB12CD34');
    await expect(findActiveMeetingRoom(pool, 'AB12CD34')).resolves.toBeNull();
  });
});
