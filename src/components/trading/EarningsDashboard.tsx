'use client';

import { useState } from 'react';
import Link from 'next/link';
import { fmt } from '@/lib/utils/formatting';
import type { AITradingProfit } from '@/lib/types';

interface Props {
  balance: number;
  dailyRate: number;
  profits: AITradingProfit[];
}

export default function EarningsDashboard({ balance, dailyRate, profits }: Props) {
  const daily = balance * (dailyRate / 100);
  const weekly = daily * 7;
  const monthly = daily * 30;

  // Interactive calculator state
  const [calcAmount, setCalcAmount] = useState(1000);
  const calcDaily = calcAmount * (dailyRate / 100);
  const calcWeekly = calcDaily * 7;
  const calcMonthly = calcDaily * 30;
  const calcYearly = calcDaily * 365;

  return (
    <div className="py-4 space-y-6">
      {/* Hero Card */}
      <div className="card relative overflow-hidden" style={{
        border: '1px solid transparent',
        borderImage: 'linear-gradient(135deg, #FFD700, #6A0DAD) 1',
      }}>
        {/* Faint cross behind title */}
        <div className="absolute left-6 top-6 pointer-events-none" style={{ opacity: 0.06 }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="36" y="8" width="8" height="64" rx="3" fill="#FFD700" />
            <rect x="10" y="32" width="60" height="8" rx="3" fill="#FFD700" />
          </svg>
        </div>
        <div className="card-body p-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-temple-gold mb-1" style={{ fontSize: '1.5rem' }}>Kingdom Yield Vault</h2>
              <p className="text-text-muted text-sm">Your balance earns yield daily through AI-powered trading</p>
            </div>
            <p className="text-temple-gold text-3xl font-extrabold">{dailyRate}% <span className="text-text-muted text-sm font-normal">Daily</span></p>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Staked Balance" value={`${fmt(balance)} USDT`} gold />
            <StatCard label="Daily Earnings" value={`${fmt(daily)} USDT`} gold />
            <StatCard label="Weekly Earnings" value={`${fmt(weekly)} USDT`} gold />
            <StatCard label="Monthly Earnings" value={`${fmt(monthly)} USDT`} gold />
          </div>
        </div>
      </div>

      {/* Interactive Yield Calculator */}
      <div className="card">
        <div className="card-body p-6">
          <h3 className="text-lg font-bold mb-4">Yield Calculator</h3>
          <p className="text-text-muted text-sm mb-4">See how your assets can grow at {dailyRate}% daily</p>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-text-muted text-sm">Simulated Stake Amount</span>
              <span className="text-temple-gold text-2xl font-bold">${calcAmount.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={100}
              max={100000}
              step={100}
              value={calcAmount}
              onChange={(e) => setCalcAmount(Number(e.target.value))}
              className="w-full"
              style={{
                WebkitAppearance: 'none',
                appearance: 'none',
                height: '8px',
                borderRadius: '4px',
                background: `linear-gradient(to right, #FFD700 0%, #FFD700 ${((calcAmount - 100) / (100000 - 100)) * 100}%, #261f3a ${((calcAmount - 100) / (100000 - 100)) * 100}%, #261f3a 100%)`,
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <style jsx>{`
              input[type='range']::-webkit-slider-thumb {
                -webkit-appearance: none; appearance: none;
                width: 24px; height: 24px; border-radius: 50%;
                background: #FFD700; border: 3px solid #0e0b1a;
                box-shadow: 0 0 12px rgba(255,215,0,0.4); cursor: pointer;
              }
              input[type='range']::-moz-range-thumb {
                width: 24px; height: 24px; border-radius: 50%;
                background: #FFD700; border: 3px solid #0e0b1a;
                box-shadow: 0 0 12px rgba(255,215,0,0.4); cursor: pointer;
              }
            `}</style>
            <div className="flex justify-between text-text-muted text-xs mt-1">
              <span>$100</span>
              <span>$50,000</span>
              <span>$100,000</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <CalcResultCard label="Daily" value={fmt(calcDaily)} />
            <CalcResultCard label="Weekly" value={fmt(calcWeekly)} />
            <CalcResultCard label="Monthly" value={fmt(calcMonthly)} />
            <CalcResultCard label="Yearly" value={fmt(calcYearly)} />
          </div>
        </div>
      </div>

      {/* Earnings History Table */}
      <div className="card">
        <div className="card-header"><h5 className="mb-0">Earnings History</h5></div>
        <div className="card-body p-0">
          {profits.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Rate</th>
                  <th className="text-left p-3">Profit Earned</th>
                </tr>
              </thead>
              <tbody>
                {profits.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3">{p.date}</td>
                    <td className="p-3">{p.percentage}%</td>
                    <td className="p-3 text-temple-gold font-semibold">{Number(p.amount).toFixed(2)} USDT</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center">
              <p className="text-text-muted mb-0">No earnings history yet.</p>
              <p className="text-text-muted text-xs mt-1">Profits are credited daily to your balance. Check back after the next daily distribution.</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/deposit" className="btn-primary inline-block px-10 py-4 rounded-xl text-lg font-bold text-center">
          Deposit Funds
        </Link>
        <Link href="/withdrawals" className="inline-block px-10 py-4 rounded-xl text-lg font-semibold text-center transition-all" style={{
          border: '1px solid #FFD700', color: '#FFD700',
        }}>
          Withdraw Earnings
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="bg-dark-indigo rounded-lg p-4 text-center">
      <p className="text-text-muted text-xs mb-1">{label}</p>
      <p className={`text-lg md:text-xl font-bold break-all ${gold ? 'text-temple-gold' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}

function CalcResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-dark-indigo rounded-lg p-3 text-center">
      <p className="text-text-muted text-xs mb-1">{label}</p>
      <p className="text-temple-gold text-lg font-bold">{value} USDT</p>
    </div>
  );
}
