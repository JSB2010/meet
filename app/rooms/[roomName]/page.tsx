import * as React from 'react';
import { PageClientImpl } from './PageClientImpl';
import { isVideoCodec } from '@/lib/types';
import { getReadyDb } from '@/lib/db';
import { findActiveMeetingRoom } from '@/lib/room-store';
import Link from 'next/link';
import styles from '../../../styles/Home.module.css';

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
      <main className={styles.main} data-lk-theme="default">
        <header className={styles.topbar}>
          <Link className={styles.brand} href="/" aria-label="Jacob Meet home">
            <span className={styles.brandMark}>JB</span>
            <span>Jacob Meet</span>
          </Link>
        </header>
        <section className={styles.heroPanel}>
          <div className={styles.heroCopy}>
            <h1>Meeting not found</h1>
            <p className={styles.lede}>
              This room does not exist, has ended, or is no longer accepting participants.
            </p>
            <Link className={styles.primaryButton} href="/">
              Back to join page
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <PageClientImpl
      roomName={room.code}
      region={_searchParams.region}
      participantName={_searchParams.name}
      hq={hq}
      codec={codec}
      singlePeerConnection={singlePC}
    />
  );
}
