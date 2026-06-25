import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const PROFILE_COLUMNS = [
  'username', 'email', 'role', 'display_balance',
  'avatar_url', 'full_name', 'phone', 'date_of_birth', 'country', 'city', 'address',
  'kyc_level', 'two_factor_enabled', 'created_at', 'total_deposited_real',
];

const BASE_COLUMNS = ['username', 'email', 'role', 'display_balance'];

export async function GET(req: NextRequest) {
  const token = req.cookies.get('__Host-kingdom_session')?.value;
  if (!token || token.length !== 64) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id, expires_at')
    .eq('session_token', token)
    .limit(1);

  const sess = (sessions ?? []) as unknown as { user_id: number; expires_at: string }[];
  if (sess.length === 0) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
  if (new Date(sess[0].expires_at) < new Date()) {
    await supabase.from('sessions').delete().eq('session_token', token);
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }

  const userId = sess[0].user_id;
  let migrationNeeded = false;

  // Try full profile query first
  const { data: users, error } = await supabase
    .from('users')
    .select(PROFILE_COLUMNS.join(','))
    .eq('id', userId)
    .limit(1);

  // If the full query fails, fall back to base columns
  if (error || !users || users.length === 0) {
    if (error) {
      console.warn('[profile/me] full query failed, falling back to base columns:', error.message);
    }

    const fallback = await supabase
      .from('users')
      .select(BASE_COLUMNS.join(','))
      .eq('id', userId)
      .limit(1);

    if (!fallback.data || fallback.data.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const base = fallback.data[0] as unknown as Record<string, unknown>;
    migrationNeeded = true;

    return NextResponse.json({
      username: base.username || '',
      email: base.email || null,
      role: base.role || 'user',
      avatar_url: null,
      full_name: null,
      phone: null,
      date_of_birth: null,
      country: null,
      city: null,
      address: null,
      migrationNeeded,
    });
  }

  return NextResponse.json({
    ...(users[0] as unknown as Record<string, unknown>),
    migrationNeeded: false,
  });
}
