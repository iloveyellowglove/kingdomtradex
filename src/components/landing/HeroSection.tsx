'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Logo from '@/components/brand/Logo';
import CrossBackground from '@/components/brand/CrossBackground';

type Props = { user: { username: string; role: string } | null };

const PARTICLES = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: Math.random() * 4 + 1,
  delay: `${Math.random() * 8}s`,
  duration: `${Math.random() * 6 + 6}s`,
  opacity: Math.random() * 0.4 + 0.1,
}));

function AnimatedCounter({ target, suffix = '', decimals = 0 }: { target: number; suffix?: string; decimals?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || started.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          started.current = true;
          const duration = 2000;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(target * eased);
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{value.toFixed(decimals)}{suffix}</span>;
}

export default function HeroSection({ user }: Props) {
  return (
    <section className="relative overflow-hidden rounded-2xl mb-12" style={{
      background: 'linear-gradient(135deg, #0e0b1a 0%, #1a0a2e 25%, #0d1b3e 50%, #1a0a2e 75%, #0e0b1a 100%)',
      border: '1px solid #261f3a',
      minHeight: '580px',
    }}>
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%', width: '50%', height: '60%',
          background: 'radial-gradient(circle, rgba(106,13,173,0.25) 0%, transparent 70%)',
          animation: 'heroOrb1 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-10%', width: '50%', height: '60%',
          background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)',
          animation: 'heroOrb2 10s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '40%', width: '30%', height: '30%',
          background: 'radial-gradient(circle, rgba(75,0,130,0.2) 0%, transparent 60%)',
          animation: 'heroOrb3 12s ease-in-out infinite',
        }} />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: p.left, top: p.top,
              width: `${p.size}px`, height: `${p.size}px`,
              background: p.id % 3 === 0 ? '#FFD700' : p.id % 3 === 1 ? '#b47cff' : '#6A0DAD',
              opacity: p.opacity,
              animation: `particleFloat ${p.duration} ${p.delay} infinite linear`,
              boxShadow: p.id % 3 === 0 ? '0 0 6px rgba(255,215,0,0.5)' : 'none',
            }}
          />
        ))}
      </div>

      {/* Cross watermark background */}
      <CrossBackground opacity={0.04} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-16 md:py-20" style={{ minHeight: '580px' }}>
        {/* Logo */}
        <Logo size="lg" showText={false} className="mb-5" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6" style={{
          background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
        }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-temple-gold opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-temple-gold" />
          </span>
          <span className="text-temple-gold text-xs font-semibold tracking-wide uppercase">AI Trading Active</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-center mb-4 leading-tight" style={{
          background: 'linear-gradient(135deg, #FFD700 0%, #FFE44D 30%, #FFC107 60%, #FFD700 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Multiply Your Assets<br />With Kingdom AI
        </h1>

        <p className="text-text-secondary text-lg md:text-xl text-center max-w-2xl mb-8">
          Advanced AI trading algorithms work 24/7 to generate consistent daily returns on your staked assets. Join a covenant economy built on biblical stewardship.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          {user ? (
            <Link href="/dashboard" className="btn-primary inline-block px-10 py-4 rounded-xl text-lg font-bold text-center">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/waitlist" className="btn-primary inline-block px-10 py-4 rounded-xl text-lg font-bold text-center">
                Join the Waitlist
              </Link>
              <Link href="/waitlist/leaderboard" className="inline-block px-10 py-4 rounded-xl text-lg font-semibold text-center transition-all" style={{
                border: '1px solid #FFD700', color: '#FFD700',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#FFD700'; e.currentTarget.style.color = '#0e0b1a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FFD700'; }}
              >
                View Leaderboard
              </Link>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-3xl">
          {[
            { target: 1.5, suffix: '%', label: 'Daily Yield', decimals: 1 },
            { target: 15420, suffix: '+', label: 'Active Stewards' },
            { target: 38000000, suffix: ' USDT', label: 'Total Value Staked', decimals: 0 },
            { target: 5, suffix: '', label: 'Levels of Blessing' },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4 rounded-xl" style={{ background: 'rgba(255,215,0,0.03)', border: '1px solid rgba(255,215,0,0.08)' }}>
              <p className="text-2xl md:text-3xl font-extrabold text-white mb-1">
                <AnimatedCounter target={stat.target} suffix={stat.suffix} decimals={stat.decimals ?? 0} />
              </p>
              <p className="text-text-muted text-xs uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Keyframe styles */}
      <style jsx>{`
        @keyframes heroOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.1); }
          66% { transform: translate(-15px, 10px) scale(0.95); }
        }
        @keyframes heroOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-25px, -30px) scale(1.15); }
        }
        @keyframes heroOrb3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          50% { transform: translate(20px, 15px) scale(1.2); opacity: 0.8; }
        }
        @keyframes particleFloat {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
        }
      `}</style>
    </section>
  );
}
