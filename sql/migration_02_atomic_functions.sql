-- ============================================================================
-- Migration 02: 3-Balance Atomic Functions
-- Atomic credit/debit for locked_balance, profit_balance, commission_balance.
-- Plus lock_deposit and mature_deposit_lock lifecycle functions.
-- Run in Supabase SQL Editor AFTER migration_01_balance_model.sql.
-- ============================================================================

-- ── profit_balance ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION credit_profit_balance(p_user_id BIGINT, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive'
      USING ERRCODE = 'P0003';
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

CREATE OR REPLACE FUNCTION debit_profit_balance(p_user_id BIGINT, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  UPDATE users
  SET profit_balance = profit_balance - p_amount
  WHERE id = p_user_id AND profit_balance >= p_amount
  RETURNING profit_balance INTO new_balance;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient profit balance or user not found'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── commission_balance ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION credit_commission_balance(p_user_id BIGINT, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive'
      USING ERRCODE = 'P0003';
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

CREATE OR REPLACE FUNCTION debit_commission_balance(p_user_id BIGINT, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  UPDATE users
  SET commission_balance = commission_balance - p_amount
  WHERE id = p_user_id AND commission_balance >= p_amount
  RETURNING commission_balance INTO new_balance;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient commission balance or user not found'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── locked_balance ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION credit_locked_balance(p_user_id BIGINT, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive'
      USING ERRCODE = 'P0003';
  END IF;

  UPDATE users
  SET locked_balance = locked_balance + p_amount
  WHERE id = p_user_id
  RETURNING locked_balance INTO new_balance;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION debit_locked_balance(p_user_id BIGINT, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  UPDATE users
  SET locked_balance = locked_balance - p_amount
  WHERE id = p_user_id AND locked_balance >= p_amount
  RETURNING locked_balance INTO new_balance;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient locked balance or user not found'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── lock_deposit ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION lock_deposit(
  p_user_id    BIGINT,
  p_deposit_id BIGINT,
  p_amount     NUMERIC,
  p_tier       TEXT,
  p_lock_months INT,
  p_daily_rate NUMERIC
)
RETURNS SETOF deposit_locks AS $$
DECLARE
  v_lock deposit_locks;
BEGIN
  INSERT INTO deposit_locks (
    user_id, deposit_id, amount, tier, lock_months, daily_rate,
    locked_at, unlocks_at, status
  ) VALUES (
    p_user_id, p_deposit_id, p_amount, p_tier, p_lock_months, p_daily_rate,
    now(), now() + (p_lock_months || ' months')::interval, 'locked'
  )
  RETURNING * INTO v_lock;

  PERFORM credit_locked_balance(p_user_id, p_amount);

  RETURN NEXT v_lock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── mature_deposit_lock ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION mature_deposit_lock(p_lock_id UUID)
RETURNS SETOF deposit_locks AS $$
DECLARE
  v_lock deposit_locks;
BEGIN
  SELECT * INTO v_lock FROM deposit_locks WHERE id = p_lock_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deposit lock % not found', p_lock_id;
  END IF;

  IF v_lock.status != 'locked' THEN
    RAISE EXCEPTION 'Deposit lock % is not in locked status (current: %)', p_lock_id, v_lock.status;
  END IF;

  UPDATE deposit_locks SET status = 'matured' WHERE id = p_lock_id;

  PERFORM debit_locked_balance(v_lock.user_id, v_lock.amount);
  PERFORM credit_profit_balance(v_lock.user_id, v_lock.amount);

  SELECT * INTO v_lock FROM deposit_locks WHERE id = p_lock_id;
  RETURN NEXT v_lock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
