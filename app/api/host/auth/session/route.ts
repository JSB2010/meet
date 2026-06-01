import { clearAdminSessionCookie, getAdminSession, sessionToResponse } from '@/lib/server-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await getAdminSession(request);
  return NextResponse.json(sessionToResponse(session));
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  clearAdminSessionCookie(response);
  return response;
}
