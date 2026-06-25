import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { debitProfitBalance, debitCommissionBalance, creditProfitBalance, creditCommissionBalance } from '@/lib/db/atomic';
import { getCurrencyById } from '@/lib/currencies';

const MIN_WITHDRAWAL = 25;

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

  // === SHARE GATE CHECK ===
  // Fetch user role for bonus tier info
  const { data: userRows } = await supabase
    .from('users')
    .select('role, first_deposit_time')
    .eq('id', userId)
    .limit(1);

  const userRow = userRows?.[0];

  // If user has never deposited, block withdrawal entirely
  if (!userRow?.first_deposit_time) {
    return NextResponse.json({
      success: false,
      error: 'You must make a deposit before withdrawing.',
    }, { status: 400 });
  }

  // Check if user has any completed withdrawals
  const { data: completedWds } = await supabase
    .from('withdrawals')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('id', { ascending: false })
    .limit(1);

  const hasCompletedWithdrawal = completedWds && completedWds.length > 0;

  if (hasCompletedWithdrawal) {
    // AFTER a completed withdrawal: check for verified share on the LAST completed withdrawal
    const lastCompletedId = completedWds[0].id;

    const { data: verifications } = await supabase
      .from('share_verifications')
      .select('id')
      .eq('user_id', userId)
      .eq('withdrawal_id', lastCompletedId)
      .limit(1);

    if (!verifications || verifications.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'You must share your last withdrawal testimony before requesting a new withdrawal.',
        share_required: true,
      }, { status: 400 });
    }
  } else {
    // FIRST withdrawal: check for generic share
    const { data: genericShare } = await supabase
      .from('social_shares')
      .select('id')
      .eq('user_id', userId)
      .is('testimony_id', null)
      .limit(1);

    if (!genericShare || genericShare.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'You must share your referral link before your first withdrawal.',
        share_required: true,
        generic_share: true,
      }, { status: 400 });
    }
  }
  // === END SHARE GATE ===

  const { amount, currency, wallet_address, withdrawal_type } = await request.json();

  // Validate withdrawal_type
  const wType = (withdrawal_type || 'profit').trim();
  if (!['profit', 'commission'].includes(wType)) {
    return NextResponse.json({ success: false, error: 'Invalid withdrawal type.' }, { status: 400 });
  }

  // Validate amount
  const amt = parseFloat(amount || '0');
  if (!isFinite(amt)) {
    return NextResponse.json({ success: false, error: 'Invalid amount.' }, { status: 400 });
  }
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

  // Generate testimony for this withdrawal
  let testimonyUrl: string | null = null;
  try {
    const userInitials = await (async () => {
      const { data: userData } = await supabase
        .from('users')
        .select('username, referral_code')
        .eq('id', userId)
        .single();

      if (!userData) return 'ANON';
      const name = (userData.username || '').trim();
      if (!name) return 'ANON';
      const parts = name.split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    })();

    const { data: userData } = await supabase
      .from('users')
      .select('referral_code')
      .eq('id', userId)
      .single();

    const referralCode = userData?.referral_code || '';

    const { data: testimony } = await supabase
      .from('testimonies')
      .insert({
        user_id: userId,
        withdrawal_id: withdrawal[0].id,
        amount: amt.toFixed(8),
        initials: userInitials,
        referral_code: referralCode,
      })
      .select()
      .single();

    if (testimony) {
      testimonyUrl = `/testimony/${testimony.id}`;
    }
  } catch (e) {
    console.error('[withdraw] testimony generation failed:', e);
    // Non-fatal: withdrawal succeeded, testimony can be generated later if needed
  }

  return NextResponse.json({
    success: true,
    withdrawal_id: withdrawal[0].id,
    testimony_url: testimonyUrl,
  });
}
