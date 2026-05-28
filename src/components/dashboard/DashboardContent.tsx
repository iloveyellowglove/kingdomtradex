'use client';

import type { User, DownlineCounts, WithdrawalLock, Deposit, ReferralCommission } from '@/lib/types';
import StatsCard from '@/components/dashboard/StatsCard';
import YieldVaultCard from '@/components/dashboard/YieldVaultCard';
import RecentActivity from '@/components/dashboard/RecentActivity';
import DisciplesSummary from '@/components/dashboard/DisciplesSummary';
import LockedDeposits from '@/components/dashboard/LockedDeposits';
import Link from 'next/link';

interface DashboardProps {
  user: User & {
    locked_balance?: number;
    profit_balance?: number;
    commission_balance?: number;
  };
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
  totalPaidComm,
  totalPendingComm,
  dailyRate,
  totalEarned,
}: DashboardProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kingdomtradex.vercel.app';
  const referralLink = `${appUrl}/register?ref=${user.referral_code}`;

  const lockedBalance = Number(user.locked_balance ?? 0);
  const profitBalance = Number(user.profit_balance ?? 0);
  const commissionBalance = Number(user.commission_balance ?? 0);
  const totalPortfolio = lockedBalance + profitBalance + commissionBalance + Number(user.display_balance ?? 0);

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

      {/* Pending withdrawal alert */}
      {Number(user.pending_withdrawal_amount) > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(180,124,255,0.04)', border: '1px solid rgba(180,124,255,0.15)' }}>
          <p className="mb-0" style={{ fontSize: '14px', color: '#f0edf5' }}>
            Pending withdrawal: <strong>{Number(user.pending_withdrawal_amount).toFixed(2)} USDT</strong>
          </p>
        </div>
      )}

      {/* 3-Balance Layout */}
      <div className="space-y-4">
        {/* Locked Principal — collapsible */}
        <LockedDeposits userId={user.id} />

        {/* Available Profit */}
        <div className="rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-sm text-text-muted mb-0">Available Profit</p>
            <p className="text-2xl font-bold mb-0" style={{ color: '#4CAF50' }}>
              ${profitBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <Link
            href="/withdrawals?type=profit"
            className="px-4 py-2 rounded-lg text-sm font-bold transition-colors no-underline"
            style={{ background: '#4CAF50', color: '#000', whiteSpace: 'nowrap' }}
          >
            Withdraw
          </Link>
        </div>

        {/* Commission Earnings */}
        <div className="rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-sm text-text-muted mb-0">Commission Earnings</p>
            <p className="text-2xl font-bold mb-0" style={{ color: '#B47CFF' }}>
              ${commissionBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <Link
            href="/withdrawals?type=commission"
            className="px-4 py-2 rounded-lg text-sm font-bold transition-colors no-underline"
            style={{ background: '#B47CFF', color: '#000', whiteSpace: 'nowrap' }}
          >
            Withdraw
          </Link>
        </div>

        {/* Total Portfolio Value */}
        <div className="rounded-xl p-4 text-center"
          style={{ background: 'rgba(255,215,0,0.04)', border: '1px solid rgba(255,215,0,0.12)' }}>
          <p className="text-sm text-text-muted mb-0">Total Portfolio Value</p>
          <p className="text-3xl font-bold mb-0" style={{ color: '#FFD700' }}>
            ${totalPortfolio.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total Deposited" value={user.total_deposited_real} />
        <StatsCard label="Total Earned" value={totalEarned} />
        <StatsCard label="Total Withdrawn" value={user.total_withdrawn_real} />
        <StatsCard
          label="Pending Rewards"
          value={totalPendingComm}
          accent="gold"
        />
      </div>

      {/* Yield Vault */}
      <YieldVaultCard dailyRate={dailyRate} balance={profitBalance + lockedBalance} />

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
