import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { getSetting } from '@/lib/db/settings';

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
  const { currency, amount, address } = await request.json();

  if (!amount || amount <= 0) {
    return NextResponse.json({ success: false, error: 'Amount must be positive.' }, { status: 400 });
  }

  const currencyUpper = (currency || 'USDT').toUpperCase();
  if (!['BTC', 'ETH', 'USDT'].includes(currencyUpper)) {
    return NextResponse.json({ success: false, error: 'Invalid currency.' }, { status: 400 });
  }

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .limit(1);

  const user = users?.[0];
  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
  }

  if (user.bonus_locked) {
    return NextResponse.json({
      success: false,
      error: 'Please deposit a minimum of $100 USDT to unlock withdrawals. Your $50 Kingdom Starter Grant is available for trading and earning yield.',
    }, { status: 400 });
  }

  const availableBalance = Number(user.display_balance || 0);
  if (amount > availableBalance) {
    return NextResponse.json({ success: false, error: 'Insufficient balance.' }, { status: 400 });
  }

  const lockHours = parseInt(await getSetting('withdrawal_lock_hours', '72'));
  if (user.first_deposit_time) {
    const firstDeposit = new Date(user.first_deposit_time).getTime();
    const diff = Date.now() - firstDeposit;
    if (diff < lockHours * 3600000) {
      const eligibleAt = new Date(firstDeposit + lockHours * 3600000);
      return NextResponse.json({
        success: false,
        error: `Security hold: withdrawals available after ${lockHours} hours from first deposit.`,
        eligible_at: eligibleAt.toISOString(),
      }, { status: 400 });
    }
  }

  const fee = amount * 0.005;
  const now = new Date().toISOString();

  const newDisplay = availableBalance - amount;
  const newPending = Number(user.pending_withdrawal_amount || 0) + amount;

  await supabase.from('users').update({
    display_balance: newDisplay.toFixed(8),
    pending_withdrawal_amount: newPending.toFixed(8),
  }).eq('id', userId);

  const { data: withdrawal } = await supabase
    .from('withdrawals')
    .insert({
      user_id: userId,
      amount: amount.toFixed(8),
      currency: currencyUpper,
      address: (address || '').trim(),
      fee: fee.toFixed(8),
      request_time: now,
      eligible_time: now,
      status: 'pending',
    })
    .select();

  return NextResponse.json({
    success: true,
    withdrawal_id: withdrawal?.[0]?.id ?? 0,
    eligible_time: new Date().toISOString(),
  });
}
