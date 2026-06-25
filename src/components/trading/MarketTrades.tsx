'use client';

import { PAIRS } from '@/lib/pairs';
import { COIN_LOGOS } from '@/lib/coinLogos';

interface Trade {
  id: number;
  price: string;
  qty: string;
  time: number;
  isBuyerMaker: boolean;
}

interface MarketTradesProps {
  trades: Trade[];
  loading: boolean;
  symbol: string;
}

export default function MarketTrades({ trades, loading, symbol }: MarketTradesProps) {
  const pair = PAIRS[symbol] || PAIRS.BTC;

  return (
    <div className="rounded-xl flex flex-col" style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      height: '100%',
    }}>
      <div className="p-3 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <img
            src={COIN_LOGOS[pair.coin]?.logo || ''}
            alt={pair.coin}
            width={16}
            height={16}
            className="rounded-full flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.05)', padding: 1 }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
            {pair.display} Trades
          </span>
        </div>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Live</span>
      </div>
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <p className="p-4 text-center mb-0" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
            Loading...
          </p>
        ) : trades.length === 0 ? (
          <p className="p-4 text-center mb-0" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
            No trade data available
          </p>
        ) : (
          <table className="w-full" style={{ fontSize: '12px' }}>
            <thead>
              <tr>
                <th className="text-left p-2 font-normal" style={{ color: 'var(--kt-text-tertiary)' }}>Price ({pair.quote})</th>
                <th className="text-right p-2 font-normal" style={{ color: 'var(--kt-text-tertiary)' }}>Amount ({pair.coin})</th>
                <th className="text-right p-2 font-normal" style={{ color: 'var(--kt-text-tertiary)' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.id}>
                  <td className="p-2" style={{ color: t.isBuyerMaker ? '#ef4444' : '#22c55e' }}>
                    {parseFloat(t.price).toFixed(2)}
                  </td>
                  <td className="text-right p-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {parseFloat(t.qty).toFixed(6)}
                  </td>
                  <td className="text-right p-2" style={{ color: 'var(--kt-text-tertiary)' }}>
                    {new Date(t.time).toLocaleTimeString('en-US', { hour12: false })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
