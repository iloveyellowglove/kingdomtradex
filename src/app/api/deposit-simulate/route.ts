import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
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
  const { currency, amount, txid } = await request.json();

  if (!amount || amount <= 0) {
    return NextResponse.json({ success: false, error: 'Amount must be positive.' }, { status: 400 });
  }

  const txidClean = (txid || 'sim_' + Date.now()).trim();
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from('deposits')
    .select('id')
    .eq('txid', txidClean)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ success: false, error: 'Duplicate transaction ID.' }, { status: 409 });
  }

  const { data: deposit } = await supabase
    .from('deposits')
    .insert({
      user_id: userId,
      txid: txidClean,
      currency: currency || 'USDT',
      amount: amount.toFixed(8),
      status: 'completed',
      created_at: now,
      confirmed_at: now,
      completed_at: now,
    })
    .select();

  const { data: user } = await supabase
    .from('users')
    .select('display_balance,total_deposited_real,first_deposit_time,bonus_locked,minimum_deposit_to_unlock')
    .eq('id', userId)
    .limit(1);

  if (user && user.length > 0) {
    const newTotal = Number(user[0].total_deposited_real || 0) + amount;
    const updates: Record<string, unknown> = {
      display_balance: (Number(user[0].display_balance || 0) + amount).toFixed(8),
      total_deposited_real: newTotal.toFixed(8),
    };
    if (!user[0].first_deposit_time) {
      updates.first_deposit_time = now;
    }
    if (user[0].bonus_locked && newTotal >= Number(user[0].minimum_deposit_to_unlock || 100)) {
      updates.bonus_locked = false;
      updates.bonus_unlocked_at = now;
    }
    await supabase.from('users').update(updates).eq('id', userId);
  }

  return NextResponse.json({
    success: true,
    deposit_id: deposit?.[0]?.id ?? 0,
  });
}
