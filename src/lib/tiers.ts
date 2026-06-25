// ============================================================================
// Single Source of Truth — Lock Tier Configuration
// Import from here in ALL components. No hardcoded tier values anywhere else.
// ============================================================================

export interface TierConfig {
  key: string;
  name: string;
  duration: number;       // days
  dailyRate: number;       // decimal e.g. 0.012 = 1.2%
  minDeposit: number;      // USD
  maxDeposit: number;      // USD (Infinity for unlimited)
  color: string;           // hex
  featured: boolean;
  badge?: string;          // e.g. "BEST VALUE"
}

export const TIERS: Record<string, TierConfig> = {
  silver: {
    key: 'silver',
    name: 'Silver',
    duration: 180,
    dailyRate: 0.01,
    minDeposit: 50,
    maxDeposit: 99.99,
    color: '#848E9C',
    featured: false,
  },
  gold: {
    key: 'gold',
    name: 'Gold',
    duration: 270,
    dailyRate: 0.012,
    minDeposit: 100,
    maxDeposit: 499.99,
    color: '#F0B90B',
    featured: true,
    badge: 'POPULAR',
  },
  platinum: {
    key: 'platinum',
    name: 'Platinum',
    duration: 360,
    dailyRate: 0.014,
    minDeposit: 500,
    maxDeposit: 999.99,
    color: '#E2E8F0',
    featured: false,
  },
  diamond: {
    key: 'diamond',
    name: 'Diamond',
    duration: 540,
    dailyRate: 0.016,
    minDeposit: 1000,
    maxDeposit: Infinity,
    color: '#A78BFA',
    featured: false,
    badge: 'BEST VALUE',
  },
};

export const TIER_LIST = Object.values(TIERS);

export function getTierForAmount(amount: number): TierConfig | null {
  for (const tier of TIER_LIST) {
    if (amount >= tier.minDeposit && amount <= tier.maxDeposit) return tier;
  }
  if (amount >= 1000) return TIERS.diamond;
  return null;
}

export function getTierByKey(key: string): TierConfig | undefined {
  return TIERS[key];
}
