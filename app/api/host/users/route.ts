import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Host users are managed in Pocket ID groups.' },
    { status: 410 },
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'Host users are managed in Pocket ID groups.' },
    { status: 410 },
  );
}
