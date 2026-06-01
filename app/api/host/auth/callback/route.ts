import {
  POCKET_ID_PKCE_COOKIE,
  POCKET_ID_STATE_COOKIE,
  exchangePocketIdCallback,
} from '@/lib/pocket-id';
import { clearAdminSessionCookie, setAdminSessionCookie } from '@/lib/server-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const codeVerifier = request.cookies.get(POCKET_ID_PKCE_COOKIE)?.value;
  const state = request.cookies.get(POCKET_ID_STATE_COOKIE)?.value;
  if (!codeVerifier || !state) {
    return redirectWithAuthError(request, 'missing_state');
  }

  try {
    const user = await exchangePocketIdCallback(request.nextUrl, codeVerifier, state);
    const response = NextResponse.redirect(new URL('/host', request.url));
    await setAdminSessionCookie(response, user);
    clearPocketIdTransientCookies(response);
    return response;
  } catch (error) {
    const code =
      error instanceof Error && error.message.includes('host access group')
        ? 'access_denied'
        : 'callback_failed';
    return redirectWithAuthError(request, code);
  }
}

function redirectWithAuthError(request: NextRequest, code: string): NextResponse {
  const url = new URL('/host', request.url);
  url.searchParams.set('authError', code);
  const response = NextResponse.redirect(url);
  clearAdminSessionCookie(response);
  clearPocketIdTransientCookies(response);
  return response;
}

function clearPocketIdTransientCookies(response: NextResponse): void {
  for (const name of [POCKET_ID_PKCE_COOKIE, POCKET_ID_STATE_COOKIE]) {
    response.cookies.set({
      name,
      value: '',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
  }
}
