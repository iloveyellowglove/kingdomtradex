import { createServiceClient } from '../supabase/service';
import type { ReferralCommission } from '../types';

export async function getCommissionsByUser(
  userId: number,
  limit = 10
): Promise<ReferralCommission[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('referral_commissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getTotalPendingCommissions(userId: number): Promise<number> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('referral_commissions')
    .select('amount')
    .eq('user_id', userId)
    .eq('status', 'pending');
  return (data ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
}

export async function getTotalPaidCommissions(userId: number): Promise<number> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('referral_commissions')
    .select('amount')
    .eq('user_id', userId)
    .eq('status', 'paid');
  return (data ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
}

export async function createCommission(c: {
  user_id: number;
  source_user_id: number;
  level: number;
  percentage: number;
  amount: number;
  source_deposit_id: number;
  source_amount: number;
  status?: string;
  created_at?: string;
}): Promise<ReferralCommission | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('referral_commissions')
    .insert(c)
    .select();
  return data?.[0] ?? null;
}

export async function getPendingCommissionsForPayout(): Promise<ReferralCommission[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('referral_commissions')
    .select('*')
    .eq('status', 'pending');
  return data ?? [];
}

export async function markCommissionPaid(id: number): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from('referral_commissions')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', id);
}

export async function getAllCommissions(
  limit = 50,
  offset = 0
): Promise<ReferralCommission[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('referral_commissions')
    .select('*, users!inner(id,username,email)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  return data ?? [];
}
