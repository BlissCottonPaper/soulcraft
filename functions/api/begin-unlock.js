// ============================================================
// /functions/api/begin-unlock.js
// ============================================================
// The unlock behind the /begin landing page (the Bliss insert card).
//
// A physical card ships in Bliss Cotton Paper orders. It carries a QR code and
// a printed URL, both landing on /begin. The URL IS the credential: arriving
// grants the complete reading for free. There is no code field on the page —
// this endpoint applies the grant automatically on the visitor's behalf, using
// the SAME promo-code mechanism as WHITEDOT / IGLAUNCH so the result row is
// stamped identically (full_purchased = 1, shadow_unlocked = 1,
// promo_redeemed = 1) and admin stats count it as a free promo redemption.
//
//   POST { result_id, source? }
//   -> { ok: true,  full_purchased: true, shadow_unlocked: true }   grant applied
//   -> { ok: false, error: "…" }                                     grant unavailable
//
// The code name is held HERE, server-side — never sent to or from the client,
// never surfaced in the UI. It defaults to BLISSCARD and can be overridden with
// env.BEGIN_PROMO_CODE. Like WHITEDOT, it must be present in the comma-separated
// env.PROMO_CODES allow-list for the grant to apply — that single env var is the
// on/off lever (see the PR notes: BLISSCARD must be added to PROMO_CODES).
//
// `source` is the QR's ?c= campaign tag (e.g. "bliss-q3-2026"). It's logged
// best-effort onto results.campaign for attribution and NEVER gates the unlock:
// a bare /begin (no ?c=) still grants.
//
// Needs: env.PROMO_CODES and the D1 binding env.DB. (env.BEGIN_PROMO_CODE optional.)
// ============================================================

const UNAVAILABLE_MSG = "Free access isn't available right now — please try again in a moment.";

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json" } });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const resultId = body.result_id;
    // Campaign tag from the QR (?c=). Optional, bounded, and sanitized so a
    // hand-typed or hostile value can't bloat the row. null when absent.
    let source = typeof body.source === "string" ? body.source.trim().slice(0, 64) : "";
    if (!/^[\w.\-:]+$/.test(source)) source = ""; // keep it a clean slug or nothing

    if (!resultId || typeof resultId !== "string") {
      return json({ ok: false, error: "Missing result_id." }, 400);
    }

    // The grant runs through the existing promo allow-list: the begin code must be
    // configured in PROMO_CODES, exactly like WHITEDOT. Held server-side only.
    const beginCode = (env.BEGIN_PROMO_CODE || "BLISSCARD").trim().toLowerCase();
    const valid = (env.PROMO_CODES || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (!beginCode || !valid.includes(beginCode)) {
      // Not configured yet (BLISSCARD absent from PROMO_CODES). Answer ok:false so
      // the page can proceed gracefully rather than dead-end — the assessment still
      // opens; only the persisted paid flags are missing until the env is set.
      return json({ ok: false, error: UNAVAILABLE_MSG }, 200);
    }

    if (!env.DB) {
      return json({ ok: false, error: UNAVAILABLE_MSG }, 500);
    }

    // Same grant a completed Full purchase gives, plus promo_redeemed=1 — identical
    // to redeem-promo. UPSERT because the gate runs BEFORE the assessment: no scores
    // exist yet, so we seed a placeholder row (empty scores) that save-results later
    // fills in, and never clobber real data if the row already exists.
    const now = Math.floor(Date.now() / 1000);
    await env.DB
      .prepare(
        `INSERT INTO results
           (id, tier, mode, archetype_scores, channel_scores, is_public, full_purchased, shadow_unlocked, promo_redeemed, created_at)
         VALUES (?, 'full', 'quick', '{}', '{}', 0, 1, 1, 1, ?)
         ON CONFLICT(id) DO UPDATE SET
           full_purchased = 1, shadow_unlocked = 1, promo_redeemed = 1`
      )
      .bind(resultId, now)
      .run();

    // Attribution, best-effort: stamp the campaign tag onto the row. Wrapped so a
    // not-yet-migrated database (no `campaign` column) can never fail the unlock —
    // the grant above is what matters; the tag is only for reporting. Only fill it
    // when empty so a later save can't wipe an earlier campaign.
    if (source) {
      try {
        await env.DB
          .prepare("UPDATE results SET campaign = ? WHERE id = ? AND (campaign IS NULL OR campaign = '')")
          .bind(source, resultId)
          .run();
      } catch (e) { /* column may not exist yet — ignore */ }
    }

    return json({ ok: true, full_purchased: true, shadow_unlocked: true });
  } catch (err) {
    return json({ ok: false, error: "Server error", detail: err.message }, 500);
  }
}
