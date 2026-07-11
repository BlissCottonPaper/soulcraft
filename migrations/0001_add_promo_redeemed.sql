-- ============================================================
-- Migration 0001 — add results.promo_redeemed
-- ============================================================
-- For databases created before this column existed. Fresh installs get it
-- straight from schema.sql and do NOT need to run this.
--
-- Run once against the live D1 database:
--   wrangler d1 execute soulcraft-db --file=migrations/0001_add_promo_redeemed.sql
-- (or paste into the D1 Console).
--
-- Why: a free PROMO_CODES redemption and a paid $34 Full both set
-- full_purchased=1 AND shadow_unlocked=1, so without a dedicated marker the
-- admin stats endpoint can't separate "promo uses" from real purchases.
-- ============================================================

ALTER TABLE results ADD COLUMN promo_redeemed INTEGER NOT NULL DEFAULT 0;
