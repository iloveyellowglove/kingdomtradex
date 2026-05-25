import { PlisioClient } from './plisio-client';
import { createServiceClient } from '../supabase/service';
import { updateWithdrawal, getEligibleWithdrawals } from '../db/withdrawals';
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
