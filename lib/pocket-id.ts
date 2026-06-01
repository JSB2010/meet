import 'server-only';

import * as oidc from 'openid-client';
import { AdminRole, normalizeGroups, resolveAdminRole } from './admin-auth';

export const POCKET_ID_PKCE_COOKIE = 'jacob_meet_pocket_id_pkce';
export const POCKET_ID_STATE_COOKIE = 'jacob_meet_pocket_id_state';
export const POCKET_ID_AUTH_MAX_AGE = 60 * 10;

const DEFAULT_GROUPS_CLAIM = 'groups';
const POCKET_ID_SCOPES = 'openid profile email groups';

type ClaimSet = Record<string, unknown>;

export type PocketIdSessionUser = {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  groups: string[];
};

type PocketIdSettings = {
  issuerUrl: URL;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  ownerGroup: string;
  adminGroup: string;
  groupsClaim: string;
  allowInsecureHttp: boolean;
};

let discoveredConfig: Promise<oidc.Configuration> | undefined;

export function getPocketIdSettings(): PocketIdSettings {
  return {
    issuerUrl: new URL(requireEnv('POCKET_ID_ISSUER_URL')),
    clientId: requireEnv('POCKET_ID_CLIENT_ID'),
    clientSecret: requireEnv('POCKET_ID_CLIENT_SECRET'),
    redirectUri: requireEnv('POCKET_ID_REDIRECT_URI'),
    ownerGroup: requireEnv('POCKET_ID_OWNER_GROUP'),
    adminGroup: requireEnv('POCKET_ID_ADMIN_GROUP'),
    groupsClaim: process.env.POCKET_ID_GROUPS_CLAIM?.trim() || DEFAULT_GROUPS_CLAIM,
    allowInsecureHttp: process.env.POCKET_ID_ALLOW_INSECURE_HTTP === 'true',
  };
}

export async function buildPocketIdAuthorizationUrl(
  codeChallenge: string,
  state: string,
): Promise<URL> {
  const settings = getPocketIdSettings();
  const config = await getPocketIdConfiguration(settings);
  return oidc.buildAuthorizationUrl(config, {
    redirect_uri: settings.redirectUri,
    scope: POCKET_ID_SCOPES,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  });
}

export function randomPocketIdState(): string {
  return oidc.randomState();
}

export function randomPocketIdCodeVerifier(): string {
  return oidc.randomPKCECodeVerifier();
}

export async function calculatePocketIdCodeChallenge(codeVerifier: string): Promise<string> {
  return oidc.calculatePKCECodeChallenge(codeVerifier);
}

export async function exchangePocketIdCallback(
  callbackUrl: URL,
  codeVerifier: string,
  expectedState: string,
): Promise<PocketIdSessionUser> {
  const settings = getPocketIdSettings();
  const config = await getPocketIdConfiguration(settings);
  const tokens = await oidc.authorizationCodeGrant(config, callbackUrl, {
    pkceCodeVerifier: codeVerifier,
    expectedState,
    idTokenExpected: true,
  });
  const claims = tokens.claims();
  if (!claims?.sub) {
    throw new Error('Pocket ID did not return a subject claim.');
  }

  const userInfo = tokens.access_token
    ? ((await oidc.fetchUserInfo(config, tokens.access_token, claims.sub)) as ClaimSet)
    : {};
  return buildSessionUser(claims as ClaimSet, userInfo, settings);
}

function buildSessionUser(
  idTokenClaims: ClaimSet,
  userInfo: ClaimSet,
  settings: PocketIdSettings,
): PocketIdSessionUser {
  const sub = getStringClaim(userInfo, 'sub') || getStringClaim(idTokenClaims, 'sub');
  const email = getStringClaim(userInfo, 'email') || getStringClaim(idTokenClaims, 'email');
  if (!sub || !email) {
    throw new Error('Pocket ID did not return the required user identity claims.');
  }

  const groups = normalizeGroups(
    userInfo[settings.groupsClaim] ?? idTokenClaims[settings.groupsClaim],
  );
  const role = resolveAdminRole(groups, {
    ownerGroup: settings.ownerGroup,
    adminGroup: settings.adminGroup,
  });
  if (!role) {
    throw new Error('Your Pocket ID account is not in a host access group.');
  }

  const name =
    getStringClaim(userInfo, 'name') ||
    getStringClaim(idTokenClaims, 'name') ||
    getStringClaim(userInfo, 'preferred_username') ||
    getStringClaim(idTokenClaims, 'preferred_username') ||
    email;

  return {
    userId: sub,
    email: email.trim().toLowerCase(),
    name,
    role,
    groups,
  };
}

async function getPocketIdConfiguration(
  settings = getPocketIdSettings(),
): Promise<oidc.Configuration> {
  discoveredConfig ??= oidc.discovery(
    settings.issuerUrl,
    settings.clientId,
    settings.clientSecret,
    undefined,
    settings.allowInsecureHttp ? { execute: [oidc.allowInsecureRequests] } : undefined,
  );
  return discoveredConfig;
}

function getStringClaim(claims: ClaimSet, key: string): string | null {
  const value = claims[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not defined`);
  }
  return value;
}
