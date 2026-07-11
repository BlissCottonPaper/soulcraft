// ============================================================
// /functions/api/create-checkout.js
// ============================================================
// Creates a Stripe *hosted* Checkout session (redirect flow) and hands the
// browser back a { url } to send the visitor to. No Stripe keys or price IDs
// ever reach the client — everything lives in Cloudflare Pages env vars and
// this function talks to Stripe.
//
//   purchase_type  price env var               what it buys
//   ------------   ------------------------     --------------------------------
//   full           STRIPE_PRICE_FULL            Full reading (both mandalas) — $29
//   compatibility  STRIPE_PRICE_COMPATIBILITY   Mandala Compatibility Report
//                                               (product wired; invite flow not built yet)
//
// The old $19 Mandala and $15 Shadow add-on products are retired — Full ($29)
// is now the single paid reading and includes the Shadow Mandala.
//
// result_id and purchase_type ride along as Stripe metadata so the webhook
// (stripe-webhook.js) can stamp the right flags on the results row after payment.
// ============================================================

const PRICE_ENV = {
  full: "STRIPE_PRICE_FULL",
  compatibility: "STRIPE_PRICE_COMPATIBILITY",
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json" } });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const resultId = body.result_id;
    const purchaseType = body.purchase_type;

    if (!resultId || typeof resultId !== "string") {
      return json({ error: "Missing result_id." }, 400);
    }
    if (!PRICE_ENV[purchaseType]) {
      return json({ error: "Invalid purchase_type (expected 'full' or 'compatibility')." }, 400);
    }
    if (!env.STRIPE_SECRET_KEY) {
      return json({ error: "Checkout isn't available yet — payment isn't configured." }, 503);
    }

    const priceId = env[PRICE_ENV[purchaseType]];
    if (!priceId) {
      return json({ error: `Price isn't configured for '${purchaseType}' (${PRICE_ENV[purchaseType]}).` }, 503);
    }

    // Stripe's API is form-encoded. Reference a pre-made Price by id (never an amount).
    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("line_items[0][price]", priceId);
    form.set("line_items[0][quantity]", "1");
    form.set("success_url", `https://artofsoulcraft.com/results/${resultId}?payment=success`);
    form.set("cancel_url", `https://artofsoulcraft.com/results/${resultId}?payment=cancelled`);
    form.set("client_reference_id", resultId);
    form.set("metadata[result_id]", resultId);
    form.set("metadata[purchase_type]", purchaseType);
    // Mirror the metadata onto the PaymentIntent too, so it's queryable from either object.
    form.set("payment_intent_data[metadata][result_id]", resultId);
    form.set("payment_intent_data[metadata][purchase_type]", purchaseType);
    // Create a Customer for the payment and SAVE the card off-session, so the
    // post-purchase Mira interstitial can start a trialing subscription on the
    // very same card without asking for it again (see create-subscription.js).
    // Only the $29 Full flows into Mira; Compatibility has no companion offer.
    if (purchaseType === "full") {
      form.set("customer_creation", "always");
      form.set("payment_intent_data[setup_future_usage]", "off_session");
    }

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.STRIPE_SECRET_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    const session = await res.json().catch(() => ({}));
    if (!res.ok || !session.url) {
      const detail = session && session.error && session.error.message;
      return json({ error: detail || "Stripe couldn't start checkout." }, 502);
    }

    return json({ url: session.url });
  } catch (err) {
    return json({ error: "Server error", detail: err.message }, 500);
  }
}
