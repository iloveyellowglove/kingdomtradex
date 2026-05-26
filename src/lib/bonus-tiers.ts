export type BonusTier = { bonusAmount: number; unlockThreshold: number };

export function getBonusTier(role: string): BonusTier {
  if (role === 'pastor') return { bonusAmount: 100, unlockThreshold: 200 };
  if (role === 'admin') return { bonusAmount: 0, unlockThreshold: 0 };
  return { bonusAmount: 50, unlockThreshold: 100 };
}
