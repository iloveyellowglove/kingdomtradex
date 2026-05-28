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

export async function processDepositAtomic(
  userId: number,
  amount: number
): Promise<{
  newBalance: number;
  newTotalDeposited: number;
  bonusUnlocked: boolean;
  bonusAmount: number;
}> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('process_deposit_atomic', {
    p_user_id: userId,
    p_amount: round8(amount),
    p_now: new Date().toISOString(),
  });
  if (error) throw new Error(`processDepositAtomic failed: ${error.message}`);
  const row = (data as unknown as Array<{
    new_balance: number;
    new_total_deposited: number;
    bonus_unlocked: boolean;
    bonus_amount: number;
  }>)?.[0];
  return {
    newBalance: Number(row?.new_balance ?? 0),
    newTotalDeposited: Number(row?.new_total_deposited ?? 0),
    bonusUnlocked: row?.bonus_unlocked ?? false,
    bonusAmount: Number(row?.bonus_amount ?? 0),
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

// ── Profit balance ──────────────────────────────────────────────────────────

export async function creditProfitBalance(userId: number, amount: number): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('credit_profit_balance', {
    p_user_id: userId,
    p_amount: round8(amount),
  });
  if (error) throw new Error(`creditProfitBalance failed: ${error.message}`);
  return Number(data);
}

export async function debitProfitBalance(userId: number, amount: number): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('debit_profit_balance', {
    p_user_id: userId,
    p_amount: round8(amount),
  });
  if (error) throw new Error(`debitProfitBalance failed: ${error.message}`);
  return Number(data);
}

// ── Commission balance ──────────────────────────────────────────────────────

export async function creditCommissionBalance(userId: number, amount: number): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('credit_commission_balance', {
    p_user_id: userId,
    p_amount: round8(amount),
  });
  if (error) throw new Error(`creditCommissionBalance failed: ${error.message}`);
  return Number(data);
}

export async function debitCommissionBalance(userId: number, amount: number): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('debit_commission_balance', {
    p_user_id: userId,
    p_amount: round8(amount),
  });
  if (error) throw new Error(`debitCommissionBalance failed: ${error.message}`);
  return Number(data);
}

// ── Locked balance ──────────────────────────────────────────────────────────

export async function creditLockedBalance(userId: number, amount: number): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('credit_locked_balance', {
    p_user_id: userId,
    p_amount: round8(amount),
  });
  if (error) throw new Error(`creditLockedBalance failed: ${error.message}`);
  return Number(data);
}

export async function debitLockedBalance(userId: number, amount: number): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('debit_locked_balance', {
    p_user_id: userId,
    p_amount: round8(amount),
  });
  if (error) throw new Error(`debitLockedBalance failed: ${error.message}`);
  return Number(data);
}

// ── Deposit lock lifecycle ──────────────────────────────────────────────────

export interface DepositLock {
  id: string;
  user_id: number;
  deposit_id: number;
  amount: number;
  tier: string;
  lock_months: number;
  daily_rate: number;
  locked_at: string;
  unlocks_at: string;
  status: string;
  created_at: string;
}

export async function lockDeposit(
  userId: number,
  depositId: number,
  amount: number,
  tier: string,
  lockMonths: number,
  dailyRate: number
): Promise<DepositLock> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('lock_deposit', {
    p_user_id: userId,
    p_deposit_id: depositId,
    p_amount: round8(amount),
    p_tier: tier,
    p_lock_months: lockMonths,
    p_daily_rate: dailyRate,
  });
  if (error) throw new Error(`lockDeposit failed: ${error.message}`);
  return (data as unknown as DepositLock[])?.[0];
}

export async function matureDepositLock(lockId: string): Promise<DepositLock> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('mature_deposit_lock', {
    p_lock_id: lockId,
  });
  if (error) throw new Error(`matureDepositLock failed: ${error.message}`);
  return (data as unknown as DepositLock[])?.[0];
}
