'use client';

import { useEffect, useState } from 'react';

interface DepositLock {
  id: string;
  user_id: number;
  deposit_id: number;
  amount: number;
  tier: string;
  lock_days: number;
  daily_rate: number;
  locked_at: string;
  unlocks_at: string;
  status: string;
}

function daysBetween(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function daysRemaining(unlocksAt: string): number {
  const diff = new Date(unlocksAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function progressPct(lockedAt: string, unlocksAt: string): number {
  const total = daysBetween(lockedAt, unlocksAt);
  if (total <= 0) return 100;
  const elapsed = total - daysRemaining(unlocksAt);
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

function getTierLabel(tier: string): string {
  const map: Record<string, string> = { growth: 'Growth', builder: 'Builder', kingdom: 'Kingdom', legacy: 'Legacy' };
  return map[tier] || tier;
}

function getTierAccent(tier: string): string {
  const map: Record<string, string> = { growth: '#4CAF50', builder: '#2196F3', kingdom: '#FFD700', legacy: '#9C27B0' };
  return map[tier] || '#FFD700';
}

export default function LockedDeposits({ userId }: { userId: number }) {
  const [locks, setLocks] = useState<DepositLock[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/user/balance`);
        const data = await res.json();
        if (data.locks) {
          setLocks(data.locks);
        }
      } catch {
        // silent
      }
      setLoading(false);
    }
    load();
  }, [userId]);

  const activeLocks = locks.filter(l => l.status === 'locked');
  const maturedLocks = locks.filter(l => l.status === 'matured');
  const totalLocked = activeLocks.reduce((s, l) => s + Number(l.amount), 0);

  if (loading) {
    return (
      <div className="rounded-xl p-6 text-center bg-kt-hover-bg border border-kt-border">
        <p className="text-kt-text-tertiary text-sm mb-0">Loading locked deposits...</p>
      </div>
    );
  }

  if (activeLocks.length === 0 && maturedLocks.length === 0) {
    return (
      <div className="rounded-xl p-6 text-center bg-kt-hover-bg border border-kt-border">
        <p className="text-kt-text-tertiary mb-0">No active locks. Make a deposit to start earning.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 rounded-xl transition-colors bg-kt-hover-bg border border-kt-border"
      >
        <div className="flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="font-semibold" style={{ color: '#E2E8F0' }}>Locked Principal</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold" style={{ color: '#FFD700' }}>${totalLocked.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'rgba(255,255,255,0.5)' }}
          >
            <path d="M3 5l3 3 3-3" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {activeLocks.map((lock) => {
            const pct = progressPct(lock.locked_at, lock.unlocks_at);
            const remaining = daysRemaining(lock.unlocks_at);
            const accent = getTierAccent(lock.tier);
            return (
              <div key={lock.id} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}>
                      {getTierLabel(lock.tier)}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: '#E2E8F0' }}>
                      ${Number(lock.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-xs text-kt-text-tertiary">
                    {(Number(lock.daily_rate) * 100).toFixed(2)}% daily
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between text-xs text-kt-text-tertiary mb-2 gap-1">
                  <span>Locked: {new Date(lock.locked_at).toLocaleDateString()}</span>
                  <span>Matures: {new Date(lock.unlocks_at).toLocaleDateString()}</span>
                </div>

                {/* Progress bar */}
                <div className="rounded-full overflow-hidden mb-1" style={{ height: 6, background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
                  }} />
                </div>
                <p className="text-xs text-kt-text-tertiary mb-0">
                  {remaining > 0 ? `${remaining} days remaining` : 'Matured'}
                </p>
              </div>
            );
          })}

          {maturedLocks.length > 0 && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-bold text-kt-text-tertiary mb-2 flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Matured ({maturedLocks.length})
              </p>
              {maturedLocks.map((lock) => (
                <div key={lock.id} className="flex items-center justify-between p-2 rounded text-sm" style={{ background: 'rgba(76,175,80,0.05)' }}>
                  <span className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: `${getTierAccent(lock.tier)}20`, color: getTierAccent(lock.tier) }}>
                      {getTierLabel(lock.tier)}
                    </span>
                    <span style={{ color: '#E2E8F0' }}>${Number(lock.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </span>
                  <span className="text-xs" style={{ color: '#4CAF50' }}>Ready to withdraw</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
