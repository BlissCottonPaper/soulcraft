// ============================================================
// /functions/mira/_schema.js  —  Mira self-healing schema
// ============================================================
// Same defensive pattern the accounts system uses: create the belief columns
// and the three mira_* tables on demand, so Mira works whether or not migration
// 0003 was run in the dashboard. Idempotent, memoized per isolate; each ALTER's
// "duplicate column name" error is swallowed, CREATE ... IF NOT EXISTS no-ops.
// ============================================================

let miraSchemaEnsured = false;

export async function ensureMiraSchema(env) {
  if (miraSchemaEnsured || !env || !env.DB) return;
  const statements = [
    "ALTER TABLE users ADD COLUMN belief_traditions TEXT",
    "ALTER TABLE users ADD COLUMN belief_open_all INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN belief_openness TEXT",
    "CREATE TABLE IF NOT EXISTS mira_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, session_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')))",
    "CREATE TABLE IF NOT EXISTS mira_summaries (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, session_id TEXT NOT NULL, summary TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')))",
    "CREATE TABLE IF NOT EXISTS mira_insights (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')))",
    "CREATE INDEX IF NOT EXISTS idx_mira_messages_session ON mira_messages(user_id, session_id)",
    "CREATE INDEX IF NOT EXISTS idx_mira_summaries_user ON mira_summaries(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_mira_insights_user ON mira_insights(user_id)",
  ];
  for (const sql of statements) {
    try { await env.DB.prepare(sql).run(); } catch (e) { /* already exists — expected */ }
  }
  miraSchemaEnsured = true;
}
