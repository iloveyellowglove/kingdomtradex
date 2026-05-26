'use client';

import { useState } from 'react';
import { useMarketData } from '@/hooks/useMarketData';
import TradingViewChart from '@/components/trading/TradingViewChart';
import MarketHeader from '@/components/trading/MarketHeader';
import MarketTrades from '@/components/trading/MarketTrades';
import OrderBook from '@/components/trading/OrderBook';
import AIEngineStatus from '@/components/trading/AIEngineStatus';
import AITradeLog from '@/components/trading/AITradeLog';

interface TradingPageProps {
  dailyRate: number;
  balance: number;
  userId: number;
}

type Tab = 'ai-trades' | 'market-trades' | 'order-book';

const TABS: { key: Tab; label: string }[] = [
  { key: 'ai-trades', label: 'AI Trades' },
  { key: 'market-trades', label: 'Market Trades' },
  { key: 'order-book', label: 'Order Book' },
];

export default function TradingPage({ dailyRate, balance, userId }: TradingPageProps) {
  const [symbol, setSymbol] = useState('BTC');
  const [tab, setTab] = useState<Tab>('ai-trades');
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

      {/* Main Content: Chart (70%) + Side Panel (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ height: 550 }}>
        {/* Chart - spans 3 columns */}
        <div className="lg:col-span-3">
          <TradingViewChart symbol={symbol} />
        </div>

        {/* Right column: Tabbed panel */}
        <div className="lg:col-span-1 flex flex-col" style={{ height: 550 }}>
          {/* Tab buttons */}
          <div className="flex border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex-1 py-2 text-center text-xs font-medium transition-colors"
                style={{
                  color: tab === t.key ? '#FFD700' : 'rgba(255,255,255,0.4)',
                  borderBottom: tab === t.key ? '2px solid #FFD700' : '2px solid transparent',
                  background: tab === t.key ? 'rgba(255,215,0,0.04)' : 'transparent',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {tab === 'ai-trades' && (
              <AITradeLog userId={userId} balance={balance} dailyRate={dailyRate} />
            )}
            {tab === 'market-trades' && (
              <MarketTrades trades={recentTrades} loading={loading} symbol={symbol} />
            )}
            {tab === 'order-book' && (
              <OrderBook
                asks={orderBook.asks}
                bids={orderBook.bids}
                spread={spread}
                spreadPct={spreadPct}
                loading={loading}
                symbol={symbol}
              />
            )}
          </div>
        </div>
      </div>

      {/* AI Engine Status */}
      <AIEngineStatus dailyRate={dailyRate} balance={balance} />
    </div>
  );
}
