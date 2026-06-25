'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface Tier {
  key: string;
  label: string;
  days: number;
  dailyRate: number;
  color: string;
}

const TIERS: Tier[] = [
  { key: 'silver', label: 'Silver', days: 180, dailyRate: 0.012, color: '#C0C0C0' },
  { key: 'gold', label: 'Gold', days: 270, dailyRate: 0.015, color: '#FFD700' },
  { key: 'platinum', label: 'Platinum', days: 360, dailyRate: 0.02, color: '#E5E4E2' },
  { key: 'diamond', label: 'Diamond', days: 540, dailyRate: 0.03, color: '#B9F2FF' },
];

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000, 25000, 50000];

export default function EarningsCalculator() {
  const [amount, setAmount] = useState(2500);
  const [tierKey, setTierKey] = useState('gold');
  const [referralCount, setReferralCount] = useState(5);
  const [referralAvgDeposit, setReferralAvgDeposit] = useState(1000);

  const tier = TIERS.find(t => t.key === tierKey) || TIERS[1];

  const stats = useMemo(() => {
    const daily = amount * tier.dailyRate;
    const weekly = daily * 7;
    const monthly = daily * 30;
    const total = daily * tier.days;
    const totalReturn = amount + total;

    // Referral estimate (profit share only - 5% of referred users' profits at L1)
    const refProfitPerUser = referralAvgDeposit * 0.015 * 30; // monthly profit per referral
    const refMonthlyCommission = refProfitPerUser * referralCount * 0.05; // 5% of their profit

    return {
      daily,
      weekly,
      monthly,
      total,
      totalReturn,
      refMonthlyCommission,
      annualizedRate: (tier.dailyRate * 365 * 100),
    };
  }, [amount, tier, referralCount, referralAvgDeposit]);

  // Chart data
  const chartPoints = useMemo(() => {
    const points: { day: number; value: number }[] = [];
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const day = Math.round((tier.days / steps) * i);
      const value = amount + amount * tier.dailyRate * day;
      points.push({ day, value });
    }
    return points;
  }, [amount, tier]);

  const maxValue = chartPoints[chartPoints.length - 1]?.value ?? amount * 2;
  const chartWidth = 340;
  const chartHeight = 180;
  const padX = 40;
  const padY = 20;

  function x(d: number) { return padX + (d / tier.days) * (chartWidth - padX - 10); }
  function y(v: number) { return chartHeight - padY - (v / maxValue) * (chartHeight - padY - 10); }

  const pathD = chartPoints.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${x(p.day)} ${y(p.value)}`
  ).join(' ');

  const areaD = `${pathD} L ${x(chartPoints[chartPoints.length - 1].day)} ${chartHeight - padY} L ${x(0)} ${chartHeight - padY} Z`;

  return (
    <div className="px-4 lg:px-6">
      {/* Amount input */}
      <div className="mb-6">
        <label className="block text-sm text-kt-text-secondary font-medium mb-2">Deposit Amount (USD)</label>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-kt-gold font-bold text-lg">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 100) setAmount(v);
            }}
            className="w-full px-4 py-3 rounded-lg text-kt-text-primary text-xl font-bold"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,215,0,0.2)',
              minHeight: 48,
            }}
          />
        </div>
        {/* Preset buttons */}
        <div className="flex flex-wrap gap-1.5">
          {PRESET_AMOUNTS.map(p => (
            <button
              key={p}
              onClick={() => setAmount(p)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition"
              style={{
                background: amount === p ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)',
                color: amount === p ? '#FFD700' : 'rgba(255,255,255,0.5)',
                border: `1px solid ${amount === p ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.06)'}`,
                minHeight: 32,
              }}
            >
              ${p >= 1000 ? `${p / 1000}k` : p}
            </button>
          ))}
        </div>
      </div>

      {/* Tier selector */}
      <div className="mb-6">
        <label className="block text-sm text-kt-text-secondary font-medium mb-2">Lock Duration</label>
        <div className="grid grid-cols-2 gap-2">
          {TIERS.map(t => (
            <button
              key={t.key}
              onClick={() => setTierKey(t.key)}
              className="p-3 rounded-lg text-left transition"
              style={{
                background: tierKey === t.key ? `${t.color}10` : 'rgba(255,255,255,0.03)',
                border: tierKey === t.key ? `2px solid ${t.color}` : '1px solid rgba(255,255,255,0.06)',
                minHeight: 44,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: t.color }}>{t.label}</span>
                <span className="text-xs text-kt-text-tertiary">{t.days} days</span>
              </div>
              <span className="text-xs text-kt-text-tertiary">{(t.dailyRate * 100).toFixed(1)}% daily</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats output */}
      <div
        className="p-5 rounded-xl mb-6"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,215,0,0.15)' }}
      >
        <h3 className="text-sm font-bold text-kt-gold mb-4">Projected Earnings</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-kt-hover-bg">
            <p className="text-[11px] text-kt-text-tertiary">Daily</p>
            <p className="text-lg font-bold text-kt-green">${stats.daily.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-kt-hover-bg">
            <p className="text-[11px] text-kt-text-tertiary">Weekly</p>
            <p className="text-lg font-bold text-kt-green">${stats.weekly.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-kt-hover-bg">
            <p className="text-[11px] text-kt-text-tertiary">Monthly</p>
            <p className="text-lg font-bold text-kt-green">${stats.monthly.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-kt-hover-bg">
            <p className="text-[11px] text-kt-text-tertiary">Total ({tier.days}d)</p>
            <p className="text-lg font-bold text-kt-gold">${stats.total.toFixed(2)}</p>
          </div>
        </div>
        <div className="mt-3 p-3 rounded-lg bg-kt-active-bg">
          <div className="flex justify-between text-xs text-kt-text-tertiary">
            <span>Deposit</span>
            <span>${amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-kt-text-tertiary mt-1">
            <span>Earnings</span>
            <span>+${stats.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold mt-1 pt-1 border-t border-white/10">
            <span className="text-kt-text-primary">Total Return</span>
            <span className="text-kt-gold">${stats.totalReturn.toFixed(2)}</span>
          </div>
        </div>
        <p className="text-[10px] text-kt-text-tertiary mt-2">
          Annualized rate: ~{stats.annualizedRate.toFixed(0)}% · Rates are projected and not guaranteed.
        </p>
      </div>

      {/* Growth chart */}
      <div
        className="p-5 rounded-xl mb-6 overflow-x-auto bg-kt-hover-bg border border-kt-border"
      >
        <h3 className="text-sm font-bold text-kt-text-primary mb-3">Growth Over Time</h3>
        <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ minWidth: 300 }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(f => (
            <g key={f}>
              <line x1={padX} y1={y(maxValue * f)} x2={chartWidth - 10} y2={y(maxValue * f)}
                stroke="rgba(255,255,255,0.06)" strokeDasharray="4 2" />
              <text x={padX - 8} y={y(maxValue * f) + 4} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="9">
                ${Math.round(maxValue * f).toLocaleString()}
              </text>
            </g>
          ))}
          {/* X axis labels */}
          {chartPoints.filter((_, i) => i % 3 === 0).map(p => (
            <text key={p.day} x={x(p.day)} y={chartHeight - 4} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="9">
              Day {p.day}
            </text>
          ))}
          {/* Area fill */}
          <path d={areaD} fill="rgba(255,215,0,0.08)" />
          {/* Line */}
          <path d={pathD} fill="none" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" />
          {/* Dots */}
          {chartPoints.map(p => (
            <circle key={p.day} cx={x(p.day)} cy={y(p.value)} r="3" fill="#1a1a2e" stroke="#FFD700" strokeWidth="1.5" />
          ))}
          {/* Start amount line */}
          <line x1={x(0)} y1={y(amount)} x2={chartWidth - 10} y2={y(amount)}
            stroke="rgba(255,255,255,0.15)" strokeDasharray="6 3" strokeWidth="1" />
          <text x={chartWidth - 12} y={y(amount) - 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="8">
            Initial deposit
          </text>
        </svg>
      </div>

      {/* Referral estimate */}
      <div
        className="p-5 rounded-xl mb-6"
        style={{ background: 'rgba(180,124,255,0.06)', border: '1px solid rgba(180,124,255,0.15)' }}
      >
        <h3 className="text-sm font-bold text-[#B47CFF] mb-3">Referral Earnings Estimate</h3>
        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1">
            <label className="text-[10px] text-kt-text-tertiary">Number of referrals</label>
            <input
              type="number"
              value={referralCount}
              onChange={(e) => setReferralCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm text-kt-text-primary"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minHeight: 40 }}
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-kt-text-tertiary">Avg deposit per referral</label>
            <input
              type="number"
              value={referralAvgDeposit}
              onChange={(e) => setReferralAvgDeposit(Math.max(100, parseInt(e.target.value, 10) || 0))}
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm text-kt-text-primary"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minHeight: 40 }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-kt-hover-bg">
            <p className="text-[11px] text-kt-text-tertiary">Est. Monthly Commission</p>
            <p className="text-lg font-bold text-[#B47CFF]">${stats.refMonthlyCommission.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-kt-hover-bg">
            <p className="text-[11px] text-kt-text-tertiary">If they also refer...</p>
            <p className="text-lg font-bold text-kt-text-secondary">
              ${(stats.refMonthlyCommission + stats.refMonthlyCommission * 0.5).toFixed(2)}
            </p>
          </div>
        </div>
        <p className="text-[10px] text-kt-text-tertiary mt-2">
          Estimated profit share commission (5% L1) from referred users&apos; daily profits.
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/deposit"
        className="block w-full py-4 rounded-xl text-center text-sm font-bold transition no-underline bg-kt-gold text-black" style={{ minHeight: 48 }}
      >
        Start Earning - Deposit Now
      </Link>
      <p className="text-center text-[10px] text-kt-text-tertiary mt-2">
        Projected earnings are estimates based on current rates. Actual returns may vary.
      </p>
    </div>
  );
}
