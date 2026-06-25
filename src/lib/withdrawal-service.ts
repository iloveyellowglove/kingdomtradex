// ============================================================================
// Withdrawal Service — business logic for profit/principal withdrawals,
// fee estimation via NOWPayments, auto-withdrawal scheduling.
// ============================================================================

import { createServiceClient } from '@/lib/supabase/service';

const NOWPAYMENTS_API = 'https://api.nowpayments.io/v1';
const MIN_WITHDRAWAL_USD = 25;
const WEEKLY_INTERVAL_HOURS = 6 * 24 + 23; // 167 hours (7 days minus 1h grace)
const DAILY_INTERVAL_HOURS = 23;             // 23 hours grace

// ── Types ────────────────────────────────────────────────────────────────────

export interface FeeEstimate {
  currency: string;
  network: string;
  estimatedFee: number;
  minAmount: number;
  maxAmount: number;
}

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  nextEligibleAt?: string;   // ISO timestamp
  kycLevel: number;
  availableProfit: number;
  withdrawalFrequency: 'daily' | 'weekly' | null;
}

export interface PayoutResult {
  success: boolean;
  payoutId?: number;
  txHash?: string;
  error?: string;
}

// ── Eligibility ──────────────────────────────────────────────────────────────

export async function checkWithdrawalEligibility(userId: number): Promise<EligibilityResult> {
  const supabase = createServiceClient();

  const { data: user } = await supabase
    .from('users')
    .select('kyc_level, profit_balance, auto_withdrawal_frequency')
    .eq('id', userId)
    .single();

  if (!user) {
    return { eligible: false, reason: 'User not found.', kycLevel: 0, availableProfit: 0, withdrawalFrequency: null };
  }

  const kycLevel = Number(user.kyc_level ?? 0);
  const profitBalance = Number(user.profit_balance ?? 0);
  const frequency = (user.auto_withdrawal_frequency as 'daily' | 'weekly' | null) ?? null;

  // KYC gate
  if (kycLevel < 1) {
    return {
      eligible: false,
      reason: 'Email verification required before withdrawing profits.',
      kycLevel,
      availableProfit: profitBalance,
      withdrawalFrequency: frequency,
    };
  }

  // Balance gate
  if (profitBalance < MIN_WITHDRAWAL_USD) {
    return {
      eligible: false,
      reason: `Minimum withdrawal is $${MIN_WITHDRAWAL_USD}.00.`,
      kycLevel,
      availableProfit: profitBalance,
      withdrawalFrequency: frequency,
    };
  }

  // Frequency gate — check last withdrawal
  const { data: lastWd } = await supabase
    .from('withdrawals')
    .select('request_time, status')
    .eq('user_id', userId)
    .in('status', ['pending', 'processing', 'completed'])
    .order('request_time', { ascending: false })
    .limit(1);

  if (lastWd && lastWd.length > 0) {
    const lastTime = new Date(lastWd[0].request_time).getTime();
    const now = Date.now();
    const hoursSince = (now - lastTime) / (1000 * 60 * 60);

    // KYC Level 2+ allows daily; Level 1 only weekly
    const minInterval = kycLevel >= 2 ? DAILY_INTERVAL_HOURS : WEEKLY_INTERVAL_HOURS;

    if (hoursSince < minInterval) {
      const nextTime = new Date(lastTime + minInterval * 60 * 60 * 1000);
      const levelLabel = kycLevel >= 2 ? '24 hours' : '7 days';
      return {
        eligible: false,
        reason: `Withdrawal limit reached. You can withdraw once per ${levelLabel}.`,
        nextEligibleAt: nextTime.toISOString(),
        kycLevel,
        availableProfit: profitBalance,
        withdrawalFrequency: frequency,
      };
    }
  }

  // Check for existing pending withdrawal
  const { data: pending } = await supabase
    .from('withdrawals')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['pending', 'processing'])
    .limit(1);

  if (pending && pending.length > 0) {
    return {
      eligible: false,
      reason: 'You have a pending withdrawal. Please wait for it to be processed.',
      kycLevel,
      availableProfit: profitBalance,
      withdrawalFrequency: frequency,
    };
  }

  return {
    eligible: true,
    kycLevel,
    availableProfit: profitBalance,
    withdrawalFrequency: frequency,
  };
}

// ── Fee Estimation ───────────────────────────────────────────────────────────

export async function estimateNetworkFee(currency: string, amountUsd: number): Promise<number> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) return 0;

  try {
    const res = await fetch(
      `${NOWPAYMENTS_API}/estimate?amount=${amountUsd}&currency_from=usd&currency_to=${currency}`,
      { headers: { 'x-api-key': apiKey } }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    return Number(data?.estimated_amount ?? 0);
  } catch {
    return 0;
  }
}

// ── Payout via NOWPayments ───────────────────────────────────────────────────

export async function createPayout(
  address: string,
  currency: string,
  amount: number,
  ipnUrl: string
): Promise<PayoutResult> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) return { success: false, error: 'NOWPayments not configured.' };

  try {
    const res = await fetch(`${NOWPAYMENTS_API}/payout`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payouts: [{
          address,
          currency,
          amount,
          ipn_callback_url: ipnUrl,
        }],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.message ?? `Payout API error ${res.status}` };
    }

    return {
      success: true,
      payoutId: data?.payout_id ?? data?.id,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Payout request failed.' };
  }
}

// ── Balance helpers ──────────────────────────────────────────────────────────

export async function getUserBalances(userId: number): Promise<{
  profitBalance: number;
  commissionBalance: number;
  displayBalance: number;
  lockedBalance: number;
  signupCredit: number;
}> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('profit_balance, commission_balance, display_balance, locked_balance, signup_credit')
    .eq('id', userId)
    .single();

  return {
    profitBalance: Number(data?.profit_balance ?? 0),
    commissionBalance: Number(data?.commission_balance ?? 0),
    displayBalance: Number(data?.display_balance ?? 0),
    lockedBalance: Number(data?.locked_balance ?? 0),
    signupCredit: Number(data?.signup_credit ?? 50),
  };
}

export async function getLockedDeposits(userId: number) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('deposit_locks')
    .select('id, amount, tier, lock_days, daily_rate, locked_at, unlocks_at, status')
    .eq('user_id', userId)
    .eq('status', 'locked')
    .order('unlocks_at', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((d: any) => ({
    id: d.id,
    amount: Number(d.amount),
    tier: d.tier as string,
    lockDays: Number(d.lock_days),
    dailyRate: Number(d.daily_rate),
    lockedAt: d.locked_at as string,
    unlocksAt: d.unlocks_at as string,
    status: d.status as string,
    // Calculate time remaining
    timeRemaining: Math.max(0, new Date(d.unlocks_at as string).getTime() - Date.now()),
    // 25% forfeit for early principal withdrawal
    forfeitAmount: Number(d.amount) * 0.25,
    netIfEarly: Number(d.amount) * 0.75,
  }));
}

// ── Auto-withdrawal ──────────────────────────────────────────────────────────

export async function updateAutoWithdrawSettings(
  userId: number,
  settings: {
    auto_withdrawal_enabled: boolean;
    auto_withdrawal_frequency?: 'daily' | 'weekly' | null;
    auto_withdrawal_coin?: string | null;
    auto_withdrawal_wallet?: string | null;
  }
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('users')
    .update({
      auto_withdrawal_enabled: settings.auto_withdrawal_enabled,
      ...(settings.auto_withdrawal_frequency !== undefined && {
        auto_withdrawal_frequency: settings.auto_withdrawal_frequency,
      }),
      ...(settings.auto_withdrawal_coin !== undefined && {
        auto_withdrawal_coin: settings.auto_withdrawal_coin,
      }),
      ...(settings.auto_withdrawal_wallet !== undefined && {
        auto_withdrawal_wallet: settings.auto_withdrawal_wallet,
      }),
    })
    .eq('id', userId);

  if (error) throw new Error(`updateAutoWithdrawSettings: ${error.message}`);
}

export async function getAutoWithdrawSettings(userId: number) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('auto_withdrawal_enabled, auto_withdrawal_frequency, auto_withdrawal_coin, auto_withdrawal_wallet')
    .eq('id', userId)
    .single();

  return {
    enabled: Boolean(data?.auto_withdrawal_enabled ?? false),
    frequency: (data?.auto_withdrawal_frequency as 'daily' | 'weekly' | null) ?? null,
    coin: (data?.auto_withdrawal_coin as string | null) ?? null,
    wallet: (data?.auto_withdrawal_wallet as string | null) ?? null,
  };
}
