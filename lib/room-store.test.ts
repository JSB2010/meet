import { describe, expect, it } from 'vitest';
import { createMeetingRoom, endMeetingRoom, findActiveMeetingRoom } from './room-store';

class FakeDb {
  calls: Array<{ text: string; values: unknown[] }> = [];
  rows: unknown[] = [];

  async query<T = unknown>(
    text: string,
    values: unknown[] = [],
  ): Promise<{ rows: T[]; rowCount: number }> {
    this.calls.push({ text, values });
    return { rows: this.rows as T[], rowCount: this.rows.length };
  }
}

describe('room store', () => {
  it('creates rooms with normalized room codes', async () => {
    const db = new FakeDb();
    db.rows = [
      {
        code: 'AB12CD34',
        title: 'Planning session',
        created_by_email: 'admin@example.com',
        status: 'active',
        scheduled_at: new Date('2026-01-02T18:00:00.000Z'),
        duration_minutes: 90,
        max_participants: 12,
        waiting_room_enabled: true,
        recording_enabled: true,
        chat_enabled: true,
        screen_sharing_enabled: false,
        mute_on_entry: true,
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        ended_at: null,
      },
    ];

    const room = await createMeetingRoom(db, {
      code: 'ab-12 cd-34',
      createdByEmail: 'admin@example.com',
      title: 'Planning session',
      scheduledAt: new Date('2026-01-02T18:00:00.000Z'),
      durationMinutes: 90,
      maxParticipants: 12,
      recordingEnabled: true,
      screenSharingEnabled: false,
      muteOnEntry: true,
    });

    expect(room.code).toBe('AB12CD34');
    expect(room).toMatchObject({
      title: 'Planning session',
      durationMinutes: 90,
      maxParticipants: 12,
      recordingEnabled: true,
      screenSharingEnabled: false,
      muteOnEntry: true,
    });
    expect(db.calls[0].values).toContain('AB12CD34');
    expect(db.calls[0].values).toContain('Planning session');
  });

  it('looks up only active rooms by normalized code', async () => {
    const db = new FakeDb();
    db.rows = [
      {
        code: 'AB12CD34',
        created_by_email: 'admin@example.com',
        status: 'active',
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        ended_at: null,
      },
    ];

    const room = await findActiveMeetingRoom(db, 'ab 12 cd 34');

    expect(room?.code).toBe('AB12CD34');
    expect(db.calls[0].values).toEqual(['AB12CD34']);
    expect(db.calls[0].text).toContain("status = 'active'");
  });

  it('ends a room by normalized code', async () => {
    const db = new FakeDb();
    db.rows = [
      {
        code: 'AB12CD34',
        created_by_email: 'admin@example.com',
        status: 'ended',
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        ended_at: new Date('2026-01-01T00:30:00.000Z'),
      },
    ];

    const room = await endMeetingRoom(db, 'ab12-cd34');

    expect(room?.status).toBe('ended');
    expect(db.calls[0].values).toEqual(['AB12CD34']);
  });
});
