// ============================================================================
// AI Trade Simulator — generates realistic trade feed and chart data
// Used on the /trading page to show live AI activity
// ============================================================================

const PAIRS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT', 'LINK'];
const TIERS: Tier[] = ['Kingdom', 'Legacy', 'Growth', 'Builder'];
type Tier = 'Kingdom' | 'Legacy' | 'Growth' | 'Builder';

const TIER_COLORS: Record<Tier, string> = {
  Kingdom: '#F0B90B',
  Legacy: '#A78BFA',
  Growth: '#0ECB81',
  Builder: '#3B82F6',
};

export interface SimulatedTrade {
  id: number;
  time: Date;
  pair: string;
  side: 'BUY' | 'SELL';
  tier: Tier;
  tierColor: string;
  profit: number; // percentage, e.g. 0.42 or -0.18
  profitStr: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  trades: number;
  date: string;
}

let tradeCounter = 0;
const recentTrades: SimulatedTrade[] = [];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

export function generateTrade(): SimulatedTrade {
  const side = Math.random() < 0.6 ? 'BUY' : 'SELL';
  const isWin = Math.random() < 0.65;
  const profit = side === 'BUY'
    ? (isWin ? randomBetween(0.1, 1.2) : randomBetween(-0.8, -0.05))
    : (isWin ? randomBetween(0.1, 0.8) : randomBetween(-0.6, -0.03));

  const trade: SimulatedTrade = {
    id: ++tradeCounter,
    time: new Date(),
    pair: pick(PAIRS),
    side,
    tier: pick(TIERS),
    tierColor: TIER_COLORS[pick(TIERS)],
    profit,
    profitStr: `${profit >= 0 ? '+' : ''}${profit.toFixed(2)}%`,
  };

  recentTrades.unshift(trade);
  if (recentTrades.length > 100) recentTrades.pop();
  return trade;
}

/** Pre-populate trades going back ~2 hours */
export function seedTrades(count = 20): SimulatedTrade[] {
  if (recentTrades.length > 0) return recentTrades;
  for (let i = 0; i < count; i++) {
    const trade = generateTrade();
    trade.time = new Date(Date.now() - (count - i) * 360000); // spread over ~2h
    recentTrades[i] = trade;
  }
  tradeCounter = count;
  return [...recentTrades];
}

export function getRecentTrades(): SimulatedTrade[] {
  return recentTrades;
}

/** Calculate win rate from recent trades */
export function getWinRate(): number {
  if (recentTrades.length === 0) return 65;
  const wins = recentTrades.filter(t => t.profit > 0).length;
  return Math.round((wins / recentTrades.length) * 100);
}

export function getTodayPnL(): number {
  if (recentTrades.length === 0) return 0;
  return recentTrades
    .filter(t => t.time.getDate() === new Date().getDate())
    .reduce((sum, t) => sum + t.profit, 0);
}

/** Generate cumulative chart data */
export function generateChartData(days: number, dailyRate: number, lockedBalance: number): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let cumulative = 0;
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const growth = randomBetween(dailyRate * 0.6, dailyRate * 1.4);
    cumulative += lockedBalance * (growth / 100);
    const trades = Math.floor(Math.random() * 8) + 3;
    data.push({
      label: days <= 1
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : days <= 7
          ? d.toLocaleDateString([], { weekday: 'short' })
          : d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      value: Math.round(cumulative * 100) / 100,
      trades,
      date: d.toISOString().split('T')[0],
    });
  }
  return data;
}

/** Generate heatmap data for pairs */
export function generateHeatmapData(): { pair: string; change: number }[] {
  return PAIRS.map(pair => ({
    pair,
    change: randomBetween(-3, 5),
  }));
}
