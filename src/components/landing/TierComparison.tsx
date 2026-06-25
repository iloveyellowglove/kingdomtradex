'use client';

import Link from 'next/link';
import AnimatedNumber from '@/components/landing/AnimatedNumber';

const TIERS = [
  {
    key: 'silver', name: 'Silver', dur: '6 Months', daily: '1.2%', monthly: '~36%', total: '~216%', min: '$100',
    color: '#C0C0C0', gradient: 'linear-gradient(180deg, #C0C0C0, #8a8a8a)',
    featured: false,
  },
  {
    key: 'gold', name: 'Gold', dur: '9 Months', daily: '1.8%', monthly: '~54%', total: '~486%', min: '$500',
    color: '#F0B90B', gradient: 'linear-gradient(180deg, #F0B90B, #c99400)',
    featured: true,
  },
  {
    key: 'platinum', name: 'Platinum', dur: '12 Months', daily: '2.4%', monthly: '~72%', total: '~864%', min: '$1,000',
    color: '#E5E4E2', gradient: 'linear-gradient(180deg, #E5E4E2, #b0b0b0)',
    featured: false,
  },
  {
    key: 'diamond', name: 'Diamond', dur: '18 Months', daily: '3.0%', monthly: '~90%', total: '~1,620%', min: '$5,000',
    color: '#B9F2FF', gradient: 'linear-gradient(180deg, #B9F2FF, #7bc8d4)',
    featured: false,
  },
];

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
          {TIERS.map(t => (
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
              {/* Top colored bar */}
              <div style={{ height: 3, background: t.gradient }} />

              {t.featured && (
                <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold animate-pulse-badge"
                  style={{ background: '#F0B90B', color: '#0B0E11' }}>
                  Popular
                </div>
              )}

              <div className="p-5 text-center">
                {/* Icon */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: `${t.color}15` }}>
                  {t.key === 'silver' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>}
                  {t.key === 'gold' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2"><circle cx="12" cy="8" r="5"/><path d="M3 21l3-7h12l3 7"/></svg>}
                  {t.key === 'platinum' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                  {t.key === 'diamond' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2"><path d="M6 2L3 8l9 14L21 8l-3-6z"/><line x1="3" y1="8" x2="21" y2="8"/><line x1="12" y1="22" x2="12" y2="8"/></svg>}
                </div>

                <h3 className="font-semibold text-[#EAECEF] mb-0.5">{t.name}</h3>
                <p className="text-xs text-[#5E6673] mb-3">{t.dur}</p>

                <p className="text-[28px] font-extrabold text-[#0ECB81] mb-1">
                  <AnimatedNumber value={parseFloat(t.daily)} suffix="%" decimals={1} duration={1.2} />
                </p>
                <p className="text-xs text-[#5E6673] mb-4">daily rate</p>

                <div className="space-y-1.5 mb-4 text-left">
                  <div className="flex justify-between text-xs"><span className="text-[#5E6673]">Monthly</span><span className="text-[#EAECEF] font-medium">{t.monthly}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-[#5E6673]">Total projected</span><span className="text-[#EAECEF] font-medium">{t.total}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-[#5E6673]">Min deposit</span><span className="text-[#EAECEF] font-medium">{t.min}</span></div>
                </div>

                <Link
                  href={t.featured ? '/register' : '/calculator'}
                  className="block w-full py-2.5 rounded-lg text-sm font-semibold text-center no-underline transition"
                  style={{
                    background: t.featured ? '#F0B90B' : 'transparent',
                    color: t.featured ? '#0B0E11' : '#F0B90B',
                    border: t.featured ? 'none' : '1px solid #F0B90B',
                  }}
                >
                  {t.featured ? 'Start Earning' : 'Calculate'}
                </Link>
              </div>
            </div>
          ))}
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
