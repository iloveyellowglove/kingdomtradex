-- ============================================================================
-- Migration 05: Rename lock_months to lock_days (days not months)
-- Also updates lock_deposit function to use days interval.
-- Run in Supabase SQL Editor AFTER migration_04_withdrawal_profit_cols.sql.
-- ============================================================================

-- 1. Rename columns in tables
ALTER TABLE lock_tiers   RENAME COLUMN lock_months TO lock_days;
ALTER TABLE deposit_locks RENAME COLUMN lock_months TO lock_days;
ALTER TABLE deposits      RENAME COLUMN lock_months TO lock_days;

-- 2. Update CHECK constraint on deposit_locks
ALTER TABLE deposit_locks DROP CONSTRAINT IF EXISTS deposit_locks_lock_months_check;
ALTER TABLE deposit_locks ADD CONSTRAINT deposit_locks_lock_days_check
  CHECK (lock_days IN (60, 90, 120, 180));

-- 3. Update lock_tiers CHECK constraint
ALTER TABLE lock_tiers DROP CONSTRAINT IF EXISTS lock_tiers_lock_months_check;
ALTER TABLE lock_tiers ADD CONSTRAINT lock_tiers_lock_days_check
  CHECK (lock_days IN (60, 90, 120, 180));

-- 4. Recreate lock_deposit function with corrected parameter and days interval
CREATE OR REPLACE FUNCTION lock_deposit(
  p_user_id    BIGINT,
  p_deposit_id BIGINT,
  p_amount     NUMERIC,
  p_tier       TEXT,
  p_lock_days  INT,
  p_daily_rate NUMERIC
)
RETURNS SETOF deposit_locks AS $$
DECLARE
  v_lock deposit_locks;
BEGIN
  INSERT INTO deposit_locks (
    user_id, deposit_id, amount, tier, lock_days, daily_rate,
    locked_at, unlocks_at, status
  ) VALUES (
    p_user_id, p_deposit_id, p_amount, p_tier, p_lock_days, p_daily_rate,
    now(), now() + (p_lock_days || ' days')::interval, 'locked'
  )
  RETURNING * INTO v_lock;

  PERFORM credit_locked_balance(p_user_id, p_amount);

  RETURN NEXT v_lock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
