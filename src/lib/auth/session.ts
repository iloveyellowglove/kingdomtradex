import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { createServiceClient } from '../supabase/service';
import type { SessionData } from '../types';

const SESSION_COOKIE = 'kingdom_session';
const SESSION_TTL = 86400; // 24 hours

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createSession(userId: number, role: string): Promise<string> {
  const token = generateToken();
  const csrfToken = randomBytes(16).toString('hex');
  const supabase = createServiceClient();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL * 1000);

  await supabase.from('sessions').insert({
    session_token: token,
    user_id: userId,
    user_role: role,
    csrf_token: csrfToken,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  });

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    maxAge: SESSION_TTL,
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
  });

  return token;
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token || token.length !== 64) return null;

  const supabase = createServiceClient();
  const { data: rows, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('session_token', token)
    .limit(1);

  if (error || !rows || rows.length === 0) return null;

  const row = rows[0];
  const expiresAt = new Date(row.expires_at);
  if (Date.now() > expiresAt.getTime()) {
    await supabase.from('sessions').delete().eq('session_token', token);
    return null;
  }

  return {
    user_id: row.user_id,
    user_role: row.user_role,
    csrf_token: row.csrf_token,
  };
}

export async function destroySession(): Promise<void> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const supabase = createServiceClient();
    await supabase.from('sessions').delete().eq('session_token', token);
  }

  cookieStore.set(SESSION_COOKIE, '', {
    maxAge: 0,
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
  });
}

export async function getFlashMessages(): Promise<Record<string, string>> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return {};

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('sessions')
    .select('flash_data')
    .eq('session_token', token)
    .limit(1);

  const flashData = data?.[0]?.flash_data;
  if (flashData) {
    await supabase
      .from('sessions')
      .update({ flash_data: null })
      .eq('session_token', token);
    try {
      return JSON.parse(flashData);
    } catch {
      return {};
    }
  }
  return {};
}

export async function setFlashMessage(key: string, message: string): Promise<void> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('sessions')
    .select('flash_data')
    .eq('session_token', token)
    .limit(1);

  const flashes: Record<string, string> = data?.[0]?.flash_data
    ? JSON.parse(data[0].flash_data)
    : {};
  flashes[key] = message;

  await supabase
    .from('sessions')
    .update({ flash_data: JSON.stringify(flashes) })
    .eq('session_token', token);
}
