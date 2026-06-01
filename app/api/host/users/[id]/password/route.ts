import { NextResponse } from 'next/server';

export async function PATCH() {
  return NextResponse.json(
    { error: 'Password changes are handled by Pocket ID.' },
    { status: 410 },
  );
}
