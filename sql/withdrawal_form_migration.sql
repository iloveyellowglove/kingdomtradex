-- Withdrawal form migration: add columns for network, admin review, and wallet address
-- Run against production Supabase SQL Editor
-- Checks IF NOT EXISTS on each column so it's safe to re-run

DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawals' AND column_name = 'network'
  ) THEN
    ALTER TABLE withdrawals ADD COLUMN network TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawals' AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE withdrawals ADD COLUMN admin_notes TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawals' AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE withdrawals ADD COLUMN reviewed_by BIGINT REFERENCES users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawals' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE withdrawals ADD COLUMN reviewed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'withdrawals' AND column_name = 'wallet_address'
  ) THEN
    ALTER TABLE withdrawals ADD COLUMN wallet_address TEXT;
  END IF;
END $;

-- Add 'approved' to status CHECK constraint if it doesn't already allow it
DO $
BEGIN
  ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_status_check;
  ALTER TABLE withdrawals ADD CONSTRAINT withdrawals_status_check
    CHECK (status IN ('pending','processing','approved','completed','rejected','cancelled'));
EXCEPTION WHEN OTHERS THEN
  -- Constraint already exists or table doesn't exist yet
  NULL;
END $;
