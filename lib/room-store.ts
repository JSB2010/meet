import { normalizeRoomCode } from './room-code';

export type MeetingRoomStatus = 'active' | 'ended';

export type MeetingRoom = {
  code: string;
  title: string;
  createdByEmail: string;
  status: MeetingRoomStatus;
  scheduledAt: Date | null;
  durationMinutes: number;
  maxParticipants: number;
  waitingRoomEnabled: boolean;
  recordingEnabled: boolean;
  chatEnabled: boolean;
  screenSharingEnabled: boolean;
  muteOnEntry: boolean;
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
  title: string;
  created_by_email: string;
  status: MeetingRoomStatus;
  scheduled_at: Date | null;
  duration_minutes: number;
  max_participants: number;
  waiting_room_enabled: boolean;
  recording_enabled: boolean;
  chat_enabled: boolean;
  screen_sharing_enabled: boolean;
  mute_on_entry: boolean;
  created_at: Date;
  ended_at: Date | null;
};

export async function ensureRoomSchema(db: Queryable): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS meeting_rooms (
      code text PRIMARY KEY,
      title text NOT NULL DEFAULT 'Untitled meeting',
      created_by_email text NOT NULL,
      status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
      scheduled_at timestamptz,
      duration_minutes integer NOT NULL DEFAULT 60,
      max_participants integer NOT NULL DEFAULT 25,
      waiting_room_enabled boolean NOT NULL DEFAULT true,
      recording_enabled boolean NOT NULL DEFAULT false,
      chat_enabled boolean NOT NULL DEFAULT true,
      screen_sharing_enabled boolean NOT NULL DEFAULT true,
      mute_on_entry boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      ended_at timestamptz
    )
  `);
  await db.query(`
    ALTER TABLE meeting_rooms
      ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Untitled meeting',
      ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
      ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 60,
      ADD COLUMN IF NOT EXISTS max_participants integer NOT NULL DEFAULT 25,
      ADD COLUMN IF NOT EXISTS waiting_room_enabled boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS recording_enabled boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS chat_enabled boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS screen_sharing_enabled boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS mute_on_entry boolean NOT NULL DEFAULT false
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS meeting_rooms_active_created_idx
    ON meeting_rooms (status, created_at DESC)
  `);
  await db.query(`
    CREATE INDEX IF NOT EXISTS meeting_rooms_scheduled_at_idx
    ON meeting_rooms (scheduled_at DESC NULLS LAST)
  `);
}

export async function createMeetingRoom(
  db: Queryable,
  input: {
    code: string;
    createdByEmail: string;
    title?: string;
    scheduledAt?: Date | null;
    durationMinutes?: number;
    maxParticipants?: number;
    waitingRoomEnabled?: boolean;
    recordingEnabled?: boolean;
    chatEnabled?: boolean;
    screenSharingEnabled?: boolean;
    muteOnEntry?: boolean;
  },
): Promise<MeetingRoom> {
  const code = normalizeRoomCode(input.code);
  const result = await db.query<RoomRow>(
    `
      INSERT INTO meeting_rooms (
        code,
        title,
        created_by_email,
        scheduled_at,
        duration_minutes,
        max_participants,
        waiting_room_enabled,
        recording_enabled,
        chat_enabled,
        screen_sharing_enabled,
        mute_on_entry
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING
        code,
        title,
        created_by_email,
        status,
        scheduled_at,
        duration_minutes,
        max_participants,
        waiting_room_enabled,
        recording_enabled,
        chat_enabled,
        screen_sharing_enabled,
        mute_on_entry,
        created_at,
        ended_at
    `,
    [
      code,
      input.title?.trim() || 'Untitled meeting',
      input.createdByEmail,
      input.scheduledAt ?? null,
      input.durationMinutes ?? 60,
      input.maxParticipants ?? 25,
      input.waitingRoomEnabled ?? true,
      input.recordingEnabled ?? false,
      input.chatEnabled ?? true,
      input.screenSharingEnabled ?? true,
      input.muteOnEntry ?? false,
    ],
  );

  return mapRoom(result.rows[0]);
}

export async function findActiveMeetingRoom(
  db: Queryable,
  code: string,
): Promise<MeetingRoom | null> {
  const result = await db.query<RoomRow>(
    `
      SELECT
        code,
        title,
        created_by_email,
        status,
        scheduled_at,
        duration_minutes,
        max_participants,
        waiting_room_enabled,
        recording_enabled,
        chat_enabled,
        screen_sharing_enabled,
        mute_on_entry,
        created_at,
        ended_at
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
    SELECT
      code,
      title,
      created_by_email,
      status,
      scheduled_at,
      duration_minutes,
      max_participants,
      waiting_room_enabled,
      recording_enabled,
      chat_enabled,
      screen_sharing_enabled,
      mute_on_entry,
      created_at,
      ended_at
    FROM meeting_rooms
    ORDER BY COALESCE(scheduled_at, created_at) DESC
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
      RETURNING
        code,
        title,
        created_by_email,
        status,
        scheduled_at,
        duration_minutes,
        max_participants,
        waiting_room_enabled,
        recording_enabled,
        chat_enabled,
        screen_sharing_enabled,
        mute_on_entry,
        created_at,
        ended_at
    `,
    [normalizeRoomCode(code)],
  );

  return result.rows[0] ? mapRoom(result.rows[0]) : null;
}

function mapRoom(row: RoomRow): MeetingRoom {
  return {
    code: row.code,
    title: row.title ?? 'Untitled meeting',
    createdByEmail: row.created_by_email,
    status: row.status,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes ?? 60,
    maxParticipants: row.max_participants ?? 25,
    waitingRoomEnabled: row.waiting_room_enabled ?? true,
    recordingEnabled: row.recording_enabled ?? false,
    chatEnabled: row.chat_enabled ?? true,
    screenSharingEnabled: row.screen_sharing_enabled ?? true,
    muteOnEntry: row.mute_on_entry ?? false,
    createdAt: row.created_at,
    endedAt: row.ended_at,
  };
}
