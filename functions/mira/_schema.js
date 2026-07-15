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
    // First Orientation (G11): the guided induction through a person's own results,
    // run once as their first substantive Mira conversation. NULL = not yet done;
    // 'completed' = they walked it (or Mira closed it); 'declined' = they chose to
    // read the written results first. Either non-null value suppresses re-triggering.
    "ALTER TABLE users ADD COLUMN induction_status TEXT",
    // Results Refresh (post-G11 retakes): the gentle, recurring OFFER to walk
    // through what changed after a returning user retakes the assessment.
    //   results_reviewed_id — the results row Mira last acknowledged (baseline she
    //     diffs a new retake against; stamped to the G11 result when the induction
    //     completes, and advanced when a refresh is reviewed).
    //   results_offer_id / results_offer_count — which retake we're currently
    //     offering and how many session-openers have carried that offer, so it
    //     rests after a small cap instead of nagging.
    "ALTER TABLE users ADD COLUMN results_reviewed_id TEXT",
    "ALTER TABLE users ADD COLUMN results_offer_id TEXT",
    "ALTER TABLE users ADD COLUMN results_offer_count INTEGER DEFAULT 0",
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

// Has this person completed the assessment? True once a results row carries real
// archetype scores (the payment gate can pre-create an empty placeholder row, so
// an empty '{}' score blob does NOT count as complete).
export async function assessmentComplete(env, userId) {
  if (!env || !env.DB || !userId) return false;
  try {
    const r = await env.DB
      .prepare("SELECT 1 AS x FROM results WHERE user_id = ? AND archetype_scores <> '{}' AND archetype_scores <> '' LIMIT 1")
      .bind(userId).first();
    return !!r;
  } catch (e) { return false; }
}

// The First Orientation status for a user: null | 'completed' | 'declined'.
export async function getInductionStatus(env, userId) {
  if (!env || !env.DB || !userId) return null;
  await ensureMiraSchema(env);
  try {
    const r = await env.DB.prepare("SELECT induction_status FROM users WHERE id = ?").bind(userId).first();
    return (r && r.induction_status) || null;
  } catch (e) { return null; }
}

// Record the First Orientation as 'completed' or 'declined'. Only ever sets a
// terminal value, and never overwrites one already set (first outcome wins), so
// a late completion signal can't clobber an earlier decline or vice-versa.
export async function setInductionStatus(env, userId, status) {
  if (!env || !env.DB || !userId) return;
  if (status !== "completed" && status !== "declined") return;
  await ensureMiraSchema(env);
  try {
    await env.DB
      .prepare("UPDATE users SET induction_status = ? WHERE id = ? AND (induction_status IS NULL OR induction_status = '')")
      .bind(status, userId).run();
  } catch (e) { /* best-effort */ }
}

// The most recent completed-assessment results row id for a user (real scores
// only), or null. Used to anchor the Results Refresh baseline.
export async function getLatestResultId(env, userId) {
  if (!env || !env.DB || !userId) return null;
  try {
    const r = await env.DB
      .prepare("SELECT id FROM results WHERE user_id = ? AND archetype_scores <> '{}' AND archetype_scores <> '' ORDER BY created_at DESC LIMIT 1")
      .bind(userId).first();
    return (r && r.id) || null;
  } catch (e) { return null; }
}

// Mark a results row as the one Mira has acknowledged (the diff baseline), and
// clear the pending offer bookkeeping. Called when the G11 induction completes
// (anchor the baseline) and again whenever a later refresh is reviewed.
export async function markResultsReviewed(env, userId, resultId) {
  if (!env || !env.DB || !userId || !resultId) return;
  await ensureMiraSchema(env);
  try {
    await env.DB
      .prepare("UPDATE users SET results_reviewed_id = ?, results_offer_id = NULL, results_offer_count = 0 WHERE id = ?")
      .bind(resultId, userId).run();
  } catch (e) { /* best-effort */ }
}

// Record that a session-opener carried the refresh offer for `latestId`. Counts
// per-retake so the offer can rest after the cap: a new retake resets the count.
export async function noteResultsOffered(env, userId, latestId, priorOfferId, priorCount) {
  if (!env || !env.DB || !userId || !latestId) return;
  await ensureMiraSchema(env);
  const same = priorOfferId === latestId;
  const nextCount = same ? (Number(priorCount) || 0) + 1 : 1;
  try {
    await env.DB
      .prepare("UPDATE users SET results_offer_id = ?, results_offer_count = ? WHERE id = ?")
      .bind(latestId, nextCount, userId).run();
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
