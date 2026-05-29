import { createServiceClient } from '@/lib/supabase/service';

export interface DepositSplit {
  id: number;
  deposit_id: number;
  total_amount: number;
  xmr_amount: number;
  usdt_retained: number;
  xmr_tx_hash: string | null;
  cold_wallet_address: string;
  status: 'pending' | 'converting' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export async function createDepositSplit(data: {
  deposit_id: number;
  total_amount: number;
  xmr_amount: number;
  usdt_retained: number;
  cold_wallet_address: string;
}): Promise<DepositSplit> {
  const supabase = createServiceClient();

  const { data: rows, error } = await supabase
    .from('deposit_splits')
    .insert({
      deposit_id: data.deposit_id,
      total_amount: data.total_amount,
      xmr_amount: data.xmr_amount,
      usdt_retained: data.usdt_retained,
      cold_wallet_address: data.cold_wallet_address,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select();

  if (error) throw new Error(`createDepositSplit failed: ${error.message}`);
  return (rows as unknown as DepositSplit[])?.[0];
}

export async function updateDepositSplit(
  id: number,
  fields: Partial<Pick<DepositSplit, 'status' | 'xmr_tx_hash' | 'completed_at' | 'error_message'>>
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('deposit_splits')
    .update({
      ...fields,
      ...(fields.completed_at ? { completed_at: fields.completed_at } : {}),
    })
    .eq('id', id);

  if (error) throw new Error(`updateDepositSplit failed: ${error.message}`);
}

export async function getDepositSplitByDepositId(depositId: number): Promise<DepositSplit | null> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from('deposit_splits')
    .select('*')
    .eq('deposit_id', depositId)
    .order('id', { ascending: false })
    .limit(1);

  return (data as unknown as DepositSplit[])?.[0] ?? null;
}

export async function getColdWalletXmr(): Promise<string> {
  const supabase = createServiceClient();

  try {
    const { data } = await supabase
      .from('settings')
      .select('setting_value')
      .eq('setting_key', 'cold_wallet_xmr')
      .limit(1);

    if (data && data.length > 0 && data[0].setting_value) {
      return data[0].setting_value;
    }
  } catch {
    // Fall through to env var
  }

  return process.env.COLD_WALLET_XMR || '';
}
