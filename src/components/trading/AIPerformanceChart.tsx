'use client';

import { useState, useEffect, useMemo } from 'react';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';
import { chartColors, defaultAxisProps, defaultGridProps, ChartTooltip, ChartSkeleton, formatYAxis } from '@/lib/chartTheme';
import { generateChartData, getWinRate } from '@/lib/ai-trade-simulator';

interface Props { dailyRate: number; lockedBalance: number; }

const RANGES = [
  { key: '1', label: '24H', days: 1 },
  { key: '7', label: '7D', days: 7 },
  { key: '30', label: '30D', days: 30 },
  { key: '90', label: '90D', days: 90 },
  { key: '365', label: 'ALL', days: 365 },
] as const;

export default function AIPerformanceChart({ dailyRate, lockedBalance }: Props) {
  const [range, setRange] = useState<string>('30');
  const [loading, setLoading] = useState(true);
  const [winRate, setWinRate] = useState(65);
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);
  const [totalPnL, setTotalPnL] = useState(0);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const days = parseInt(range);
      const data = generateChartData(days, dailyRate, lockedBalance || 500);
      setChartData(data.map(d => ({ label: d.label, value: d.value })));
      setTotalPnL(data.length > 0 ? data[data.length - 1].value : 0);
      setWinRate(getWinRate());
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [range, dailyRate, lockedBalance]);

  return (
    <div className="rounded-xl p-5" style={{ background: '#1E2329', border: '1px solid #2B3139' }}>
      {/* Header with overlays */}
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div>
          <span className="text-xl sm:text-2xl font-bold tabular-nums" style={{ color: totalPnL >= 0 ? '#0ECB81' : '#F6465D' }}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-[#848E9C] ml-2">Total P&amp;L</span>
        </div>
        <span className="text-xs text-[#848E9C]">
          Win Rate: <span className="text-[#EAECEF] font-bold">{winRate}%</span>
        </span>
      </div>

      {/* Time range tabs */}
      <div className="flex gap-1 mb-3">
        {RANGES.map(r => (
          <button key={r.key} onClick={() => setRange(r.key)}
            className="px-3 py-1 rounded text-xs font-medium transition"
            style={{
              background: range === r.key ? 'rgba(240,185,11,0.1)' : 'transparent',
              color: range === r.key ? '#F0B90B' : '#848E9C',
            }}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {loading ? (
        <ChartSkeleton height={300} />
      ) : (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="perf-green" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ECB81" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0ECB81" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...defaultGridProps} />
              <XAxis dataKey="label" {...defaultAxisProps} tick={{ ...defaultAxisProps.tick, fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis {...defaultAxisProps} tickFormatter={formatYAxis} width={48} tick={{ ...defaultAxisProps.tick, fontSize: 10 }} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#0ECB81" strokeWidth={2}
                fill="url(#perf-green)" dot={false}
                activeDot={{ r: 4, fill: '#0ECB81', stroke: '#0B0E11', strokeWidth: 2 }}
                animationDuration={1500} animationEasing="ease-in-out" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="text-[10px] text-[#5E6673] mt-2">AI trading results are projections based on engine activity. Past performance does not indicate future results.</p>
    </div>
  );
}
