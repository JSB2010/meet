import 'server-only';

import pg from 'pg';
import { ensureRoomSchema, Queryable } from './room-store';

const { Pool } = pg;

declare global {
  // eslint-disable-next-line no-var
  var livekitMeetPool: pg.Pool | undefined;
  // eslint-disable-next-line no-var
  var livekitMeetSchemaReady: Promise<void> | undefined;
}

export function getDb(): Queryable {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  if (!globalThis.livekitMeetPool) {
    globalThis.livekitMeetPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_SSL === 'true'
          ? {
              rejectUnauthorized: false,
            }
          : undefined,
    });
  }

  return globalThis.livekitMeetPool;
}

export async function getReadyDb(): Promise<Queryable> {
  const db = getDb();
  globalThis.livekitMeetSchemaReady ??= ensureRoomSchema(db);
  await globalThis.livekitMeetSchemaReady;
  return db;
}
