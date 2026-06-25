'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartColors, defaultAxisProps, defaultGridProps, animationConfig, ChartTooltip, ChartSkeleton, ChartEmpty, formatYAxis } from '@/lib/chartTheme';

interface DataPoint { label: string; amount: number; }

interface Props { data: DataPoint[]; height?: number; loading?: boolean; }

export default function DepositBarChart({ data, height = 260, loading }: Props) {
  if (loading) return <ChartSkeleton height={height} />;
  if (!data?.length) return <ChartEmpty message="No deposit data yet" height={height} />;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid {...defaultGridProps} />
          <XAxis dataKey="label" {...defaultAxisProps} tick={{ ...defaultAxisProps.tick, fontSize: 11 }} />
          <YAxis {...defaultAxisProps} tickFormatter={formatYAxis} width={50} tick={{ ...defaultAxisProps.tick, fontSize: 11 }} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="amount" name="Deposit" fill={chartColors.gold}
            radius={[4, 4, 0, 0]} maxBarSize={40}
            animationDuration={animationConfig.duration} animationEasing={animationConfig.easing} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
