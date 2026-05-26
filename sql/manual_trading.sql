-- Manual Trading: internal dummy balance + trades table
-- Run in Supabase SQL Editor before deploying manual trading feature

-- Add dummy balance columns to users (internal, never shown to user)
ALTER TABLE users ADD COLUMN IF NOT EXISTS dummy_balance NUMERIC(18,8) DEFAULT 10000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dummy_reset_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dummy_initialized_at TIMESTAMP;

-- Manual trades table
CREATE TABLE IF NOT EXISTS manual_trades (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  pair VARCHAR(20) NOT NULL,
  side VARCHAR(4) NOT NULL CHECK (side IN ('BUY', 'CLOSE')),
  amount NUMERIC(18,8) NOT NULL,
  entry_price NUMERIC(18,8) NOT NULL,
  exit_price NUMERIC(18,8),
  status VARCHAR(10) NOT NULL CHECK (status IN ('open', 'closed')),
  pnl NUMERIC(18,8),
  fee NUMERIC(18,8) DEFAULT 0,
  opened_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_manual_trades_user_status ON manual_trades(user_id, status);

-- One-time migration for existing users
UPDATE users SET dummy_balance = 10000, dummy_initialized_at = NOW()
WHERE dummy_initialized_at IS NULL;

-- Atomic debit dummy balance
CREATE OR REPLACE FUNCTION debit_dummy_balance(p_user_id INTEGER, p_amount NUMERIC) RETURNS NUMERIC AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  UPDATE users SET dummy_balance = dummy_balance - p_amount
  WHERE id = p_user_id AND dummy_balance >= p_amount
  RETURNING dummy_balance INTO new_balance;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient dummy balance' USING ERRCODE = 'P0002';
  END IF;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic credit dummy balance
CREATE OR REPLACE FUNCTION credit_dummy_balance(p_user_id INTEGER, p_amount NUMERIC) RETURNS NUMERIC AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  UPDATE users SET dummy_balance = dummy_balance + p_amount
  WHERE id = p_user_id
  RETURNING dummy_balance INTO new_balance;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset dummy account: close all open positions, reset balance to 10000
CREATE OR REPLACE FUNCTION reset_dummy_account(p_user_id INTEGER) RETURNS NUMERIC AS $$
BEGIN
  UPDATE manual_trades
  SET status = 'closed', exit_price = entry_price, pnl = 0, closed_at = NOW()
  WHERE user_id = p_user_id AND status = 'open';

  UPDATE users
  SET dummy_balance = 10000, dummy_reset_count = dummy_reset_count + 1
  WHERE id = p_user_id;

  RETURN 10000;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
