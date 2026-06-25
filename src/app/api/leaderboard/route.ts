import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  // Leaderboard is semi-public: authenticated users see their own rank; unauthenticated see top list
  const supabase = createServiceClient();

  // Try to refresh the cache (non-blocking — cache write happens via cron)
  // Fetch from leaderboard_cache, fallback to live query
  const { data: cached } = await supabase
    .from('leaderboard_cache')
    .select('*')
    .order('rank_earnings', { ascending: true })
    .limit(50);

  let earners: Array<{
    userId: number;
    displayName: string;
    totalEarned: number;
    totalReferrals: number;
    rank: number;
  }> = [];
  let referrers: typeof earners = [];

  if (cached && cached.length > 0) {
    earners = (cached as unknown as Array<Record<string, unknown>>)
      .sort((a, b) => (a.rank_earnings as number) - (b.rank_earnings as number))
      .map((r, i) => ({
        userId: r.user_id as number,
        displayName: r.display_name as string,
        totalEarned: Number(r.total_earned ?? 0),
        totalReferrals: Number(r.total_referrals ?? 0),
        rank: i + 1,
      }));

    referrers = (cached as unknown as Array<Record<string, unknown>>)
      .sort((a, b) => Number(b.total_referrals ?? 0) - Number(a.total_referrals ?? 0))
      .map((r, i) => ({
        userId: r.user_id as number,
        displayName: r.display_name as string,
        totalEarned: Number(r.total_earned ?? 0),
        totalReferrals: Number(r.total_referrals ?? 0),
        rank: i + 1,
      }));
  } else {
    // Live fallback
    const { data: users } = await supabase
      .from('users')
      .select('id, username, profit_balance, commission_balance')
      .eq('status', 'active')
      .order('profit_balance', { ascending: false })
      .limit(50);

    const enriched = await Promise.all((users ?? []).map(async (u: Record<string, unknown>) => {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', u.id);
      return {
        userId: u.id as number,
        displayName: anonymize(u.username as string),
        totalEarned: Number(u.profit_balance ?? 0) + Number(u.commission_balance ?? 0),
        totalReferrals: count ?? 0,
      };
    }));

    earners = enriched
      .sort((a, b) => b.totalEarned - a.totalEarned)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    referrers = [...enriched]
      .sort((a, b) => b.totalReferrals - a.totalReferrals)
      .map((e, i) => ({ ...e, rank: i + 1 }));
  }

  // Check if current user is logged in — find their rank
  let currentUserRank: { earnings: number | null; referrals: number | null } = { earnings: null, referrals: null };
  const token = cookies().get('__Host-kingdom_session')?.value;
  if (token && token.length === 64) {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('session_token', token)
      .limit(1);
    if (sessions && sessions.length > 0) {
      const uid = sessions[0].user_id;
      const earningsIdx = earners.findIndex(e => e.userId === uid);
      const referralsIdx = referrers.findIndex(r => r.userId === uid);
      currentUserRank = {
        earnings: earningsIdx >= 0 ? earningsIdx + 1 : null,
        referrals: referralsIdx >= 0 ? referralsIdx + 1 : null,
      };
    }
  }

  return NextResponse.json({
    success: true,
    earners,
    referrers,
    currentUserRank,
  });
}

function anonymize(name: string): string {
  if (!name || !name.trim()) return 'User';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return parts[0] + ' ' + parts[parts.length - 1][0] + '.';
  return parts[0].length > 2 ? parts[0].slice(0, 1) + '***' : parts[0];
}
