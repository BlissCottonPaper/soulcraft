-- ============================================================
-- THE ART OF SOULCRAFT — Database Schema (Cloudflare D1)
-- ============================================================
-- Run this once, right after creating the D1 database in the
-- Cloudflare dashboard (Storage & Databases → D1 → Create database).
-- Paste this whole file into the "Console" tab and execute it,
-- or run: wrangler d1 execute soulcraft-db --file=schema.sql
-- ============================================================

-- One row per person who has ever entered an email.
-- The email IS the account — no password, ever.
CREATE TABLE users (
  id TEXT PRIMARY KEY,                 -- uuid, generated at signup
  email TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,             -- set the first time they touch Stripe
  created_at INTEGER NOT NULL          -- unix timestamp
);

-- One row per completed assessment. Separate from `users` on purpose:
-- a person can retake the assessment, and every attempt is preserved
-- as its own row rather than overwriting the last one. This is what
-- makes a future "compare your results over time" feature possible
-- for free, without any schema changes later.
CREATE TABLE results (
  id TEXT PRIMARY KEY,                 -- uuid — this IS the shareable slug: /r/{id}
  user_id TEXT REFERENCES users(id),   -- NULL is allowed: guest/anonymous redemptions
                                        -- (e.g. Lavender Sky codes) may have no user row at all
  tier TEXT NOT NULL DEFAULT 'free',   -- 'free' | 'triad' | 'full'
  mode TEXT NOT NULL,                  -- 'quick' | 'full' — which pairing set was used
  archetype_scores TEXT NOT NULL,      -- JSON: {"lover":14,"sage":21,...}
  channel_scores TEXT NOT NULL,        -- JSON: {"heart":8,"mind":30,...}
  descriptor_picks TEXT,               -- JSON array, optional
  is_public INTEGER NOT NULL DEFAULT 0,-- 0/1 — opt-in only, never default-on
  upgraded_from_id TEXT REFERENCES results(id), -- set when this row IS an upgrade of an
                                        -- earlier result (e.g. Triad -> Full) rather than
                                        -- a fresh, unrelated retake. NULL for ordinary
                                        -- fresh attempts. This makes "was this a retake
                                        -- or an upgrade" a real, queryable distinction —
                                        -- both matter for Compare-Over-Time later, but
                                        -- an upgrade shouldn't count as a second "attempt."
  shadow_unlocked INTEGER NOT NULL DEFAULT 0,  -- 1 once the $15 Shadow Mandala unlock is
                                        -- paid (or included in the $34 Full). On retrieval
                                        -- this re-reveals the shadow with no repeat payment.
  full_purchased INTEGER NOT NULL DEFAULT 0,   -- 1 when this reading was bought as the $34
                                        -- Full (both mandalas) upfront, vs Your Mandala
                                        -- ($19) with the shadow unlocked later.
  promo_redeemed INTEGER NOT NULL DEFAULT 0,   -- 1 when full access was granted by a free
                                        -- PROMO_CODES redemption (e.g. WHITEDOT) rather than
                                        -- a Stripe payment. Promo and a paid Full both set
                                        -- full_purchased=1 / shadow_unlocked=1, so this flag
                                        -- is the only thing that tells them apart in stats.
  created_at INTEGER NOT NULL
);

-- One row per magic link ever sent. A token is single-use for LOGIN
-- purposes (marked used after the first click), but the underlying
-- result itself never expires — only the login token does.
CREATE TABLE magic_links (
  token TEXT PRIMARY KEY,              -- long random string, goes in the emailed URL
  user_id TEXT REFERENCES users(id),
  expires_at INTEGER NOT NULL,         -- unix timestamp, ~24hr from creation
  used INTEGER NOT NULL DEFAULT 0      -- 0/1
);

-- One row per single-use redemption code (Bliss Cotton Paper gift codes,
-- Lavender Sky partner codes, etc). Distinct from magic_links because
-- codes grant a TIER on redemption, not a login — and some code paths
-- (Lavender Sky) deliberately create no user row at all.
CREATE TABLE codes (
  code TEXT PRIMARY KEY,               -- short human-typeable string, e.g. "BLISS-7F3K"
  source TEXT NOT NULL,                -- 'bliss' | 'lavender_sky' | etc — which partner issued it
  grants_tier TEXT NOT NULL,           -- 'triad' | 'full' — what redeeming it unlocks
  used INTEGER NOT NULL DEFAULT 0,
  used_by_result_id TEXT REFERENCES results(id),  -- set at redemption time
  created_at INTEGER NOT NULL
);

-- One row per matched Compatibility pair. Bridges two EXISTING results
-- rather than being a "fourth tier" on a single result — Compatibility
-- inherently spans two people's data, so it needs its own table.
CREATE TABLE compatibility_pairs (
  id TEXT PRIMARY KEY,                 -- uuid — shareable slug: /c/{id}
  pairing_code TEXT UNIQUE NOT NULL,   -- the code Person A shares with Person B
  result_a_id TEXT REFERENCES results(id),
  result_b_id TEXT REFERENCES results(id), -- NULL until Person B redeems the code
  created_at INTEGER NOT NULL
);

-- Indexes: without these, every lookup does a full table scan, which
-- costs more (in D1's rows-read billing) and gets slower as the tables
-- grow. Cheap to add now, expensive to forget.
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_results_user_id ON results(user_id);
CREATE INDEX idx_magic_links_user_id ON magic_links(user_id);
CREATE INDEX idx_codes_source ON codes(source);
