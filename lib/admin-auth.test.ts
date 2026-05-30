import { describe, expect, it } from 'vitest';
import {
  createAdminSessionPayload,
  createAdminSessionToken,
  hashPassword,
  readAdminSessionToken,
  verifyPassword,
} from './admin-auth';

describe('admin auth helpers', () => {
  it('hashes and verifies a password without storing the plain text', async () => {
    const passwordHash = await hashPassword('correct horse battery staple');

    expect(passwordHash).not.toContain('correct horse battery staple');
    await expect(verifyPassword('correct horse battery staple', passwordHash)).resolves.toBe(true);
    await expect(verifyPassword('wrong password', passwordHash)).resolves.toBe(false);
  });

  it('round-trips signed admin session tokens and rejects tampering', async () => {
    const secret = 'test-secret-with-enough-length';
    const payload = createAdminSessionPayload(
      {
        id: 'user_123',
        email: 'admin@example.com',
        role: 'owner',
        sessionVersion: 3,
      },
      new Date(1700000000000),
    );
    const token = await createAdminSessionToken('admin@example.com', payload, secret);

    expect(await readAdminSessionToken(token, secret, new Date(1700000001000))).toEqual({
      email: 'admin@example.com',
      exp: 1700043200000,
      role: 'owner',
      sessionVersion: 3,
      userId: 'user_123',
    });
    expect(await readAdminSessionToken(`${token}x`, secret, new Date(1700000001000))).toBeNull();
  });
});
