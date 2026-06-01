import 'server-only';

import pg from 'pg';
import { ensureRoomSchema, Queryable } from './room-store';

const { Pool } = pg;

declare global {
  var jacobMeetPool: pg.Pool | undefined;
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
}
