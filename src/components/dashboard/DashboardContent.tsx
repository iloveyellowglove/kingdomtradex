'use client';

import type { User, DownlineCounts, WithdrawalLock, Deposit, ReferralCommission } from '@/lib/types';
import { formatDate } from '@/lib/utils/formatting';
import StatsCard from '@/components/dashboard/StatsCard';
import YieldVaultCard from '@/components/dashboard/YieldVaultCard';
import RecentActivity from '@/components/dashboard/RecentActivity';
import DisciplesSummary from '@/components/dashboard/DisciplesSummary';

interface DashboardProps {
  user: User;
  downlineCounts: DownlineCounts;
  deposits: Deposit[];
  commissions: ReferralCommission[];
  withdrawalLock: WithdrawalLock | null;
  totalPaidComm: number;
  totalPendingComm: number;
  depositAddresses: Record<string, string> | null;
  depositAddressError: string | null;
  dailyRate: number;
  totalEarned: number;
}

export default function DashboardContent({
  user,
  downlineCounts,
  deposits,
  commissions,
  withdrawalLock,
  totalPaidComm,
  totalPendingComm,
  dailyRate,
  totalEarned,
}: DashboardProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kingdomtradex.vercel.app';
  const referralLink = `${appUrl}/register?ref=${user.referral_code}`;

  function copyReferralLink() {
    navigator.clipboard.writeText(referralLink);
  }

  return (
    <div className="py-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#ffffff', margin: '0 0 4px 0' }}>
            Welcome back, {user.username}
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Faithful stewardship multiplies God&apos;s resources
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)' }}>Disciple Code </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#FFD700' }}>{user.referral_code}</span>
          </div>
          <button
            onClick={copyReferralLink}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{ color: '#FFD700', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)' }}
          >
            Copy Link
          </button>
        </div>
      </div>

      {/* Alerts */}
      {withdrawalLock && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.15)' }}>
          <div className="flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '1px', flexShrink: 0 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <p className="mb-0" style={{ fontSize: '14px', fontWeight: 500, color: '#FFD700' }}>
                Withdrawals locked until {formatDate(withdrawalLock.lock_expiry_time)}
              </p>
            </div>
          </div>
        </div>
      )}

      {Number(user.pending_withdrawal_amount) > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(180,124,255,0.04)', border: '1px solid rgba(180,124,255,0.15)' }}>
          <p className="mb-0" style={{ fontSize: '14px', color: '#f0edf5' }}>
            Pending withdrawal: <strong>{Number(user.pending_withdrawal_amount).toFixed(2)} USDT</strong> (processing in 72 hours after request)
          </p>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Display Balance"
          value={user.display_balance}
          accent="gold"
          subline={
            user.bonus_balance > 0 && user.bonus_locked
              ? `$${Number(user.bonus_balance).toFixed(2)} bonus locked until $${Math.max(0, Number(user.minimum_deposit_to_unlock || 100) - Number(user.total_deposited_real)).toFixed(2)} more deposited`
              : undefined
          }
        />
        <StatsCard label="Total Deposited" value={user.total_deposited_real} />
        <StatsCard label="Total Earned" value={totalEarned} />
        <StatsCard label="Total Withdrawn" value={user.total_withdrawn_real} />
      </div>

      {/* Yield Vault */}
      <YieldVaultCard dailyRate={dailyRate} balance={Number(user.display_balance)} />

      {/* Two-column activity section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity deposits={deposits} commissions={commissions} />
        <DisciplesSummary
          downlineCounts={downlineCounts}
          totalPaidComm={totalPaidComm}
          totalPendingComm={totalPendingComm}
        />
      </div>
    </div>
  );
}
