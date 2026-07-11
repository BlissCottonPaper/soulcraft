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

  // We only act on a completed checkout. Everything else is acknowledged and ignored.
  if (event.type === "checkout.session.completed") {
    const session = (event.data && event.data.object) || {};
    const meta = session.metadata || {};
    const resultId = meta.result_id;
    const purchaseType = meta.purchase_type;

    if (resultId && env.DB) {
      try {
        // UPSERT, not UPDATE: the payment gate now runs BEFORE the assessment, so
        // a paid result_id can arrive here before save-results has written any
        // scores. We seed a placeholder row (empty scores) the assessment later
        // fills in, and never clobber real data when the row already exists.
        const now = Math.floor(Date.now() / 1000);
        if (purchaseType === "full") {
          // Capture the Stripe customer id created for this payment (customer_creation
          // = always). The post-purchase Mira interstitial reuses it — and the saved
          // card — to open a trialing subscription (create-subscription.js).
          const customerId = typeof session.customer === "string" ? session.customer : (session.customer && session.customer.id) || null;
          await env.DB.prepare(
            `INSERT INTO results
               (id, tier, mode, archetype_scores, channel_scores, is_public, full_purchased, shadow_unlocked, stripe_customer_id, created_at)
             VALUES (?, 'full', 'quick', '{}', '{}', 0, 1, 1, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               full_purchased = 1,
               shadow_unlocked = 1,
               stripe_customer_id = COALESCE(excluded.stripe_customer_id, results.stripe_customer_id)`
          ).bind(resultId, customerId, now).run();
        }
        // 'compatibility' (invite flow TBD) intentionally sets no flags here.
      } catch (e) {
        // Log-and-500 so Stripe retries the webhook rather than dropping the payment.
        return new Response(JSON.stringify({ error: "Database update failed", detail: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
