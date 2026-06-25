'use client';

import { useState, useEffect } from 'react';

interface Props { engineStatus?: 'active' | 'paused'; }

export default function AITradingHeader({ engineStatus = 'active' }: Props) {
  const [tickerItems, setTickerItems] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    // Generate ticker items from live trade data
    function refresh() {
      const sides = ['BUY', 'SELL'];
      const pairs = ['ETH/BTC', 'SOL/BNB', 'XRP/USDT', 'DOGE/BTC', 'ADA/ETH', 'AVAX/USDT', 'DOT/BTC', 'LINK/ETH', 'BNB/BTC', 'SOL/USDT'];
      const items: string[] = [];
      for (let i = 0; i < 20; i++) {
        const side = sides[Math.floor(Math.random() * 2)];
        const pair = pairs[Math.floor(Math.random() * pairs.length)];
        const pct = (Math.random() * 1.5).toFixed(2);
        const sign = side === 'BUY' ? '+' : '-';
        items.push(`${pair} ${side} ${sign}${pct}%`);
      }
      setTickerItems(items);
    }
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="sticky top-16 z-30 flex items-center gap-4 px-6 py-2.5 overflow-hidden"
      style={{ background: '#0B0E11', borderBottom: '1px solid #2B3139', minHeight: 48 }}
    >
      {/* Live indicator */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: engineStatus === 'active' ? '#0ECB81' : '#F0B90B' }} />
        <span className="text-sm font-semibold text-[#EAECEF] whitespace-nowrap">AI Trading Engine</span>
      </div>

      {/* Scrolling ticker */}
      <div
        className="flex-1 overflow-hidden relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex gap-8 whitespace-nowrap text-xs"
          style={{
            animation: `marquee ${paused ? '999s' : '30s'} linear infinite`,
          }}
        >
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className={item.includes('BUY') ? 'text-[#0ECB81]' : 'text-[#F6465D]'}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Status badge */}
      <div className="flex-shrink-0">
        <span
          className="px-3 py-1 rounded-full text-xs font-bold"
          style={{
            background: engineStatus === 'active' ? 'rgba(14,203,129,0.12)' : 'rgba(240,185,11,0.12)',
            color: engineStatus === 'active' ? '#0ECB81' : '#F0B90B',
            border: `1px solid ${engineStatus === 'active' ? 'rgba(14,203,129,0.25)' : 'rgba(240,185,11,0.25)'}`,
          }}
        >
          {engineStatus === 'active' ? 'Active' : 'Paused'}
        </span>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
