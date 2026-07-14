// ============================================================
// /functions/api/_middleware.js  —  privacy cache guard for ALL /api/* routes
// ============================================================
// Every response under /api is either per-user (results, account, Mira, admin)
// or state-changing (auth, checkout, save). None of it may EVER be stored by a
// browser, a shared/edge cache, or any intermediary — otherwise one account's
// cached response can be replayed to another (the /api/my-results leak: a GET
// with no Cache-Control got cached under its URL, and after a logout/login on
// the same browser the previous account's Mandala was served).
//
// This middleware runs for every /api/* route and forces `Cache-Control:
// no-store` on any response that isn't already explicitly non-cacheable (so the
// Mira SSE stream keeps its own `no-cache, no-transform`). It also adds `Vary:
// Cookie` so any cache that ignores this still can't key an authenticated
// response without the session cookie. Set-Cookie and streaming bodies are
// preserved by cloning the response rather than rebuilding it.
// ============================================================

export async function onRequest(context) {
  const res = await context.next();

  // Clone so headers are mutable; this preserves status, body (incl. streams),
  // and Set-Cookie from the underlying handler.
  const out = new Response(res.body, res);

  const cc = out.headers.get("Cache-Control") || "";
  // If the handler didn't already forbid storage, force no-store. This also
  // corrects an accidental `public`/`max-age` on a private endpoint.
  if (!/no-store|no-cache/i.test(cc)) {
    out.headers.set("Cache-Control", "no-store");
  }

  const vary = out.headers.get("Vary");
  if (!vary) out.headers.set("Vary", "Cookie");
  else if (!/\bcookie\b/i.test(vary)) out.headers.set("Vary", vary + ", Cookie");

  return out;
}
