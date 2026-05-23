import { createServiceClient } from '@/lib/supabase/service';

type WithdrawalRow = {
  id: number;
  user_id: number;
  amount: number;
  currency: string;
  fee: number;
  status: string;
  request_time: string;
  users?: { username: string; email: string } | { username: string; email: string }[] | null;
};

export default async function AdminWithdrawalsPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('withdrawals')
    .select('*, users!inner(username,email)')
    .order('request_time', { ascending: false })
    .limit(100);

  const withdrawals = (data ?? []) as unknown as WithdrawalRow[];

  function getUserObj(w: WithdrawalRow) {
    if (!w.users) return { username: '#' + w.user_id, email: '' };
    if (Array.isArray(w.users)) return w.users[0] || { username: '#' + w.user_id, email: '' };
    return w.users;
  }

  return (
    <div>
      <h2 className="mb-4">Withdrawals</h2>
      <div className="card">
        <div className="card-body p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">User</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Currency</th>
                <th className="text-left p-3">Fee</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => {
                const u = getUserObj(w);
                return (
                  <tr key={w.id}>
                    <td className="p-3">{w.id}</td>
                    <td className="p-3">{u.username}</td>
                    <td className="p-3">{Number(w.amount).toFixed(6)}</td>
                    <td className="p-3">{w.currency}</td>
                    <td className="p-3">{Number(w.fee).toFixed(8)}</td>
                    <td className="p-3">
                      <span className={`badge ${
                        w.status === 'completed' ? 'badge-success' :
                        w.status === 'pending' ? 'badge-warning' :
                        w.status === 'processing' ? 'badge-info' :
                        w.status === 'rejected' ? 'badge-danger' :
                        'badge-secondary'
                      }`}>{w.status}</span>
                    </td>
                    <td className="p-3"><small>{w.request_time}</small></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
