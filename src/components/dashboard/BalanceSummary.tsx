'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface Props {
  totalValue: number;
  profitBalance: number;
  commissionBalance: number;
  lockedBalance: number;
  todayPnL: number;
  todayPnLPercent: number;
  recentEarnings: number[]; // last 7-14 days of earnings for sparkline
}

export default function BalanceSummary({
  totalValue,
  profitBalance,
  lockedBalance,
  todayPnL,
  todayPnLPercent,
  recentEarnings,
}: Props) {
  const [hidden, setHidden] = useState(false);

  // Sparkline SVG
  const sparkline = useMemo(() => {
    const values = recentEarnings.length > 0 ? recentEarnings : [0, 0, 0, 0, 0, 0, 0];
    const max = Math.max(...values, 0.01);
    const min = Math.min(...values, 0);
    const w = 120; const h = 32; const pad = 2;
    const points = values.map((v, i) => `${(i / (values.length - 1)) * (w - pad * 2) + pad},${h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2)}`).join(' ');
    const areaPoints = `${pad},${h - pad} ${points} ${w - pad},${h - pad}`;
    const isUp = values.length >= 2 && values[values.length - 1] >= values[0];

    return { points, areaPoints, isUp, w, h };
  }, [recentEarnings]);

  const fmt = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-4">
      {/* Est. Total Value */}
      <div className="text-center">
        <p className="text-xs text-kt-text-tertiary mb-1">Est. Total Value</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl sm:text-4xl font-bold text-kt-text-primary tabular-nums">
            {hidden ? '••••••' : `$${fmt(totalValue)}`}
          </span>
          <button
            onClick={() => setHidden(!hidden)}
            className="p-1.5 rounded-md hover:bg-white/5 transition"
            aria-label={hidden ? 'Show balance' : 'Hide balance'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-kt-text-tertiary">
              {hidden ? (
                <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
              ) : (
                <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Today's PnL + sparkline */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs text-kt-text-tertiary">Today&apos;s PnL </span>
          <span className={`text-sm font-bold tabular-nums ${todayPnL >= 0 ? 'text-kt-green' : 'text-[#F44336]'}`}>
            {todayPnL >= 0 ? '+' : ''}{fmt(todayPnL)} ({todayPnLPercent >= 0 ? '+' : ''}{todayPnLPercent.toFixed(2)}%)
          </span>
        </div>
        <svg width={sparkline.w} height={sparkline.h} viewBox={`0 0 ${sparkline.w} ${sparkline.h}`} className="flex-shrink-0">
          <polygon points={sparkline.areaPoints} fill={sparkline.isUp ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)'} />
          <polyline points={sparkline.points} fill="none" stroke={sparkline.isUp ? '#4CAF50' : '#F44336'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Sub-balances */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-kt-hover-bg">
          <p className="text-[10px] text-kt-text-tertiary">Profit</p>
          <p className="text-sm font-bold text-kt-green tabular-nums">{hidden ? '•••' : `$${fmt(profitBalance)}`}</p>
        </div>
        <div className="p-2 rounded-lg bg-kt-hover-bg">
          <p className="text-[10px] text-kt-text-tertiary">Locked</p>
          <p className="text-sm font-bold text-kt-gold tabular-nums">{hidden ? '•••' : `$${fmt(lockedBalance)}`}</p>
        </div>
        <div className="p-2 rounded-lg bg-kt-hover-bg">
          <p className="text-[10px] text-kt-text-tertiary">Commissions</p>
          <p className="text-sm font-bold text-[#B47CFF] tabular-nums">{hidden ? '•••' : `$${fmt(profitBalance > 0 ? 0 : 0)}`}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Link
          href="/deposit"
          className="flex-1 py-2.5 rounded-full text-center text-xs font-bold no-underline bg-kt-gold text-black" style={{ minHeight: 44 }}
        >
          Deposit
        </Link>
        <Link
          href="/withdraw"
          className="flex-1 py-2.5 rounded-full text-center text-xs font-bold no-underline border border-kt-border text-kt-text-primary bg-kt-hover-bg"
        >
          Withdraw
        </Link>
        <Link
          href="/withdraw?tab=auto"
          className="flex-1 py-2.5 rounded-full text-center text-xs font-bold no-underline border border-blue-500/20 text-blue-500 bg-blue-500/10"
        >
          Auto
        </Link>
      </div>
    </div>
  );
}
