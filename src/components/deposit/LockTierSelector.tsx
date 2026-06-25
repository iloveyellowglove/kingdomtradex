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
  { tier: 'silver',   label: 'Silver',   lock_days: 180, daily_rate: 0.012000, description: '180-day lock period',  sort_order: 1 },
  { tier: 'gold',     label: 'Gold',     lock_days: 270, daily_rate: 0.015000, description: '270-day lock period',  sort_order: 2 },
  { tier: 'platinum', label: 'Platinum', lock_days: 360, daily_rate: 0.020000, description: '360-day lock period',  sort_order: 3 },
  { tier: 'diamond',  label: 'Diamond',  lock_days: 540, daily_rate: 0.016000, description: '540-day lock period',  sort_order: 4 },
];

function totalReturnPct(lockDays: number, dailyRate: number): string {
  return (lockDays * dailyRate * 100).toFixed(0);
}

function getBadge(tier: string): string | null {
  if (tier === 'platinum') return 'POPULAR';
  if (tier === 'diamond') return 'BEST VALUE';
  return null;
}

interface Props {
  amount: number;
  selectedTier: string | null;
  onSelect: (tier: TierConfig) => void;
}

export default function LockTierSelector({ amount, selectedTier, onSelect }: Props) {
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
    <div>
      <label className="block text-kt-text-secondary font-medium mb-1">Lock Tier</label>
      <p className="text-xs text-kt-text-tertiary mb-4">
        Select a lock period for your deposit. Longer locks earn higher daily returns.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TIERS.map((tier) => {
          const selected = selectedTier === tier.tier;
          const pulsing = pulseTier === tier.tier;
          const badge = getBadge(tier.tier);

          return (
            <button
              key={tier.tier}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => handleSelect(tier)}
              className={[
                'relative text-left rounded-xl transition-all duration-200 flex flex-col',
                'focus:outline-none focus:ring-2 focus:ring-[#FFD700]/40 focus:ring-offset-2 focus:ring-offset-[#0e0b1a]',
              ].join(' ')}
              style={{
                minHeight: 220,
                padding: '20px',
                background: selected
                  ? 'rgba(255,215,0,0.04)'
                  : 'rgba(255,255,255,0.02)',
                border: selected
                  ? '1px solid #FFD700'
                  : '1px solid rgba(255,255,255,0.08)',
                boxShadow: selected
                  ? '0 0 24px rgba(255,215,0,0.08)'
                  : 'none',
                transform: pulsing ? 'scale(1.02)' : 'scale(1.0)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!selected) {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }
              }}
              onMouseLeave={(e) => {
                if (!selected) {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }
              }}
            >
              {/* Selected checkmark */}
              {selected && (
                <span className="absolute top-4 right-4" style={{ color: '#FFD700' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}

              {/* Badge or spacer */}
              {badge ? (
                <span
                  className="inline-block self-start text-[10px] uppercase tracking-wider font-bold rounded-full px-2 py-0.5 mb-1"
                  style={{ background: 'rgba(255,215,0,0.12)', color: '#FFD700' }}
                >
                  {badge}
                </span>
              ) : (
                <div style={{ height: 22 }} />
              )}

              {/* Tier name */}
              <div
                className="font-semibold text-base mt-1"
                style={{ color: selected ? '#FFD700' : '#ffffff' }}
              >
                {tier.label}
              </div>

              {/* Lock period */}
              <div className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {tier.lock_days} days
              </div>

              {/* Daily rate - hero number */}
              <div className="flex items-baseline gap-1 mt-4">
                <span
                  className="text-3xl font-bold"
                  style={{ color: '#FFD700' }}
                >
                  {(tier.daily_rate * 100).toFixed(2)}%
                </span>
                <span className="text-sm font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  / day
                </span>
              </div>

              {/* Bottom section pushed to end */}
              <div className="mt-auto" style={{ paddingTop: 8 }}>
                {/* Divider */}
                <div className="my-4" style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />

                {/* Total return */}
                <div className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Total: {totalReturnPct(tier.lock_days, tier.daily_rate)}% return
                </div>

                {/* USD profit estimate */}
                {amount > 0 && (
                  <div className="text-sm font-semibold mt-1" style={{ color: '#22c55e' }}>
                    ${(amount * tier.lock_days * tier.daily_rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} profit
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!selectedTier && (
        <p className="text-xs text-kt-gold mt-3">Please select a lock tier to continue.</p>
      )}
    </div>
  );
}
