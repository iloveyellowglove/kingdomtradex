import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  const token = cookies().get('kingdom_session')?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id, user_role')
    .eq('session_token', token)
    .limit(1);

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ success: false, error: 'Session expired.' }, { status: 401 });
  }

  if (sessions[0].user_role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  }

  const { data } = await supabase
    .from('withdrawals')
    .select('*, users!inner(username,email), reviewer:reviewed_by(username)')
    .order('request_time', { ascending: false })
    .limit(200);

  return NextResponse.json({
    success: true,
    withdrawals: data ?? [],
  });
}
