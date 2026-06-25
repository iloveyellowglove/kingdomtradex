'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface AITrade {
  id: number;
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

interface AITradeLogProps {
  userId: number;
  dailyProjection: number;
  activeLockCount: number;
  activeTiers: string[];
}

const PAIR_LIST = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'ETH/BTC', 'SOL/ETH'];
const PAIR_BASE: Record<string, string> = {
  'BTC/USDT': 'BTC', 'ETH/USDT': 'ETH', 'SOL/USDT': 'SOL',
  'BNB/USDT': 'BNB', 'ETH/BTC': 'ETH/BTC', 'SOL/ETH': 'SOL/ETH',
};
const PAIR_PRICES: Record<string, number> = {
  'BTC/USDT': 67500, 'ETH/USDT': 3450, 'SOL/USDT': 145,
  'BNB/USDT': 580, 'ETH/BTC': 0.051, 'SOL/ETH': 0.042,
};
const PAIR_AMT_MIN: Record<string, number> = {
  'BTC/USDT': 0.0005, 'ETH/USDT': 0.005, 'SOL/USDT': 0.05,
  'BNB/USDT': 0.01, 'ETH/BTC': 0.1, 'SOL/ETH': 0.5,
};
const PAIR_AMT_MAX: Record<string, number> = {
  'BTC/USDT': 0.005, 'ETH/USDT': 0.05, 'SOL/USDT': 0.5,
  'BNB/USDT': 0.1, 'ETH/BTC': 2.0, 'SOL/ETH': 5.0,
};

const ALL_STRATEGIES = ['Arbitrage', 'Momentum', 'Mean Reversion', 'Range Bound'];
const VERBS = ['analyzing', 'scanning', 'evaluating', 'executing on'];

let tradeIdCounter = Date.now();

function randomPair(): string {
  return PAIR_LIST[Math.floor(Math.random() * PAIR_LIST.length)];
}

function randomTier(): string {
  const r = Math.random();
  if (r < 0.40) return 'Growth';
  if (r < 0.70) return 'Builder';
  if (r < 0.90) return 'Kingdom';
  return 'Legacy';
}

function randomAmount(pair: string): number {
  const min = PAIR_AMT_MIN[pair] || 0.001;
  const max = PAIR_AMT_MAX[pair] || 0.01;
  const amt = min + Math.random() * (max - min);
  if (pair === 'BTC/USDT') return Math.round(amt * 100000) / 100000;
  if (pair === 'ETH/USDT' || pair === 'SOL/USDT' || pair === 'BNB/USDT') return Math.round(amt * 10000) / 10000;
  return Math.round(amt * 1000) / 1000;
}

function randomPrice(pair: string): number {
  const base = PAIR_PRICES[pair] || 100;
  const variance = base * 0.001;
  const price = base + (Math.random() - 0.5) * variance * 2;
  if (base < 1) return Math.round(price * 100000) / 100000;
  if (base < 10) return Math.round(price * 1000) / 1000;
  return Math.round(price * 100) / 100;
}

function timeStr(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
}

function generateSingleTrade(): AITrade {
  const pair = randomPair();
  const isWin = Math.random() < 0.75;
  const pl = isWin
    ? Math.round((0.50 + Math.random() * 7.50) * 100) / 100
    : -(Math.round((0.25 + Math.random() * 3.75) * 100) / 100);

  return {
    id: ++tradeIdCounter,
    time: timeStr(new Date()),
    pair,
    base: PAIR_BASE[pair] || pair,
    side: Math.random() < 0.55 ? 'BUY' : 'SELL',
    amount: randomAmount(pair),
    price: randomPrice(pair),
    strategy: ALL_STRATEGIES[Math.floor(Math.random() * ALL_STRATEGIES.length)],
    tier: randomTier(),
    pl,
  };
}

function generateInitialTrades(): AITrade[] {
  const count = 15 + Math.floor(Math.random() * 6);
  const now = Date.now();
  const threeHoursMs = 3 * 60 * 60 * 1000;
  const trades: AITrade[] = [];

  for (let i = 0; i < count; i++) {
    const offset = Math.floor((i / count) * threeHoursMs + Math.random() * (threeHoursMs / count));
    const tradeTime = new Date(now - threeHoursMs + offset);
    const pair = randomPair();
    const isWin = Math.random() < 0.75;
    const pl = isWin
      ? Math.round((0.50 + Math.random() * 7.50) * 100) / 100
      : -(Math.round((0.25 + Math.random() * 3.75) * 100) / 100);

    trades.push({
      id: ++tradeIdCounter,
      time: timeStr(tradeTime),
      pair,
      base: PAIR_BASE[pair] || pair,
      side: Math.random() < 0.55 ? 'BUY' : 'SELL',
      amount: randomAmount(pair),
      price: randomPrice(pair),
      strategy: ALL_STRATEGIES[Math.floor(Math.random() * ALL_STRATEGIES.length)],
      tier: randomTier(),
      pl,
    });
  }

  trades.sort((a, b) => b.time.localeCompare(a.time));
  return trades;
}

export default function AITradeLog({ activeLockCount }: AITradeLogProps) {
  const [trades, setTrades] = useState<AITrade[]>(() => generateInitialTrades());
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [statusIdx, setStatusIdx] = useState(0);
  const [verbIdx, setVerbIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const statusIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const addTrade = useCallback(() => {
    const newTrade = generateSingleTrade();
    setTrades((prev) => {
      const updated = [newTrade, ...prev];
      if (updated.length > 50) updated.pop();
      return updated;
    });
    setHighlightId(newTrade.id);
    setTimeout(() => setHighlightId(null), 1000);
  }, []);

  // Live trade generation every 15-45 seconds
  useEffect(() => {
    const scheduleNext = () => {
      const delay = 15000 + Math.random() * 30000;
      timerRef.current = setTimeout(() => {
        addTrade();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => clearTimeout(timerRef.current);
  }, [addTrade]);

  // Cycling AI status text
  useEffect(() => {
    statusIntervalRef.current = setInterval(() => {
      setStatusIdx((p) => (p + 1) % PAIR_LIST.length);
      setVerbIdx((p) => (p + 1) % VERBS.length);
    }, 8000 + Math.random() * 7000);
    return () => clearInterval(statusIntervalRef.current);
  }, []);

  const winCount = trades.filter((t) => t.pl >= 0).length;
  const winRate = trades.length > 0 ? Math.round((winCount / trades.length) * 100) : 0;
  const totalPL = trades.reduce((s, t) => s + t.pl, 0);

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
        <table className="w-full" style={{ fontSize: '12px', minWidth: 340 }}>
          <thead>
            <tr>
              <th className="text-left px-1 py-1.5 font-normal" style={{ color: 'var(--kt-text-tertiary)' }}>Time</th>
              <th className="text-left px-1 py-1.5 font-normal" style={{ color: 'var(--kt-text-tertiary)' }}>Pair</th>
              <th className="text-left px-1 py-1.5 font-normal hidden md:table-cell" style={{ color: 'var(--kt-text-tertiary)' }}>Tier</th>
              <th className="text-left px-1 py-1.5 font-normal" style={{ color: 'var(--kt-text-tertiary)' }}>Side</th>
              <th className="text-right px-1 py-1.5 font-normal hidden xl:table-cell" style={{ color: 'var(--kt-text-tertiary)' }}>Amt</th>
              <th className="text-right px-1 py-1.5 font-normal hidden xl:table-cell" style={{ color: 'var(--kt-text-tertiary)' }}>Price</th>
              <th className="text-right px-1 py-1.5 font-normal" style={{ color: 'var(--kt-text-tertiary)' }}>P/L</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => {
              const isHighlighted = highlightId === t.id;
              return (
                <tr
                  key={t.id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: isHighlighted ? 'rgba(255,255,255,0.05)' : 'transparent',
                    transition: 'background 1s ease-out',
                  }}
                  title={`${t.strategy} · ${t.tier} · ${t.pair}`}
                >
                  <td className="px-1 py-1" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{t.time}</td>
                  <td className="px-1 py-1" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>{t.base}</td>
                  <td className="px-1 py-1 hidden md:table-cell">
                    <span style={{ fontSize: '10px', padding: '0px 4px', borderRadius: '3px', background: 'rgba(255,215,0,0.1)', color: '#FFD700' }}>
                      {t.tier}
                    </span>
                  </td>
                  <td className="px-1 py-1">
                    <span style={{ fontSize: '10px', padding: '0px 4px', borderRadius: '3px', background: t.side === 'BUY' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: t.side === 'BUY' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                      {t.side}
                    </span>
                  </td>
                  <td className="text-right px-1 py-1 hidden xl:table-cell" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
                    {t.amount < 0.01 ? t.amount.toFixed(4) : t.amount.toFixed(2)}
                  </td>
                  <td className="text-right px-1 py-1 hidden xl:table-cell" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>
                    {t.price < 10 ? t.price.toFixed(4) : t.price.toFixed(2)}
                  </td>
                  <td className="text-right px-1 py-1 font-medium" style={{
                    color: t.pl >= 0 ? '#FFD700' : '#c4524a',
                    fontSize: '11px',
                  }}>
                    {t.pl >= 0 ? '+' : '-'}{Math.abs(t.pl).toFixed(2)}
                  </td>
                </tr>
              );
            })}
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
            <span style={{ fontSize: '11px', color: 'var(--kt-text-tertiary)', marginLeft: 8 }}>
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
