import { createServiceClient } from '@/lib/supabase/service';

type DepositRow = {
  id: number;
  user_id: number;
  amount: number;
  currency: string;
  txid: string | null;
  status: string;
  payment_provider: string;
  provider_payment_id: string | null;
  created_at: string;
  users?: { username: string; email: string } | { username: string; email: string }[] | null;
};

export default async function AdminDepositsPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('deposits')
    .select('*, users!inner(username,email)')
    .order('created_at', { ascending: false })
    .limit(100);

  const deposits = (data ?? []) as unknown as DepositRow[];

  function getUserObj(d: DepositRow) {
    if (!d.users) return { username: '#' + d.user_id, email: '' };
    if (Array.isArray(d.users)) return d.users[0] || { username: '#' + d.user_id, email: '' };
    return d.users;
  }

  return (
    <div>
      <h2 className="mb-4">Deposits</h2>
      <div className="card">
        <div className="card-body p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">User</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Currency</th>
                <th className="text-left p-3">Provider</th>
                <th className="text-left p-3">TxID</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => {
                const u = getUserObj(d);
                return (
                  <tr key={d.id}>
                    <td className="p-3">{d.id}</td>
                    <td className="p-3">{u.username}</td>
                    <td className="p-3">{Number(d.amount).toFixed(6)}</td>
                    <td className="p-3">{d.currency}</td>
                    <td className="p-3">
                      <span className={`badge text-xs ${
                        d.payment_provider === 'nowpayments'
                          ? 'badge-success'
                          : 'badge-warning'
                      }`}>
                        {d.payment_provider === 'nowpayments' ? 'NOWPayments' : 'Plisio'}
                      </span>
                    </td>
                    <td className="p-3"><small>{(d.txid || '').substring(0, 16)}...</small></td>
                    <td className="p-3">
                      <span className={`badge ${d.status === 'completed' ? 'badge-success' : d.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="p-3"><small>{d.created_at}</small></td>
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
