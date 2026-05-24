import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('kingdom_session')?.value;
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

  const { data: users } = await supabase
    .from('users')
    .select('username, email, role, avatar_url, full_name, phone, date_of_birth, country, city, address')
    .eq('id', sess[0].user_id)
    .limit(1);

  if (!users || users.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(users[0]);
}
