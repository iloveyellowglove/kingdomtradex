import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getSetting } from '@/lib/db/settings';
import { creditUserBalance } from '@/lib/db/atomic';

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const percentage = parseFloat(await getSetting('daily_profit_percentage', '1.50'));
  const supabase = createServiceClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: users } = await supabase
    .from('users')
    .select('id,display_balance')
    .eq('status', 'active')
    .gt('display_balance', 0);

  let applied = 0;

  for (const user of users ?? []) {
    const balance = Number(user.display_balance || 0);
    if (balance <= 0) continue;

    const profitAmount = balance * (percentage / 100);

    const { data: existing } = await supabase
      .from('ai_trading_profits')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .limit(1);

    if (existing && existing.length > 0) continue;

    await supabase.from('ai_trading_profits').insert({
      user_id: user.id,
      amount: profitAmount.toFixed(8),
      percentage,
      date: today,
      created_at: new Date().toISOString(),
    });

    await creditUserBalance(user.id, profitAmount);

    applied++;
  }

  return NextResponse.json({ success: true, applied, percentage, date: today });
}
