// ============================================================
// /functions/api/create-checkout.js
// ============================================================
// Creates a Stripe *embedded* Checkout Session so the payment happens on-page,
// inside the results view — the shadow unlock reveals in the same session with
// no reload and no new URL (see index.html's unlockShadow / embedded checkout,
// which uses redirect_on_completion:'never' + onComplete).
//
// Three products, priced in cents:
//   shadow  — $15  — the in-session upsell that unlocks the Shadow Mandala on top
//                    of an existing "Your Mandala" reading.
//   mandala — $19  — Your Mandala on its own.
//   full    — $34  — Your Mandala + Shadow Mandala, bought upfront.
// The Shadow Mandala is never sold on its own — "shadow" is only ever an add-on
// to a Mandala the buyer already has.
//
// Uses inline price_data, so the only Stripe config needed is the two keys:
//   STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY  (set in the Pages dashboard).
// Without them this returns a soft error and the UI simply says checkout isn't
// available yet — nothing breaks.
// ============================================================

const PRODUCTS = {
  shadow:  { amount: 1500, name: "Shadow Mandala unlock" },
  mandala: { amount: 1900, name: "Your Mandala" },
  full:    { amount: 3400, name: "Full — Your Mandala + Shadow Mandala" },
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json" } });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const product = PRODUCTS[body.product] ? body.product : null;
    if (!product) return json({ error: "Unknown product." }, 400);

    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PUBLISHABLE_KEY) {
      // Payment not wired yet — tell the UI plainly; it shows a gentle message.
      return json({ error: "Checkout isn't available yet — payment isn't configured." });
    }

    const p = PRODUCTS[product];
    // Stripe's API takes form-encoded params. Build the nested line_items keys by hand.
    const form = new URLSearchParams();
    form.set("ui_mode", "embedded");
    form.set("mode", "payment");
    form.set("redirect_on_completion", "never"); // stay on the page; reveal shadow in-session
    form.set("line_items[0][quantity]", "1");
    form.set("line_items[0][price_data][currency]", "usd");
    form.set("line_items[0][price_data][unit_amount]", String(p.amount));
    form.set("line_items[0][price_data][product_data][name]", p.name);
    form.set("metadata[product]", product);
    if (body.resultId) form.set("metadata[result_id]", String(body.resultId));

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.STRIPE_SECRET_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    const session = await res.json().catch(() => ({}));
    if (!res.ok || !session.client_secret) {
      const detail = session && session.error && session.error.message;
      return json({ error: detail || "Stripe couldn't start checkout." }, 502);
    }

    return json({
      clientSecret: session.client_secret,
      sessionId: session.id,
      publishableKey: env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (err) {
    return json({ error: "Server error", detail: err.message }, 500);
  }
}
