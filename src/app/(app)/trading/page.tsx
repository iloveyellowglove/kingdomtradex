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
    .select('locked_balance, profit_balance, commission_balance')
    .eq('id', userId)
    .limit(1);

  const u = users?.[0] as Record<string, unknown> | undefined;
  const lockedBalance = Number(u?.locked_balance ?? 0);

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

  const tiers = (activeLocks ?? []).map((l: Record<string, unknown>) => String(l.tier));
  const uniqueTiers = tiers.filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);

  const dailyRate = parseFloat(await getSetting('daily_profit_percentage', '1.8'));

  return (
    <TradingPage
      dailyRate={dailyRate}
      lockedBalance={lockedBalance}
      activeLockCount={activeLockCount}
      dailyProjection={dailyProjection}
      userId={userId}
    />
  );
}
