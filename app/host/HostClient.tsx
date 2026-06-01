'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { BrandLogo, JacobCredit, ThemeToggle } from '../MeetChrome';

/* ------------------------------------------------------------------ types */
type MeetingRoom = {
  code: string;
  title: string;
  createdByEmail: string;
  status: 'active' | 'ended';
  scheduledAt: string | null;
  durationMinutes: number;
  maxParticipants: number;
  waitingRoomEnabled: boolean;
  recordingEnabled: boolean;
  chatEnabled: boolean;
  screenSharingEnabled: boolean;
  muteOnEntry: boolean;
  createdAt: string;
  endedAt: string | null;
};

type CurrentUser = {
  userId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin';
  groups: string[];
};

type HostPage = 'meetings' | 'schedule' | 'recordings' | 'settings';

/* ------------------------------------------------------------------ icons */
const sv = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
};
const VideoIcon = () => (
  <svg {...sv}>
    <rect x="3" y="6" width="13" height="12" rx="2.5" />
    <path d="m16 10 4.5-2.6a.7.7 0 0 1 1 .6v8a.7.7 0 0 1-1 .6L16 14" />
  </svg>
);
const PlusIcon = () => (
  <svg {...sv}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const CloseIcon = () => (
  <svg {...sv}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
const CopyIcon = () => (
  <svg {...sv}>
    <rect x="9" y="9" width="11" height="11" rx="2.2" />
    <path d="M5 15.5A2 2 0 0 1 4 14V5a2 2 0 0 1 2-2h9a2 2 0 0 1 1.5 1" />
  </svg>
);
const LinkIcon = () => (
  <svg {...sv}>
    <path d="M10 14a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.5 1.5" />
    <path d="M14 10a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.5-1.5" />
  </svg>
);
const CalendarIcon = () => (
  <svg {...sv}>
    <rect x="4" y="5.5" width="16" height="15" rx="2.2" />
    <path d="M4 9.5h16M8 3.5v3M16 3.5v3" />
  </svg>
);
const ClockIcon = () => (
  <svg {...sv}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);
const UsersIcon = () => (
  <svg {...sv}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.6a3.2 3.2 0 0 1 0 6M17.5 19a5.5 5.5 0 0 0-2.3-3.6" />
  </svg>
);
const BoltIcon = () => (
  <svg {...sv}>
    <path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" />
  </svg>
);
const RecordIcon = () => (
  <svg {...sv}>
    <circle cx="12" cy="12" r="8.2" />
    <circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none" />
  </svg>
);
const ShieldIcon = () => (
  <svg {...sv}>
    <rect x="4.5" y="10" width="15" height="10" rx="2.2" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
  </svg>
);
const ChatIcon = () => (
  <svg {...sv}>
    <path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16H9l-4 3.5V6.5A1.5 1.5 0 0 1 6.5 5Z" />
  </svg>
);
const ScreenIcon = () => (
  <svg {...sv}>
    <rect x="3" y="4.5" width="18" height="12" rx="2" />
    <path d="M8.5 20.5h7M12 16.5v4" />
  </svg>
);
const MicOffIcon = () => (
  <svg {...sv}>
    <path d="M9 9v2a3 3 0 0 0 4.6 2.5M15 11.4V6a3 3 0 0 0-5.9-.7" />
    <path d="M5.5 11a6.5 6.5 0 0 0 10 5.4M12 17.5V21M9 21h6M4 3l16 16" />
  </svg>
);
const SignOutIcon = () => (
  <svg {...sv}>
    <path d="M9 12h11m-4-4 4 4-4 4" />
    <path d="M13 5.5H6A1.5 1.5 0 0 0 4.5 7v10A1.5 1.5 0 0 0 6 18.5h7" />
  </svg>
);
const SearchIcon = () => (
  <svg {...sv}>
    <circle cx="10.8" cy="10.8" r="6.3" />
    <path d="m16 16 4 4" />
  </svg>
);
const SettingsIcon = () => (
  <svg {...sv}>
    <path d="M12 8.2a3.8 3.8 0 1 1 0 7.6 3.8 3.8 0 0 1 0-7.6Z" />
    <path d="M19.4 13.5a7.4 7.4 0 0 0 .05-3l2-1.5-2-3.4-2.4 1a8 8 0 0 0-2.6-1.5L14.1 2h-4l-.4 3.1a8 8 0 0 0-2.6 1.5l-2.4-1-2 3.4 2 1.5a7.4 7.4 0 0 0 .05 3l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 2.6 1.5l.4 3.1h4l.4-3.1a8 8 0 0 0 2.6-1.5l2.4 1 2-3.4-2.15-1.5Z" />
  </svg>
);

/* ---------------------------------------------------------------- helpers */
function formatDateTime(value: string | null) {
  if (!value) {
    return 'Starts now';
  }
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildScheduledAt(date: string, time: string) {
  if (!date || !time) {
    return null;
  }
  const scheduledAt = new Date(`${date}T${time}`);
  return Number.isNaN(scheduledAt.getTime()) ? null : scheduledAt.toISOString();
}

function getInvitePath(code: string) {
  return `/rooms/${encodeURIComponent(code)}`;
}

function getAuthErrorMessage(code: string | null) {
  switch (code) {
    case 'access_denied':
      return 'Your Pocket ID account is not in a host access group.';
    case 'missing_state':
      return 'The Pocket ID sign-in session expired. Try signing in again.';
    case 'callback_failed':
      return 'Pocket ID sign-in could not be completed.';
    default:
      return '';
  }
}

/* ================================================================== client */
export function HostClient() {
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(null);
  const [rooms, setRooms] = React.useState<MeetingRoom[]>([]);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [createdRoomCode, setCreatedRoomCode] = React.useState('');
  const [meetingTitle, setMeetingTitle] = React.useState('Client consultation');
  const [customCode, setCustomCode] = React.useState('');
  const [meetingDate, setMeetingDate] = React.useState('');
  const [meetingTime, setMeetingTime] = React.useState('');
  const [durationMinutes, setDurationMinutes] = React.useState(60);
  const [maxParticipants, setMaxParticipants] = React.useState(25);
  const [waitingRoomEnabled, setWaitingRoomEnabled] = React.useState(true);
  const [recordingEnabled, setRecordingEnabled] = React.useState(false);
  const [chatEnabled, setChatEnabled] = React.useState(true);
  const [screenSharingEnabled, setScreenSharingEnabled] = React.useState(true);
  const [muteOnEntry, setMuteOnEntry] = React.useState(false);
  const [roomFilter, setRoomFilter] = React.useState<'active' | 'scheduled' | 'ended' | 'all'>(
    'active',
  );
  const [activePage, setActivePage] = React.useState<HostPage>('meetings');
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = React.useState(false);
  const [roomSearch, setRoomSearch] = React.useState('');

  const loadRooms = React.useCallback(async () => {
    const response = await fetch('/api/host/rooms');
    if (response.status === 401) {
      setCurrentUser(null);
      setRooms([]);
      return;
    }
    const data = (await response.json()) as { rooms: MeetingRoom[] };
    setRooms(data.rooms);
  }, []);

  React.useEffect(() => {
    let active = true;
    async function loadSession() {
      const authError = getAuthErrorMessage(
        new URLSearchParams(window.location.search).get('authError'),
      );
      if (authError) {
        setError(authError);
        window.history.replaceState(null, '', window.location.pathname);
      }

      const response = await fetch('/api/host/login');
      const data = (await response.json()) as {
        authenticated: boolean;
        email: string | null;
        name: string | null;
        role: 'owner' | 'admin' | null;
        userId: string | null;
        groups: string[];
      };
      if (!active) {
        return;
      }
      setCurrentUser(
        data.authenticated && data.email && data.role && data.userId
          ? {
              email: data.email,
              name: data.name ?? data.email,
              role: data.role,
              userId: data.userId,
              groups: data.groups,
            }
          : null,
      );
      if (data.authenticated) {
        await loadRooms();
      }
      setIsLoading(false);
    }
    loadSession().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : 'Could not load host session.');
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [loadRooms]);

  const login = () => {
    setError('');
    window.location.href = '/api/host/auth/start';
  };

  const logout = async () => {
    await fetch('/api/host/auth/session', { method: 'DELETE' });
    setCurrentUser(null);
    setRooms([]);
    setCreatedRoomCode('');
  };

  const createRoom = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setIsCreating(true);
    setError('');
    setNotice('');
    setCreatedRoomCode('');
    const response = await fetch('/api/host/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: meetingTitle,
        code: customCode,
        scheduledAt: buildScheduledAt(meetingDate, meetingTime),
        durationMinutes,
        maxParticipants,
        waitingRoomEnabled,
        recordingEnabled,
        chatEnabled,
        screenSharingEnabled,
        muteOnEntry,
      }),
    });
    const data = (await response.json().catch(() => null)) as {
      room?: MeetingRoom;
      error?: string;
    } | null;
    setIsCreating(false);
    if (!response.ok || !data?.room) {
      setError(data?.error ?? 'Could not create meeting.');
      return;
    }
    setRooms((currentRooms) => [data.room!, ...currentRooms]);
    setCustomCode('');
    setCreatedRoomCode(data.room.code);
    setIsCreateDrawerOpen(false);
    setActivePage(data.room.scheduledAt ? 'schedule' : 'meetings');
    setNotice(`${data.room.title} is ready.`);
  };

  const endRoom = async (code: string) => {
    setError('');
    const response = await fetch(`/api/host/rooms/${encodeURIComponent(code)}`, {
      method: 'DELETE',
    });
    const data = (await response.json().catch(() => null)) as {
      room?: MeetingRoom;
      error?: string;
    } | null;
    if (!response.ok || !data?.room) {
      setError(data?.error ?? 'Could not end meeting.');
      return;
    }
    setRooms((currentRooms) =>
      currentRooms.map((room) => (room.code === code ? data.room! : room)),
    );
  };

  const copyInvite = async (code: string) => {
    const inviteUrl = `${window.location.origin}/rooms/${code}`;
    await navigator.clipboard.writeText(inviteUrl);
    setNotice(`Invite link copied for ${code}.`);
  };

  const [now] = React.useState(() => Date.now());
  const getRoomBucket = React.useCallback(
    (room: MeetingRoom): 'active' | 'scheduled' | 'ended' => {
      if (room.status === 'ended') {
        return 'ended';
      }
      return room.scheduledAt && new Date(room.scheduledAt).getTime() > now
        ? 'scheduled'
        : 'active';
    },
    [now],
  );
  const activeRooms = rooms.filter((room) => getRoomBucket(room) === 'active');
  const scheduledRooms = rooms.filter((room) => getRoomBucket(room) === 'scheduled');
  const endedRooms = rooms.filter((room) => room.status === 'ended');
  const searchedRooms = rooms.filter((room) => {
    const term = roomSearch.trim().toLowerCase();
    if (!term) {
      return true;
    }
    return `${room.title} ${room.code} ${room.createdByEmail}`.toLowerCase().includes(term);
  });
  const visibleRooms = searchedRooms.filter((room) =>
    roomFilter === 'all' ? true : getRoomBucket(room) === roomFilter,
  );
  const createdRoom = createdRoomCode
    ? (rooms.find((room) => room.code === createdRoomCode) ?? null)
    : null;
  const recordingRooms = rooms.filter((room) => room.status === 'ended' && room.recordingEnabled);
  const emailDisplayName = currentUser?.email.includes('jacob')
    ? 'Jacob'
    : currentUser?.email
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
  const currentUserName =
    currentUser?.name && !['admin', 'owner'].includes(currentUser.name.toLowerCase())
      ? currentUser.name
      : emailDisplayName || 'Host';
  const hostDate = new Intl.DateTimeFormat([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date(now));

  const navItems: Array<{
    id: HostPage;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }> = [
    { id: 'meetings', label: 'Meetings', icon: <VideoIcon />, count: activeRooms.length },
    { id: 'schedule', label: 'Schedule', icon: <CalendarIcon />, count: scheduledRooms.length },
    { id: 'recordings', label: 'Recordings', icon: <RecordIcon /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
  ];

  const roomOptions = [
    [
      'waiting',
      'Waiting room',
      'Admit guests one by one',
      waitingRoomEnabled,
      setWaitingRoomEnabled,
      <ShieldIcon key="waiting" />,
    ],
    [
      'rec',
      'Recording allowed',
      'Save the session',
      recordingEnabled,
      setRecordingEnabled,
      <RecordIcon key="recording" />,
    ],
    [
      'chat',
      'Chat',
      'Let guests send messages',
      chatEnabled,
      setChatEnabled,
      <ChatIcon key="chat" />,
    ],
    [
      'screen',
      'Screen sharing',
      'Anyone can present',
      screenSharingEnabled,
      setScreenSharingEnabled,
      <ScreenIcon key="screen" />,
    ],
    [
      'mute',
      'Mute on entry',
      'Guests join muted',
      muteOnEntry,
      setMuteOnEntry,
      <MicOffIcon key="mute" />,
    ],
  ] as const;

  const renderRoomCard = (room: MeetingRoom) => {
    const bucket = getRoomBucket(room);
    const isJoinable = bucket === 'active';
    return (
      <article className={`room-card ${isJoinable ? 'is-active' : ''}`} key={room.code}>
        <span className="room-card-icon">
          <VideoIcon />
        </span>
        <div className="room-card-body">
          <div className="room-card-title">
            {room.title}
            {bucket === 'active' && (
              <span className="tag tag-live">
                <span className="tag-dot" />
                Live
              </span>
            )}
            {bucket === 'scheduled' && (
              <span className="tag">
                <ClockIcon />
                Scheduled
              </span>
            )}
            {bucket === 'ended' && <span className="tag tag-muted">Ended</span>}
          </div>
          <div className="room-card-meta">
            <span className="room-card-code">{room.code}</span>
            <span>
              <ClockIcon />
              {formatDateTime(room.scheduledAt)} · {room.durationMinutes} min
            </span>
            <span>
              <UsersIcon />
              {room.maxParticipants} max
            </span>
            {room.waitingRoomEnabled && (
              <span>
                <ShieldIcon />
                Waiting room
              </span>
            )}
            {room.recordingEnabled && (
              <span>
                <RecordIcon />
                Recording
              </span>
            )}
          </div>
        </div>
        <div className="room-card-actions">
          {isJoinable ? (
            <Link className="btn btn-primary btn-sm" href={getInvitePath(room.code)}>
              <VideoIcon />
              Join
            </Link>
          ) : (
            <button className="btn btn-ghost btn-sm" disabled>
              <VideoIcon />
              {bucket === 'scheduled' ? 'Start later' : 'Ended'}
            </button>
          )}
          <button
            className="icon-btn"
            title="Copy invite"
            onClick={() => copyInvite(room.code)}
            disabled={!isJoinable && bucket !== 'scheduled'}
          >
            <LinkIcon />
          </button>
          <button
            className="icon-btn danger"
            title="End meeting"
            onClick={() => endRoom(room.code)}
            disabled={!isJoinable}
          >
            <CloseIcon />
          </button>
        </div>
      </article>
    );
  };

  const meetingForm = (
    <form className="drawer-form" onSubmit={createRoom}>
      <label className="field">
        <span className="field-label">Meeting title</span>
        <input
          className="input"
          type="text"
          value={meetingTitle}
          onChange={(event) => setMeetingTitle(event.target.value)}
          placeholder="Client consultation"
          maxLength={80}
        />
      </label>
      <label className="field">
        <span className="field-label">
          Custom code <span className="opt">· optional</span>
        </span>
        <input
          className="input"
          type="text"
          value={customCode}
          onChange={(event) => setCustomCode(event.target.value.toUpperCase())}
          placeholder="JACOB-ROOM"
          autoComplete="off"
        />
      </label>
      <div className="drawer-grid">
        <label className="field">
          <span className="field-label">
            Date <span className="opt">· optional</span>
          </span>
          <input
            className="input"
            type="date"
            value={meetingDate}
            onChange={(event) => setMeetingDate(event.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">
            Time <span className="opt">· optional</span>
          </span>
          <input
            className="input"
            type="time"
            value={meetingTime}
            onChange={(event) => setMeetingTime(event.target.value)}
          />
        </label>
      </div>
      <div className="drawer-grid">
        <label className="field">
          <span className="field-label">Duration</span>
          <select
            className="select"
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(Number(event.target.value))}
          >
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>90 minutes</option>
            <option value={120}>2 hours</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Guest limit</span>
          <input
            className="input"
            type="number"
            min={2}
            max={200}
            value={maxParticipants}
            onChange={(event) => setMaxParticipants(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="field-sep" />
      <div className="sect-label">Meeting options</div>
      <div className="opt-list">
        {roomOptions.map(([key, name, desc, value, setter, icon]) => (
          <div className="opt-row" key={key}>
            <div className="ol">
              <span className="oi">{icon}</span>
              <div>
                <div className="on">{name}</div>
                <div className="od">{desc}</div>
              </div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={value}
                onChange={(event) => (setter as (v: boolean) => void)(event.target.checked)}
              />
              <span className="toggle-track" />
            </label>
          </div>
        ))}
      </div>
      <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={isCreating}>
        {isCreating
          ? 'Creating…'
          : meetingDate && meetingTime
            ? 'Schedule meeting'
            : 'Create meeting'}
      </button>
    </form>
  );

  /* ------------------------------------------------------------- render */
  return (
    <main className="host" data-lk-theme="default">
      {!currentUser && (
        <header className="host-topbar">
          <BrandLogo />
          <nav className="host-links" aria-label="Host navigation">
            <Link className="btn btn-quiet btn-sm" href="/">
              Join page
            </Link>
            <ThemeToggle />
          </nav>
        </header>
      )}

      <section
        className={currentUser ? 'host-shell host-shell-dash' : 'host-shell host-shell-login'}
      >
        {isLoading ? (
          <div className="host-loading">Loading host access…</div>
        ) : !currentUser ? (
          /* -------------------------------------------------- login */
          <div className="host-auth">
            <div className="host-auth-card">
              <div className="host-auth-head">
                <span className="lk">
                  <span className="logo-mark logo-mark-image">
                    <Image src="/images/jacob-logo.png" alt="" width={32} height={32} priority />
                  </span>
                  <span className="logo-name">Meet</span>
                </span>
                <h1>Welcome back</h1>
                <p>Sign in to schedule rooms and manage your meetings.</p>
              </div>

              <div className="host-auth-form">
                {error && (
                  <p className="join-error" role="alert">
                    <CloseIcon />
                    {error}
                  </p>
                )}
                <button className="btn btn-primary btn-lg btn-block" type="button" onClick={login}>
                  Sign in with Pocket ID
                </button>
              </div>

              <div className="host-auth-foot">
                <ShieldIcon />
                Protected by Pocket ID groups
              </div>
            </div>
            <JacobCredit />
          </div>
        ) : (
          <div className="dash fade-in">
            <aside className="dash-side">
              <div className="dash-side-logo">
                <BrandLogo />
              </div>
              <div className="dash-nav" aria-label="Host sections">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    className="nav-item"
                    data-active={activePage === item.id}
                    onClick={() => setActivePage(item.id)}
                  >
                    {item.icon}
                    {item.label}
                    {typeof item.count === 'number' && (
                      <span className="nav-count">{item.count}</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="dash-side-foot">
                <span className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                  {currentUser.email.slice(0, 2).toUpperCase()}
                </span>
                <div className="who">
                  <b>{currentUserName}</b>
                  <span>{currentUser.role}</span>
                </div>
                <button className="icon-btn side-signout" title="Sign out" onClick={logout}>
                  <SignOutIcon />
                </button>
              </div>
            </aside>

            <main className="dash-main">
              <header className="dash-header">
                <div>
                  <h1>
                    {activePage === 'meetings' && `Good afternoon, ${currentUserName}`}
                    {activePage === 'schedule' && 'Schedule'}
                    {activePage === 'recordings' && 'Recordings'}
                    {activePage === 'settings' && 'Settings'}
                  </h1>
                  <span className="dt">
                    {hostDate} · {activeRooms.length} live · {scheduledRooms.length} scheduled
                  </span>
                </div>
                <div className="dash-header-actions">
                  <Link className="btn btn-quiet btn-sm" href="/">
                    Join page
                  </Link>
                  <ThemeToggle />
                  <button className="icon-btn search-btn" title="Search meetings">
                    <SearchIcon />
                  </button>
                  <button
                    className="btn btn-primary btn-md"
                    onClick={() => setIsCreateDrawerOpen(true)}
                  >
                    <PlusIcon />
                    New meeting
                  </button>
                </div>
              </header>

              {(error || notice) && (
                <div
                  className={`banner ${error ? 'banner-error' : 'banner-notice'}`}
                  role={error ? 'alert' : 'status'}
                >
                  <span>{error || notice}</span>
                  {createdRoom && (
                    <div className="banner-actions">
                      <Link
                        className="btn btn-primary btn-sm"
                        href={getInvitePath(createdRoom.code)}
                      >
                        <VideoIcon />
                        Join meeting
                      </Link>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => copyInvite(createdRoom.code)}
                      >
                        <CopyIcon />
                        Copy invite
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activePage === 'meetings' && (
                <>
                  <div className="metrics">
                    <div className="metric accent">
                      <div className="metric-top">
                        <span className="mi">
                          <BoltIcon />
                        </span>
                        <span className="mtrend">{activeRooms.length ? 'Ready' : 'Quiet'}</span>
                      </div>
                      <span className="mv">{activeRooms.length}</span>
                      <span className="ml">Live now</span>
                    </div>
                    <div className="metric blue">
                      <div className="metric-top">
                        <span className="mi">
                          <CalendarIcon />
                        </span>
                        <span className="mtrend">{scheduledRooms[0] ? 'Next up' : 'Open'}</span>
                      </div>
                      <span className="mv">{scheduledRooms.length}</span>
                      <span className="ml">Scheduled</span>
                    </div>
                    <div className="metric">
                      <span className="mi">
                        <UsersIcon />
                      </span>
                      <span className="mv">{currentUser.groups.length}</span>
                      <span className="ml">Groups</span>
                    </div>
                    <div className="metric">
                      <span className="mi">
                        <RecordIcon />
                      </span>
                      <span className="mv">{recordingRooms.length}</span>
                      <span className="ml">Recordings</span>
                    </div>
                  </div>

                  <section className="dash-section">
                    <div className="dash-section-head">
                      <h2>
                        Meetings <span className="cnt">{visibleRooms.length}</span>
                      </h2>
                      <div className="dash-tools">
                        <label className="search-field">
                          <SearchIcon />
                          <input
                            value={roomSearch}
                            onChange={(event) => setRoomSearch(event.target.value)}
                            placeholder="Search title or code"
                          />
                        </label>
                        <div className="segmented" role="tablist" aria-label="Meeting filters">
                          {(['active', 'scheduled', 'ended', 'all'] as const).map((filter) => (
                            <button
                              key={filter}
                              type="button"
                              data-active={roomFilter === filter}
                              onClick={() => setRoomFilter(filter)}
                            >
                              {filter === 'all' ? 'All' : filter}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="room-list">
                      {visibleRooms.length === 0 ? (
                        <div className="empty">
                          <span className="ei">
                            <VideoIcon />
                          </span>
                          <div>No meetings match this view.</div>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setIsCreateDrawerOpen(true)}
                          >
                            <PlusIcon />
                            Create one
                          </button>
                        </div>
                      ) : (
                        visibleRooms.map(renderRoomCard)
                      )}
                    </div>
                  </section>
                </>
              )}

              {activePage === 'schedule' && (
                <div className="dash-grid">
                  <section className="panel schedule-panel">
                    <div className="panel-head">
                      <div>
                        <span className="eyebrow">Plan ahead</span>
                        <h2>Create or schedule a room</h2>
                      </div>
                    </div>
                    {meetingForm}
                  </section>
                  <section className="panel">
                    <div className="panel-head">
                      <div>
                        <span className="eyebrow">Upcoming</span>
                        <h2>Scheduled meetings</h2>
                      </div>
                      <span className="tag">{scheduledRooms.length} scheduled</span>
                    </div>
                    <div className="room-list compact">
                      {scheduledRooms.length ? (
                        scheduledRooms.map(renderRoomCard)
                      ) : (
                        <div className="empty">No scheduled rooms yet.</div>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {activePage === 'recordings' && (
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <span className="eyebrow">Archive</span>
                      <h2>Recordings</h2>
                    </div>
                    <span className="tag">{recordingRooms.length} sessions</span>
                  </div>
                  <div className="recording-list">
                    {recordingRooms.length ? (
                      recordingRooms.map((room) => (
                        <article className="recording-row" key={room.code}>
                          <span className="room-card-icon">
                            <RecordIcon />
                          </span>
                          <div>
                            <strong>{room.title}</strong>
                            <p>
                              {room.code} · {formatDateTime(room.endedAt ?? room.scheduledAt)}
                            </p>
                          </div>
                          <button className="btn btn-ghost btn-sm" disabled>
                            View recording
                          </button>
                        </article>
                      ))
                    ) : (
                      <div className="empty">Recordings will appear here after meetings end.</div>
                    )}
                  </div>
                </section>
              )}

              {activePage === 'settings' && (
                <div className="dash-grid settings-grid">
                  <section className="panel">
                    <div className="panel-head">
                      <div>
                        <span className="eyebrow">Security defaults</span>
                        <h2>New meeting settings</h2>
                      </div>
                    </div>
                    <div className="opt-list">
                      {roomOptions.map(([key, name, desc, value, setter, icon]) => (
                        <div className="opt-row" key={key}>
                          <div className="ol">
                            <span className="oi">{icon}</span>
                            <div>
                              <div className="on">{name}</div>
                              <div className="od">{desc}</div>
                            </div>
                          </div>
                          <label className="toggle">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(event) =>
                                (setter as (v: boolean) => void)(event.target.checked)
                              }
                            />
                            <span className="toggle-track" />
                          </label>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="panel">
                    <div className="panel-head">
                      <div>
                        <span className="eyebrow">Account</span>
                        <h2>Pocket ID access</h2>
                      </div>
                      <span className="tag">
                        <ShieldIcon />
                        {currentUser.role}
                      </span>
                    </div>
                    <div className="user-list user-list-panel">
                      <article className="user-row">
                        <div>
                          <strong>{currentUser.name}</strong>
                          <p>{currentUser.email}</p>
                        </div>
                        <span className="status active">{currentUser.role}</span>
                      </article>
                      <article className="user-row">
                        <div>
                          <strong>Pocket ID groups</strong>
                          <p>
                            {currentUser.groups.length
                              ? currentUser.groups.join(', ')
                              : 'No groups returned'}
                          </p>
                        </div>
                      </article>
                    </div>
                  </section>
                </div>
              )}

              {isCreateDrawerOpen && (
                <>
                  <div className="drawer-scrim" onClick={() => setIsCreateDrawerOpen(false)} />
                  <aside className="drawer" aria-label="New meeting drawer">
                    <div className="drawer-head">
                      <div>
                        <h2>New meeting</h2>
                        <p>Set it up once, then share the link anywhere.</p>
                      </div>
                      <button className="icon-btn" onClick={() => setIsCreateDrawerOpen(false)}>
                        <CloseIcon />
                      </button>
                    </div>
                    <div className="drawer-body">{meetingForm}</div>
                  </aside>
                </>
              )}
              <JacobCredit />
            </main>
          </div>
        )}
      </section>
    </main>
  );
}
