'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { chartColors, defaultAxisProps, defaultGridProps, animationConfig, ChartTooltip, ChartSkeleton, ChartEmpty } from '@/lib/chartTheme';

interface DataPoint { level: string; count: number; earned: number; }

interface Props { data: DataPoint[]; height?: number; loading?: boolean; }

const LEVEL_COLORS = [
  chartColors.gold,
  '#d4a80b',
  '#b8910a',
  '#9c7a08',
  '#806307',
];

export default function ReferralTreeChart({ data, height = 260, loading }: Props) {
  if (loading) return <ChartSkeleton height={height} />;
  if (!data?.length) return <ChartEmpty message="No referral data yet" height={height} />;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="horizontal" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid {...defaultGridProps} />
          <XAxis dataKey="level" {...defaultAxisProps} tick={{ ...defaultAxisProps.tick, fontSize: 11 }} />
          <YAxis {...defaultAxisProps} tick={{ ...defaultAxisProps.tick, fontSize: 11 }} hide />
          <Tooltip content={<ChartTooltip valuePrefix="" />} />
          <Bar dataKey="count" name="Referrals" maxBarSize={44} radius={[4, 4, 0, 0]}
            animationDuration={animationConfig.duration} animationEasing={animationConfig.easing}>
            {data.map((_, i) => (
              <Cell key={i} fill={LEVEL_COLORS[i] || chartColors.gold} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
