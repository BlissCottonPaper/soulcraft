-- ============================================================
-- Migration 0007 — password reset tokens (Session 5c)
-- ============================================================
-- Backs the "forgot password" flow. The emailed link carries a raw random
-- token; only its SHA-256 hash is stored here (same discipline as sessions),
-- so a leaked table can't reset anyone's password. Single-use, ~1 hour TTL.
--
-- Run in the Cloudflare D1 console (also self-healed on demand by
-- functions/api/_auth.js ensureSchema()).
-- ============================================================

CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
