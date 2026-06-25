'use client';

import { useState, useEffect, useRef } from 'react';
import { seedTrades, generateTrade, getRecentTrades, getWinRate, getTodayPnL, SimulatedTrade } from '@/lib/ai-trade-simulator';

export default function AITradeFeed() {
  const [trades, setTrades] = useState<SimulatedTrade[]>([]);
  const [filter, setFilter] = useState<'all' | 'BUY' | 'SELL'>('all');
  const [newId, setNewId] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const seeded = seedTrades(20);
    setTrades(seeded);

    const interval = setInterval(() => {
      const trade = generateTrade();
      setTrades(getRecentTrades());
      setNewId(trade.id);
    }, Math.random() * 5000 + 3000);

    return () => clearInterval(interval);
  }, []);

  const filtered = filter === 'all' ? trades : trades.filter(t => t.side === filter);

  return (
    <div className="rounded-xl flex flex-col" style={{ background: '#1E2329', border: '1px solid #2B3139', height: '100%', minHeight: 400 }}>
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0" style={{ borderColor: '#2B3139' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#0ECB81' }} />
            <span className="text-sm font-bold text-[#EAECEF]">Live AI Trades</span>
          </div>
          <span className="text-xs text-[#848E9C]">{trades.length} trades</span>
        </div>
        {/* Filter pills */}
        <div className="flex gap-2">
          {(['all', 'BUY', 'SELL'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1 rounded-full text-xs font-medium transition"
              style={{
                background: filter === f ? (f === 'all' ? 'rgba(255,255,255,0.08)' : f === 'BUY' ? 'rgba(14,203,129,0.12)' : 'rgba(246,70,93,0.12)') : 'transparent',
                color: filter === f ? '#EAECEF' : '#848E9C',
              }}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Trade list */}
      <div ref={listRef} className="flex-1 overflow-y-auto" style={{ maxHeight: 400 }}>
        {filtered.map(t => (
          <div key={t.id}
            className="flex items-center gap-3 px-4 py-2.5 border-b transition"
            style={{
              borderColor: '#2B3139',
              animation: t.id === newId ? 'slideIn 0.3s ease-out' : 'none',
            }}>
            <span className="text-[10px] text-[#5E6673] w-12 flex-shrink-0">
              {t.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-sm font-semibold text-[#EAECEF] w-16 flex-shrink-0">{t.pair}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 w-14 text-center"
              style={{ background: `${t.tierColor}15`, color: t.tierColor }}>{t.tier}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0 w-10 text-center"
              style={{
                background: t.side === 'BUY' ? 'rgba(14,203,129,0.12)' : 'rgba(246,70,93,0.12)',
                color: t.side === 'BUY' ? '#0ECB81' : '#F6465D',
              }}>{t.side}</span>
            <span className="text-xs font-medium ml-auto tabular-nums flex-shrink-0"
              style={{ color: t.profit >= 0 ? '#0ECB81' : '#F6465D' }}>
              {t.profitStr}
            </span>
          </div>
        ))}
      </div>

      {/* Footer stats */}
      <div className="p-3 border-t flex items-center justify-between text-xs flex-shrink-0" style={{ borderColor: '#2B3139' }}>
        <span className="text-[#848E9C]">Win Rate: <span className="text-[#EAECEF] font-bold">{getWinRate()}%</span></span>
        <span className="text-[#848E9C]">Today&apos;s P&amp;L: <span className="font-bold tabular-nums" style={{ color: getTodayPnL() >= 0 ? '#0ECB81' : '#F6465D' }}>
          {getTodayPnL() >= 0 ? '+' : ''}{getTodayPnL().toFixed(2)}%
        </span></span>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
