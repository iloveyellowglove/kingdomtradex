-- ============================================================================
-- Migration 04: Withdrawal type + AI profit lock reference
-- Run in Supabase SQL Editor AFTER migration_01_balance_model.sql.
-- ============================================================================

ALTER TABLE withdrawals
  ADD COLUMN IF NOT EXISTS withdrawal_type TEXT DEFAULT 'profit'
  CHECK (withdrawal_type IN ('profit', 'commission'));

ALTER TABLE ai_trading_profits
  ADD COLUMN IF NOT EXISTS deposit_lock_id UUID DEFAULT NULL;
