import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { debitUserBalance, creditUserBalance, lockDeposit } from '@/lib/db/atomic';

const VALID_TIERS: Record<string, { lock_days: number; daily_rate: number }> = {
  growth: { lock_days: 60, daily_rate: 0.010000 },
  builder: { lock_days: 90, daily_rate: 0.012000 },
  kingdom: { lock_days: 120, daily_rate: 0.014000 },
  legacy: { lock_days: 180, daily_rate: 0.012000 },
};

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

  // Fetch user for role and balance
  const { data: users } = await supabase
    .from('users')
    .select('role, display_balance')
    .eq('id', userId)
    .limit(1);

  if (!users || users.length === 0) {
    return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
  }

  const user = users[0];
  const userRole = user.role || 'member';
  const availableBalance = Number(user.display_balance ?? 0);

  const { amount, tier } = await request.json();
  const amt = parseFloat(amount || '0');

  if (!amt || amt <= 0) {
    return NextResponse.json({ success: false, error: 'Amount must be positive.' }, { status: 400 });
  }

  // Validate tier selection
  const tierStr = (tier || '').trim();
  const tierConfig = VALID_TIERS[tierStr];
  if (!tierConfig) {
    return NextResponse.json({
      success: false,
      error: `Invalid lock tier. Must be one of: ${Object.keys(VALID_TIERS).join(', ')}.`,
    }, { status: 400 });
  }

  // Enforce minimum deposit based on role
  const minDeposit = userRole === 'pastor' ? 200 : 100;
  if (amt < minDeposit) {
    return NextResponse.json({
      success: false,
      error: `Minimum deposit is $${minDeposit} USD for ${userRole === 'pastor' ? 'pastors' : 'members'}.`,
    }, { status: 400 });
  }

  // Validate sufficient balance
  if (availableBalance < amt) {
    return NextResponse.json({
      success: false,
      error: `Insufficient balance. You have $${availableBalance.toLocaleString()} available but need $${amt}.`,
    }, { status: 400 });
  }

  const now = new Date().toISOString();
  const txnId = `bal_${userId}_${Date.now()}`;

  // Insert deposit record
  const { data: deposits, error: insertErr } = await supabase
    .from('deposits')
    .insert({
      user_id: userId,
      txn_id: txnId,
      txid: txnId,
      currency: 'USD',
      amount: amt,
      status: 'completed',
      payment_provider: 'balance',
      provider_payment_id: txnId,
      tier: tierStr,
      lock_days: tierConfig.lock_days,
      created_at: now,
      completed_at: now,
    })
    .select();

  if (insertErr || !deposits || deposits.length === 0) {
    return NextResponse.json({ success: false, error: 'Failed to create deposit record.' }, { status: 500 });
  }

  const depositId = deposits[0].id;

  // Atomically debit user balance
  try {
    await debitUserBalance(userId, amt);
  } catch (debitErr) {
    return NextResponse.json({
      success: false,
      error: `Failed to debit balance: ${debitErr instanceof Error ? debitErr.message : 'Unknown error'}`,
    }, { status: 500 });
  }

  // Create the deposit lock
  try {
    const lock = await lockDeposit(userId, depositId, amt, tierStr, tierConfig.lock_days, tierConfig.daily_rate);
    return NextResponse.json({
      success: true,
      message: 'Funds locked successfully.',
      lock,
      newBalance: availableBalance - amt,
    });
  } catch (lockErr) {
    // Rollback: credit the balance back since lock failed
    console.error('[from-balance] lockDeposit failed, rolling back debit:', lockErr);
    try {
      await creditUserBalance(userId, amt);
    } catch (rollbackErr) {
      console.error('[from-balance] CRITICAL: rollback credit also failed:', rollbackErr);
    }
    return NextResponse.json({
      success: false,
      error: `Failed to create deposit lock: ${lockErr instanceof Error ? lockErr.message : 'Unknown error'}`,
    }, { status: 500 });
  }
}
