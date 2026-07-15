// ============================================================
// /functions/api/request-password-reset.js  ->  POST /api/request-password-reset
// ============================================================
// Step 1 of "forgot password": someone enters their email; if an account with
// a password exists, we email them a single-use reset link. We ALWAYS return
// the same { ok: true } whether or not the email is on file — a password reset
// must not reveal who has an account (unlike the low-stakes results-link flow,
// which deliberately does). The emailed token is random; only its SHA-256 hash
// is stored.
//
//   POST { email }  ->  { ok: true }
//
// Needs the D1 binding env.DB and, to actually send, RESEND_API_KEY.
// ============================================================

import { ensureSchema, sha256Hex } from "./_auth.js";
import { sanitizeNext } from "./request-login-link.js";

const RESET_TTL_SECONDS = 60 * 60; // 1 hour

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
function rawToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ error: "Accounts aren't available yet." }, 503);
    await ensureSchema(env);

    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    // A malformed address is the one thing we correct — it can't belong to anyone.
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: "Please enter a valid email address." }, 400);
    }

    const user = await env.DB
      .prepare("SELECT id, password_hash FROM users WHERE email = ?")
      .bind(email)
      .first();

    // Only send for a real account that actually has a password to reset. In
    // every case the response is identical, so this never reveals who's on file.
    if (user && user.password_hash) {
      const now = Math.floor(Date.now() / 1000);
      // Retire any earlier outstanding tokens for this user, then mint one.
      try { await env.DB.prepare("DELETE FROM password_resets WHERE user_id = ?").bind(user.id).run(); } catch (e) {}
      const token = rawToken();
      const tokenHash = await sha256Hex(token);
      await env.DB
        .prepare("INSERT INTO password_resets (token_hash, user_id, expires_at, used, created_at) VALUES (?, ?, ?, 0, ?)")
        .bind(tokenHash, user.id, now + RESET_TTL_SECONDS, now)
        .run();

      const nextParam = sanitizeNext(body.next);
      const linkUrl = "https://artofsoulcraft.com/reset-password/?token=" + token +
        (nextParam && nextParam !== "/" ? "&next=" + encodeURIComponent(nextParam) : "");
      if (env.RESEND_API_KEY) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "The Art of Soulcraft <hello@artofsoulcraft.com>",
              to: [email],
              subject: "Reset your Art of Soulcraft password",
              text: "Someone (hopefully you) asked to reset your Art of Soulcraft password. " +
                "Open this link within the next hour to choose a new one:\n\n" + linkUrl +
                "\n\nIf you didn't request this, you can safely ignore this email — your password won't change.\n\n" +
                "The Art of Soulcraft · artofsoulcraft.com",
              html: "<p>Someone (hopefully you) asked to reset your Art of Soulcraft password. " +
                "Open this link within the next hour to choose a new one:</p>" +
                "<p><a href=\"" + linkUrl + "\">" + linkUrl + "</a></p>" +
                "<p>If you didn't request this, you can safely ignore this email — your password won't change.</p>" +
                "<p style=\"color:#8a86a0;font-size:13px\">The Art of Soulcraft · artofsoulcraft.com</p>",
            }),
          });
        } catch (e) { /* swallow — response stays uniform */ }
      }
    }

    // Uniform response — never disclose whether the account exists.
    return json({ ok: true });
  } catch (err) {
    console.error("request-password-reset failed:", err && (err.stack || err.message));
    return json({ error: "Server error", detail: err && err.message }, 500);
  }
}
