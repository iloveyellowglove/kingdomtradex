import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

export function generateCsrfToken(): string {
  return randomBytes(16).toString('hex');
}

export function getCsrfToken(sessionCsrfToken?: string | null): string {
  if (sessionCsrfToken) {
    return sessionCsrfToken;
  }

  const cookieStore = cookies();
  const guestToken = cookieStore.get('csrf_guest')?.value;
  if (guestToken && guestToken.length === 32) {
    return guestToken;
  }

  const newToken = generateCsrfToken();
  cookieStore.set('csrf_guest', newToken, {
    expires: new Date(Date.now() + 3600000),
    path: '/',
    secure: true,
    httpOnly: false,
    sameSite: 'lax',
  });
  return newToken;
}

export function validateCsrf(token: string, sessionCsrfToken?: string | null): boolean {
  if (!token) return false;

  if (sessionCsrfToken) {
    return timingSafeEqual(token, sessionCsrfToken);
  }

  const cookieStore = cookies();
  const guestToken = cookieStore.get('csrf_guest')?.value;
  if (guestToken && timingSafeEqual(token, guestToken)) {
    cookieStore.set('csrf_guest', '', {
      expires: new Date(0),
      path: '/',
      secure: true,
      httpOnly: false,
      sameSite: 'lax',
    });
    return true;
  }

  return false;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
