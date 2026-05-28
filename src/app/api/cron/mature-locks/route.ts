import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { matureDepositLock } from '@/lib/db/atomic';
import { sendEmail } from '@/lib/services/email';

const TIER_LABELS: Record<string, string> = {
  growth: 'Growth',
  builder: 'Builder',
  kingdom: 'Kingdom',
  legacy: 'Legacy',
};

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: expiredLocks } = await supabase
    .from('deposit_locks')
    .select('id, user_id, amount, tier')
    .eq('status', 'locked')
    .lte('unlocks_at', new Date().toISOString());

  let matured = 0;

  for (const lock of expiredLocks ?? []) {
    try {
      await matureDepositLock(lock.id);
      matured++;

      const { data: users } = await supabase
        .from('users')
        .select('email')
        .eq('id', lock.user_id)
        .limit(1);

      const email = users?.[0]?.email;
      if (email) {
        const tierLabel = TIER_LABELS[lock.tier] || lock.tier;
        await sendEmail(
          email,
          `Your ${tierLabel} deposit has matured`,
          `<p>Your <strong>${tierLabel}</strong> deposit of <strong>$${Number(lock.amount).toFixed(2)}</strong> has matured.</p><p>The principal has been added to your Available Profit balance.</p><p><a href="https://kingdomtradex.vercel.app/dashboard">View Dashboard</a></p>`,
        );
      }
    } catch (err) {
      console.error(`[mature-locks] failed for lock ${lock.id}:`, err);
    }
  }

  return NextResponse.json({ success: true, matured, total: expiredLocks?.length ?? 0 });
}
