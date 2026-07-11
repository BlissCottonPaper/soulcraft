// ============================================================
// /functions/api/admin/stats.js  ->  GET /api/admin/stats
// ============================================================
// Private, at-a-glance numbers for the operator. Guarded by a shared secret:
// the request MUST send header `X-Admin-Key` matching the env var ADMIN_KEY.
// A missing or wrong key returns 401 and nothing else. The key is read
// server-side only and never reaches the browser.
//
//   curl -H "X-Admin-Key: <ADMIN_KEY>" https://artofsoulcraft.com/api/admin/stats
//
// Returns JSON:
//   {
//     completedAssessments,               // all-time, real (finished) readings only
//     byTier: { free, full },             // partition of completed readings
//     shadowAddOnPurchases,               // retired $15 Shadow unlocks (historical)
//     promoCodeUses,                      // free-access redemptions (e.g. WHITEDOT)
//     assessmentsLast7Days,
//     assessmentsLast30Days,
//     emailsSaved                         // people who entered an email
//   }
//
// Definitions (kept honest, since the payment gate now runs BEFORE the
// assessment and seeds placeholder rows with empty scores):
//   • "completed" = a results row whose archetype_scores is real, i.e. not the
//     '{}' placeholder a paid/redeemed-but-unfinished gate leaves behind.
//   • byTier partitions completed rows into the two live tiers: free (tier='free')
//     and full (everything else — the $29 Full is the only paid reading).
//   • shadowAddOnPurchases counts the retired standalone $15 shadow unlock:
//     shadow_unlocked without full_purchased and without a promo redemption. Kept
//     for historical rows; it no longer grows now that Full includes the shadow.
//   • promoCodeUses counts promo_redeemed=1 across all rows (same reasoning).
//
// Needs: env.ADMIN_KEY and the D1 binding env.DB.
// ============================================================

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

// Length-safe, constant-time-ish string compare so the key can't be probed by
// timing. Returns false on any type/length mismatch.
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function onRequestGet({ request, env }) {
  // --- Auth ---------------------------------------------------------------
  const provided = request.headers.get("X-Admin-Key") || "";
  // No configured key OR a mismatch → 401. Never reveal which it was.
  if (!env.ADMIN_KEY || !safeEqual(provided, env.ADMIN_KEY)) {
    return json({ error: "Unauthorized" }, 401);
  }
  if (!env.DB) {
    return json({ error: "Database not configured" }, 500);
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const since7 = now - 60 * 60 * 24 * 7;
    const since30 = now - 60 * 60 * 24 * 30;

    // A row counts as a finished reading only when its scores aren't the '{}'
    // placeholder seeded by the pre-assessment payment gate.
    const DONE = "(archetype_scores <> '{}' AND archetype_scores <> '')";

    const row = await env.DB
      .prepare(
        `SELECT
           SUM(CASE WHEN ${DONE} THEN 1 ELSE 0 END)                                          AS completed,
           SUM(CASE WHEN ${DONE} AND tier = 'free' THEN 1 ELSE 0 END)                        AS tier_free,
           SUM(CASE WHEN ${DONE} AND tier <> 'free' THEN 1 ELSE 0 END)                       AS tier_full,
           SUM(CASE WHEN shadow_unlocked = 1 AND full_purchased = 0 AND promo_redeemed = 0 THEN 1 ELSE 0 END) AS shadow_addon,
           SUM(CASE WHEN promo_redeemed = 1 THEN 1 ELSE 0 END)                               AS promo_uses,
           SUM(CASE WHEN ${DONE} AND created_at >= ?1 THEN 1 ELSE 0 END)                     AS last7,
           SUM(CASE WHEN ${DONE} AND created_at >= ?2 THEN 1 ELSE 0 END)                     AS last30
         FROM results`
      )
      .bind(since7, since30)
      .first();

    const emailsRow = await env.DB.prepare("SELECT COUNT(*) AS n FROM users").first();

    const n = (v) => Number(v || 0);

    return json({
      completedAssessments: n(row && row.completed),
      byTier: {
        free: n(row && row.tier_free),
        full: n(row && row.tier_full),
      },
      shadowAddOnPurchases: n(row && row.shadow_addon),
      promoCodeUses: n(row && row.promo_uses),
      assessmentsLast7Days: n(row && row.last7),
      assessmentsLast30Days: n(row && row.last30),
      emailsSaved: n(emailsRow && emailsRow.n),
      generatedAt: now,
    });
  } catch (err) {
    return json({ error: "Server error", detail: err.message }, 500);
  }
}
