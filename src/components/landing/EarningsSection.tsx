'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

const PRESETS = [100, 500, 1000, 5000];
const TIERS = [
  { label: '6M', days: 180, rate: 0.012 },
  { label: '9M', days: 270, rate: 0.015 },
  { label: '12M', days: 360, rate: 0.02 },
  { label: '18M', days: 540, rate: 0.03 },
];

export default function EarningsSection() {
  const [amount, setAmount] = useState(1000);
  const [tierIdx, setTierIdx] = useState(1); // 9M

  const tier = TIERS[tierIdx];
  const daily = amount * tier.rate;
  const weekly = daily * 7;
  const monthly = daily * 30;
  const total = daily * tier.days;

  // SVG chart
  const chartData = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const day = Math.round((tier.days / steps) * i);
      pts.push({ x: (i / steps) * 100, y: (amount * tier.rate * day) });
    }
    const maxY = pts[pts.length - 1].y || 1;
    const points = pts.map(p => `${p.x},${100 - (p.y / maxY) * 80}`).join(' ');
    const area = `0,100 ${points} 100,100`;
    return { points, area };
  }, [amount, tier]);

  return (
    <section className="py-16 lg:py-20" style={{ background: '#1E2329' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-[22px] sm:text-[28px] font-semibold text-[#EAECEF] mb-2">Calculate Your Earnings</h2>
          <p className="text-sm text-[#848E9C] max-w-[500px] mx-auto">See your projected returns based on deposit amount and lock duration.</p>
        </div>

        <div className="max-w-[700px] mx-auto">
          {/* Amount input */}
          <div className="mb-6">
            <label className="block text-sm text-[#848E9C] mb-2">Deposit Amount (USD)</label>
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map(p => (
                <button key={p} onClick={() => setAmount(p)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition"
                  style={{
                    background: amount === p ? '#F0B90B' : '#0B0E11',
                    color: amount === p ? '#0B0E11' : '#848E9C',
                    border: amount === p ? 'none' : '1px solid #2B3139',
                  }}>
                  ${p >= 1000 ? `${p / 1000}k` : p}
                </button>
              ))}
              <input type="number" value={amount}
                onChange={e => setAmount(Math.max(100, parseInt(e.target.value, 10) || 0))}
                className="w-28 px-3 py-2 rounded-lg text-sm font-bold text-[#EAECEF]"
                style={{ background: '#0B0E11', border: '1px solid #2B3139' }} />
            </div>
          </div>

          {/* Tier selector */}
          <div className="mb-8">
            <label className="block text-sm text-[#848E9C] mb-2">Lock Duration</label>
            <div className="flex gap-2">
              {TIERS.map((t, i) => (
                <button key={t.label} onClick={() => setTierIdx(i)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition"
                  style={{
                    background: tierIdx === i ? '#F0B90B' : '#0B0E11',
                    color: tierIdx === i ? '#0B0E11' : '#848E9C',
                    border: tierIdx === i ? 'none' : '1px solid #2B3139',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { l: 'Daily', v: `$${daily.toFixed(2)}`, c: '#0ECB81' },
              { l: 'Weekly', v: `$${weekly.toFixed(2)}`, c: '#0ECB81' },
              { l: 'Monthly', v: `$${monthly.toFixed(2)}`, c: '#F0B90B' },
              { l: `${tier.days}d Total`, v: `$${total.toFixed(2)}`, c: '#EAECEF' },
            ].map(r => (
              <div key={r.l} className="p-4 rounded-lg text-center" style={{ background: '#0B0E11', border: '1px solid #2B3139' }}>
                <p className="text-xs text-[#5E6673] mb-1">{r.l}</p>
                <p className="text-lg sm:text-xl font-bold tabular-nums" style={{ color: r.c }}>{r.v}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="mb-8 p-4 rounded-xl" style={{ background: '#0B0E11', border: '1px solid #2B3139' }}>
            <svg viewBox="0 0 100 100" className="w-full h-40" preserveAspectRatio="none">
              <polygon points={chartData.area} fill="rgba(14,203,129,0.08)" />
              <polyline points={chartData.points} fill="none" stroke="#0ECB81" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <Link href="/register"
            className="block w-full sm:w-auto sm:inline-block px-10 py-4 rounded-lg text-center text-base font-semibold no-underline"
            style={{ background: '#F0B90B', color: '#0B0E11' }}>
            Start Earning
          </Link>
        </div>
      </div>
    </section>
  );
}
