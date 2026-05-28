'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/brand/Logo';

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
        body: JSON.stringify({
          email: email.trim(),
          name: '',
          role,
          referredBy,
        }),
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

  const ctaText = role === 'pastor' ? 'Claim My Free $100' : 'Claim My Free $50';

  return (
    <section className="relative rounded-2xl mb-12 overflow-visible animate-gradient" style={{
      background: 'linear-gradient(135deg, #0e0b1a, #1a1040, #251545, #1a1040, #0e0b1a)',
      backgroundSize: '300% 300%',
      border: '1px solid #261f3a',
    }}>
      {/* Grid dot pattern overlay */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
        backgroundImage: 'radial-gradient(rgba(255,215,0,0.07) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        opacity: 0.4,
      }} />

      {/* Subtle gradient orbs — clipped to prevent overflow */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div style={{
          position: 'absolute', top: '-10%', left: '-5%', width: '40%', height: '50%',
          background: 'radial-gradient(circle, rgba(106,13,173,0.15) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-5%', width: '40%', height: '50%',
          background: 'radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 70%)',
        }} />

        {/* Floating crypto icon watermarks */}
        {[
          { icon: 'https://assets.coingecko.com/coins/images/1/standard/bitcoin.png', top: '10%', left: '5%', w: 70, op: 0.06, anim: 'float-icon-1', delay: '0s', hideMobile: false },
          { icon: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png', top: '15%', left: null, right: '8%', w: 60, op: 0.05, anim: 'float-icon-2', delay: '0.8s', hideMobile: false },
          { icon: 'https://assets.coingecko.com/coins/images/4128/standard/solana.png', top: '50%', left: '3%', w: 50, op: 0.04, anim: 'float-icon-3', delay: '1.6s', hideMobile: false },
          { icon: 'https://assets.coingecko.com/coins/images/325/standard/Tether.png', top: '70%', left: null, right: '5%', w: 45, op: 0.05, anim: 'float-icon-4', delay: '0.4s', hideMobile: false },
          { icon: 'https://assets.coingecko.com/coins/images/44/standard/xrp-symbol-white-128.png', top: '30%', left: '15%', w: 40, op: 0.04, anim: 'float-icon-1', delay: '2s', hideMobile: false },
          { icon: 'https://assets.coingecko.com/coins/images/5/standard/dogecoin.png', top: '60%', left: null, right: '15%', w: 55, op: 0.06, anim: 'float-icon-2', delay: '1.2s', hideMobile: false },
          { icon: 'https://assets.coingecko.com/coins/images/825/standard/bnb-icon2_2x.png', top: '80%', left: '10%', w: 45, op: 0.04, anim: 'float-icon-3', delay: '2.4s', hideMobile: true },
          { icon: 'https://assets.coingecko.com/coins/images/975/standard/cardano.png', top: '25%', left: null, right: '20%', w: 40, op: 0.05, anim: 'float-icon-4', delay: '0.6s', hideMobile: true },
          { icon: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png', top: '45%', left: '20%', w: 50, op: 0.04, anim: 'float-icon-1', delay: '3s', hideMobile: true },
          { icon: 'https://assets.coingecko.com/coins/images/11939/standard/shiba.png', top: '75%', left: null, right: '12%', w: 40, op: 0.05, anim: 'float-icon-2', delay: '1.8s', hideMobile: true },
          { icon: 'https://assets.coingecko.com/coins/images/12559/standard/Avalanche_Circle_RedWhite_Trans.png', top: '40%', left: null, right: '3%', w: 45, op: 0.04, anim: 'float-icon-3', delay: '2.8s', hideMobile: true },
          { icon: 'https://assets.coingecko.com/coins/images/13397/standard/Graph_Token.png', top: '85%', left: '18%', w: 35, op: 0.04, anim: 'float-icon-4', delay: '3.2s', hideMobile: true },
        ].map((coin, i) => (
          <img
            key={i}
            src={coin.icon}
            alt=""
            className={`${coin.hideMobile ? 'hidden md:block' : ''} ${coin.anim}`}
            style={{
              position: 'absolute',
              top: coin.top,
              ...(coin.left !== null ? { left: coin.left } : {}),
              ...(coin.right !== null ? { right: coin.right } : {}),
              width: coin.w,
              height: coin.w,
              opacity: coin.op,
              animationDelay: coin.delay,
              pointerEvents: 'none',
              zIndex: 1,
              filter: 'grayscale(30%)',
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 sm:px-8 md:px-12 lg:px-16 py-16 md:py-20" ref={formRef} id="signup">
        <div className="animate-float">
          <Logo size="lg" showText={false} className="mb-5" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 animate-badge-pulse" style={{
          background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
        }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-temple-gold opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-temple-gold" />
          </span>
          <span className="text-temple-gold text-xs font-semibold tracking-wide uppercase">Limited Time: Free credits for early members</span>
        </div>

        {/* Dynamic Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-center mb-4 leading-tight overflow-visible px-2" style={{
          background: 'linear-gradient(135deg, #FFD700 0%, #FFE44D 30%, #FFC107 60%, #FFD700 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          paddingTop: '0.15em',
          paddingBottom: '0.15em',
          textShadow: '0 0 30px rgba(255,215,0,0.3), 0 0 60px rgba(255,215,0,0.1)',
        }}>
          {role === 'pastor'
            ? <><span>Get $100 Free to Start</span><br /><span>Earning Crypto Daily</span></>
            : <><span>Get $50 Free to Start</span><br /><span>Earning Crypto Daily</span></>
          }
        </h1>

        <p className="text-text-secondary text-lg md:text-xl text-center max-w-2xl mb-2">
          No trading experience needed. Get free credits instantly.
        </p>
        <p className="text-text-muted text-center max-w-2xl mb-2">
          Our AI trades crypto for you 24/7. You earn daily.
        </p>
        <p className="text-text-muted text-center max-w-2xl mb-8">
          Pastors receive $100 free. Members receive $50.
        </p>

        {/* The Form */}
        <div className="w-full max-w-md mx-auto mb-8">
          {error && <div className="alert alert-danger mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-lg py-4 px-5 rounded-xl"
                placeholder="Enter your email address"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                  fontSize: '1.05rem',
                }}
              />
            </div>

            {/* Role Selector Pills */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRole('member')}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: role === 'member' ? '#FFD700' : 'transparent',
                  color: role === 'member' ? '#0e0b1a' : 'rgba(255,255,255,0.6)',
                  border: role === 'member' ? '2px solid #FFD700' : '2px solid rgba(255,255,255,0.15)',
                }}
              >
                Member - $50 Free
              </button>
              <button
                type="button"
                onClick={() => setRole('pastor')}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: role === 'pastor' ? '#FFD700' : 'transparent',
                  color: role === 'pastor' ? '#0e0b1a' : 'rgba(255,255,255,0.6)',
                  border: role === 'pastor' ? '2px solid #FFD700' : '2px solid rgba(255,255,255,0.15)',
                }}
              >
                Pastor - $100 Free
              </button>
            </div>

            {/* CTA Button */}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-4 rounded-xl text-lg font-bold cta-btn-glow animate-cta-glow"
              style={{
                background: 'linear-gradient(135deg, #FFD700, #c9a800)',
                color: '#0e0b1a',
                opacity: loading || !email ? 0.6 : 1,
              }}
            >
              {loading ? 'Reserving Your Credits...' : ctaText}
            </button>
          </form>

          <p className="text-text-muted text-xs text-center mt-3">No spam. Only launch updates.</p>
        </div>

        {/* Social Proof */}
        <div className="text-center animate-fade-in-up">
          <p className="text-text-secondary text-sm">
            <span className="text-temple-gold font-bold">{animatedCount.toLocaleString()}</span> people already claimed their free credits
          </p>
          <p className="text-temple-gold font-bold text-sm mt-1">Launching June 7, 2026</p>
        </div>
      </div>
    </section>
  );
}
