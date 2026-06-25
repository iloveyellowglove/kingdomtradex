import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  const token = cookies().get('__Host-kingdom_session')?.value;
  if (!token || token.length !== 64) {
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

  // Fetch user's referral code
  const { data: userRows } = await supabase
    .from('users')
    .select('referral_code')
    .eq('id', userId)
    .limit(1);

  const referralCode = (userRows?.[0] as Record<string, unknown>)?.referral_code as string ?? '';

  // Get direct referrals (level 1)
  const { data: directRefs } = await supabase
    .from('users')
    .select('id, username, created_at, status')
    .eq('referred_by', userId);

  const totalReferrals = directRefs?.length ?? 0;
  const activeReferrals = (directRefs ?? []).filter((r: Record<string, unknown>) => r.status === 'active').length;

  // Get commission totals
  const { data: commissions } = await supabase
    .from('referral_commissions')
    .select('amount, status, level, referral_type')
    .eq('user_id', userId);

  const totalCommissionEarned = (commissions ?? [])
    .filter((c: Record<string, unknown>) => c.status === 'credited' || c.status === 'paid')
    .reduce((sum: number, c: Record<string, unknown>) => sum + Number(c.amount ?? 0), 0);

  const pendingCommissions = (commissions ?? [])
    .filter((c: Record<string, unknown>) => c.status === 'pending')
    .reduce((sum: number, c: Record<string, unknown>) => sum + Number(c.amount ?? 0), 0);

  // Per-level breakdown
  const levelBreakdown: { level: number; count: number; earned: number }[] = [];
  for (let level = 1; level <= 5; level++) {
    const levelComms = (commissions ?? []).filter((c: Record<string, unknown>) => c.level === level && (c.status === 'credited' || c.status === 'paid'));
    levelBreakdown.push({
      level,
      count: levelComms.length,
      earned: levelComms.reduce((s: number, c: Record<string, unknown>) => s + Number(c.amount ?? 0), 0),
    });
  }

  // Commission by type
  const depositBonusTotal = (commissions ?? [])
    .filter((c: Record<string, unknown>) => c.referral_type === 'deposit_bonus' && (c.status === 'credited' || c.status === 'paid'))
    .reduce((s: number, c: Record<string, unknown>) => s + Number(c.amount ?? 0), 0);

  const profitShareTotal = (commissions ?? [])
    .filter((c: Record<string, unknown>) => c.referral_type === 'profit_share' && (c.status === 'credited' || c.status === 'paid'))
    .reduce((s: number, c: Record<string, unknown>) => s + Number(c.amount ?? 0), 0);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kingdomtradex.com';
  const referralLink = `${appUrl}/r/${referralCode}`;

  return NextResponse.json({
    success: true,
    referralCode,
    referralLink,
    totalReferrals,
    activeReferrals,
    totalCommissionEarned,
    pendingCommissions,
    depositBonusTotal,
    profitShareTotal,
    levelBreakdown,
  });
}
