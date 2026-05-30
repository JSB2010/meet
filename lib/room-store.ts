import { normalizeRoomCode } from './room-code';

export type MeetingRoomStatus = 'active' | 'ended';

export type MeetingRoom = {
  code: string;
  createdByEmail: string;
  status: MeetingRoomStatus;
  createdAt: Date;
  endedAt: Date | null;
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

type RoomRow = {
  code: string;
  created_by_email: string;
  status: MeetingRoomStatus;
  created_at: Date;
  ended_at: Date | null;
};

export async function ensureRoomSchema(db: Queryable): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS meeting_rooms (
      code text PRIMARY KEY,
      created_by_email text NOT NULL,
      status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
      created_at timestamptz NOT NULL DEFAULT now(),
      ended_at timestamptz
    )
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS meeting_rooms_active_created_idx
    ON meeting_rooms (status, created_at DESC)
  `);
}

export async function createMeetingRoom(
  db: Queryable,
  input: { code: string; createdByEmail: string },
): Promise<MeetingRoom> {
  const code = normalizeRoomCode(input.code);
  const result = await db.query<RoomRow>(
    `
      INSERT INTO meeting_rooms (code, created_by_email)
      VALUES ($1, $2)
      RETURNING code, created_by_email, status, created_at, ended_at
    `,
    [code, input.createdByEmail],
  );

  return mapRoom(result.rows[0]);
}

export async function findActiveMeetingRoom(
  db: Queryable,
  code: string,
): Promise<MeetingRoom | null> {
  const result = await db.query<RoomRow>(
    `
      SELECT code, created_by_email, status, created_at, ended_at
      FROM meeting_rooms
      WHERE code = $1 AND status = 'active'
      LIMIT 1
    `,
    [normalizeRoomCode(code)],
  );

  return result.rows[0] ? mapRoom(result.rows[0]) : null;
}

export async function listMeetingRooms(db: Queryable): Promise<MeetingRoom[]> {
  const result = await db.query<RoomRow>(`
    SELECT code, created_by_email, status, created_at, ended_at
    FROM meeting_rooms
    ORDER BY created_at DESC
    LIMIT 50
  `);

  return result.rows.map(mapRoom);
}

export async function endMeetingRoom(db: Queryable, code: string): Promise<MeetingRoom | null> {
  const result = await db.query<RoomRow>(
    `
      UPDATE meeting_rooms
      SET status = 'ended', ended_at = COALESCE(ended_at, now())
      WHERE code = $1
      RETURNING code, created_by_email, status, created_at, ended_at
    `,
    [normalizeRoomCode(code)],
  );

  return result.rows[0] ? mapRoom(result.rows[0]) : null;
}

function mapRoom(row: RoomRow): MeetingRoom {
  return {
    code: row.code,
    createdByEmail: row.created_by_email,
    status: row.status,
    createdAt: row.created_at,
    endedAt: row.ended_at,
  };
}
