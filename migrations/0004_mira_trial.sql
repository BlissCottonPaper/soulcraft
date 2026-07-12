-- ============================================================
-- Migration 0004 — Mira front-door trial (Session 3.2)
-- ============================================================
-- A 30-day Mira trial, granted by the $29 purchase or a WHITEDOT redemption.
-- Unix seconds; access is live while now < companion_trial_until.
--
-- Run in the Cloudflare D1 console (also self-healed on demand by
-- functions/mira/_schema.js ensureMiraSchema()).
-- ============================================================

ALTER TABLE users ADD COLUMN companion_trial_until INTEGER;
