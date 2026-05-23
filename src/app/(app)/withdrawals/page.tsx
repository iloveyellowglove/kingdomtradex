import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';

export default async function WithdrawalsPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('kingdom_session')?.value;
  if (!token) redirect('/login');

  const supabase = createServiceClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id')
    .eq('session_token', token)
    .limit(1);

  const s = (sessions ?? []) as unknown as { user_id: number }[];
  if (s.length === 0) redirect('/login');

  const { data: withdrawals } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('user_id', s[0].user_id)
    .order('request_time', { ascending: false })
    .limit(50);

  const wData = (withdrawals ?? []) as unknown as Array<{
    id: number; amount: number; currency: string; fee: number; status: string; request_time: string;
  }>;

  return (
    <div className="py-4">
      <h2 className="mb-2">Withdrawal History</h2>
      <p className="text-text-muted mb-6">Your withdrawal requests and their status</p>

      <div className="card">
        <div className="card-body p-0">
          {wData.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Currency</th>
                  <th className="text-left p-3">Fee</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {wData.map((w) => (
                  <tr key={w.id}>
                    <td className="p-3">#{w.id}</td>
                    <td className="p-3">{Number(w.amount).toFixed(8)}</td>
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
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-6 text-text-muted text-center mb-0">No withdrawal history yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
