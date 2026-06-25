import { createServiceClient } from '@/lib/supabase/service';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pastors Directory - KingdomTrade',
  description: 'Meet the faith leaders building wealth with KingdomTrade.',
};

interface PastorEntry {
  id: number;
  username: string;
  created_at: string;
  flock_size: number;
  flock_earnings: number;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function roundToNearestTen(n: number): number {
  return Math.round(n / 10) * 10;
}

export default async function PastorsPage() {
  const supabase = createServiceClient();

  // Fetch all active pastors
  const { data: pastors } = await supabase
    .from('users')
    .select('id, username, created_at')
    .eq('role', 'pastor')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (!pastors) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400">No pastors found.</p>
      </main>
    );
  }

  // For each pastor, calculate flock size and earnings
  const pastorEntries: PastorEntry[] = [];

  for (const pastor of pastors) {
    // Count referred users who have deposited (level 1 only - direct referrals)
    const { count: flockSize } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('referred_by', pastor.id)
      .gt('total_deposited_real', 0);

    // Sum commissions earned from downline
    const { data: commissions } = await supabase
      .from('referral_commissions')
      .select('amount')
      .eq('user_id', pastor.id)
      .eq('status', 'paid');

    const totalEarnings = commissions?.reduce((sum: number, c: Record<string, unknown>) => sum + Number(c.amount), 0) || 0;

    pastorEntries.push({
      id: pastor.id,
      username: pastor.username,
      created_at: pastor.created_at,
      flock_size: flockSize || 0,
      flock_earnings: roundToNearestTen(totalEarnings),
    });
  }

  // Sort by flock size descending
  pastorEntries.sort((a, b) => b.flock_size - a.flock_size);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Pastors Directory</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Faith leaders who are building wealth with KingdomTrade and guiding their congregations toward financial freedom.
          </p>
        </div>

        {pastorEntries.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">No pastors have joined yet. Be the first.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pastorEntries.map((pastor) => (
              <div
                key={pastor.id}
                className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-emerald-600/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">{pastor.username}</h2>
                  <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded-full">
                    Joined {formatDate(pastor.created_at)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{pastor.flock_size}</p>
                    <p className="text-xs text-slate-400 mt-1">Flock Size</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-amber-400">~${pastor.flock_earnings}</p>
                    <p className="text-xs text-slate-400 mt-1">Flock Earnings</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-slate-500 text-sm">
            Are you a pastor?{' '}
            <a href="/register" className="text-emerald-400 hover:text-emerald-300 underline">
              Join KingdomTrade today
            </a>{' '}
            and grow your flock&apos;s wealth.
          </p>
        </div>
      </div>
    </main>
  );
}
