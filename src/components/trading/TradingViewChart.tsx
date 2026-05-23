'use client';

import { useEffect, useRef, useState } from 'react';

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

export default function TradingViewChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [symbol, setSymbol] = useState('BTC');

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
        symbol: SYMBOLS[symbol],
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
        height: 500,
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
    <div className="card mb-6">
      <div className="card-header flex items-center justify-between">
        <h5 className="mb-0">Trading Terminal</h5>
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="bg-dark-indigo border border-royal-purple rounded px-3 py-1 text-sm text-white"
        >
          {Object.keys(SYMBOLS).map((s) => (
            <option key={s} value={s}>{s}/USDT</option>
          ))}
        </select>
      </div>
      <div className="card-body p-0">
        <div id="tv-chart-container" ref={containerRef} style={{ height: 500 }} />
      </div>
    </div>
  );
}
