import { cookies } from 'next/headers';
import { createServiceClient } from '../supabase/service';
import type { SessionData } from '../types';

const SESSION_COOKIE = '__Host-kingdom_session';
const SESSION_TTL = 86400; // 24 hours

function generateRandomBytes(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateToken(): string {
  return generateRandomBytes(32);
}

export async function createSession(userId: number, role: string): Promise<{ token: string; csrfToken: string }> {
  const token = generateToken();
  const csrfToken = generateRandomBytes(16);
  const supabase = createServiceClient();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL * 1000);

  // Enforce max 5 concurrent sessions per user (sliding window — oldest evicted)
  const { data: existingSessions } = await supabase
    .from('sessions')
    .select('session_token, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (existingSessions && existingSessions.length >= 5) {
    // Delete oldest sessions to make room
    const toDelete = existingSessions.slice(0, existingSessions.length - 4);
    for (const s of toDelete) {
      await supabase.from('sessions').delete().eq('session_token', s.session_token);
    }
  }

  // Check if sessions table is accessible
  const { error: tableError } = await supabase
    .from('sessions')
    .select('session_token')
    .limit(1);
  if (process.env.NODE_ENV !== 'production') console.log('[session] table accessible:', !tableError, '| error:', tableError ?? 'none');

  const { error: insertError } = await supabase.from('sessions').insert({
    session_token: token,
    user_id: userId,
    user_role: role,
    csrf_token: csrfToken,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  });

  if (insertError) {
    console.log('[session] INSERT FAILED:', JSON.stringify(insertError));
    throw new Error(`Failed to create session: ${insertError.message}`);
  }

  console.log('[session] insert OK');
  return { token, csrfToken };
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
