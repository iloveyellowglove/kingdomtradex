import type { DownlineCounts } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatting';

interface DisciplesSummaryProps {
  downlineCounts: DownlineCounts;
  totalPaidComm: number;
  totalPendingComm: number;
}

export default function DisciplesSummary({ downlineCounts, totalPaidComm, totalPendingComm }: DisciplesSummaryProps) {
  const directDisciples = downlineCounts.level_1;
  const totalDisciples = Object.values(downlineCounts).reduce((a, b) => a + b, 0);

  let rank = '';
  if (directDisciples >= 20 && totalDisciples >= 200) rank = 'Apostle';
  else if (directDisciples >= 10 && totalDisciples >= 50) rank = 'Prophet';
  else if (directDisciples >= 5) rank = 'Elder';

  return (
    <div className="rounded-xl" style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="mb-0" style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
          Disciples
        </p>
        <a
          href="/referral-tree"
          className="text-sm font-medium no-underline"
          style={{ color: '#FFD700' }}
        >
          View All
        </a>
      </div>
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-1" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)' }}>
              Direct Disciples
            </p>
            <p className="mb-0" style={{ fontSize: '28px', fontWeight: 600, color: '#FFD700' }}>
              {directDisciples}
            </p>
          </div>
          <div>
            <p className="mb-1" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)' }}>
              Total Network
            </p>
            <p className="mb-0" style={{ fontSize: '28px', fontWeight: 600, color: '#ffffff' }}>
              {totalDisciples}
            </p>
          </div>
        </div>

        {rank && (
          <div className="rounded-lg p-3 bg-kt-active-bg">
            <p className="mb-1" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)' }}>
              Covenant Rank
            </p>
            <p className="mb-0" style={{ fontSize: '18px', fontWeight: 600, color: '#FFD700' }}>{rank}</p>
          </div>
        )}

        <div>
          <p className="mb-2" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)' }}>
            Blessings Earned
          </p>
          <p className="mb-1" style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff' }}>
            {formatCurrency(totalPaidComm + totalPendingComm)} USDT
          </p>
          <p className="mb-0" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            {formatCurrency(totalPaidComm)} paid, {formatCurrency(totalPendingComm)} pending
          </p>
        </div>
      </div>
    </div>
  );
}
