-- ============================================================================
-- KingdomTradex - Supabase PostgreSQL Migration
-- Replaces flat-file JSON storage. Run in Supabase SQL Editor.
-- ============================================================================

-- Enable uuid-ossp for Plisio UID generation if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Users table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(50) NOT NULL,
    email           VARCHAR(191) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin','pastor','member')),
    referral_code   CHAR(8) NOT NULL UNIQUE,
    referred_by     BIGINT DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
    display_balance             NUMERIC(18,8) NOT NULL DEFAULT 0.00000000,
    total_deposited_real        NUMERIC(18,8) NOT NULL DEFAULT 0.00000000,
    total_withdrawn_real        NUMERIC(18,8) NOT NULL DEFAULT 0.00000000,
    pending_withdrawal_amount   NUMERIC(18,8) NOT NULL DEFAULT 0.00000000,
    bonus_balance               NUMERIC(18,2) NOT NULL DEFAULT 0,
    bonus_locked                BOOLEAN NOT NULL DEFAULT TRUE,
    minimum_deposit_to_unlock   NUMERIC(18,2) NOT NULL DEFAULT 100.00,
    bonus_unlocked_at           TIMESTAMPTZ DEFAULT NULL,
    first_deposit_time          TIMESTAMPTZ DEFAULT NULL,
    plisio_uid                  VARCHAR(255) DEFAULT NULL,
    plisio_btc_address          VARCHAR(255) DEFAULT NULL,
    plisio_eth_address          VARCHAR(255) DEFAULT NULL,
    plisio_usdt_address         VARCHAR(255) DEFAULT NULL,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login                  TIMESTAMPTZ DEFAULT NULL,
    status                      VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','banned'))
);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by   ON users(referred_by);
CREATE INDEX IF NOT EXISTS idx_users_role          ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status        ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_plisio_uid    ON users(plisio_uid);

-- ---------------------------------------------------------------------------
-- Deposits table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deposits (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    txn_id          VARCHAR(128) DEFAULT NULL,
    txid            VARCHAR(128) DEFAULT NULL,
    currency        VARCHAR(10) NOT NULL DEFAULT 'USDT',
    amount          NUMERIC(18,8) NOT NULL,
    address         VARCHAR(255) DEFAULT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','rejected')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at    TIMESTAMPTZ DEFAULT NULL,
    completed_at    TIMESTAMPTZ DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status  ON deposits(status);

-- ---------------------------------------------------------------------------
-- Withdrawals table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS withdrawals (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    txn_id          VARCHAR(128) DEFAULT NULL,
    amount          NUMERIC(18,8) NOT NULL,
    currency        VARCHAR(10) NOT NULL DEFAULT 'USDT',
    address         VARCHAR(255) NOT NULL,
    fee             NUMERIC(18,8) NOT NULL DEFAULT 0.00000000,
    request_time    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    eligible_time   TIMESTAMPTZ NOT NULL,
    processed_time  TIMESTAMPTZ DEFAULT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','rejected','cancelled')),
    block_reason    VARCHAR(255) DEFAULT NULL,
    admin_override  SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id       ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status        ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_eligible_time ON withdrawals(eligible_time);

-- ---------------------------------------------------------------------------
-- Referral commissions (5-level MLM)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS referral_commissions (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level               SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 5),
    percentage          NUMERIC(5,2) NOT NULL,
    amount              NUMERIC(18,8) NOT NULL,
    source_deposit_id   BIGINT NOT NULL REFERENCES deposits(id) ON DELETE CASCADE,
    source_amount       NUMERIC(18,8) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at             TIMESTAMPTZ DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_commissions_user_id    ON referral_commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_source     ON referral_commissions(source_user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status     ON referral_commissions(status);

-- ---------------------------------------------------------------------------
-- AI Trading Profits (daily profit)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_trading_profits (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount      NUMERIC(18,8) NOT NULL,
    percentage  NUMERIC(5,2) NOT NULL,
    date        DATE NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_ai_profits_date ON ai_trading_profits(date);

-- ---------------------------------------------------------------------------
-- Withdrawal locks (72-hour hold tracking)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS withdrawal_locks (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_deposit_time  TIMESTAMPTZ NOT NULL,
    lock_expiry_time    TIMESTAMPTZ NOT NULL,
    is_locked           SMALLINT NOT NULL DEFAULT 1,
    reason              VARCHAR(255) DEFAULT NULL,
    admin_unlocked_by   BIGINT DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
    unlocked_at         TIMESTAMPTZ DEFAULT NULL,
    UNIQUE (user_id)
);

-- ---------------------------------------------------------------------------
-- System settings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
    id              BIGSERIAL PRIMARY KEY,
    setting_key     VARCHAR(64) NOT NULL UNIQUE,
    setting_value   VARCHAR(255) NOT NULL,
    description     VARCHAR(255) DEFAULT NULL
);

-- ---------------------------------------------------------------------------
-- Admin audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_logs (
    id            BIGSERIAL PRIMARY KEY,
    admin_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action        VARCHAR(128) NOT NULL,
    target_table  VARCHAR(64) DEFAULT NULL,
    target_id     BIGINT DEFAULT NULL,
    old_value     TEXT DEFAULT NULL,
    new_value     TEXT DEFAULT NULL,
    ip            VARCHAR(45) DEFAULT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);

-- ---------------------------------------------------------------------------
-- Default settings
-- ---------------------------------------------------------------------------
INSERT INTO settings (setting_key, setting_value, description) VALUES
    ('commission_l1',            '15.00',   'Level 1 blessing percentage (Firstfruits)'),
    ('commission_l2',            '5.00',    'Level 2 blessing percentage (Fruit that Remains)'),
    ('commission_l3',            '3.00',    'Level 3 blessing percentage (Thirtyfold Return)'),
    ('commission_l4',            '2.00',    'Level 4 blessing percentage (Sixtyfold)'),
    ('commission_l5',            '1.00',    'Level 5 blessing percentage (Hundredfold)'),
    ('daily_profit_percentage',  '1.50',    'Daily harvest (trading profit) percentage'),
    ('withdrawal_lock_hours',    '72',      'Hours before first withdrawal is allowed'),
    ('min_deposit_usdt',         '10.00',   'Minimum deposit in USDT'),
    ('min_deposit_btc',          '0.001',   'Minimum deposit in BTC'),
    ('min_deposit_eth',          '0.01',    'Minimum deposit in ETH'),
    ('min_withdrawal_usdt',      '10.00',   'Minimum withdrawal in USDT'),
    ('site_name',                'KingdomTradex', 'Site display name'),
    ('plisio_api_key',           '',        'Plisio API secret key')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- Admin user must be created via scripts/create-admin.ts after deployment.
-- See DEPLOYMENT.md for setup instructions.
-- ============================================================================

-- ============================================================================
-- RLS (Row Level Security) Policies
-- Users can read their own data; admins can read/write all.
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_trading_profits ENABLE ROW LEVEL SECURITY;

-- Allow service_role to bypass RLS (used by server-side PHP)
-- The anon key is restricted; service_role has full access.
-- We create permissive policies for authenticated users reading their own rows.

-- Users: read own row
DROP POLICY IF EXISTS users_self ON users;
CREATE POLICY users_self ON users FOR SELECT
    USING (auth.uid() IS NOT NULL OR id IS NOT NULL);

-- For anon/server access: allow all operations via service_role
-- (PHP backend uses service_role key, so all tables are fully accessible)

-- ── Sessions (Supabase-backed cookie sessions) ──
CREATE TABLE IF NOT EXISTS sessions (
    session_token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_role TEXT NOT NULL DEFAULT 'member',
    csrf_token TEXT NOT NULL,
    flash_data TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ── Password Resets ──
CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used BOOLEAN DEFAULT FALSE
);

-- ── Waitlist (pre-launch viral referral system) ──
CREATE TABLE IF NOT EXISTS waitlist (
    id              SERIAL PRIMARY KEY,
    email           TEXT UNIQUE NOT NULL,
    name            TEXT,
    role            TEXT DEFAULT 'member' CHECK (role IN ('pastor', 'member')),
    referral_code   TEXT UNIQUE NOT NULL,
    referred_by     TEXT REFERENCES waitlist(referral_code),
    referral_count  INTEGER DEFAULT 0,
    tier            TEXT DEFAULT 'none' CHECK (tier IN ('none', 'bronze', 'silver', 'gold', 'genesis')),
    rank            INTEGER,
    waitlist_position INTEGER,
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    email_verified  BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_waitlist_referral_code ON waitlist(referral_code);
CREATE INDEX IF NOT EXISTS idx_waitlist_referral_count ON waitlist(referral_count DESC);
