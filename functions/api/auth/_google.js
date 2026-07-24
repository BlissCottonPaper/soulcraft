// ============================================================
// /functions/api/auth/_google.js  —  Google OAuth 2.0 helpers (no external deps)
// ============================================================
// Everything the Google sign-in routes share, built only on the Web Crypto API
// the Cloudflare Workers runtime provides. Leading-underscore file ⇒ not a route.
//
// Flow: authorization-code with a server-side token exchange.
//   /api/auth/google            builds the Google consent URL (this file's
//                               buildAuthUrl) and sets a short-lived, httpOnly
//                               CSRF state cookie (stateCookie).
//   /api/auth/google/callback   verifies state, exchanges the code for tokens
//                               (exchangeCode), and validates the ID token's
//                               RS256 signature against Google's JWKS plus its
//                               iss / aud / exp claims (verifyIdToken).
//
// Scopes are exactly `openid email profile`. Identity is keyed to the verified
// email; email_verified must be true or the sign-in is rejected by the caller.
// ============================================================

export const OAUTH_STATE_COOKIE = "sc_oauth";
const STATE_TTL_SECONDS = 600; // 10 minutes — plenty to complete the consent hop
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const VALID_ISSUERS = ["accounts.google.com", "https://accounts.google.com"];
const SCOPES = "openid email profile";

const enc = new TextEncoder();

// The callback URL must EXACTLY match one registered in the Google console.
// Deriving it from the incoming origin yields the right registered value on
// production (https://artofsoulcraft.com/…) and on local dev
// (http://localhost:8788/…) with no per-environment branching.
export function googleRedirectUri(url) {
  return new URL("/api/auth/google/callback", url.origin).toString();
}

// 32 random bytes, hex — the CSRF nonce. Unguessable; it lives in an httpOnly
// cookie the browser JS can't read or forge, and must come back in ?state.
export function makeState() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");
}

// Constant-time string compare (avoids leaking match position via early return).
export function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function buildAuthUrl({ clientId, redirectUri, state }) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    state: state,
    // Let a signed-in-with-many-accounts user choose; no offline/refresh token —
    // we only need to read identity once.
    prompt: "select_account",
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

// --- CSRF state cookie: state + the sanitized post-login destination ---------
// httpOnly + Secure + SameSite=Lax. Lax is required (not Strict): the callback
// is a top-level GET navigation FROM accounts.google.com, and Lax cookies ride
// top-level cross-site GETs while Strict would drop them. Path scopes it to the
// auth routes so it isn't sent site-wide.
export function stateCookie(state, next) {
  const value = `${state}.${encodeURIComponent(next || "/")}`;
  return `${OAUTH_STATE_COOKIE}=${value}; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=${STATE_TTL_SECONDS}`;
}
export function clearStateCookie() {
  return `${OAUTH_STATE_COOKIE}=; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
export function readState(request) {
  const header = request.headers.get("Cookie") || "";
  let raw = null;
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    if (pair.slice(0, idx).trim() === OAUTH_STATE_COOKIE) raw = pair.slice(idx + 1).trim();
  });
  if (!raw) return null;
  const dot = raw.indexOf(".");
  if (dot === -1) return { state: raw, next: "/" };
  let next = "/";
  try { next = decodeURIComponent(raw.slice(dot + 1)); } catch (e) { next = "/"; }
  return { state: raw.slice(0, dot), next: next };
}

// Exchange the authorization code for tokens (server-to-server, over the CA-
// verified proxy). Returns the parsed JSON (with id_token) or null on any error.
export async function exchangeCode({ code, clientId, clientSecret, redirectUri }) {
  const body = new URLSearchParams({
    code: code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: body.toString(),
  });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

// base64url → bytes → UTF-8 string (handles non-ASCII names correctly).
function b64urlToBytes(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function decodeSegment(str) {
  return new TextDecoder().decode(b64urlToBytes(str));
}

// Fetch Google's signing keys (JWKS). Memoized briefly per isolate so a burst of
// sign-ins doesn't refetch on every callback; short TTL so rotated keys are picked
// up. crypto.subtle.importKey imports the JWK directly.
let jwksCache = { at: 0, keys: null };
async function getSigningKey(kid, nowMs) {
  if (!jwksCache.keys || nowMs - jwksCache.at > 60 * 60 * 1000) {
    const res = await fetch(CERTS_URL, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("jwks fetch failed");
    const data = await res.json();
    jwksCache = { at: nowMs, keys: (data && data.keys) || [] };
  }
  return (jwksCache.keys || []).find((k) => k.kid === kid) || null;
}

// Validate a Google ID token: RS256 signature against the JWKS, then the
// iss / aud / exp claims. Returns the claims object, or null if anything fails.
// (Even though the token arrives directly from Google's token endpoint over a
// trusted channel, we verify the signature too — defense in depth.)
export async function verifyIdToken(idToken, clientId, nowMsOverride) {
  try {
    if (typeof idToken !== "string") return null;
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;
    const header = JSON.parse(decodeSegment(parts[0]));
    if (header.alg !== "RS256") return null;

    const nowMs = typeof nowMsOverride === "number" ? nowMsOverride : Date.now();
    const jwk = await getSigningKey(header.kid, nowMs);
    if (!jwk) return null;

    const key = await crypto.subtle.importKey(
      "jwk",
      { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const ok = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      b64urlToBytes(parts[2]),
      enc.encode(parts[0] + "." + parts[1])
    );
    if (!ok) return null;

    const claims = JSON.parse(decodeSegment(parts[1]));
    if (!VALID_ISSUERS.includes(claims.iss)) return null;
    if (claims.aud !== clientId) return null;
    const nowSec = Math.floor(nowMs / 1000);
    if (typeof claims.exp !== "number" || claims.exp <= nowSec) return null; // expired
    return claims;
  } catch (e) {
    return null;
  }
}
