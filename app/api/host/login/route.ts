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
  try {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not sign in.';
    const errorMessage =
      message === 'DATABASE_URL is not defined'
        ? 'Host login requires DATABASE_URL to be configured.'
        : message === 'AUTH_SECRET is not defined'
          ? 'Host login requires AUTH_SECRET to be configured.'
          : 'Could not sign in.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  clearAdminSessionCookie(response);
  return response;
}
