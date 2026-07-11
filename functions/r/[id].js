// ============================================================
// /functions/r/[id].js  ->  GET /r/{resultId}
// ============================================================
// A read-only, shareable public Mandala page. Server-rendered (so social
// scrapers get real OG tags — see _public-page.js). Only results the owner has
// explicitly shared (is_public = 1) are viewable; anything else returns a
// friendly "not available" page. Needs the D1 binding env.DB.
// ============================================================

import { renderPublicResultPage, renderNotAvailablePage } from "./_public-page.js";

function html(body, status) {
  return new Response(body, {
    status: status || 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Public + shareable, but let a freshly-shared page appear quickly.
      "Cache-Control": "public, max-age=300",
    },
  });
}

export async function onRequestGet({ params, env }) {
  const id = params && params.id;
  if (!id || typeof id !== "string" || !env.DB) {
    return html(renderNotAvailablePage(), 404);
  }
  try {
    const row = await env.DB
      .prepare("SELECT id, archetype_scores, is_public FROM results WHERE id = ?")
      .bind(id)
      .first();

    // Only show results the owner opted to share, and only once they have real
    // scores (never the empty '{}' placeholder a paid/abandoned gate leaves).
    if (!row || Number(row.is_public) !== 1 || !row.archetype_scores || row.archetype_scores === "{}") {
      return html(renderNotAvailablePage(), 404);
    }

    let scores = {};
    try { scores = JSON.parse(row.archetype_scores); } catch (e) { scores = {}; }
    return html(renderPublicResultPage(id, scores), 200);
  } catch (e) {
    return html(renderNotAvailablePage(), 500);
  }
}
