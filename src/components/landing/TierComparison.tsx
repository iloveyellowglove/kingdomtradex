'use client';

import Link from 'next/link';
import AnimatedNumber from '@/components/landing/AnimatedNumber';
import { TIER_LIST } from '@/lib/tiers';

export default function TierComparison() {
  return (
    <section id="tiers" className="py-16 lg:py-20" style={{ background: '#0B0E11' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-[22px] sm:text-[28px] font-semibold text-[#EAECEF] mb-2">Lock Tiers &amp; Rates</h2>
          <p className="text-sm text-[#848E9C] max-w-[500px] mx-auto">
            Choose a lock duration to begin earning daily projected returns. Longer locks earn higher rates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-[1100px] mx-auto">
          {TIER_LIST.map(t => {
            const gradient = `linear-gradient(180deg, ${t.color}, ${t.color}88)`;
            return (
            <div key={t.key} className="group relative rounded-xl overflow-hidden transition-all duration-200"
              style={{
                background: '#1E2329',
                border: t.featured ? '2px solid #F0B90B' : '1px solid #2B3139',
                ...(t.featured ? { transform: 'scale(1.03)' } : {}),
              }}
              onMouseEnter={(e) => {
                if (window.matchMedia('(hover: hover)').matches) {
                  const el = e.currentTarget;
                  el.style.borderColor = t.color;
                  el.style.transform = t.featured ? 'scale(1.04)' : 'scale(1.02)';
                  el.style.boxShadow = `0 0 20px ${t.color}15`;
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = t.featured ? '#F0B90B' : '#2B3139';
                el.style.transform = t.featured ? 'scale(1.03)' : 'scale(1)';
                el.style.boxShadow = 'none';
              }}
            >
              <div style={{ height: 3, background: gradient }} />
              {t.featured && (
                <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold animate-pulse-badge"
                  style={{ background: '#F0B90B', color: '#0B0E11' }}>Popular</div>
              )}
              {t.badge && !t.featured && (
                <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: t.color, color: '#0B0E11' }}>{t.badge}</div>
              )}
              <div className="p-5 text-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: `${t.color}15` }}>
                  <div className="w-4 h-4 rounded-full" style={{ background: t.color }} />
                </div>
                <h3 className="font-semibold text-[#EAECEF] mb-0.5">{t.name}</h3>
                <p className="text-xs text-[#5E6673] mb-3">{Math.round(t.duration / 30)} Months · {t.duration} days</p>
                <p className="text-[28px] font-extrabold text-[#0ECB81] mb-1">
                  <AnimatedNumber value={t.dailyRate * 100} suffix="%" decimals={1} duration={1.2} />
                </p>
                <p className="text-xs text-[#5E6673] mb-4">daily rate</p>
                <div className="space-y-1.5 mb-4 text-left">
                  <div className="flex justify-between text-xs"><span className="text-[#5E6673]">Monthly</span><span className="text-[#EAECEF] font-medium">~{(t.dailyRate * 30 * 100).toFixed(0)}%</span></div>
                  <div className="flex justify-between text-xs"><span className="text-[#5E6673]">Total projected</span><span className="text-[#EAECEF] font-medium">~{(t.dailyRate * t.duration * 100).toFixed(0)}%</span></div>
                  <div className="flex justify-between text-xs"><span className="text-[#5E6673]">Min deposit</span><span className="text-[#EAECEF] font-medium">${t.minDeposit}</span></div>
                </div>
                <Link
                  href={t.featured ? '/register' : '/calculator'}
                  className="block w-full py-2.5 rounded-lg text-sm font-semibold text-center no-underline transition"
                  style={{
                    background: t.featured ? '#F0B90B' : 'transparent',
                    color: t.featured ? '#0B0E11' : '#F0B90B',
                    border: t.featured ? 'none' : '1px solid #F0B90B',
                  }}>
                  {t.featured ? 'Start Earning' : 'Calculate'}
                </Link>
              </div>
            </div>
          )})}
        </div>

        <div className="text-center mt-8">
          <Link href="/deposit" className="text-sm font-medium text-[#F0B90B] hover:underline no-underline">
            Deposit &amp; Lock Your Funds →
          </Link>
        </div>
      </div>
    </section>
  );
}
