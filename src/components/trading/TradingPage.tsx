'use client';

import { useState } from 'react';
import { useMarketData } from '@/hooks/useMarketData';
import TradingViewChart from '@/components/trading/TradingViewChart';
import MarketHeader from '@/components/trading/MarketHeader';
import MarketTrades from '@/components/trading/MarketTrades';
import OrderBook from '@/components/trading/OrderBook';
import AIEngineStatus from '@/components/trading/AIEngineStatus';

interface TradingPageProps {
  dailyRate: number;
  balance: number;
}

export default function TradingPage({ dailyRate, balance }: TradingPageProps) {
  const [symbol, setSymbol] = useState('BTC');
  const {
    price, change24h, high24h, low24h, volume24h,
    recentTrades, orderBook, spread, spreadPct, loading, error,
  } = useMarketData(symbol);

  return (
    <div className="py-6 space-y-6">
      {/* Market Header Bar */}
      <MarketHeader
        symbol={symbol}
        price={price}
        change24h={change24h}
        high24h={high24h}
        low24h={low24h}
        volume24h={volume24h}
        loading={loading}
        onSymbolChange={setSymbol}
      />

      {error && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <p className="mb-0" style={{ fontSize: '14px', color: '#ef4444' }}>{error}</p>
        </div>
      )}

      {/* Main Content: Chart (70%) + Market Data (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart - spans 2 columns */}
        <div className="lg:col-span-2">
          <TradingViewChart symbol={symbol} />
        </div>

        {/* Right column: Trades + Order Book */}
        <div className="space-y-6">
          <MarketTrades trades={recentTrades} loading={loading} symbol={symbol} />
          <OrderBook
            asks={orderBook.asks}
            bids={orderBook.bids}
            spread={spread}
            spreadPct={spreadPct}
            loading={loading}
            symbol={symbol}
          />
        </div>
      </div>

      {/* AI Engine Status */}
      <AIEngineStatus dailyRate={dailyRate} balance={balance} />
    </div>
  );
}
