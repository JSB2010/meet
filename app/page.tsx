'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
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

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12h13M13 6.75 18.25 12 13 17.25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
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
  return value.replace(/[^a-z0-9]/gi, '').toUpperCase();
}

function ClientJoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [participantName, setParticipantName] = useState('');
  const [roomName, setRoomName] = useState(searchParams.get('room') ?? '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const normalizedRoomName = sanitizeRoomName(roomName);
    if (!normalizedRoomName) {
      setError('Enter a meeting code.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    const response = await fetch(
      `/api/rooms/exists?code=${encodeURIComponent(normalizedRoomName)}`,
    );
    const data = (await response.json().catch(() => null)) as {
      exists?: boolean;
      code?: string;
      error?: string;
    } | null;
    setIsSubmitting(false);

    if (!response.ok || !data?.exists || !data.code) {
      setError(data?.error ?? 'No active meeting was found for that code.');
      return;
    }

    const roomPath = `/rooms/${encodeURIComponent(data.code)}`;
    const destinationParams = new URLSearchParams();
    if (participantName.trim()) {
      destinationParams.set('name', participantName.trim());
    }
    router.push(`${roomPath}${destinationParams.size ? `?${destinationParams.toString()}` : ''}`);
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
            placeholder="AB12CD34"
            autoComplete="off"
            required
          />
        </div>
      </div>

      {error && (
        <p className={styles.errorMessage} role="alert">
          {error}
        </p>
      )}

      <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
        {isSubmitting ? <SignalIcon /> : <VideoIcon />}
        {isSubmitting ? 'Checking room...' : 'Join meeting'}
      </button>
    </form>
  );
}

const previewItems = [
  {
    title: 'Your scheduled session',
    copy: 'Use the exact code from your host or open the invite link they sent.',
    icon: <CalendarIcon />,
    tone: 'blue',
  },
  {
    title: 'Secure connection',
    copy: 'Meeting access is issued only after the room is confirmed active.',
    icon: <LockIcon />,
    tone: 'green',
  },
  {
    title: 'Private meeting',
    copy: 'Rooms are created from the protected host console.',
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
          <Link className={styles.brand} href="/" aria-label="Jacob Meet home">
            <span className={styles.brandMark}>JB</span>
            <span>Jacob Meet</span>
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
              Private meeting access
            </div>
            <h1>Join a meeting</h1>
            <p className={styles.lede}>
              Enter an active meeting code from your host. If the room is open, you can choose your
              microphone and camera before joining.
            </p>
            <React.Suspense
              fallback={<div className={styles.joinPanel}>Loading meeting form...</div>}
            >
              <ClientJoinForm />
            </React.Suspense>
            <Link className={styles.hostLink} href="/host">
              Host a meeting
              <ArrowIcon />
            </Link>
          </div>
          <SessionPreview />
        </section>
      </main>
      <footer className={styles.footer} data-lk-theme="default">
        <div className={styles.footerLinks}>
          <span>© 2026 Jacob Barkin</span>
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
