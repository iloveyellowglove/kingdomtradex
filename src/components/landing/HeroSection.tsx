'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Props = { waitlistCount: number };

export default function HeroSection({ waitlistCount }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referredBy = searchParams.get('ref') || undefined;
  const roleParam = searchParams.get('role');
  const formRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'pastor'>(roleParam === 'pastor' ? 'pastor' : 'member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [animatedCount, setAnimatedCount] = useState(0);
  const [calcAmount, setCalcAmount] = useState(1000);
  const [calcTier, setCalcTier] = useState(2); // gold index

  const tiers = [
    { label: 'Silver', days: 180, rate: 0.012, color: '#C0C0C0' },
    { label: 'Gold', days: 270, rate: 0.015, color: '#FFD700' },
    { label: 'Platinum', days: 360, rate: 0.02, color: '#E5E4E2' },
    { label: 'Diamond', days: 540, rate: 0.03, color: '#B9F2FF' },
  ];
  const tier = tiers[calcTier];

  useEffect(() => {
    const duration = 2000;
    const start = performance.now();
    const target = waitlistCount;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedCount(Math.floor(target * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [waitlistCount]);

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
        if (data.alreadyExists) {
          router.push(`/waitlist/dashboard/${data.referralCode}?welcome_back=1`);
        } else {
          router.push(`/waitlist/dashboard/${data.referralCode}`);
        }
      } else {
        setError(data.error || 'Something went wrong.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }

  const dailyReturn = (calcAmount * tier.rate).toFixed(2);
  const monthlyReturn = (calcAmount * tier.rate * 30).toFixed(2);

  return (
    <section
      id="hero-section"
      className="relative rounded-2xl mb-12 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0e0b1a 0%, #1a1040 40%, #0e0b1a 100%)',
        border: '1px solid #261f3a',
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(rgba(255,215,0,0.05) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }} />

      {/* Grid layout: Left content + Right widget */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-8 p-6 sm:p-8 md:p-12">
        {/* LEFT: Headline + Form */}
        <div className="flex-1 flex flex-col justify-center" ref={formRef} id="signup">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 self-start" style={{
            background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
          }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFD700]" />
            </span>
            <span className="text-[#FFD700] text-xs font-semibold">Limited Time: Free Credits</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4" style={{ maxWidth: 560 }}>
            <span style={{ color: '#fff' }}>Your Crypto, </span>
            <span style={{ color: '#FFD700' }}>Earning Daily</span>
          </h1>
          <p className="text-base sm:text-lg text-white/50 mb-2" style={{ maxWidth: 480 }}>
            AI-powered trading platform. Get {role === 'pastor' ? '$100' : '$50'} free credits to start earning instantly.
          </p>
          <p className="text-sm text-white/30 mb-8" style={{ maxWidth: 480 }}>
            Projected earnings based on current rates. Not financial advice.
          </p>

          {/* Mini calculator inline */}
          <div className="p-4 rounded-xl mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', maxWidth: 400 }}>
            <p className="text-xs text-white/40 mb-2">Estimated Earnings Preview</p>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs text-white/50">$</span>
              <input
                type="number"
                value={calcAmount}
                onChange={(e) => setCalcAmount(Math.max(100, parseInt(e.target.value, 10) || 0))}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-bold text-white"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', minHeight: 36 }}
              />
              <div className="flex gap-1">
                {tiers.map((t, i) => (
                  <button
                    key={t.label}
                    onClick={() => setCalcTier(i)}
                    className="px-2 py-1 rounded text-[10px] font-bold transition"
                    style={{
                      background: calcTier === i ? `${t.color}20` : 'transparent',
                      color: calcTier === i ? t.color : 'rgba(255,255,255,0.3)',
                      border: calcTier === i ? `1px solid ${t.color}40` : '1px solid transparent',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-4 text-center">
              <div className="flex-1 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-[10px] text-white/40">Daily</p>
                <p className="text-lg font-bold text-[#4CAF50] tabular-nums">${dailyReturn}</p>
              </div>
              <div className="flex-1 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-[10px] text-white/40">Monthly</p>
                <p className="text-lg font-bold text-[#FFD700] tabular-nums">${monthlyReturn}</p>
              </div>
              <div className="flex-1 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-[10px] text-white/40">{tier.days}d Total</p>
                <p className="text-lg font-bold text-white tabular-nums">${(calcAmount * tier.rate * tier.days).toFixed(0)}</p>
              </div>
            </div>
          </div>

          {/* Signup Form */}
          <div className="max-w-md">
            {error && <div className="mb-4 p-3 rounded-lg text-sm text-red-400" style={{ background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.2)' }}>{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl text-base"
                placeholder="Enter your email address"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole('member')}
                  className="flex-1 py-2.5 rounded-lg text-xs font-bold transition"
                  style={{ background: role === 'member' ? '#FFD700' : 'transparent', color: role === 'member' ? '#000' : 'rgba(255,255,255,0.5)', border: role === 'member' ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.15)' }}
                >
                  Member · $50 Free
                </button>
                <button
                  type="button"
                  onClick={() => setRole('pastor')}
                  className="flex-1 py-2.5 rounded-lg text-xs font-bold transition"
                  style={{ background: role === 'pastor' ? '#FFD700' : 'transparent', color: role === 'pastor' ? '#000' : 'rgba(255,255,255,0.5)', border: role === 'pastor' ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.15)' }}
                >
                  Pastor · $100 Free
                </button>
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3.5 rounded-xl text-base font-bold transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FFD700, #c9a800)', color: '#000' }}
              >
                {loading ? 'Reserving...' : `Claim My Free $${role === 'pastor' ? '100' : '50'}`}
              </button>
            </form>
            <p className="text-xs text-white/25 mt-2 text-center">
              <span className="text-[#FFD700] font-bold">{animatedCount.toLocaleString()}</span> people already claimed · No spam
            </p>
          </div>
        </div>

        {/* RIGHT: Feature widget (desktop) */}
        <div className="hidden lg:flex flex-col justify-center w-80 flex-shrink-0">
          <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-sm font-bold text-white mb-4">Top Performing Tiers</h3>
            {tiers.map(t => {
              const monthlyRet = (t.rate * 30 * 100).toFixed(0);
              return (
                <div key={t.label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                    <div>
                      <p className="text-sm font-medium text-white">{t.label}</p>
                      <p className="text-[10px] text-white/30">{t.days} days</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: t.color }}>{(t.rate * 100).toFixed(1)}%</p>
                    <p className="text-[10px] text-white/30">~{monthlyRet}% monthly</p>
                  </div>
                </div>
              );
            })}
            <a href="/calculator" className="block mt-3 text-center text-xs font-bold text-[#FFD700] hover:underline">
              Open Full Calculator →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
