'use client';

import { useState, useEffect } from 'react';
import { seedTrades, getRecentTrades } from '@/lib/ai-trade-simulator';

export default function AITradingHeader() {
  const [tickerItems, setTickerItems] = useState<string[]>([]);

  useEffect(() => {
    seedTrades(30);
    const updateTicker = () => {
      const trades = getRecentTrades().slice(0, 15);
      setTickerItems(trades.map(t =>
        `${t.pair} ${t.side} ${t.profitStr}`
      ));
    };
    updateTicker();
    const id = setInterval(updateTicker, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="sticky top-16 z-30 flex items-center gap-4 px-6 py-2.5 overflow-hidden"
      style={{ background: '#0B0E11', borderBottom: '1px solid #2B3139', minHeight: 48 }}
    >
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#0ECB81' }} />
        <span className="text-sm font-semibold text-kt-text-primary whitespace-nowrap">AI Trading Engine</span>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex gap-8 whitespace-nowrap text-xs" style={{ animation: 'marquee 15s linear infinite' }}>
          {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className={item.includes('BUY') ? 'text-kt-green' : 'text-kt-red'}>
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-shrink-0">
        <span className="px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: 'rgba(14,203,129,0.12)', color: '#0ECB81', border: '1px solid rgba(14,203,129,0.25)' }}>
          Active
        </span>
      </div>

      <style jsx>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-33.33%); } }`}</style>
    </div>
  );
}
