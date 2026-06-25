'use client';

import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AnimatedNumber from '@/components/landing/AnimatedNumber';

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

  const tiers = [
    { name: 'Silver', dur: '6 Months', rate: '1.2%', monthly: '~36%', color: '#C0C0C0' },
    { name: 'Gold', dur: '9 Months', rate: '1.8%', monthly: '~54%', color: '#F0B90B' },
    { name: 'Platinum', dur: '12 Months', rate: '2.4%', monthly: '~72%', color: '#E5E4E2' },
    { name: 'Diamond', dur: '18 Months', rate: '3.0%', monthly: '~90%', color: '#B9F2FF' },
  ];

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
    <section className="min-h-[80vh] flex items-center" style={{ background: '#0B0E11' }}>
      <div className="max-w-[1200px] mx-auto px-6 w-full py-16 lg:py-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          {/* LEFT COLUMN */}
          <div className="flex-1 max-w-[600px]" ref={formRef}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6" style={{ background: 'rgba(240,185,11,0.06)', border: '1px solid rgba(240,185,11,0.15)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F0B90B]" />
              <span className="text-[#F0B90B] text-xs font-semibold">Trusted by Faith Communities Worldwide</span>
            </div>

            {/* Headline */}
            <h1 className="text-[32px] sm:text-[40px] lg:text-[48px] font-extrabold leading-[1.1] mb-4" style={{ color: '#EAECEF' }}>
              Your Crypto,<br /><span style={{ color: '#F0B90B' }}>Earning Daily</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base text-[#848E9C] mb-8 max-w-[480px] leading-relaxed">
              A faith-grounded investment platform. Get <strong className="text-[#EAECEF]">$50 free credits</strong> to start earning instantly.
            </p>

            {/* Mini stat cards */}
            <div className="grid grid-cols-3 gap-3 mb-8 max-w-[420px]">
              {[
                { v: 50, l: 'Free Credit', p: '$' },
                { v: 500, l: 'Potential at $1k', p: '$', s: '/mo' },
                { v: 7200, l: 'Projected Annual', p: '$', s: '/yr' },
              ].map(s => (
                <div key={s.l} className="p-3 rounded-lg text-center" style={{ background: '#1E2329', border: '1px solid #2B3139' }}>
                  <p className="text-base sm:text-lg font-bold text-[#EAECEF]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                    <AnimatedNumber value={s.v} prefix={s.p || ''} suffix={s.s || ''} decimals={0} duration={1.2} />
                  </p>
                  <p className="text-[10px] sm:text-xs text-[#5E6673]">{s.l}</p>
                </div>
              ))}
            </div>

            {/* Email form */}
            {error && <div className="mb-3 p-3 rounded-lg text-sm text-[#F6465D]" style={{ background: 'rgba(246,70,93,0.1)', border: '1px solid rgba(246,70,93,0.2)' }}>{error}</div>}
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-4 max-w-[480px]">
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3.5 rounded-lg text-base text-[#EAECEF]"
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
              <button type="button" onClick={() => { setRole('member'); }} className={`px-4 py-2 rounded-lg text-xs font-semibold border transition ${role === 'member' ? 'border-[#F0B90B] text-[#F0B90B]' : 'border-[#2B3139] text-[#848E9C]'}`} style={{ background: 'transparent' }}>
                Member - $50 Free
              </button>
              <button type="button" onClick={() => { setRole('pastor'); }} className={`px-4 py-2 rounded-lg text-xs font-semibold border transition ${role === 'pastor' ? 'border-[#F0B90B] text-[#F0B90B]' : 'border-[#2B3139] text-[#848E9C]'}`} style={{ background: 'transparent' }}>
                Pastor - $100 Free
              </button>
              <a href="/calculator" className="px-4 py-2 rounded-lg text-xs font-semibold border border-[#2B3139] text-[#848E9C] hover:border-[#F0B90B] hover:text-[#F0B90B] no-underline transition">
                Calculate Earnings →
              </a>
            </div>

            {/* Trust line */}
            <div className="flex items-center gap-2 text-xs text-[#5E6673]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              Bank-grade security · Automated payouts · 24/7 Support
            </div>
          </div>

          {/* RIGHT COLUMN - Tier Widget (Desktop) */}
          <div className="hidden lg:block w-[380px] flex-shrink-0">
            <div className="p-5 rounded-2xl" style={{ background: '#1E2329', border: '1px solid #2B3139' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[#EAECEF]">Top Performing Tiers</h3>
                <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: '#0B0E11' }}>
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
                  <div key={t.name} className="flex items-center justify-between py-3 px-3 rounded-lg transition" style={{ background: '#0B0E11' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${t.color}15` }}>
                        <div className="w-3 h-3 rounded-full" style={{ background: t.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#EAECEF]">{t.name}</p>
                        <p className="text-xs text-[#5E6673]">{t.dur}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#0ECB81] tabular-nums">{t.rate}</p>
                      <p className="text-[10px] text-[#5E6673]">daily</p>
                    </div>
                  </div>
                ))}
              </div>
              <a href="/calculator" className="block mt-3 text-center text-sm font-medium text-[#F0B90B] hover:underline no-underline">
                See Full Calculator →
              </a>
            </div>
          </div>
        </div>

        {/* Mobile: tiers shown below hero */}
        <div className="lg:hidden mt-8">
          <div className="p-4 rounded-xl" style={{ background: '#1E2329', border: '1px solid #2B3139' }}>
            <h3 className="text-sm font-bold text-[#EAECEF] mb-3">Top Performing Tiers</h3>
            <div className="grid grid-cols-2 gap-2">
              {tiers.map(t => (
                <div key={t.name} className="p-3 rounded-lg flex items-center gap-2" style={{ background: '#0B0E11' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${t.color}15` }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#EAECEF]">{t.name} · {t.dur}</p>
                    <p className="text-xs font-bold text-[#0ECB81] tabular-nums">{t.rate} daily</p>
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
