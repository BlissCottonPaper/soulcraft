-- ============================================================
-- Migration 0006 — display name + research consent (Session 5b)
-- ============================================================
--   • display_name    — what to call the person: set at signup, edited in
--                        account settings, or learned by Mira in conversation.
--                        Falls back to the email-derived first name when unset.
--   • research_consent — opt-in flag for anonymized research use of assessment
--                        data. Unchecked by default; stored only, nothing reads
--                        it yet.
--
-- Run in the Cloudflare D1 console (also self-healed on demand by
-- functions/api/_auth.js ensureSchema()).
-- ============================================================

ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN research_consent INTEGER NOT NULL DEFAULT 0;
