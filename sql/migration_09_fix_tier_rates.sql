-- ============================================================================
-- Migration 09: Fix Lock Tier Rates + Add password_resets.type column
-- Syncs lock_tiers daily_rate with the authoritative src/lib/tiers.ts
-- Also adds type column to password_resets for email verification support.
-- Run in Supabase SQL Editor BEFORE deploying code changes.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add type column to password_resets for email verification tokens
-- ---------------------------------------------------------------------------
ALTER TABLE password_resets ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'password_reset';

-- ---------------------------------------------------------------------------
-- 2. Update lock_tiers daily_rate to match src/lib/tiers.ts (single source of truth)
-- ---------------------------------------------------------------------------
-- Before: Silver=1.2%, Gold=1.5%, Platinum=2.0%, Diamond=3.0%
-- After:  Silver=1.0%, Gold=1.2%, Platinum=1.4%, Diamond=1.6%

UPDATE lock_tiers SET daily_rate = 0.010000 WHERE tier = 'silver';
UPDATE lock_tiers SET daily_rate = 0.012000 WHERE tier = 'gold';
UPDATE lock_tiers SET daily_rate = 0.014000 WHERE tier = 'platinum';
UPDATE lock_tiers SET daily_rate = 0.016000 WHERE tier = 'diamond';

-- Verify the updates (uncomment to check):
-- SELECT tier, label, lock_days, daily_rate FROM lock_tiers ORDER BY sort_order;

-- ---------------------------------------------------------------------------
-- 3. Widen withdrawals status CHECK to include 'cooling'
-- ---------------------------------------------------------------------------
ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_status_check;
ALTER TABLE withdrawals
  ADD CONSTRAINT withdrawals_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled', 'cooling', 'failed'));

-- ---------------------------------------------------------------------------
-- 4. RPC: process_principal_withdrawal_matured
-- For matured principal withdrawals: full amount, no forfeit, no cooling.
-- Used when deposit_lock has expired or doesn't exist.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_principal_withdrawal_matured(
    p_user_id    BIGINT,
    p_deposit_id BIGINT,
    p_coin       TEXT,
    p_wallet     TEXT
)
RETURNS TABLE(
    withdrawal_id  BIGINT,
    net_amount     NUMERIC,
    error_msg      TEXT
) AS $$
DECLARE
    v_deposit_amount  NUMERIC;
    v_deposit_user_id BIGINT;
    v_wd_id           BIGINT;
BEGIN
    error_msg := NULL;

    -- Fetch deposit
    SELECT d.amount, d.user_id INTO v_deposit_amount, v_deposit_user_id
    FROM deposits d WHERE d.id = p_deposit_id AND d.status = 'completed';

    IF NOT FOUND THEN
        error_msg := 'Deposit not found or not yet completed.';
        RETURN NEXT;
        RETURN;
    END IF;

    IF v_deposit_user_id != p_user_id THEN
        error_msg := 'Deposit does not belong to this user.';
        RETURN NEXT;
        RETURN;
    END IF;

    -- Create withdrawal record with full amount, no forfeit
    INSERT INTO withdrawals (user_id, amount, currency, coin, address, wallet_address,
                             fee, forfeit_amount, request_time, eligible_time, status, withdrawal_type)
    VALUES (p_user_id, v_deposit_amount, p_coin, p_coin, p_wallet, p_wallet,
            0, 0, now(), now(), 'pending', 'principal')
    RETURNING id INTO v_wd_id;

    withdrawal_id := v_wd_id;
    net_amount := v_deposit_amount;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 5. Credit amount sanity caps (prevent absurd credits from bugs)
--    Caps per-operation credit amounts. Balances can grow past these via
--    multiple operations — this only guards single-credit bugs.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION credit_profit_balance(p_user_id BIGINT, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive' USING ERRCODE = 'P0003';
  END IF;
  IF p_amount > 10000 THEN
    RAISE EXCEPTION 'Profit credit exceeds sanity limit (max $10,000 per operation)';
  END IF;

  UPDATE users
  SET profit_balance = profit_balance + p_amount
  WHERE id = p_user_id
  RETURNING profit_balance INTO new_balance;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION credit_commission_balance(p_user_id BIGINT, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive' USING ERRCODE = 'P0003';
  END IF;
  IF p_amount > 5000 THEN
    RAISE EXCEPTION 'Commission credit exceeds sanity limit (max $5,000 per operation)';
  END IF;

  UPDATE users
  SET commission_balance = commission_balance + p_amount
  WHERE id = p_user_id
  RETURNING commission_balance INTO new_balance;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 6. Circular referral prevention trigger
-- Prevents A → B → C → A referral cycles on INSERT or UPDATE of referred_by.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_circular_referral()
RETURNS TRIGGER AS $$
DECLARE
  current_id BIGINT;
  depth INT := 0;
BEGIN
  IF NEW.referred_by IS NULL THEN
    RETURN NEW;
  END IF;
  current_id := NEW.referred_by;
  WHILE current_id IS NOT NULL AND depth < 20 LOOP
    IF current_id = NEW.id THEN
      RAISE EXCEPTION 'Circular referral detected — cannot refer to a descendant';
    END IF;
    SELECT referred_by INTO current_id FROM users WHERE id = current_id;
    depth := depth + 1;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_circular_referral ON users;
CREATE TRIGGER prevent_circular_referral
  BEFORE INSERT OR UPDATE OF referred_by ON users
  FOR EACH ROW EXECUTE FUNCTION check_circular_referral();
