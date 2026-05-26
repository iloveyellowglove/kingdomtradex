import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { getSetting } from '@/lib/db/settings';

export async function GET() {
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

  const { data: withdrawals } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('user_id', userId)
    .order('request_time', { ascending: false })
    .limit(50);

  const { data: users } = await supabase
    .from('users')
    .select('display_balance, bonus_locked, first_deposit_time, created_at')
    .eq('id', userId)
    .limit(1);

  const user = users?.[0];

  // Calculate lock status
  const lockDays = parseInt(await getSetting('withdrawal_lock_days', ''));
  const lockHours = parseInt(await getSetting('withdrawal_lock_hours', '72'));
  const effectiveLockHours = lockDays ? lockDays * 24 : lockHours;

  let locked = false;
  let eligibleAt: string | null = null;

  const firstDepositRaw = user?.first_deposit_time || user?.created_at;
  if (firstDepositRaw) {
    const firstDeposit = new Date(firstDepositRaw).getTime();
    const diff = Date.now() - firstDeposit;
    if (diff < effectiveLockHours * 3600000) {
      locked = true;
      eligibleAt = new Date(firstDeposit + effectiveLockHours * 3600000).toISOString();
    }
  }

  return NextResponse.json({
    success: true,
    withdrawals: withdrawals ?? [],
    balance: Number(user?.display_balance ?? 0),
    locked,
    eligible_at: eligibleAt,
    bonus_locked: user?.bonus_locked ?? false,
  });
}
