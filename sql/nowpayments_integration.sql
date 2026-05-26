-- NOWPayments integration: add payment_provider and provider_payment_id columns
-- Run this against your production Supabase SQL Editor

DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deposits' AND column_name = 'payment_provider'
  ) THEN
    ALTER TABLE deposits ADD COLUMN payment_provider TEXT NOT NULL DEFAULT 'plisio';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deposits' AND column_name = 'provider_payment_id'
  ) THEN
    ALTER TABLE deposits ADD COLUMN provider_payment_id TEXT;
  END IF;
END $;

CREATE INDEX IF NOT EXISTS idx_deposits_provider_payment_id ON deposits(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_deposits_payment_provider ON deposits(payment_provider);
