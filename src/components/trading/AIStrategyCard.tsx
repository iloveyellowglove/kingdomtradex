'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Props { dailyRate: number; lockedBalance: number; activeLockCount: number; activeTiers: string[]; }

export default function AIStrategyCard({ dailyRate, lockedBalance, activeLockCount, activeTiers }: Props) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    function tick() {
      const now = new Date();
      // Next distribution at midnight UTC
      const next = new Date(now);
      next.setUTCHours(24, 0, 0, 0);
      const diff = next.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setCountdown(`${h}h ${m}m`);
    }
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-xl p-5" style={{ background: '#1E2329', border: '1px solid #2B3139' }}>
      <h3 className="text-base font-bold text-[#EAECEF] mb-1">Active Strategy</h3>
      <p className="text-sm text-[#848E9C] mb-4">Multi-Exchange Arbitrage &amp; Momentum</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { l: 'Daily Yield Rate', v: `Up to ${dailyRate}%`, c: '#0ECB81' },
          { l: 'Locked Balance', v: `$${lockedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT`, c: '#EAECEF' },
          { l: 'Active Locks', v: `${activeLockCount}`, c: '#F0B90B' },
          { l: 'Next Distribution', v: countdown, c: '#848E9C' },
        ].map(s => (
          <div key={s.l} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-[10px] text-[#5E6673] mb-1">{s.l}</p>
            <p className="text-sm font-bold tabular-nums" style={{ color: s.c }}>{s.v}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-[#848E9C] mb-4">
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
