// ============================================================
// /functions/api/create-portal.js  ->  POST /api/create-portal
// ============================================================
// "Manage subscription" on the account page. Opens a Stripe Billing Portal
// session for the logged-in user's Stripe customer and hands back { url }.
// The customer id comes from the session (users.stripe_customer_id) — never
// from the client — so one user can't open another's billing portal.
//
//   POST  ->  { url }
//
// Needs: STRIPE_SECRET_KEY and the D1 binding env.DB.
// ============================================================

import { getSessionUser } from "./_auth.js";

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json" } });
}

export async function onRequestPost({ request, env }) {
  try {
    const user = await getSessionUser(request, env);
    if (!user) return json({ error: "Please log in first." }, 401);
    if (!env.STRIPE_SECRET_KEY) return json({ error: "Billing isn't configured yet." }, 503);
    if (!user.stripe_customer_id) {
      return json({ error: "There's no subscription to manage yet." }, 400);
    }

    const form = new URLSearchParams();
    form.set("customer", user.stripe_customer_id);
    form.set("return_url", "https://artofsoulcraft.com/account/");

    const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
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
      return json({ error: detail || "Couldn't open the billing portal." }, 502);
    }
    return json({ url: session.url });
  } catch (err) {
    return json({ error: "Server error", detail: err.message }, 500);
  }
}
