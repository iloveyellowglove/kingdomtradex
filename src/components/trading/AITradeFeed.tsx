'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { seedTrades, startSimulator, stopSimulator, getRecentTrades, getWinRate, getTodayPnL, SimulatedTrade } from '@/lib/ai-trade-simulator';

export default function AITradeFeed() {
  const [trades, setTrades] = useState<SimulatedTrade[]>([]);
  const [filter, setFilter] = useState<'all' | 'BUY' | 'SELL'>('all');
  const [flashId, setFlashId] = useState(0);
  const [userScrolled, setUserScrolled] = useState(false);
  const [burstMsg, setBurstMsg] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const handleTrade = useCallback((trade: SimulatedTrade) => {
    setTrades(getRecentTrades().slice(0, 60));
    setFlashId(trade.id);
    setTimeout(() => setFlashId(0), 600);
  }, []);

  const handleBurst = useCallback((count: number) => {
    setBurstMsg(`Executing arbitrage sequence... (${count} trades)`);
    setTrades(getRecentTrades().slice(0, 60));
    setTimeout(() => setBurstMsg(''), 2000);
  }, []);

  useEffect(() => {
    seedTrades(30);
    setTrades(getRecentTrades().slice(0, 60));
    startSimulator(handleTrade, handleBurst);
    return () => stopSimulator();
  }, [handleTrade, handleBurst]);

  // Auto-scroll to top when new trades arrive (unless user scrolled)
  useEffect(() => {
    if (!userScrolled && topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [trades.length, userScrolled]);

  const handleScroll = useCallback(() => {
    if (listRef.current) {
      setUserScrolled(listRef.current.scrollTop > 60);
    }
  }, []);

  const filtered = filter === 'all' ? trades : trades.filter(t => t.side === filter);
  const winRate = getWinRate();
  const todayPnL = getTodayPnL();

  return (
    <div className="rounded-xl flex flex-col overflow-hidden" style={{ background: '#1E2329', border: '1px solid #2B3139' }}>
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0" style={{ borderColor: '#2B3139' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#0ECB81' }} />
          <span className="text-base font-bold text-[#EAECEF]">Live AI Trades</span>
          <span className="text-xs text-[#848E9C] ml-auto">{trades.length} trades</span>
        </div>

        {/* Scanning bar */}
        <div className="relative h-0.5 mb-2 rounded-full overflow-hidden" style={{ background: '#2B3139' }}>
          <div
            className="absolute inset-y-0 rounded-full"
            style={{
              width: '30%',
              background: burstMsg ? '#F0B90B' : '#0ECB81',
              animation: 'scanBar 2s linear infinite',
            }}
          />
        </div>

        {/* Burst message */}
        {burstMsg && (
          <p className="text-xs text-[#F0B90B] mb-2 font-medium">{burstMsg}</p>
        )}
        {!burstMsg && (
          <p className="text-xs text-[#848E9C] mb-2">AI is executing trades...</p>
        )}

        {/* Filter pills */}
        <div className="flex gap-2">
          {(['all', 'BUY', 'SELL'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1 rounded-full text-xs font-medium transition"
              style={{
                background: filter === f
                  ? (f === 'all' ? 'rgba(255,255,255,0.08)' : f === 'BUY' ? 'rgba(14,203,129,0.12)' : 'rgba(246,70,93,0.12)')
                  : 'transparent',
                color: filter === f ? '#EAECEF' : '#848E9C',
              }}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Trade list */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative"
        style={{ maxHeight: 'calc(100vh - 380px)', minHeight: 360 }}
      >
        {/* Anchor for auto-scroll */}
        <div ref={topRef} />

        {filtered.map(t => (
          <div key={t.id}
            className="flex items-center gap-3 px-4 py-3 border-b transition-all"
            style={{
              borderColor: '#2B3139',
              borderLeft: `3px solid ${t.side === 'BUY' ? '#0ECB81' : '#F6465D'}`,
              animation: t.id === flashId
                ? `flash-${t.side === 'BUY' ? 'green' : 'red'} 0.5s ease-out`
                : `slideDown 0.2s ease-out`,
              background: t.id === flashId
                ? (t.side === 'BUY' ? 'rgba(14,203,129,0.08)' : 'rgba(246,70,93,0.06)')
                : 'transparent',
            }}>
            <span className="text-[13px] text-[#848E9C] w-20 flex-shrink-0 font-mono">
              {t.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-[16px] font-bold text-[#EAECEF] w-20 flex-shrink-0">{t.pair}</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium flex-shrink-0"
              style={{ background: `${t.tierColor}18`, color: t.tierColor, minWidth: 60, textAlign: 'center' }}>{t.tier}</span>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold flex-shrink-0 text-center"
              style={{
                background: t.side === 'BUY' ? 'rgba(14,203,129,0.15)' : 'rgba(246,70,93,0.15)',
                color: t.side === 'BUY' ? '#0ECB81' : '#F6465D',
                minWidth: 48,
              }}>{t.side}</span>
            <span className="text-[15px] font-semibold ml-auto tabular-nums flex-shrink-0"
              style={{ color: t.profit >= 0 ? '#0ECB81' : '#F6465D' }}>
              {t.profitStr}
            </span>
          </div>
        ))}
      </div>

      {/* Jump to live button */}
      {userScrolled && (
        <button
          onClick={() => { setUserScrolled(false); topRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-bold shadow-lg z-10"
          style={{ background: '#F0B90B', color: '#0B0E11' }}>
          ↓ New trades
        </button>
      )}

      {/* Bottom stats bar */}
      <div className="flex items-center justify-between px-4 py-3 border-t flex-shrink-0 text-xs" style={{ borderColor: '#2B3139', background: '#161A1E' }}>
        <span className="text-[#848E9C]">Win Rate: <span className="text-[#EAECEF] font-bold">{winRate}%</span></span>
        <span className="text-[#848E9C]">Trades Today: <span className="text-[#EAECEF] font-bold">{trades.filter(t => t.time.getDate() === new Date().getDate()).length}</span></span>
        <span className="font-bold tabular-nums" style={{ color: todayPnL >= 0 ? '#0ECB81' : '#F6465D' }}>
          {todayPnL >= 0 ? '+' : ''}{todayPnL.toFixed(2)}%
        </span>
      </div>

      <style jsx>{`
        @keyframes scanBar {
          0% { left: -30%; } 100% { left: 100%; }
        }
        @keyframes slideDown {
          from { transform: translateY(-30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes flash-green {
          0% { background: rgba(14,203,129,0.15); }
          100% { background: transparent; }
        }
        @keyframes flash-red {
          0% { background: rgba(246,70,93,0.1); }
          100% { background: transparent; }
        }
      `}</style>
    </div>
  );
}
