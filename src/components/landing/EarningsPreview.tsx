'use client';

import { useEffect, useState, useRef } from 'react';

const DAILY_RATE = 0.01; // 1.0% daily

function calcBalance(principal: number, days: number): number {
  let balance = principal;
  for (let i = 0; i < days; i++) {
    balance += balance * DAILY_RATE;
  }
  return balance;
}

export default function EarningsPreview() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const startingBalance = 50;
  const days7 = calcBalance(startingBalance, 7);
  const days30 = calcBalance(startingBalance, 30);
  const days90 = calcBalance(startingBalance, 90);

  const timeline = [
    { label: 'Starting Balance', value: startingBalance, highlight: false },
    { label: 'After 7 Days', value: days7, highlight: false },
    { label: 'After 30 Days', value: days30, highlight: true },
    { label: 'After 90 Days', value: days90, highlight: true },
  ];

  return (
    <section ref={sectionRef} className={`mb-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">See What Your Free Credits Can Become</h2>
        <p className="text-text-muted">Your $50 starting credits, growing with AI-powered daily returns</p>
      </div>

      <div className="card max-w-2xl mx-auto p-8">
        <div className="space-y-4">
          {timeline.map((item, i) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-4 rounded-xl transition-all"
              style={{
                background: item.highlight ? 'rgba(255,215,0,0.06)' : 'rgba(255,255,255,0.02)',
                border: item.highlight ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div className="flex items-center gap-4">
                <span
                  className="flex items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    width: 36, height: 36,
                    background: i === 3 ? '#FFD700' : 'rgba(255,255,255,0.08)',
                    color: i === 3 ? '#0e0b1a' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {i + 1}
                </span>
                <span className="text-text-primary font-medium">{item.label}</span>
              </div>
              <AnimatedCounter
                target={item.value}
                visible={visible}
                highlight={item.highlight}
              />
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <a href="#signup" className="btn-primary inline-block px-8 py-3 rounded-xl font-bold no-underline cta-btn-glow">
            Claim My Free $50
          </a>
        </div>
      </div>

      {/* Section divider */}
      <div className="mx-auto mt-12 max-w-lg" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.15), transparent)' }} />
    </section>
  );
}

function AnimatedCounter({ target, visible, highlight }: { target: number; visible: boolean; highlight: boolean }) {
  const [value, setValue] = useState(50);
  const started = useRef(false);

  useEffect(() => {
    if (!visible || started.current) return;
    started.current = true;
    const duration = 1500;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(50 + (target - 50) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, visible]);

  return (
    <span className={`text-xl font-extrabold ${highlight ? 'text-temple-gold' : 'text-text-primary'}`}>
      ${value.toFixed(2)}
    </span>
  );
}
