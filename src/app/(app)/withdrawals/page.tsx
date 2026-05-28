'use client';

import { useState, useEffect, useRef } from 'react';
import { DEPOSIT_CURRENCIES, coinIconUrl } from '@/lib/currencies';

interface WithdrawalRow {
  id: number;
  amount: number;
  currency: string;
  network: string | null;
  wallet_address: string | null;
  address: string;
  fee: number;
  status: string;
  request_time: string;
  admin_notes: string | null;
  withdrawal_type: string | null;
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length <= 12) return addr || '';
  return addr.slice(0, 6) + '...' + addr.slice(-6);
}

export default function WithdrawalsPage() {
  const [amount, setAmount] = useState('');
  const [currencyId, setCurrencyId] = useState('USDT_TRX');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState<WithdrawalRow[]>([]);
  const [profitBalance, setProfitBalance] = useState(0);
  const [commissionBalance, setCommissionBalance] = useState(0);
  const [withdrawalType, setWithdrawalType] = useState<'profit' | 'commission'>('profit');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const csrfTokenRef = useRef('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/csrf')
      .then((r) => r.json())
      .then((d) => { csrfTokenRef.current = d.csrfToken || ''; })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/withdrawals/history');
        const data = await res.json();
        if (data.success) {
          setHistory(data.withdrawals || []);
          setProfitBalance(data.profitBalance || 0);
          setCommissionBalance(data.commissionBalance || 0);
        }
      } catch {
        // Silently fail
      }
    }
    loadData();
  }, []);

  const selectedCurrency = DEPOSIT_CURRENCIES.find(c => c.id === currencyId) || DEPOSIT_CURRENCIES[0];
  const stablecoins = DEPOSIT_CURRENCIES.filter(c => c.category === 'stablecoin');
  const majors = DEPOSIT_CURRENCIES.filter(c => c.category === 'major');
  const alts = DEPOSIT_CURRENCIES.filter(c => c.category === 'alt');

  const availableBalance = withdrawalType === 'profit' ? profitBalance : commissionBalance;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const res = await fetch('/api/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfTokenRef.current,
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
        currency: currencyId,
        wallet_address: walletAddress,
        withdrawal_type: withdrawalType,
      }),
    });

    const data = await res.json();
    if (data.success) {
      setSuccess('Withdrawal request submitted. You will receive your funds within 24-48 hours after admin review.');
      setAmount('');
      setWalletAddress('');
      try {
        const hRes = await fetch('/api/withdrawals/history');
        const hData = await hRes.json();
        if (hData.success) {
          setHistory(hData.withdrawals || []);
          setProfitBalance(hData.profitBalance || 0);
          setCommissionBalance(hData.commissionBalance || 0);
        }
      } catch { /* ignore */ }
    } else {
      setError(data.error || 'Failed to submit withdrawal request.');
    }
    setLoading(false);
  }

  return (
    <div className="py-4 max-w-2xl mx-auto">
      <h2 className="mb-2">Withdraw Funds</h2>
      <p className="text-text-muted mb-6">Request a withdrawal to your external wallet</p>

      {error && <div className="alert alert-danger mb-4">{error}</div>}
      {success && <div className="alert alert-success mb-4">{success}</div>}

      {/* Balance Type Selector */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setWithdrawalType('profit')}
          className="flex-1 py-3 rounded-lg text-sm font-bold transition-all"
          style={{
            background: withdrawalType === 'profit' ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.03)',
            border: withdrawalType === 'profit' ? '2px solid #4CAF50' : '1px solid rgba(255,255,255,0.06)',
            color: withdrawalType === 'profit' ? '#4CAF50' : 'rgba(255,255,255,0.5)',
          }}
        >
          <div>Profit Balance</div>
          <div className="text-lg mt-1">${profitBalance.toFixed(2)}</div>
        </button>
        <button
          type="button"
          onClick={() => setWithdrawalType('commission')}
          className="flex-1 py-3 rounded-lg text-sm font-bold transition-all"
          style={{
            background: withdrawalType === 'commission' ? 'rgba(180,124,255,0.15)' : 'rgba(255,255,255,0.03)',
            border: withdrawalType === 'commission' ? '2px solid #B47CFF' : '1px solid rgba(255,255,255,0.06)',
            color: withdrawalType === 'commission' ? '#B47CFF' : 'rgba(255,255,255,0.5)',
          }}
        >
          <div>Commission Balance</div>
          <div className="text-lg mt-1">${commissionBalance.toFixed(2)}</div>
        </button>
      </div>

      {/* Withdrawal Request Form */}
      <div className="card mb-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="card-header"><h5 className="mb-0">Request Withdrawal</h5></div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-text-secondary font-medium mb-1">Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="25"
                placeholder="Enter amount"
                className="w-full"
                style={{ borderColor: amount ? '#FFD700' : undefined }}
              />
              <p className="text-xs text-text-muted mt-1">
                Available: <span style={{ color: withdrawalType === 'profit' ? '#4CAF50' : '#B47CFF' }}>${availableBalance.toFixed(2)} USDT</span>
                &nbsp;&middot;&nbsp; Minimum withdrawal: $25.00
              </p>
            </div>

            {/* Currency Dropdown */}
            <div>
              <label className="block text-text-secondary font-medium mb-1">Currency</label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border-light bg-bg-dark text-left hover:border-temple-gold/50 transition"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coinIconUrl(selectedCurrency.iconSlug)}
                    alt=""
                    width={24}
                    height={24}
                    className="rounded-full flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="flex-1">
                    <span className="text-text-primary font-medium">{selectedCurrency.symbol}</span>
                    <span className="text-text-muted text-sm ml-2">{selectedCurrency.name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-white/5 text-text-muted">
                    {selectedCurrency.network}
                  </span>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M1 1l4 4 4-4" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute left-0 right-0 top-full mt-1 border border-white/10 rounded-lg shadow-2xl z-50 max-h-80 overflow-y-auto"
                    style={{ background: '#1a1a2e' }}
                  >
                    {[
                      { label: 'Stablecoins', items: stablecoins },
                      { label: 'Major Coins', items: majors },
                      { label: 'Altcoins', items: alts },
                    ].map(group => (
                      <div key={group.label}>
                        <div className="px-4 py-2 text-xs font-semibold text-white/30 uppercase tracking-wider">
                          {group.label}
                        </div>
                        {group.items.map(currency => (
                          <button
                            key={currency.id}
                            type="button"
                            onClick={() => {
                              setCurrencyId(currency.id);
                              setDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition ${
                              currency.id === currencyId ? 'bg-white/5 text-temple-gold' : 'text-text-primary'
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={coinIconUrl(currency.iconSlug)}
                              alt=""
                              width={22}
                              height={22}
                              className="rounded-full flex-shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            <span className="flex-1 text-sm">{currency.symbol}</span>
                            <span className="text-xs text-text-muted">{currency.name}</span>
                            <span className="px-1.5 py-0.5 rounded text-xs bg-white/5 text-white/40">
                              {currency.network}
                            </span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Wallet Address */}
            <div>
              <label className="block text-text-secondary font-medium mb-1">Wallet Address</label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                required
                minLength={10}
                placeholder="Enter your wallet address"
                className="w-full"
              />
              <p className="text-xs text-text-muted mt-1">
                Make sure this is a valid {selectedCurrency.network} address.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !amount || parseFloat(amount) < 25 || parseFloat(amount) > availableBalance || !walletAddress.trim()}
              className="w-full py-3 rounded-lg text-sm font-bold transition"
              style={{
                background: '#FFD700',
                color: '#000',
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
            </button>
          </form>

          <div className="mt-6 text-xs text-text-muted space-y-1">
            <p>Withdrawals are reviewed within 24-48 hours.</p>
            <p>A network fee may apply depending on the blockchain.</p>
            <p>Ensure your wallet address is correct. Funds sent to wrong addresses cannot be recovered.</p>
          </div>
        </div>
      </div>

      {/* Withdrawal History */}
      <div className="card">
        <div className="card-header"><h5 className="mb-0">Withdrawal History</h5></div>
        <div className="card-body p-0 overflow-x-auto">
          {history.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Currency</th>
                  <th className="text-left p-3">Network</th>
                  <th className="text-left p-3">Address</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((w) => (
                  <tr key={w.id}>
                    <td className="p-3"><small>{w.request_time ? new Date(w.request_time).toLocaleDateString() : ''}</small></td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-xs font-bold" style={{
                        background: w.withdrawal_type === 'commission' ? 'rgba(180,124,255,0.15)' : 'rgba(255,215,0,0.15)',
                        color: w.withdrawal_type === 'commission' ? '#B47CFF' : '#FFD700',
                      }}>
                        {w.withdrawal_type === 'commission' ? 'Commission' : 'Profit'}
                      </span>
                    </td>
                    <td className="p-3">{Number(w.amount).toFixed(2)}</td>
                    <td className="p-3">{w.currency}</td>
                    <td className="p-3"><small>{w.network || ''}</small></td>
                    <td className="p-3">
                      <small title={w.wallet_address || w.address}>
                        {truncateAddress(w.wallet_address || w.address)}
                      </small>
                    </td>
                    <td className="p-3">
                      <span className={`badge ${
                        w.status === 'completed' ? 'badge-success' :
                        w.status === 'approved' ? 'badge-info' :
                        w.status === 'pending' ? 'badge-warning' :
                        w.status === 'processing' ? 'badge-info' :
                        w.status === 'rejected' ? 'badge-danger' :
                        'badge-secondary'
                      }`}>
                        {w.status}
                      </span>
                      {w.status === 'rejected' && w.admin_notes && (
                        <p className="text-xs text-red-400 mt-1 mb-0" title={w.admin_notes}>
                          {w.admin_notes.length > 40 ? w.admin_notes.slice(0, 40) + '...' : w.admin_notes}
                        </p>
                      )}
                    </td>
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
