'use client';

import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AnimatedNumber from '@/components/landing/AnimatedNumber';
import { TIER_LIST } from '@/lib/tiers';

export default function HeroSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referredBy = searchParams.get('ref') || undefined;
  const roleParam = searchParams.get('role');
  const formRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'pastor'>(roleParam === 'pastor' ? 'pastor' : 'member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tierTab, setTierTab] = useState<'popular' | 'all'>('popular');

  const tiers = TIER_LIST;
  const displayTiers = tierTab === 'popular' ? tiers.slice(0, 4) : tiers;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/waitlist/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: '', role, referredBy }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.alreadyExists) router.push(`/waitlist/dashboard/${data.referralCode}?welcome_back=1`);
        else router.push(`/waitlist/dashboard/${data.referralCode}`);
      } else setError(data.error || 'Something went wrong.');
    } catch { setError('Network error.'); }
    setLoading(false);
  }

  return (
    <section className="min-h-[80vh] flex items-center bg-kt-bg">
      <div className="max-w-[1200px] mx-auto px-6 w-full py-16 lg:py-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          {/* LEFT COLUMN */}
          <div className="flex-1 max-w-[600px]" ref={formRef}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6" style={{ background: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.15)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F0B90B]" />
              <span className="text-kt-gold text-xs font-semibold">Trusted by Faith Communities Worldwide</span>
            </div>

            {/* Headline */}
            <h1 className="text-[32px] sm:text-[40px] lg:text-[48px] font-extrabold leading-[1.1] mb-4 text-kt-text-primary">
              Your Crypto,<br /><span className="text-kt-gold">Earning Daily</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base text-kt-text-secondary mb-8 max-w-[480px] leading-relaxed">
              A faith-grounded investment platform. Get <strong className="text-kt-text-primary">$50 free credits</strong> to start earning instantly.
            </p>

            {/* Mini stat cards */}
            <div className="grid grid-cols-3 gap-3 mb-8 max-w-[420px]">
              {[
                { v: 50, l: 'Free Credit', p: '$' },
                { v: 500, l: 'Potential at $1k', p: '$', s: '/mo' },
                { v: 7200, l: 'Projected Annual', p: '$', s: '/yr' },
              ].map(s => (
                <div key={s.l} className="p-3 rounded-lg text-center bg-kt-surface border border-kt-border">
                  <p className="text-base sm:text-lg font-bold text-kt-text-primary" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                    <AnimatedNumber value={s.v} prefix={s.p || ''} suffix={s.s || ''} decimals={0} duration={1.2} />
                  </p>
                  <p className="text-[10px] sm:text-xs text-kt-text-tertiary">{s.l}</p>
                </div>
              ))}
            </div>

            {/* Email form */}
            {error && <div className="mb-3 p-3 rounded-lg text-sm text-kt-red" style={{ background: 'rgba(246,70,93,0.1)', border: '1px solid rgba(246,70,93,0.2)' }}>{error}</div>}
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-4 max-w-[480px]">
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3.5 rounded-lg text-base text-kt-text-primary"
                style={{ background: '#1E2329', border: '1px solid #2B3139', minHeight: 48 }}
              />
              <button type="submit" disabled={loading || !email}
                className="px-8 py-3.5 rounded-lg text-base font-semibold transition disabled:opacity-50 whitespace-nowrap"
                style={{ background: '#F0B90B', color: '#0B0E11', minHeight: 48 }}>
                {loading ? 'Reserving...' : 'Get Started'}
              </button>
            </form>

            {/* Secondary pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button type="button" onClick={() => { setRole('member'); }} className={`px-4 py-2 rounded-lg text-xs font-semibold border transition ${role === 'member' ? 'border-[#F0B90B] text-kt-gold' : 'border-kt-border text-kt-text-secondary'}`} style={{ background: 'transparent' }}>
                Member - $50 Free
              </button>
              <button type="button" onClick={() => { setRole('pastor'); }} className={`px-4 py-2 rounded-lg text-xs font-semibold border transition ${role === 'pastor' ? 'border-[#F0B90B] text-kt-gold' : 'border-kt-border text-kt-text-secondary'}`} style={{ background: 'transparent' }}>
                Pastor - $100 Free
              </button>
              <a href="/calculator" className="px-4 py-2 rounded-lg text-xs font-semibold border border-kt-border text-kt-text-secondary hover:border-[#F0B90B] hover:text-kt-gold no-underline transition">
                Calculate Earnings →
              </a>
            </div>

            {/* Trust line */}
            <div className="flex items-center gap-2 text-xs text-kt-text-tertiary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              Bank-grade security · Automated payouts · 24/7 Support
            </div>
          </div>

          {/* RIGHT COLUMN - Tier Widget (Desktop) */}
          <div className="hidden lg:block w-[380px] flex-shrink-0">
            <div className="p-5 rounded-2xl bg-kt-surface border border-kt-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-kt-text-primary">Top Performing Tiers</h3>
                <div className="flex gap-1 p-0.5 rounded-lg bg-kt-bg">
                  {(['popular', 'all'] as const).map(t => (
                    <button key={t} onClick={() => setTierTab(t)}
                      className="px-3 py-1 rounded text-xs font-medium capitalize transition"
                      style={{ background: tierTab === t ? '#2B3139' : 'transparent', color: tierTab === t ? '#EAECEF' : '#5E6673' }}>
                      {t === 'popular' ? 'Popular' : 'All'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                {displayTiers.map(t => (
                  <div key={t.key} className="flex items-center justify-between py-3 px-3 rounded-lg transition bg-kt-bg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${t.color}15` }}>
                        <div className="w-3 h-3 rounded-full" style={{ background: t.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-kt-text-primary">{t.name}</p>
                        <p className="text-xs text-kt-text-tertiary">{Math.round(t.duration / 30)} Months</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-kt-green tabular-nums">{(t.dailyRate * 100).toFixed(1)}%</p>
                      <p className="text-[10px] text-kt-text-tertiary">daily</p>
                    </div>
                  </div>
                ))}
              </div>
              <a href="/calculator" className="block mt-3 text-center text-sm font-medium text-kt-gold hover:underline no-underline">
                See Full Calculator →
              </a>
            </div>
          </div>
        </div>

        {/* Mobile: tiers shown below hero */}
        <div className="lg:hidden mt-8">
          <div className="p-4 rounded-xl bg-kt-surface border border-kt-border">
            <h3 className="text-sm font-bold text-kt-text-primary mb-3">Top Performing Tiers</h3>
            <div className="grid grid-cols-2 gap-2">
              {tiers.map(t => (
                <div key={t.key} className="p-3 rounded-lg flex items-center gap-2 bg-kt-bg">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${t.color}15` }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-kt-text-primary">{t.name} · {Math.round(t.duration / 30)}M</p>
                    <p className="text-xs font-bold text-kt-green tabular-nums">{(t.dailyRate * 100).toFixed(1)}% daily</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
