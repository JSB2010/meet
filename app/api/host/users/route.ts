import { getReadyDb } from '@/lib/db';
import { createAdminUser, listAdminUsers } from '@/lib/admin-user-store';
import { getAdminSession } from '@/lib/server-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const db = await getReadyDb();
  const users = await listAdminUsers(db);
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    name?: string;
    password?: string;
    role?: 'owner' | 'admin';
  } | null;
  const email = body?.email?.trim() ?? '';
  const name = body?.name?.trim() || email;
  const password = body?.password ?? '';
  const role = body?.role === 'owner' ? 'owner' : 'admin';

  if (!email || password.length < 12) {
    return NextResponse.json(
      { error: 'Enter an email and a temporary password with at least 12 characters.' },
      { status: 400 },
    );
  }

  const db = await getReadyDb();
  const user = await createAdminUser(db, {
    email,
    name,
    password,
    role,
    createdByEmail: session.email,
  });

  return NextResponse.json({ user }, { status: 201 });
}
