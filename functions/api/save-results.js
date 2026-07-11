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

import { buildReportEmail } from "./_report-email.js";
import { svgToPngDataUri } from "./_svg-png.js";

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

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json" } });
}

export async function onRequestPost({ request, env, waitUntil }) {
  try {
    const body = await request.json();
    const {
      tier,               // 'free' | 'full'
      mode,               // 'quick' | 'full'
      archetypeScores,    // { lover: 14, sage: 21, ... }
      temperamentScores,      // { heart: 8, mind: 30, ... }
      descriptorPicks,    // array, optional
      email,              // optional — may be null/undefined/empty
      redeemCode,         // optional — a code from the `codes` table, if this came via a partner gift
      upgradeFromId,      // optional — set when this save is an upgrade of an earlier result, not a fresh retake
      claimResultId,      // optional — set to attach an email to an already-saved (anonymous) result
      report,             // optional — computed reading content for the emailed report (Email 2)
    } = body;

    const now = Math.floor(Date.now() / 1000);
    let userId = null;

    // --- Optional email: resolve/create the user (needed for a claim AND the magic link) ---
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

    let resultId;
    let finalTier = tier;

    if (claimResultId) {
      // ── CLAIM path ─────────────────────────────────────────────────────────
      // The front end saves anonymously (user_id = NULL) the moment results
      // display, then offers "email me a link back." Claiming ATTACHES that
      // existing row to the user instead of writing a second, duplicate row —
      // so a saved reading is one row, retrievable, with no orphaned copies.
      if (!userId) return json({ error: "An email is required to save your results." }, 400);
      const row = await env.DB
        .prepare("SELECT id, tier FROM results WHERE id = ?")
        .bind(claimResultId)
        .first();
      if (!row) return json({ error: "That result no longer exists — please retake the assessment." }, 404);
      finalTier = row.tier;
      // Only claim an UNCLAIMED row (or one already this user's) — never reassign
      // a result that belongs to someone else.
      await env.DB
        .prepare("UPDATE results SET user_id = ? WHERE id = ? AND (user_id IS NULL OR user_id = ?)")
        .bind(userId, claimResultId, userId)
        .run();
      resultId = claimResultId;
    } else {
      // ── FRESH SAVE path ────────────────────────────────────────────────────
      if (!tier || !mode || !archetypeScores || !temperamentScores) {
        return json({ error: "Missing required fields" }, 400);
      }

      // If a redemption code was supplied, validate it before honoring the tier.
      if (redeemCode) {
        const codeRow = await env.DB
          .prepare("SELECT * FROM codes WHERE code = ? AND used = 0")
          .bind(redeemCode)
          .first();
        if (!codeRow) return json({ error: "Invalid or already-used code" }, 400);
        // The code determines the tier, not the client's own claim.
        finalTier = codeRow.grants_tier;
      }

      // With the payment gate now BEFORE the assessment (Task 1), paid tiers
      // pre-generate the result id at the gate and the webhook/promo materialize a
      // placeholder row (empty scores + paid flags) before the questions are even
      // answered. So honor a client-supplied resultId and UPSERT the scores onto
      // that row — never clobbering the paid flags (full_purchased / shadow_unlocked
      // / promo_redeemed, which this statement doesn't touch). A free tier sends no
      // resultId, so we mint one and this is a plain insert.
      const providedId = typeof body.resultId === "string" && body.resultId ? body.resultId : null;
      resultId = providedId || uuid();
      await env.DB
        .prepare(
          `INSERT INTO results
           (id, user_id, tier, mode, archetype_scores, channel_scores, descriptor_picks, is_public, upgraded_from_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             user_id = COALESCE(excluded.user_id, results.user_id),
             tier = excluded.tier,
             mode = excluded.mode,
             archetype_scores = excluded.archetype_scores,
             channel_scores = excluded.channel_scores,
             descriptor_picks = excluded.descriptor_picks,
             upgraded_from_id = COALESCE(excluded.upgraded_from_id, results.upgraded_from_id)`
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

      // Mark the redemption code used, now that a result exists to attach it to.
      if (redeemCode) {
        await env.DB
          .prepare("UPDATE codes SET used = 1, used_by_result_id = ? WHERE code = ?")
          .bind(resultId, redeemCode)
          .run();
      }
    }

    // --- If we have an email, generate and send a magic link ---
    let magicLinkSent = false;
    if (userId && email && email.trim()) {
      const token = longToken();
      // Tokens NEVER expire — a result saved years ago must still open. We store a
      // far-future expiry so the existing expiry checks (verify-link/my-results) pass.
      const expiresAt = now + 60 * 60 * 24 * 365 * 100; // ~100 years

      await env.DB
        .prepare("INSERT INTO magic_links (token, user_id, expires_at, used) VALUES (?, ?, ?, 0)")
        .bind(token, userId, expiresAt)
        .run();

      // The token maps to the USER, so this one link opens all of their saved
      // results (the /results page shows a picker when there is more than one).
      const linkUrl = `https://artofsoulcraft.com/results?token=${token}`;

      if (env.RESEND_API_KEY) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "The Art of Soulcraft <hello@artofsoulcraft.com>",
              to: [email.trim()],
              subject: "Your Art of Soulcraft results",
              text: "Here's your link back to Your Mandala — it doesn't expire, so keep it anywhere:\n\n" + linkUrl + "\n\nThe Art of Soulcraft · artofsoulcraft.com",
              html: "<p>Here's your link back to Your Mandala — it doesn't expire, so keep it anywhere:</p>" +
                    "<p><a href=\"" + linkUrl + "\">" + linkUrl + "</a></p>" +
                    "<p style=\"color:#8a86a0;font-size:13px\">The Art of Soulcraft · artofsoulcraft.com</p>",
            }),
          });
          magicLinkSent = emailRes.ok;
        } catch (e) {
          magicLinkSent = false;
        }

        // --- Email 2: the full report (Task 2) ---
        // Sent alongside the magic link whenever the client supplies the computed
        // reading. Delivered as a clean, self-contained HTML email with the Mandala
        // (and, for Full, the Shadow Mandala) rasterized server-side to inline PNGs.
        //
        // Rendering the SVGs to PNG (resvg-wasm) is CPU-heavy, so the whole Email-2
        // job runs in the BACKGROUND via waitUntil: it can never delay the response
        // to the client, and if it exceeds limits it just doesn't send — the primary
        // save + magic link already succeeded.
        if (report && typeof report === "object") {
          const toAddr = email.trim();
          const apiKey = env.RESEND_API_KEY;
          const job = (async () => {
            try {
              // Rasterize the client-serialized Mandala SVGs to inline PNG data URIs.
              const [mandala, shadow] = await Promise.all([
                svgToPngDataUri(report.mandalaSvg, 640),
                report.shadowMandalaSvg ? svgToPngDataUri(report.shadowMandalaSvg, 640) : Promise.resolve(null),
              ]);
              const { subject, html, text } = buildReportEmail(report, toAddr, { mandala, shadow });
              await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  from: "The Art of Soulcraft <hello@artofsoulcraft.com>",
                  to: [toAddr],
                  subject,
                  html,
                  text,
                }),
              });
            } catch (e) {
              // best-effort — swallow so nothing is surfaced to the client
            }
          })();
          if (typeof waitUntil === "function") waitUntil(job); else await job;
        }
      }
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
