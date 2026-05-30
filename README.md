<a href="https://livekit.io/">
  <img src="./.github/assets/livekit-mark.png" alt="LiveKit logo" width="100" height="100">
</a>

# LiveKit Meet

<p>
  <a href="https://meet.livekit.io"><strong>Try the demo</strong></a>
  •
  <a href="https://github.com/livekit/components-js">LiveKit Components</a>
  •
  <a href="https://docs.livekit.io/">LiveKit Docs</a>
  •
  <a href="https://livekit.io/cloud">LiveKit Cloud</a>
  •
  <a href="https://blog.livekit.io/">Blog</a>
</p>

<br>

LiveKit Meet is an open source video conferencing app built on [LiveKit Components](https://github.com/livekit/components-js), [LiveKit Cloud](https://cloud.livekit.io/), and Next.js. It's been completely redesigned from the ground up using our new components library.

![LiveKit Meet screenshot](./.github/assets/livekit-meet.jpg)

## Tech Stack

- This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).
- App is built with [@livekit/components-react](https://github.com/livekit/components-js/) library.

## Demo

Give it a try at https://meet.livekit.io.

## Dev Setup

Steps to get a local dev setup up and running:

1. Run `pnpm install` to install all dependencies.
2. Copy `.env.example` in the project root and rename it to `.env.local`.
3. Update the missing environment variables in the newly created `.env.local` file.
4. Run `pnpm dev` to start the development server and visit [http://localhost:3000](http://localhost:3000) to see the result.
5. Start development 🎉

## Hosted Rooms

This deployment only lets participants join rooms that were created from the protected host
console at `/host`.

- Public users enter an active room code on `/` or open an invite link like `/rooms/AB12CD34`.
- Hosts sign in at `/host`, create a room, copy the invite link, and end the room when finished.
- `/api/connection-details` checks Postgres before issuing a LiveKit token, so arbitrary room names
  no longer create joinable meetings.

## Required Environment Variables

Copy `.env.example` to `.env.local` for development and set:

```bash
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=wss://your-livekit-host
DATABASE_URL=postgresql://user:password@host:5432/database
DATABASE_SSL=false
AUTH_SECRET=
HOST_ADMIN_EMAILS=admin@example.com,second-admin@example.com
HOST_ADMIN_PASSWORD=
```

Generate `AUTH_SECRET` with:

```bash
openssl rand -base64 32
```

Passkeys are possible for a future iteration, but they require a WebAuthn registration and recovery
flow on HTTPS. The current host console uses email plus password so it can be deployed directly on
Coolify.

## Coolify Deployment

1. Create or connect the LiveKit Meet app in Coolify from this repository.
2. Add a PostgreSQL resource in the same Coolify project.
3. Copy the internal Postgres connection string into the app as `DATABASE_URL`.
4. Set `DATABASE_SSL=false` for Coolify internal networking unless your Postgres service requires TLS.
5. Add the LiveKit variables, `AUTH_SECRET`, `HOST_ADMIN_EMAILS`, and `HOST_ADMIN_PASSWORD` as app
   environment variables.
6. Deploy the app. The `meeting_rooms` table and index are created automatically on first use.
7. Open `/host`, sign in, create a room, and copy the generated invite link.
