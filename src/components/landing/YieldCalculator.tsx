'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function YieldCalculator() {
  const [amount, setAmount] = useState(1000);
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

  const daily = amount * 0.015;
  const monthly = daily * 30;
  const yearly = daily * 365;

  return (
    <section ref={sectionRef} className={`card p-8 mb-12 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Yield Calculator</h2>
        <p className="text-kt-text-tertiary">See how your assets can grow with AI-powered daily returns</p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Slider */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-kt-text-tertiary text-sm">Stake Amount</span>
            <span className="text-kt-gold text-2xl font-bold">${amount.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={100}
            max={100000}
            step={100}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full"
            style={{
              WebkitAppearance: 'none',
              appearance: 'none',
              height: '8px',
              borderRadius: '4px',
              background: `linear-gradient(to right, #FFD700 0%, #FFD700 ${((amount - 100) / (100000 - 100)) * 100}%, #261f3a ${((amount - 100) / (100000 - 100)) * 100}%, #261f3a 100%)`,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
          <style jsx>{`
            input[type='range']::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: #FFD700;
              border: 3px solid #0e0b1a;
              box-shadow: 0 0 12px rgba(255,215,0,0.4);
              cursor: pointer;
            }
            input[type='range']::-moz-range-thumb {
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: #FFD700;
              border: 3px solid #0e0b1a;
              box-shadow: 0 0 12px rgba(255,215,0,0.4);
              cursor: pointer;
            }
          `}</style>
          <div className="flex justify-between text-kt-text-tertiary text-xs mt-1">
            <span>$100</span>
            <span>$50,000</span>
            <span>$100,000</span>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-kt-bg rounded-xl p-5 text-center">
            <p className="text-kt-text-tertiary text-xs uppercase tracking-wider mb-1">Daily Earnings</p>
            <p className="text-kt-gold text-2xl font-extrabold">${daily.toFixed(2)}</p>
            <p className="text-kt-text-tertiary text-xs mt-1">at 1.2% daily rate</p>
          </div>
          <div className="bg-kt-bg rounded-xl p-5 text-center">
            <p className="text-kt-text-tertiary text-xs uppercase tracking-wider mb-1">Monthly Earnings</p>
            <p className="text-kt-gold text-2xl font-extrabold">${monthly.toFixed(2)}</p>
            <p className="text-kt-text-tertiary text-xs mt-1">{((monthly / amount) * 100).toFixed(0)}% return</p>
          </div>
          <div className="bg-kt-bg rounded-xl p-5 text-center">
            <p className="text-kt-text-tertiary text-xs uppercase tracking-wider mb-1">Yearly Earnings</p>
            <p className="text-kt-gold text-2xl font-extrabold">${yearly.toFixed(2)}</p>
            <p className="text-kt-text-tertiary text-xs mt-1">compounding power</p>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/waitlist" className="btn-primary inline-block px-8 py-3 rounded-xl font-bold">
            Join the Waitlist
          </Link>
        </div>
      </div>
    </section>
  );
}
