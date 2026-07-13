-- ============================================================
-- Migration 0008 — belief lens: "Other" + "prefer not to answer"
-- ============================================================
--   • belief_other    — a self-named tradition typed into the "Other" field,
--                        kept verbatim. Collected to understand who uses
--                        Soulcraft; never shared, never used to assign a label.
--                        Also honored in Mira's belief lens (she speaks the
--                        language the person named).
--   • belief_declined — the "I prefer not to answer" flag. Stores no identity
--                        claim; routed to the same neutral/secular default as
--                        "Secular / humanist" at prompt time (psychology-first,
--                        no tradition-specific language). Distinct from
--                        "Open to all traditions," which stays an active choice.
--
-- Run in the Cloudflare D1 console (also self-healed on demand by
-- functions/mira/_schema.js ensureMiraSchema()).
-- ============================================================

ALTER TABLE users ADD COLUMN belief_other TEXT;
ALTER TABLE users ADD COLUMN belief_declined INTEGER NOT NULL DEFAULT 0;
