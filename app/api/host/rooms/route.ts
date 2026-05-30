import { getReadyDb } from '@/lib/db';
import { getLiveKitRoomService } from '@/lib/livekit-service';
import { generateRoomCode } from '@/lib/room-code';
import { createMeetingRoom, listMeetingRooms } from '@/lib/room-store';
import { getAdminSession } from '@/lib/server-auth';
import { NextRequest, NextResponse } from 'next/server';

type CreateRoomRequest = {
  title?: unknown;
  code?: unknown;
  scheduledAt?: unknown;
  durationMinutes?: unknown;
  maxParticipants?: unknown;
  waitingRoomEnabled?: unknown;
  recordingEnabled?: unknown;
  chatEnabled?: unknown;
  screenSharingEnabled?: unknown;
  muteOnEntry?: unknown;
};

export async function GET(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const db = await getReadyDb();
  const rooms = await listMeetingRooms(db);
  return NextResponse.json({ rooms });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CreateRoomRequest;
  const customCode =
    typeof body.code === 'string' && body.code.trim() ? body.code.trim() : undefined;
  const normalizedCustomCode = customCode
    ? customCode.replace(/[^a-z0-9]/gi, '').toUpperCase()
    : '';
  const title =
    typeof body.title === 'string' && body.title.trim()
      ? body.title.trim().slice(0, 80)
      : 'Untitled meeting';
  const scheduledAt =
    typeof body.scheduledAt === 'string' && body.scheduledAt ? new Date(body.scheduledAt) : null;
  const durationMinutes = clampInteger(body.durationMinutes, 15, 480, 60);
  const maxParticipants = clampInteger(body.maxParticipants, 2, 200, 25);

  if (customCode && (normalizedCustomCode.length < 4 || normalizedCustomCode.length > 24)) {
    return NextResponse.json(
      { error: 'Custom meeting codes must be 4 to 24 letters or numbers.' },
      { status: 400 },
    );
  }
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: 'Scheduled time is invalid.' }, { status: 400 });
  }

  const db = await getReadyDb();
  const livekit = getLiveKitRoomService();
  const attempts = normalizedCustomCode ? 1 : 5;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const code = normalizedCustomCode || generateRoomCode();
    try {
      await livekit.createRoom({
        name: code,
        emptyTimeout: 60 * 60 * 2,
        maxParticipants,
      });
      const room = await createMeetingRoom(db, {
        code,
        createdByEmail: session.email,
        title,
        scheduledAt,
        durationMinutes,
        maxParticipants,
        waitingRoomEnabled:
          typeof body.waitingRoomEnabled === 'boolean' ? body.waitingRoomEnabled : true,
        recordingEnabled: body.recordingEnabled === true,
        chatEnabled: typeof body.chatEnabled === 'boolean' ? body.chatEnabled : true,
        screenSharingEnabled:
          typeof body.screenSharingEnabled === 'boolean' ? body.screenSharingEnabled : true,
        muteOnEntry: body.muteOnEntry === true,
      });
      return NextResponse.json({ room }, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        normalizedCustomCode &&
        (message.toLowerCase().includes('duplicate') || message.toLowerCase().includes('already'))
      ) {
        return NextResponse.json(
          { error: 'That custom meeting code is already in use.' },
          { status: 409 },
        );
      }
      if (
        !message.toLowerCase().includes('duplicate') &&
        !message.toLowerCase().includes('already')
      ) {
        throw error;
      }
    }
  }

  return NextResponse.json({ error: 'Could not create a unique room code.' }, { status: 500 });
}

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : Number.NaN;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}
