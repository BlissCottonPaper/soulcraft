// ============================================================
// /functions/api/create-checkout.js
// ============================================================
// Creates a Stripe *hosted* Checkout session (redirect flow) for one of the
// three one-time purchases and hands the browser back a { url } to send the
// visitor to. No Stripe keys or price IDs ever reach the client — everything
// lives in Cloudflare Pages env vars and this function talks to Stripe.
//
//   purchase_type  price env var          what it buys
//   ------------   -------------------     -------------------------------------
//   mandala        STRIPE_PRICE_MANDALA    Your Mandala — $19
//   shadow         STRIPE_PRICE_SHADOW     Shadow Mandala add-on — $15
//   full           STRIPE_PRICE_FULL       Full (both mandalas) upfront — $34
//
// result_id and purchase_type ride along as Stripe metadata so the webhook
// (stripe-webhook.js) can stamp the right flags on the results row after payment.
// ============================================================

const PRICE_ENV = {
  mandala: "STRIPE_PRICE_MANDALA",
  shadow: "STRIPE_PRICE_SHADOW",
  full: "STRIPE_PRICE_FULL",
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
      return json({ error: "Invalid purchase_type (expected 'mandala', 'shadow', or 'full')." }, 400);
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
