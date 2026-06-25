import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { getCurrencyById } from '@/lib/currencies';

export async function POST(request: NextRequest) {
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

  const { deposit_id, currency, wallet_address } = await request.json();
  const depositId = parseInt(deposit_id || '0', 10);
  const currencyId = (currency || 'USDT_TRX').trim();
  const walletAddr = (wallet_address || '').trim();

  if (!depositId || isNaN(depositId)) {
    return NextResponse.json({ success: false, error: 'Invalid deposit.' }, { status: 400 });
  }

  const currencyConfig = getCurrencyById(currencyId);
  if (!currencyConfig) {
    return NextResponse.json({ success: false, error: 'Invalid currency.' }, { status: 400 });
  }

  if (!walletAddr || walletAddr.length < 10) {
    return NextResponse.json({
      success: false,
      error: 'Please enter a valid wallet address.',
    }, { status: 400 });
  }

  // Verify the deposit belongs to user
  const { data: deposit } = await supabase
    .from('deposits')
    .select('id, amount, status')
    .eq('id', depositId)
    .eq('user_id', userId)
    .single();

  if (!deposit) {
    return NextResponse.json({ success: false, error: 'Deposit not found.' }, { status: 404 });
  }

  if (deposit.status !== 'completed') {
    return NextResponse.json({
      success: false,
      error: 'Deposit is not yet completed. Only confirmed deposits can be withdrawn.',
    }, { status: 400 });
  }

  // Check it's not the signup credit
  const { data: user } = await supabase
    .from('users')
    .select('signup_credit')
    .eq('id', userId)
    .single();

  const signupCredit = Number(user?.signup_credit ?? 50);
  const depositAmount = Number(deposit.amount);

  if (depositAmount <= signupCredit) {
    return NextResponse.json({
      success: false,
      error: 'Platform credit is non-withdrawable.',
    }, { status: 400 });
  }

  // Check for existing lock - warn about forfeit
  const { data: lock } = await supabase
    .from('deposit_locks')
    .select('id, amount, tier, lock_days, unlocks_at, status')
    .eq('deposit_id', depositId)
    .maybeSingle();

  const forfeitAmount = depositAmount * 0.25;
  const netAmount = depositAmount - forfeitAmount;
  const isEarly = lock && lock.status === 'locked';

  // Use RPC for atomic principal withdrawal
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    'process_principal_withdrawal',
    {
      p_user_id: userId,
      p_deposit_id: depositId,
      p_coin: currencyConfig.symbol,
      p_wallet: walletAddr,
    }
  );

  if (rpcError) {
    return NextResponse.json({
      success: false,
      error: rpcError.message,
    }, { status: 500 });
  }

  const result = (rpcResult as Array<{
    withdrawal_id: number | null;
    forfeit_amount: number | null;
    net_amount: number | null;
    error_msg: string | null;
  }>)?.[0];

  if (result?.error_msg) {
    return NextResponse.json({
      success: false,
      error: result.error_msg,
    }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    withdrawal_id: result?.withdrawal_id,
    forfeit_amount: result?.forfeit_amount,
    net_amount: result?.net_amount,
    is_early: isEarly,
    message: isEarly
      ? `Early withdrawal processed. A 25% forfeit ($${forfeitAmount.toFixed(2)}) was applied. Net amount: $${netAmount.toFixed(2)}.`
      : 'Principal withdrawal submitted.',
  });
}
