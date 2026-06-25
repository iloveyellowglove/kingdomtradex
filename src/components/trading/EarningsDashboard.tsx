'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { fmt } from '@/lib/utils/formatting';
import type { AITradingProfit } from '@/lib/types';

interface Props {
  profitBalance: number;
  commissionBalance: number;
  lockedBalance: number;
  activeLockCount: number;
  dailyProjection: number;
  dailyRate: number;
  profits: AITradingProfit[];
}

function startOfUTCDay() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function secondsSinceMidnightUTC() {
  return (Date.now() - startOfUTCDay().getTime()) / 1000;
}

export default function EarningsDashboard({
  profitBalance,
  commissionBalance,
  lockedBalance,
  activeLockCount,
  dailyProjection,
  dailyRate,
  profits,
}: Props) {
  const weekly = dailyProjection * 7;
  const monthly = dailyProjection * 30;

  const initialFraction = Math.min(secondsSinceMidnightUTC() / 86400, 1);
  const [liveEarnings, setLiveEarnings] = useState((dailyProjection * initialFraction).toFixed(6));
  const [fractionOfDay, setFractionOfDay] = useState(initialFraction);
  const [countdown, setCountdown] = useState({ h: '00', m: '00', s: '00' });
  const [pulse, setPulse] = useState(false);
  const prevDigitsRef = useRef('');

  const [calcAmount, setCalcAmount] = useState(50);
  const calcDaily = calcAmount * (dailyRate / 100);
  const calcWeekly = calcDaily * 7;
  const calcMonthly = calcDaily * 30;
  const calcYearly = calcDaily * 365;

  const dailyProjectionRef = useRef(dailyProjection);
  dailyProjectionRef.current = dailyProjection;

  useEffect(() => {
    let rafId: number;
    let mounted = true;

    const tick = () => {
      if (!mounted) return;

      const seconds = secondsSinceMidnightUTC();
      const fraction = Math.min(seconds / 86400, 1);
      setFractionOfDay(fraction);

      const earned = (dailyProjectionRef.current * fraction).toFixed(6);
      setLiveEarnings(earned);

      if (prevDigitsRef.current && prevDigitsRef.current !== earned) {
        setPulse(true);
        setTimeout(() => setPulse(false), 200);
      }
      prevDigitsRef.current = earned;

      const now = new Date();
      const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const diff = Math.max(0, next.getTime() - now.getTime());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown({ h: String(h).padStart(2, '0'), m: String(m).padStart(2, '0'), s: String(s).padStart(2, '0') });

      rafId = requestAnimationFrame(tick);
    };

    // Fire immediately on mount so counter starts at the correct value
    tick();

    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
    };
  }, []);

  const tierFromPercentage = (pct: number): string => {
    if (pct >= 1.79) return 'Legacy';
    if (pct >= 1.39) return 'Kingdom';
    if (pct >= 1.19) return 'Builder';
    if (pct >= 0.99) return 'Growth';
    return '';
  };

  return (
    <div className="py-4 space-y-6">
      {/* Hero Card */}
      <div className="card relative overflow-hidden" style={{
        border: '1px solid transparent',
        borderImage: 'linear-gradient(135deg, #FFD700, #6A0DAD) 1',
      }}>
        <div className="absolute left-6 top-6 pointer-events-none" style={{ opacity: 0.06 }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="36" y="8" width="8" height="64" rx="3" fill="#FFD700" />
            <rect x="10" y="32" width="60" height="8" rx="3" fill="#FFD700" />
          </svg>
        </div>
        <div className="card-body p-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-kt-gold mb-1" style={{ fontSize: '1.5rem' }}>Kingdom Yield Vault</h2>
              <p className="text-kt-text-tertiary text-sm">
                Earning from {activeLockCount} active lock{activeLockCount !== 1 ? 's' : ''}
              </p>
            </div>
            <p className="text-kt-gold text-3xl font-extrabold">Up to {dailyRate}% <span className="text-kt-text-tertiary text-sm font-normal">Daily</span></p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Available Profit" value={`${fmt(profitBalance)} USDT`} gold />

            <div className={`bg-kt-bg rounded-lg p-4 text-center col-span-2 transition-transform ${pulse ? 'scale-[1.01]' : ''}`}
              style={{
                border: '1px solid rgba(255,215,0,0.2)',
                boxShadow: pulse ? '0 0 20px rgba(255,215,0,0.15)' : 'none',
              }}>
              <p className="text-kt-text-tertiary text-xs mb-1">Daily Earnings (Live)</p>
              <p className="text-kt-gold font-bold break-all" style={{ fontSize: '1.75rem', lineHeight: 1.2 }}>
                {liveEarnings} USDT
              </p>
              <div className="mt-2 rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all" style={{
                  width: `${(fractionOfDay * 100).toFixed(1)}%`,
                  background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                  transition: 'width 0.3s linear',
                }} />
              </div>
              <p className="text-kt-text-tertiary mt-1" style={{ fontSize: '10px' }}>
                ${liveEarnings.slice(0, -2)} of ${dailyProjection.toFixed(2)} earned today
              </p>
              <p className="text-kt-text-tertiary mt-1" style={{ fontSize: '10px' }}>
                Next payout in {countdown.h}:{countdown.m}:{countdown.s}
              </p>
            </div>

            <StatCard label="Weekly (est)" value={`${fmt(weekly)} USDT`} gold />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <StatCard label="Monthly Earnings (est)" value={`${fmt(monthly)} USDT`} gold />
            <StatCard label="Locked Balance" value={`${fmt(lockedBalance)} USDT`} />
          </div>
        </div>
      </div>

      {/* Active Locks Info */}
      <div className="card">
        <div className="card-body p-6">
          <h3 className="text-lg font-bold mb-3">Your Yield Position</h3>
          <p className="mb-3">
            You have <span className="text-kt-gold font-semibold">{activeLockCount} active deposit lock{activeLockCount !== 1 ? 's' : ''}</span> generating
            {' '}<span className="text-kt-gold font-semibold">${dailyProjection.toFixed(2)} USDT/day</span> in yield.
          </p>
          <p className="text-kt-text-tertiary text-sm mb-4">
            Available profit balance: <span className="text-green-400 font-semibold">${profitBalance.toFixed(2)} USDT</span>
            {commissionBalance > 0 && (
              <> &middot; Commission balance: <span className="text-purple-400 font-semibold">${commissionBalance.toFixed(2)} USDT</span></>
            )}
          </p>
          <div className="flex gap-3">
            <Link href="/deposit" className="btn-primary inline-block px-6 py-3 rounded-lg text-sm font-semibold">
              Deposit More
            </Link>
            <Link href="/withdrawals" className="inline-block px-6 py-3 rounded-lg text-sm font-semibold transition-all" style={{
              border: '1px solid #FFD700', color: '#FFD700',
            }}>
              Withdraw Earnings
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive Yield Calculator */}
      <div className="card">
        <div className="card-body p-6">
          <h3 className="text-lg font-bold mb-4">Yield Calculator</h3>
          <p className="text-kt-text-tertiary text-sm mb-4">See how your assets can grow at up to {dailyRate}% daily</p>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-kt-text-tertiary text-sm">Simulated Stake Amount</span>
              <span className="text-kt-gold text-2xl font-bold">${calcAmount.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={50}
              max={100000}
              step={50}
              value={calcAmount}
              onChange={(e) => setCalcAmount(Number(e.target.value))}
              className="w-full"
              style={{
                WebkitAppearance: 'none',
                appearance: 'none',
                height: '8px',
                borderRadius: '4px',
                background: `linear-gradient(to right, #FFD700 0%, #FFD700 ${((calcAmount - 50) / (100000 - 50)) * 100}%, #261f3a ${((calcAmount - 50) / (100000 - 50)) * 100}%, #261f3a 100%)`,
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
            <div className="flex justify-between text-kt-text-tertiary text-xs mt-1">
              <span>$50</span>
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
                  <th className="text-left p-3">Tier</th>
                  <th className="text-left p-3">Profit Earned</th>
                </tr>
              </thead>
              <tbody>
                {profits.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3">{p.date}</td>
                    <td className="p-3">{p.percentage}%</td>
                    <td className="p-3">
                      {p.deposit_lock_id ? (
                        <span className="px-2 py-0.5 rounded text-xs font-bold" style={{
                          background: 'rgba(255,215,0,0.1)', color: '#FFD700',
                        }}>
                          {tierFromPercentage(p.percentage)}
                        </span>
                      ) : (
                        <span className="text-kt-text-tertiary">-</span>
                      )}
                    </td>
                    <td className="p-3 text-kt-gold font-semibold">{Number(p.amount).toFixed(2)} USDT</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center">
              <p className="text-kt-text-tertiary mb-0">No earnings history yet.</p>
              <p className="text-kt-text-tertiary text-xs mt-1">Profits are credited daily to your Available Profit balance. Check back after the next daily distribution.</p>
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
    <div className="bg-kt-bg rounded-lg p-4 text-center">
      <p className="text-kt-text-tertiary text-xs mb-1">{label}</p>
      <p className={`text-lg md:text-xl font-bold break-all ${gold ? 'text-kt-gold' : 'text-kt-text-primary'}`}>
        {value}
      </p>
    </div>
  );
}

function CalcResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-kt-bg rounded-lg p-3 text-center">
      <p className="text-kt-text-tertiary text-xs mb-1">{label}</p>
      <p className="text-kt-gold text-lg font-bold">{value} USDT</p>
    </div>
  );
}
