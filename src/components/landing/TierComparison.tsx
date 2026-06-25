'use client';

import Link from 'next/link';

interface Tier {
  key: string;
  label: string;
  days: number;
  months: string;
  dailyRate: number;
  color: string;
  recommended?: boolean;
}

const TIERS: Tier[] = [
  { key: 'silver', label: 'Silver', days: 180, months: '6', dailyRate: 0.012, color: '#C0C0C0' },
  { key: 'gold', label: 'Gold', days: 270, months: '9', dailyRate: 0.015, color: '#FFD700', recommended: true },
  { key: 'platinum', label: 'Platinum', days: 360, months: '12', dailyRate: 0.02, color: '#E5E4E2' },
  { key: 'diamond', label: 'Diamond', days: 540, months: '18', dailyRate: 0.03, color: '#B9F2FF' },
];

export default function TierComparison() {
  function monthlyReturn(dailyRate: number): string {
    return (dailyRate * 30 * 100).toFixed(0) + '%';
  }

  function annualizedReturn(dailyRate: number): string {
    return (dailyRate * 365 * 100).toFixed(0) + '%';
  }

  return (
    <section className="mb-16">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Lock Tiers & Rates</h2>
        <p className="text-white/40 max-w-lg mx-auto text-sm">
          Choose a lock duration. Longer locks earn higher daily rates. All earnings are credited daily.
        </p>
      </div>

      {/* Mobile: horizontal scroll; Desktop: grid */}
      <div className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
        {TIERS.map((tier) => (
          <div
            key={tier.key}
            className="flex-shrink-0 w-[260px] md:w-auto snap-center rounded-2xl p-5 relative transition hover:scale-[1.02]"
            style={{
              background: tier.recommended
                ? `linear-gradient(180deg, ${tier.color}10 0%, rgba(255,255,255,0.03) 100%)`
                : 'rgba(255,255,255,0.03)',
              border: tier.recommended
                ? `2px solid ${tier.color}40`
                : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {tier.recommended && (
              <span
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: tier.color, color: '#000' }}
              >
                Most Popular
              </span>
            )}

            <div className="text-center mb-4">
              <div
                className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                style={{ background: `${tier.color}15` }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={tier.color} strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold" style={{ color: tier.color }}>{tier.label}</h3>
              <p className="text-xs text-white/40">{tier.months} months · {tier.days} days</p>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Daily Rate</span>
                <span className="text-white font-bold">{(tier.dailyRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Monthly</span>
                <span className="text-[#4CAF50] font-bold">~{monthlyReturn(tier.dailyRate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Annualized</span>
                <span className="text-[#FFD700] font-bold">~{annualizedReturn(tier.dailyRate)}</span>
              </div>
            </div>

            {/* Example return */}
            <div
              className="p-3 rounded-lg text-center mb-4"
              style={{ background: `${tier.color}08` }}
            >
              <p className="text-[10px] text-white/30 mb-1">$1,000 deposit earns</p>
              <p className="text-xl font-bold" style={{ color: tier.color }}>
                ${(1000 * tier.dailyRate * tier.days).toFixed(0)}
              </p>
              <p className="text-[10px] text-white/30">over {tier.days} days</p>
            </div>

            <Link
              href="/calculator"
              className="block w-full py-2.5 rounded-lg text-center text-xs font-bold transition no-underline"
              style={{
                background: tier.recommended ? tier.color : 'transparent',
                color: tier.recommended ? '#000' : tier.color,
                border: tier.recommended ? 'none' : `1px solid ${tier.color}30`,
                minHeight: 40,
              }}
            >
              {tier.recommended ? 'Start Earning →' : 'Calculate →'}
            </Link>
          </div>
        ))}
      </div>

      <div className="text-center mt-6">
        <Link
          href="/deposit"
          className="inline-block px-8 py-3 rounded-xl font-bold no-underline text-sm"
          style={{ background: '#FFD700', color: '#000' }}
        >
          Deposit & Lock Your Funds
        </Link>
      </div>
    </section>
  );
}
