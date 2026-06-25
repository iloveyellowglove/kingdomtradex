import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
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

  // Check if user has ever deposited
  const { data: userRow } = await supabase
    .from('users')
    .select('first_deposit_time')
    .eq('id', userId)
    .single();

  if (!userRow?.first_deposit_time) {
    return NextResponse.json({
      success: true,
      can_withdraw: false,
      reason: 'You must make a deposit before withdrawing.',
      has_completed_withdrawal: false,
      last_withdrawal_verified: false,
      has_generic_share: false,
    });
  }

  // Check for completed withdrawals
  const { data: completedWds } = await supabase
    .from('withdrawals')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('id', { ascending: false })
    .limit(1);

  const hasCompletedWithdrawal = completedWds && completedWds.length > 0;

  let lastWithdrawalVerified = false;
  if (hasCompletedWithdrawal) {
    const lastCompletedId = completedWds[0].id;
    const { data: verifications } = await supabase
      .from('share_verifications')
      .select('id')
      .eq('user_id', userId)
      .eq('withdrawal_id', lastCompletedId)
      .limit(1);

    lastWithdrawalVerified = !!(verifications && verifications.length > 0);
  }

  // Check for generic share
  const { data: genericShare } = await supabase
    .from('social_shares')
    .select('id')
    .eq('user_id', userId)
    .is('testimony_id', null)
    .limit(1);

  const hasGenericShare = genericShare && genericShare.length > 0;

  let canWithdraw = false;
  let reason = '';

  if (hasCompletedWithdrawal) {
    if (lastWithdrawalVerified) {
      canWithdraw = true;
    } else {
      reason = 'You must share your last withdrawal testimony before requesting a new withdrawal.';
    }
  } else {
    if (hasGenericShare) {
      canWithdraw = true;
    } else {
      reason = 'You must share your referral link before your first withdrawal.';
    }
  }

  return NextResponse.json({
    success: true,
    can_withdraw: canWithdraw,
    reason,
    has_completed_withdrawal: hasCompletedWithdrawal,
    last_withdrawal_verified: lastWithdrawalVerified,
    has_generic_share: hasGenericShare,
  });
}
