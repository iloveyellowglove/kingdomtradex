import { createServiceClient } from '../supabase/service';
import { getSetting } from './settings';
import { creditCommissionBalance } from './atomic';
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
  return (data ?? []).reduce((sum: number, r: Record<string, unknown>) => sum + Number(r.amount), 0);
}

export async function getTotalPaidCommissions(userId: number): Promise<number> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('referral_commissions')
    .select('amount')
    .eq('user_id', userId)
    .eq('status', 'paid');
  return (data ?? []).reduce((sum: number, r: Record<string, unknown>) => sum + Number(r.amount), 0);
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

export async function distributeCommissions(
  depositorUserId: number,
  depositAmount: number,
  depositId: number,
): Promise<void> {
  const supabase = createServiceClient();
  const roundedAmount = Math.round(depositAmount * 1e8) / 1e8;

  let currentUserId = depositorUserId;

  for (let level = 1; level <= 5; level++) {
    const { data: currentUser } = await supabase
      .from('users')
      .select('referred_by')
      .eq('id', currentUserId)
      .single();

    if (!currentUser?.referred_by) break;

    const { data: uplineUser } = await supabase
      .from('users')
      .select('id, status')
      .eq('id', currentUser.referred_by)
      .single();

    if (!uplineUser || uplineUser.status !== 'active') break;

    const percentageStr = await getSetting(`commission_l${level}`, String([15, 5, 3, 2, 1][level - 1]));
    const percentage = parseFloat(percentageStr) || [15, 5, 3, 2, 1][level - 1];
    const commissionAmount = Math.round((roundedAmount * percentage / 100) * 1e8) / 1e8;

    const { error: insertErr } = await supabase
      .from('referral_commissions')
      .insert({
        user_id: uplineUser.id,
        source_user_id: depositorUserId,
        level,
        percentage,
        amount: commissionAmount,
        source_deposit_id: depositId,
        source_amount: roundedAmount,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

    if (insertErr) {
      if (insertErr.code === '23505') {
        currentUserId = uplineUser.id;
        continue;
      }
      console.error('[commissions] insert failed L' + level + ':', insertErr.message);
      break;
    }

    // Commission is created as 'pending' - it will be confirmed when the deposit matures
    currentUserId = uplineUser.id;
  }
}

export async function confirmCommissions(depositId: number): Promise<void> {
  const supabase = createServiceClient();

  // Fetch all pending commissions for this deposit
  const { data: commissions } = await supabase
    .from('referral_commissions')
    .select('id, user_id, amount')
    .eq('source_deposit_id', depositId)
    .eq('status', 'pending');

  if (!commissions || commissions.length === 0) return;

  for (const c of commissions) {
    try {
      await creditCommissionBalance(c.user_id, Number(c.amount));
    } catch (creditErr) {
      console.error('[commissions] confirm credit failed for commission', c.id, ':', creditErr);
      continue;
    }

    await supabase
      .from('referral_commissions')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', c.id);
  }
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
