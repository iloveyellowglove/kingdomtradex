'use client';

import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';
import { chartColors, defaultAxisProps, defaultGridProps, animationConfig, ChartTooltip, ChartSkeleton, ChartEmpty, formatYAxis } from '@/lib/chartTheme';

interface DataPoint { label: string; value: number; date?: string; }

interface Props {
  data: DataPoint[];
  height?: number;
  showGrid?: boolean;
  showAxis?: boolean;
  timeRange?: string;
  loading?: boolean;
  emptyMessage?: string;
}

export default function EarningsLineChart({ data, height = 280, showGrid = true, showAxis = true, loading, emptyMessage }: Props) {
  if (loading) return <ChartSkeleton height={height} />;
  if (!data?.length) return <ChartEmpty message={emptyMessage || 'No earnings data yet'} height={height} />;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="earn-green" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ECB81" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#0ECB81" stopOpacity={0} />
            </linearGradient>
          </defs>
          {showGrid && <CartesianGrid {...defaultGridProps} />}
          {showAxis && (
            <XAxis dataKey="label" {...defaultAxisProps} tick={{ ...defaultAxisProps.tick, fontSize: 11 }} />
          )}
          {showAxis && (
            <YAxis {...defaultAxisProps} tickFormatter={formatYAxis} width={50}
              tick={{ ...defaultAxisProps.tick, fontSize: 11 }} />
          )}
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="value" stroke={chartColors.green} strokeWidth={2}
            fill="url(#earn-green)" dot={false}
            activeDot={{ r: 5, fill: chartColors.green, stroke: '#0B0E11', strokeWidth: 2 }}
            animationDuration={animationConfig.duration} animationEasing={animationConfig.easing} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
