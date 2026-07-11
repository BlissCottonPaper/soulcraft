// ============================================================
// /functions/api/create-subscription.js  ->  POST /api/create-subscription
// ============================================================
// The post-purchase Mira flow (Task 4). After the $29 Full payment, the
// interstitial offers a Mira subscription that starts with a 30-day FREE
// trial and reuses the card already on file from that $29 payment.
//
//   POST { result_id, tier }   tier ∈ 'monthly' | 'quarterly' | 'yearly'
//   -> { ok: true, tier }
//
// How the card is reused: create-checkout runs the $29 payment with a Stripe
// Customer attached and setup_future_usage=off_session, so the card is saved
// to that customer. The webhook stamps the customer id onto the results row.
// Here we look up that customer, take their saved card, and open a trialing
// subscription against it — no second card entry.
//
// Companion state (companion_active / companion_tier / subscription_id) is
// written to the results row now (an account may not exist yet at the
// interstitial) AND to the linked user if there is one; save-results/login
// propagate it onto the account the moment the result is linked.
//
// Needs: STRIPE_SECRET_KEY, STRIPE_PRICE_MIRA_{MONTHLY,QUARTERLY,YEARLY}, env.DB.
// ============================================================

import { getSessionUser } from "./_auth.js";

const PRICE_ENV = {
  monthly: "STRIPE_PRICE_MIRA_MONTHLY",
  quarterly: "STRIPE_PRICE_MIRA_QUARTERLY",
  yearly: "STRIPE_PRICE_MIRA_YEARLY",
};
const TRIAL_DAYS = 30;

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json" } });
}

async function stripe(env, pathname, form) {
  const res = await fetch("https://api.stripe.com/v1/" + pathname, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + env.STRIPE_SECRET_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const resultId = body.result_id;
    const tier = body.tier;

    if (!resultId || typeof resultId !== "string") return json({ error: "Missing result_id." }, 400);
    if (!PRICE_ENV[tier]) return json({ error: "Invalid tier (expected monthly, quarterly or yearly)." }, 400);
    if (!env.STRIPE_SECRET_KEY) return json({ error: "Subscriptions aren't configured yet." }, 503);
    const priceId = env[PRICE_ENV[tier]];
    if (!priceId) return json({ error: `Price isn't configured for '${tier}' (${PRICE_ENV[tier]}).` }, 503);
    if (!env.DB) return json({ error: "Database isn't configured." }, 500);

    // The Stripe customer that paid the $29 (webhook stamped it on the row).
    const row = await env.DB
      .prepare("SELECT id, user_id, stripe_customer_id, subscription_id FROM results WHERE id = ?")
      .bind(resultId)
      .first();
    if (!row) return json({ error: "That result no longer exists." }, 404);
    if (row.subscription_id) {
      // Idempotent: already subscribed (e.g. a double-click) — treat as success.
      return json({ ok: true, tier: tier, already: true });
    }
    const customerId = row.stripe_customer_id;
    if (!customerId) {
      return json({ error: "We couldn't find the card from your purchase. You can activate Mira from your account instead." }, 409);
    }

    // Use the card saved on the customer from the $29 payment. Pick the most
    // recently attached card so a returning customer uses the card they just paid with.
    const pmRes = await fetch(
      "https://api.stripe.com/v1/customers/" + encodeURIComponent(customerId) + "/payment_methods?type=card&limit=1",
      { headers: { "Authorization": "Bearer " + env.STRIPE_SECRET_KEY } }
    );
    const pmData = await pmRes.json().catch(() => ({}));
    const pm = pmData && pmData.data && pmData.data[0] && pmData.data[0].id;

    const form = new URLSearchParams();
    form.set("customer", customerId);
    form.set("items[0][price]", priceId);
    form.set("trial_period_days", String(TRIAL_DAYS));
    // If the trial ends with no valid payment method, pause rather than cancel,
    // so the reminder-before-trial-end email has something to act on.
    form.set("trial_settings[end_behavior][missing_payment_method]", "pause");
    form.set("metadata[result_id]", resultId);
    form.set("metadata[mira_tier]", tier);
    if (pm) form.set("default_payment_method", pm);

    const { ok, data } = await stripe(env, "subscriptions", form);
    if (!ok || !data.id) {
      const detail = data && data.error && data.error.message;
      return json({ error: detail || "Couldn't start the subscription." }, 502);
    }

    const subscriptionId = data.id;
    const now = Math.floor(Date.now() / 1000);

    // Stamp the result row so the decision survives even before an account exists.
    await env.DB
      .prepare("UPDATE results SET companion_active = 1, companion_tier = ?, subscription_id = ? WHERE id = ?")
      .bind(tier, subscriptionId, resultId)
      .run();

    // Propagate onto an account if one is already linked (result.user_id) or the
    // caller is logged in.
    let targetUserId = row.user_id || null;
    if (!targetUserId) {
      const sessionUser = await getSessionUser(request, env);
      if (sessionUser) targetUserId = sessionUser.id;
    }
    if (targetUserId) {
      await env.DB
        .prepare(
          "UPDATE users SET companion_active = 1, companion_tier = ?, subscription_id = ?, stripe_customer_id = COALESCE(stripe_customer_id, ?) WHERE id = ?"
        )
        .bind(tier, subscriptionId, customerId, targetUserId)
        .run();
    }

    return json({ ok: true, tier: tier });
  } catch (err) {
    return json({ error: "Server error", detail: err.message }, 500);
  }
}
