// ============================================================
// /functions/api/admin/delete-user.js  ->  POST /api/admin/delete-user
// ============================================================
// Operator data-deletion tool (GDPR/CCPA erasure). Same guard as the other admin
// endpoints: the request MUST send header `X-Admin-Key` matching env.ADMIN_KEY.
//
// Two-step, deliberately NOT a single click:
//   • { action: "preview", email }  → what exists for that email (nothing is
//     touched): account?, results count, Mira message count, purchase count.
//   • { action: "delete", email, confirm: "DELETE" } → erases the account,
//     sessions, auth tokens (password resets / magic / login links), results,
//     and Mira history. RETAINS purchase records (full_purchased results) for
//     legal/accounting — those rows are ANONYMIZED (user_id + reading content
//     scrubbed) but kept. Writes a completion row to `deletion_log`
//     (SHA-256 email hash — never the raw email — plus what was removed).
//
// Read-only elsewhere; this is the only destructive admin path, and it needs the
// exact email AND the literal confirm string "DELETE".
//
// Needs: env.ADMIN_KEY and the D1 binding env.DB.
// ============================================================

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sha256Hex(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Best-effort scalar count; missing table (never created) → 0, not an error.
async function countOf(env, sql, bind) {
  try {
    const r = await env.DB.prepare(sql).bind(...(bind || [])).first();
    return Number((r && r.n) || 0);
  } catch (e) { return 0; }
}

// Best-effort statement — swallow "no such table" so a partial schema can't
// abort the erasure. Returns the number of rows changed (0 on any failure).
async function run(env, sql, bind) {
  try {
    const res = await env.DB.prepare(sql).bind(...(bind || [])).run();
    return (res && res.meta && res.meta.changes) || 0;
  } catch (e) { return 0; }
}

async function gather(env, userId) {
  return {
    results: await countOf(env, "SELECT COUNT(*) AS n FROM results WHERE user_id = ?", [userId]),
    purchases: await countOf(env, "SELECT COUNT(*) AS n FROM results WHERE user_id = ? AND full_purchased = 1", [userId]),
    miraMessages: await countOf(env, "SELECT COUNT(*) AS n FROM mira_messages WHERE user_id = ?", [userId]),
  };
}

export async function onRequestPost({ request, env }) {
  const provided = request.headers.get("X-Admin-Key") || "";
  if (!env.ADMIN_KEY || !safeEqual(provided, env.ADMIN_KEY)) {
    return json({ error: "Unauthorized" }, 401);
  }
  if (!env.DB) return json({ error: "Database not configured" }, 500);

  const body = await request.json().catch(() => ({}));
  const action = body.action === "delete" ? "delete" : "preview";
  const email = String(body.email || "").trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: "Enter a valid email address." }, 400);
  }

  let user;
  try {
    user = await env.DB.prepare("SELECT id, email, password_hash, created_at FROM users WHERE email = ?").bind(email).first();
  } catch (e) {
    return json({ error: "Server error", detail: e.message }, 500);
  }

  // ---- PREVIEW ----------------------------------------------------------
  if (action === "preview") {
    if (!user) return json({ found: false, email });
    const g = await gather(env, user.id);
    return json({
      found: true,
      email,
      hasAccount: true,
      hasPassword: !!user.password_hash,
      results: g.results,
      miraMessages: g.miraMessages,
      purchases: g.purchases,
    });
  }

  // ---- DELETE -----------------------------------------------------------
  if (String(body.confirm || "") !== "DELETE") {
    return json({ error: 'Type DELETE to confirm.' }, 400);
  }
  if (!user) return json({ found: false, email, deleted: false });

  const before = await gather(env, user.id);
  const uid = user.id;

  // Mira history.
  await run(env, "DELETE FROM mira_messages WHERE user_id = ?", [uid]);
  await run(env, "DELETE FROM mira_summaries WHERE user_id = ?", [uid]);
  await run(env, "DELETE FROM mira_insights WHERE user_id = ?", [uid]);
  // Sessions + every auth token tied to the account.
  await run(env, "DELETE FROM sessions WHERE user_id = ?", [uid]);
  await run(env, "DELETE FROM password_resets WHERE user_id = ?", [uid]);
  await run(env, "DELETE FROM magic_links WHERE user_id = ?", [uid]);
  await run(env, "DELETE FROM login_links WHERE user_id = ?", [uid]);
  // Results: RETAIN purchases (anonymized — detach from the user and scrub the
  // reading content), then delete the remaining (non-purchase) readings.
  const retained = await run(
    env,
    "UPDATE results SET user_id = NULL, archetype_scores = '{}', channel_scores = '{}', descriptor_picks = NULL WHERE user_id = ? AND full_purchased = 1",
    [uid]
  );
  await run(env, "DELETE FROM results WHERE user_id = ?", [uid]);
  // The account itself.
  await run(env, "DELETE FROM users WHERE id = ?", [uid]);

  const removed = {
    account: true,
    results_deleted: before.results - before.purchases,
    mira_messages: before.miraMessages,
    purchases_retained: retained || before.purchases,
  };

  // Completion log — hashed email only, never the raw address.
  try {
    await env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS deletion_log (id INTEGER PRIMARY KEY AUTOINCREMENT, email_hash TEXT NOT NULL, removed TEXT, created_at INTEGER NOT NULL)"
    ).run();
    const hash = await sha256Hex(email);
    await env.DB.prepare("INSERT INTO deletion_log (email_hash, removed, created_at) VALUES (?, ?, ?)")
      .bind(hash, JSON.stringify(removed), Math.floor(Date.now() / 1000)).run();
  } catch (e) { /* logging is best-effort; the erasure already happened */ }

  return json({ found: true, deleted: true, email, removed });
}
