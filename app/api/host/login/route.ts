import {
  authenticateAdmin,
  clearAdminSessionCookie,
  getAdminSession,
  setAdminSessionCookie,
} from '@/lib/server-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await getAdminSession(request);
  return NextResponse.json({ authenticated: Boolean(session), email: session?.email ?? null });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;
  const email = body?.email?.trim().toLowerCase() ?? '';
  const password = body?.password ?? '';

  if (!email || !password || !(await authenticateAdmin(email, password))) {
    return NextResponse.json({ error: 'Invalid host credentials.' }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true, email });
  await setAdminSessionCookie(response, email);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  clearAdminSessionCookie(response);
  return response;
}
