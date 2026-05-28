'use client';

import { useEffect, useRef, useState } from 'react';
import { PAIRS } from '@/lib/pairs';

declare global {
  interface Window {
    TradingView: {
      widget: new (config: Record<string, unknown>) => unknown;
    };
  }
}

interface TradingViewChartProps {
  symbol: string;
}

export default function TradingViewChart({ symbol }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';
    setLoading(true);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      new window.TradingView.widget({
        autosize: true,
        symbol: PAIRS[symbol]?.tvSymbol || PAIRS.BTC.tvSymbol,
        interval: '60',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#1a1a2e',
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: false,
        container_id: 'tv-chart-container',
        height: 550,
        width: '100%',
        overrides: {
          'paneProperties.background': '#0e0b1a',
          'paneProperties.backgroundType': 'solid',
        },
      });
      setLoading(false);
    };
    script.onerror = () => setLoading(false);
    container.appendChild(script);
  }, [symbol]);

  return (
    <div className="rounded-xl overflow-hidden" style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {loading && (
        <div className="flex items-center justify-center" style={{ height: 550 }}>
          <div className="text-center">
            <div className="inline-block mb-4" style={{
              width: 48, height: 48,
              border: '3px solid rgba(255,255,255,0.08)',
              borderTopColor: '#FFD700',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading chart...</p>
          </div>
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      <div id="tv-chart-container" ref={containerRef} style={{ height: 550, display: loading ? 'none' : 'block' }} />
    </div>
  );
}
