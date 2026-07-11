// ============================================================
// /functions/api/_auth.js  —  shared auth helpers (no external deps)
// ============================================================
// Everything the login/account system needs, built ONLY on the Web Crypto
// API that the Cloudflare Workers runtime provides natively. There is
// deliberately no `package.json` in this repo (adding one flips Pages into
// build mode and broke deploys), so bcrypt/argon2 are off the table — we use
// PBKDF2-SHA256 via SubtleCrypto instead, which is the edge-native standard.
//
//   • hashPassword / verifyPassword  — PBKDF2, salted, versioned string
//   • createSession / getSessionUser / destroySession — httpOnly cookie sessions
//   • sessionCookie / clearCookie / parseCookies      — cookie plumbing
//
// The session cookie holds a raw random token; the DB stores only its SHA-256
// hash, so a leaked `sessions` table can't be replayed as a login.
// ============================================================

const enc = new TextEncoder();
const PBKDF2_ITERATIONS = 100000;      // OWASP-reasonable for PBKDF2-SHA256 on the edge
const COOKIE_NAME = "sc_session";
const SESSION_DAYS = 30;
const SESSION_SECONDS = SESSION_DAYS * 24 * 60 * 60;

function toHex(buf) {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}
function fromHex(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
// Constant-time-ish hex compare (avoids leaking match position via early return).
function safeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function deriveBitsHex(password, salt, iterations) {
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt, iterations: iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return toHex(bits);
}

// Returns a self-describing string: "pbkdf2$<iterations>$<saltHex>$<hashHex>".
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hashHex = await deriveBitsHex(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${hashHex}`;
}

export async function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string") return false;
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = parseInt(parts[1], 10);
  if (!iterations) return false;
  const salt = fromHex(parts[2]);
  const expected = parts[3];
  const actual = await deriveBitsHex(password, salt, iterations);
  return safeEqualHex(actual, expected);
}

export async function sha256Hex(str) {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(str));
  return toHex(digest);
}

function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toHex(bytes);
}

// --- Self-healing schema (so registration/login work even if migration 0002
// was never run against the live D1). D1 has no "ADD COLUMN IF NOT EXISTS", so
// each ALTER is attempted and its "duplicate column name" error is swallowed;
// CREATE ... IF NOT EXISTS is naturally idempotent. Memoized per isolate so the
// ~dozen statements run at most once per cold start, not on every request. ---
let schemaEnsured = false;
export async function ensureSchema(env) {
  if (schemaEnsured || !env || !env.DB) return;
  const statements = [
    "CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL)",
    "CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)",
    "ALTER TABLE users ADD COLUMN password_hash TEXT",
    "ALTER TABLE users ADD COLUMN companion_active INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN companion_tier TEXT",
    "ALTER TABLE users ADD COLUMN subscription_id TEXT",
    "ALTER TABLE results ADD COLUMN stripe_customer_id TEXT",
    "ALTER TABLE results ADD COLUMN companion_active INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE results ADD COLUMN companion_tier TEXT",
    "ALTER TABLE results ADD COLUMN subscription_id TEXT",
  ];
  for (const sql of statements) {
    try { await env.DB.prepare(sql).run(); } catch (e) { /* already exists — expected, ignore */ }
  }
  schemaEnsured = true;
}

// Create a session row and return the RAW token (goes in the cookie) + expiry.
export async function createSession(env, userId) {
  const token = newToken();
  const tokenHash = await sha256Hex(token);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + SESSION_SECONDS;
  await env.DB
    .prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .bind(tokenHash, userId, now, expiresAt)
    .run();
  return { token, expiresAt };
}

export async function destroySession(env, token) {
  if (!token) return;
  try {
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
  } catch (e) { /* best-effort */ }
}

export function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const out = {};
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

// The Set-Cookie value for a live session (httpOnly + Secure + SameSite=Lax,
// 30-day Max-Age so the login survives browser restarts).
export function sessionCookie(token) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_SECONDS}`;
}
export function clearCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
export function cookieName() { return COOKIE_NAME; }

// Resolve the logged-in user from the session cookie, or null. Joins straight
// to the user row so callers get email + companion state in one hop.
export async function getSessionUser(request, env) {
  if (!env || !env.DB) return null;
  const token = parseCookies(request)[COOKIE_NAME];
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB
    .prepare(
      `SELECT s.user_id AS id, s.expires_at AS expires_at,
              u.email AS email, u.companion_active AS companion_active,
              u.companion_tier AS companion_tier, u.subscription_id AS subscription_id,
              u.stripe_customer_id AS stripe_customer_id
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ?`
    )
    .bind(tokenHash)
    .first();
  if (!row || Number(row.expires_at) < now) return null;
  return {
    id: row.id,
    email: row.email,
    token: token,
    companion_active: Number(row.companion_active) === 1,
    companion_tier: row.companion_tier || null,
    subscription_id: row.subscription_id || null,
    stripe_customer_id: row.stripe_customer_id || null,
  };
}
