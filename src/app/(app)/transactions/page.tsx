'use client';

import { useState, useEffect, useCallback } from 'react';

interface Transaction {
  id: string;
  type: string;
  subtype: string;
  amount: number;
  currency: string;
  status: string;
  txHash: string | null;
  description: string;
  createdAt: string;
}

const TYPE_OPTIONS = [
  { key: '', label: 'All' },
  { key: 'deposit', label: 'Deposits' },
  { key: 'withdrawal', label: 'Withdrawals' },
  { key: 'commission', label: 'Commissions' },
  { key: 'profit', label: 'Profits' },
];

export default function TransactionsPage() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      if (search) params.set('search', search);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      params.set('page', page.toString());
      params.set('limit', '25');
      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json();
      if (data.success) {
        setTxns(data.transactions ?? []);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [type, search, from, to, page]);

  useEffect(() => { load(); }, [load]);

  function exportCsv() {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    params.set('export', '1');
    window.open(`/api/transactions?${params}`, '_blank');
  }

  function typeColor(t: string) {
    switch (t) {
      case 'deposit': return { bg: 'rgba(76,175,80,0.12)', color: '#4CAF50' };
      case 'withdrawal': return { bg: 'rgba(244,67,54,0.12)', color: '#F44336' };
      case 'commission': return { bg: 'rgba(180,124,255,0.12)', color: '#B47CFF' };
      case 'profit': return { bg: 'rgba(33,150,243,0.12)', color: '#2196F3' };
      default: return { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' };
    }
  }

  function statusColor(s: string) {
    switch (s) {
      case 'completed': case 'credited': case 'paid': return { bg: 'rgba(76,175,80,0.12)', color: '#4CAF50' };
      case 'pending': return { bg: 'rgba(255,193,7,0.12)', color: '#FFC107' };
      case 'processing': return { bg: 'rgba(33,150,243,0.12)', color: '#2196F3' };
      case 'failed': case 'rejected': case 'cancelled': return { bg: 'rgba(244,67,54,0.12)', color: '#F44336' };
      default: return { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' };
    }
  }

  function truncateHash(hash: string | null): string {
    if (!hash) return '';
    if (hash.length <= 12) return hash;
    return hash.slice(0, 6) + '...' + hash.slice(-4);
  }

  return (
    <div className="py-4 max-w-2xl mx-auto px-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold text-white">Transactions</h2>
        <button
          onClick={exportCsv}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.06)', minHeight: 36 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </button>
      </div>
      <p className="text-sm text-white/40 mb-4">Deposits, withdrawals, commissions, and profit credits</p>

      {/* Filters */}
      <div className="space-y-3 mb-6">
        {/* Type chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TYPE_OPTIONS.map(t => (
            <button
              key={t.key}
              onClick={() => { setType(t.key); setPage(1); }}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition flex-shrink-0"
              style={{
                background: type === t.key ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)',
                color: type === t.key ? '#FFD700' : 'rgba(255,255,255,0.5)',
                border: `1px solid ${type === t.key ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.06)'}`,
                minHeight: 32,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + date range */}
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search tx hash..."
            className="flex-1 min-w-[120px] px-3 py-2 rounded-lg text-xs text-white"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minHeight: 40 }}
          />
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg text-xs text-white flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minHeight: 40, colorScheme: 'dark', width: 130 }}
          />
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg text-xs text-white flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minHeight: 40, colorScheme: 'dark', width: 130 }}
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
      ) : txns.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/30 text-sm">No transactions found.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {txns.map(t => {
            const tc = typeColor(t.type);
            const sc = statusColor(t.status);
            return (
              <div
                key={t.id}
                className="p-4 rounded-lg transition"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                      style={{ background: tc.bg, color: tc.color }}
                    >
                      {t.type}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: sc.bg, color: sc.color }}
                    >
                      {t.status}
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${
                    t.type === 'withdrawal' ? 'text-red-400' : 'text-[#4CAF50]'
                  }`}>
                    {t.type === 'withdrawal' ? '-' : '+'}${t.amount.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-white/50 mb-1">{t.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/25">
                    {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {t.txHash && (
                    <span
                      className="text-[10px] text-white/30 font-mono cursor-pointer hover:text-white/50"
                      onClick={() => navigator.clipboard?.writeText(t.txHash!)}
                      title="Click to copy"
                    >
                      {truncateHash(t.txHash)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-3 py-1.5 rounded text-xs font-bold transition disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#fff', minHeight: 32 }}>
            Prev
          </button>
          <span className="text-xs text-white/40">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-3 py-1.5 rounded text-xs font-bold transition disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#fff', minHeight: 32 }}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
