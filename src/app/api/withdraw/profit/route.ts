import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { checkWithdrawalEligibility } from '@/lib/withdrawal-service';
import { getCurrencyById } from '@/lib/currencies';
import { verifyUserTOTP } from '@/lib/two-factor';
import { verifyWithdrawalOTP } from '@/lib/auth/otp-store';
import { withErrorHandler } from '@/lib/api-error-handler';
import { applyRateLimit } from '@/lib/rate-limit';
import { validateWalletAddress } from '@/lib/wallet-validation';

const MIN_WITHDRAWAL = 25;

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

  // Rate limit: 5 profit withdrawal requests per user per hour
  const rateLimit = applyRateLimit(userId, 'withdraw_profit', 5, 3600000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many withdrawal requests. Please try again later.' },
      { status: 429 }
    );
  }

  // Parse body
  const { amount, currency, wallet_address, totp_code, email_otp_code } = await request.json();

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
  const amt = parseFloat(amount || '0');
  const currencyId = (currency || 'USDT_TRX').trim();
  const walletAddr = (wallet_address || '').trim();

  if (!isFinite(amt) || amt < MIN_WITHDRAWAL) {
    return NextResponse.json({
      success: false,
      error: `Minimum withdrawal is $${MIN_WITHDRAWAL}.00.`,
    }, { status: 400 });
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

  // Check eligibility
  const eligibility = await checkWithdrawalEligibility(userId);
  if (!eligibility.eligible) {
    return NextResponse.json({
      success: false,
      error: eligibility.reason,
      next_eligible_at: eligibility.nextEligibleAt ?? null,
    }, { status: 400 });
  }

  if (amt > eligibility.availableProfit) {
    return NextResponse.json({
      success: false,
      error: `Insufficient profit balance. Available: $${eligibility.availableProfit.toFixed(2)}.`,
    }, { status: 400 });
  }

  // Use RPC for atomic profit withdrawal
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    'process_profit_withdrawal',
    {
      p_user_id: userId,
      p_amount: amt,
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

  const result = (rpcResult as Array<{ withdrawal_id: number | null; error_msg: string | null }>)?.[0];

  if (result?.error_msg) {
    return NextResponse.json({
      success: false,
      error: result.error_msg,
    }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    withdrawal_id: result?.withdrawal_id,
    message: 'Withdrawal request submitted. You will receive your funds after processing.',
  });
});
