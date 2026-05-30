import { describe, expect, it } from 'vitest';
import { generateRoomCode, normalizeRoomCode } from './room-code';

describe('room codes', () => {
  it('normalizes user-entered room codes for lookup', () => {
    expect(normalizeRoomCode(' ab-12 cd ')).toBe('AB12CD');
  });

  it('generates compact uppercase invite codes', () => {
    const code = generateRoomCode();

    expect(code).toMatch(/^[A-Z0-9]{8}$/);
  });
});
