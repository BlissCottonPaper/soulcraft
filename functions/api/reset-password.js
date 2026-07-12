// ============================================================
// /functions/api/reset-password.js  ->  POST /api/reset-password
// ============================================================
// Step 2 of "forgot password": redeem the emailed token and set a new password.
// The token is single-use and expires ~1 hour after it was requested. On
// success we:
//   • set the new PBKDF2 password hash,
//   • mark the token used (and clear any siblings),
//   • revoke every existing session for that user (a reset logs out all devices),
//   • start a fresh session so they land signed in.
//
//   POST { token, password }  ->  { ok: true }  (+ Set-Cookie session)
//
// Needs the D1 binding env.DB.
// ============================================================

import { ensureSchema, sha256Hex, hashPassword, createSession, sessionCookie } from "./_auth.js";

function json(obj, status, extraHeaders) {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  if (extraHeaders) Object.assign(headers, extraHeaders);
  return new Response(JSON.stringify(obj), { status: status || 200, headers });
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ error: "Accounts aren't available yet." }, 503);
    await ensureSchema(env);

    const body = await request.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!token) return json({ error: "This reset link is missing its token." }, 400);
    if (password.length < 8) return json({ error: "Please choose a password of at least 8 characters." }, 400);

    const tokenHash = await sha256Hex(token);
    const now = Math.floor(Date.now() / 1000);
    const row = await env.DB
      .prepare("SELECT user_id, expires_at, used FROM password_resets WHERE token_hash = ?")
      .bind(tokenHash)
      .first();

    if (!row || Number(row.used) === 1 || Number(row.expires_at) < now) {
      return json({ error: "This reset link is invalid or has expired. Please request a new one." }, 400);
    }

    const passwordHash = await hashPassword(password);
    await env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(passwordHash, row.user_id).run();
    // Burn this token and any siblings so the link can't be reused.
    try { await env.DB.prepare("DELETE FROM password_resets WHERE user_id = ?").bind(row.user_id).run(); } catch (e) {}
    // A password reset revokes every existing session — old devices are logged out.
    try { await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(row.user_id).run(); } catch (e) {}

    const { token: sessionToken } = await createSession(env, row.user_id);
    return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(sessionToken) });
  } catch (err) {
    console.error("reset-password failed:", err && (err.stack || err.message));
    return json({ error: "Server error", detail: err && err.message }, 500);
  }
}
