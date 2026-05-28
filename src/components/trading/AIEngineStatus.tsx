import { formatCurrency } from '@/lib/utils/formatting';

interface AIEngineStatusProps {
  dailyRate: number;
  lockedBalance: number;
  activeLockCount: number;
}

export default function AIEngineStatus({ dailyRate, lockedBalance, activeLockCount }: AIEngineStatusProps) {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const hoursLeft = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 3600000));
  const minutesLeft = Math.max(0, Math.floor(((midnight.getTime() - now.getTime()) % 3600000) / 60000));

  return (
    <div className="rounded-xl p-5 mb-6" style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.4)' }} />
          <div>
            <p className="mb-1" style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
              AI Trading Engine
            </p>
            <p className="mb-0" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              Status: <span style={{ color: '#22c55e' }}>Active</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="mb-1" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)' }}>
              Daily Yield Rate
            </p>
            <p className="mb-0" style={{ fontSize: '18px', fontWeight: 600, color: '#FFD700' }}>
              Up to {dailyRate}%
            </p>
          </div>
          <div>
            <p className="mb-1" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)' }}>
              Locked Balance
            </p>
            <p className="mb-0" style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff' }}>
              {formatCurrency(lockedBalance)} USDT
            </p>
          </div>
          <div>
            <p className="mb-1" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)' }}>
              Active Locks
            </p>
            <p className="mb-0" style={{ fontSize: '18px', fontWeight: 600, color: '#FFD700' }}>
              {activeLockCount}
            </p>
          </div>
          <div>
            <p className="mb-1" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)' }}>
              Next Distribution
            </p>
            <p className="mb-0" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
              {hoursLeft}h {minutesLeft}m
            </p>
          </div>
        </div>

        <a
          href="/earnings"
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium no-underline transition-colors"
          style={{ color: '#FFD700', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)', flexShrink: 0 }}
        >
          View Your Earnings
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="mb-0" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
          Strategy: Multi-exchange arbitrage and momentum. Your locked deposits earn up to {dailyRate}% daily yield automatically across {activeLockCount} active lock{activeLockCount !== 1 ? 's' : ''}. The AI engine manages all trading on your behalf.
        </p>
      </div>
    </div>
  );
}
