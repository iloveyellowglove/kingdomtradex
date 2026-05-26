-- S06: Add UNIQUE constraint on deposits.txn_id for idempotency
-- Run this against your production Supabase SQL Editor

DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deposits_txn_id_unique'
  ) THEN
    ALTER TABLE deposits ADD CONSTRAINT deposits_txn_id_unique UNIQUE (txn_id);
  END IF;
END $;
