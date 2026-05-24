interface OrderBookLevel {
  price: number;
  amount: number;
}

interface OrderBookProps {
  asks: OrderBookLevel[];
  bids: OrderBookLevel[];
  spread: number;
  spreadPct: number;
  loading: boolean;
  symbol: string;
}

export default function OrderBook({ asks, bids, spread, spreadPct, loading, symbol }: OrderBookProps) {
  const coin = symbol === 'BTC' ? 'BTC' : 'ETH';
  const maxAskTotal = asks.reduce((s, a) => s + a.amount, 0);
  const maxBidTotal = bids.reduce((s, b) => s + b.amount, 0);
  const maxTotal = Math.max(maxAskTotal, maxBidTotal);

  return (
    <div className="rounded-xl flex flex-col" style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      height: '100%',
    }}>
      <div className="p-3 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
          Order Book
        </span>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Live</span>
      </div>

      {loading ? (
        <p className="p-4 text-center mb-0" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
          Loading...
        </p>
      ) : (
        <div className="overflow-y-auto flex-1" style={{ fontSize: '12px' }}>
          {/* Column headers */}
          <div className="flex px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="flex-1 text-left" style={{ color: 'rgba(255,255,255,0.4)' }}>Price (USDT)</span>
            <span className="text-right" style={{ width: 80, color: 'rgba(255,255,255,0.4)' }}>Amount ({coin})</span>
            <span className="text-right" style={{ width: 80, color: 'rgba(255,255,255,0.4)' }}>Total</span>
          </div>

          {/* Asks */}
          {asks.slice(0, 8).reverse().map((a, i) => {
            const cumulative = asks.slice(0, i + 1).reduce((s, x) => s + x.amount, 0);
            return (
              <div key={`ask-${i}`} className="flex px-3 py-1 relative" style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                <div className="absolute inset-y-0 right-0" style={{
                  width: `${(cumulative / maxTotal) * 40}%`,
                  background: 'rgba(239,68,68,0.08)',
                  zIndex: 0,
                }} />
                <span className="flex-1 text-left relative z-10" style={{ color: '#ef4444' }}>
                  {a.price.toFixed(2)}
                </span>
                <span className="text-right relative z-10" style={{ width: 80, color: 'rgba(255,255,255,0.7)' }}>
                  {a.amount.toFixed(6)}
                </span>
                <span className="text-right relative z-10" style={{ width: 80, color: 'rgba(255,255,255,0.5)' }}>
                  {cumulative.toFixed(6)}
                </span>
              </div>
            );
          })}

          {/* Spread */}
          <div className="flex justify-between px-3 py-1" style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>
              Spread: {spread.toFixed(2)}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>
              {spreadPct.toFixed(4)}%
            </span>
          </div>

          {/* Bids */}
          {bids.slice(0, 8).map((b, i) => {
            const cumulative = bids.slice(0, i + 1).reduce((s, x) => s + x.amount, 0);
            return (
              <div key={`bid-${i}`} className="flex px-3 py-1 relative" style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                <div className="absolute inset-y-0 right-0" style={{
                  width: `${(cumulative / maxTotal) * 40}%`,
                  background: 'rgba(34,197,94,0.08)',
                  zIndex: 0,
                }} />
                <span className="flex-1 text-left relative z-10" style={{ color: '#22c55e' }}>
                  {b.price.toFixed(2)}
                </span>
                <span className="text-right relative z-10" style={{ width: 80, color: 'rgba(255,255,255,0.7)' }}>
                  {b.amount.toFixed(6)}
                </span>
                <span className="text-right relative z-10" style={{ width: 80, color: 'rgba(255,255,255,0.5)' }}>
                  {cumulative.toFixed(6)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
