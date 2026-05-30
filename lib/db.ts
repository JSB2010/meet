import 'server-only';

import pg from 'pg';
import { bootstrapInitialAdminUser, ensureAdminUserSchema } from './admin-user-store';
import { ensureRoomSchema, Queryable } from './room-store';

const { Pool } = pg;

declare global {
  // eslint-disable-next-line no-var
  var jacobMeetPool: pg.Pool | undefined;
  // eslint-disable-next-line no-var
  var jacobMeetSchemaReady: Promise<void> | undefined;
}

export function getDb(): Queryable {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  if (!globalThis.jacobMeetPool) {
    globalThis.jacobMeetPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_SSL === 'true'
          ? {
              rejectUnauthorized: false,
            }
          : undefined,
    });
  }

  return globalThis.jacobMeetPool;
}

export async function getReadyDb(): Promise<Queryable> {
  const db = getDb();
  globalThis.jacobMeetSchemaReady ??= prepareSchema(db);
  await globalThis.jacobMeetSchemaReady;
  return db;
}

async function prepareSchema(db: Queryable): Promise<void> {
  await ensureRoomSchema(db);
  await ensureAdminUserSchema(db);
  await bootstrapInitialAdminUser(db, {
    emails: process.env.HOST_ADMIN_EMAILS ?? process.env.HOST_ADMIN_EMAIL,
    password: process.env.HOST_ADMIN_PASSWORD,
    passwordHash: process.env.HOST_ADMIN_PASSWORD_HASH,
  });
}
