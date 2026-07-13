// ============================================================
// /functions/api/admin/feedback.js  ->  GET /api/admin/feedback
// ============================================================
// Private list of feedback-widget submissions for the operator. Same guard as
// the stats endpoint: the request MUST send header `X-Admin-Key` matching the
// env var ADMIN_KEY. A missing or wrong key returns 401 and nothing else.
//
//   curl -H "X-Admin-Key: <ADMIN_KEY>" https://artofsoulcraft.com/api/admin/feedback
//
// Returns JSON:
//   { feedback: [ { id, rating, message, email, page, created_at }, ... ],
//     generatedAt }                       // newest first, capped
//
// Needs: env.ADMIN_KEY and the D1 binding env.DB.
// ============================================================

const LIMIT = 300; // newest N submissions; plenty for a hand-run dashboard

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

// Length-safe, constant-time-ish string compare so the key can't be probed by
// timing. Returns false on any type/length mismatch. (Same as stats.js.)
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function onRequestGet({ request, env }) {
  const provided = request.headers.get("X-Admin-Key") || "";
  if (!env.ADMIN_KEY || !safeEqual(provided, env.ADMIN_KEY)) {
    return json({ error: "Unauthorized" }, 401);
  }
  if (!env.DB) {
    return json({ error: "Database not configured" }, 500);
  }

  let feedback = [];
  try {
    const res = await env.DB
      .prepare("SELECT id, rating, message, email, page, created_at FROM feedback ORDER BY id DESC LIMIT ?")
      .bind(LIMIT).all();
    feedback = (res && res.results) || [];
  } catch (e) {
    // Table not created yet (no submissions) — return an empty list, not a 500.
    feedback = [];
  }

  return json({ feedback: feedback, generatedAt: Math.floor(Date.now() / 1000) });
}
