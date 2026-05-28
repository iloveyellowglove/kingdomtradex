import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import EarningsDashboard from '@/components/trading/EarningsDashboard';

export default async function EarningsPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('kingdom_session')?.value;
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
    .select('profit_balance, commission_balance, locked_balance')
    .eq('id', userId)
    .limit(1);

  const u = users?.[0] as { profit_balance?: number; commission_balance?: number; locked_balance?: number } | undefined;
  const profitBalance = Number(u?.profit_balance ?? 0);
  const commissionBalance = Number(u?.commission_balance ?? 0);
  const lockedBalance = Number(u?.locked_balance ?? 0);

  const { data: activeLocks } = await supabase
    .from('deposit_locks')
    .select('id, amount, daily_rate')
    .eq('user_id', userId)
    .eq('status', 'locked');

  const activeLockCount = activeLocks?.length ?? 0;
  const dailyProjection = (activeLocks ?? []).reduce(
    (sum, lock) => sum + Number(lock.amount) * Number(lock.daily_rate),
    0,
  );

  const { data: profits } = await supabase
    .from('ai_trading_profits')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(30);

  const { data: rateSetting } = await supabase
    .from('settings')
    .select('setting_value')
    .eq('setting_key', 'daily_profit_percentage')
    .limit(1);

  const dailyRate = Number((rateSetting?.[0] as { setting_value?: string } | undefined)?.setting_value ?? 1.5);

  return (
    <EarningsDashboard
      profitBalance={profitBalance}
      commissionBalance={commissionBalance}
      lockedBalance={lockedBalance}
      activeLockCount={activeLockCount}
      dailyProjection={dailyProjection}
      dailyRate={dailyRate}
      profits={profits ?? []}
    />
  );
}
