'use client';

import { useEffect, useRef } from 'react';

const SYMBOLS: Record<string, string> = {
  BTC: 'BINANCE:BTCUSDT',
  ETH: 'BINANCE:ETHUSDT',
  BNB: 'BINANCE:BNBUSDT',
  SOL: 'BINANCE:SOLUSDT',
  XRP: 'BINANCE:XRPUSDT',
};

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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      new window.TradingView.widget({
        autosize: true,
        symbol: SYMBOLS[symbol] || SYMBOLS.BTC,
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
    };
    container.appendChild(script);
  }, [symbol]);

  return (
    <div className="rounded-xl overflow-hidden" style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div id="tv-chart-container" ref={containerRef} style={{ height: 550 }} />
    </div>
  );
}
