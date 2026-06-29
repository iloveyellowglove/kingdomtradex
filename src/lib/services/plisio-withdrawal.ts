// DEPRECATED: Use NOWPayments withdrawal-service.ts instead. Kept for reference only.
// NOWPayments is the authoritative payout provider. The processPendingWithdrawals()
// function in src/lib/withdrawal-service.ts handles all withdrawal processing.

import { PlisioClient } from './plisio-client';
import { createServiceClient } from '../supabase/service';
import { updateWithdrawal, getEligibleWithdrawals, getCoolingWithdrawalsReady } from '../db/withdrawals';
import { getUserById } from '../db/users';
import { getSetting } from '../db/settings';
import { reversePendingToBalance } from '../db/atomic';

export async function processEligibleWithdrawals(): Promise<number> {
  let processed = 0;
  const now = new Date().toISOString();

  const plisioApiKey = await getSetting('plisio_api_key', '');
  const plisioClient = plisioApiKey ? new PlisioClient(plisioApiKey) : null;

  const withdrawals = await getEligibleWithdrawals();

  for (const w of withdrawals) {
    const userId = w.user_id;
    const amount = Number(w.amount);

    const user = await getUserById(userId);
    if (!user) continue;

    if (amount > Number(user.display_balance || 0)) {
      await updateWithdrawal(w.id, {
        status: 'rejected',
        block_reason: 'Insufficient balance at processing time',
      });
      await reversePendingToBalance(userId, amount);
      continue;
    }

    if (plisioClient) {
      let plisioCurrency = w.currency || 'USDT';
      if (plisioCurrency === 'USDT') plisioCurrency = 'USDT_TRX';

      const result = await plisioClient.withdraw(plisioCurrency, w.address || '', amount, 'normal');
      const plisioStatus = result.data?.status || result.status || 'error';

      if (result.status === 'success' && ['completed', 'pending'].includes(plisioStatus)) {
        const supabase = createServiceClient();
        await supabase.rpc('complete_withdrawal_atomic', {
          p_user_id: userId,
          p_amount: Math.round(amount * 1e8) / 1e8,
        });

        const finalStatus = plisioStatus === 'completed' ? 'completed' : 'processing';
        await updateWithdrawal(w.id, {
          status: finalStatus,
          txn_id: result.data?.id || null,
          processed_time: now,
        });
        processed++;
        continue;
      }

      const errorMsg = result.data?.message || 'Plisio withdrawal failed';
      await reversePendingToBalance(userId, amount);
      await updateWithdrawal(w.id, {
        status: 'failed',
        block_reason: errorMsg,
      });
      continue;
    }

    await updateWithdrawal(w.id, {
      status: 'processing',
      processed_time: now,
    });

    const supabase = createServiceClient();
    await supabase.rpc('complete_withdrawal_atomic', {
      p_user_id: userId,
      p_amount: Math.round(amount * 1e8) / 1e8,
    });

    processed++;
  }

  return processed;
}

/**
 * Process cooling withdrawals that have completed their 48-hour cooling period.
 * The forfeit (25%) was already applied when the withdrawal was created.
 * The amount in the withdrawal record is the net amount (after forfeit).
 */
export async function processCoolingWithdrawals(): Promise<number> {
  let processed = 0;
  const now = new Date().toISOString();

  const plisioApiKey = await getSetting('plisio_api_key', '');
  const plisioClient = plisioApiKey ? new PlisioClient(plisioApiKey) : null;

  const withdrawals = await getCoolingWithdrawalsReady();

  for (const w of withdrawals) {
    const userId = w.user_id;
    const netAmount = Number(w.amount); // Already net of 25% forfeit

    if (plisioClient) {
      let plisioCurrency = w.currency || 'USDT';
      if (plisioCurrency === 'USDT') plisioCurrency = 'USDT_TRX';

      const result = await plisioClient.withdraw(plisioCurrency, w.address || '', netAmount, 'normal');
      const plisioStatus = result.data?.status || result.status || 'error';

      if (result.status === 'success' && ['completed', 'pending'].includes(plisioStatus)) {
        const supabase = createServiceClient();
        await supabase.rpc('complete_withdrawal_atomic', {
          p_user_id: userId,
          p_amount: Math.round(netAmount * 1e8) / 1e8,
        });

        const finalStatus = plisioStatus === 'completed' ? 'completed' : 'processing';
        await updateWithdrawal(w.id, {
          status: finalStatus,
          txn_id: result.data?.id || null,
          processed_time: now,
          completed_at: finalStatus === 'completed' ? now : null,
        });
        processed++;
        continue;
      }

      const errorMsg = result.data?.message || 'Plisio cooling withdrawal failed';
      await updateWithdrawal(w.id, {
        status: 'failed',
        failure_reason: errorMsg,
      });
      continue;
    }

    // No Plisio configured: mark as processing for manual review
    await updateWithdrawal(w.id, {
      status: 'processing',
      processed_time: now,
    });

    processed++;
  }

  return processed;
}
