'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

interface AITrade {
  time: string;
  pair: string;
  base: string;
  side: 'BUY' | 'SELL';
  amount: number;
  price: number;
  strategy: string;
  tier: string;
  pl: number;
}

const TIER_LABELS: Record<string, string> = {
  growth: 'Growth',
  builder: 'Builder',
  kingdom: 'Kingdom',
  legacy: 'Legacy',
};

interface AITradeLogProps {
  userId: number;
  dailyProjection: number;
  activeLockCount: number;
  activeTiers: string[];
}

const PAIR_LIST = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'ETH/BTC'];
const PAIR_BASE: Record<string, string> = { 'BTC/USDT': 'BTC', 'ETH/USDT': 'ETH', 'SOL/USDT': 'SOL', 'BNB/USDT': 'BNB', 'ETH/BTC': 'ETH/BTC' };
const WIN_STRATEGIES = ['Arbitrage', 'Mean Reversion'];
const LOSS_STRATEGIES = ['Momentum', 'Range Bound'];
const ALL_STRATEGIES = ['Arbitrage', 'Momentum', 'Mean Reversion', 'Range Bound'];
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

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateTrades(userId: number, _dailyProjection: number, activeTiers: string[]): AITrade[] {
  const seed = hashCode(`${userId}_${getUTCDay()}`);
  const rand = seededRandom(seed);
  const N = 8 + Math.floor(rand() * 11); // 8-18 trades

  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const tiers = activeTiers.length > 0 ? activeTiers : ['growth'];

  // Win rate between 70% and 80%
  const winRate = 0.70 + rand() * 0.10;
  const winCount = Math.round(N * winRate);
  const lossCount = N - winCount;

  // Wins: +0.50 to +5.00
  const wins: number[] = [];
  for (let i = 0; i < winCount; i++) {
    wins.push(Math.round((0.50 + rand() * 4.50) * 100) / 100);
  }

  // Losses: -0.25 to -3.00
  const losses: number[] = [];
  for (let i = 0; i < lossCount; i++) {
    losses.push(Math.round((0.25 + rand() * 2.75) * 100) / 100);
  }

  // Build trades
  const winTrades: AITrade[] = wins.map((pl, i) =>
    makeTrade(rand, i, dayStart, now, pl, true, tiers)
  );
  const lossTrades: AITrade[] = losses.map((pl, i) =>
    makeTrade(rand, winCount + i, dayStart, now, -pl, false, tiers)
  );

  // Shuffle and sort newest first
  const all = shuffle([...winTrades, ...lossTrades], rand);
  all.sort((a, b) => b.time.localeCompare(a.time));
  return all;
}

function makeTrade(
  rand: () => number,
  index: number,
  dayStart: Date,
  now: Date,
  pl: number,
  isWin: boolean,
  tiers: string[],
): AITrade {
  const pair = PAIR_LIST[Math.floor(rand() * PAIR_LIST.length)];
  const side = rand() > 0.5 ? 'BUY' : 'SELL';
  const tier = TIER_LABELS[tiers[Math.floor(rand() * tiers.length)]] || 'Growth';

  let strategy: string;
  if (isWin) {
    strategy = WIN_STRATEGIES[Math.floor(rand() * WIN_STRATEGIES.length)];
  } else {
    strategy = LOSS_STRATEGIES[Math.floor(rand() * LOSS_STRATEGIES.length)];
  }
  if (rand() < 0.20) {
    strategy = ALL_STRATEGIES[Math.floor(rand() * ALL_STRATEGIES.length)];
  }

  const maxSeconds = Math.min(
    (now.getTime() - dayStart.getTime()) / 1000,
    86399
  );
  const tradeSeconds = Math.floor((index / 18) * maxSeconds + rand() * Math.max(maxSeconds / 18, 60));
  const tradeDate = new Date(dayStart.getTime() + Math.min(tradeSeconds, maxSeconds) * 1000);
  const timeStr = tradeDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

  const basePrice = pair === 'BTC/USDT' ? 67500 : pair === 'ETH/USDT' ? 3450 : pair === 'SOL/USDT' ? 145 : pair === 'BNB/USDT' ? 580 : 19.5;
  const price = Math.round((basePrice + (rand() - 0.5) * basePrice * 0.02) * 100) / 100;
  const amount = Math.max(0.001, Math.round(((Math.abs(pl) * 5) / price * 10000)) / 10000);

  return {
    time: timeStr,
    pair,
    base: PAIR_BASE[pair] || pair,
    side: side as 'BUY' | 'SELL',
    amount,
    price,
    strategy,
    tier,
    pl: Math.round(pl * 100) / 100,
  };
}

export default function AITradeLog({ userId, dailyProjection, activeLockCount, activeTiers }: AITradeLogProps) {
  const trades = useMemo(() => generateTrades(userId, dailyProjection, activeTiers), [userId, dailyProjection, activeTiers]);

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
      <div className="overflow-y-auto flex-1" style={{ overflowX: 'auto' }}>
        <table className="w-full" style={{ fontSize: '12px' }}>
          <thead>
            <tr>
              <th className="text-left px-1 py-1.5 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Time</th>
              <th className="text-left px-1 py-1.5 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Pair</th>
              <th className="text-left px-1 py-1.5 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Tier</th>
              <th className="text-left px-1 py-1.5 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Side</th>
              <th className="text-right px-1 py-1.5 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Amt</th>
              <th className="text-right px-1 py-1.5 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Price</th>
              <th className="text-right px-1 py-1.5 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>P/L</th>
            </tr>
          </thead>
          <tbody>
            {trades.slice(0, 20).map((t, i) => (
              <tr
                key={i}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                title={`${t.strategy} · ${t.tier} · ${t.pair}`}
              >
                <td className="px-1 py-1" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{t.time}</td>
                <td className="px-1 py-1" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>{t.base}</td>
                <td className="px-1 py-1">
                  <span style={{ fontSize: '10px', padding: '0px 4px', borderRadius: '3px', background: 'rgba(255,215,0,0.1)', color: '#FFD700' }}>
                    {t.tier}
                  </span>
                </td>
                <td className="px-1 py-1">
                  <span style={{ fontSize: '10px', padding: '0px 4px', borderRadius: '3px', background: t.side === 'BUY' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: t.side === 'BUY' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                    {t.side}
                  </span>
                </td>
                <td className="text-right px-1 py-1" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
                  {t.amount < 0.01 ? t.amount.toFixed(4) : t.amount.toFixed(2)}
                </td>
                <td className="text-right px-1 py-1" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
                  {t.price < 10 ? t.price.toFixed(4) : t.price.toFixed(2)}
                </td>
                <td className="text-right px-1 py-1 font-medium" style={{
                  color: t.pl >= 0 ? '#FFD700' : '#c4524a',
                  fontSize: '11px',
                }}>
                  {t.pl >= 0 ? '+' : '-'}{Math.abs(t.pl).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      <div className="p-3 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
            Win rate: <span style={{ color: '#FFD700' }}>{winRate}%</span> ({winCount}/{trades.length})
          </span>
          {activeLockCount > 0 && (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>
              &middot; {activeLockCount} active lock{activeLockCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span style={{ fontSize: '13px', fontWeight: 700, color: totalPL >= 0 ? '#FFD700' : '#ef4444' }}>
          Today&apos;s P/L: {totalPL >= 0 ? '+' : ''}{totalPL.toFixed(2)} USDT
        </span>
      </div>
    </div>
  );
}
