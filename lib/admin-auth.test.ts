import { describe, expect, it } from 'vitest';
import {
  createAdminSessionPayload,
  createAdminSessionToken,
  normalizeGroups,
  readAdminSessionToken,
  resolveAdminRole,
} from './admin-auth';

describe('Pocket ID host auth helpers', () => {
  it('round-trips signed admin session tokens and rejects tampering', async () => {
    const secret = 'test-secret-with-enough-length';
    const payload = createAdminSessionPayload(
      {
        userId: 'pocket-subject',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'owner',
        groups: ['meet-owners'],
      },
      new Date(1700000000000),
    );
    const token = await createAdminSessionToken(payload, secret);

    expect(await readAdminSessionToken(token, secret, new Date(1700000001000))).toEqual({
      email: 'admin@example.com',
      exp: 1700043200000,
      groups: ['meet-owners'],
      name: 'Admin User',
      role: 'owner',
      userId: 'pocket-subject',
    });
    expect(await readAdminSessionToken(`${token}x`, secret, new Date(1700000001000))).toBeNull();
  });

  it('normalizes group claims from arrays and delimited strings', () => {
    expect(normalizeGroups(['meet-admins', 'meet-admins', 'meet-owners'])).toEqual([
      'meet-admins',
      'meet-owners',
    ]);
    expect(normalizeGroups('meet-admins meet-owners,extra')).toEqual([
      'meet-admins',
      'meet-owners',
      'extra',
    ]);
  });

  it('maps Pocket ID groups to host roles with owner precedence', () => {
    const roleGroups = {
      ownerGroup: 'meet-owners',
      adminGroup: 'meet-admins',
    };

    expect(resolveAdminRole(['meet-admins'], roleGroups)).toBe('admin');
    expect(resolveAdminRole(['meet-admins', 'meet-owners'], roleGroups)).toBe('owner');
    expect(resolveAdminRole(['unrelated'], roleGroups)).toBeNull();
  });
});
