import { createServiceClient } from '../supabase/service';
import type { AITradingProfit, WithdrawalLock } from '../types';

export async function getDailyProfitForUser(
  userId: number,
  date: string
): Promise<AITradingProfit | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('ai_trading_profits')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .limit(1);
  return data?.[0] ?? null;
}

export async function createDailyProfit(profit: {
  user_id: number;
  amount: number;
  percentage: number;
  date: string;
}): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from('ai_trading_profits').insert({
    ...profit,
    created_at: new Date().toISOString(),
  });
}

export async function getActiveUsers(): Promise<{ id: number; display_balance: number }[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('id,display_balance')
    .eq('status', 'active')
    .gt('display_balance', 0);
  return data ?? [];
}

export async function getWithdrawalLock(userId: number): Promise<WithdrawalLock | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('withdrawal_locks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_locked', 1)
    .limit(1);
  return data?.[0] ?? null;
}

export async function createWithdrawalLock(lock: {
  user_id: number;
  first_deposit_time: string;
  lock_expiry_time: string;
  is_locked: number;
}): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from('withdrawal_locks').upsert(lock, { onConflict: 'user_id' });
}
