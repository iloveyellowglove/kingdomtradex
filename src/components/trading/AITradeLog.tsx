'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

interface AITrade {
  time: string;
  pair: string;
  side: 'BUY' | 'SELL';
  amount: number;
  price: number;
  strategy: string;
  pl: number;
}

interface AITradeLogProps {
  userId: number;
  balance: number;
  dailyRate: number;
}

const PAIR_LIST = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'ETH/BTC'];
const STRATEGIES = ['Arbitrage', 'Momentum', 'Mean Reversion', 'Range Bound'];
const VERBS = ['analyzing', 'scanning', 'evaluating', 'executing on'];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function getUTCDay(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

function generateTrades(userId: number, dailyProjection: number): AITrade[] {
  const seed = hashCode(`${userId}_${getUTCDay()}`);
  const rand = seededRandom(seed);
  const count = 8 + Math.floor(rand() * 11); // 8-18 trades
  const trades: AITrade[] = [];

  // Distribute projection across trades with variance
  const weights: number[] = [];
  for (let i = 0; i < count; i++) {
    weights.push(0.3 + rand() * 1.4); // random weight 0.3-1.7
  }
  const totalWeight = weights.reduce((s, w) => s + w, 0);

  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  for (let i = 0; i < count; i++) {
    const pair = PAIR_LIST[Math.floor(rand() * PAIR_LIST.length)];
    const side = rand() > 0.5 ? 'BUY' : 'SELL';
    const strategy = STRATEGIES[Math.floor(rand() * STRATEGIES.length)];

    // Random time throughout the day (only past)
    const maxSeconds = Math.min(
      (now.getTime() - dayStart.getTime()) / 1000,
      86399
    );
    const tradeSeconds = Math.floor(rand() * Math.max(maxSeconds, 60));
    const tradeDate = new Date(dayStart.getTime() + tradeSeconds * 1000);
    const timeStr = tradeDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Profit proportional to weight, with occasional small loss (~12% chance)
    let pl = (dailyProjection * (weights[i] / totalWeight));
    if (rand() < 0.12) {
      pl = -(rand() * dailyProjection * 0.03); // small loss, up to 3% of daily
    }
    pl = Math.round(pl * 100) / 100;

    // Price and amount based on pair
    const basePrice = pair === 'BTC/USDT' ? 67500 : pair === 'ETH/USDT' ? 3450 : pair === 'SOL/USDT' ? 145 : pair === 'BNB/USDT' ? 580 : 19.5;
    const price = basePrice + (rand() - 0.5) * basePrice * 0.02;
    const amount = Math.max(0.001, (dailyProjection * 0.3) / price + (rand() - 0.5) * (dailyProjection * 0.2) / price);

    trades.push({
      time: timeStr,
      pair,
      side: side as 'BUY' | 'SELL',
      amount: Math.round(amount * 10000) / 10000,
      price: Math.round(price * 100) / 100,
      strategy,
      pl,
    });
  }

  // Sort newest first
  trades.sort((a, b) => b.time.localeCompare(a.time));
  return trades;
}

export default function AITradeLog({ userId, balance, dailyRate }: AITradeLogProps) {
  const dailyProjection = balance * (dailyRate / 100);
  const trades = useMemo(() => generateTrades(userId, dailyProjection), [userId, dailyProjection]);

  const winCount = trades.filter((t) => t.pl >= 0).length;
  const winRate = trades.length > 0 ? Math.round((winCount / trades.length) * 100) : 0;
  const totalPL = trades.reduce((s, t) => s + t.pl, 0);

  // Cycling AI status
  const [statusIdx, setStatusIdx] = useState(0);
  const [verbIdx, setVerbIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setStatusIdx((p) => (p + 1) % PAIR_LIST.length);
      setVerbIdx((p) => (p + 1) % VERBS.length);
    }, 8000 + Math.random() * 7000);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="rounded-xl flex flex-col" style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      height: '100%',
    }}>
      {/* AI Status line */}
      <div className="p-3 border-b flex items-center gap-2 flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#22c55e',
          boxShadow: '0 0 6px rgba(34,197,94,0.5)',
          animation: 'pulse-dot 1.5s ease-in-out infinite',
          flexShrink: 0,
        }} />
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
          AI is {VERBS[verbIdx]} <span style={{ color: '#FFD700' }}>{PAIR_LIST[statusIdx]}</span>...
        </span>
        <style jsx>{`
          @keyframes pulse-dot {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </div>

      {/* Trade table */}
      <div className="overflow-y-auto flex-1">
        <table className="w-full" style={{ fontSize: '11px' }}>
          <thead>
            <tr>
              <th className="text-left p-2 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Time</th>
              <th className="text-left p-2 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Pair</th>
              <th className="text-left p-2 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Side</th>
              <th className="text-right p-2 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Amount</th>
              <th className="text-right p-2 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Price</th>
              <th className="text-left p-2 font-normal hidden md:table-cell" style={{ color: 'rgba(255,255,255,0.4)' }}>Strategy</th>
              <th className="text-right p-2 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>P/L</th>
            </tr>
          </thead>
          <tbody>
            {trades.slice(0, 20).map((t, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td className="p-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.time}</td>
                <td className="p-2" style={{ color: 'rgba(255,255,255,0.8)' }}>{t.pair}</td>
                <td className="p-2" style={{ color: t.side === 'BUY' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                  {t.side}
                </td>
                <td className="text-right p-2" style={{ color: 'rgba(255,255,255,0.7)' }}>{t.amount.toFixed(4)}</td>
                <td className="text-right p-2" style={{ color: 'rgba(255,255,255,0.7)' }}>{t.price.toFixed(2)}</td>
                <td className="p-2 hidden md:table-cell" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.strategy}</td>
                <td className="text-right p-2 font-medium" style={{ color: t.pl >= 0 ? '#FFD700' : 'rgba(239,68,68,0.7)' }}>
                  {t.pl >= 0 ? '+' : ''}{t.pl.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      <div className="p-3 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
          Win rate today: <span style={{ color: '#FFD700' }}>{winRate}%</span> ({winCount}/{trades.length} trades)
        </span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: totalPL >= 0 ? '#FFD700' : '#ef4444' }}>
          Today&apos;s P/L: {totalPL >= 0 ? '+' : ''}{totalPL.toFixed(2)} USDT
        </span>
      </div>
    </div>
  );
}
