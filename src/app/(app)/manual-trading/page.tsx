import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import ManualTradingPage from '@/components/trading/ManualTradingPage';

export default async function ManualTradingServerPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('kingdom_session')?.value;
  if (!token) redirect('/login');

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id, csrf_token')
    .eq('session_token', token)
    .limit(1);

  const s = (sessions ?? []) as unknown as { user_id: number; csrf_token: string }[];
  if (s.length === 0) redirect('/login');

  const userId = s[0].user_id;
  const csrfToken = s[0].csrf_token;

  const { data: users } = await supabase
    .from('users')
    .select('display_balance')
    .eq('id', userId)
    .limit(1);

  const realBalance = Number(users?.[0]?.display_balance ?? 0);

  const { data: openPositions } = await supabase
    .from('manual_trades')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'open')
    .order('opened_at', { ascending: false });

  const { data: closedTrades } = await supabase
    .from('manual_trades')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'closed')
    .order('closed_at', { ascending: false })
    .limit(50);

  return (
    <ManualTradingPage
      realBalance={realBalance}
      csrfToken={csrfToken}
      initialOpenPositions={(openPositions ?? []) as unknown as ManualTrade[]}
      initialClosedTrades={(closedTrades ?? []) as unknown as ManualTrade[]}
    />
  );
}

export interface ManualTrade {
  id: number;
  user_id: number;
  pair: string;
  side: string;
  amount: number;
  entry_price: number;
  exit_price: number | null;
  status: string;
  pnl: number | null;
  fee: number;
  opened_at: string;
  closed_at: string | null;
}
