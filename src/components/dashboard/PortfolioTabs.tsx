'use client';

import { useState, useEffect } from 'react';

interface LockedDeposit {
  id: string;
  amount: number;
  tier: string;
  lockDays: number;
  dailyRate: number;
  lockedAt: string;
  unlocksAt: string;
  status: string;
  timeRemaining: number;
}

interface ProfitEntry {
  id: number;
  amount: number;
  percentage: number;
  date: string;
  createdAt: string;
}

interface Props {
  userId: number;
}

export default function PortfolioTabs({ userId }: Props) {
  const [tab, setTab] = useState<'holdings' | 'tiers' | 'earnings'>('holdings');
  const [holdings, setHoldings] = useState<LockedDeposit[]>([]);
  const [earnings, setEarnings] = useState<ProfitEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [balRes] = await Promise.all([
          fetch('/api/user/balance'),
        ]);
        const balData = await balRes.json();
        if (balData.success) {
          setHoldings(balData.lockedDeposits ?? []);
        }
        // Fetch profit history from the transactions or profits API
        const res = await fetch('/api/transactions?type=profit&limit=14');
        const data = await res.json();
        if (data.success) {
          setEarnings(data.transactions?.map((t: { id: number; amount: number; description: string; createdAt: string }) => ({
            id: t.id,
            amount: t.amount,
            percentage: 0,
            date: t.createdAt,
            createdAt: t.createdAt,
          })) ?? []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, [userId]);

  function tierColor(t: string): string {
    const m: Record<string, string> = { silver: '#C0C0C0', gold: '#FFD700', platinum: '#E5E4E2', diamond: '#B9F2FF' };
    return m[t] ?? '#FFD700';
  }

  function timeLeft(ms: number): string {
    if (ms <= 0) return 'Matured';
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    return d > 0 ? `${d}d ${h}h` : `${h}h`;
  }

  const tabs = [
    { key: 'holdings' as const, label: 'Holdings' },
    { key: 'tiers' as const, label: 'Active Tiers' },
    { key: 'earnings' as const, label: 'Earnings History' },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-2 rounded-md text-xs font-medium transition"
            style={{
              background: tab === t.key ? 'rgba(255,215,0,0.1)' : 'transparent',
              color: tab === t.key ? '#FFD700' : 'rgba(255,255,255,0.4)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />)}
        </div>
      ) : (
        <>
          {/* Holdings tab */}
          {tab === 'holdings' && (
            holdings.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-8">No active holdings. <a href="/deposit" className="text-[#FFD700]">Deposit now</a>.</p>
            ) : (
              <div className="space-y-2">
                {holdings.map(h => {
                  const earned = h.amount * h.dailyRate * Math.floor((Date.now() - new Date(h.lockedAt).getTime()) / 86400000);
                  const color = tierColor(h.tier);
                  return (
                    <div key={h.id} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: `${color}20`, color }}>{h.tier.toUpperCase()}</span>
                          <span className="text-sm font-bold text-white">${h.amount.toFixed(2)}</span>
                        </div>
                        <span className="text-xs text-white/30">{timeLeft(h.timeRemaining)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/40">{(h.dailyRate * 100).toFixed(1)}% daily · Earned ${earned.toFixed(2)}</span>
                        <div className="w-20 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, ((Date.now() - new Date(h.lockedAt).getTime()) / (h.lockDays * 86400000)) * 100)}%`, background: color }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Tiers tab */}
          {tab === 'tiers' && (
            <div className="space-y-2">
              {[
                { tier: 'silver', label: 'Silver', days: 180, rate: 0.012, color: '#C0C0C0' },
                { tier: 'gold', label: 'Gold', days: 270, rate: 0.015, color: '#FFD700' },
                { tier: 'platinum', label: 'Platinum', days: 360, rate: 0.02, color: '#E5E4E2' },
                { tier: 'diamond', label: 'Diamond', days: 540, rate: 0.03, color: '#B9F2FF' },
              ].map(t => {
                const holds = holdings.filter(h => h.tier === t.tier);
                const totalLocked = holds.reduce((s, h) => s + h.amount, 0);
                const maxPerTier = 100000;
                const pct = Math.min(100, (totalLocked / maxPerTier) * 100);
                return (
                  <div key={t.tier} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-bold" style={{ color: t.color }}>{t.label}</span>
                        <span className="text-xs text-white/30 ml-2">{t.days} days · {(t.rate * 100).toFixed(1)}% daily</span>
                      </div>
                      <span className="text-xs text-white/50">{holds.length} deposit{holds.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: t.color }} />
                      </div>
                      <span className="text-[10px] text-white/40 w-20 text-right tabular-nums">
                        ${totalLocked.toFixed(0)} / ${maxPerTier.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Earnings tab */}
          {tab === 'earnings' && (
            earnings.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-8">No earnings yet. Start depositing to earn daily returns.</p>
            ) : (
              <div className="space-y-1">
                {earnings.map((e, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <span className="text-xs text-white/50">{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span className="text-sm font-bold text-[#4CAF50] tabular-nums">+${e.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
