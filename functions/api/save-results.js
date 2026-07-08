// ============================================================
// /functions/api/save-results.js
// ============================================================
// Called from the front end the moment someone finishes the
// assessment. Saves their result to D1. Email is OPTIONAL —
// per the confirmed design, results save and display immediately
// with zero email gate; email is offered afterward as a
// convenience ("want a link to find this again?"), never required.
//
// Cloudflare Pages Functions receive `env` with any bindings you've
// configured in the dashboard (Settings → Functions → D1 database
// bindings). This file assumes a binding named DB.
// ============================================================

function uuid() {
  // Cloudflare Workers runtime has crypto.randomUUID() built in natively —
  // no library needed.
  return crypto.randomUUID();
}

function longToken() {
  // A longer random string for magic link tokens — harder to guess than
  // a uuid alone, since this one grants access via a plain URL.
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const {
      tier,               // 'free' | 'triad' | 'full'
      mode,               // 'quick' | 'full'
      archetypeScores,    // { lover: 14, sage: 21, ... }
      temperamentScores,      // { heart: 8, mind: 30, ... }
      descriptorPicks,    // array, optional
      email,              // optional — may be null/undefined/empty
      redeemCode,         // optional — a code from the `codes` table, if this came via a partner gift
      upgradeFromId,      // optional — set when this save is an upgrade of an earlier result (Triad -> Full), not a fresh retake
    } = body;

    if (!tier || !mode || !archetypeScores || !temperamentScores) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const now = Math.floor(Date.now() / 1000);
    let userId = null;

    // --- Optional email: only touch the users table if an email was given ---
    if (email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      const existing = await env.DB
        .prepare("SELECT id FROM users WHERE email = ?")
        .bind(cleanEmail)
        .first();

      if (existing) {
        userId = existing.id;
      } else {
        userId = uuid();
        await env.DB
          .prepare("INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)")
          .bind(userId, cleanEmail, now)
          .run();
      }
    }

    // --- If a redemption code was supplied, validate it before honoring the requested tier ---
    let finalTier = tier;
    if (redeemCode) {
      const codeRow = await env.DB
        .prepare("SELECT * FROM codes WHERE code = ? AND used = 0")
        .bind(redeemCode)
        .first();

      if (!codeRow) {
        return new Response(JSON.stringify({ error: "Invalid or already-used code" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      // The code determines the tier, not the client's own claim — never
      // trust a tier value the browser sends when a code is involved.
      finalTier = codeRow.grants_tier;
    }

    // --- Save the result itself ---
    const resultId = uuid();
    await env.DB
      .prepare(
        `INSERT INTO results
         (id, user_id, tier, mode, archetype_scores, channel_scores, descriptor_picks, is_public, upgraded_from_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
      )
      .bind(
        resultId,
        userId,
        finalTier,
        mode,
        JSON.stringify(archetypeScores),
        JSON.stringify(temperamentScores),
        descriptorPicks ? JSON.stringify(descriptorPicks) : null,
        upgradeFromId || null,
        now
      )
      .run();

    // --- Mark the redemption code as used, now that we have a result to attach it to ---
    if (redeemCode) {
      await env.DB
        .prepare("UPDATE codes SET used = 1, used_by_result_id = ? WHERE code = ?")
        .bind(resultId, redeemCode)
        .run();
    }

    // --- If we have an email, generate and send a magic link ---
    let magicLinkSent = false;
    if (userId) {
      const token = longToken();
      const expiresAt = now + 60 * 60 * 24; // 24 hours from now

      await env.DB
        .prepare("INSERT INTO magic_links (token, user_id, expires_at, used) VALUES (?, ?, ?, 0)")
        .bind(token, userId, expiresAt)
        .run();

      const resultUrl = `https://artofsoulcraft.com/r/${resultId}`;
      const loginUrl = `https://artofsoulcraft.com/verify?token=${token}&result=${resultId}`;

      // Actual email sending goes here via Resend or Postmark — see the
      // Build Spec (§3) for the recommended providers. Both have a simple
      // fetch-based API; this is a placeholder call shape:
      //
      // await fetch("https://api.resend.com/emails", {
      //   method: "POST",
      //   headers: {
      //     "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     from: "The Art of Soulcraft <hello@artofsoulcraft.com>",
      //     to: [email],
      //     subject: "Your Mandala — find your way back anytime",
      //     html: `<p>Here's your link: <a href="${loginUrl}">${loginUrl}</a></p>`,
      //   }),
      // });

      magicLinkSent = true;
    }

    return new Response(
      JSON.stringify({
        resultId,
        resultUrl: `https://artofsoulcraft.com/r/${resultId}`,
        tier: finalTier,
        magicLinkSent,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error", detail: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
