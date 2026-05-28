'use client';

export interface TierConfig {
  tier: string;
  label: string;
  lock_months: number;
  daily_rate: number;
  description: string;
  sort_order: number;
}

const TIERS: TierConfig[] = [
  { tier: 'growth',  label: 'Growth',  lock_months: 6,  daily_rate: 0.003000, description: '6-month lock period',  sort_order: 1 },
  { tier: 'builder', label: 'Builder', lock_months: 12, daily_rate: 0.004000, description: '1-year lock period',   sort_order: 2 },
  { tier: 'kingdom', label: 'Kingdom', lock_months: 24, daily_rate: 0.005000, description: '2-year lock period',   sort_order: 3 },
  { tier: 'legacy',  label: 'Legacy',  lock_months: 36, daily_rate: 0.006000, description: '3-year lock period',   sort_order: 4 },
];

function projectedReturn(amount: number, dailyRate: number, lockMonths: number): number {
  return amount * dailyRate * (lockMonths * 30);
}

function formatPeriod(months: number): string {
  if (months < 12) return `${months} months`;
  const years = months / 12;
  return years === 1 ? '1 year' : `${years} years`;
}

interface Props {
  amount: number;
  selectedTier: string | null;
  onSelect: (tier: TierConfig) => void;
}

export default function LockTierSelector({ amount, selectedTier, onSelect }: Props) {
  return (
    <div className="space-y-3">
      <label className="block text-text-secondary font-medium mb-1">Lock Tier</label>
      <p className="text-xs text-text-muted -mt-1 mb-3">Select a lock period for your deposit. Longer locks earn higher daily returns.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TIERS.map((tier) => {
          const selected = selectedTier === tier.tier;
          const proj = projectedReturn(amount || 0, tier.daily_rate, tier.lock_months);

          return (
            <button
              key={tier.tier}
              type="button"
              onClick={() => onSelect(tier)}
              className="text-left p-4 rounded-xl transition-all duration-200"
              style={{
                background: selected ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)',
                border: selected
                  ? '2px solid #FFD700'
                  : '1px solid rgba(255,255,255,0.06)',
                boxShadow: selected
                  ? '0 0 20px rgba(255,215,0,0.15), inset 0 0 20px rgba(255,215,0,0.03)'
                  : 'none',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-sm font-bold"
                  style={{ color: selected ? '#FFD700' : '#E2E8F0' }}
                >
                  {tier.label}
                </span>
                {selected && (
                  <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-[#FFD700] text-black">
                    Selected
                  </span>
                )}
              </div>

              <div className="text-xs text-text-muted mb-2">{formatPeriod(tier.lock_months)} lock</div>

              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-lg font-bold" style={{ color: selected ? '#FFD700' : '#E2E8F0' }}>
                  {(tier.daily_rate * 100).toFixed(2)}%
                </span>
                <span className="text-xs text-text-muted">/ day</span>
              </div>

              {amount > 0 && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="text-xs text-text-muted">Projected return</div>
                  <div className="text-sm font-semibold text-success">
                    +${proj.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </div>
                </div>
              )}
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
