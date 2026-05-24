import { formatCurrency } from '@/lib/utils/formatting';
import { PAIRS } from '@/lib/pairs';

interface MarketHeaderProps {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  loading: boolean;
  onSymbolChange: (s: string) => void;
}

export default function MarketHeader({
  symbol, price, change24h, high24h, low24h, volume24h, loading, onSymbolChange,
}: MarketHeaderProps) {
  const isPositive = change24h >= 0;
  const pair = PAIRS[symbol];

  function fmtVol(n: number): string {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return formatCurrency(n);
  }

  return (
    <div className="rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4 md:gap-8" style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Pair selector + price */}
      <div className="flex items-center gap-3">
        <select
          value={symbol}
          onChange={(e) => onSymbolChange(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm font-medium"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }}
        >
          {Object.entries(PAIRS).map(([key, info]) => (
            <option key={key} value={key}>{info.display}</option>
          ))}
        </select>
        <div>
          <p className="mb-0" style={{ fontSize: '24px', fontWeight: 700, color: '#FFD700' }}>
            {loading ? '--' : formatCurrency(price)}
          </p>
          <p className="mb-0" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Live Market Data</p>
        </div>
      </div>

      {/* 24h stats */}
      <div className="flex items-center gap-6 ml-auto flex-wrap">
        <Stat label="24h Change" color={isPositive ? '#22c55e' : '#ef4444'}>
          <span style={{ color: isPositive ? '#22c55e' : '#ef4444' }}>
            {isPositive ? '+' : ''}{change24h.toFixed(2)}%
          </span>
        </Stat>
        <Stat label="24h High">{formatCurrency(high24h)}</Stat>
        <Stat label="24h Low">{formatCurrency(low24h)}</Stat>
        <Stat label={`24h Volume (${pair.quote})`}>{fmtVol(volume24h)}</Stat>
      </div>
    </div>
  );
}

function Stat({ label, children, color }: { label: string; children: React.ReactNode; color?: string }) {
  return (
    <div>
      <p className="mb-1" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)' }}>
        {label}
      </p>
      <p className="mb-0" style={{ fontSize: '14px', fontWeight: 600, color: color || '#ffffff' }}>
        {children}
      </p>
    </div>
  );
}
