import { createServiceClient } from '../supabase/service';
import type { Session } from '../types';

export async function getSessionByToken(token: string): Promise<Session | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('session_token', token)
    .limit(1);
  return data?.[0] ?? null;
}

export async function createSession(session: {
  session_token: string;
  user_id: number;
  user_role: string;
  csrf_token: string;
  flash_data?: string | null;
  created_at: string;
  expires_at: string;
}): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from('sessions').insert(session);
}

export async function deleteSession(token: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from('sessions').delete().eq('session_token', token);
}

export async function updateSessionFlash(
  token: string,
  flashData: string | null
): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from('sessions')
    .update({ flash_data: flashData })
    .eq('session_token', token);
}

export async function createPasswordReset(email: string, token: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from('password_resets').insert({
    email,
    token,
    created_at: new Date().toISOString(),
    used: false,
  });
}

export async function getPasswordReset(token: string): Promise<{
  email: string;
  created_at: string;
  used: boolean;
} | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('password_resets')
    .select('*')
    .eq('token', token)
    .limit(1);
  return data?.[0] ? { email: data[0].email, created_at: data[0].created_at, used: data[0].used } : null;
}

export async function markPasswordResetUsed(token: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from('password_resets')
    .update({ used: true })
    .eq('token', token);
}
