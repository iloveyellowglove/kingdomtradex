import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  const token = cookies().get('__Host-kingdom_session')?.value;
  if (!token || token.length !== 64) {
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

  const { data: users } = await supabase
    .from('users')
    .select('display_balance, locked_balance, profit_balance, commission_balance, kyc_level, auto_withdrawal_frequency, auto_withdrawal_enabled, auto_withdrawal_coin, auto_withdrawal_wallet, signup_credit')
    .eq('id', userId)
    .limit(1);

  const u = users?.[0];

  const { data: locks } = await supabase
    .from('deposit_locks')
    .select('*')
    .eq('user_id', userId)
    .order('locked_at', { ascending: false });

  // Format locked deposits for the frontend
  const lockedDeposits = (locks ?? [])
    .filter((l: { status: string }) => l.status === 'locked')
    .map((l: {
      id: string; amount: number; tier: string; lock_days: number;
      daily_rate: number; locked_at: string; unlocks_at: string; status: string;
    }) => {
      const amount = Number(l.amount);
      const timeRemaining = Math.max(0, new Date(l.unlocks_at).getTime() - Date.now());
      return {
        id: l.id,
        amount,
        tier: l.tier,
        lockDays: Number(l.lock_days),
        dailyRate: Number(l.daily_rate),
        lockedAt: l.locked_at,
        unlocksAt: l.unlocks_at,
        status: l.status,
        timeRemaining,
        forfeitAmount: amount * 0.25,
        netIfEarly: amount * 0.75,
      };
    });

  // Eligibility check
  const kycLevel = Number(u?.kyc_level ?? 0);
  const profitBalance = Number(u?.profit_balance ?? 0);
  let eligible = true;
  let reason: string | undefined;

  if (kycLevel < 1) {
    eligible = false;
    reason = 'Email verification required.';
  } else if (profitBalance < 25) {
    eligible = false;
    reason = 'Minimum withdrawal is $25.00.';
  }

  return NextResponse.json({
    success: true,
    displayBalance: Number(u?.display_balance ?? 0),
    lockedBalance: Number(u?.locked_balance ?? 0),
    profitBalance,
    commissionBalance: Number(u?.commission_balance ?? 0),
    kycLevel,
    signupCredit: Number(u?.signup_credit ?? 50),
    withdrawalFrequency: u?.auto_withdrawal_frequency ?? null,
    autoWithdrawalEnabled: Boolean(u?.auto_withdrawal_enabled ?? false),
    eligible,
    reason,
    locks: locks ?? [],
    lockedDeposits,
  });
}
