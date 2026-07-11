-- ============================================================
-- Migration 0002 — Accounts (login), Mira companion state, sessions
-- ============================================================
-- Adds password-based accounts on top of the existing email-only
-- `users` table, a `sessions` table for httpOnly login cookies, and
-- the columns the Mira companion subscription flow reads/writes.
--
-- Run against the live DB (one time):
--   wrangler d1 execute soulcraft-db --file=migrations/0002_add_accounts.sql
-- D1 has no "ADD COLUMN IF NOT EXISTS", so if a column already exists
-- the individual ALTER will error — that's fine, run them one at a time
-- or ignore the "duplicate column name" error for any that pre-exist.
-- ============================================================

-- --- users: password + companion (Mira) fields ---
ALTER TABLE users ADD COLUMN password_hash TEXT;                         -- PBKDF2 hash; NULL for email-only (magic-link) users
ALTER TABLE users ADD COLUMN companion_active INTEGER NOT NULL DEFAULT 0;-- 1 once a Mira subscription (trial or paid) is live
ALTER TABLE users ADD COLUMN companion_tier TEXT;                        -- 'monthly' | 'quarterly' | 'yearly' | NULL
ALTER TABLE users ADD COLUMN subscription_id TEXT;                       -- Stripe subscription id backing Mira, if any

-- --- results: carry the Stripe customer + companion decision made at the
-- post-purchase interstitial, BEFORE an account may exist. Propagated onto
-- the user row the moment the result is linked to one (email save / login). ---
ALTER TABLE results ADD COLUMN stripe_customer_id TEXT;                  -- captured by the webhook on the $29 payment; reused to start the Mira trial
ALTER TABLE results ADD COLUMN companion_active INTEGER NOT NULL DEFAULT 0;
ALTER TABLE results ADD COLUMN companion_tier TEXT;
ALTER TABLE results ADD COLUMN subscription_id TEXT;

-- --- sessions: one row per active login. The COOKIE holds the raw token;
-- we only ever store its SHA-256 hash, so a DB leak can't be replayed as a
-- login. Expired rows are simply ignored (and can be swept later). ---
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,          -- SHA-256 hex of the cookie token
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,          -- unix seconds
  expires_at INTEGER NOT NULL           -- unix seconds; 30 days out
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
