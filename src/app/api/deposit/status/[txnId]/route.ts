import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ txnId: string }> }
) {
  const token = cookies().get('kingdom_session')?.value;
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
  const { txnId } = await params;

  const { data: deposits } = await supabase
    .from('deposits')
    .select('id, txn_id, currency, amount, status, created_at, confirmed_at')
    .eq('txn_id', txnId)
    .eq('user_id', userId)
    .limit(1);

  if (!deposits || deposits.length === 0) {
    return NextResponse.json({ success: false, error: 'Deposit not found.' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    deposit: deposits[0],
  });
}
