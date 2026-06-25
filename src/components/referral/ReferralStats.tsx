'use client';

import { useState, useEffect } from 'react';

interface StatsData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  activeReferrals: number;
  totalCommissionEarned: number;
  pendingCommissions: number;
  depositBonusTotal: number;
  profitShareTotal: number;
  levelBreakdown: { level: number; count: number; earned: number }[];
}

export default function ReferralStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/referrals/stats');
        const data = await res.json();
        if (data.success) setStats(data);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  async function copyLink() {
    if (!stats?.referralLink) return;
    try {
      await navigator.clipboard.writeText(stats.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = stats.referralLink;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-kt-hover-bg rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-kt-hover-bg rounded-xl" />)}
        </div>
      </div>
    );
  }

  const maxLevelEarned = Math.max(...(stats?.levelBreakdown.map(l => l.earned) ?? [0]), 1);

  return (
    <div>
      {/* Referral Link */}
      <div
        className="p-4 rounded-xl mb-4"
        style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-kt-text-tertiary uppercase tracking-wider">Your Referral Link</p>
          <span className="text-sm font-bold text-kt-gold">{stats?.referralCode}</span>
        </div>
        <div className="flex gap-2">
          <code
            className="flex-1 px-3 py-2 rounded-lg text-xs text-kt-text-secondary truncate select-all"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {stats?.referralLink}
          </code>
          <button
            onClick={copyLink}
            className="px-4 py-2 rounded-lg text-xs font-bold transition flex-shrink-0"
            style={{
              background: copied ? 'rgba(76,175,80,0.2)' : 'rgba(255,215,0,0.15)',
              color: copied ? '#4CAF50' : '#FFD700',
              minHeight: 44,
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-[10px] text-kt-text-tertiary mt-2">Share this link. When someone signs up, they become your referral.</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(33,150,243,0.06)', border: '1px solid rgba(33,150,243,0.12)' }}>
          <p className="text-xs text-kt-text-tertiary mb-1">Total Referrals</p>
          <p className="text-2xl font-bold text-[#2196F3]">{stats?.totalReferrals ?? 0}</p>
          <p className="text-[10px] text-white/25">{stats?.activeReferrals ?? 0} active</p>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(76,175,80,0.06)', border: '1px solid rgba(76,175,80,0.12)' }}>
          <p className="text-xs text-kt-text-tertiary mb-1">Total Earned</p>
          <p className="text-2xl font-bold text-kt-green">${(stats?.totalCommissionEarned ?? 0).toFixed(2)}</p>
          {stats && stats.pendingCommissions > 0 && (
            <p className="text-[10px] text-kt-gold">${stats.pendingCommissions.toFixed(2)} pending</p>
          )}
        </div>
      </div>

      {/* By type */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <p className="text-[11px] text-white/40">Deposit Bonus</p>
          <p className="text-lg font-bold text-kt-gold">${(stats?.depositBonusTotal ?? 0).toFixed(2)}</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <p className="text-[11px] text-white/40">Profit Share</p>
          <p className="text-lg font-bold text-[#B47CFF]">${(stats?.profitShareTotal ?? 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Level breakdown */}
      <div
        className="p-4 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h4 className="text-sm font-bold text-kt-text-primary mb-3">Per-Level Breakdown</h4>
        {stats?.levelBreakdown.map(l => (
          <div key={l.level} className="mb-2 last:mb-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/50">Level {l.level}</span>
              <span className="text-xs text-white/70">
                {l.count} refs · ${l.earned.toFixed(2)}
              </span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${maxLevelEarned > 0 ? (l.earned / maxLevelEarned) * 100 : 0}%`,
                  background: l.level <= 2
                    ? 'linear-gradient(90deg, #FFD700, #FFA000)'
                    : 'linear-gradient(90deg, #B47CFF, #7C4DFF)',
                }}
              />
            </div>
          </div>
        ))}
        <div className="mt-3 pt-3 border-t border-kt-border text-[10px] text-white/30">
          <span>Rates - Deposit: 3%/1.5%/0.75%/0.5%/0.25% · Profit: 5%/2.5%/1.25%/0.75%/0.5%</span>
        </div>
      </div>
    </div>
  );
}
