import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  const token = cookies().get('__Host-kingdom_session')?.value;
  if (!token) {
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

  const { data: withdrawals } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('user_id', userId)
    .order('request_time', { ascending: false })
    .limit(50);

  const { data: users } = await supabase
    .from('users')
    .select('profit_balance, commission_balance')
    .eq('id', userId)
    .limit(1);

  const user = users?.[0];

  return NextResponse.json({
    success: true,
    withdrawals: withdrawals ?? [],
    profitBalance: Number(user?.profit_balance ?? 0),
    commissionBalance: Number(user?.commission_balance ?? 0),
  });
}
