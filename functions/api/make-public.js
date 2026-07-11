// ============================================================
// /functions/api/make-public.js  ->  POST /api/make-public
// ============================================================
// Marks a result as publicly shareable (is_public = 1) so its /r/{id} page is
// viewable. Called when the user chooses to Share their Mandala — sharing is the
// opt-in; results are never public by default. Idempotent.
//
//   POST { result_id }  ->  { ok: true, url }
//
// Needs the D1 binding env.DB.
// ============================================================

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json" } });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const resultId = body.result_id;
    if (!resultId || typeof resultId !== "string") {
      return json({ ok: false, error: "Missing result_id." }, 400);
    }
    if (env.DB) {
      // Only flip real readings public — never the empty '{}' gate placeholder.
      await env.DB
        .prepare("UPDATE results SET is_public = 1 WHERE id = ? AND archetype_scores <> '{}' AND archetype_scores <> ''")
        .bind(resultId)
        .run();
    }
    return json({ ok: true, url: "https://artofsoulcraft.com/r/" + resultId });
  } catch (err) {
    return json({ ok: false, error: "Server error", detail: err.message }, 500);
  }
}
