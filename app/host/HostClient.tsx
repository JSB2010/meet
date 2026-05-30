'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import styles from '../../styles/Host.module.css';

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

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin';
  status: 'active' | 'disabled';
  sessionVersion: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

type CurrentUser = {
  userId: string;
  email: string;
  role: 'owner' | 'admin';
};

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M8.25 8.25h8.5v8.5h-8.5zM6 15.75H5.5A2.25 2.25 0 0 1 3.25 13.5v-8A2.25 2.25 0 0 1 5.5 3.25h8A2.25 2.25 0 0 1 15.75 5.5V6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function EndIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 7 17 17M17 7 7 17"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

export function HostClient() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(null);
  const [rooms, setRooms] = React.useState<MeetingRoom[]>([]);
  const [adminUsers, setAdminUsers] = React.useState<AdminUser[]>([]);
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
  const [newUserEmail, setNewUserEmail] = React.useState('');
  const [newUserName, setNewUserName] = React.useState('');
  const [newUserPassword, setNewUserPassword] = React.useState('');
  const [newUserRole, setNewUserRole] = React.useState<'admin' | 'owner'>('admin');
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [replacementPassword, setReplacementPassword] = React.useState('');

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

  const loadUsers = React.useCallback(async () => {
    const response = await fetch('/api/host/users');
    if (response.status === 401) {
      setCurrentUser(null);
      setAdminUsers([]);
      return;
    }
    const data = (await response.json()) as { users: AdminUser[] };
    setAdminUsers(data.users);
  }, []);

  React.useEffect(() => {
    let active = true;
    async function loadSession() {
      const response = await fetch('/api/host/login');
      const data = (await response.json()) as {
        authenticated: boolean;
        email: string | null;
        role: 'owner' | 'admin' | null;
        userId: string | null;
      };
      if (!active) {
        return;
      }
      setCurrentUser(
        data.authenticated && data.email && data.role && data.userId
          ? { email: data.email, role: data.role, userId: data.userId }
          : null,
      );
      if (data.authenticated) {
        await Promise.all([loadRooms(), loadUsers()]);
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
  }, [loadRooms, loadUsers]);

  const login = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/host/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = (await response.json().catch(() => null)) as {
      email?: string;
      error?: string;
      role?: 'owner' | 'admin';
      userId?: string;
    } | null;
    if (!response.ok) {
      setError(data?.error ?? 'Could not sign in.');
      return;
    }
    setCurrentUser({
      email: data?.email ?? email,
      role: data?.role ?? 'admin',
      userId: data?.userId ?? '',
    });
    setPassword('');
    await Promise.all([loadRooms(), loadUsers()]);
  };

  const logout = async () => {
    await fetch('/api/host/login', { method: 'DELETE' });
    setCurrentUser(null);
    setRooms([]);
    setAdminUsers([]);
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

  const createUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    const response = await fetch('/api/host/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newUserEmail,
        name: newUserName,
        password: newUserPassword,
        role: newUserRole,
      }),
    });
    const data = (await response.json().catch(() => null)) as {
      user?: AdminUser;
      error?: string;
    } | null;
    if (!response.ok || !data?.user) {
      setError(data?.error ?? 'Could not create admin user.');
      return;
    }
    setAdminUsers((users) => [...users, data.user!]);
    setNewUserEmail('');
    setNewUserName('');
    setNewUserPassword('');
    setNewUserRole('admin');
    setNotice(`Admin user ${data.user.email} was created.`);
  };

  const changePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser) {
      return;
    }
    setError('');
    setNotice('');
    const response = await fetch(`/api/host/users/${currentUser.userId}/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword,
        password: replacementPassword,
      }),
    });
    const data = (await response.json().catch(() => null)) as {
      user?: AdminUser;
      error?: string;
    } | null;
    if (!response.ok || !data?.user) {
      setError(data?.error ?? 'Could not change password.');
      return;
    }
    setCurrentPassword('');
    setReplacementPassword('');
    setNotice('Password changed. Sign in again on your next session.');
    await logout();
  };

  const setUserStatus = async (user: AdminUser, status: 'active' | 'disabled') => {
    setError('');
    setNotice('');
    const response = await fetch(`/api/host/users/${user.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = (await response.json().catch(() => null)) as {
      user?: AdminUser;
      error?: string;
    } | null;
    if (!response.ok || !data?.user) {
      setError(data?.error ?? 'Could not update admin user.');
      return;
    }
    setAdminUsers((users) =>
      users.map((adminUser) => (adminUser.id === data.user!.id ? data.user! : adminUser)),
    );
    setNotice(`${data.user.email} is now ${data.user.status}.`);
  };

  const now = Date.now();
  const activeRooms = rooms.filter((room) => room.status === 'active');
  const scheduledRooms = activeRooms.filter(
    (room) => room.scheduledAt && new Date(room.scheduledAt).getTime() > now,
  );
  const endedRooms = rooms.filter((room) => room.status === 'ended');
  const visibleRooms = rooms.filter((room) => {
    if (roomFilter === 'active') {
      return room.status === 'active';
    }
    if (roomFilter === 'scheduled') {
      return room.scheduledAt && new Date(room.scheduledAt).getTime() > now;
    }
    if (roomFilter === 'ended') {
      return room.status === 'ended';
    }
    return true;
  });
  const createdRoom = createdRoomCode
    ? (rooms.find((room) => room.code === createdRoomCode) ?? null)
    : null;

  return (
    <main className={styles.main}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>
            <Image src="/images/jacob-logo.png" alt="" width={34} height={34} priority />
          </span>
          <span>LiveKit Meet</span>
        </Link>
        <nav className={styles.headerLinks} aria-label="Host navigation">
          <Link className={styles.secondaryLink} href="/">
            Join page
          </Link>
          {currentUser && (
            <button className={styles.textButton} onClick={logout}>
              Sign out
            </button>
          )}
        </nav>
      </header>

      <section className={styles.shell}>
        <div className={styles.intro}>
          <h1>Meeting console</h1>
          <p>
            Create instant or scheduled rooms, tune meeting options, and manage invite access from
            one place.
          </p>
        </div>

        {isLoading ? (
          <div className={styles.panel}>Loading host access...</div>
        ) : !currentUser ? (
          <div className={styles.authShell}>
            <form className={styles.authPanel} onSubmit={login}>
              <div>
                <span className={styles.eyebrow}>Host access</span>
                <h2>Sign in to manage meetings</h2>
                <p>Create rooms, schedule sessions, and manage admin access.</p>
              </div>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              <button className={styles.primaryButton} type="submit">
                Sign in
              </button>
            </form>

            <aside className={styles.authAside} aria-label="Host tools">
              <div>
                <span className={styles.eyebrow}>What hosts can do</span>
                <h2>Rooms, links, and access controls in one place</h2>
              </div>
              <div className={styles.authFeatureGrid}>
                <div>
                  <strong>Schedule ahead</strong>
                  <span>Add a title, time, duration, and participant limit.</span>
                </div>
                <div>
                  <strong>Start quickly</strong>
                  <span>Create a room and jump straight into the meeting.</span>
                </div>
                <div>
                  <strong>Share cleanly</strong>
                  <span>Copy invite links or use custom meeting codes.</span>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className={styles.dashboard}>
            <section className={styles.commandBar} aria-label="Host account">
              <div>
                <span className={styles.eyebrow}>Signed in as {currentUser.role}</span>
                <h2>{currentUser.email}</h2>
              </div>
              <div className={styles.commandActions}>
                <Link className={styles.secondaryLink} href="/">
                  Guest join page
                </Link>
              </div>
            </section>

            <section className={styles.summaryGrid} aria-label="Meeting summary">
              <div className={styles.metric}>
                <span>Active rooms</span>
                <strong>{activeRooms.length}</strong>
              </div>
              <div className={styles.metric}>
                <span>Scheduled</span>
                <strong>{scheduledRooms.length}</strong>
              </div>
              <div className={styles.metric}>
                <span>Ended</span>
                <strong>{endedRooms.length}</strong>
              </div>
              <div className={styles.metric}>
                <span>Admins</span>
                <strong>{adminUsers.filter((user) => user.status === 'active').length}</strong>
              </div>
            </section>

            {(error || notice) && (
              <div
                className={error ? styles.error : styles.notice}
                role={error ? 'alert' : 'status'}
              >
                <span>{error || notice}</span>
                {createdRoom && (
                  <div className={styles.noticeActions}>
                    <Link className={styles.primaryButton} href={getInvitePath(createdRoom.code)}>
                      <VideoIcon />
                      Join meeting
                    </Link>
                    <button
                      className={styles.textButton}
                      onClick={() => copyInvite(createdRoom.code)}
                    >
                      <CopyIcon />
                      Copy invite
                    </button>
                  </div>
                )}
              </div>
            )}

            <section className={styles.workspace} aria-label="Meeting setup">
              <form className={styles.createPanel} onSubmit={createRoom}>
                <div className={styles.panelHeader}>
                  <div>
                    <span className={styles.eyebrow}>New meeting</span>
                    <h2>Create or schedule a room</h2>
                  </div>
                  <button className={styles.primaryButton} type="submit" disabled={isCreating}>
                    <PlusIcon />
                    {isCreating ? 'Creating...' : 'Create meeting'}
                  </button>
                </div>

                <div className={styles.formGrid}>
                  <label className={styles.wideField}>
                    Meeting title
                    <input
                      type="text"
                      value={meetingTitle}
                      onChange={(event) => setMeetingTitle(event.target.value)}
                      placeholder="Client consultation"
                      maxLength={80}
                    />
                  </label>
                  <label>
                    Custom code
                    <input
                      type="text"
                      value={customCode}
                      onChange={(event) => setCustomCode(event.target.value.toUpperCase())}
                      placeholder="JACOB-ROOM"
                      autoComplete="off"
                    />
                  </label>
                  <label>
                    Date
                    <input
                      type="date"
                      value={meetingDate}
                      onChange={(event) => setMeetingDate(event.target.value)}
                    />
                  </label>
                  <label>
                    Time
                    <input
                      type="time"
                      value={meetingTime}
                      onChange={(event) => setMeetingTime(event.target.value)}
                    />
                  </label>
                  <label>
                    Duration
                    <select
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
                  <label>
                    Participant limit
                    <input
                      type="number"
                      min={2}
                      max={200}
                      value={maxParticipants}
                      onChange={(event) => setMaxParticipants(Number(event.target.value))}
                    />
                  </label>
                </div>

                <div className={styles.optionGrid}>
                  <label className={styles.toggleRow}>
                    <input
                      type="checkbox"
                      checked={waitingRoomEnabled}
                      onChange={(event) => setWaitingRoomEnabled(event.target.checked)}
                    />
                    <span>Waiting room</span>
                  </label>
                  <label className={styles.toggleRow}>
                    <input
                      type="checkbox"
                      checked={recordingEnabled}
                      onChange={(event) => setRecordingEnabled(event.target.checked)}
                    />
                    <span>Recording allowed</span>
                  </label>
                  <label className={styles.toggleRow}>
                    <input
                      type="checkbox"
                      checked={chatEnabled}
                      onChange={(event) => setChatEnabled(event.target.checked)}
                    />
                    <span>Chat</span>
                  </label>
                  <label className={styles.toggleRow}>
                    <input
                      type="checkbox"
                      checked={screenSharingEnabled}
                      onChange={(event) => setScreenSharingEnabled(event.target.checked)}
                    />
                    <span>Screen sharing</span>
                  </label>
                  <label className={styles.toggleRow}>
                    <input
                      type="checkbox"
                      checked={muteOnEntry}
                      onChange={(event) => setMuteOnEntry(event.target.checked)}
                    />
                    <span>Mute on entry</span>
                  </label>
                </div>
              </form>

              <aside className={styles.quickPanel} aria-label="Quick actions">
                <span className={styles.eyebrow}>Fast start</span>
                <h2>Use the latest room immediately</h2>
                <p>
                  After creating a room, join it as host or copy the invite without hunting through
                  the room list.
                </p>
                {activeRooms[0] ? (
                  <div className={styles.quickRoom}>
                    <strong>{activeRooms[0].title}</strong>
                    <span>{activeRooms[0].code}</span>
                    <div className={styles.quickActions}>
                      <Link
                        className={styles.primaryButton}
                        href={getInvitePath(activeRooms[0].code)}
                      >
                        <VideoIcon />
                        Join meeting
                      </Link>
                      <button
                        className={styles.textButton}
                        onClick={() => copyInvite(activeRooms[0].code)}
                      >
                        <CopyIcon />
                        Copy invite
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className={styles.emptyInline}>No active rooms yet.</p>
                )}
              </aside>
            </section>

            <section className={styles.roomsPanel} aria-label="Meeting rooms">
              <div className={styles.roomsHeader}>
                <div>
                  <span className={styles.eyebrow}>Rooms</span>
                  <h2>Meeting management</h2>
                </div>
                <div className={styles.tabs} role="tablist" aria-label="Meeting filters">
                  {(['active', 'scheduled', 'ended', 'all'] as const).map((filter) => (
                    <button
                      key={filter}
                      className={roomFilter === filter ? styles.tabActive : ''}
                      onClick={() => setRoomFilter(filter)}
                      type="button"
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.roomList}>
                {visibleRooms.length === 0 ? (
                  <div className={styles.emptyState}>No rooms have been created yet.</div>
                ) : (
                  visibleRooms.map((room) => (
                    <article className={styles.roomRow} key={room.code}>
                      <div className={styles.roomMain}>
                        <strong>{room.title}</strong>
                        <p>
                          <CalendarIcon />
                          {formatDateTime(room.scheduledAt)} · {room.durationMinutes} min ·{' '}
                          {room.maxParticipants} people
                        </p>
                      </div>
                      <span className={styles.roomCode}>{room.code}</span>
                      <span className={`${styles.status} ${styles[room.status]}`}>
                        {room.status}
                      </span>
                      <div className={styles.roomOptions}>
                        {room.waitingRoomEnabled && <span>Waiting room</span>}
                        {room.recordingEnabled && <span>Recording</span>}
                        {room.chatEnabled && <span>Chat</span>}
                      </div>
                      <div className={styles.rowActions}>
                        {room.status === 'active' ? (
                          <Link className={styles.primaryButton} href={getInvitePath(room.code)}>
                            <VideoIcon />
                            Join
                          </Link>
                        ) : (
                          <button disabled>
                            <VideoIcon />
                            Join
                          </button>
                        )}
                        <button
                          onClick={() => copyInvite(room.code)}
                          disabled={room.status !== 'active'}
                        >
                          <CopyIcon />
                          Copy invite
                        </button>
                        <button
                          className={styles.dangerButton}
                          onClick={() => endRoom(room.code)}
                          disabled={room.status !== 'active'}
                        >
                          <EndIcon />
                          End
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className={styles.usersPanel} aria-label="Admin users">
              <div className={styles.roomsHeader}>
                <div>
                  <span className={styles.eyebrow}>Access</span>
                  <h2>Admin users</h2>
                </div>
                <span>{adminUsers.filter((user) => user.status === 'active').length} active</span>
              </div>
              <div className={styles.userGrid}>
                <form className={styles.userForm} onSubmit={changePassword}>
                  <h3>Change your password</h3>
                  <label>
                    Current password
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </label>
                  <label>
                    New password
                    <input
                      type="password"
                      value={replacementPassword}
                      onChange={(event) => setReplacementPassword(event.target.value)}
                      autoComplete="new-password"
                      minLength={12}
                      required
                    />
                  </label>
                  <button className={styles.primaryButton} type="submit">
                    Change password
                  </button>
                </form>

                {currentUser.role === 'owner' && (
                  <form className={styles.userForm} onSubmit={createUser}>
                    <h3>Create admin</h3>
                    <label>
                      Email
                      <input
                        type="email"
                        value={newUserEmail}
                        onChange={(event) => setNewUserEmail(event.target.value)}
                        autoComplete="off"
                        required
                      />
                    </label>
                    <label>
                      Name
                      <input
                        type="text"
                        value={newUserName}
                        onChange={(event) => setNewUserName(event.target.value)}
                        autoComplete="off"
                      />
                    </label>
                    <label>
                      Temporary password
                      <input
                        type="password"
                        value={newUserPassword}
                        onChange={(event) => setNewUserPassword(event.target.value)}
                        autoComplete="new-password"
                        minLength={12}
                        required
                      />
                    </label>
                    <label>
                      Role
                      <select
                        value={newUserRole}
                        onChange={(event) =>
                          setNewUserRole(event.target.value === 'owner' ? 'owner' : 'admin')
                        }
                      >
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                      </select>
                    </label>
                    <button className={styles.primaryButton} type="submit">
                      Create user
                    </button>
                  </form>
                )}
              </div>

              <div className={styles.userList}>
                {adminUsers.map((user) => (
                  <article className={styles.userRow} key={user.id}>
                    <div>
                      <strong>{user.name || user.email}</strong>
                      <p>{user.email}</p>
                    </div>
                    <span className={`${styles.status} ${styles[user.status]}`}>
                      {user.role} · {user.status}
                    </span>
                    <div className={styles.rowActions}>
                      {currentUser.role === 'owner' && user.id !== currentUser.userId && (
                        <button
                          onClick={() =>
                            setUserStatus(user, user.status === 'active' ? 'disabled' : 'active')
                          }
                        >
                          {user.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
