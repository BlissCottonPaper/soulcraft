// ============================================================
// /functions/api/stripe-webhook.js
// ============================================================
// The authoritative source of "has this been paid for." Stripe POSTs here after
// a Checkout session completes; we verify the signature with STRIPE_WEBHOOK_SECRET
// (so no one can forge a payment) and then stamp the results row.
//
// Register this endpoint in the Stripe dashboard:
//   https://artofsoulcraft.com/api/stripe-webhook   (event: checkout.session.completed)
//
// Mapping:
//   purchase_type 'full'          -> full_purchased = 1 AND shadow_unlocked = 1
//                                    (the $29 Full is the only paid reading; it
//                                    includes the Shadow Mandala)
//   purchase_type 'compatibility' -> no D1 flag change yet (product wired; the
//                                    Compatibility invite flow isn't built)
//
// Needs: STRIPE_WEBHOOK_SECRET, and the D1 binding env.DB.
// ============================================================

const enc = new TextEncoder();

// Constant-time-ish compare of two hex strings.
function safeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Verify Stripe's `Stripe-Signature` header against the raw request body.
// Header shape: "t=<unix>,v1=<hex>[,v1=<hex>...]". We recompute HMAC-SHA256 over
// "<t>.<rawBody>" with the webhook secret and match any provided v1.
async function verifyStripeSignature(rawBody, sigHeader, secret, toleranceSeconds) {
  if (!sigHeader) return false;
  const items = sigHeader.split(",").map((p) => p.split("="));
  const t = items.find((i) => i[0] === "t") && items.find((i) => i[0] === "t")[1];
  const sigs = items.filter((i) => i[0] === "v1").map((i) => i[1]);
  if (!t || sigs.length === 0) return false;

  // Reject stale/replayed timestamps (default 5-minute tolerance).
  const tol = toleranceSeconds || 300;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - parseInt(t, 10)) > tol) return false;

  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${rawBody}`));
  const expected = Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, "0")).join("");
  return sigs.some((s) => safeEqualHex(s, expected));
}

export async function onRequestPost({ request, env }) {
  // Read the RAW body (signature is computed over the exact bytes Stripe sent).
  const rawBody = await request.text();
  const sigHeader = request.headers.get("stripe-signature");

  if (!env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  let valid = false;
  try {
    valid = await verifyStripeSignature(rawBody, sigHeader, env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    valid = false;
  }
  if (!valid) {
    return new Response(JSON.stringify({ error: "Signature verification failed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await handleEvent(event, env);
  } catch (e) {
    // Log-and-500 so Stripe retries rather than dropping the event.
    return new Response(JSON.stringify({ error: "Handler failed", detail: e && e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 200 for everything (including unhandled event types) so Stripe doesn't retry-spam.
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

const idOf = (v) => (typeof v === "string" ? v : (v && v.id) || null);

// Resolve the internal user id for a subscription: prefer the metadata we set at
// checkout, then fall back to a stored subscription_id, then the Stripe customer.
async function resolveUserId(env, sub) {
  if (!env.DB || !sub) return null;
  const metaUid = sub.metadata && sub.metadata.user_id;
  if (metaUid) return metaUid;
  const subId = idOf(sub);
  if (subId) {
    const r = await env.DB.prepare("SELECT id FROM users WHERE subscription_id = ?").bind(subId).first();
    if (r) return r.id;
  }
  const custId = idOf(sub.customer);
  if (custId) {
    const r = await env.DB.prepare("SELECT id FROM users WHERE stripe_customer_id = ?").bind(custId).first();
    if (r) return r.id;
  }
  return null;
}

async function setCompanion(env, userId, active, tier, subId, custId) {
  await env.DB.prepare(
    `UPDATE users SET
       companion_active = ?,
       companion_tier = COALESCE(?, companion_tier),
       subscription_id = COALESCE(?, subscription_id),
       stripe_customer_id = COALESCE(?, stripe_customer_id)
     WHERE id = ?`
  ).bind(active ? 1 : 0, tier || null, subId || null, custId || null, userId).run();
}

async function handleEvent(event, env) {
  if (!env.DB) return;
  const obj = (event.data && event.data.object) || {};

  switch (event.type) {
    case "checkout.session.completed": {
      const meta = obj.metadata || {};
      // Mira subscription checkout → activate the companion on the user.
      if (meta.purchase_type === "mira" || obj.mode === "subscription") {
        const userId = meta.user_id || obj.client_reference_id;
        if (userId) {
          await setCompanion(env, userId, true, meta.mira_tier || null, idOf(obj.subscription), idOf(obj.customer));
        }
        return;
      }
      // The $29 Full reading (one-time). UPSERT: the gate runs before the
      // assessment, so this can arrive before scores exist. Capture the customer
      // (customer_creation=always) so the post-purchase Mira trial can reuse the card.
      const resultId = meta.result_id;
      if (resultId && meta.purchase_type === "full") {
        const now = Math.floor(Date.now() / 1000);
        await env.DB.prepare(
          `INSERT INTO results
             (id, tier, mode, archetype_scores, channel_scores, is_public, full_purchased, shadow_unlocked, stripe_customer_id, created_at)
           VALUES (?, 'full', 'quick', '{}', '{}', 0, 1, 1, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             full_purchased = 1,
             shadow_unlocked = 1,
             stripe_customer_id = COALESCE(excluded.stripe_customer_id, results.stripe_customer_id)`
        ).bind(resultId, idOf(obj.customer), now).run();
      }
      // 'compatibility' (invite flow TBD) sets no flags.
      return;
    }

    case "customer.subscription.updated": {
      const userId = await resolveUserId(env, obj);
      if (!userId) return;
      const status = obj.status;
      const tier = (obj.metadata && obj.metadata.mira_tier) || null;
      if (status === "active" || status === "trialing") {
        await setCompanion(env, userId, true, tier, idOf(obj), idOf(obj.customer));
      } else if (status === "canceled" || status === "unpaid") {
        await setCompanion(env, userId, false, tier, idOf(obj), idOf(obj.customer));
      } else if (status === "past_due") {
        // Grace period: keep access on, just log (pause policy — never delete data).
        console.log("mira subscription past_due for user", userId, "sub", idOf(obj));
      }
      return;
    }

    case "customer.subscription.deleted": {
      // Cancellation → pause access. NEVER delete the person's data.
      const userId = await resolveUserId(env, obj);
      if (userId) await setCompanion(env, userId, false, null, idOf(obj), idOf(obj.customer));
      return;
    }

    case "invoice.payment_failed": {
      // Informational — the matching subscription.updated (past_due/unpaid) drives
      // the access decision. Log so a failing renewal is visible.
      console.log("mira invoice.payment_failed customer", idOf(obj.customer), "sub", idOf(obj.subscription));
      return;
    }

    default:
      return; // acknowledged and ignored
  }
}
