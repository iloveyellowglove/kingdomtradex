'use client';

import { useState, useEffect } from 'react';
import { generateHeatmapData } from '@/lib/ai-trade-simulator';

export default function TradingHeatmap() {
  const [pairs, setPairs] = useState<{ pair: string; change: number }[]>([]);

  useEffect(() => {
    setPairs(generateHeatmapData());
    const interval = setInterval(() => setPairs(generateHeatmapData()), 15000);
    return () => clearInterval(interval);
  }, []);

  function bgColor(change: number): string {
    if (change >= 3) return 'rgba(14,203,129,0.25)';
    if (change >= 1) return 'rgba(14,203,129,0.12)';
    if (change >= -1) return '#2B3139';
    if (change >= -3) return 'rgba(246,70,93,0.08)';
    return 'rgba(246,70,93,0.15)';
  }

  return (
    <div className="rounded-xl p-4" style={{ background: '#1E2329', border: '1px solid #2B3139' }}>
      <h4 className="text-sm font-bold text-[#EAECEF] mb-3">Trading Pairs Activity</h4>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {pairs.map(p => (
          <div key={p.pair}
            className="rounded-lg p-2 text-center transition"
            style={{ background: bgColor(p.change), minHeight: 50 }}>
            <p className="text-xs font-semibold text-[#EAECEF]">{p.pair}</p>
            <p className="text-[10px] font-medium tabular-nums" style={{ color: p.change >= 0 ? '#0ECB81' : '#F6465D' }}>
              {p.change >= 0 ? '+' : ''}{p.change.toFixed(1)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
