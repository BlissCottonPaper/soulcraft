// ============================================================
// /functions/api/login.js  ->  POST /api/login
// ============================================================
// Authenticate against D1 and set a secure httpOnly session cookie
// (30-day expiry). The client redirects to /account on { ok: true }.
//
//   POST { email, password }  ->  { ok: true }  (+ Set-Cookie session)
//
// We return the SAME generic error whether the email is unknown or the
// password is wrong, so this endpoint can't be used to enumerate accounts.
//
// Needs the D1 binding env.DB.
// ============================================================

import { verifyPassword, createSession, sessionCookie, ensureSchema } from "./_auth.js";

function json(obj, status, extraHeaders) {
  const headers = { "Content-Type": "application/json" };
  if (extraHeaders) Object.assign(headers, extraHeaders);
  return new Response(JSON.stringify(obj), { status: status || 200, headers });
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ error: "Accounts aren't available yet." }, 503);
    // Self-heal the accounts schema if migration 0002 wasn't run against live D1.
    await ensureSchema(env);
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      return json({ error: "Enter your email and password." }, 400);
    }

    const user = await env.DB
      .prepare("SELECT id, password_hash FROM users WHERE email = ?")
      .bind(email)
      .first();

    // Same message for "no such account" and "wrong password" (no enumeration).
    if (!user || !user.password_hash) {
      return json({ error: "That email and password don't match." }, 401);
    }
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return json({ error: "That email and password don't match." }, 401);
    }

    const { token } = await createSession(env, user.id);
    return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(token) });
  } catch (err) {
    return json({ error: "Server error", detail: err.message }, 500);
  }
}
