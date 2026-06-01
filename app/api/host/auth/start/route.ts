import {
  POCKET_ID_AUTH_MAX_AGE,
  POCKET_ID_PKCE_COOKIE,
  POCKET_ID_STATE_COOKIE,
  buildPocketIdAuthorizationUrl,
  calculatePocketIdCodeChallenge,
  randomPocketIdCodeVerifier,
  randomPocketIdState,
} from '@/lib/pocket-id';
import { NextResponse } from 'next/server';

export async function GET() {
  const codeVerifier = randomPocketIdCodeVerifier();
  const state = randomPocketIdState();
  const codeChallenge = await calculatePocketIdCodeChallenge(codeVerifier);
  const redirectTo = await buildPocketIdAuthorizationUrl(codeChallenge, state);
  const response = NextResponse.redirect(redirectTo);
  response.cookies.set({
    name: POCKET_ID_PKCE_COOKIE,
    value: codeVerifier,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: POCKET_ID_AUTH_MAX_AGE,
  });
  response.cookies.set({
    name: POCKET_ID_STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: POCKET_ID_AUTH_MAX_AGE,
  });
  return response;
}
