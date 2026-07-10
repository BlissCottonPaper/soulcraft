-- ============================================================
-- Migration 001 — Shadow unlock + Full-purchase flags on results
-- ============================================================
-- Run ONCE against the EXISTING D1 database (schema.sql already carries
-- these columns for fresh installs, so only databases created before this
-- migration need it):
--
--   wrangler d1 execute soulcraft-db --file=migrations/001_add_shadow_columns.sql
--
-- or paste into the Cloudflare dashboard D1 "Console" tab.
--
-- shadow_unlocked = 1 once the $15 Shadow Mandala unlock is paid (set
-- server-side in checkout-status.js after Stripe confirms payment); when a
-- result is restored via magic link, a 1 re-reveals the Shadow Mandala with
-- no repeat payment.
--
-- full_purchased = 1 when the reading was bought as the $34 Full (both
-- mandalas) upfront, versus Your Mandala ($19) with the shadow added later —
-- so the Stripe layer knows what has already been paid for.
-- ============================================================

ALTER TABLE results ADD COLUMN shadow_unlocked INTEGER NOT NULL DEFAULT 0;
ALTER TABLE results ADD COLUMN full_purchased INTEGER NOT NULL DEFAULT 0;
