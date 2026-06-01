import pg from 'pg';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
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
    await ensureRoomSchema(pool);
  });

  afterAll(async () => {
    await pool.end();
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
