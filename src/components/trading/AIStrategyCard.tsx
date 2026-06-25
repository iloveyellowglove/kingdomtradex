'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Props {
  lockedBalance: number;
  activeLockCount: number;
  highestTierRate: number;
  totalEarned: number;
}

export default function AIStrategyCard({ lockedBalance, activeLockCount, highestTierRate, totalEarned }: Props) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    function tick() {
      const now = new Date();
      const next = new Date(now);
      next.setUTCHours(24, 0, 0, 0);
      const diff = next.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const rateDisplay = activeLockCount > 0 ? `${(highestTierRate * 100).toFixed(1)}%` : `Up to 1.6%`;

  return (
    <div className="rounded-xl p-4" style={{ background: '#1E2329', border: '1px solid #2B3139' }}>
      <h3 className="text-sm font-bold text-[#EAECEF] mb-1">Your Active Strategy</h3>
      <p className="text-xs text-[#848E9C] mb-3">Multi-Exchange Arbitrage &amp; Momentum</p>

      <div className="grid grid-cols-2 gap-2 mb-2">
        {[
          { l: 'Daily Yield Rate', v: rateDisplay, c: '#0ECB81' },
          { l: 'Locked Balance', v: `$${lockedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, c: '#EAECEF' },
          { l: 'Active Locks', v: `${activeLockCount}`, c: '#F0B90B' },
          { l: 'Next Distribution', v: countdown, c: '#848E9C' },
        ].map(s => (
          <div key={s.l} className="p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-[10px] text-[#5E6673] mb-0.5">{s.l}</p>
            <p className="text-sm font-bold tabular-nums" style={{ color: s.c }}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* 5th stat: total earnings */}
      <div className="p-2.5 rounded-lg mb-3" style={{ background: 'rgba(14,203,129,0.05)', border: '1px solid rgba(14,203,129,0.1)' }}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#5E6673]">Your Total Earnings</span>
          <span className="text-base font-bold text-[#0ECB81] tabular-nums">
            ${totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <p className="text-xs text-[#848E9C] mb-3">
        Your locked deposits earn projected daily yield automatically. The AI engine manages all trading on your behalf.
      </p>

      <Link href="/earnings"
        className="inline-block px-5 py-2.5 rounded-lg text-sm font-semibold no-underline transition"
        style={{ background: '#F0B90B', color: '#0B0E11' }}>
        View Your Earnings
      </Link>
    </div>
  );
}
