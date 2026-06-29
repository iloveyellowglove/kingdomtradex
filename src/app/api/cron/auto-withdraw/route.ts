import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { debitProfitBalance } from '@/lib/db/atomic';
import { validateWalletAddress } from '@/lib/wallet-validation';
import { sendEmail } from '@/lib/services/email';

import { timingSafeEqual } from '@/lib/auth/csrf';

const MIN_AUTO_WITHDRAWAL = 25;
const DAILY_INTERVAL_HOURS = 23;
const WEEKLY_INTERVAL_HOURS = 167;

function round8(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!cronSecret || !timingSafeEqual(cronSecret, process.env.CRON_SECRET || '')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  // Query users with auto-withdrawal enabled
  const { data: users } = await supabase
    .from('users')
    .select('id, email, profit_balance, auto_withdrawal_frequency, auto_withdrawal_coin, auto_withdrawal_wallet, auto_withdrawal_min_amount')
    .eq('auto_withdrawal_enabled', true)
    .gte('profit_balance', MIN_AUTO_WITHDRAWAL)
    .gte('kyc_level', 1)
    .not('auto_withdrawal_coin', 'is', null)
    .not('auto_withdrawal_wallet', 'is', null)
    .eq('status', 'active');

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users ?? []) {
    try {
      const profitBalance = round8(Number(user.profit_balance ?? 0));
      const minAmount = Number(user.auto_withdrawal_min_amount ?? MIN_AUTO_WITHDRAWAL);
      const frequency = user.auto_withdrawal_frequency as 'daily' | 'weekly' | null;
      const coin = user.auto_withdrawal_coin as string;
      const wallet = user.auto_withdrawal_wallet as string;

      // Respect user's minimum amount threshold
      if (profitBalance < minAmount) {
        skipped++;
        continue;
      }

      // Validate wallet address format
      if (!validateWalletAddress(wallet, coin)) {
        console.warn(`[auto-withdraw] Invalid wallet for user ${user.id}: ${wallet}`);
        failed++;
        continue;
      }

      // Check frequency: when was the last withdrawal?
      const { data: lastWithdrawals } = await supabase
        .from('withdrawals')
        .select('request_time')
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
        .order('request_time', { ascending: false })
        .limit(1);

      if (lastWithdrawals && lastWithdrawals.length > 0) {
        const lastTime = new Date(lastWithdrawals[0].request_time).getTime();
        const hoursSince = (Date.now() - lastTime) / (1000 * 60 * 60);
        const minInterval = frequency === 'weekly' ? WEEKLY_INTERVAL_HOURS : DAILY_INTERVAL_HOURS;

        if (hoursSince < minInterval) {
          skipped++;
          continue;
        }
      }

      // Debit profit balance atomically
      try {
        await debitProfitBalance(user.id, profitBalance);
      } catch (debitErr) {
        console.warn(`[auto-withdraw] Debit failed for user ${user.id}:`, debitErr instanceof Error ? debitErr.message : String(debitErr));
        failed++;
        continue;
      }

      // Create withdrawal record
      const { error: insertErr } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: profitBalance.toFixed(8),
          currency: coin,
          coin,
          address: wallet,
          wallet_address: wallet,
          fee: '0.00000000',
          request_time: now,
          eligible_time: now,
          status: 'pending',
          withdrawal_type: 'profit',
          source: 'auto',
          forfeit_amount: 0,
        });

      if (insertErr) {
        console.error(`[auto-withdraw] Insert failed for user ${user.id}:`, insertErr.message);
        // Refund: credit back the profit balance
        await supabase.rpc('credit_profit_balance', {
          p_user_id: user.id,
          p_amount: profitBalance,
        });
        failed++;
        continue;
      }

      // Send email notification (non-blocking)
      try {
        await sendEmail(
          user.email as string,
          'Auto-withdrawal processed - KingdomTradex',
          `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#F0B90B">KingdomTradex</h2>
            <p>An automatic withdrawal of <strong>$${profitBalance.toFixed(2)}</strong> in <strong>${coin}</strong> has been initiated to:</p>
            <p style="background:#1E2329;padding:12px;border-radius:6px;font-family:monospace;word-break:break-all;color:#EAECEF">${wallet}</p>
            <p>It will be processed within 24 hours by the next payout cycle.</p>
            <p style="color:#848E9C;font-size:13px">If you did not expect this, please disable auto-withdrawal in your settings immediately.</p>
          </div>`
        );
      } catch (emailErr) {
        console.error(`[auto-withdraw] Email failed for user ${user.id}:`, emailErr);
      }

      processed++;
    } catch (err) {
      console.error(`[auto-withdraw] Unexpected error for user ${user.id}:`, err instanceof Error ? err.message : String(err));
      failed++;
    }
  }

  // Log summary to admin_logs
  try {
    await supabase.from('admin_logs').insert({
      admin_id: 0, // system
      action: 'auto_withdraw_cron',
      target_table: 'withdrawals',
      new_value: JSON.stringify({ processed, skipped, failed, timestamp: now }),
      created_at: now,
    });
  } catch { /* non-fatal */ }

  return NextResponse.json({ success: true, processed, skipped, failed });
}
