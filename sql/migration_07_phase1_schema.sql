-- ============================================================================
-- Migration 07: Phase 1 Schema Expansion
-- KYC, 2FA, Auto-Withdrawal, Notifications, Leaderboard, expanded withdrawals
-- and referral_commissions, plus new atomic RPC functions.
-- Run in Supabase SQL Editor AFTER migration_06_social_share.sql.
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE — Add KYC, 2FA, auto-withdrawal, and referral columns
-- ============================================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS kyc_level                INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kyc_selfie_url           TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS kyc_id_url               TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS kyc_submitted_at         TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS kyc_reviewed_at          TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS kyc_reviewed_by          BIGINT DEFAULT NULL REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS kyc_rejection_reason     TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS signup_credit            NUMERIC(20,2) NOT NULL DEFAULT 50.00,
  ADD COLUMN IF NOT EXISTS two_factor_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS two_factor_secret        TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS auto_withdrawal_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_withdrawal_frequency TEXT DEFAULT NULL CHECK (auto_withdrawal_frequency IN (NULL, 'daily', 'weekly')),
  ADD COLUMN IF NOT EXISTS auto_withdrawal_coin      TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS auto_withdrawal_wallet    TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS referral_level            INTEGER NOT NULL DEFAULT 0;

-- Add index for referral_level lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_level ON users(referral_level);

-- ============================================================================
-- 2. WITHDRAWALS TABLE — Add principal withdrawal support + tx tracking
-- ============================================================================

-- Widen withdrawal_type CHECK to include 'principal'
ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_withdrawal_type_check;

ALTER TABLE withdrawals
  ADD COLUMN IF NOT EXISTS coin               TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tx_hash            TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS forfeit_amount     NUMERIC(18,8) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failure_reason     TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS completed_at       TIMESTAMPTZ DEFAULT NULL;

-- Re-add CHECK with expanded values
ALTER TABLE withdrawals
  ADD CONSTRAINT withdrawals_withdrawal_type_check
  CHECK (withdrawal_type IN ('profit', 'commission', 'principal'));

-- ============================================================================
-- 3. REFERRAL_COMMISSIONS TABLE — Add type column + commission_rate
-- ============================================================================

ALTER TABLE referral_commissions
  ADD COLUMN IF NOT EXISTS referral_type      TEXT NOT NULL DEFAULT 'deposit_bonus'
    CHECK (referral_type IN ('deposit_bonus', 'profit_share')),
  ADD COLUMN IF NOT EXISTS commission_rate     NUMERIC(6,4) NOT NULL DEFAULT 0;

-- Widen status CHECK to include 'credited'
ALTER TABLE referral_commissions DROP CONSTRAINT IF EXISTS referral_commissions_status_check;

ALTER TABLE referral_commissions
  ADD CONSTRAINT referral_commissions_status_check
  CHECK (status IN ('pending', 'credited', 'paid', 'cancelled'));

-- ============================================================================
-- 4. NOTIFICATIONS TABLE — In-app notification system
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            TEXT NOT NULL CHECK (type IN (
                        'deposit_confirmed', 'withdrawal_processed', 'withdrawal_failed',
                        'kyc_approved', 'kyc_rejected', 'commission_earned',
                        'referral_joined', 'system'
                    )),
    title           TEXT NOT NULL,
    message         TEXT NOT NULL,
    read            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read       ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. KYC_SUBMISSIONS TABLE — KYC document tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS kyc_submissions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    id_document_url   TEXT NOT NULL,
    selfie_url        TEXT NOT NULL,
    status            TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at       TIMESTAMPTZ DEFAULT NULL,
    reviewed_by       BIGINT DEFAULT NULL REFERENCES users(id),
    rejection_reason  TEXT DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user_id ON kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status  ON kyc_submissions(status);

ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. LEADERBOARD_CACHE TABLE — Anonymized rankings, refreshed by cron
-- ============================================================================

CREATE TABLE IF NOT EXISTS leaderboard_cache (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name      TEXT NOT NULL,
    total_earned      NUMERIC(20,2) NOT NULL DEFAULT 0,
    total_referrals   INTEGER NOT NULL DEFAULT 0,
    rank_earnings     INTEGER NOT NULL DEFAULT 0,
    rank_referrals    INTEGER NOT NULL DEFAULT 0,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_rank_earnings  ON leaderboard_cache(rank_earnings);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank_referrals ON leaderboard_cache(rank_referrals);
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard_cache(user_id);

ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. RPC: process_profit_withdrawal
-- Atomic profit withdrawal with KYC + frequency validation.
-- ============================================================================

CREATE OR REPLACE FUNCTION process_profit_withdrawal(
    p_user_id    BIGINT,
    p_amount     NUMERIC,
    p_coin       TEXT,
    p_wallet     TEXT
)
RETURNS TABLE(
    withdrawal_id BIGINT,
    error_msg     TEXT
) AS $$
DECLARE
    v_kyc_level       INTEGER;
    v_profit_balance  NUMERIC;
    v_last_withdrawal TIMESTAMPTZ;
    v_frequency       TEXT;
    v_wd_id           BIGINT;
BEGIN
    error_msg := NULL;

    -- Fetch user state
    SELECT u.kyc_level, u.profit_balance, u.auto_withdrawal_frequency
    INTO v_kyc_level, v_profit_balance, v_frequency
    FROM users u WHERE u.id = p_user_id;

    IF NOT FOUND THEN
        error_msg := 'User not found';
        RETURN NEXT;
        RETURN;
    END IF;

    -- KYC gate: Level 1 minimum for profit withdrawal
    IF v_kyc_level < 1 THEN
        error_msg := 'KYC Level 1 (email verification) required to withdraw profits.';
        RETURN NEXT;
        RETURN;
    END IF;

    -- Frequency gate
    IF v_frequency IS NULL OR v_frequency = '' THEN
        -- No auto-withdrawal configured — manual withdrawal allowed at any frequency
        NULL;
    ELSE
        -- Check time since last withdrawal
        SELECT MAX(request_time) INTO v_last_withdrawal
        FROM withdrawals
        WHERE user_id = p_user_id AND status IN ('pending', 'processing', 'completed');

        IF v_last_withdrawal IS NOT NULL THEN
            IF v_frequency = 'daily' AND v_last_withdrawal > (now() - INTERVAL '23 hours') THEN
                error_msg := 'Daily withdrawal limit reached. Please wait 24 hours between withdrawals.';
                RETURN NEXT;
                RETURN;
            END IF;
            IF v_frequency = 'weekly' AND v_last_withdrawal > (now() - INTERVAL '6 days 23 hours') THEN
                error_msg := 'Weekly withdrawal limit reached. Please wait 7 days between withdrawals.';
                RETURN NEXT;
                RETURN;
            END IF;
        END IF;
    END IF;

    -- Insufficient balance check
    IF v_profit_balance < p_amount THEN
        error_msg := 'Insufficient profit balance.';
        RETURN NEXT;
        RETURN;
    END IF;

    -- Debit profit balance atomically
    UPDATE users
    SET profit_balance = profit_balance - p_amount
    WHERE id = p_user_id AND profit_balance >= p_amount;

    IF NOT FOUND THEN
        error_msg := 'Insufficient profit balance.';
        RETURN NEXT;
        RETURN;
    END IF;

    -- Create withdrawal record
    INSERT INTO withdrawals (user_id, amount, currency, coin, address, wallet_address,
                             fee, request_time, eligible_time, status, withdrawal_type)
    VALUES (p_user_id, p_amount, p_coin, p_coin, p_wallet, p_wallet,
            0, now(), now(), 'pending', 'profit')
    RETURNING id INTO v_wd_id;

    withdrawal_id := v_wd_id;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. RPC: process_principal_withdrawal
-- Atomic principal withdrawal with 25% forfeit. Only real deposits (not signup credit).
-- ============================================================================

CREATE OR REPLACE FUNCTION process_principal_withdrawal(
    p_user_id    BIGINT,
    p_deposit_id BIGINT,
    p_coin       TEXT,
    p_wallet     TEXT
)
RETURNS TABLE(
    withdrawal_id  BIGINT,
    forfeit_amount NUMERIC,
    net_amount     NUMERIC,
    error_msg      TEXT
) AS $$
DECLARE
    v_deposit_amount  NUMERIC;
    v_deposit_user_id BIGINT;
    v_signup_credit   NUMERIC;
    v_forfeit         NUMERIC;
    v_net             NUMERIC;
    v_wd_id           BIGINT;
BEGIN
    error_msg := NULL;

    -- Fetch deposit
    SELECT d.amount, d.user_id INTO v_deposit_amount, v_deposit_user_id
    FROM deposits d WHERE d.id = p_deposit_id AND d.status = 'completed';

    IF NOT FOUND THEN
        error_msg := 'Deposit not found or not yet completed.';
        RETURN NEXT;
        RETURN;
    END IF;

    IF v_deposit_user_id != p_user_id THEN
        error_msg := 'Deposit does not belong to this user.';
        RETURN NEXT;
        RETURN;
    END IF;

    -- Check if deposit is the non-withdrawable signup credit
    SELECT u.signup_credit INTO v_signup_credit
    FROM users u WHERE u.id = p_user_id;

    IF v_deposit_amount <= COALESCE(v_signup_credit, 0) THEN
        error_msg := 'Signup credit is non-withdrawable.';
        RETURN NEXT;
        RETURN;
    END IF;

    -- Calculate 25% forfeit
    v_forfeit := ROUND(v_deposit_amount * 0.25, 8);
    v_net := v_deposit_amount - v_forfeit;

    -- Create withdrawal record with forfeit applied
    INSERT INTO withdrawals (user_id, amount, currency, coin, address, wallet_address,
                             fee, forfeit_amount, request_time, eligible_time, status, withdrawal_type)
    VALUES (p_user_id, v_net, p_coin, p_coin, p_wallet, p_wallet,
            0, v_forfeit, now(), now(), 'pending', 'principal')
    RETURNING id INTO v_wd_id;

    withdrawal_id := v_wd_id;
    forfeit_amount := v_forfeit;
    net_amount := v_net;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. RPC: credit_referral_commission
-- Walks up 5 referral levels and credits commissions.
-- Deposit bonus rates:  3.0% / 1.5% / 0.75% / 0.50% / 0.25%
-- Profit share rates:   5.0% / 2.5% / 1.25% / 0.75% / 0.50%
-- ============================================================================

CREATE OR REPLACE FUNCTION credit_referral_commission(
    p_source_user_id BIGINT,
    p_referral_type  TEXT,  -- 'deposit_bonus' or 'profit_share'
    p_source_amount  NUMERIC
)
RETURNS TABLE(
    commissions_created INTEGER,
    total_paid_out      NUMERIC,
    error_msg           TEXT
) AS $$
DECLARE
    v_current_user_id BIGINT;
    v_level           INTEGER := 1;
    v_rate            NUMERIC;
    v_commission      NUMERIC;
    v_count           INTEGER := 0;
    v_total           NUMERIC := 0;
    -- Rate arrays (index = level)
    v_deposit_rates   NUMERIC[] := ARRAY[0.0300, 0.0150, 0.0075, 0.0050, 0.0025];
    v_profit_rates    NUMERIC[] := ARRAY[0.0500, 0.0250, 0.0125, 0.0075, 0.0050];
BEGIN
    error_msg := NULL;

    -- Start with the source user's referrer
    SELECT referred_by INTO v_current_user_id
    FROM users WHERE id = p_source_user_id;

    -- Walk up to 5 levels
    WHILE v_current_user_id IS NOT NULL AND v_level <= 5 LOOP
        -- Select rate based on type
        IF p_referral_type = 'profit_share' THEN
            v_rate := v_profit_rates[v_level];
        ELSE
            v_rate := v_deposit_rates[v_level];
        END IF;

        v_commission := ROUND(p_source_amount * v_rate, 8);

        IF v_commission > 0 THEN
            -- Insert commission record
            INSERT INTO referral_commissions (
                user_id, source_user_id, level, percentage, amount,
                source_deposit_id, source_amount, status, referral_type, commission_rate
            ) VALUES (
                v_current_user_id, p_source_user_id, v_level, v_rate * 100,
                v_commission, 0, p_source_amount, 'credited', p_referral_type, v_rate
            );

            -- Credit commission balance atomically
            UPDATE users
            SET commission_balance = commission_balance + v_commission
            WHERE id = v_current_user_id;

            v_count := v_count + 1;
            v_total := v_total + v_commission;
        END IF;

        -- Move up to next referrer
        SELECT referred_by INTO v_current_user_id
        FROM users WHERE id = v_current_user_id;

        v_level := v_level + 1;
    END LOOP;

    commissions_created := v_count;
    total_paid_out := v_total;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. RPC: process_deposit_split
-- Splits deposit: 70% to XMR cold wallet, 30% retained for withdrawals/commissions.
-- Uses the existing deposit_splits table (xmr_amount / usdt_retained columns).
-- ============================================================================

CREATE OR REPLACE FUNCTION process_deposit_split(
    p_deposit_id  BIGINT,
    p_amount      NUMERIC,
    p_cold_wallet TEXT DEFAULT NULL
)
RETURNS TABLE(
    xmr_share     NUMERIC,
    usdt_retained NUMERIC,
    error_msg     TEXT
) AS $$
DECLARE
    v_xmr    NUMERIC;
    v_retain NUMERIC;
    v_wallet TEXT;
BEGIN
    error_msg := NULL;

    v_xmr   := ROUND(p_amount * 0.70, 8);
    v_retain := p_amount - v_xmr;

    -- Fallback cold wallet
    IF p_cold_wallet IS NULL OR p_cold_wallet = '' THEN
        SELECT setting_value INTO v_wallet FROM settings WHERE setting_key = 'cold_wallet_xmr' LIMIT 1;
        v_wallet := COALESCE(v_wallet, '');
    ELSE
        v_wallet := p_cold_wallet;
    END IF;

    -- Insert into existing deposit_splits table
    INSERT INTO deposit_splits (deposit_id, total_amount, xmr_amount, usdt_retained,
                                 cold_wallet_address, status, created_at)
    VALUES (p_deposit_id, p_amount, v_xmr, v_retain, v_wallet, 'pending', now())
    ON CONFLICT (deposit_id) DO UPDATE SET
        total_amount         = EXCLUDED.total_amount,
        xmr_amount           = EXCLUDED.xmr_amount,
        usdt_retained        = EXCLUDED.usdt_retained,
        cold_wallet_address  = EXCLUDED.cold_wallet_address;

    xmr_share := v_xmr;
    usdt_retained := v_retain;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. RPC: update_leaderboard_cache
-- Refreshes anonymized leaderboard rankings. Call via cron every 6 hours.
-- ============================================================================

CREATE OR REPLACE FUNCTION update_leaderboard_cache()
RETURNS TABLE(rows_updated INTEGER) AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Clear existing cache
    DELETE FROM leaderboard_cache;

    -- Insert top 50 earners (anonymized)
    INSERT INTO leaderboard_cache (user_id, display_name, total_earned, total_referrals,
                                    rank_earnings, rank_referrals)
    SELECT
        u.id,
        anonymize_name(u.username),
        COALESCE(u.profit_balance, 0) + COALESCE(u.commission_balance, 0) AS total_earned,
        COALESCE(rc.ref_count, 0) AS total_referrals,
        ROW_NUMBER() OVER (ORDER BY COALESCE(u.profit_balance, 0) + COALESCE(u.commission_balance, 0) DESC) AS rank_earnings,
        0 AS rank_referrals
    FROM users u
    LEFT JOIN (
        SELECT referred_by, COUNT(*) AS ref_count
        FROM users
        WHERE referred_by IS NOT NULL
        GROUP BY referred_by
    ) rc ON rc.referred_by = u.id
    WHERE u.status = 'active'
    ORDER BY total_earned DESC
    LIMIT 50;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Update referral ranks
    UPDATE leaderboard_cache lc
    SET rank_referrals = ranked.rn
    FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY total_referrals DESC) AS rn
        FROM leaderboard_cache
    ) ranked
    WHERE lc.id = ranked.id;

    rows_updated := v_count;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 12. Helper: anonymize_name
-- Converts "John Doe" → "John D."
-- ============================================================================

CREATE OR REPLACE FUNCTION anonymize_name(full_name TEXT)
RETURNS TEXT AS $$
DECLARE
    parts TEXT[];
BEGIN
    IF full_name IS NULL OR trim(full_name) = '' THEN
        RETURN 'User';
    END IF;
    parts := string_to_array(trim(full_name), ' ');
    IF array_length(parts, 1) >= 2 THEN
        RETURN parts[1] || ' ' || left(parts[array_length(parts, 1)], 1) || '.';
    END IF;
    RETURN parts[1];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 13. RLS Policies for new tables
-- ============================================================================

-- Notifications: users can only see their own
DROP POLICY IF EXISTS notifications_self ON notifications;
CREATE POLICY notifications_self ON notifications FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id'
           OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- KYC submissions: users can only see their own
DROP POLICY IF EXISTS kyc_submissions_self ON kyc_submissions;
CREATE POLICY kyc_submissions_self ON kyc_submissions FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id'
           OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Leaderboard: public read
DROP POLICY IF EXISTS leaderboard_public ON leaderboard_cache;
CREATE POLICY leaderboard_public ON leaderboard_cache FOR SELECT
    USING (true);
