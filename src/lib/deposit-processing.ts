import { createServiceClient } from './supabase/service';
import { lockDeposit } from './db/atomic';
import { distributeCommissions } from './db/commissions';

export interface DepositResult {
  success: boolean;
  message: string;
  user_id?: number;
  amount?: number;
  currency?: string;
  deposit_id?: number;
}

function round8(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}

export async function processCompletedDeposit(params: {
  userId: number;
  txnId: string;
  currency: string;
  amount: number;
  address: string;
  paymentProvider: string;
  providerPaymentId: string;
}): Promise<DepositResult> {
  const supabase = createServiceClient();

  // Check if already fully processed (has a deposit_lock)
  const { data: existingDep } = await supabase
    .from('deposits')
    .select('*')
    .eq('txn_id', params.txnId)
    .limit(1);

  let depositId: number;
  let tier: string | null = null;
  let lockMonths: number | null = null;

  if (existingDep && existingDep.length > 0) {
    const dep = existingDep[0];

    // Check if this deposit is already locked
    const { data: existingLock } = await supabase
      .from('deposit_locks')
      .select('id')
      .eq('deposit_id', dep.id)
      .limit(1);

    if (existingLock && existingLock.length > 0) {
      return { success: true, message: 'Duplicate transaction. Already processed.' };
    }

    depositId = dep.id;
    tier = dep.tier ?? null;
    lockMonths = dep.lock_months ?? null;

    // Ensure status is completed
    if (dep.status !== 'completed') {
      await supabase
        .from('deposits')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', depositId);
    }
  } else {
    // Insert new deposit row
    const { data: depositRows, error: insertErr } = await supabase.from('deposits').insert({
      user_id: params.userId,
      txn_id: params.txnId,
      txid: params.txnId,
      currency: params.currency,
      amount: params.amount,
      address: params.address,
      status: 'completed',
      payment_provider: params.paymentProvider,
      provider_payment_id: params.providerPaymentId,
      created_at: new Date().toISOString(),
    }).select();

    if (insertErr || !depositRows || depositRows.length === 0) {
      return { success: false, message: 'Failed to insert deposit.' };
    }

    depositId = depositRows[0].id;
    tier = depositRows[0].tier ?? null;
    lockMonths = depositRows[0].lock_months ?? null;
  }

  // Look up user for bonus handling and first_deposit_time
  const { data: userRow } = await supabase
    .from('users')
    .select('bonus_balance, bonus_locked, minimum_deposit_to_unlock, total_deposited_real')
    .eq('id', params.userId)
    .single();

  let lockAmount = round8(params.amount);
  let bonusUnlocked = false;
  let bonusAmount = 0;

  if (userRow?.bonus_locked && userRow.bonus_balance > 0) {
    const newTotal = round8(Number(userRow.total_deposited_real) + params.amount);
    if (newTotal >= Number(userRow.minimum_deposit_to_unlock)) {
      bonusUnlocked = true;
      bonusAmount = round8(Number(userRow.bonus_balance));
      lockAmount = round8(lockAmount + bonusAmount);

      await supabase
        .from('users')
        .update({
          bonus_balance: 0,
          bonus_locked: false,
          bonus_unlocked_at: new Date().toISOString(),
        })
        .eq('id', params.userId);
    }
  }

  // Update total_deposited_real
  const newTotalDeposited = round8(Number(userRow?.total_deposited_real ?? 0) + params.amount);

  await supabase
    .from('users')
    .update({ total_deposited_real: newTotalDeposited })
    .eq('id', params.userId);

  // Set first_deposit_time if not already set
  const { data: freshUser } = await supabase
    .from('users')
    .select('first_deposit_time')
    .eq('id', params.userId)
    .single();

  if (freshUser && !freshUser.first_deposit_time) {
    await supabase
      .from('users')
      .update({ first_deposit_time: new Date().toISOString() })
      .eq('id', params.userId);
  }

  // Lock deposit with tier (if tier is set) or fall back to simple lock
  if (tier && lockMonths) {
    const { data: tierRow } = await supabase
      .from('lock_tiers')
      .select('daily_rate')
      .eq('tier', tier)
      .single();

    const dailyRate = tierRow?.daily_rate ?? 0.003;

    await lockDeposit(
      params.userId,
      depositId,
      lockAmount,
      tier,
      lockMonths,
      Number(dailyRate),
    );
  } else {
    // Fallback: deposit without tier — use a default 6-month growth lock
    const { data: tierRow } = await supabase
      .from('lock_tiers')
      .select('daily_rate, lock_months')
      .eq('tier', 'growth')
      .single();

    const dailyRate = tierRow?.daily_rate ?? 0.003;
    const fallbackMonths = tierRow?.lock_months ?? 6;

    await lockDeposit(
      params.userId,
      depositId,
      lockAmount,
      'growth',
      fallbackMonths,
      Number(dailyRate),
    );
  }

  // Distribute referral commissions
  try {
    await distributeCommissions(params.userId, params.amount, depositId);
  } catch (commErr) {
    console.error('[deposit-processing] commission distribution failed:', commErr);
  }

  return {
    success: true,
    message: 'Deposit locked.' + (bonusUnlocked ? ` Signup bonus of $${bonusAmount.toFixed(2)} added to lock.` : ''),
    user_id: params.userId,
    amount: params.amount,
    currency: params.currency,
    deposit_id: depositId,
  };
}
