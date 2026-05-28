import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { creditProfitBalance } from '@/lib/db/atomic';

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().split('T')[0];

  // Get all active locks
  const { data: activeLocks } = await supabase
    .from('deposit_locks')
    .select('id, user_id, amount, daily_rate')
    .eq('status', 'locked');

  let applied = 0;

  for (const lock of activeLocks ?? []) {
    const profitAmount = Number(lock.amount) * Number(lock.daily_rate);

    // Dedup: check if already credited for this lock today
    const { data: existing } = await supabase
      .from('ai_trading_profits')
      .select('id')
      .eq('user_id', lock.user_id)
      .eq('date', today)
      .eq('deposit_lock_id', lock.id)
      .limit(1);

    if (existing && existing.length > 0) continue;

    // Log profit record
    await supabase.from('ai_trading_profits').insert({
      user_id: lock.user_id,
      amount: profitAmount.toFixed(8),
      percentage: Number(lock.daily_rate) * 100,
      date: today,
      deposit_lock_id: lock.id,
      created_at: new Date().toISOString(),
    });

    // Credit profit balance
    await creditProfitBalance(lock.user_id, profitAmount);

    applied++;
  }

  return NextResponse.json({ success: true, applied, date: today });
}
