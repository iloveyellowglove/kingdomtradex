import { formatCurrency } from '@/lib/utils/formatting';

interface StatsCardProps {
  label: string;
  value: number | string;
  accent?: 'gold';
  subline?: string;
}

export default function StatsCard({ label, value, accent, subline }: StatsCardProps) {
  return (
    <div className="rounded-xl p-5" style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <p className="mb-2" style={{
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'rgba(255,255,255,0.5)',
      }}>
        {label}
      </p>
      <p className="mb-0" style={{
        fontSize: '24px',
        fontWeight: 600,
        color: accent === 'gold' ? '#FFD700' : '#ffffff',
      }}>
        {formatCurrency(value)}
        <span style={{ fontSize: '14px', fontWeight: 400, color: 'rgba(255,255,255,0.4)', marginLeft: '6px' }}>USDT</span>
      </p>
      {subline && (
        <p className="mt-2 mb-0" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
          {subline}
        </p>
      )}
    </div>
  );
}
