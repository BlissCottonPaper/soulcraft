// ============================================================
// /functions/api/register.js  ->  POST /api/register
// ============================================================
// Create a password account and log the person straight in.
//
//   POST { email, password, display_name?, research_consent? }
//        ->  { ok: true }  (+ Set-Cookie session)
//
// The `users` table already existed as an email-only record (magic-link
// retrieval). Registration UPGRADES that same row in place: if an email
// row exists WITHOUT a password we set one (so the reading history they
// already have stays attached); if it already HAS a password we refuse and
// point them at login. Either way, any results previously linked to that
// user_id remain linked — accounts and results share the user id.
//
// Needs the D1 binding env.DB.
// ============================================================

import { hashPassword, createSession, sessionCookie, ensureSchema } from "./_auth.js";

function json(obj, status, extraHeaders) {
  const headers = { "Content-Type": "application/json" };
  if (extraHeaders) Object.assign(headers, extraHeaders);
  return new Response(JSON.stringify(obj), { status: status || 200, headers });
}

function uuid() { return crypto.randomUUID(); }

// A chosen display name: control chars dropped, whitespace collapsed, trimmed,
// capped at 40 chars. Empty/whitespace → null (nothing to store).
function cleanDisplayName(v) {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
  return s || null;
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ error: "Accounts aren't available yet." }, 503);
    // Make sure the accounts schema exists (self-heals if migration 0002 wasn't run).
    await ensureSchema(env);
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    const displayName = cleanDisplayName(body.display_name);
    const researchConsent = body.research_consent ? 1 : 0;

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: "Please enter a valid email address." }, 400);
    }
    if (password.length < 8) {
      return json({ error: "Please choose a password of at least 8 characters." }, 400);
    }

    const now = Math.floor(Date.now() / 1000);
    const existing = await env.DB
      .prepare("SELECT id, password_hash FROM users WHERE email = ?")
      .bind(email)
      .first();

    let userId;
    const passwordHash = await hashPassword(password);

    if (existing) {
      if (existing.password_hash) {
        // Already a real account — don't silently overwrite the password.
        return json({ error: "An account with that email already exists. Please log in instead." }, 409);
      }
      // Email-only row (from a prior magic-link save) → claim it as an account,
      // keeping every result already attached to this user_id. A display name is
      // set only if provided (never clobber an existing one with a blank).
      userId = existing.id;
      await env.DB
        .prepare("UPDATE users SET password_hash = ?, research_consent = ? WHERE id = ?")
        .bind(passwordHash, researchConsent, userId)
        .run();
      if (displayName) {
        await env.DB
          .prepare("UPDATE users SET display_name = COALESCE(display_name, ?) WHERE id = ?")
          .bind(displayName, userId)
          .run();
      }
    } else {
      userId = uuid();
      await env.DB
        .prepare("INSERT INTO users (id, email, password_hash, display_name, research_consent, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(userId, email, passwordHash, displayName, researchConsent, now)
        .run();
    }

    const { token } = await createSession(env, userId);
    return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(token) });
  } catch (err) {
    // Surface the real cause in the Cloudflare Pages Functions logs (wrangler
    // pages deployment tail / dashboard), while keeping the client message generic.
    console.error("register failed:", err && (err.stack || err.message || err));
    return json({ error: "Server error", detail: err && err.message }, 500);
  }
}
