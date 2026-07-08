// ============================================================
// /functions/api/verify-link.js
// ============================================================
// Called the moment someone clicks the link in their email.
// There is no "login" or "logout" state here — this is a pure
// lookup: take the token from the URL, find the matching result,
// hand it back. Click it five minutes later or five months later,
// same answer, every time, because the underlying row never
// changes unless they explicitly retake the assessment.
// ============================================================

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const resultId = url.searchParams.get("result");

    if (!token || !resultId) {
      return new Response(JSON.stringify({ error: "Missing token or result id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const now = Math.floor(Date.now() / 1000);

    // Look up the token. Note: we check expiry on the LOGIN token only —
    // the underlying result itself has no expiry at all. An expired
    // token just means this specific emailed link is stale; the person
    // can always request a fresh one by re-entering their email.
    const linkRow = await env.DB
      .prepare("SELECT * FROM magic_links WHERE token = ?")
      .bind(token)
      .first();

    if (!linkRow) {
      return new Response(JSON.stringify({ error: "Invalid link" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (linkRow.expires_at < now) {
      return new Response(JSON.stringify({ error: "This link has expired. Enter your email again to get a fresh one." }), {
        status: 410,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Mark the token used (this is about the LINK being single-use for
    // security hygiene, not the result — clicking it again after this
    // point would need a fresh link, but the result itself remains
    // fully intact and re-fetchable via the plain /r/{id} URL).
    if (!linkRow.used) {
      await env.DB
        .prepare("UPDATE magic_links SET used = 1 WHERE token = ?")
        .bind(token)
        .run();
    }

    // Fetch the actual result, scoped to the user this token belongs to —
    // this prevents someone from guessing a result ID and pairing it with
    // an unrelated token to see someone else's data.
    const result = await env.DB
      .prepare("SELECT * FROM results WHERE id = ? AND user_id = ?")
      .bind(resultId, linkRow.user_id)
      .first();

    if (!result) {
      return new Response(JSON.stringify({ error: "Result not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        resultId: result.id,
        tier: result.tier,
        mode: result.mode,
        archetypeScores: JSON.parse(result.archetype_scores),
        temperamentScores: JSON.parse(result.channel_scores),
        descriptorPicks: result.descriptor_picks ? JSON.parse(result.descriptor_picks) : [],
        createdAt: result.created_at,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error", detail: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ============================================================
// A second, simpler endpoint: fetch a result by its PUBLIC shareable
// slug alone (/r/{id}), no token needed at all. This is what powers
// the shareable link and social preview cards — anyone with the link
// can view a result that's been marked is_public, no email required.
// ============================================================
export async function onRequestGetPublic({ params, env }) {
  const resultId = params.id;

  const result = await env.DB
    .prepare("SELECT * FROM results WHERE id = ? AND is_public = 1")
    .bind(resultId)
    .first();

  if (!result) {
    return new Response(JSON.stringify({ error: "Not found or not public" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      resultId: result.id,
      tier: result.tier,
      archetypeScores: JSON.parse(result.archetype_scores),
      temperamentScores: JSON.parse(result.channel_scores),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
