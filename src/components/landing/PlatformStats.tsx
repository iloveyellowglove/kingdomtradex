'use client';

import { useState, useEffect } from 'react';

interface StatData {
  users: number;
  deposited: number;
  rates: { tier: string; label: string; days: number; dailyRate: number; color: string }[];
}

export default function PlatformStats() {
  const [stats, setStats] = useState<StatData>({
    users: 0,
    deposited: 0,
    rates: [
      { tier: 'silver', label: 'Silver', days: 180, dailyRate: 0.012, color: '#C0C0C0' },
      { tier: 'gold', label: 'Gold', days: 270, dailyRate: 0.018, color: '#F0B90B' },
      { tier: 'platinum', label: 'Platinum', days: 360, dailyRate: 0.024, color: '#E5E4E2' },
      { tier: 'diamond', label: 'Diamond', days: 540, dailyRate: 0.03, color: '#B9F2FF' },
    ],
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (data.success) {
          setStats(prev => ({
            ...prev,
            users: data.users?.total ?? 0,
            deposited: data.deposits?.allTime ?? 0,
          }));
        }
      } catch { /* ignore */ }
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      {/* Platform stats */}
      <div
        className="rounded-xl p-4"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Platform Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-lg font-bold text-white tabular-nums">{stats.users.toLocaleString()}</p>
            <p className="text-[10px] text-white/40">Total Users</p>
          </div>
          <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-lg font-bold text-[#4CAF50] tabular-nums">${stats.deposited >= 1000 ? `${(stats.deposited / 1000).toFixed(0)}k` : stats.deposited.toFixed(0)}</p>
            <p className="text-[10px] text-white/40">Total Deposited</p>
          </div>
        </div>
      </div>

      {/* Active tier rates */}
      <div
        className="rounded-xl p-4"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">Active Tier Rates</h3>
        <div className="space-y-1.5">
          {stats.rates.map(r => (
            <div key={r.tier} className="flex items-center justify-between py-1.5 px-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                <span className="text-xs text-white/70">{r.label}</span>
                <span className="text-[10px] text-white/30">{r.days}d</span>
              </div>
              <span className="text-xs font-bold tabular-nums" style={{ color: r.color }}>{(r.dailyRate * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <a
        href="#signup"
        className="block w-full py-3 rounded-xl text-center text-xs font-bold no-underline transition hover:opacity-90"
        style={{ background: '#FFD700', color: '#000' }}
      >
        Start Earning →
      </a>
    </div>
  );
}
