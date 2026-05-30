import { getReadyDb } from '@/lib/db';
import { getLiveKitRoomService } from '@/lib/livekit-service';
import { generateRoomCode } from '@/lib/room-code';
import { createMeetingRoom, listMeetingRooms } from '@/lib/room-store';
import { getAdminSession } from '@/lib/server-auth';
import { NextRequest, NextResponse } from 'next/server';

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

  const db = await getReadyDb();
  const livekit = getLiveKitRoomService();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateRoomCode();
    try {
      await livekit.createRoom({
        name: code,
        emptyTimeout: 60 * 60 * 2,
        maxParticipants: 25,
      });
      const room = await createMeetingRoom(db, {
        code,
        createdByEmail: session.email,
      });
      return NextResponse.json({ room }, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
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
