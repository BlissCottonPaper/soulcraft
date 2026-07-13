-- ============================================================
-- Migration 0009 — sitewide feedback widget
-- ============================================================
-- One row per submission from the floating feedback widget (no login):
--   • rating      — 1–5 "How are we doing?", or NULL if they left only a note
--   • message     — free-text feedback (may be empty if they left only a rating)
--   • email       — optional, "if you'd like us to follow up"
--   • page        — the path they were on when they submitted (context)
--   • created_at  — Unix seconds
--
-- Run in the Cloudflare D1 console (also self-healed on demand by
-- functions/api/feedback.js ensureFeedbackTable()).
-- ============================================================

CREATE TABLE IF NOT EXISTS feedback (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  rating     INTEGER,
  message    TEXT,
  email      TEXT,
  page       TEXT,
  created_at INTEGER NOT NULL
);
