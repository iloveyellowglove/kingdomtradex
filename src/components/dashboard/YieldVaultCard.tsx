import { formatCurrency } from '@/lib/utils/formatting';

interface YieldVaultCardProps {
  dailyRate: number;
  balance: number;
}

export default function YieldVaultCard({ dailyRate, balance }: YieldVaultCardProps) {
  const dailyEarnings = balance * (dailyRate / 100);

  return (
    <div className="rounded-xl p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6" style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,215,0,0.1)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>
        <div>
          <p className="mb-1" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)' }}>
            Daily Yield Rate
          </p>
          <p className="mb-0" style={{ fontSize: '24px', fontWeight: 600, color: '#FFD700' }}>
            {dailyRate}%
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div>
          <p className="mb-1" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)' }}>
            Today&apos;s Earnings
          </p>
          <p className="mb-0" style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff' }}>
            {formatCurrency(dailyEarnings)} USDT
          </p>
        </div>
      </div>

      <a
        href="/earnings"
        className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium no-underline transition-colors"
        style={{ color: '#FFD700', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)' }}
      >
        View Earnings
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  );
}
