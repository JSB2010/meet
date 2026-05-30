import {
  authenticateAdmin,
  clearAdminSessionCookie,
  getAdminSession,
  setAdminSessionCookie,
} from '@/lib/server-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await getAdminSession(request);
  return NextResponse.json({
    authenticated: Boolean(session),
    email: session?.email ?? null,
    role: session?.role ?? null,
    userId: session?.userId ?? null,
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;
  const email = body?.email?.trim().toLowerCase() ?? '';
  const password = body?.password ?? '';

  const user = email && password ? await authenticateAdmin(email, password) : null;
  if (!user) {
    return NextResponse.json({ error: 'Invalid host credentials.' }, { status: 401 });
  }

  const response = NextResponse.json({
    authenticated: true,
    email: user.email,
    role: user.role,
    userId: user.id,
  });
  await setAdminSessionCookie(response, user);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  clearAdminSessionCookie(response);
  return response;
}
