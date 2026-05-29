'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import React, { useState } from 'react';
import { encodePassphrase, randomString } from '@/lib/client-utils';
import styles from '../styles/Home.module.css';

function VideoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M4.75 7.75A2.75 2.75 0 0 1 7.5 5h6A2.75 2.75 0 0 1 16.25 7.75v8.5A2.75 2.75 0 0 1 13.5 19h-6a2.75 2.75 0 0 1-2.75-2.75v-8.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m16.25 10.25 3.4-2.05a.9.9 0 0 1 1.35.78v6.04a.9.9 0 0 1-1.35.78l-3.4-2.05v-3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M7.75 10.25V8.5a4.25 4.25 0 0 1 8.5 0v1.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7.25 10.25h9.5A2.25 2.25 0 0 1 19 12.5v4.25A2.25 2.25 0 0 1 16.75 19h-9.5A2.25 2.25 0 0 1 5 16.75V12.5a2.25 2.25 0 0 1 2.25-2.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SignalIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M5 18.25h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M8.5 15.5a5 5 0 0 1 7 0M5.5 12.4a9.25 9.25 0 0 1 13 0M3 9.2a13 13 0 0 1 18 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12h13M13 6.75 18.25 12 13 17.25"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function sanitizeRoomName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ClientJoinForm() {
  const router = useRouter();
  const [participantName, setParticipantName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [e2ee, setE2ee] = useState(false);
  const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64));

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const normalizedRoomName = sanitizeRoomName(roomName);
    if (!normalizedRoomName) {
      return;
    }

    const roomPath = `/rooms/${encodeURIComponent(normalizedRoomName)}`;
    const searchParams = new URLSearchParams();
    if (participantName.trim()) {
      searchParams.set('name', participantName.trim());
    }
    const destination = `${roomPath}${searchParams.size ? `?${searchParams.toString()}` : ''}`;
    if (e2ee) {
      router.push(`${destination}#${encodePassphrase(sharedPassphrase)}`);
    } else {
      router.push(destination);
    }
  };

  return (
    <form className={styles.joinPanel} onSubmit={onSubmit}>
      <div className={styles.panelHeader}>
        <span className={styles.panelIcon}>
          <VideoIcon />
        </span>
        <div>
          <h2>Join your meeting</h2>
          <p>Use the room code from your appointment or meeting invite.</p>
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="participantName">Your name</label>
        <input
          id="participantName"
          name="participantName"
          type="text"
          value={participantName}
          onChange={(event) => setParticipantName(event.target.value)}
          placeholder="Jane Client"
          autoComplete="name"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="roomName">Room code</label>
        <input
          id="roomName"
          name="roomName"
          type="text"
          value={roomName}
          onChange={(event) => setRoomName(event.target.value)}
          placeholder="example: strategy-session"
          autoComplete="off"
          required
        />
      </div>

      <button className={styles.primaryButton} type="submit">
        Join meeting
        <ArrowIcon />
      </button>

      <div className={styles.securityGroup}>
        <div className={styles.checkRow}>
          <input
            id="use-e2ee"
            type="checkbox"
            checked={e2ee}
            onChange={(event) => setE2ee(event.target.checked)}
          />
          <label htmlFor="use-e2ee">Use end-to-end encryption passphrase</label>
        </div>
        {e2ee && (
          <div className={styles.fieldGroup}>
            <label htmlFor="passphrase">Passphrase</label>
            <input
              id="passphrase"
              type="password"
              value={sharedPassphrase}
              onChange={(event) => setSharedPassphrase(event.target.value)}
            />
          </div>
        )}
      </div>
    </form>
  );
}

function SessionPreview() {
  return (
    <section className={styles.preview} aria-label="Secure meeting preview">
      <div className={styles.previewHeader}>
        <span>
          <SignalIcon />
        </span>
        <div>
          <p>Session status</p>
          <strong>Ready when you are</strong>
        </div>
      </div>
      <div className={styles.previewGrid}>
        <div className={styles.previewTile}>
          <span className={styles.avatar}>C</span>
          <p>Client</p>
        </div>
        <div className={styles.previewTile}>
          <span className={styles.avatar}>H</span>
          <p>Host</p>
        </div>
      </div>
      <div className={styles.connectionPanel}>
        <div>
          <span className={styles.statusDot}></span>
          <p>Encrypted WebRTC connection</p>
        </div>
        <div>
          <span className={styles.statusDot}></span>
          <p>Camera and microphone check before joining</p>
        </div>
        <div>
          <span className={styles.statusDot}></span>
          <p>Runs on the configured LiveKit server</p>
        </div>
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <>
      <main className={styles.main} data-lk-theme="default">
        <header className={styles.topbar}>
          <Link className={styles.brand} href="/" aria-label="LiveKit Meet home">
            <span className={styles.brandMark}>LK</span>
            <span>LiveKit Meet</span>
          </Link>
          <div className={styles.statusRail} aria-label="Meeting status">
            <span className={styles.statusChip}>
              <span className={styles.statusDot}></span>
              Ready for your session
            </span>
          </div>
        </header>

        <section className={styles.heroPanel}>
          <div className={styles.heroCopy}>
            <div className={styles.promise}>
              <LockIcon />
              Private consultation room
            </div>
            <h1>Join your consultation</h1>
            <p className={styles.lede}>
              Enter your meeting room code to open a private video session.
            </p>
            <div className={styles.featureRow} aria-label="Meeting features">
              <span>
                <VideoIcon />
                Browser-based
              </span>
              <span>
                <LockIcon />
                Secure by default
              </span>
              <span>
                <SignalIcon />
                No app install
              </span>
            </div>
            <ClientJoinForm />
          </div>
          <SessionPreview />
        </section>
      </main>
      <footer className={styles.footer} data-lk-theme="default">
        Provided by Jacob Barkin. Built with{' '}
        <a href="https://github.com/livekit/components-js?ref=meet" rel="noopener">
          LiveKit Components
        </a>{' '}
        and Next.js.
      </footer>
    </>
  );
}
