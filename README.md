# LiveKit Meet

Private meeting portal for hosted video sessions.

This is a Next.js app backed by LiveKit for video rooms and PostgreSQL for host-created meeting
codes. This repository is the source for the deployment at `meet.jacobbarkin.com`.

## What It Does

- Public participants join only with an active room code or invite link.
- Hosts sign in at `/host`, create meeting rooms, copy invite links, and end rooms.
- Host authentication is handled by Pocket ID OIDC groups, with no local usernames or passwords.
- `/api/connection-details` checks PostgreSQL before issuing a LiveKit token, so arbitrary room
  names cannot create joinable meetings.
- Room records are created automatically in the `meeting_rooms` table on first use.

## Tech Stack

- Next.js App Router
- LiveKit React components, client SDK, and server SDK
- PostgreSQL via `pg`
- Vitest for unit tests
- Coolify-friendly Docker deployment

## Local Development

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the required values.

3. Start the app:

   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Required Environment Variables

```bash
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=wss://your-livekit-host
DATABASE_URL=postgresql://user:password@host:5432/database
DATABASE_SSL=false
AUTH_SECRET=
POCKET_ID_ISSUER_URL=https://id.example.com
POCKET_ID_CLIENT_ID=
POCKET_ID_CLIENT_SECRET=
POCKET_ID_REDIRECT_URI=https://meet.example.com/api/host/auth/callback
POCKET_ID_ADMIN_GROUP=meet-admins
POCKET_ID_OWNER_GROUP=meet-owners
POCKET_ID_GROUPS_CLAIM=groups
```

Generate `AUTH_SECRET` with:

```bash
openssl rand -base64 32
```

Create an OIDC client in Pocket ID with callback URL matching `POCKET_ID_REDIRECT_URI`. Enable PKCE
and request `openid profile email groups`. Users in `POCKET_ID_ADMIN_GROUP` can create and manage
rooms. Users in `POCKET_ID_OWNER_GROUP` receive the owner role. If the owner group is also present,
it takes precedence over the admin role.

For local Pocket ID issuers served over plain HTTP, set `POCKET_ID_ALLOW_INSECURE_HTTP=true`.

## Optional Environment Variables

```bash
NEXT_PUBLIC_SHOW_SETTINGS_MENU=true
NEXT_PUBLIC_LK_RECORD_ENDPOINT=/api/record
S3_KEY_ID=
S3_KEY_SECRET=
S3_ENDPOINT=
S3_BUCKET=
S3_REGION=
```

The settings menu enables camera, microphone, speaker, background, and optional recording controls.
Recording requires the S3 variables and a LiveKit egress-capable deployment.

## Local Postgres Integration Test

```bash
docker run --name jacob-meet-postgres \
  -e POSTGRES_USER=jacobmeet \
  -e POSTGRES_PASSWORD=jacobmeet \
  -e POSTGRES_DB=jacobmeet_test \
  -p 55432:5432 \
  -d postgres:17

TEST_DATABASE_URL=postgresql://jacobmeet:jacobmeet@127.0.0.1:55432/jacobmeet_test \
  pnpm test lib/postgres-integration.test.ts
```

## Coolify Deployment

1. Create or connect the app in Coolify from this repository.
2. Add a PostgreSQL resource in the same Coolify project.
3. Copy the internal Postgres connection string into the app as `DATABASE_URL`.
4. Set `DATABASE_SSL=false` for Coolify internal networking unless the Postgres service requires TLS.
5. In Pocket ID, create an OIDC client for the app, enable PKCE, add the callback URL
   `https://<your-app-domain>/api/host/auth/callback`, and add the host admin/owner groups.
6. Add the LiveKit variables, `AUTH_SECRET`, and the `POCKET_ID_*` variables as app environment
   variables.
7. Deploy the app. The `meeting_rooms` table is created automatically on first use.
8. Open `/host`, sign in with Pocket ID, then create rooms and copy invite links.

The Docker image includes a health check against `/api/health`, so Coolify can wait for the Next.js
server before routing traffic to the container.

## Useful Commands

```bash
pnpm test
pnpm format:check
pnpm build
```

## Repository Policy

`main` is the canonical branch. This repo is not intended to merge back into the original LiveKit
example project.

## License

This project is distributed under the Apache License, Version 2.0. It contains code derived from
LiveKit Meet, with modifications by Jacob Barkin. See `LICENSE` and `NOTICE`.
