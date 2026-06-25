// INTERNAL DUMMY BALANCE - DO NOT USE FOR REAL FUNDS OR EXPOSE TO FRONTEND
// These helpers operate on users.dummy_balance, which is never shown to the user.
// Manual trading actions (buy/close/reset) affect only the dummy balance.
// The user's real balance (display_balance) is never touched by these functions.

import { createServiceClient } from '@/lib/supabase/service';

function round8(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}

export async function debitDummyBalance(userId: number, amount: number): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('debit_dummy_balance', {
    p_user_id: userId,
    p_amount: round8(amount),
  });
  if (error) throw new Error(`debitDummyBalance failed: ${error.message}`);
  return Number(data);
}

export async function creditDummyBalance(userId: number, amount: number): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('credit_dummy_balance', {
    p_user_id: userId,
    p_amount: round8(amount),
  });
  if (error) throw new Error(`creditDummyBalance failed: ${error.message}`);
  return Number(data);
}

export async function resetDummyAccount(userId: number): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('reset_dummy_account', {
    p_user_id: userId,
  });
  if (error) throw new Error(`resetDummyAccount failed: ${error.message}`);
  return Number(data);
}
