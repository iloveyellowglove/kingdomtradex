import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { getSetting } from '@/lib/db/settings';
import { debitUserBalanceWithWithdrawalTotal, creditUserBalance } from '@/lib/db/atomic';
import { getCurrencyById } from '@/lib/currencies';

const MIN_WITHDRAWAL = 25;

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
  const { amount, currency, wallet_address } = await request.json();

  // Validate amount
  const amt = parseFloat(amount || '0');
  if (!amt || amt <= 0) {
    return NextResponse.json({ success: false, error: 'Amount must be positive.' }, { status: 400 });
  }

  if (amt < MIN_WITHDRAWAL) {
    return NextResponse.json({
      success: false,
      error: `Minimum withdrawal is $${MIN_WITHDRAWAL}.00.`,
    }, { status: 400 });
  }

  // Validate currency
  const currencyId = (currency || '').trim();
  const currencyConfig = getCurrencyById(currencyId);
  if (!currencyConfig) {
    return NextResponse.json({ success: false, error: 'Invalid currency.' }, { status: 400 });
  }

  // Validate wallet address
  const walletAddr = (wallet_address || '').trim();
  if (!walletAddr || walletAddr.length < 10) {
    return NextResponse.json({
      success: false,
      error: 'Please enter a valid wallet address.',
    }, { status: 400 });
  }

  // Fetch user
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .limit(1);

  const user = users?.[0];
  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
  }

  // Bonus lock check
  if (user.bonus_locked) {
    return NextResponse.json({
      success: false,
      error: 'Please deposit a minimum of $100 USDT to unlock withdrawals. Your $50 Kingdom Starter Grant is available for trading and earning yield.',
    }, { status: 400 });
  }

  // Withdrawal lock period check
  const lockDays = parseInt(await getSetting('withdrawal_lock_days', ''));
  const lockHours = parseInt(await getSetting('withdrawal_lock_hours', '72'));
  const effectiveLockHours = lockDays ? lockDays * 24 : lockHours;

  const firstDepositRaw = user.first_deposit_time || user.created_at;
  if (firstDepositRaw) {
    const firstDeposit = new Date(firstDepositRaw).getTime();
    const diff = Date.now() - firstDeposit;
    if (diff < effectiveLockHours * 3600000) {
      const eligibleAt = new Date(firstDeposit + effectiveLockHours * 3600000);
      return NextResponse.json({
        success: false,
        error: `Security hold: withdrawals available after ${lockDays || Math.round(effectiveLockHours / 24)} days from first deposit.`,
        eligible_at: eligibleAt.toISOString(),
      }, { status: 400 });
    }
  }

  // Check for existing pending withdrawal
  const { data: pendingWds } = await supabase
    .from('withdrawals')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['pending', 'processing'])
    .limit(1);

  if (pendingWds && pendingWds.length > 0) {
    return NextResponse.json({
      success: false,
      error: 'You already have a pending withdrawal request. Please wait for it to be processed before submitting another.',
    }, { status: 400 });
  }

  // Debit balance immediately
  try {
    await debitUserBalanceWithWithdrawalTotal(userId, amt);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('P0002') || msg.includes('Insufficient balance')) {
      return NextResponse.json({ success: false, error: 'Insufficient balance.' }, { status: 400 });
    }
    throw err;
  }

  const now = new Date().toISOString();

  // Insert withdrawal record
  const { data: withdrawal, error: insertErr } = await supabase
    .from('withdrawals')
    .insert({
      user_id: userId,
      amount: amt.toFixed(8),
      currency: currencyConfig.symbol,
      address: walletAddr,
      wallet_address: walletAddr,
      network: currencyConfig.network,
      fee: '0.00000000',
      request_time: now,
      eligible_time: now,
      status: 'pending',
    })
    .select();

  if (insertErr || !withdrawal?.length) {
    // Refund: credit balance back since debit succeeded but insert failed
    try {
      await creditUserBalance(userId, amt);
    } catch (refundErr) {
      console.error('[withdraw] refund after insert failure failed:', refundErr);
    }
    console.error('[withdraw] insert failed:', insertErr?.message);
    return NextResponse.json({ success: false, error: 'Failed to create withdrawal request.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    withdrawal_id: withdrawal[0].id,
  });
}
