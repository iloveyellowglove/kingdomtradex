-- Run this in Supabase SQL Editor to create the sessions table
-- Replaces PHP native sessions with Supabase-backed cookie sessions.
CREATE TABLE IF NOT EXISTS sessions (
    session_token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_role TEXT NOT NULL DEFAULT 'member',
    csrf_token TEXT NOT NULL,
    flash_data TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);

-- Index for cleaning up expired sessions
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
