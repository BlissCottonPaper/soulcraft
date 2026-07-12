// ============================================================
// /functions/api/mira-subscribe.js  ->  POST /api/mira-subscribe
// ============================================================
// The subscription gate: start a Stripe hosted Checkout in SUBSCRIPTION mode for
// one of the three Mira tiers, and hand the browser back a { url }. On completion
// the webhook (stripe-webhook.js) sets companion_active = 1.
//
//   POST { tier }   tier ∈ 'monthly' | 'quarterly' | 'yearly'
//   -> { url }
//
// Needs: STRIPE_SECRET_KEY, STRIPE_PRICE_MIRA_{MONTHLY,QUARTERLY,YEARLY}, env.DB.
// ============================================================

import { getSessionUser } from "./_auth.js";

const PRICE_ENV = {
  monthly: "STRIPE_PRICE_MIRA_MONTHLY",
  quarterly: "STRIPE_PRICE_MIRA_QUARTERLY",
  yearly: "STRIPE_PRICE_MIRA_YEARLY",
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json" } });
}

export async function onRequestPost({ request, env }) {
  try {
    const user = await getSessionUser(request, env);
    if (!user) return json({ error: "Please log in first." }, 401);

    const body = await request.json().catch(() => ({}));
    const tier = body.tier;
    if (!PRICE_ENV[tier]) return json({ error: "Invalid tier." }, 400);
    if (!env.STRIPE_SECRET_KEY) return json({ error: "Checkout isn't configured yet." }, 503);
    const priceId = env[PRICE_ENV[tier]];
    if (!priceId) return json({ error: `Price isn't configured for '${tier}'.` }, 503);

    const form = new URLSearchParams();
    form.set("mode", "subscription");
    form.set("line_items[0][price]", priceId);
    form.set("line_items[0][quantity]", "1");
    form.set("success_url", "https://artofsoulcraft.com/companion/?sub=success");
    form.set("cancel_url", "https://artofsoulcraft.com/companion/?sub=cancelled");
    form.set("client_reference_id", user.id);
    form.set("metadata[user_id]", user.id);
    form.set("metadata[mira_tier]", tier);
    form.set("metadata[purchase_type]", "mira");
    // Carry the same metadata onto the Subscription object so the
    // customer.subscription.* webhooks can resolve the user too.
    form.set("subscription_data[metadata][user_id]", user.id);
    form.set("subscription_data[metadata][mira_tier]", tier);
    // Reuse an existing customer if we have one; otherwise let Stripe make one
    // keyed to their email.
    if (user.stripe_customer_id) form.set("customer", user.stripe_customer_id);
    else if (user.email) form.set("customer_email", user.email);

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
    return json({ error: "Server error", detail: err && err.message }, 500);
  }
}
