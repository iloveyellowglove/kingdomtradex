import { createServiceClient } from './supabase/service';
import { processDepositAtomic } from './db/atomic';
import { distributeCommissions } from './db/commissions';

export interface DepositResult {
  success: boolean;
  message: string;
  user_id?: number;
  amount?: number;
  currency?: string;
  deposit_id?: number;
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

  const { data: existing } = await supabase
    .from('deposits')
    .select('id')
    .eq('txn_id', params.txnId)
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: true, message: 'Duplicate transaction. Already processed.' };
  }

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
    return { success: true, message: 'Duplicate transaction. Already processed.' };
  }

  const depositId = depositRows[0].id as number | undefined;

  await processDepositAtomic(params.userId, params.amount);

  if (depositId) {
    try {
      await distributeCommissions(params.userId, params.amount, depositId);
    } catch (commErr) {
      console.error('[deposit-processing] commission distribution failed:', commErr);
    }
  }

  return {
    success: true,
    message: 'Deposit credited.',
    user_id: params.userId,
    amount: params.amount,
    currency: params.currency,
    deposit_id: depositId,
  };
}
