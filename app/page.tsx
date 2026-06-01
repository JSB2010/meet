'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import { BrandLogo, JacobCredit, ThemeToggle } from './MeetChrome';

/* ------------------------------------------------------------------ icons */
function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="6" width="13" height="12" rx="2.5" />
      <path d="m16 10 4.5-2.6a.7.7 0 0 1 1 .6v8a.7.7 0 0 1-1 .6L16 14" />
    </svg>
  );
}
function HashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 4 8 20M16 4l-2 16M5 9h14M4 15h14" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h13m-5-5.5L18.5 12 13 17.5" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4.5" y="10" width="15" height="10" rx="2.2" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.2 5 6v5.5c0 4.2 2.9 7.3 7 8.8 4.1-1.5 7-4.6 7-8.8V6l-7-2.8Z" />
      <path d="m9.2 12 1.9 1.9 3.7-3.8" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 14a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.5 1.5" />
      <path d="M14 10a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.5-1.5" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.6a3.2 3.2 0 0 1 0 6M17.5 19a5.5 5.5 0 0 0-2.3-3.6" />
    </svg>
  );
}
function SignalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 18.25h.01" strokeWidth="3" />
      <path d="M8.5 15.5a5 5 0 0 1 7 0M5.5 12.4a9.25 9.25 0 0 1 13 0M3 9.2a13 13 0 0 1 18 0" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/* ---------------------------------------------------------------- helpers */
function sanitizeRoomName(value: string) {
  return value.replace(/[^a-z0-9]/gi, '').toUpperCase();
}

/* ------------------------------------------------------------- join form */
function ClientJoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    router.push(roomPath);
  };

  return (
    <form className="join-form" onSubmit={onSubmit}>
      <div className="join-form-row">
        <div className="input-icon">
          <HashIcon />
          <input
            id="roomName"
            name="roomName"
            className="input input-code"
            type="text"
            value={roomName}
            onChange={(event) => setRoomName(event.target.value.toUpperCase())}
            placeholder="AB12CD34"
            autoComplete="off"
            aria-label="Meeting code"
            required
          />
        </div>
        <button className="btn btn-primary btn-lg" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <SignalIcon /> : null}
          {isSubmitting ? 'Checking…' : 'Continue'}
          {!isSubmitting ? <ArrowIcon /> : null}
        </button>
      </div>
      {error && (
        <p className="join-error" role="alert">
          <CloseIcon />
          {error}
        </p>
      )}
    </form>
  );
}

/* ------------------------------------------------------------------ page */
export default function Page() {
  return (
    <main className="join" data-lk-theme="default">
      <header className="appbar">
        <BrandLogo />
        <div className="appbar-right">
          <Link className="btn btn-quiet btn-sm" href="/host">
            <LockIcon />
            Host sign in
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="join-body">
        <div className="join-copy">
          <h1>
            Your meeting is
            <br />
            <span className="grad">ready when you are.</span>
          </h1>
          <p className="join-lede">
            Enter your meeting code to set up your camera and microphone before you join.
          </p>

          <React.Suspense fallback={<div className="join-form">Loading…</div>}>
            <ClientJoinForm />
          </React.Suspense>

          <div className="join-meta">
            <span className="join-meta-item">
              <ShieldIcon /> End-to-end encrypted
            </span>
            <span className="join-meta-item">
              <LinkIcon /> Have a link? Just open it
            </span>
          </div>
        </div>

        <div className="join-stage rise">
          <div className="join-stage-screen">
            <Image
              className="join-stage-photo"
              src="/images/meeting-room-redesign.png"
              alt="Modern conference room"
              fill
              sizes="(max-width: 900px) 100vw, 52vw"
              priority
            />
          </div>

          <div className="join-stage-float tl">
            <span className="ico g">
              <ShieldIcon />
            </span>
            <div>
              Private by default
              <span className="sub">Encrypted rooms only open for invited guests</span>
            </div>
          </div>
          <div className="join-stage-float br">
            <span className="ico">
              <UsersIcon />
            </span>
            <div>
              Simple to join
              <span className="sub">Enter a code, check your setup, and step in</span>
            </div>
          </div>
        </div>
      </div>
      <JacobCredit />
    </main>
  );
}
