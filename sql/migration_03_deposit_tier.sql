-- ============================================================================
-- Migration 03: Add tier / lock_days to deposits table
-- Run in Supabase SQL Editor AFTER migration_01_balance_model.sql.
-- ============================================================================

ALTER TABLE deposits
  ADD COLUMN IF NOT EXISTS tier       TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lock_days INT DEFAULT NULL;
