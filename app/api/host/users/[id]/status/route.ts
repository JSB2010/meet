import { getReadyDb } from '@/lib/db';
import { setAdminUserStatus } from '@/lib/admin-user-store';
import { getAdminSession } from '@/lib/server-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  if (session.role !== 'owner') {
    return NextResponse.json({ error: 'Owner access required.' }, { status: 403 });
  }

  const { id } = await params;
  if (session.userId === id) {
    return NextResponse.json({ error: 'You cannot disable your own account.' }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as {
    status?: 'active' | 'disabled';
  } | null;
  const status = body?.status === 'active' ? 'active' : 'disabled';
  const db = await getReadyDb();
  const user = await setAdminUserStatus(db, id, status);
  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  return NextResponse.json({ user });
}
