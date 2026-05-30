import { randomBytes } from 'crypto';

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 8;

export function normalizeRoomCode(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toUpperCase();
}

export function generateRoomCode(length = ROOM_CODE_LENGTH): string {
  const bytes = randomBytes(length);
  let code = '';

  for (const byte of bytes) {
    code += ROOM_CODE_ALPHABET[byte % ROOM_CODE_ALPHABET.length];
  }

  return code;
}
