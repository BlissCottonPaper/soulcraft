// ============================================================
// /functions/mira/_schema.js  —  Mira self-healing schema
// ============================================================
// Same defensive pattern the accounts system uses: create the belief columns
// and the three mira_* tables on demand, so Mira works whether or not migration
// 0003 was run in the dashboard. Idempotent, memoized per isolate; each ALTER's
// "duplicate column name" error is swallowed, CREATE ... IF NOT EXISTS no-ops.
// ============================================================

let miraSchemaEnsured = false;

const DAY = 24 * 60 * 60;
const TRIAL_DAYS = 30;

export async function ensureMiraSchema(env) {
  if (miraSchemaEnsured || !env || !env.DB) return;
  const statements = [
    "ALTER TABLE users ADD COLUMN belief_traditions TEXT",
    "ALTER TABLE users ADD COLUMN belief_open_all INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN belief_openness TEXT",
    // A self-named tradition ("Other"), stored verbatim for understanding who
    // uses Soulcraft. And a decline flag: "prefer not to answer" — no identity
    // claim stored, routed to the neutral/secular default at prompt time.
    "ALTER TABLE users ADD COLUMN belief_other TEXT",
    "ALTER TABLE users ADD COLUMN belief_declined INTEGER DEFAULT 0",
    // Session 3.2 front door: a 30-day Mira trial granted by the $29 purchase or a
    // WHITEDOT redemption. Unix seconds; access is live while now < this value.
    "ALTER TABLE users ADD COLUMN companion_trial_until INTEGER",
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

// Does this user have full access from a paid $29 reading OR a WHITEDOT promo?
// Both stamp full_purchased = 1 on a linked results row — the "front door" gate.
export async function hasFullPurchase(env, userId) {
  if (!env || !env.DB || !userId) return false;
  try {
    const r = await env.DB
      .prepare("SELECT 1 AS x FROM results WHERE user_id = ? AND full_purchased = 1 LIMIT 1")
      .bind(userId).first();
    return !!r;
  } catch (e) { return false; }
}

// Grant the 30-day Mira trial, once. No-op if the user already has a live paid
// subscription or a still-running trial, or isn't eligible (no full_purchased
// reading). Idempotent and eligibility-gated, so it's always safe to call.
export async function grantMiraTrial(env, userId) {
  if (!env || !env.DB || !userId) return;
  await ensureMiraSchema(env);
  try {
    const u = await env.DB
      .prepare("SELECT companion_active, companion_trial_until FROM users WHERE id = ?")
      .bind(userId).first();
    if (!u) return;
    const now = Math.floor(Date.now() / 1000);
    if (Number(u.companion_active) === 1) return;                 // already a subscriber
    if (u.companion_trial_until && Number(u.companion_trial_until) > now) return; // trial already live
    if (u.companion_trial_until) return;                          // trial already used once (expired)
    if (!(await hasFullPurchase(env, userId))) return;            // not through the front door
    await env.DB
      .prepare("UPDATE users SET companion_trial_until = ? WHERE id = ?")
      .bind(now + TRIAL_DAYS * DAY, userId).run();
  } catch (e) { /* best-effort */ }
}

// Current Mira access for a user: a live subscription OR an unexpired trial.
export async function miraAccess(env, userId) {
  const out = { active: false, trial_until: null, has_access: false, has_full_purchase: false };
  if (!env || !env.DB || !userId) return out;
  await ensureMiraSchema(env);
  try {
    const u = await env.DB
      .prepare("SELECT companion_active, companion_tier, companion_trial_until FROM users WHERE id = ?")
      .bind(userId).first();
    const now = Math.floor(Date.now() / 1000);
    out.active = u && Number(u.companion_active) === 1;
    out.trial_until = u && u.companion_trial_until ? Number(u.companion_trial_until) : null;
    out.tier = (u && u.companion_tier) || null;
    const trialing = out.trial_until && out.trial_until > now;
    out.has_access = !!(out.active || trialing);
    out.has_full_purchase = await hasFullPurchase(env, userId);
  } catch (e) { /* keep defaults */ }
  return out;
}
