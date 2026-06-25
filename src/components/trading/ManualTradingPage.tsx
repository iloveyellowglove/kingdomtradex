'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import TradingViewChart from '@/components/trading/TradingViewChart';
import { fmt } from '@/lib/utils/formatting';

const BINANCE = 'https://api.binance.com/api/v3';
const PAIRS: { key: string; display: string; binance: string }[] = [
  { key: 'BTC', display: 'BTC/USDT', binance: 'BTCUSDT' },
  { key: 'ETH', display: 'ETH/USDT', binance: 'ETHUSDT' },
  { key: 'SOL', display: 'SOL/USDT', binance: 'SOLUSDT' },
];

const QUICK_AMOUNTS = [100, 500, 1000];

interface ManualTrade {
  id: number;
  user_id: number;
  pair: string;
  side: string;
  amount: number;
  entry_price: number;
  exit_price: number | null;
  status: string;
  pnl: number | null;
  fee: number;
  opened_at: string;
  closed_at: string | null;
}

interface Props {
  realBalance: number;
  userId: number;
  csrfToken: string;
  initialOpenPositions: ManualTrade[];
  initialClosedTrades: ManualTrade[];
}

export default function ManualTradingPage({
  realBalance,
  csrfToken,
  initialOpenPositions,
  initialClosedTrades,
}: Omit<Props, 'userId'>) {
  const [selectedPair, setSelectedPair] = useState(PAIRS[0]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [usdtAmount, setUsdtAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openPositions, setOpenPositions] = useState<ManualTrade[]>(initialOpenPositions);
  const [closedTrades, setClosedTrades] = useState<ManualTrade[]>(initialClosedTrades);
  const [closingId, setClosingId] = useState<number | null>(null);
  const [resetting, setResetting] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const mountedRef = useRef(true);

  // Fetch current price for selected pair
  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch(`${BINANCE}/ticker/price?symbol=${selectedPair.binance}`);
      if (!res.ok) return;
      const data = await res.json();
      if (mountedRef.current) setCurrentPrice(parseFloat(data.price));
    } catch {}
  }, [selectedPair]);

  // Poll price and positions
  useEffect(() => {
    mountedRef.current = true;
    fetchPrice();
    intervalRef.current = setInterval(() => {
      fetchPrice();
      fetch('/api/manual/positions')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && mountedRef.current) {
            setOpenPositions(d.openPositions);
            setClosedTrades(d.closedTrades);
          }
        })
        .catch(() => {});
    }, 10000);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
    };
  }, [fetchPrice]);

  const fee = parseFloat(usdtAmount || '0') * 0.001;
  const estimatedReceive = currentPrice > 0 ? (parseFloat(usdtAmount || '0') - fee) / currentPrice : 0;

  async function handleBuy() {
    setError('');
    setSuccess('');
    const amt = parseFloat(usdtAmount || '0');
    if (!amt || amt <= 0) {
      setError('Enter an amount.');
      return;
    }
    setLoading(true);

    const res = await fetch('/api/manual/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify({ pair: selectedPair.display, usdtAmount: amt }),
    });

    const data = await res.json();
    if (data.success) {
      setSuccess(`Opened ${selectedPair.display} position for $${amt.toFixed(2)}`);
      setUsdtAmount('');
      // Refresh positions
      const posRes = await fetch('/api/manual/positions');
      const posData = await posRes.json();
      if (posData.success) {
        setOpenPositions(posData.openPositions);
        setClosedTrades(posData.closedTrades);
      }
    } else {
      setError(data.error || 'Trade failed.');
    }
    setLoading(false);
  }

  async function handleClose(tradeId: number) {
    setClosingId(tradeId);
    setError('');

    const res = await fetch('/api/manual/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify({ tradeId }),
    });

    const data = await res.json();
    if (data.success) {
      const posRes = await fetch('/api/manual/positions');
      const posData = await posRes.json();
      if (posData.success) {
        setOpenPositions(posData.openPositions);
        setClosedTrades(posData.closedTrades);
      }
    } else {
      setError(data.error || 'Close failed.');
    }
    setClosingId(null);
  }

  async function handleReset() {
    setResetting(true);
    const res = await fetch('/api/manual/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
    });
    const data = await res.json();
    if (data.success) {
      setOpenPositions([]);
      setClosedTrades([]);
    }
    setResetting(false);
  }

  const pairCoin = selectedPair.display.split('/')[0];

  return (
    <div className="py-4 space-y-6">
      {/* Purple Banner */}
      <div className="rounded-xl p-4 text-center" style={{
        background: 'rgba(139, 92, 246, 0.08)',
        border: '2px solid #8b5cf6',
      }}>
        <p className="mb-0" style={{ fontSize: '14px', color: '#c4b5fd', fontWeight: 500 }}>
          MANUAL TRADING MODE - Trade with real market prices. Your deposited balance is shown below. Profits or losses here do not affect your balance.
        </p>
      </div>

      {/* Balance Display */}
      <div className="text-center">
        <p className="mb-1" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
          Your Balance
        </p>
        <p className="mb-0 text-temple-gold font-bold" style={{ fontSize: '2rem' }}>
          ${fmt(realBalance)} USDT
        </p>
        {realBalance === 0 && (
          <p className="mt-2" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            Deposit funds to increase your real balance. Manual trading is still available using a practice environment.
          </p>
        )}
      </div>

      {/* Error / Success */}
      {error && (
        <div className="rounded-lg p-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <p className="mb-0 text-sm" style={{ color: '#ef4444' }}>{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-lg p-3" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
          <p className="mb-0 text-sm" style={{ color: '#22c55e' }}>{success}</p>
        </div>
      )}

      {/* Two-column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Chart */}
        <div>
          {/* Pair tabs */}
          <div className="flex gap-2 mb-4">
            {PAIRS.map((p) => (
              <button
                key={p.key}
                onClick={() => setSelectedPair(p)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  color: selectedPair.key === p.key ? '#8b5cf6' : 'rgba(255,255,255,0.5)',
                  background: selectedPair.key === p.key ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.03)',
                  border: selectedPair.key === p.key ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {p.display}
              </button>
            ))}
          </div>
          <TradingViewChart symbol={selectedPair.key} />
        </div>

        {/* Right: Trade Panel */}
        <div>
          <div className="rounded-xl p-5" style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <h3 className="font-bold mb-4" style={{ color: '#8b5cf6' }}>Place Trade</h3>

            {/* Current Price */}
            <div className="flex items-center justify-between mb-4">
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Current Price</span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#8b5cf6' }}>
                {currentPrice > 0 ? `$${currentPrice.toFixed(2)}` : 'Loading...'}
              </span>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <label className="block mb-1" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                Amount in USDT
              </label>
              <div className="flex">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={usdtAmount}
                  onChange={(e) => setUsdtAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 rounded-r-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '8px 12px',
                    fontSize: '16px',
                  }}
                />
                <span className="px-4 flex items-center rounded-r-lg" style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderLeft: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '14px',
                }}>
                  USDT
                </span>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex gap-2 mb-4">
              {QUICK_AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => setUsdtAmount(String(a))}
                  className="flex-1 py-2 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: 'rgba(139,92,246,0.08)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    color: '#c4b5fd',
                  }}
                >
                  ${a}
                </button>
              ))}
            </div>

            {/* Fee Estimate */}
            <div className="flex justify-between mb-2" style={{ fontSize: '12px' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>Fee (0.1%)</span>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>${fee.toFixed(2)}</span>
            </div>

            {/* Preview */}
            <div className="flex justify-between mb-4" style={{ fontSize: '12px' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>You will receive</span>
              <span style={{ color: '#8b5cf6', fontWeight: 600 }}>
                {estimatedReceive > 0 ? `${estimatedReceive.toFixed(6)} ${pairCoin}` : `0 ${pairCoin}`}
              </span>
            </div>

            {/* Buy Button */}
            <button
              onClick={handleBuy}
              disabled={loading || !usdtAmount || parseFloat(usdtAmount) <= 0}
              className="w-full py-3 rounded-lg font-bold transition-colors"
              style={{
                background: loading ? 'rgba(139,92,246,0.3)' : '#8b5cf6',
                color: '#fff',
                opacity: loading || !usdtAmount || parseFloat(usdtAmount) <= 0 ? 0.5 : 1,
              }}
            >
              {loading ? 'Processing...' : `BUY ${pairCoin}`}
            </button>

            {/* Disclosure */}
            <p className="mt-3 text-center mb-0" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
              Manual trading uses a simulated balance. Your real deposited balance is never used for trading and remains unaffected.
            </p>
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div className="rounded-xl overflow-hidden" style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h3 className="mb-0 font-bold" style={{ fontSize: '15px', color: '#fff' }}>
            Open Positions {openPositions.length > 0 && `(${openPositions.length})`}
          </h3>
        </div>
        {openPositions.length === 0 ? (
          <p className="p-6 text-center mb-0" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
            No open positions
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <th className="text-left p-3 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Pair</th>
                  <th className="text-right p-3 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Amount</th>
                  <th className="text-right p-3 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Entry Price</th>
                  <th className="text-right p-3 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Current Price</th>
                  <th className="text-right p-3 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Unrealized P/L</th>
                  <th className="text-right p-3 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {openPositions.map((pos) => {
                  const unrealizedPnl = currentPrice > 0
                    ? (Number(pos.amount) * currentPrice * 0.999) - (Number(pos.amount) * Number(pos.entry_price))
                    : 0;
                  return (
                    <tr key={pos.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td className="p-3" style={{ color: '#8b5cf6', fontWeight: 600 }}>{pos.pair}</td>
                      <td className="text-right p-3" style={{ color: 'rgba(255,255,255,0.8)' }}>{Number(pos.amount).toFixed(6)}</td>
                      <td className="text-right p-3" style={{ color: 'rgba(255,255,255,0.8)' }}>${Number(pos.entry_price).toFixed(2)}</td>
                      <td className="text-right p-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
                        {currentPrice > 0 ? `$${currentPrice.toFixed(2)}` : '...'}
                      </td>
                      <td className="text-right p-3 font-medium" style={{
                        color: unrealizedPnl >= 0 ? '#22c55e' : '#ef4444',
                      }}>
                        {unrealizedPnl >= 0 ? '+' : ''}{unrealizedPnl.toFixed(2)}
                      </td>
                      <td className="text-right p-3">
                        <button
                          onClick={() => handleClose(pos.id)}
                          disabled={closingId === pos.id}
                          className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
                          style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#ef4444',
                          }}
                        >
                          {closingId === pos.id ? '...' : 'Close'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Closed Trades History */}
      <div className="rounded-xl overflow-hidden" style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h3 className="mb-0 font-bold" style={{ fontSize: '15px', color: '#fff' }}>Closed Trades</h3>
        </div>
        {closedTrades.length === 0 ? (
          <p className="p-6 text-center mb-0" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
            No closed trades yet
          </p>
        ) : (
          <div className="overflow-x-auto" style={{ maxHeight: 300, overflowY: 'auto' }}>
            <table className="w-full" style={{ fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <th className="text-left p-2 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Time</th>
                  <th className="text-left p-2 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Pair</th>
                  <th className="text-left p-2 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Side</th>
                  <th className="text-right p-2 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Amount</th>
                  <th className="text-right p-2 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Entry</th>
                  <th className="text-right p-2 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>Exit</th>
                  <th className="text-right p-2 font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>P/L</th>
                </tr>
              </thead>
              <tbody>
                {closedTrades.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td className="p-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {t.closed_at ? new Date(t.closed_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : ''}
                    </td>
                    <td className="p-2" style={{ color: '#8b5cf6' }}>{t.pair}</td>
                    <td className="p-2" style={{ color: t.side === 'BUY' ? '#22c55e' : '#ef4444' }}>{t.side}</td>
                    <td className="text-right p-2" style={{ color: 'rgba(255,255,255,0.7)' }}>{Number(t.amount).toFixed(6)}</td>
                    <td className="text-right p-2" style={{ color: 'rgba(255,255,255,0.7)' }}>${Number(t.entry_price).toFixed(2)}</td>
                    <td className="text-right p-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {t.exit_price ? `$${Number(t.exit_price).toFixed(2)}` : ''}
                    </td>
                    <td className="text-right p-2 font-medium" style={{
                      color: (t.pnl ?? 0) >= 0 ? '#22c55e' : '#ef4444',
                    }}>
                      {(t.pnl ?? 0) >= 0 ? '+' : ''}{(t.pnl ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reset Button */}
      <div className="flex justify-end">
        <button
          onClick={handleReset}
          disabled={resetting}
          className="px-4 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: 'transparent',
            border: '1px solid rgba(139,92,246,0.3)',
            color: 'rgba(139,92,246,0.7)',
          }}
        >
          {resetting ? 'Resetting...' : 'Reset Practice Account'}
        </button>
      </div>
    </div>
  );
}
