export function generateCsrfToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
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
