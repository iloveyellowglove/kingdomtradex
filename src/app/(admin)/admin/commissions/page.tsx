import { createServiceClient } from '@/lib/supabase/service';

type CommissionRow = {
  id: number;
  user_id: number;
  source_user_id: number;
  level: number;
  percentage: number;
  amount: number;
  status: string;
  created_at: string;
  users?: { username: string; email: string } | { username: string; email: string }[] | null;
};

export default async function AdminCommissionsPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('referral_commissions')
    .select('*, users!inner(username,email)')
    .order('created_at', { ascending: false })
    .limit(100);

  const commissions = (data ?? []) as unknown as CommissionRow[];

  function getUserObj(c: CommissionRow) {
    if (!c.users) return { username: '#' + c.user_id, email: '' };
    if (Array.isArray(c.users)) return c.users[0] || { username: '#' + c.user_id, email: '' };
    return c.users;
  }

  return (
    <div>
      <h2 className="mb-4">Commissions</h2>
      <div className="card">
        <div className="card-body p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">User</th>
                <th className="text-left p-3">Source</th>
                <th className="text-left p-3">Level</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => {
                const u = getUserObj(c);
                return (
                  <tr key={c.id}>
                    <td className="p-3">{c.id}</td>
                    <td className="p-3">{u.username}</td>
                    <td className="p-3">#{c.source_user_id}</td>
                    <td className="p-3">L{c.level} ({c.percentage}%)</td>
                    <td className="p-3">{Number(c.amount).toFixed(6)}</td>
                    <td className="p-3">
                      <span className={`badge ${c.status === 'paid' ? 'badge-success' : c.status === 'pending' ? 'badge-warning' : 'badge-secondary'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3"><small>{c.created_at}</small></td>
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
