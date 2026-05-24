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

  const { data: userRows } = await supabase
    .from('users')
    .select('bonus_locked,minimum_deposit_to_unlock,total_deposited_real')
    .eq('id', s[0].user_id)
    .limit(1);

  const bonusLocked = userRows?.[0]?.bonus_locked ?? false;
  const minToUnlock = Number(userRows?.[0]?.minimum_deposit_to_unlock || 100);
  const totalDeposited = Number(userRows?.[0]?.total_deposited_real || 0);

  return (
    <div className="py-4">
      <h2 className="mb-2">Withdrawal History</h2>
      <p className="text-text-muted mb-6">Your withdrawal requests and their status</p>

      {bonusLocked && (
        <div className="alert alert-warning mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{
          border: '1px solid #FFD700',
          background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(106,13,173,0.08))',
        }}>
          <div>
            <strong>Your $50 Kingdom Starter Grant is currently locked.</strong>
            <p className="mb-0 text-sm mt-1">
              Deposit {Math.max(0, minToUnlock - totalDeposited).toFixed(2)} more USDT (minimum $100 total) to unlock withdrawals. Your $50 bonus is already earning yield.
            </p>
          </div>
          <a href="/deposit" className="btn-primary px-6 py-2 rounded-lg text-sm font-bold whitespace-nowrap no-underline">
            Deposit Now
          </a>
        </div>
      )}

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
                    <td className="p-3">{Number(w.amount).toFixed(2)}</td>
                    <td className="p-3">{w.currency}</td>
                    <td className="p-3">{Number(w.fee).toFixed(2)}</td>
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
