-- ============================================================================
-- Migration 01: 3-Balance Model Schema
-- Adds locked_balance, profit_balance, commission_balance to users.
-- Creates deposit_locks table for time-locked deposit tracking.
-- Creates lock_tiers configuration table.
-- Run in Supabase SQL Editor.
-- ============================================================================

-- 1. Add new balance columns to users (keep existing display_balance)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS locked_balance      NUMERIC(20,8) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_balance      NUMERIC(20,8) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_balance  NUMERIC(20,8) NOT NULL DEFAULT 0;

-- 2. Create deposit_locks table
CREATE TABLE IF NOT EXISTS deposit_locks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         BIGINT NOT NULL REFERENCES users(id),
    deposit_id      BIGINT NOT NULL REFERENCES deposits(id),
    amount          NUMERIC(20,8) NOT NULL,
    tier            TEXT NOT NULL CHECK (tier IN ('growth','builder','kingdom','legacy')),
    lock_days     INT NOT NULL CHECK (lock_days IN (60, 90, 120, 180)),
    daily_rate      NUMERIC(10,6) NOT NULL,
    locked_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    unlocks_at      TIMESTAMPTZ NOT NULL,
    status          TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked','matured','withdrawn')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deposit_locks_user_id    ON deposit_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_locks_status     ON deposit_locks(status);
CREATE INDEX IF NOT EXISTS idx_deposit_locks_unlocks_at ON deposit_locks(unlocks_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_deposit_locks_deposit_id ON deposit_locks(deposit_id);

-- 3. Create lock_tiers configuration table
CREATE TABLE IF NOT EXISTS lock_tiers (
    tier        TEXT PRIMARY KEY,
    label       TEXT NOT NULL,
    lock_days INT NOT NULL,
    daily_rate  NUMERIC(10,6) NOT NULL,
    description TEXT,
    sort_order  INT NOT NULL DEFAULT 0
);

INSERT INTO lock_tiers (tier, label, lock_days, daily_rate, description, sort_order) VALUES
    ('growth',   'Growth',   60,  0.010000, '60-day lock period',  1),
    ('builder',  'Builder',  90,  0.012000, '90-day lock period',  2),
    ('kingdom',  'Kingdom',  120, 0.014000, '120-day lock period', 3),
    ('legacy',   'Legacy',   180, 0.018000, '180-day lock period', 4)
ON CONFLICT (tier) DO NOTHING;
