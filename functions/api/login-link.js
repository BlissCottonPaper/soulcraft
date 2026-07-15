// ============================================================
// /functions/api/login-link.js  ->  GET /api/login-link?t=<token>
// ============================================================
// The click side of passwordless login. Validate the one-time token, establish a
// session (httpOnly cookie), and 302 back to the caller's sanitized `next` (the
// full-assessment start, by default the home page). Invalid/expired/used tokens
// bounce to the password login page with a gentle notice.
//
// Needs env.DB.
// ============================================================

import { ensureSchema, sha256Hex, createSession, sessionCookie } from "./_auth.js";
import { sanitizeNext } from "./request-login-link.js";

const ORIGIN = "https://artofsoulcraft.com";

function redirect(location, cookie) {
  const headers = { Location: location, "Cache-Control": "no-store" };
  if (cookie) headers["Set-Cookie"] = cookie;
  return new Response(null, { status: 302, headers });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = url.searchParams.get("t") || "";
  const fail = ORIGIN + "/login/?e=link";
  try {
    if (!env.DB || !token) return redirect(fail);
    await ensureSchema(env);

    const tokenHash = await sha256Hex(token);
    const row = await env.DB
      .prepare("SELECT token_hash, user_id, next, expires_at, used FROM login_links WHERE token_hash = ?")
      .bind(tokenHash)
      .first();

    const now = Math.floor(Date.now() / 1000);
    if (!row || Number(row.used) === 1 || Number(row.expires_at) < now) return redirect(fail);

    // Single-use: burn the token before establishing the session.
    await env.DB.prepare("UPDATE login_links SET used = 1 WHERE token_hash = ?").bind(tokenHash).run();

    const { token: sessionToken } = await createSession(env, row.user_id);
    const dest = ORIGIN + sanitizeNext(row.next);
    return redirect(dest, sessionCookie(sessionToken));
  } catch (err) {
    return redirect(fail);
  }
}
