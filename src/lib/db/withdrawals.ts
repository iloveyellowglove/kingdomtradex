import { createServiceClient } from '../supabase/service';
import type { Withdrawal } from '../types';

export async function getWithdrawalsByUser(userId: number, limit = 20): Promise<Withdrawal[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('user_id', userId)
    .order('request_time', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function createWithdrawal(w: {
  user_id: number;
  amount: number;
  currency: string;
  address: string;
  fee: number;
  request_time: string;
  eligible_time: string;
  status: string;
}): Promise<Withdrawal | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('withdrawals')
    .insert(w)
    .select();
  return data?.[0] ?? null;
}

export async function getEligibleWithdrawals(): Promise<Withdrawal[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('withdrawals')
    .select('*')
    .lte('eligible_time', new Date().toISOString())
    .eq('status', 'pending');
  return data ?? [];
}

export async function getWithdrawalById(id: number): Promise<Withdrawal | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('id', id)
    .limit(1);
  return data?.[0] ?? null;
}

export async function updateWithdrawal(
  id: number,
  fields: Record<string, unknown>
): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from('withdrawals').update(fields).eq('id', id);
}

export async function getAllWithdrawals(
  limit = 50,
  offset = 0,
  statusFilter = ''
): Promise<Withdrawal[]> {
  const supabase = createServiceClient();

  let q = supabase
    .from('withdrawals')
    .select('*, users!inner(id,username,email)')
    .order('request_time', { ascending: false })
    .range(offset, offset + limit - 1);

  if (statusFilter && ['pending', 'processing', 'completed', 'rejected', 'cancelled'].includes(statusFilter)) {
    q = q.eq('status', statusFilter);
  }

  const { data } = await q;
  return data ?? [];
}

export async function completeProcessingWithdrawals(): Promise<number> {
  const supabase = createServiceClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('withdrawals')
    .select('id')
    .eq('status', 'processing')
    .lte('processed_time', cutoff);

  if (data && data.length > 0) {
    await supabase
      .from('withdrawals')
      .update({
        status: 'completed',
        processed_time: new Date().toISOString(),
      })
      .in('id', data.map((d) => d.id));
  }

  return data?.length ?? 0;
}
