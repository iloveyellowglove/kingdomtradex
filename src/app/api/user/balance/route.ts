import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  const token = cookies().get('__Host-kingdom_session')?.value;
  if (!token || token.length !== 64) {
    return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id')
    .eq('session_token', token)
    .limit(1);

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ success: false, error: 'Session expired.' }, { status: 401 });
  }

  const userId = sessions[0].user_id;

  const { data: users } = await supabase
    .from('users')
    .select('display_balance, locked_balance, profit_balance, commission_balance')
    .eq('id', userId)
    .limit(1);

  const u = users?.[0];

  const { data: locks } = await supabase
    .from('deposit_locks')
    .select('*')
    .eq('user_id', userId)
    .order('locked_at', { ascending: false });

  return NextResponse.json({
    success: true,
    displayBalance: Number(u?.display_balance ?? 0),
    lockedBalance: Number(u?.locked_balance ?? 0),
    profitBalance: Number(u?.profit_balance ?? 0),
    commissionBalance: Number(u?.commission_balance ?? 0),
    locks: locks ?? [],
  });
}
