import { NextRequest, NextResponse } from 'next/server';
import { processEligibleWithdrawals } from '@/lib/services/plisio-withdrawal';
import { completeProcessingWithdrawals } from '@/lib/db/withdrawals';

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const processed = await processEligibleWithdrawals();
  const completed = await completeProcessingWithdrawals();

  return NextResponse.json({
    success: true,
    processed,
    completed,
  });
}
