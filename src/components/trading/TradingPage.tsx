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
  userId: number;
}

export default function TradingPage({ dailyRate, lockedBalance, activeLockCount }: Props) {
  useEffect(() => { seedTrades(30); }, []);

  return (
    <div className="min-h-screen" style={{ background: '#0B0E11' }}>
      <AITradingHeader />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Two-column: Trade feed 65% LEFT, Chart+Strategy+Heatmap 35% RIGHT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Live AI Trade Feed (dominant) */}
          <div className="lg:col-span-2">
            <AITradeFeed />
          </div>

          {/* RIGHT: Chart + Strategy + Heatmap (compact) */}
          <div className="lg:col-span-1 space-y-4">
            <AIPerformanceChart dailyRate={dailyRate} lockedBalance={lockedBalance} />
            <AIStrategyCard dailyRate={dailyRate} lockedBalance={lockedBalance} activeLockCount={activeLockCount} />
            <TradingHeatmap />
          </div>
        </div>

        <p className="text-center text-[10px] text-[#5E6673] pb-8">
          AI trading results are projections based on engine activity. Past performance does not indicate future results.
        </p>
      </div>
    </div>
  );
}
