-- ============================================================================
-- Migration 06: Social Share Verification + New Lock Tiers
-- Replaces old growth/builder/kingdom/legacy tiers with Silver/Gold/Platinum/Diamond.
-- Adds social_shares, share_verifications, and testimonies tables.
-- Adds withdrawal_type column to withdrawals.
-- Run in Supabase SQL Editor AFTER migration_05_lock_days.sql.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Migrate lock_tiers to new Silver/Gold/Platinum/Diamond tiers
-- ---------------------------------------------------------------------------

-- 1a. Drop old CHECK constraints on deposit_locks
ALTER TABLE deposit_locks DROP CONSTRAINT IF EXISTS deposit_locks_tier_check;
ALTER TABLE deposit_locks DROP CONSTRAINT IF EXISTS deposit_locks_lock_days_check;

-- 1b. Delete old tier rows
DELETE FROM lock_tiers WHERE tier IN ('growth', 'builder', 'kingdom', 'legacy');

-- 1c. Insert new tiers
INSERT INTO lock_tiers (tier, label, lock_days, daily_rate, description, sort_order) VALUES
    ('silver',   'Silver',   180, 0.012000, '180-day lock period',  1),
    ('gold',     'Gold',     270, 0.015000, '270-day lock period',  2),
    ('platinum', 'Platinum', 360, 0.020000, '360-day lock period',  3),
    ('diamond',  'Diamond',  540, 0.030000, '540-day lock period',  4)
ON CONFLICT (tier) DO UPDATE SET
    label       = EXCLUDED.label,
    lock_days   = EXCLUDED.lock_days,
    daily_rate  = EXCLUDED.daily_rate,
    description = EXCLUDED.description,
    sort_order  = EXCLUDED.sort_order;

-- 1d. Add new CHECK constraints on deposit_locks
ALTER TABLE deposit_locks ADD CONSTRAINT deposit_locks_tier_check
    CHECK (tier IN ('silver', 'gold', 'platinum', 'diamond'));

ALTER TABLE deposit_locks ADD CONSTRAINT deposit_locks_lock_days_check
    CHECK (lock_days IN (180, 270, 360, 540));

-- ---------------------------------------------------------------------------
-- 2. Add withdrawal_type to withdrawals (if not already present)
-- ---------------------------------------------------------------------------
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS withdrawal_type TEXT DEFAULT 'profit';

-- ---------------------------------------------------------------------------
-- 3. Create testimonies table (must exist before social_shares due to FK)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS testimonies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         BIGINT NOT NULL REFERENCES users(id),
    withdrawal_id   BIGINT NOT NULL REFERENCES withdrawals(id),
    amount          NUMERIC(18,8) NOT NULL,
    initials        TEXT NOT NULL,
    referral_code   TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimonies_user_id       ON testimonies(user_id);
CREATE INDEX IF NOT EXISTS idx_testimonies_withdrawal_id ON testimonies(withdrawal_id);

-- ---------------------------------------------------------------------------
-- 4. Create social_shares table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS social_shares (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         BIGINT NOT NULL REFERENCES users(id),
    testimony_id    UUID DEFAULT NULL REFERENCES testimonies(id),
    platform        TEXT NOT NULL,
    click_count     INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_shares_user_id      ON social_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_testimony_id ON social_shares(testimony_id);

-- ---------------------------------------------------------------------------
-- 5. Create share_verifications table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS share_verifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         BIGINT NOT NULL REFERENCES users(id),
    withdrawal_id   BIGINT NOT NULL REFERENCES withdrawals(id),
    share_id        UUID NOT NULL REFERENCES social_shares(id),
    verified_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_share_verifications_user_id       ON share_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_share_verifications_withdrawal_id ON share_verifications(withdrawal_id);
