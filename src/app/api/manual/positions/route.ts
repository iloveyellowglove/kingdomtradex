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

  const { data: openPositions } = await supabase
    .from('manual_trades')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'open')
    .order('opened_at', { ascending: false });

  const { data: closedTrades } = await supabase
    .from('manual_trades')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'closed')
    .order('closed_at', { ascending: false })
    .limit(50);

  return NextResponse.json({
    success: true,
    openPositions: openPositions ?? [],
    closedTrades: closedTrades ?? [],
  });
}
