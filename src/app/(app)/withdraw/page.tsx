'use client';

import { useState, useEffect } from 'react';
import ProfitTab from '@/components/withdrawal/ProfitTab';
import PrincipalTab from '@/components/withdrawal/PrincipalTab';
import WithdrawalHistory from '@/components/withdrawal/WithdrawalHistory';
import AutoWithdrawSettings from '@/components/withdrawal/AutoWithdrawSettings';

export default function WithdrawPage() {
  const [tab, setTab] = useState<'profit' | 'principal' | 'history' | 'auto'>('profit');
  const [balances, setBalances] = useState({
    profit: 0,
    commission: 0,
    display: 0,
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/user/balance');
        const data = await res.json();
        if (data.success) {
          setBalances({
            profit: data.profitBalance ?? 0,
            commission: data.commissionBalance ?? 0,
            display: data.displayBalance ?? 0,
          });
        }
      } catch { /* ignore */ }
    }
    load();
  }, []);

  const tabs = [
    { key: 'profit' as const, label: 'Withdraw Profits' },
    { key: 'principal' as const, label: 'Withdraw Principal' },
    { key: 'history' as const, label: 'History' },
    { key: 'auto' as const, label: 'Auto' },
  ];

  return (
    <div className="py-4 px-4 lg:px-6">
      <h2 className="text-xl font-bold text-kt-text-primary mb-1">Withdraw</h2>
      <p className="text-sm text-kt-text-tertiary mb-6">Withdraw your earnings to any wallet</p>

      {/* Balance summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div
          className="p-4 rounded-xl"
          style={{ background: 'rgba(76,175,80,0.06)', border: '1px solid rgba(76,175,80,0.15)' }}
        >
          <p className="text-xs text-kt-text-tertiary uppercase tracking-wider mb-1">Profit Balance</p>
          <p className="text-2xl font-bold text-kt-green">${balances.profit.toFixed(2)}</p>
        </div>
        <div
          className="p-4 rounded-xl"
          style={{ background: 'rgba(180,124,255,0.06)', border: '1px solid rgba(180,124,255,0.15)' }}
        >
          <p className="text-xs text-kt-text-tertiary uppercase tracking-wider mb-1">Commission Balance</p>
          <p className="text-2xl font-bold text-[#B47CFF]">${balances.commission.toFixed(2)}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-2.5 rounded-lg text-xs font-bold transition"
            style={{
              background: tab === t.key ? 'rgba(255,215,0,0.12)' : 'transparent',
              color: tab === t.key ? '#FFD700' : 'rgba(255,255,255,0.45)',
              minHeight: 44,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'profit' && <ProfitTab />}
      {tab === 'principal' && <PrincipalTab />}
      {tab === 'history' && <WithdrawalHistory />}
      {tab === 'auto' && <AutoWithdrawSettings />}
    </div>
  );
}
