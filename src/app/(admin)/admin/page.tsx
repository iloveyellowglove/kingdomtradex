import { createServiceClient } from '@/lib/supabase/service';

function fmtDollar(v: number): string {
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function AdminDashboardPage() {
  const supabase = createServiceClient();

  // Stats
  const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });

  const { data: totalDeposited } = await supabase
    .from('users')
    .select('total_deposited_real');

  const sumTotalDeposited = (totalDeposited ?? []).reduce(
    (s: number, u: Record<string, unknown>) => s + Number((u as { total_deposited_real: number }).total_deposited_real || 0),
    0
  );

  const { count: completedDeposits } = await supabase
    .from('deposits')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  const { count: pendingWds } = await supabase
    .from('withdrawals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // KYC queries - column may not exist yet if migration not run
  let pendingKyc: number | null = 0;
  let recentUsers: { username: string; email: string; kyc_status: string; created_at: string }[] = [];
  try {
    const kycResult = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('kyc_status', 'pending');
    pendingKyc = kycResult.count ?? 0;

    const recentResult = await supabase
      .from('users')
      .select('username, email, kyc_status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    recentUsers = (recentResult.data ?? []) as { username: string; email: string; kyc_status: string; created_at: string }[];
  } catch {
    // kyc_status column may not exist yet; continue with defaults
  }

  const cardStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  };

  function kycBadge(status: string | null) {
    const s = status || 'unverified';
    const colors: Record<string, { bg: string; text: string }> = {
      verified: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e' },
      pending: { bg: 'rgba(255,215,0,0.12)', text: '#FFD700' },
      rejected: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444' },
      unverified: { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.5)' },
    };
    const c = colors[s] || colors.unverified;
    return (
      <span
        className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold"
        style={{ background: c.bg, color: c.text }}
      >
        {s}
      </span>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-kt-text-primary mb-4">Overview</h2>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl p-6" style={cardStyle}>
          <p className="text-xs text-kt-text-tertiary uppercase tracking-wider mb-2">Total Users</p>
          <p className="text-2xl font-bold text-kt-text-primary">{(userCount ?? 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl p-6" style={cardStyle}>
          <p className="text-xs text-kt-text-tertiary uppercase tracking-wider mb-2">Total Deposited</p>
          <p className="text-2xl font-bold text-kt-text-primary">{fmtDollar(sumTotalDeposited)}</p>
        </div>
        <div className="rounded-xl p-6" style={cardStyle}>
          <p className="text-xs text-kt-text-tertiary uppercase tracking-wider mb-2">Completed Deposits</p>
          <p className="text-2xl font-bold text-kt-text-primary">{(completedDeposits ?? 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl p-6" style={cardStyle}>
          <p className="text-xs text-kt-text-tertiary uppercase tracking-wider mb-2">Pending Withdrawals</p>
          <p className="text-2xl font-bold text-kt-text-primary">{(pendingWds ?? 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <div className="rounded-xl p-6" style={cardStyle}>
          <h3 className="text-sm font-semibold text-kt-text-primary mb-4">Recent Signups</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-2 pr-3 text-kt-text-tertiary text-xs font-medium">Username</th>
                  <th className="text-left py-2 pr-3 text-kt-text-tertiary text-xs font-medium">Email</th>
                  <th className="text-left py-2 pr-3 text-kt-text-tertiary text-xs font-medium">KYC</th>
                  <th className="text-left py-2 text-kt-text-tertiary text-xs font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {(recentUsers ?? []).map((u: { username: string; email: string; kyc_status: string; created_at: string }, i: number) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2.5 pr-3 text-kt-text-primary text-sm">{u.username}</td>
                    <td className="py-2.5 pr-3 text-kt-text-tertiary text-xs">{u.email || '-'}</td>
                    <td className="py-2.5 pr-3">{kycBadge(u.kyc_status)}</td>
                    <td className="py-2.5 text-kt-text-tertiary text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {(!recentUsers || recentUsers.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-kt-text-tertiary text-sm">No users yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Actions */}
        <div className="rounded-xl p-6" style={cardStyle}>
          <h3 className="text-sm font-semibold text-kt-text-primary mb-4">Pending Actions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div>
                <p className="text-kt-text-primary text-sm font-medium">Pending Withdrawals</p>
                <p className="text-kt-text-tertiary text-xs">Awaiting processing</p>
              </div>
              <span
                className="inline-flex items-center justify-center rounded-full text-sm font-bold"
                style={{
                  width: 36,
                  height: 36,
                  background: pendingWds ? 'rgba(255,111,0,0.15)' : 'rgba(255,255,255,0.05)',
                  color: pendingWds ? '#FF6F00' : 'rgba(255,255,255,0.3)',
                }}
              >
                {pendingWds ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div>
                <p className="text-kt-text-primary text-sm font-medium">Pending KYC Reviews</p>
                <p className="text-kt-text-tertiary text-xs">Identity verification needed</p>
              </div>
              <span
                className="inline-flex items-center justify-center rounded-full text-sm font-bold"
                style={{
                  width: 36,
                  height: 36,
                  background: pendingKyc ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)',
                  color: pendingKyc ? '#FFD700' : 'rgba(255,255,255,0.3)',
                }}
              >
                {pendingKyc ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
