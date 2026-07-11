/* ============================================================================
   THE ART OF SOULCRAFT — service worker (PWA, Task 5)
   ----------------------------------------------------------------------------
   Deliberately conservative: a cache-first strategy for a small set of STATIC,
   version-agnostic assets (fonts of the app shell, icons, the manifest), and a
   network-first pass-through for everything else. We never cache HTML documents
   or /api/* responses — the assessment, results, auth, and Stripe flows must
   always be live and per-user, never served stale from a cache.

   Bump CACHE_VERSION whenever the cached asset list changes; the old cache is
   dropped on activate so a returning visitor can't get wedged on stale files.
   ============================================================================ */
const CACHE_VERSION = "soulcraft-static-v1";

// Only truly static, safe-to-cache assets. NOT index.html and NOT /api/*.
const PRECACHE = [
  "/manifest.json",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/assets/site-chrome.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  // Only handle our own origin; let cross-origin (fonts CDN, Stripe, GA) go direct.
  if (url.origin !== self.location.origin) return;

  // Never serve HTML navigations or API calls from cache — always live.
  const isDoc = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  if (isDoc || url.pathname.startsWith("/api/")) return;

  // Static assets: cache-first, then fill the cache on first network fetch.
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
    })
  );
});
