'use client';

import { useState, useEffect } from 'react';

interface CommissionRow {
  id: number;
  sourceUserId: number;
  sourceUsername: string;
  level: number;
  percentage: number;
  amount: number;
  sourceAmount: number;
  status: string;
  type: string;
  commissionRate: number;
  createdAt: string;
}

export default function CommissionHistory() {
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (typeFilter) params.set('type', typeFilter);
        if (levelFilter) params.set('level', levelFilter);
        params.set('page', page.toString());
        params.set('limit', '15');

        const res = await fetch(`/api/referrals/commissions?${params}`);
        const data = await res.json();
        if (data.success) {
          setCommissions(data.commissions ?? []);
          setTotalPages(data.totalPages ?? 1);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, [typeFilter, levelFilter, page]);

  function statusColor(s: string) {
    switch (s) {
      case 'credited': return { bg: 'rgba(76,175,80,0.12)', color: '#4CAF50' };
      case 'paid': return { bg: 'rgba(33,150,243,0.12)', color: '#2196F3' };
      case 'pending': return { bg: 'rgba(255,193,7,0.12)', color: '#FFC107' };
      case 'cancelled': return { bg: 'rgba(244,67,54,0.12)', color: '#F44336' };
      default: return { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' };
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: typeFilter ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.04)',
            color: typeFilter ? '#FFD700' : 'rgba(255,255,255,0.5)',
            border: `1px solid ${typeFilter ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.06)'}`,
            minHeight: 32,
          }}
        >
          <option value="" style={{ color: '#000' }}>All Types</option>
          <option value="deposit_bonus" style={{ color: '#000' }}>Deposit Bonus</option>
          <option value="profit_share" style={{ color: '#000' }}>Profit Share</option>
        </select>

        <select
          value={levelFilter}
          onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: levelFilter ? 'rgba(180,124,255,0.1)' : 'rgba(255,255,255,0.04)',
            color: levelFilter ? '#B47CFF' : 'rgba(255,255,255,0.5)',
            border: `1px solid ${levelFilter ? 'rgba(180,124,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
            minHeight: 32,
          }}
        >
          <option value="" style={{ color: '#000' }}>All Levels</option>
          {[1,2,3,4,5].map(l => (
            <option key={l} value={l.toString()} style={{ color: '#000' }}>Level {l}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      ) : commissions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-white/30 text-sm">No commissions yet.</p>
          <p className="text-white/20 text-xs mt-1">Share your referral link to start earning.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {commissions.map(c => {
            const s = statusColor(c.status);
            return (
              <div
                key={c.id}
                className="p-3 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {c.sourceUsername}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                      style={{
                        background: c.type === 'profit_share' ? 'rgba(180,124,255,0.15)' : 'rgba(255,215,0,0.15)',
                        color: c.type === 'profit_share' ? '#B47CFF' : '#FFD700',
                      }}>
                      {c.type === 'profit_share' ? 'Profit' : 'Deposit'}
                    </span>
                    <span className="text-[10px] text-white/30">L{c.level}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium"
                    style={{ background: s.bg, color: s.color }}>
                    {c.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/40">
                    <span>{(c.commissionRate * 100).toFixed(2)}% of ${c.sourceAmount.toFixed(2)}</span>
                  </div>
                  <span className="text-sm font-bold text-[#4CAF50]">
                    +${c.amount.toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-white/20 mt-1">
                  {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded text-xs font-bold transition disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#fff', minHeight: 32 }}
          >
            Prev
          </button>
          <span className="text-xs text-white/40">{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded text-xs font-bold transition disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#fff', minHeight: 32 }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
