'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { chartColors, defaultAxisProps, defaultGridProps, animationConfig, ChartTooltip, ChartSkeleton, ChartEmpty, formatYAxis } from '@/lib/chartTheme';

interface DataPoint { label: string; balance: number; profit: number; }

interface Props { data: DataPoint[]; height?: number; timeRange?: string; loading?: boolean; }

export default function BalanceAreaChart({ data, height = 280, loading }: Props) {
  if (loading) return <ChartSkeleton height={height} />;
  if (!data?.length) return <ChartEmpty message="No balance history yet" height={height} />;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="bal-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F0B90B" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#F0B90B" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="bal-green" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ECB81" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#0ECB81" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...defaultGridProps} />
          <XAxis dataKey="label" {...defaultAxisProps} tick={{ ...defaultAxisProps.tick, fontSize: 11 }} />
          <YAxis {...defaultAxisProps} tickFormatter={formatYAxis} width={50} tick={{ ...defaultAxisProps.tick, fontSize: 11 }} />
          <Tooltip content={<ChartTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#848E9C' }}
            iconType="circle" iconSize={8}
          />
          <Area type="monotone" dataKey="balance" name="Total Balance" stroke={chartColors.gold} strokeWidth={2}
            fill="url(#bal-gold)" dot={false}
            activeDot={{ r: 5, fill: chartColors.gold, stroke: '#0B0E11', strokeWidth: 2 }}
            animationDuration={animationConfig.duration} animationEasing={animationConfig.easing} />
          <Area type="monotone" dataKey="profit" name="Profit" stroke={chartColors.green} strokeWidth={2}
            fill="url(#bal-green)" dot={false}
            activeDot={{ r: 5, fill: chartColors.green, stroke: '#0B0E11', strokeWidth: 2 }}
            animationDuration={animationConfig.duration} animationEasing={animationConfig.easing} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
