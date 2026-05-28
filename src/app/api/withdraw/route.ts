import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { debitProfitBalance, debitCommissionBalance, creditProfitBalance, creditCommissionBalance } from '@/lib/db/atomic';
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
  const { amount, currency, wallet_address, withdrawal_type } = await request.json();

  // Validate withdrawal_type
  const wType = (withdrawal_type || 'profit').trim();
  if (!['profit', 'commission'].includes(wType)) {
    return NextResponse.json({ success: false, error: 'Invalid withdrawal type.' }, { status: 400 });
  }

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
    .select('profit_balance, commission_balance')
    .eq('id', userId)
    .limit(1);

  const user = users?.[0];
  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
  }

  // Check sufficient balance for selected type
  const availableBalance = wType === 'profit'
    ? Number(user.profit_balance ?? 0)
    : Number(user.commission_balance ?? 0);

  if (amt > availableBalance) {
    return NextResponse.json({
      success: false,
      error: `Insufficient ${wType} balance. Available: $${availableBalance.toFixed(2)}.`,
    }, { status: 400 });
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

  // Debit from the correct balance
  try {
    if (wType === 'profit') {
      await debitProfitBalance(userId, amt);
    } else {
      await debitCommissionBalance(userId, amt);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('P0002') || msg.includes('Insufficient')) {
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
      withdrawal_type: wType,
    })
    .select();

  if (insertErr || !withdrawal?.length) {
    // Refund: credit back since debit succeeded but insert failed
    try {
      if (wType === 'profit') {
        await creditProfitBalance(userId, amt);
      } else {
        await creditCommissionBalance(userId, amt);
      }
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
