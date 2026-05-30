'use client';

import Link from 'next/link';
import React from 'react';
import styles from '../../styles/Host.module.css';

type MeetingRoom = {
  code: string;
  createdByEmail: string;
  status: 'active' | 'ended';
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
    const data = (await response.json()) as {
      email?: string;
      error?: string;
      role?: 'owner' | 'admin';
      userId?: string;
    };
    if (!response.ok) {
      setError(data.error ?? 'Could not sign in.');
      return;
    }
    setCurrentUser({
      email: data.email ?? email,
      role: data.role ?? 'admin',
      userId: data.userId ?? '',
    });
    setPassword('');
    await Promise.all([loadRooms(), loadUsers()]);
  };

  const logout = async () => {
    await fetch('/api/host/login', { method: 'DELETE' });
    setCurrentUser(null);
    setRooms([]);
    setAdminUsers([]);
  };

  const createRoom = async () => {
    setIsCreating(true);
    setError('');
    setNotice('');
    const response = await fetch('/api/host/rooms', { method: 'POST' });
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
    setNotice(`Meeting ${data.room.code} is ready.`);
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

  return (
    <main className={styles.main}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>JB</span>
          <span>Jacob Meet</span>
        </Link>
        <Link className={styles.secondaryLink} href="/">
          Join page
        </Link>
      </header>

      <section className={styles.shell}>
        <div className={styles.intro}>
          <h1>Host console</h1>
          <p>
            Create active meeting rooms, copy invite links, and close rooms when a session ends.
          </p>
        </div>

        {isLoading ? (
          <div className={styles.panel}>Loading host access...</div>
        ) : !currentUser ? (
          <form className={styles.authPanel} onSubmit={login}>
            <div>
              <h2>Sign in to host</h2>
              <p>Use the admin email and password configured for this deployment.</p>
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
        ) : (
          <div className={styles.dashboard}>
            <div className={styles.actionsPanel}>
              <div>
                <span className={styles.eyebrow}>
                  Signed in as {currentUser.email} ({currentUser.role})
                </span>
                <h2>Create a meeting</h2>
                <p>
                  New rooms receive an 8-character invite code and a direct link for participants.
                </p>
              </div>
              <button className={styles.primaryButton} onClick={createRoom} disabled={isCreating}>
                <PlusIcon />
                {isCreating ? 'Creating...' : 'Create room'}
              </button>
              <button className={styles.textButton} onClick={logout}>
                Sign out
              </button>
            </div>

            {(error || notice) && (
              <p className={error ? styles.error : styles.notice} role={error ? 'alert' : 'status'}>
                {error || notice}
              </p>
            )}

            <section className={styles.roomsPanel} aria-label="Meeting rooms">
              <div className={styles.roomsHeader}>
                <h2>Meeting rooms</h2>
                <span>{rooms.filter((room) => room.status === 'active').length} active</span>
              </div>
              <div className={styles.roomList}>
                {rooms.length === 0 ? (
                  <div className={styles.emptyState}>No rooms have been created yet.</div>
                ) : (
                  rooms.map((room) => (
                    <article className={styles.roomRow} key={room.code}>
                      <div>
                        <span className={styles.roomCode}>{room.code}</span>
                        <p>
                          Created {new Date(room.createdAt).toLocaleString()} by{' '}
                          {room.createdByEmail}
                        </p>
                      </div>
                      <span className={`${styles.status} ${styles[room.status]}`}>
                        {room.status}
                      </span>
                      <div className={styles.rowActions}>
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
                <h2>Admin users</h2>
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
