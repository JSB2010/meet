import { getReadyDb } from '@/lib/db';
import { getLiveKitRoomService } from '@/lib/livekit-service';
import { normalizeRoomCode } from '@/lib/room-code';
import { endMeetingRoom } from '@/lib/room-store';
import { getAdminSession } from '@/lib/server-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { code } = await params;
  const normalizedCode = normalizeRoomCode(code);
  const db = await getReadyDb();
  const room = await endMeetingRoom(db, normalizedCode);

  if (!room) {
    return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
  }

  await getLiveKitRoomService()
    .deleteRoom(normalizedCode)
    .catch(() => undefined);

  return NextResponse.json({ room });
}
