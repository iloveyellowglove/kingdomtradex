import { createServiceClient } from '../supabase/service';
import type { Deposit } from '../types';

export async function getDepositsByUser(userId: number, limit = 5): Promise<Deposit[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('deposits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function createDeposit(deposit: {
  user_id: number;
  txid: string;
  currency: string;
  amount: number;
  address?: string;
  status?: string;
  created_at?: string;
}): Promise<Deposit | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('deposits')
    .insert(deposit)
    .select();
  return data?.[0] ?? null;
}

export async function confirmDeposit(depositId: number): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from('deposits')
    .update({
      status: 'completed',
      confirmed_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .eq('id', depositId);
}

export async function getAllDeposits(
  limit = 50,
  offset = 0,
  statusFilter = ''
): Promise<Deposit[]> {
  const supabase = createServiceClient();

  let q = supabase
    .from('deposits')
    .select('*, users!inner(id,username,email)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (statusFilter && ['pending', 'completed', 'rejected'].includes(statusFilter)) {
    q = q.eq('status', statusFilter);
  }

  const { data } = await q;
  return data ?? [];
}

export async function getDepositById(id: number): Promise<Deposit | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('deposits')
    .select('*')
    .eq('id', id)
    .limit(1);
  return data?.[0] ?? null;
}
