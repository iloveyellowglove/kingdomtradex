import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { withErrorHandler } from '@/lib/api-error-handler';

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

  const { data } = await supabase
    .from('users')
    .select('auto_withdrawal_enabled, auto_withdrawal_frequency, auto_withdrawal_coin, auto_withdrawal_wallet', 'auto_withdrawal_min_amount')
    .eq('id', userId)
    .single();

  return NextResponse.json({
    success: true,
    settings: {
      enabled: Boolean(data?.auto_withdrawal_enabled ?? false),
      frequency: data?.auto_withdrawal_frequency ?? null,
      coin: data?.auto_withdrawal_coin ?? null,
      wallet: data?.auto_withdrawal_wallet ?? null,
      minAmount: Number(data?.auto_withdrawal_min_amount ?? 25),
    },
  });
}

export const PUT = withErrorHandler(async (request: NextRequest) => {
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

  const body = await request.json();
  const { enabled, frequency, coin, wallet, minAmount } = body;

  // Validate frequency
  if (frequency && !['daily', 'weekly'].includes(frequency)) {
    return NextResponse.json({
      success: false,
      error: 'Frequency must be "daily" or "weekly".',
    }, { status: 400 });
  }

  // If enabling auto-withdrawal, require coin + wallet
  if (enabled) {
    const { data: user } = await supabase
      .from('users')
      .select('auto_withdrawal_coin, auto_withdrawal_wallet, kyc_level')
      .eq('id', userId)
      .single();

    const existingCoin = coin ?? user?.auto_withdrawal_coin;
    const existingWallet = wallet ?? user?.auto_withdrawal_wallet;
    const kycLevel = Number(user?.kyc_level ?? 0);

    if (!existingCoin || !existingWallet) {
      return NextResponse.json({
        success: false,
        error: 'Please configure your withdrawal coin and wallet address first.',
      }, { status: 400 });
    }

    if (kycLevel < 1) {
      return NextResponse.json({
        success: false,
        error: 'Email verification required to enable auto-withdrawal.',
      }, { status: 400 });
    }
  }

  const updateData: Record<string, unknown> = {
    auto_withdrawal_enabled: Boolean(enabled),
  };

  if (frequency !== undefined) {
    updateData.auto_withdrawal_frequency = frequency;
  }
  if (coin !== undefined) {
    updateData.auto_withdrawal_coin = coin || null;
  }
  if (wallet !== undefined) {
    updateData.auto_withdrawal_wallet = wallet || null;
  }
  if (minAmount !== undefined) {
    const min = parseFloat(String(minAmount));
    if (!isFinite(min) || min < 25) {
      return NextResponse.json({
        success: false,
        error: 'Minimum amount must be at least $25.',
      }, { status: 400 });
    }
    updateData.auto_withdrawal_min_amount = min;
  }

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to update auto-withdrawal settings.',
    }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
