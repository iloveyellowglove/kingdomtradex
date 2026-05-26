-- ============================================================================
-- Atomic Balance Functions
-- Replace read-modify-write patterns with atomic PostgreSQL operations.
-- Run in Supabase SQL Editor before deploying application code changes.
-- ============================================================================

-- Atomic credit: adds amount to display_balance atomically.
-- Returns the new balance. Throws if user not found.
CREATE OR REPLACE FUNCTION credit_user_balance(p_user_id INTEGER, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  UPDATE users
  SET display_balance = display_balance + p_amount
  WHERE id = p_user_id
  RETURNING display_balance INTO new_balance;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic debit: subtracts amount from display_balance atomically.
-- Returns the new balance. Throws with SQLSTATE P0002 if insufficient balance.
CREATE OR REPLACE FUNCTION debit_user_balance(p_user_id INTEGER, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  UPDATE users
  SET display_balance = display_balance - p_amount
  WHERE id = p_user_id AND display_balance >= p_amount
  RETURNING display_balance INTO new_balance;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient balance or user not found'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic credit with deposit total: credits display_balance and increments
-- total_deposited_real in a single atomic UPDATE. Returns both new values.
CREATE OR REPLACE FUNCTION credit_user_balance_with_deposit_total(p_user_id INTEGER, p_amount NUMERIC)
RETURNS TABLE(new_balance NUMERIC, new_total_deposited NUMERIC) AS $$
BEGIN
  UPDATE users
  SET display_balance = display_balance + p_amount,
      total_deposited_real = total_deposited_real + p_amount
  WHERE id = p_user_id
  RETURNING users.display_balance, users.total_deposited_real
  INTO new_balance, new_total_deposited;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic debit with withdrawal total: debits display_balance and increments
-- total_withdrawn_real in a single atomic UPDATE. Returns both new values.
CREATE OR REPLACE FUNCTION debit_user_balance_with_withdrawal_total(p_user_id INTEGER, p_amount NUMERIC)
RETURNS TABLE(new_balance NUMERIC, new_total_withdrawn NUMERIC) AS $$
BEGIN
  UPDATE users
  SET display_balance = display_balance - p_amount,
      total_withdrawn_real = total_withdrawn_real + p_amount
  WHERE id = p_user_id AND display_balance >= p_amount
  RETURNING users.display_balance, users.total_withdrawn_real
  INTO new_balance, new_total_withdrawn;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient balance or user not found'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic pending withdrawal: moves amount from display_balance to
-- pending_withdrawal_amount in a single atomic UPDATE.
CREATE OR REPLACE FUNCTION move_balance_to_pending(p_user_id INTEGER, p_amount NUMERIC)
RETURNS TABLE(new_balance NUMERIC, new_pending NUMERIC) AS $$
BEGIN
  UPDATE users
  SET display_balance = display_balance - p_amount,
      pending_withdrawal_amount = pending_withdrawal_amount + p_amount
  WHERE id = p_user_id AND display_balance >= p_amount
  RETURNING users.display_balance, users.pending_withdrawal_amount
  INTO new_balance, new_pending;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient balance or user not found'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic withdrawal completion: decrements pending_withdrawal_amount and
-- increments total_withdrawn_real. Used when a withdrawal is successfully
-- processed by the cron job. display_balance was already debited when the
-- withdrawal was requested.
CREATE OR REPLACE FUNCTION complete_withdrawal_atomic(p_user_id INTEGER, p_amount NUMERIC)
RETURNS TABLE(new_pending NUMERIC, new_total_withdrawn NUMERIC) AS $$
BEGIN
  UPDATE users
  SET pending_withdrawal_amount = GREATEST(0, pending_withdrawal_amount - p_amount),
      total_withdrawn_real = total_withdrawn_real + p_amount
  WHERE id = p_user_id
  RETURNING users.pending_withdrawal_amount, users.total_withdrawn_real
  INTO new_pending, new_total_withdrawn;

  IF new_pending IS NULL THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic reversal: moves amount from pending_withdrawal_amount back to
-- display_balance. Used when a withdrawal is rejected/failed.
CREATE OR REPLACE FUNCTION reverse_pending_to_balance(p_user_id INTEGER, p_amount NUMERIC)
RETURNS TABLE(new_balance NUMERIC, new_pending NUMERIC) AS $$
BEGIN
  UPDATE users
  SET display_balance = display_balance + p_amount,
      pending_withdrawal_amount = GREATEST(0, pending_withdrawal_amount - p_amount)
  WHERE id = p_user_id
  RETURNING users.display_balance, users.pending_withdrawal_amount
  INTO new_balance, new_pending;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic deposit processing: credits balance, updates total_deposited_real,
-- sets first_deposit_time if null, and atomically unlocks bonus when threshold
-- is met. Single UPDATE prevents partial bonus credit/lock-state mismatch.
CREATE OR REPLACE FUNCTION process_deposit_atomic(p_user_id INTEGER, p_amount NUMERIC, p_now TIMESTAMPTZ)
RETURNS TABLE(new_balance NUMERIC, new_total_deposited NUMERIC, bonus_unlocked BOOLEAN, bonus_amount NUMERIC) AS $$
DECLARE
  v_unlocked BOOLEAN := FALSE;
  v_bonus_amt NUMERIC := 0;
BEGIN
  SELECT (bonus_locked
            AND (total_deposited_real + p_amount) >= minimum_deposit_to_unlock
            AND bonus_balance > 0),
         bonus_balance
  INTO v_unlocked, v_bonus_amt
  FROM users WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  IF NOT v_unlocked THEN
    v_bonus_amt := 0;
  END IF;

  UPDATE users SET
    display_balance = display_balance + p_amount + v_bonus_amt,
    total_deposited_real = total_deposited_real + p_amount,
    bonus_balance = CASE WHEN v_unlocked THEN 0 ELSE bonus_balance END,
    bonus_locked = CASE WHEN v_unlocked THEN FALSE ELSE bonus_locked END,
    bonus_unlocked_at = CASE WHEN v_unlocked THEN p_now ELSE bonus_unlocked_at END,
    first_deposit_time = COALESCE(first_deposit_time, p_now)
  WHERE id = p_user_id
  RETURNING users.display_balance, users.total_deposited_real
  INTO new_balance, new_total_deposited;

  bonus_unlocked := v_unlocked;
  bonus_amount := v_bonus_amt;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
