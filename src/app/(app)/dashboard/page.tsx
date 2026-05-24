import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { getSetting } from '@/lib/db/settings';
import { PlisioClient } from '@/lib/services/plisio-client';
import { PlisioDepositService } from '@/lib/services/plisio-deposit';
import DashboardContent from '@/components/dashboard/DashboardContent';

export default async function DashboardPage() {
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

  // Get user
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .limit(1);

  if (!users || users.length === 0) redirect('/login');
  const user = users[0];

  // Get downline counts
  const countLevel = async (ids: number[]): Promise<number[]> => {
    if (!ids.length) return [];
    const { data } = await supabase.from('users').select('id').in('referred_by', ids).eq('status', 'active');
    return ((data ?? []) as unknown as { id: number }[]).map((d) => d.id);
  };

  const l1 = ((await supabase.from('users').select('id').eq('referred_by', userId).eq('status', 'active')).data ?? []) as unknown as { id: number }[];
  const l2 = await countLevel(l1.map((d) => d.id));
  const l3 = await countLevel(l2);
  const l4 = await countLevel(l3);
  const l5 = await countLevel(l4);

  const downlineCounts = {
    level_1: l1.length,
    level_2: l2.length,
    level_3: l3.length,
    level_4: l4.length,
    level_5: l5.length,
  };

  // Recent activity
  const { data: deposits } = await supabase
    .from('deposits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: commissions } = await supabase
    .from('referral_commissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Withdrawal lock
  const { data: locks } = await supabase
    .from('withdrawal_locks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_locked', 1)
    .limit(1);

  // Commission totals
  const { data: pendingRows } = await supabase
    .from('referral_commissions')
    .select('amount')
    .eq('user_id', userId)
    .eq('status', 'pending');

  const { data: paidRows } = await supabase
    .from('referral_commissions')
    .select('amount')
    .eq('user_id', userId)
    .eq('status', 'paid');

  const totalPendingComm = ((pendingRows ?? []) as unknown as { amount: number }[]).reduce((s, r) => s + Number(r.amount), 0);
  const totalPaidComm = ((paidRows ?? []) as unknown as { amount: number }[]).reduce((s, r) => s + Number(r.amount), 0);

  // Deposit addresses
  let depositAddresses: Record<string, string> | null = null;
  let depositAddressError: string | null = null;

  const plisioApiKey = await getSetting('plisio_api_key', '');
  if (plisioApiKey) {
    try {
      const plisioClient = new PlisioClient(plisioApiKey);
      const plisioDeposit = new PlisioDepositService(plisioClient);
      const addrResult = await plisioDeposit.generateUserAddresses(userId);
      if (addrResult.success) {
        depositAddresses = addrResult.addresses ?? null;
      } else {
        depositAddressError = (addrResult as { error?: string }).error || 'Failed to generate deposit addresses.';
      }
    } catch {
      depositAddressError = 'Deposit service unavailable.';
    }
  }

  // Daily yield rate
  const dailyRate = parseFloat(await getSetting('daily_profit_percentage', '1.5'));

  // Total earned from AI trading profits
  const { data: profitRows } = await supabase
    .from('ai_trading_profits')
    .select('amount')
    .eq('user_id', userId);
  const totalEarned = ((profitRows ?? []) as unknown as { amount: number }[]).reduce((s, r) => s + Number(r.amount), 0);

  return (
    <DashboardContent
      user={user}
      downlineCounts={downlineCounts}
      deposits={deposits ?? []}
      commissions={commissions ?? []}
      withdrawalLock={locks?.[0] ?? null}
      totalPaidComm={totalPaidComm}
      totalPendingComm={totalPendingComm}
      depositAddresses={depositAddresses}
      depositAddressError={depositAddressError}
      dailyRate={dailyRate}
      totalEarned={totalEarned}
    />
  );
}
