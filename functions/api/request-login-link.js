// ============================================================
// /functions/api/request-login-link.js  ->  POST /api/request-login-link
// ============================================================
// Passwordless login (Batch 2). Enter an email, get a one-time login link by
// Resend; clicking it establishes a session (see login-link.js). No password is
// ever required here — it stays optional in settings.
//
//   POST { email, next }  ->  { ok: true }   (always generic — no enumeration)
//
// A brand-new email auto-creates a passwordless account, so "create a login to
// start" is a single step. We store only the SHA-256 hash of the emailed token
// (single-use, 30-minute expiry) — same discipline as sessions/password resets.
//
// Needs env.DB and env.RESEND_API_KEY.
// ============================================================

import { ensureSchema, sha256Hex } from "./_auth.js";

const TOKEN_TTL_SECONDS = 30 * 60; // 30 minutes
const ORIGIN = "https://artofsoulcraft.com";

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

// Same-origin path only ("/...", not "//..." or "http…") — prevents the login
// link from being turned into an open redirect. Falls back to the home page.
export function sanitizeNext(next) {
  if (typeof next !== "string" || !next) return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  if (next.length > 512) return "/";
  return next;
}

async function ensureLoginLinks(env) {
  try {
    await env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS login_links (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, next TEXT, expires_at INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)"
    ).run();
    await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_login_links_user ON login_links(user_id)").run();
  } catch (e) { /* already exists — expected */ }
}

function uuid() { return crypto.randomUUID(); }
function longToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ error: "Accounts aren't available yet." }, 503);
    await ensureSchema(env);
    await ensureLoginLinks(env);

    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    const next = sanitizeNext(body.next);
    if (!EMAIL_RE.test(email)) return json({ error: "Enter a valid email address." }, 400);

    // Find or create a passwordless account for this email.
    let user = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    const now = Math.floor(Date.now() / 1000);
    if (!user) {
      const id = uuid();
      await env.DB.prepare("INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)").bind(id, email, now).run();
      user = { id };
    }

    // Mint a single-use token; store only its hash.
    const token = longToken();
    const tokenHash = await sha256Hex(token);
    await env.DB
      .prepare("INSERT INTO login_links (token_hash, user_id, next, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)")
      .bind(tokenHash, user.id, next, now + TOKEN_TTL_SECONDS, now)
      .run();

    const linkUrl = `${ORIGIN}/api/login-link?t=${token}`;
    if (env.RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "The Art of Soulcraft <hello@artofsoulcraft.com>",
            to: [email],
            subject: "Your login link — The Art of Soulcraft",
            text: "Tap to log in and continue — this link works once and expires in 30 minutes:\n\n" + linkUrl + "\n\nIf you didn't request this, you can ignore it.\n\nThe Art of Soulcraft · artofsoulcraft.com",
            html:
              "<p>Tap to log in and continue — this link works once and expires in 30 minutes:</p>" +
              '<p><a href="' + linkUrl + '">Log in to The Art of Soulcraft</a></p>' +
              '<p style="color:#8a86a0;font-size:13px">If you didn\'t request this, you can ignore it.<br>The Art of Soulcraft · artofsoulcraft.com</p>',
          }),
        });
      } catch (e) { /* best-effort — still return ok so we don't leak send state */ }
    }

    // Always generic: never reveal whether the email already had an account.
    return json({ ok: true });
  } catch (err) {
    return json({ error: "Server error." }, 500);
  }
}
