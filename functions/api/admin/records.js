// ============================================================
// /functions/api/admin/records.js  ->  GET /api/admin/records?kind=…&page=…
// ============================================================
// Paginated, READ-ONLY record lists behind the admin Stats drill-downs. Same
// guard as stats.js / feedback.js: the request MUST send header `X-Admin-Key`
// matching env.ADMIN_KEY, or it gets 401 and nothing else.
//
//   curl -H "X-Admin-Key: <ADMIN_KEY>" \
//     "https://artofsoulcraft.com/api/admin/records?kind=emails&page=0"
//
// Server-side pagination (newest first, 50/page) — the list is assumed to grow,
// so we never ship the whole table to the browser. Returns:
//   { records: [ … ], total, page, pageSize, generatedAt }
//
// kind is a fixed whitelist; anything else is 404. Read-only by design — there
// is no create/update/delete here.
//   • emails       — users who saved an email (users table)
//   • purchases    — paid/redeemed Full readings (results.full_purchased = 1)
//   • assessments  — completed readings (real archetype_scores), with top-3
//   • feedback     — feedback-widget submissions
//
// Needs: env.ADMIN_KEY and the D1 binding env.DB.
// ============================================================

const PAGE_SIZE = 50;

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

// Length-safe, constant-time-ish compare (same as stats.js / feedback.js).
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// The DONE predicate mirrors stats.js: a completed reading is one whose scores
// aren't the '{}' placeholder the pre-assessment payment gate seeds.
const DONE = "(archetype_scores <> '{}' AND archetype_scores <> '')";

// Per-kind query plan: a COUNT (for the pager) and a page SELECT. All ordered
// newest-first and bound to LIMIT/OFFSET. No user input reaches the SQL string.
const KINDS = {
  emails: {
    count: "SELECT COUNT(*) AS n FROM users",
    page: "SELECT id, email, created_at FROM users ORDER BY created_at DESC, id DESC LIMIT ?1 OFFSET ?2",
    map: (r) => ({ id: r.id, email: r.email, created_at: r.created_at }),
  },
  purchases: {
    count: "SELECT COUNT(*) AS n FROM results WHERE full_purchased = 1",
    page:
      "SELECT r.id AS id, r.tier AS tier, r.promo_redeemed AS promo, u.email AS email, r.created_at AS created_at " +
      "FROM results r LEFT JOIN users u ON u.id = r.user_id " +
      "WHERE r.full_purchased = 1 ORDER BY r.created_at DESC LIMIT ?1 OFFSET ?2",
    map: (r) => ({
      id: r.id,
      email: r.email || null,
      tier: r.promo ? (r.tier || "full") + " (promo)" : r.tier || "full",
      created_at: r.created_at,
    }),
  },
  assessments: {
    count: "SELECT COUNT(*) AS n FROM results WHERE " + DONE,
    page:
      "SELECT r.id AS id, r.tier AS tier, r.archetype_scores AS scores, u.email AS email, r.created_at AS created_at " +
      "FROM results r LEFT JOIN users u ON u.id = r.user_id " +
      "WHERE " + DONE + " ORDER BY r.created_at DESC LIMIT ?1 OFFSET ?2",
    map: (r) => ({ id: r.id, tier: r.tier, email: r.email || null, top3: top3Of(r.scores), created_at: r.created_at }),
  },
  feedback: {
    count: "SELECT COUNT(*) AS n FROM feedback",
    page: "SELECT id, rating, message, email, page, created_at FROM feedback ORDER BY id DESC LIMIT ?1 OFFSET ?2",
    map: (r) => ({ id: r.id, rating: r.rating, message: r.message, email: r.email, page: r.page, created_at: r.created_at }),
  },
};

// Best-effort "loudest three" label from the stored archetype_scores JSON, so
// the assessments drill-down shows something human, not just a row id.
function top3Of(scoresJson) {
  try {
    const s = JSON.parse(scoresJson || "{}");
    const keys = Object.keys(s);
    if (!keys.length) return null;
    return keys
      .sort((a, b) => Number(s[b]) - Number(s[a]))
      .slice(0, 3)
      .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
      .join(" · ");
  } catch (e) {
    return null;
  }
}

export async function onRequestGet({ request, env }) {
  const provided = request.headers.get("X-Admin-Key") || "";
  if (!env.ADMIN_KEY || !safeEqual(provided, env.ADMIN_KEY)) {
    return json({ error: "Unauthorized" }, 401);
  }
  if (!env.DB) {
    return json({ error: "Database not configured" }, 500);
  }

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") || "";
  const plan = KINDS[kind];
  if (!plan) return json({ error: "Unknown record kind" }, 404);

  let page = parseInt(url.searchParams.get("page") || "0", 10);
  if (!Number.isFinite(page) || page < 0) page = 0;
  const offset = page * PAGE_SIZE;

  try {
    let total = 0;
    try {
      const c = await env.DB.prepare(plan.count).first();
      total = Number((c && c.n) || 0);
    } catch (e) {
      // Table may not exist yet (e.g. no feedback submitted) — treat as empty.
      return json({ records: [], total: 0, page: 0, pageSize: PAGE_SIZE, generatedAt: Math.floor(Date.now() / 1000) });
    }

    const res = await env.DB.prepare(plan.page).bind(PAGE_SIZE, offset).all();
    const rows = (res && res.results) || [];
    return json({
      records: rows.map(plan.map),
      total,
      page,
      pageSize: PAGE_SIZE,
      generatedAt: Math.floor(Date.now() / 1000),
    });
  } catch (err) {
    return json({ error: "Server error", detail: err.message }, 500);
  }
}
