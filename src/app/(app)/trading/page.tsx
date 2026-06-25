import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { getSetting } from '@/lib/db/settings';
import TradingPage from '@/components/trading/TradingPage';

export default async function TradingPageServer() {
  const cookieStore = cookies();
  const token = cookieStore.get('__Host-kingdom_session')?.value;
  if (!token) redirect('/login');

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id')
    .eq('session_token', token)
    .limit(1);

  const s = (sessions ?? []) as unknown as { user_id: number }[];
  if (s.length === 0) redirect('/login');
  const userId = s[0].user_id;

  const { data: users } = await supabase
    .from('users')
    .select('locked_balance, profit_balance, commission_balance, total_deposited_real')
    .eq('id', userId)
    .limit(1);

  const u = users?.[0] as Record<string, unknown> | undefined;
  const lockedBalance = Number(u?.locked_balance ?? 0);
  const profitBalance = Number(u?.profit_balance ?? 0);
  const commissionBalance = Number(u?.commission_balance ?? 0);
  const totalDeposited = Number(u?.total_deposited_real ?? 0);
  const totalEarned = profitBalance + commissionBalance;
  const hasDeposits = totalDeposited > 0;

  const { data: activeLocks } = await supabase
    .from('deposit_locks')
    .select('id, amount, daily_rate, tier')
    .eq('user_id', userId)
    .eq('status', 'locked');

  const activeLockCount = activeLocks?.length ?? 0;
  const dailyProjection = (activeLocks ?? []).reduce(
    (sum: number, lock: Record<string, unknown>) => sum + Number(lock.amount) * Number(lock.daily_rate),
    0,
  );

  // Find highest tier rate for personalized display
  const tierRates = (activeLocks ?? []).map((l: Record<string, unknown>) => Number(l.daily_rate));
  const highestTierRate = tierRates.length > 0 ? Math.max(...tierRates) : 0.03; // default Diamond rate if no deposits

  const dailyRate = parseFloat(await getSetting('daily_profit_percentage', '1.8'));

  return (
    <TradingPage
      dailyRate={dailyRate}
      lockedBalance={lockedBalance}
      activeLockCount={activeLockCount}
      dailyProjection={dailyProjection}
      userId={userId}
      hasDeposits={hasDeposits}
      highestTierRate={highestTierRate}
      totalEarned={totalEarned}
    />
  );
}
