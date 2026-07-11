// ============================================================
// /functions/api/me.js  ->  GET /api/me
// ============================================================
// The nav and the account page both ask "who's logged in, and what do they
// have?" This is that endpoint. Never throws to the client — an unauthenticated
// caller just gets { authenticated: false }.
//
//   GET  ->  { authenticated: false }
//        |   { authenticated: true, email, companion_active, companion_tier,
//               has_results, latest_result_id, result_count }
//
// Needs the D1 binding env.DB.
// ============================================================

import { getSessionUser } from "./_auth.js";

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    // Never cache a per-user answer.
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function onRequestGet({ request, env }) {
  try {
    const user = await getSessionUser(request, env);
    if (!user) return json({ authenticated: false });

    // Their real (non-placeholder) readings, newest first.
    let latestId = null, count = 0;
    try {
      const rows = await env.DB
        .prepare(
          "SELECT id FROM results WHERE user_id = ? AND archetype_scores <> '{}' AND archetype_scores <> '' ORDER BY created_at DESC"
        )
        .bind(user.id)
        .all();
      const list = (rows && rows.results) || [];
      count = list.length;
      if (count) latestId = list[0].id;
    } catch (e) { /* ignore — treat as no results */ }

    return json({
      authenticated: true,
      email: user.email,
      companion_active: !!user.companion_active,
      companion_tier: user.companion_tier || null,
      has_results: count > 0,
      latest_result_id: latestId,
      result_count: count,
    });
  } catch (err) {
    return json({ authenticated: false });
  }
}
