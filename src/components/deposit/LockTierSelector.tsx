'use client';

import { useState, useEffect, useCallback } from 'react';

export interface TierConfig {
  tier: string;
  label: string;
  lock_days: number;
  daily_rate: number;
  description: string;
  sort_order: number;
}

const TIERS: TierConfig[] = [
  { tier: 'growth',  label: 'Growth',  lock_days: 60,  daily_rate: 0.010000, description: '60-day lock period',  sort_order: 1 },
  { tier: 'builder', label: 'Builder', lock_days: 90,  daily_rate: 0.012000, description: '90-day lock period',  sort_order: 2 },
  { tier: 'kingdom', label: 'Kingdom', lock_days: 120, daily_rate: 0.014000, description: '120-day lock period', sort_order: 3 },
  { tier: 'legacy',  label: 'Legacy',  lock_days: 180, daily_rate: 0.018000, description: '180-day lock period', sort_order: 4 },
];

function totalReturnPct(lockDays: number, dailyRate: number): string {
  return (lockDays * dailyRate * 100).toFixed(0);
}

function getBadge(tier: string): string | null {
  if (tier === 'kingdom') return 'POPULAR';
  if (tier === 'legacy') return 'BEST VALUE';
  return null;
}

interface Props {
  amount: number;
  selectedTier: string | null;
  onSelect: (tier: TierConfig) => void;
}

export default function LockTierSelector({ selectedTier, onSelect }: Props) {
  const [pulseTier, setPulseTier] = useState<string | null>(null);

  const handleSelect = useCallback((tier: TierConfig) => {
    onSelect(tier);
    setPulseTier(tier.tier);
  }, [onSelect]);

  useEffect(() => {
    if (pulseTier) {
      const t = setTimeout(() => setPulseTier(null), 200);
      return () => clearTimeout(t);
    }
  }, [pulseTier]);

  return (
    <div className="space-y-3">
      <label className="block text-text-secondary font-medium mb-1">Lock Tier</label>
      <p className="text-xs text-text-muted -mt-1 mb-3">
        Select a lock period for your deposit. Longer locks earn higher daily returns.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TIERS.map((tier) => {
          const selected = selectedTier === tier.tier;
          const pulsing = pulseTier === tier.tier;
          const badge = getBadge(tier.tier);
          const ratePct = (tier.daily_rate * 100).toFixed(2);

          return (
            <button
              key={tier.tier}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => handleSelect(tier)}
              className={[
                'relative text-left py-5 px-4 rounded-xl transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 focus:ring-offset-2 focus:ring-offset-[#0e0b1a]',
              ].join(' ')}
              style={{
                background: selected
                  ? 'rgba(255,215,0,0.05)'
                  : 'rgba(255,255,255,0.03)',
                border: selected
                  ? '1px solid #FFD700'
                  : '1px solid rgba(255,255,255,0.08)',
                boxShadow: selected
                  ? '0 0 20px rgba(255,215,0,0.10)'
                  : 'none',
                transform: pulsing ? 'scale(1.02)' : 'scale(1.0)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!selected) {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!selected) {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }
              }}
            >
              {/* Badge */}
              {badge && (
                <span
                  className="absolute top-3 left-3 text-xs font-medium rounded-full px-2 py-0.5"
                  style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700' }}
                >
                  {badge}
                </span>
              )}

              {/* Selected checkmark */}
              {selected && (
                <span className="absolute top-3 right-3" style={{ color: '#FFD700' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}

              {/* Tier label */}
              <div
                className="text-base font-semibold mb-1"
                style={{ color: selected ? '#FFD700' : '#ffffff' }}
              >
                {tier.label}
              </div>

              {/* Lock period */}
              <div className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {tier.lock_days} days
              </div>

              {/* Daily rate — hero number */}
              <div className="flex items-baseline gap-1">
                <span
                  className="text-xl md:text-2xl font-bold"
                  style={{ color: '#FFD700' }}
                >
                  {ratePct}%
                </span>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  / day
                </span>
              </div>

              {/* Divider */}
              <div className="my-3" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

              {/* Total return */}
              <div className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Total: {totalReturnPct(tier.lock_days, tier.daily_rate)}% return
              </div>
            </button>
          );
        })}
      </div>

      {!selectedTier && (
        <p className="text-xs text-temple-gold mt-1">Please select a lock tier to continue.</p>
      )}
    </div>
  );
}
