// ============================================================
// /functions/api/redeem-promo.js
// ============================================================
// Free-access promo codes — a server-side alternative to Stripe checkout. A
// valid code grants the same thing a completed Full purchase does: it stamps
// full_purchased = 1 AND shadow_unlocked = 1 on the results row, bypassing
// Stripe entirely, and the results page reveals everything.
//
//   POST { result_id, code }
//   -> { ok: true,  full_purchased: true, shadow_unlocked: true }   valid code
//   -> { ok: false, error: "…" }                                     invalid code
//
// The valid codes live ONLY in the Cloudflare Pages env var PROMO_CODES (a
// comma-separated list, matched case-insensitively). They are never sent to the
// client — this endpoint only ever answers ok:true / ok:false, so the list can't
// be enumerated from the browser.
//
// Needs: env.PROMO_CODES and the D1 binding env.DB.
// ============================================================

const INVALID_MSG = "That code isn't valid — try again or continue to checkout.";

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json" } });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const resultId = body.result_id;
    const code = (body.code || "").trim();

    if (!resultId || typeof resultId !== "string") {
      return json({ ok: false, error: "Missing result_id." }, 400);
    }
    if (!code) {
      return json({ ok: false, error: INVALID_MSG }, 200);
    }

    // Parse the allow-list from the env var: comma-separated, case-insensitive,
    // whitespace-tolerant. Empty/missing var means no codes are valid.
    const valid = (env.PROMO_CODES || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (!valid.includes(code.toLowerCase())) {
      // Deliberately a 200 with ok:false, not a 4xx: it's a well-formed request,
      // just the wrong code. The client shows an inline note and leaves the
      // normal checkout flow untouched. The valid list is never disclosed.
      return json({ ok: false, error: INVALID_MSG }, 200);
    }

    if (!env.DB) {
      return json({ ok: false, error: "Free access isn't available right now — please try checkout." }, 500);
    }

    // Same write a completed Full purchase performs via the Stripe webhook.
    await env.DB
      .prepare("UPDATE results SET full_purchased = 1, shadow_unlocked = 1 WHERE id = ?")
      .bind(resultId)
      .run();

    return json({ ok: true, full_purchased: true, shadow_unlocked: true });
  } catch (err) {
    return json({ ok: false, error: "Server error", detail: err.message }, 500);
  }
}
