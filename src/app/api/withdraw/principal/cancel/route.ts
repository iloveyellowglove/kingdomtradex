import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { withErrorHandler } from '@/lib/api-error-handler';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const token = cookies().get('__Host-kingdom_session')?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id')
    .eq('session_token', token)
    .limit(1);

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ success: false, error: 'Session expired.' }, { status: 401 });
  }

  const userId = sessions[0].user_id;

  const { withdrawal_id, deposit_id } = await request.json();
  const wdId = parseInt(withdrawal_id || '0', 10);
  const depId = parseInt(deposit_id || '0', 10);

  if (!wdId || isNaN(wdId)) {
    return NextResponse.json({ success: false, error: 'Invalid withdrawal ID.' }, { status: 400 });
  }

  // Fetch withdrawal
  const { data: withdrawal } = await supabase
    .from('withdrawals')
    .select('id, user_id, status, cooling_end_at, withdrawal_type')
    .eq('id', wdId)
    .eq('user_id', userId)
    .single();

  if (!withdrawal) {
    return NextResponse.json({ success: false, error: 'Withdrawal not found.' }, { status: 404 });
  }

  // Must be in cooling status
  if (withdrawal.status !== 'cooling') {
    return NextResponse.json({
      success: false,
      error: 'This withdrawal is not in the cooling period and cannot be cancelled.',
    }, { status: 400 });
  }

  // Must still be within cooling period
  if (withdrawal.cooling_end_at && new Date(withdrawal.cooling_end_at) <= new Date()) {
    return NextResponse.json({
      success: false,
      error: 'The cooling period has ended. This withdrawal is being processed and can no longer be cancelled.',
    }, { status: 400 });
  }

  // Cancel the withdrawal
  await supabase
    .from('withdrawals')
    .update({
      status: 'cancelled',
      failure_reason: 'Cancelled by user during cooling period',
    })
    .eq('id', wdId);

  // Revert the deposit lock back to 'locked' if we have the deposit_id
  if (depId && !isNaN(depId)) {
    const { data: existingLocks } = await supabase
      .from('deposit_locks')
      .select('id')
      .eq('deposit_id', depId)
      .limit(1);

    if (existingLocks && existingLocks.length > 0) {
      await supabase
        .from('deposit_locks')
        .update({ status: 'locked' })
        .eq('id', existingLocks[0].id);
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Withdrawal cancelled. Your deposit remains locked and continues earning daily returns.',
  });
});
