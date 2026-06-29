import { NextRequest, NextResponse } from 'next/server';
import { processPendingWithdrawals } from '@/lib/withdrawal-service';
import { completeProcessingWithdrawals } from '@/lib/db/withdrawals';

import { timingSafeEqual } from '@/lib/auth/csrf';

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!cronSecret || !timingSafeEqual(cronSecret, process.env.CRON_SECRET || '')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Process pending withdrawals via NOWPayments (authoritative payout provider)
  const result = await processPendingWithdrawals();

  // Mark long-processing withdrawals as completed
  const completed = await completeProcessingWithdrawals();

  return NextResponse.json({
    success: true,
    processed: result.processed,
    failed: result.failed,
    completed,
  });
}
