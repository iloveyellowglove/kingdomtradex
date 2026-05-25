-- ============================================================================
-- Commissions Idempotency Constraint
-- Prevents duplicate commission entries for the same deposit at the same level.
-- Run in Supabase SQL Editor.
-- ============================================================================
ALTER TABLE referral_commissions ADD CONSTRAINT IF NOT EXISTS unique_commission_per_deposit_level UNIQUE (user_id, source_deposit_id, level);
