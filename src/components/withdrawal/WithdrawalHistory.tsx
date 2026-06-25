'use client';

import { useState, useEffect } from 'react';

interface WithdrawalRow {
  id: number;
  amount: number;
  currency: string;
  coin?: string | null;
  network?: string | null;
  wallet_address?: string | null;
  address?: string;
  fee: number;
  forfeit_amount?: number;
  status: string;
  withdrawal_type?: string | null;
  request_time: string;
  failure_reason?: string | null;
}

function truncateAddress(addr: string): string {
  if (!addr || addr.length <= 12) return addr || '';
  return addr.slice(0, 6) + '...' + addr.slice(-6);
}

function statusBadge(status: string): { bg: string; color: string; label: string } {
  switch (status) {
    case 'completed':
      return { bg: 'rgba(76,175,80,0.12)', color: '#4CAF50', label: 'Completed' };
    case 'processing':
      return { bg: 'rgba(33,150,243,0.12)', color: '#2196F3', label: 'Processing' };
    case 'pending':
      return { bg: 'rgba(255,193,7,0.12)', color: '#FFC107', label: 'Pending' };
    case 'rejected':
      return { bg: 'rgba(244,67,54,0.12)', color: '#F44336', label: 'Rejected' };
    case 'failed':
      return { bg: 'rgba(244,67,54,0.12)', color: '#F44336', label: 'Failed' };
    case 'cancelled':
      return { bg: 'rgba(158,158,158,0.12)', color: '#9E9E9E', label: 'Cancelled' };
    default:
      return { bg: 'rgba(158,158,158,0.12)', color: '#9E9E9E', label: status };
  }
}

export default function WithdrawalHistory() {
  const [history, setHistory] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/withdrawals/history');
        const data = await res.json();
        if (data.success) setHistory(data.withdrawals || []);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === 'all'
    ? history
    : history.filter(w => w.withdrawal_type === filter || w.status === filter);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-lg p-4 animate-pulse bg-kt-hover-bg">
            <div className="h-4 w-24 bg-kt-hover-bg rounded mb-2" />
            <div className="h-3 w-32 bg-kt-hover-bg rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All' },
          { key: 'profit', label: 'Profit' },
          { key: 'commission', label: 'Commission' },
          { key: 'principal', label: 'Principal' },
          { key: 'pending', label: 'Pending' },
          { key: 'completed', label: 'Completed' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition"
            style={{
              background: filter === f.key ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)',
              color: filter === f.key ? '#FFD700' : 'rgba(255,255,255,0.5)',
              border: filter === f.key ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.06)',
              minHeight: 32,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-kt-text-tertiary text-sm">No withdrawal history yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(w => {
            const badge = statusBadge(w.status);
            return (
              <div
                key={w.id}
                className="rounded-lg p-4 transition"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{
                        background: w.withdrawal_type === 'commission'
                          ? 'rgba(180,124,255,0.15)'
                          : w.withdrawal_type === 'principal'
                            ? 'rgba(244,67,54,0.15)'
                            : 'rgba(76,175,80,0.15)',
                        color: w.withdrawal_type === 'commission'
                          ? '#B47CFF'
                          : w.withdrawal_type === 'principal'
                            ? '#F44336'
                            : '#4CAF50',
                      }}
                    >
                      {w.withdrawal_type === 'commission' ? 'Commission' : w.withdrawal_type === 'principal' ? 'Principal' : 'Profit'}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ background: badge.bg, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <span className="text-xs text-kt-text-tertiary">
                    {new Date(w.request_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-kt-text-primary font-bold">
                    ${Number(w.amount).toFixed(2)}
                    {w.forfeit_amount && Number(w.forfeit_amount) > 0 && (
                      <span className="text-red-400 text-xs ml-1">(-${Number(w.forfeit_amount).toFixed(2)} fee)</span>
                    )}
                  </span>
                  <span className="text-kt-text-tertiary text-xs">
                    {w.coin || w.currency || 'USDT'} · {truncateAddress(w.wallet_address || w.address || '')}
                  </span>
                </div>

                {w.failure_reason && (
                  <p className="text-xs text-red-400 mt-1.5 pt-1.5 border-t border-white/5">
                    {w.failure_reason}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
