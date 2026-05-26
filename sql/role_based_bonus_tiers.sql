-- ============================================================================
-- Role-Based Bonus Tiers Migration
-- Updates existing users to the new tiered bonus system.
-- Safe to run multiple times.
-- ============================================================================

-- Pastors: $100 bonus, unlocks at $200 total deposited
UPDATE users SET bonus_balance = 100, minimum_deposit_to_unlock = 200
  WHERE role = 'pastor' AND bonus_locked = true;

-- Members (and any other non-pastor, non-admin role): $50 bonus, unlocks at $100
UPDATE users SET minimum_deposit_to_unlock = 100
  WHERE role NOT IN ('pastor', 'admin') AND (minimum_deposit_to_unlock IS NULL OR minimum_deposit_to_unlock = 0);

-- Admins: no bonus, no lock
UPDATE users SET bonus_balance = 0, bonus_locked = false, minimum_deposit_to_unlock = 0
  WHERE role = 'admin';
