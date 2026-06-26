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

  const cardStyle = {};

  function kycBadge(status: string | null) {
    const s = status || 'unverified';
    const baseClass = 'inline-flex px-2 py-0.5 rounded-full text-xs font-semibold';
    if (s === 'verified') return <span className={`${baseClass} bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400`}>{s}</span>;
    if (s === 'pending') return <span className={`${baseClass} bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400`}>{s}</span>;
    if (s === 'rejected') return <span className={`${baseClass} bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400`}>{s}</span>;
    return <span className={`${baseClass} bg-gray-100 text-gray-500 dark:bg-kt-hover-bg dark:text-kt-text-tertiary`}>{s}</span>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-kt-text-primary mb-4">Overview</h2>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl p-6" className="bg-kt-card-bg border border-kt-card-border rounded-xl shadow-sm">
          <p className="text-xs text-kt-text-tertiary uppercase tracking-wider mb-2">Total Users</p>
          <p className="text-2xl font-bold text-kt-text-primary">{(userCount ?? 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl p-6" className="bg-kt-card-bg border border-kt-card-border rounded-xl shadow-sm">
          <p className="text-xs text-kt-text-tertiary uppercase tracking-wider mb-2">Total Deposited</p>
          <p className="text-2xl font-bold text-kt-text-primary">{fmtDollar(sumTotalDeposited)}</p>
        </div>
        <div className="rounded-xl p-6" className="bg-kt-card-bg border border-kt-card-border rounded-xl shadow-sm">
          <p className="text-xs text-kt-text-tertiary uppercase tracking-wider mb-2">Completed Deposits</p>
          <p className="text-2xl font-bold text-kt-text-primary">{(completedDeposits ?? 0).toLocaleString()}</p>
        </div>
        <div className="rounded-xl p-6" className="bg-kt-card-bg border border-kt-card-border rounded-xl shadow-sm">
          <p className="text-xs text-kt-text-tertiary uppercase tracking-wider mb-2">Pending Withdrawals</p>
          <p className="text-2xl font-bold text-kt-text-primary">{(pendingWds ?? 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <div className="rounded-xl p-6" className="bg-kt-card-bg border border-kt-card-border rounded-xl shadow-sm">
          <h3 className="text-sm font-semibold text-kt-text-primary mb-4">Recent Signups</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-kt-border">
                  <th className="text-left py-2 pr-3 text-kt-text-tertiary text-xs font-medium">Username</th>
                  <th className="text-left py-2 pr-3 text-kt-text-tertiary text-xs font-medium">Email</th>
                  <th className="text-left py-2 pr-3 text-kt-text-tertiary text-xs font-medium">KYC</th>
                  <th className="text-left py-2 text-kt-text-tertiary text-xs font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {(recentUsers ?? []).map((u: { username: string; email: string; kyc_status: string; created_at: string }, i: number) => (
                  <tr key={i} className="border-b border-kt-border">
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
        <div className="rounded-xl p-6" className="bg-kt-card-bg border border-kt-card-border rounded-xl shadow-sm">
          <h3 className="text-sm font-semibold text-kt-text-primary mb-4">Pending Actions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-kt-hover-bg">
              <div>
                <p className="text-kt-text-primary text-sm font-medium">Pending Withdrawals</p>
                <p className="text-kt-text-tertiary text-xs">Awaiting processing</p>
              </div>
              <span
                className="inline-flex items-center justify-center rounded-full text-sm font-bold"
                style={{
                  width: 36,
                  height: 36,
                  background: pendingWds ? 'var(--kt-active-bg)' : 'var(--kt-hover-bg)',
                  color: pendingWds ? '#FF6F00' : 'var(--kt-text-tertiary)',
                }}
              >
                {pendingWds ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-kt-hover-bg">
              <div>
                <p className="text-kt-text-primary text-sm font-medium">Pending KYC Reviews</p>
                <p className="text-kt-text-tertiary text-xs">Identity verification needed</p>
              </div>
              <span
                className="inline-flex items-center justify-center rounded-full text-sm font-bold"
                style={{
                  width: 36,
                  height: 36,
                  background: pendingKyc ? 'var(--kt-active-bg)' : 'var(--kt-hover-bg)',
                  color: pendingKyc ? '#FFD700' : 'var(--kt-text-tertiary)',
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
