// ============================================================================
// AI Trade Simulator v2 - High-speed realistic trade feed
// 0.5-1.5s intervals, burst mode, weighted distributions
// ============================================================================

export interface SimulatedTrade {
  id: number;
  time: Date;
  pair: string;
  side: 'BUY' | 'SELL';
  tier: 'Kingdom' | 'Legacy' | 'Growth' | 'Builder';
  tierColor: string;
  profit: number;
  profitStr: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  trades: number;
  date: string;
}

const PAIRS_HIGH = ['BTC', 'ETH', 'SOL', 'BNB'];
const PAIRS_MED = ['XRP', 'DOGE', 'ADA', 'AVAX'];
const PAIRS_LOW = ['DOT', 'LINK', 'ETH/BTC', 'SOL/ETH', 'BNB/ETH'];
const ALL_PAIRS = [...PAIRS_HIGH, ...PAIRS_MED, ...PAIRS_LOW];

const TIERS: { name: SimulatedTrade['tier']; color: string; weight: number }[] = [
  { name: 'Kingdom', color: '#F0B90B', weight: 0.30 },
  { name: 'Growth', color: '#0ECB81', weight: 0.25 },
  { name: 'Legacy', color: '#A78BFA', weight: 0.25 },
  { name: 'Builder', color: '#3B82F6', weight: 0.20 },
];

type TradeCallback = (trade: SimulatedTrade) => void;
type BurstCallback = (count: number) => void;

let tradeCounter = 0;
const recentTrades: SimulatedTrade[] = [];
let timerId: ReturnType<typeof setTimeout> | null = null;
let burstTimerId: ReturnType<typeof setTimeout> | null = null;
let callbacks: TradeCallback[] = [];
let burstCallbacks: BurstCallback[] = [];

// ── Weighted random ───────────────────────────────────────────────────────────

function weightedPick<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

function randomBetween(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function pickPair(): string {
  const r = Math.random();
  if (r < 0.40) return PAIRS_HIGH[Math.floor(Math.random() * PAIRS_HIGH.length)];
  if (r < 0.75) return PAIRS_MED[Math.floor(Math.random() * PAIRS_MED.length)];
  return PAIRS_LOW[Math.floor(Math.random() * PAIRS_LOW.length)];
}

function generateProfit(): number {
  const r = Math.random();
  if (r < 0.65) return randomBetween(0.01, 1.50);   // small win
  if (r < 0.85) return randomBetween(-0.80, -0.01);  // small loss
  if (r < 0.95) return randomBetween(1.50, 3.00);    // big win
  return randomBetween(-2.00, -0.80);                 // big loss
}

// ── Public API ────────────────────────────────────────────────────────────────

export function generateTrade(): SimulatedTrade {
  const side = Math.random() < 0.62 ? 'BUY' : 'SELL';
  const tier = weightedPick(TIERS);
  const profit = generateProfit();

  return {
    id: ++tradeCounter,
    time: new Date(),
    pair: pickPair(),
    side,
    tier: tier.name,
    tierColor: tier.color,
    profit,
    profitStr: `${profit >= 0 ? '+' : ''}${profit.toFixed(2)}%`,
  };
}

export function seedTrades(count = 30): SimulatedTrade[] {
  if (recentTrades.length > 0) return [...recentTrades];
  for (let i = 0; i < count; i++) {
    const trade = generateTrade();
    trade.time = new Date(Date.now() - (count - i) * 60000); // spread over ~30 min
    trade.id = i + 1;
    recentTrades.push(trade);
  }
  tradeCounter = count;
  return [...recentTrades];
}

export function getRecentTrades(): SimulatedTrade[] {
  return recentTrades;
}

export function getWinRate(): number {
  if (recentTrades.length === 0) return 65;
  const wins = recentTrades.filter(t => t.profit > 0).length;
  return Math.round((wins / recentTrades.length) * 100);
}

export function getTodayPnL(): number {
  const today = new Date().getDate();
  const todayTrades = recentTrades.filter(t => t.time.getDate() === today);
  if (todayTrades.length === 0) return 0;
  return Math.round(todayTrades.reduce((s, t) => s + t.profit, 0) * 100) / 100;
}

// ── Engine start / stop ──────────────────────────────────────────────────────

export function startSimulator(onTrade: TradeCallback, onBurst?: BurstCallback) {
  stopSimulator();
  callbacks.push(onTrade);
  if (onBurst) burstCallbacks.push(onBurst);

  function schedule() {
    const delay = Math.random() * 1000 + 500; // 500-1500ms
    timerId = setTimeout(() => {
      const trade = generateTrade();
      recentTrades.unshift(trade);
      if (recentTrades.length > 200) recentTrades.length = 200;
      callbacks.forEach(cb => cb(trade));
      schedule();
    }, delay);
  }

  function scheduleBurst() {
    const delay = Math.random() * 15000 + 15000; // 15-30s
    burstTimerId = setTimeout(() => {
      const count = Math.floor(Math.random() * 3) + 3; // 3-5 trades
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          const trade = generateTrade();
          recentTrades.unshift(trade);
          if (recentTrades.length > 200) recentTrades.length = 200;
          callbacks.forEach(cb => cb(trade));
        }, i * 100);
      }
      burstCallbacks.forEach(cb => cb(count));
      scheduleBurst();
    }, delay);
  }

  schedule();
  scheduleBurst();
}

export function stopSimulator() {
  if (timerId) { clearTimeout(timerId); timerId = null; }
  if (burstTimerId) { clearTimeout(burstTimerId); burstTimerId = null; }
  callbacks = [];
  burstCallbacks = [];
}

// ── Chart data ────────────────────────────────────────────────────────────────

export function generateChartData(days: number, dailyRate: number, lockedBalance: number): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let cumulative = 0;
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const growth = randomBetween(dailyRate * 0.5, dailyRate * 1.5);
    cumulative += lockedBalance * (growth / 100);
    data.push({
      label: days <= 1
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : days <= 7
          ? d.toLocaleDateString([], { weekday: 'short' })
          : d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      value: Math.round(cumulative * 100) / 100,
      trades: Math.floor(Math.random() * 15) + 5,
      date: d.toISOString().split('T')[0],
    });
  }
  return data;
}

export function generateHeatmapData(): { pair: string; change: number }[] {
  return ALL_PAIRS.map(p => ({ pair: p, change: randomBetween(-3, 5) }));
}
