'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
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

function UserIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 12.25a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5.25 20a6.75 6.75 0 0 1 13.5 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M10 4.75 7.75 19.25M16.25 4.75 14 19.25M5 9h14M4.25 15h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M7.75 4.75v2.5M16.25 4.75v2.5M5.25 9.25h13.5M6.75 6.25h10.5A2.25 2.25 0 0 1 19.5 8.5v8.75a2.25 2.25 0 0 1-2.25 2.25H6.75a2.25 2.25 0 0 1-2.25-2.25V8.5a2.25 2.25 0 0 1 2.25-2.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M9.75 11.75a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM4.5 19a5.25 5.25 0 0 1 10.5 0M16.75 11.25a2.5 2.5 0 0 0 0-5M18 18.5a4 4 0 0 0-2.15-3.55"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
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
      <div className={styles.fieldGroup}>
        <label htmlFor="participantName">Your name</label>
        <div className={styles.inputWrap}>
          <UserIcon />
          <input
            id="participantName"
            name="participantName"
            type="text"
            value={participantName}
            onChange={(event) => setParticipantName(event.target.value)}
            placeholder="Enter your name"
            autoComplete="name"
          />
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="roomName">Meeting room</label>
        <div className={styles.inputWrap}>
          <HashIcon />
          <input
            id="roomName"
            name="roomName"
            type="text"
            value={roomName}
            onChange={(event) => setRoomName(event.target.value)}
            placeholder="Enter room name or code"
            autoComplete="off"
            required
          />
        </div>
      </div>

      <button className={styles.primaryButton} type="submit">
        <VideoIcon />
        Join meeting
      </button>

      <div className={styles.securityGroup}>
        <div className={styles.securityHeader}>
          <span className={styles.securityIcon}>
            <LockIcon />
          </span>
          <div>
            <h2>
              End-to-end encryption <span>(optional)</span>
            </h2>
            <p>Add an extra layer of privacy for your session.</p>
          </div>
          <label className={styles.switch} htmlFor="use-e2ee">
            <span className={styles.switchLabel}>Toggle encryption</span>
            <input
              id="use-e2ee"
              type="checkbox"
              checked={e2ee}
              onChange={(event) => setE2ee(event.target.checked)}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
        {e2ee && (
          <div className={styles.fieldGroup}>
            <label htmlFor="passphrase">Encryption passphrase</label>
            <div className={styles.inputWrap}>
              <LockIcon />
              <input
                id="passphrase"
                type="password"
                value={sharedPassphrase}
                onChange={(event) => setSharedPassphrase(event.target.value)}
              />
            </div>
            <p className={styles.fieldHint}>Required by all participants in the meeting.</p>
          </div>
        )}
        {!e2ee && (
          <p className={styles.fieldHint}>
            Enable this only when your meeting invite includes a passphrase.
          </p>
        )}
      </div>
    </form>
  );
}

const previewItems = [
  {
    title: 'Your scheduled session',
    copy: 'Your meeting details will appear here.',
    icon: <CalendarIcon />,
    tone: 'blue',
  },
  {
    title: 'Secure connection',
    copy: 'Your connection is protected with industry-standard encryption.',
    icon: <LockIcon />,
    tone: 'green',
  },
  {
    title: 'Private meeting',
    copy: 'Only invited participants can join this room.',
    icon: <UsersIcon />,
    tone: 'blue',
  },
];

function SessionPreview() {
  return (
    <section className={styles.preview} aria-label="Secure meeting preview">
      <div className={styles.roomImage}>
        <Image
          src="/images/meeting-room-render.png"
          alt="Modern consultation room with a conference table and video screen"
          fill
          sizes="(max-width: 980px) 100vw, 44vw"
          priority
        />
      </div>
      <div className={styles.previewList}>
        {previewItems.map((item) => (
          <div className={styles.previewItem} key={item.title}>
            <span className={`${styles.previewIcon} ${styles[item.tone]}`}>{item.icon}</span>
            <div>
              <h2>{item.title}</h2>
              <p>{item.copy}</p>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.previewFooter}>
        <div>
          <SignalIcon />
          Connected to your secure meeting server
        </div>
        <span className={styles.onlineBadge}>
          <span className={styles.statusDot}></span>
          Online
        </span>
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
              Enter your private meeting room to connect securely with your consultant.
            </p>
            <ClientJoinForm />
          </div>
          <SessionPreview />
        </section>
      </main>
      <footer className={styles.footer} data-lk-theme="default">
        <div className={styles.footerLinks}>
          <span>© 2026 LiveKit Meet</span>
          <span>Powered by LiveKit</span>
          <span>Built with Next.js</span>
        </div>
        <span>
          Provided by <a href="https://jacobbarkin.com">Jacob Barkin</a>
        </span>
      </footer>
    </>
  );
}
