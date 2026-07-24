// ============================================================
// /functions/api/auth/google.js  ->  GET /api/auth/google
// ============================================================
// Start of Google sign-in. Builds the Google OAuth 2.0 authorization URL
// (scopes: openid email profile), sets a short-lived httpOnly CSRF `state`
// cookie that also carries the sanitized post-login destination, and 302s the
// browser to Google's consent screen.
//
//   GET /api/auth/google?next=<same-origin path>
//     -> 302 to Google  (+ Set-Cookie: sc_oauth state)
//
// If Google isn't configured, bounce to the sign-in page with a gentle notice
// rather than erroring — the email flow there still works.
//
// Needs env.GOOGLE_CLIENT_ID.
// ============================================================

import { buildAuthUrl, makeState, stateCookie, googleRedirectUri } from "./_google.js";
import { sanitizeNext } from "../request-login-link.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const fail = new URL("/login/?e=google", url.origin).toString();
  try {
    const clientId = env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return new Response(null, { status: 302, headers: { Location: fail, "Cache-Control": "no-store" } });
    }

    const next = sanitizeNext(url.searchParams.get("next"));
    const state = makeState();
    const authUrl = buildAuthUrl({
      clientId: clientId,
      redirectUri: googleRedirectUri(url),
      state: state,
    });

    const headers = new Headers({ Location: authUrl, "Cache-Control": "no-store" });
    headers.append("Set-Cookie", stateCookie(state, next));
    return new Response(null, { status: 302, headers: headers });
  } catch (err) {
    return new Response(null, { status: 302, headers: { Location: fail, "Cache-Control": "no-store" } });
  }
}
