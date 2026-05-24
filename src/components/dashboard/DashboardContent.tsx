'use client';

import { useState } from 'react';
import type { User, DownlineCounts, WithdrawalLock, Deposit, ReferralCommission } from '@/lib/types';
import CrossBackground from '@/components/brand/CrossBackground';

interface DashboardProps {
  user: User;
  downlineCounts: DownlineCounts;
  deposits: Deposit[];
  commissions: ReferralCommission[];
  withdrawalLock: WithdrawalLock | null;
  totalPaidComm: number;
  totalPendingComm: number;
  depositAddresses: Record<string, string> | null;
  depositAddressError: string | null;
}

export default function DashboardContent({
  user,
  downlineCounts,
  deposits,
  commissions,
  withdrawalLock,
  totalPaidComm,
  totalPendingComm,
  depositAddresses,
  depositAddressError,
}: DashboardProps) {
  const directDisciples = downlineCounts.level_1;
  const totalDisciples = Object.values(downlineCounts).reduce((a, b) => a + b, 0);

  let rank = '';
  let rankClass = '';
  if (directDisciples >= 20 && totalDisciples >= 200) {
    rank = 'Apostle';
    rankClass = 'rank-apostle';
  } else if (directDisciples >= 10 && totalDisciples >= 50) {
    rank = 'Prophet';
    rankClass = 'rank-prophet';
  } else if (directDisciples >= 5) {
    rank = 'Elder';
    rankClass = 'rank-elder';
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kingdomtradex.vercel.app';

  return (
    <div className="relative">
      <CrossBackground opacity={0.03} />
      <div className="relative z-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between mb-6">
        <div>
          <h2>Welcome, {user.username}!</h2>
          <p className="text-text-muted">Faithful stewardship multiplies God&apos;s resources</p>
        </div>
        <div className="text-left md:text-right mt-2 md:mt-0">
          <small className="text-text-muted">Disciple Code: <strong className="text-text-primary">{user.referral_code}</strong></small><br />
          <small>Your Disciple Invitation Link: <code>{appUrl}/register?ref={user.referral_code}</code></small>
        </div>
      </div>

      {/* Stewardship Callout */}
      <div className="stewardship-callout">
        <h5>God&apos;s Economics</h5>
        <p className="text-text-secondary mb-0">You are a steward, not an owner. Trade wisely. &quot;His lord said unto him, Well done, thou good and faithful servant: thou hast been faithful over a few things, I will make thee ruler over many things.&quot; (Matthew 25:21)</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card border-l-4 border-l-temple-gold">
          <div className="card-body text-center">
            <h6 className="text-text-muted">Display Balance</h6>
            <h3 className="text-temple-gold">{Number(user.display_balance).toFixed(8)} <small className="text-sm">USDT</small></h3>
            <small className="text-text-muted">Includes profits & blessings</small>
          </div>
        </div>
        <div className="card border-l-4 border-l-royal-purple">
          <div className="card-body text-center">
            <h6 className="text-text-muted">Total Deposited</h6>
            <h3 className="text-success">{Number(user.total_deposited_real).toFixed(8)} <small className="text-sm">USDT</small></h3>
            <small className="text-text-muted">Real deposit total</small>
          </div>
        </div>
        <div className="card border-l-4 border-l-[#FF6F00]">
          <div className="card-body text-center">
            <h6 className="text-text-muted">Total Withdrawn</h6>
            <h3 className="text-temple-gold">{Number(user.total_withdrawn_real).toFixed(8)} <small className="text-sm">USDT</small></h3>
            <small className="text-text-muted">Net: {(Number(user.total_deposited_real) - Number(user.total_withdrawn_real)).toFixed(8)}</small>
          </div>
        </div>
      </div>

      {/* Covenant Economy Report */}
      {(user.role === 'pastor' || user.role === 'admin' || directDisciples > 0) && (
        <div className="kingdom-card card mb-6">
          <div className="card-header"><h5 className="mb-0">Your Covenant Economy Report</h5></div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 text-center gap-4">
              <div>
                <h4 className="text-success">{totalPaidComm.toFixed(2)} USDT</h4>
                <small className="text-text-muted">Total Blessings Earned (Paid)</small>
              </div>
              <div>
                <h4 className="text-temple-gold">{directDisciples}</h4>
                <small className="text-text-muted">Direct Disciples</small>
              </div>
              <div>
                <h4 className="text-temple-gold">{totalDisciples}</h4>
                <small className="text-text-muted">Total Disciples (All Levels)</small>
              </div>
              <div>
                {rank ? (
                  <><h4 className={rankClass}>{rank}</h4><small className="text-text-muted">Covenant Rank</small></>
                ) : (
                  <><h4 className="text-text-muted">-</h4><small className="text-text-muted">Covenant Rank (need 5+ direct disciples)</small></>
                )}
              </div>
            </div>
            {(rank === 'Apostle' || rank === 'Prophet') && (
              <div className="alert alert-success mt-4 mb-0">
                <strong>Testimony:</strong> Pastor J. received $12,000 in blessings last month by bringing 50 families into the Kingdom.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Withdrawal Lock Warning */}
      {withdrawalLock && (
        <WithdrawalLockBanner lock={withdrawalLock} />
      )}

      {/* Pending Withdrawal Alert */}
      {Number(user.pending_withdrawal_amount) > 0 && (
        <div className="alert alert-info">
          Pending withdrawal: <strong>{Number(user.pending_withdrawal_amount).toFixed(8)} USDT</strong> (processing in 72 hours after request)
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column: Withdrawal + Deposit */}
        <div>
          {/* Withdrawal Form */}
          <WithdrawalForm />

          {/* Deposit Info */}
          <div className="card mb-6">
            <div className="card-header"><h5 className="mb-0">Deposit Funds</h5></div>
            <div className="card-body">
              <div className="alert alert-secondary mb-3">
                <strong>Deposit Instructions:</strong> Send funds to the address below, then contact admin with your transaction ID to confirm.
              </div>
              {depositAddresses ? (
                Object.entries(depositAddresses).map(([currency, addr]) => (
                  <div key={currency} className="mb-3">
                    <p className="font-medium text-text-primary">{currency} Address:</p>
                    <code className="block p-3 rounded-lg break-all">{addr}</code>
                  </div>
                ))
              ) : depositAddressError ? (
                <div className="alert alert-warning">{depositAddressError}</div>
              ) : (
                <div className="alert alert-info">Deposit addresses are generated on demand. Please contact admin to set up your deposit addresses.</div>
              )}
              <p className="mt-3 mb-0"><small className="text-text-muted">After sending, contact admin with your transaction ID to confirm the deposit.</small></p>
            </div>
          </div>
        </div>

        {/* Right column: Disciples + Activity */}
        <div>
          {/* Disciples Network */}
          <div className="card mb-6 kingdom-card">
            <div className="card-header flex justify-between items-center">
              <h5 className="mb-0">Disciples Network</h5>
              <a href="/referral-tree" className="text-sm border border-temple-gold text-temple-gold px-3 py-1 rounded-lg hover:bg-temple-gold hover:text-bg-dark transition">View Disciples Tree</a>
            </div>
            <div className="card-body">
              <table className="w-full text-sm">
                <thead>
                  <tr><th className="text-left p-2">Level</th><th className="text-left p-2">Blessing %</th><th className="text-left p-2">Disciples</th></tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <tr key={lvl}>
                      <td className="p-2">Level {lvl}</td>
                      <td className="p-2">{lvl === 1 ? '15' : lvl === 2 ? '5' : lvl === 3 ? '3' : lvl === 4 ? '2' : '1'}%</td>
                      <td className="p-2">{downlineCounts[`level_${lvl}` as keyof DownlineCounts]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4">
                <strong>Blessings Earned:</strong>{' '}
                <span className="text-success">{totalPaidComm.toFixed(8)} USDT (paid)</span>{' '}
                <span className="text-temple-gold">{totalPendingComm.toFixed(8)} USDT (pending)</span>
              </div>
            </div>
          </div>

          {/* Recent Deposits */}
          <div className="card mb-6">
            <div className="card-header"><h5 className="mb-0">Recent Deposits</h5></div>
            <div className="card-body p-0">
              {deposits.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr><th className="text-left p-3">TxID</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Status</th><th className="text-left p-3">Date</th></tr>
                  </thead>
                  <tbody>
                    {deposits.map((d) => (
                      <tr key={d.id}>
                        <td className="p-3"><small>{(d.txid || '').substring(0, 12)}...</small></td>
                        <td className="p-3">{Number(d.amount).toFixed(6)} {d.currency}</td>
                        <td className="p-3"><span className={`badge ${d.status === 'completed' ? 'badge-success' : d.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>{d.status}</span></td>
                        <td className="p-3"><small>{d.created_at}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-4 text-text-muted mb-0">No deposits yet.</p>
              )}
            </div>
          </div>

          {/* Recent Blessings */}
          <div className="card mb-6">
            <div className="card-header"><h5 className="mb-0">Recent Blessings</h5></div>
            <div className="card-body p-0">
              {commissions.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr><th className="text-left p-3">From</th><th className="text-left p-3">Level</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Status</th></tr>
                  </thead>
                  <tbody>
                    {commissions.map((c) => (
                      <tr key={c.id}>
                        <td className="p-3">Disciple #{c.source_user_id}</td>
                        <td className="p-3">L{c.level} ({c.percentage}%)</td>
                        <td className="p-3">{Number(c.amount).toFixed(6)}</td>
                        <td className="p-3"><span className={`badge ${c.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-4 text-text-muted mb-0">No blessings yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function WithdrawalLockBanner({ lock }: { lock: WithdrawalLock }) {
  const expiry = new Date(lock.lock_expiry_time);
  const now = new Date();
  const remaining = expiry.getTime() - now.getTime();

  return (
    <div className="alert alert-warning">
      <strong>Security Hold:</strong> Withdrawals available after {expiry.toLocaleString()}{' '}
      ({remaining > 0
        ? `${Math.floor(remaining / 3600000)} hours, ${Math.floor((remaining % 3600000) / 60000)} minutes remaining`
        : 'Expired - you can now withdraw'})
    </div>
  );
}

function WithdrawalForm() {
  const [currency, setCurrency] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const csrfToken = document.cookie.split('; ').find((r) => r.startsWith('csrf_guest='))?.split('=')[1] || '';
    const res = await fetch('/api/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify({ currency, amount: parseFloat(amount), address }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage(`Withdrawal request submitted. Eligible after: ${data.eligible_time}`);
      setAmount('');
      setAddress('');
    } else {
      setError(data.error || 'Withdrawal failed.');
    }
    setLoading(false);
  }

  return (
    <div className="card mb-6 kingdom-card">
      <div className="card-header"><h5 className="mb-0">Request Withdrawal</h5></div>
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-text-secondary font-medium mb-1">Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full">
              <option value="USDT">USDT</option>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
            </select>
          </div>
          <div>
            <label className="block text-text-secondary font-medium mb-1">Amount</label>
            <div className="flex">
              <input type="number" step="0.00000001" value={amount} onChange={(e) => setAmount(e.target.value)} required min="0.00000001" className="flex-1 rounded-r-none" />
              <span className="bg-border border border-border-light text-text-secondary px-4 flex items-center rounded-r-lg">USDT</span>
            </div>
            <small className="text-text-muted">Fee: 0.5%</small>
          </div>
          <div>
            <label className="block text-text-secondary font-medium mb-1">Destination Address</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required className="w-full" placeholder="Crypto wallet address" />
          </div>
          <div className="alert alert-light text-sm">
            Remember the widow&apos;s mite - withdraw only what you need.
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-lg">
            {loading ? 'Submitting...' : 'Request Withdrawal'}
          </button>
        </form>
      </div>
    </div>
  );
}
