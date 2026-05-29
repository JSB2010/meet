'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import React, { Suspense, useState } from 'react';
import { encodePassphrase, generateRoomId, randomString } from '@/lib/client-utils';
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

function ServerIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.75 5.75h10.5A2.25 2.25 0 0 1 19.5 8v1.25a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 9.25V8a2.25 2.25 0 0 1 2.25-2.25ZM6.75 12.5h10.5a2.25 2.25 0 0 1 2.25 2.25V16a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 16v-1.25a2.25 2.25 0 0 1 2.25-2.25Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M8 8.65h.01M8 15.4h.01" stroke="currentColor" strokeWidth="2.4" />
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

function SparkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3.75 13.9 9l5.35 1.95-5.35 1.95L12 18.25l-1.9-5.35-5.35-1.95L10.1 9 12 3.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Tabs(props: React.PropsWithChildren<{}>) {
  const searchParams = useSearchParams();
  const tabIndex = searchParams?.get('tab') === 'custom' ? 1 : 0;

  const router = useRouter();
  function onTabSelected(index: number) {
    const tab = index === 1 ? 'custom' : 'demo';
    router.push(`/?tab=${tab}`);
  }

  let tabs = React.Children.map(props.children, (child, index) => {
    return (
      <button
        key={index}
        className={styles.tabButton}
        onClick={() => {
          if (onTabSelected) {
            onTabSelected(index);
          }
        }}
        aria-pressed={tabIndex === index}
      >
        {/* @ts-ignore */}
        {child?.props.label}
      </button>
    );
  });

  return (
    <div className={styles.tabContainer}>
      <div className={styles.tabSelect}>{tabs}</div>
      {/* @ts-ignore */}
      {props.children[tabIndex]}
    </div>
  );
}

function DemoMeetingTab(props: { label: string }) {
  const router = useRouter();
  const [e2ee, setE2ee] = useState(false);
  const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64));
  const startMeeting = () => {
    if (e2ee) {
      router.push(`/rooms/${generateRoomId()}#${encodePassphrase(sharedPassphrase)}`);
    } else {
      router.push(`/rooms/${generateRoomId()}`);
    }
  };
  return (
    <div className={styles.tabContent}>
      <p className={styles.formCopy}>Start a new room on your configured LiveKit server.</p>
      <button className={styles.primaryButton} onClick={startMeeting}>
        <VideoIcon />
        Start Meeting
      </button>
      <div className={styles.securityGroup}>
        <div className={styles.sectionDivider}>
          <span>End-to-end encryption</span>
        </div>
        <div className={styles.checkRow}>
          <input
            id="use-e2ee"
            type="checkbox"
            checked={e2ee}
            onChange={(ev) => setE2ee(ev.target.checked)}
          ></input>
          <label htmlFor="use-e2ee">Enable end-to-end encryption</label>
        </div>
        {e2ee && (
          <div className={styles.fieldGroup}>
            <label htmlFor="passphrase">Passphrase</label>
            <input
              id="passphrase"
              type="password"
              value={sharedPassphrase}
              onChange={(ev) => setSharedPassphrase(ev.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CustomConnectionTab(props: { label: string }) {
  const router = useRouter();

  const [e2ee, setE2ee] = useState(false);
  const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64));

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const serverUrl = formData.get('serverUrl');
    const token = formData.get('token');
    if (e2ee) {
      router.push(
        `/custom/?liveKitUrl=${serverUrl}&token=${token}#${encodePassphrase(sharedPassphrase)}`,
      );
    } else {
      router.push(`/custom/?liveKitUrl=${serverUrl}&token=${token}`);
    }
  };
  return (
    <form className={styles.tabContent} onSubmit={onSubmit}>
      <p className={styles.formCopy}>Connect directly with a LiveKit URL and participant token.</p>
      <div className={styles.fieldGroup}>
        <label htmlFor="serverUrl">LiveKit server URL</label>
        <input
          id="serverUrl"
          name="serverUrl"
          type="url"
          placeholder="wss://livekit.jacobbarkin.com"
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label htmlFor="token">Participant token</label>
        <textarea id="token" name="token" placeholder="Paste token" required rows={3} />
      </div>
      <button className={styles.primaryButton} type="submit">
        <ServerIcon />
        Connect
      </button>
      <div className={styles.securityGroup}>
        <div className={styles.sectionDivider}>
          <span>Optional security</span>
        </div>
        <div className={styles.checkRow}>
          <input
            id="use-e2ee"
            type="checkbox"
            checked={e2ee}
            onChange={(ev) => setE2ee(ev.target.checked)}
          ></input>
          <label htmlFor="use-e2ee">Enable end-to-end encryption</label>
        </div>
        {e2ee && (
          <div className={styles.fieldGroup}>
            <label htmlFor="passphrase">Passphrase</label>
            <input
              id="passphrase"
              type="password"
              value={sharedPassphrase}
              onChange={(ev) => setSharedPassphrase(ev.target.value)}
            />
          </div>
        )}
      </div>
    </form>
  );
}

function MeetingPreview() {
  return (
    <section className={styles.preview} aria-label="Meeting preview">
      <div className={`${styles.tile} ${styles.tileLarge}`}>
        <Image
          className={styles.tileImage}
          src="/images/jacob-boreas.webp"
          alt="Jacob Barkin"
          fill
          sizes="(max-width: 980px) 100vw, 34vw"
          priority
        />
        <span className={styles.nameTag}>You</span>
      </div>
      <div className={styles.tile}>
        <div className={`${styles.avatar} ${styles.avatarBlue}`}>SK</div>
        <span className={styles.nameTag}>Samantha</span>
      </div>
      <div className={styles.tile}>
        <div className={`${styles.avatar} ${styles.avatarGreen}`}>AL</div>
        <span className={styles.nameTag}>Alex</span>
      </div>
      <div className={styles.tile}>
        <div className={`${styles.avatar} ${styles.avatarNavy}`}>JR</div>
        <span className={styles.nameTag}>Jordan</span>
      </div>
      <div className={styles.callBar}>
        <span>
          <VideoIcon />
        </span>
        <span>Live</span>
        <strong>4 participants</strong>
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
            <Image src="/images/jacob-logo.png" alt="" width="40" height="40" priority />
            <span>Jacob Meet</span>
          </Link>
          <div className={styles.statusRail} aria-label="Deployment status">
            <span className={styles.statusChip}>
              <span className={styles.statusDot}></span>
              LiveKit Server
            </span>
            <span className={styles.statusChip}>Coolify ready</span>
          </div>
        </header>
        <section className={styles.heroPanel}>
          <div className={styles.heroCopy}>
            <div className={styles.promise}>
              <SparkIcon />
              Private video rooms
            </div>
            <h1>Jacob Meet</h1>
            <p className={styles.lede}>Start a clean, fast video room backed by LiveKit.</p>
            <div className={styles.featureRow} aria-label="Meeting features">
              <span>
                <VideoIcon />
                WebRTC
              </span>
              <span>
                <LockIcon />
                Optional E2EE
              </span>
              <span>
                <ServerIcon />
                Self-hosted
              </span>
            </div>
            <Suspense fallback={<div className={styles.loading}>Loading connection options</div>}>
              <Tabs>
                <DemoMeetingTab label="Demo" />
                <CustomConnectionTab label="Custom Connection" />
              </Tabs>
            </Suspense>
          </div>
          <MeetingPreview />
        </section>
      </main>
      <footer className={styles.footer} data-lk-theme="default">
        Built with{' '}
        <a href="https://github.com/livekit/components-js?ref=meet" rel="noopener">
          LiveKit Components
        </a>
        ,{' '}
        <a href="https://livekit.io/cloud?ref=meet" rel="noopener">
          LiveKit
        </a>
        , and Next.js. Source on{' '}
        <a href="https://github.com/livekit/meet?ref=meet" rel="noopener">
          GitHub
        </a>
        .
      </footer>
    </>
  );
}
