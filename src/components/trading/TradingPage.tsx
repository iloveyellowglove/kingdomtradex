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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ height: 550 }}>
        {/* Chart - spans 3 columns */}
        <div className="lg:col-span-3">
          <TradingViewChart symbol={symbol} />
        </div>

        {/* Right column: Trades + Order Book */}
        <div className="lg:col-span-1 flex flex-col gap-0" style={{ height: 550 }}>
          <div className="flex-1 overflow-hidden">
            <MarketTrades trades={recentTrades} loading={loading} symbol={symbol} />
          </div>
          <div className="flex-1 overflow-hidden">
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
      </div>

      {/* AI Engine Status */}
      <AIEngineStatus dailyRate={dailyRate} balance={balance} />
    </div>
  );
}
