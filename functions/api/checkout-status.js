// ============================================================
// /functions/api/checkout-status.js
// ============================================================
// A plain read of "what has this reading paid for," straight from D1. The
// results page calls it with a result_id and gates the Shadow Mandala on the
// answer. The flags themselves are only ever written by the signature-verified
// Stripe webhook (stripe-webhook.js) — this endpoint never touches Stripe and
// never writes, so it can't be used to grant access.
//
//   GET /api/checkout-status?result_id=<uuid>
//   -> { shadow_unlocked: boolean, full_purchased: boolean }
//
// Needs the D1 binding env.DB.
// ============================================================

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Vary": "Cookie" } });
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const resultId = url.searchParams.get("result_id");
    if (!resultId) return json({ error: "Missing result_id" }, 400);
    if (!env.DB) return json({ error: "Database isn't configured." }, 500);

    const row = await env.DB
      .prepare("SELECT shadow_unlocked, full_purchased FROM results WHERE id = ?")
      .bind(resultId)
      .first();
    if (!row) return json({ error: "Result not found" }, 404);

    return json({
      shadow_unlocked: !!row.shadow_unlocked,
      full_purchased: !!row.full_purchased,
    });
  } catch (err) {
    return json({ error: "Server error", detail: err.message }, 500);
  }
}
