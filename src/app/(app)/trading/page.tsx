import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import AITradingPanel from '@/components/trading/AITradingPanel';

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

  const { data: profits } = await supabase
    .from('ai_trading_profits')
    .select('*')
    .eq('user_id', s[0].user_id)
    .order('date', { ascending: false })
    .limit(30);

  return <AITradingPanel profits={profits ?? []} />;
}
