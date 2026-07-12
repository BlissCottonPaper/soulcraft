-- ============================================================
-- Migration 0005 — spoken-replies preference (Session 4)
-- ============================================================
-- Plumbing only: a per-account flag for "read Mira's replies aloud." No TTS
-- provider is wired yet — nothing reads this column — but the toggle in account
-- settings persists here so the preference is ready when the feature ships.
--
-- Run in the Cloudflare D1 console (also self-healed on demand by
-- functions/api/_auth.js ensureSchema()).
-- ============================================================

ALTER TABLE users ADD COLUMN voice_output_enabled INTEGER NOT NULL DEFAULT 0;
