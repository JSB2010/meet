import { getReadyDb } from '@/lib/db';
import {
  getAdminUserById,
  setAdminUserPassword,
  verifyAdminUserCredentials,
} from '@/lib/admin-user-store';
import { getAdminSession } from '@/lib/server-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    password?: string;
    currentPassword?: string;
  } | null;
  const password = body?.password ?? '';
  if (password.length < 12) {
    return NextResponse.json(
      { error: 'New passwords must be at least 12 characters.' },
      { status: 400 },
    );
  }

  const { id } = await params;
  const db = await getReadyDb();
  const target = await getAdminUserById(db, id);
  if (!target) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  const isSelf = session.userId === id;
  if (!isSelf && session.role !== 'owner') {
    return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  }
  if (
    isSelf &&
    !(await verifyAdminUserCredentials(db, session.email, body?.currentPassword ?? ''))
  ) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
  }

  const user = await setAdminUserPassword(db, id, password);
  return NextResponse.json({ user });
}
