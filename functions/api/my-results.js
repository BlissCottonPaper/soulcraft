// ============================================================
// /functions/api/my-results.js
// ============================================================
// The piece that was genuinely missing: verify-link.js only ever
// fetches ONE specific result by ID. This function answers a
// different, necessary question — "show me EVERY result this
// person has ever saved" — which is what Compare-Over-Time and
// an honest results history actually require.
//
// Called with a valid, unexpired magic link token (same one used
// for verify-link.js) — the token proves which user is asking,
// then we return every result row tied to that user, oldest first,
// each one clearly marked with whether it was a fresh attempt or
// an upgrade of an earlier one.
// ============================================================

import { getSessionUser } from "./_auth.js";

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    // Two ways to prove who's asking:
    //   1) a magic-link token (email retrieval, no account needed), or
    //   2) a logged-in session cookie (the account page's "View Your Mandala").
    let userId = null;
    if (token) {
      const now = Math.floor(Date.now() / 1000);
      const linkRow = await env.DB
        .prepare("SELECT * FROM magic_links WHERE token = ?")
        .bind(token)
        .first();
      if (!linkRow || linkRow.expires_at < now) {
        return new Response(JSON.stringify({ error: "Invalid or expired link" }), {
          status: 401,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Vary": "Cookie" },
        });
      }
      userId = linkRow.user_id;
    } else {
      const sessionUser = await getSessionUser(request, env);
      if (sessionUser) userId = sessionUser.id;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Vary": "Cookie" },
      });
    }

    // Every result ever saved under this user — every Free attempt,
    // every Triad, every Full, every upgrade — oldest first, so a
    // future "you six months ago vs. you today" view can just take
    // the first and last entries. Skip placeholder rows a paid gate
    // left behind before the assessment was answered.
    const { results: rows } = await env.DB
      .prepare("SELECT * FROM results WHERE user_id = ? AND archetype_scores <> '{}' AND archetype_scores <> '' ORDER BY created_at ASC")
      .bind(userId)
      .all();

    const history = rows.map((r) => ({
      resultId: r.id,
      tier: r.tier,
      mode: r.mode,
      archetypeScores: JSON.parse(r.archetype_scores),
      temperamentScores: JSON.parse(r.channel_scores),
      descriptorPicks: r.descriptor_picks ? JSON.parse(r.descriptor_picks) : [],
      shadowUnlocked: !!r.shadow_unlocked,      // re-reveal the Shadow Mandala with no repeat payment
      fullPurchased: !!r.full_purchased,        // bought as the $29 Full
      wasUpgradeOf: r.upgraded_from_id || null, // null = a fresh attempt, not an upgrade
      createdAt: r.created_at,
    }));

    return new Response(
      JSON.stringify({
        totalAttempts: history.length,
        history,
      }),
      { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Vary": "Cookie" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error", detail: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Vary": "Cookie" },
    });
  }
}
