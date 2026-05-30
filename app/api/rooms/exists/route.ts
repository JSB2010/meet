import { getReadyDb } from '@/lib/db';
import { normalizeRoomCode } from '@/lib/room-code';
import { findActiveMeetingRoom } from '@/lib/room-store';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const normalizedCode = normalizeRoomCode(code ?? '');

  if (!normalizedCode) {
    return NextResponse.json({ exists: false, error: 'Enter a meeting code.' }, { status: 400 });
  }

  const db = await getReadyDb();
  const room = await findActiveMeetingRoom(db, normalizedCode);

  if (!room) {
    return NextResponse.json(
      { exists: false, error: 'No active meeting was found for that code.' },
      { status: 404 },
    );
  }

  return NextResponse.json({ exists: true, code: room.code });
}
