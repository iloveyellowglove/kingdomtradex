import { createServiceClient } from '@/lib/supabase/service';

export default async function AdminDashboardPage() {
  const supabase = createServiceClient();

  const { data: users } = await supabase.from('users').select('id');
  const userCount = users?.length ?? 0;

  const { data: totalDeposited } = await supabase
    .from('users')
    .select('total_deposited_real') as { data: { total_deposited_real: number }[] | null };

  const sumTotalDeposited = (totalDeposited ?? []).reduce((s, u) => s + Number(u.total_deposited_real || 0), 0);

  const { data: completedDeposits } = await supabase
    .from('deposits')
    .select('id')
    .eq('status', 'completed');

  const depositCount = completedDeposits?.length ?? 0;

  const { data: pendingWds } = await supabase
    .from('withdrawals')
    .select('id')
    .eq('status', 'pending');

  const pendingWithdrawals = pendingWds?.length ?? 0;

  return (
    <div>
      <h2 className="mb-6">Admin Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 text-center">
          <h3 className="text-temple-gold text-3xl">{userCount}</h3>
          <p className="text-text-muted">Total Users</p>
        </div>
        <div className="card p-4 text-center">
          <h3 className="text-success text-3xl">{sumTotalDeposited.toFixed(2)}</h3>
          <p className="text-text-muted">Total Deposited (USDT)</p>
        </div>
        <div className="card p-4 text-center">
          <h3 className="text-temple-gold text-3xl">{depositCount}</h3>
          <p className="text-text-muted">Completed Deposits</p>
        </div>
        <div className="card p-4 text-center">
          <h3 className="text-[#FF6F00] text-3xl">{pendingWithdrawals}</h3>
          <p className="text-text-muted">Pending Withdrawals</p>
        </div>
      </div>
    </div>
  );
}
