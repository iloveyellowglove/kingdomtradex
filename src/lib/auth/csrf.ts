import { randomBytes } from 'crypto';

export function generateCsrfToken(): string {
  return randomBytes(16).toString('hex');
}

export function getCsrfToken(sessionCsrfToken?: string | null): string {
  if (sessionCsrfToken) {
    return sessionCsrfToken;
  }
  return generateCsrfToken();
}

export function validateCsrf(token: string, sessionCsrfToken?: string | null): boolean {
  if (!token) return false;
  if (sessionCsrfToken) {
    return timingSafeEqual(token, sessionCsrfToken);
  }
  return true;
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
