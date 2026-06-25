'use client';

import type { Deposit, ReferralCommission } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils/formatting';

interface ActivityItem {
  type: 'deposit' | 'commission';
  description: string;
  amount: number;
  currency: string;
  date: string;
}

interface RecentActivityProps {
  deposits: Deposit[];
  commissions: ReferralCommission[];
}

export default function RecentActivity({ deposits, commissions }: RecentActivityProps) {
  const items: ActivityItem[] = [
    ...deposits.map((d): ActivityItem => ({
      type: 'deposit' as const,
      description: `Deposit ${d.currency}`,
      amount: Number(d.amount),
      currency: d.currency,
      date: d.created_at,
    })),
    ...commissions.map((c): ActivityItem => ({
      type: 'commission' as const,
      description: `Blessing from Disciple #${c.source_user_id}`,
      amount: Number(c.amount),
      currency: 'USDT',
      date: c.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="rounded-xl" style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="mb-0" style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
          Recent Activity
        </p>
      </div>
      <div className="p-3">
        {items.length > 0 ? (
          items.map((item, i) => (
            <div
              key={`${item.type}-${i}`}
              className="flex items-center gap-3 p-3 rounded-lg transition-colors"
              style={{}}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{
                background: item.type === 'deposit' ? 'rgba(0,200,83,0.1)' : 'rgba(255,215,0,0.1)',
              }}>
                {item.type === 'deposit' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00c853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="mb-0 text-sm" style={{ color: '#ffffff' }}>{item.description}</p>
                <p className="mb-0" style={{ fontSize: '12px', color: 'var(--kt-text-tertiary)' }}>{formatDate(item.date)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="mb-0 text-sm font-medium" style={{
                  color: item.type === 'deposit' ? '#ffffff' : '#FFD700',
                }}>
                  {item.type === 'deposit' ? '+' : '+'}{formatCurrency(item.amount)} {item.currency}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="p-6 text-center mb-0" style={{ fontSize: '14px', color: 'var(--kt-text-tertiary)' }}>
            No recent activity yet.
          </p>
        )}
      </div>
    </div>
  );
}
