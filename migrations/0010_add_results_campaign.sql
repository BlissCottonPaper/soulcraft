-- ============================================================
-- Migration 0010 — add results.campaign
-- ============================================================
-- For databases created before this column existed. Fresh installs get it
-- straight from schema.sql and do NOT need to run this.
--
-- Run once against the live D1 database:
--   wrangler d1 execute soulcraft-db --file=migrations/0010_add_results_campaign.sql
-- (or paste into the D1 Console).
--
-- Why: the /begin landing page (the Bliss insert card) rotates attribution by
-- changing the QR's ?c= tag, never the printed URL. begin-unlock.js records that
-- tag here so a signup can be traced to the campaign that produced it
-- (e.g. 'bliss-q3-2026'). NULL for every other flow. The write is best-effort in
-- the endpoint, so the column being absent never blocks an unlock — but running
-- this is what makes the attribution actually persist.
-- ============================================================

ALTER TABLE results ADD COLUMN campaign TEXT;
