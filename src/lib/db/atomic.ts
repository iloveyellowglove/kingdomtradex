import { createServiceClient } from '@/lib/supabase/service';

function round8(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}

export async function creditUserBalance(userId: number, amount: number): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('credit_user_balance', {
    p_user_id: userId,
    p_amount: round8(amount),
  });
  if (error) throw new Error(`creditUserBalance failed: ${error.message}`);
  return Number(data);
}

export async function debitUserBalance(userId: number, amount: number): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('debit_user_balance', {
    p_user_id: userId,
    p_amount: round8(amount),
  });
  if (error) throw new Error(`debitUserBalance failed: ${error.message}`);
  return Number(data);
}

export async function creditUserBalanceWithDepositTotal(
  userId: number,
  amount: number
): Promise<{ newBalance: number; newTotalDeposited: number }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('credit_user_balance_with_deposit_total', {
    p_user_id: userId,
    p_amount: round8(amount),
  });
  if (error) throw new Error(`creditUserBalanceWithDepositTotal failed: ${error.message}`);
  const row = (data as unknown as Array<{ new_balance: number; new_total_deposited: number }>)?.[0];
  return {
    newBalance: Number(row?.new_balance ?? 0),
    newTotalDeposited: Number(row?.new_total_deposited ?? 0),
  };
}

export async function debitUserBalanceWithWithdrawalTotal(
  userId: number,
  amount: number
): Promise<{ newBalance: number; newTotalWithdrawn: number }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('debit_user_balance_with_withdrawal_total', {
    p_user_id: userId,
    p_amount: round8(amount),
  });
  if (error) throw new Error(`debitUserBalanceWithWithdrawalTotal failed: ${error.message}`);
  const row = (data as unknown as Array<{ new_balance: number; new_total_withdrawn: number }>)?.[0];
  return {
    newBalance: Number(row?.new_balance ?? 0),
    newTotalWithdrawn: Number(row?.new_total_withdrawn ?? 0),
  };
}

export async function moveBalanceToPending(
  userId: number,
  amount: number
): Promise<{ newBalance: number; newPending: number }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('move_balance_to_pending', {
    p_user_id: userId,
    p_amount: round8(amount),
  });
  if (error) throw new Error(`moveBalanceToPending failed: ${error.message}`);
  const row = (data as unknown as Array<{ new_balance: number; new_pending: number }>)?.[0];
  return {
    newBalance: Number(row?.new_balance ?? 0),
    newPending: Number(row?.new_pending ?? 0),
  };
}

export async function reversePendingToBalance(
  userId: number,
  amount: number
): Promise<{ newBalance: number; newPending: number }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('reverse_pending_to_balance', {
    p_user_id: userId,
    p_amount: round8(amount),
  });
  if (error) throw new Error(`reversePendingToBalance failed: ${error.message}`);
  const row = (data as unknown as Array<{ new_balance: number; new_pending: number }>)?.[0];
  return {
    newBalance: Number(row?.new_balance ?? 0),
    newPending: Number(row?.new_pending ?? 0),
  };
}
