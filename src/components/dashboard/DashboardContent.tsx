'use client';

import { useState } from 'react';
import type { User, DownlineCounts, WithdrawalLock, Deposit, ReferralCommission } from '@/lib/types';
import BalanceSummary from '@/components/dashboard/BalanceSummary';
import PortfolioTabs from '@/components/dashboard/PortfolioTabs';
import DisciplesSummary from '@/components/dashboard/DisciplesSummary';
import KycStatusBadge from '@/components/kyc/KycStatusBadge';

interface DashboardProps {
  user: User & {
    locked_balance?: number;
    profit_balance?: number;
    commission_balance?: number;
    kyc_level?: number;
    kyc_status?: string;
    auto_withdrawal_enabled?: boolean;
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
  todayPnL: number;
  todayPnLPercent: number;
  recentEarnings: number[];
}

export default function DashboardContent({
  user,
  downlineCounts,
  totalPaidComm,
  totalPendingComm,
  totalEarned,
  todayPnL,
  todayPnLPercent,
  recentEarnings,
}: DashboardProps) {
  const [uidCopied, setUidCopied] = useState(false);
  const [refCopied, setRefCopied] = useState(false);

  const lockedBalance = Number(user.locked_balance ?? 0);
  const profitBalance = Number(user.profit_balance ?? 0);
  const commissionBalance = Number(user.commission_balance ?? 0);
  const totalPortfolio = lockedBalance + profitBalance + commissionBalance;

  function copyToClipboard(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text).then(() => {
      setter(true);
      setTimeout(() => setter(false), 2000);
    }).catch(() => {});
  }

  return (
    <div className="py-4 space-y-5 lg:max-w-none">
      {/* ---- HEADER: Avatar + Username + UID + KYC + Referral ---- */}
      <div
        className="flex flex-wrap items-center gap-3 p-4 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
          style={{ background: 'rgba(255,215,0,0.12)', color: '#FFD700' }}>
          {(user.username || '?').charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-kt-text-primary">{user.username}</span>
            <KycStatusBadge level={user.kyc_level ?? 0} size="sm" />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-kt-text-tertiary font-mono">UID: {user.id}</span>
            <button
              onClick={() => copyToClipboard(String(user.id), setUidCopied)}
              className="text-[10px] px-1.5 py-0.5 rounded transition"
              style={{ background: uidCopied ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.05)', color: uidCopied ? '#4CAF50' : 'rgba(255,255,255,0.4)' }}
            >
              {uidCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Referral code */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <p className="text-[9px] text-kt-text-tertiary uppercase">Referral</p>
            <p className="text-xs font-bold text-kt-gold font-mono">{user.referral_code}</p>
          </div>
          <button
            onClick={() => copyToClipboard(user.referral_code, setRefCopied)}
            className="text-[10px] px-2 py-1 rounded transition"
            style={{ background: refCopied ? 'rgba(76,175,80,0.15)' : 'rgba(255,215,0,0.08)', color: refCopied ? '#4CAF50' : '#FFD700' }}
          >
            {refCopied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* ---- BALANCE SECTION ---- */}
      <div
        className="p-4 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <BalanceSummary
          totalValue={totalPortfolio}
          profitBalance={profitBalance}
          commissionBalance={commissionBalance}
          lockedBalance={lockedBalance}
          todayPnL={todayPnL}
          todayPnLPercent={todayPnLPercent}
          recentEarnings={recentEarnings}
        />
      </div>

      {/* ---- PORTFOLIO / HOLDINGS SECTION ---- */}
      <div
        className="p-4 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <PortfolioTabs userId={user.id} />
      </div>

      {/* ---- REFERRAL SUMMARY ---- */}
      <DisciplesSummary
        downlineCounts={downlineCounts}
        totalPaidComm={totalPaidComm}
        totalPendingComm={totalPendingComm}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Total Deposited', value: `$${Number(user.total_deposited_real).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
          { label: 'Total Earned', value: `$${totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
          { label: 'Total Withdrawn', value: `$${Number(user.total_withdrawn_real).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
          { label: 'Pending Rewards', value: `$${totalPendingComm.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-[10px] text-kt-text-tertiary mb-1">{s.label}</p>
            <p className="text-sm font-bold text-kt-text-primary tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
