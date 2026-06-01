import * as React from 'react';
import { PageClientImpl } from './PageClientImpl';
import { isVideoCodec } from '@/lib/types';
import { getReadyDb } from '@/lib/db';
import { findActiveMeetingRoom } from '@/lib/room-store';
import Link from 'next/link';
import { BrandLogo, JacobCredit } from '@/app/MeetChrome';

export const dynamic = 'force-dynamic';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ roomName: string }>;
  searchParams: Promise<{
    // FIXME: We should not allow values for regions if in playground mode.
    region?: string;
    hq?: string;
    codec?: string;
    singlePC?: string;
    name?: string;
  }>;
}) {
  const _params = await params;
  const _searchParams = await searchParams;
  const codec =
    typeof _searchParams.codec === 'string' && isVideoCodec(_searchParams.codec)
      ? _searchParams.codec
      : 'vp9';
  const hq = _searchParams.hq === 'true' ? true : false;
  const singlePC = _searchParams.singlePC !== 'false';
  const db = await getReadyDb();
  const room = await findActiveMeetingRoom(db, _params.roomName);

  if (!room) {
    return (
      <main className="join not-found" data-lk-theme="default">
        <header className="appbar">
          <BrandLogo />
        </header>
        <section className="join-body not-found-body">
          <div className="join-copy">
            <h1>Meeting not found</h1>
            <p className="join-lede">
              This room does not exist, has ended, or is no longer accepting participants.
            </p>
            <Link className="btn btn-primary btn-lg" href="/">
              Back to join page
            </Link>
          </div>
        </section>
        <JacobCredit />
      </main>
    );
  }

  return (
    <PageClientImpl
      roomName={room.code}
      meetingTitle={room.title}
      region={_searchParams.region}
      participantName={_searchParams.name}
      hq={hq}
      codec={codec}
      singlePeerConnection={singlePC}
    />
  );
}
