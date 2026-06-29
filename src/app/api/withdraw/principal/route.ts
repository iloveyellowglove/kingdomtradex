import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { getCurrencyById } from '@/lib/currencies';
import { withErrorHandler } from '@/lib/api-error-handler';
import { applyRateLimit } from '@/lib/rate-limit';
import { validateWalletAddress } from '@/lib/wallet-validation';
import { verifyUserTOTP } from '@/lib/two-factor';
import { verifyWithdrawalOTP } from '@/lib/auth/otp-store';

export const POST = withErrorHandler(async (request: NextRequest) => {
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

  // Rate limit: 3 principal withdrawal requests per user per hour
  const rateLimit = applyRateLimit(userId, 'withdraw_principal', 3, 3600000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many principal withdrawal requests. Please try again later.' },
      { status: 429 }
    );
  }

  const { deposit_id, currency, wallet_address, totp_code, email_otp_code } = await request.json();

  const { data: verifyUser } = await supabase
    .from('users')
    .select('kyc_level, two_factor_enabled')
    .eq('id', userId)
    .single();
  const kycLevel = Number(verifyUser?.kyc_level ?? 0);

  if (kycLevel >= 1) {
    if (totp_code && verifyUser?.two_factor_enabled) {
      const totpValid = await verifyUserTOTP(userId, totp_code);
      if (!totpValid) {
        return NextResponse.json({ success: false, error: 'Invalid authenticator code.' }, { status: 400 });
      }
    } else if (email_otp_code) {
      const otpResult = verifyWithdrawalOTP(userId, email_otp_code);
      if (!otpResult.valid) {
        return NextResponse.json({ success: false, error: otpResult.error || 'Invalid verification code.' }, { status: 400 });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Verification code required for withdrawals.',
        requires_verification: true,
      }, { status: 400 });
    }
  }
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

  if (!walletAddr || !validateWalletAddress(walletAddr, currencyConfig.symbol)) {
    return NextResponse.json({
      success: false,
      error: `Invalid ${currencyConfig.symbol} wallet address.`,
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

  // Check for existing lock - determine if early or matured withdrawal
  const { data: lock } = await supabase
    .from('deposit_locks')
    .select('id, amount, tier, lock_days, unlocks_at, status')
    .eq('deposit_id', depositId)
    .maybeSingle();

  const isMatured = lock && lock.status === 'matured';

  if (isMatured || !lock) {
    // ── MATURED WITHDRAWAL: lock expired or no lock — full amount, no forfeit, no cooling ──

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'process_principal_withdrawal_matured',
      {
        p_user_id: userId,
        p_deposit_id: depositId,
        p_coin: currencyConfig.symbol,
        p_wallet: walletAddr,
      }
    );

    if (rpcError) {
      return NextResponse.json({ success: false, error: rpcError.message }, { status: 500 });
    }

    const result = (rpcResult as Array<{
      withdrawal_id: number | null;
      net_amount: number | null;
      error_msg: string | null;
    }>)?.[0];

    if (result?.error_msg) {
      return NextResponse.json({ success: false, error: result.error_msg }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      withdrawal_id: result?.withdrawal_id,
      net_amount: result?.net_amount,
      message: 'Principal withdrawal submitted. Full amount. No penalty.',
    });
  }

  // ── EARLY WITHDRAWAL: lock still active — 25% forfeit + 48-hour cooling period ──

  // Use RPC for atomic principal withdrawal with 25% forfeit
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
    return NextResponse.json({ success: false, error: rpcError.message }, { status: 500 });
  }

  const result = (rpcResult as Array<{
    withdrawal_id: number | null;
    forfeit_amount: number | null;
    net_amount: number | null;
    error_msg: string | null;
  }>)?.[0];

  if (result?.error_msg) {
    return NextResponse.json({ success: false, error: result.error_msg }, { status: 400 });
  }

  // Set cooling period: 48 hours from now
  const coolingEndAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  await supabase
    .from('withdrawals')
    .update({
      status: 'cooling',
      cooling_end_at: coolingEndAt,
      is_early: true,
    })
    .eq('id', result!.withdrawal_id);

  return NextResponse.json({
    success: true,
    withdrawal_id: result?.withdrawal_id,
    forfeit_amount: result?.forfeit_amount,
    net_amount: result?.net_amount,
    is_early: true,
    cooling_end_at: coolingEndAt,
    message:
      `Principal withdrawal initiated. ` +
      `A 25% forfeit ($${Number(result?.forfeit_amount).toFixed(2)}) applies. ` +
      `48-hour cooling period ends ${new Date(coolingEndAt).toLocaleString()}. ` +
      `You can cancel within this period.`,
  });
});
