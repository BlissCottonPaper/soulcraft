// ============================================================
// /functions/api/auth/google/callback.js  ->  GET /api/auth/google/callback
// ============================================================
// The return leg of Google sign-in. Verifies the CSRF `state`, exchanges the
// authorization code for tokens, validates the ID token (RS256 signature +
// iss/aud/exp), and requires a Google-verified email. Then it resolves the
// account by email and issues the SAME session a magic-link/password login
// issues (createSession + sessionCookie) — downstream code can't tell which
// method authenticated the user.
//
//   GET /api/auth/google/callback?code=…&state=…
//     -> 302 to the sanitized `next`  (+ Set-Cookie: sc_session)
//     -> on cancel/any failure: 302 to /login/?e=google (never a dead end)
//
// Account resolution mirrors the magic-link path exactly: look up the email;
// if a row exists (however it was created), log that user in — same account,
// same results; if not, create one with the same fields/defaults a magic-link
// signup produces, storing the Google display name. Never a duplicate row.
//
// Needs env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.DB.
// ============================================================

import {
  readState,
  clearStateCookie,
  timingSafeEqual,
  exchangeCode,
  verifyIdToken,
  googleRedirectUri,
} from "../_google.js";
import { ensureSchema, createSession, sessionCookie } from "../../_auth.js";
import { sanitizeNext } from "../../request-login-link.js";

// Match register.js's cleanDisplayName: drop control chars, collapse whitespace,
// trim, cap at 40; empty → null.
function cleanDisplayName(v) {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
  return s || null;
}

function redirect(location, cookies) {
  const headers = new Headers({ Location: location, "Cache-Control": "no-store" });
  (cookies || []).forEach((c) => headers.append("Set-Cookie", c));
  return new Response(null, { status: 302, headers: headers });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const fail = new URL("/login/?e=google", url.origin).toString();
  const clearCookie = clearStateCookie();
  try {
    // The user cancelled at Google, or Google returned an error.
    if (url.searchParams.get("error")) return redirect(fail, [clearCookie]);

    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const saved = readState(request); // { state, next } | null

    // CSRF: the returned state must match the one we set in the httpOnly cookie.
    if (!code || !stateParam || !saved || !timingSafeEqual(stateParam, saved.state)) {
      return redirect(fail, [clearCookie]);
    }

    const clientId = env.GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret || !env.DB) return redirect(fail, [clearCookie]);

    const tokens = await exchangeCode({
      code: code,
      clientId: clientId,
      clientSecret: clientSecret,
      redirectUri: googleRedirectUri(url),
    });
    if (!tokens || !tokens.id_token) return redirect(fail, [clearCookie]);

    const claims = await verifyIdToken(tokens.id_token, clientId);
    if (!claims) return redirect(fail, [clearCookie]);

    const email = (claims.email || "").trim().toLowerCase();
    // Google reports verification as a boolean, sometimes stringified.
    const emailVerified = claims.email_verified === true || claims.email_verified === "true";
    if (!email || !emailVerified) return redirect(fail, [clearCookie]);

    await ensureSchema(env);

    // Account resolution — identical to the magic-link path: find by email, else
    // create with the same defaults (id, email, created_at), plus the Google name
    // in display_name. Never a duplicate row for an existing email.
    const now = Math.floor(Date.now() / 1000);
    let user = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (!user) {
      const id = crypto.randomUUID();
      const displayName = cleanDisplayName(claims.name);
      await env.DB
        .prepare("INSERT INTO users (id, email, display_name, created_at) VALUES (?, ?, ?, ?)")
        .bind(id, email, displayName, now)
        .run();
      user = { id };
    }

    // The exact same session any other login issues.
    const { token } = await createSession(env, user.id);
    const dest = new URL(sanitizeNext(saved.next), url.origin).toString();
    return redirect(dest, [sessionCookie(token), clearCookie]);
  } catch (err) {
    return redirect(fail, [clearCookie]);
  }
}
