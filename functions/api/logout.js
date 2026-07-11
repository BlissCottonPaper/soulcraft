// ============================================================
// /functions/api/logout.js  ->  POST /api/logout
// ============================================================
// End the current session: delete the session row and clear the cookie.
//
//   POST  ->  { ok: true }  (+ Set-Cookie clearing the session)
//
// Needs the D1 binding env.DB.
// ============================================================

import { parseCookies, cookieName, destroySession, clearCookie } from "./_auth.js";

function json(obj, status, extraHeaders) {
  const headers = { "Content-Type": "application/json" };
  if (extraHeaders) Object.assign(headers, extraHeaders);
  return new Response(JSON.stringify(obj), { status: status || 200, headers });
}

export async function onRequestPost({ request, env }) {
  try {
    const token = parseCookies(request)[cookieName()];
    if (token && env.DB) await destroySession(env, token);
    return json({ ok: true }, 200, { "Set-Cookie": clearCookie() });
  } catch (err) {
    // Even on error, clear the cookie so the client ends up logged out.
    return json({ ok: true }, 200, { "Set-Cookie": clearCookie() });
  }
}
