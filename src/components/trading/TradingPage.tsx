'use client';

import AITradingHeader from '@/components/trading/AITradingHeader';
import AIPerformanceChart from '@/components/trading/AIPerformanceChart';
import AIStrategyCard from '@/components/trading/AIStrategyCard';
import AITradeFeed from '@/components/trading/AITradeFeed';
import TradingHeatmap from '@/components/trading/TradingHeatmap';
import DepositBanner from '@/components/trading/DepositBanner';
import { useEffect } from 'react';
import { seedTrades } from '@/lib/ai-trade-simulator';

interface Props {
  dailyRate: number;
  lockedBalance: number;
  activeLockCount: number;
  dailyProjection: number;
  userId: number;
  hasDeposits: boolean;
  highestTierRate: number;
  totalEarned: number;
}

export default function TradingPage({ dailyRate, lockedBalance, activeLockCount, hasDeposits, highestTierRate, totalEarned }: Props) {
  useEffect(() => { seedTrades(30); }, []);

  return (
    <div className="min-h-screen pb-20 lg:pb-0" style={{ background: '#0B0E11' }}>
      <AITradingHeader />

      <div className="px-3 sm:px-4 py-4 space-y-4">
        {/* Deposit banner (only for non-depositors) */}
        {!hasDeposits && <DepositBanner />}

        {/* Two-column layout spanning full width */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <AITradeFeed />
          </div>
          <div className="lg:col-span-1 space-y-3">
            <div>
              <p className="text-[10px] text-[#5E6673] mb-1 px-1">Platform AI Performance</p>
              <AIPerformanceChart dailyRate={dailyRate} lockedBalance={lockedBalance} />
            </div>
            <AIStrategyCard
              lockedBalance={lockedBalance}
              activeLockCount={activeLockCount}
              highestTierRate={highestTierRate}
              totalEarned={totalEarned}
            />
            <TradingHeatmap />
          </div>
        </div>

        <p className="text-center text-[10px] text-[#5E6673]">
          AI trading results are projections based on engine activity. Past performance does not indicate future results.
        </p>
      </div>
    </div>
  );
}
