-- ============================================================
-- Migration 0003 — Mira companion (belief lens + chat memory)
-- ============================================================
-- Run each statement INDIVIDUALLY in the Cloudflare dashboard SQL console
-- (Storage & Databases → D1 → your database → Console). Running them one at a
-- time lets a "duplicate column name" error on an already-applied ALTER fail
-- gracefully without aborting the rest.
--
-- belief_traditions stores a JSON array of strings, e.g. ["christian","buddhist"].
-- belief_openness is 'home' or 'parallels'.
--
-- (These are ALSO created/altered on demand by functions/mira/_schema.js
-- ensureMiraSchema(), so Mira self-heals if this migration isn't run — but
-- running it here is the canonical path.)
-- ============================================================

ALTER TABLE users ADD COLUMN belief_traditions TEXT;

ALTER TABLE users ADD COLUMN belief_open_all INTEGER DEFAULT 0;

ALTER TABLE users ADD COLUMN belief_openness TEXT;

CREATE TABLE IF NOT EXISTS mira_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, session_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')));

CREATE TABLE IF NOT EXISTS mira_summaries (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, session_id TEXT NOT NULL, summary TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')));

CREATE TABLE IF NOT EXISTS mira_insights (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')));
