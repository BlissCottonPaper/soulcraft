// ============================================================
// /functions/api/checkout-status.js
// ============================================================
// Confirms, server-side, that a Stripe Checkout Session actually got paid before
// the front end reveals the Shadow Mandala. The client calls this from the
// embedded checkout's onComplete handler — we never reveal paid content on the
// client's say-so alone. Requires STRIPE_SECRET_KEY.
// ============================================================

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json" } });
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session_id");
    if (!sessionId) return json({ paid: false, error: "Missing session_id" }, 400);
    if (!env.STRIPE_SECRET_KEY) return json({ paid: false, error: "Payment isn't configured." });

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions/" + encodeURIComponent(sessionId), {
      headers: { "Authorization": "Bearer " + env.STRIPE_SECRET_KEY },
    });
    const session = await res.json().catch(() => ({}));
    if (!res.ok) return json({ paid: false, error: "Could not verify the session." }, 502);

    // 'paid' is the definitive signal; 'complete' covers $0/other edge flows.
    const paid = session.payment_status === "paid" || session.status === "complete";
    return json({ paid: paid, product: (session.metadata && session.metadata.product) || null });
  } catch (err) {
    return json({ paid: false, error: "Server error", detail: err.message }, 500);
  }
}
