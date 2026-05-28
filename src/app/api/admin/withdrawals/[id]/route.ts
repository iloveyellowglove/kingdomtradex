import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import { creditProfitBalance, creditCommissionBalance } from '@/lib/db/atomic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = cookies().get('kingdom_session')?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: 'Not authenticated.' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id, user_role')
    .eq('session_token', token)
    .limit(1);

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ success: false, error: 'Session expired.' }, { status: 401 });
  }

  if (sessions[0].user_role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden.' }, { status: 403 });
  }

  const adminId = sessions[0].user_id;
  const { id: withdrawalId } = await params;
  const { action, admin_notes } = await request.json();

  if (!['approve', 'reject', 'complete'].includes(action)) {
    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  }

  // Fetch withdrawal
  const { data: withdrawals } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('id', parseInt(withdrawalId))
    .limit(1);

  if (!withdrawals || withdrawals.length === 0) {
    return NextResponse.json({ success: false, error: 'Withdrawal not found.' }, { status: 404 });
  }

  const wd = withdrawals[0];

  if (wd.status !== 'pending') {
    return NextResponse.json({
      success: false,
      error: `Withdrawal is already ${wd.status}. Only pending withdrawals can be reviewed.`,
    }, { status: 400 });
  }

  const now = new Date().toISOString();
  const wType = wd.withdrawal_type === 'commission' ? 'commission' : 'profit';

  if (action === 'reject') {
    // Credit back to correct balance
    try {
      if (wType === 'commission') {
        await creditCommissionBalance(wd.user_id, Number(wd.amount));
      } else {
        await creditProfitBalance(wd.user_id, Number(wd.amount));
      }
    } catch (creditErr) {
      console.error('[admin/withdrawals] refund credit failed:', creditErr);
      return NextResponse.json({
        success: false,
        error: 'Failed to refund balance. Please try again.',
      }, { status: 500 });
    }

    await supabase
      .from('withdrawals')
      .update({
        status: 'rejected',
        reviewed_by: adminId,
        reviewed_at: now,
        admin_notes: admin_notes || null,
      })
      .eq('id', wd.id);

    return NextResponse.json({
      success: true,
      message: `Withdrawal rejected. Balance refunded to ${wType} balance.`,
    });
  }

  if (action === 'approve') {
    await supabase
      .from('withdrawals')
      .update({
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: now,
        admin_notes: admin_notes || null,
      })
      .eq('id', wd.id);

    return NextResponse.json({
      success: true,
      message: 'Withdrawal approved. Send crypto manually, then mark as completed.',
    });
  }

  if (action === 'complete') {
    await supabase
      .from('withdrawals')
      .update({
        status: 'completed',
        processed_time: now,
      })
      .eq('id', wd.id);

    return NextResponse.json({
      success: true,
      message: 'Withdrawal marked as completed.',
    });
  }
}
