'use client';

import AITradingHeader from '@/components/trading/AITradingHeader';
import AIPerformanceChart from '@/components/trading/AIPerformanceChart';
import AIStrategyCard from '@/components/trading/AIStrategyCard';
import AITradeFeed from '@/components/trading/AITradeFeed';
import TradingHeatmap from '@/components/trading/TradingHeatmap';
import { useEffect } from 'react';
import { seedTrades } from '@/lib/ai-trade-simulator';

interface Props {
  dailyRate: number;
  lockedBalance: number;
  activeLockCount: number;
  dailyProjection: number;
  activeTiers: string[];
  userId: number;
}

export default function TradingPage({ dailyRate, lockedBalance, activeLockCount, activeTiers }: Props) {
  // Pre-seed trade data on mount
  useEffect(() => { seedTrades(20); }, []);

  return (
    <div className="min-h-screen" style={{ background: '#0B0E11' }}>
      <AITradingHeader />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Two-column layout: Left (65%) + Right (35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            <AIPerformanceChart dailyRate={dailyRate} lockedBalance={lockedBalance} />
            <AIStrategyCard
              dailyRate={dailyRate}
              lockedBalance={lockedBalance}
              activeLockCount={activeLockCount}
              activeTiers={activeTiers}
            />
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-1 space-y-6">
            <AITradeFeed />
            <TradingHeatmap />
          </div>
        </div>

        {/* Compliance */}
        <p className="text-center text-[10px] text-[#5E6673] pb-8">
          AI trading results are projections based on engine activity. Past performance does not indicate future results.
        </p>
      </div>
    </div>
  );
}
