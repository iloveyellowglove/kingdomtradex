import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import YieldVault from '@/components/trading/YieldVault';
import TradingViewChart from '@/components/trading/TradingViewChart';
import AITradingPanel from '@/components/trading/AITradingPanel';
import CrossBackground from '@/components/brand/CrossBackground';

export default async function TradingPage() {
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

  // Fetch user balance
  const { data: users } = await supabase
    .from('users')
    .select('display_balance')
    .eq('id', userId)
    .limit(1);

  const balance = Number((users?.[0] as { display_balance?: number } | undefined)?.display_balance ?? 0);

  // Fetch daily profit rate from settings
  const { data: rateSetting } = await supabase
    .from('settings')
    .select('setting_value')
    .eq('setting_key', 'daily_profit_percentage')
    .limit(1);

  const dailyRate = Number((rateSetting?.[0] as { setting_value?: string } | undefined)?.setting_value ?? 1.5);

  // Fetch AI trading profits
  const { data: profits } = await supabase
    .from('ai_trading_profits')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(30);

  return (
    <div className="py-4 relative">
      <CrossBackground opacity={0.03} />
      <div className="relative z-10">
        <YieldVault balance={balance} dailyRate={dailyRate} />
      <TradingViewChart />
      <AITradingPanel profits={profits ?? []} />
      </div>
    </div>
  );
}
