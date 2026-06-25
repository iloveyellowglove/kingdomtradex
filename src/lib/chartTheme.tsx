// ============================================================================
// Shared Chart Theme — all charts across the platform use these constants
// ============================================================================

import React from 'react';

// ── Colors ────────────────────────────────────────────────────────────────────

export const chartColors = {
  bg: '#1E2329',
  grid: '#2B3139',
  axisTick: '#848E9C',
  axisLine: '#2B3139',
  text: '#EAECEF',
  textMuted: '#5E6673',
  green: '#0ECB81',
  gold: '#F0B90B',
  red: '#F6465D',
  cursor: 'rgba(240,185,11,0.4)',
} as const;

// ── Default Props ─────────────────────────────────────────────────────────────

export const defaultGridProps = {
  stroke: chartColors.grid,
  strokeDasharray: '3 3',
  opacity: 0.4,
  vertical: false,
};

export const defaultAxisProps = {
  tick: { fill: chartColors.axisTick, fontSize: 12, fontFamily: 'system-ui' },
  axisLine: { stroke: chartColors.axisLine },
  tickLine: false,
};

export const defaultTooltipProps = {
  contentStyle: {
    background: '#1E2329',
    border: '1px solid #2B3139',
    borderRadius: 8,
    color: '#EAECEF',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    fontSize: 13,
  },
  cursor: { stroke: chartColors.cursor, strokeDasharray: '4 4' },
};

export const defaultDotProps = {
  r: 4,
  fill: chartColors.green,
  stroke: '#0B0E11',
  strokeWidth: 2,
  activeDot: { r: 6, fill: chartColors.green, stroke: '#0B0E11', strokeWidth: 2 },
};

export const animationConfig = {
  duration: 1500,
  easing: 'ease-in-out' as const,
};

// ── Gradient Definitions (SVG linearGradient) ─────────────────────────────────

export function ChartGradients() {
  return (
    <defs>
      <linearGradient id="gradient-green" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0ECB81" stopOpacity={0.3} />
        <stop offset="100%" stopColor="#0ECB81" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="gradient-gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F0B90B" stopOpacity={0.2} />
        <stop offset="100%" stopColor="#F0B90B" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="gradient-red" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F6465D" stopOpacity={0.2} />
        <stop offset="100%" stopColor="#F6465D" stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

// ── Reusable Tooltip Component ─────────────────────────────────────────────────

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
  valuePrefix?: string;
}

export function ChartTooltip({ active, payload, label, valuePrefix = '$' }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1E2329', border: '1px solid #2B3139', borderRadius: 8,
      padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', fontSize: 13,
    }}>
      {label && <p style={{ color: '#848E9C', margin: '0 0 6px', fontSize: 11 }}>{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: i > 0 ? 3 : 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
          <span style={{ color: '#EAECEF', fontWeight: 600 }}>{valuePrefix}{Number(entry.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          <span style={{ color: '#848E9C', fontSize: 11 }}>{entry.name}</span>
        </div>
      ))}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div
      className="rounded-lg animate-pulse w-full"
      style={{ height, background: '#2B3139', opacity: 0.3 }}
    />
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

export function ChartEmpty({ message = 'No data yet', height = 280 }: { message?: string; height?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg"
      style={{ height, background: 'rgba(255,255,255,0.01)', border: '1px solid #2B3139' }}
    >
      <div className="text-center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#5E6673" strokeWidth="1.5" className="mx-auto mb-2">
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
        <p style={{ color: '#5E6673', fontSize: 13 }}>{message}</p>
      </div>
    </div>
  );
}

// ── Y-axis tick formatter (abbreviated for mobile) ───────────────────────────

export function formatYAxis(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

// ── Mobile detection ──────────────────────────────────────────────────────────

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}
