/* ============================================================================
   THE ART OF SOULCRAFT — SHARED SITE CHROME (nav + footer, single source)
   ----------------------------------------------------------------------------
   One definition of the site navigation and footer, used TWO ways:
     • Browser: injected at runtime into any page that includes this script
       (this is how the assessment root, index.html, gets the nav without
       touching its React/quiz/scoring logic).
     • Node: the build generator (/build/generate.js) imports headerHtml()/
       footerHtml()/CSS and BAKES them into the static Explore pages, so their
       nav is real HTML in the markup (crawlable) rather than JS-injected.
   All classes are namespaced `sc-` so they never collide with page styles.
   ============================================================================ */
(function (root, factory) {
  var chrome = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = chrome;                    // Node (build generator)
  } else if (typeof document !== "undefined") {
    // Browser: inject chrome once the DOM is ready.
    var run = function () {
      if (!document.getElementById("sc-styles")) {
        var s = document.createElement("style");
        s.id = "sc-styles";
        s.textContent = chrome.CSS;
        document.head.appendChild(s);
      }
      if (!document.getElementById("site-header")) {
        var active = chrome.activeFromPath(location.pathname);
        document.body.insertAdjacentHTML("afterbegin", chrome.headerHtml(active));
        document.body.insertAdjacentHTML("beforeend", chrome.footerHtml());
      }
      chrome.wireDropdown();
      chrome.wireMobile();
      chrome.applyResultToken();
      chrome.applyAuthNav();
      chrome.injectAnalytics();
      chrome.registerServiceWorker();
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
    else run();
    root.SITE_CHROME = chrome;
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // --- Google Analytics 4 (gtag.js) -----------------------------------------
  // Standard GA4 tag, injected once into <head> from here so it lives on EVERY
  // page (the assessment root and all generated Explore pages both load this
  // script). Loading via site-chrome keeps a single source of truth for the tag.
  // The gaConfigured() guard means a build with the placeholder ("G-XXXXXXXXXX")
  // stays inert — it never phones home to a bogus property.
  var GA_MEASUREMENT_ID = "G-MP4JG19LTW"; // GA4 Measurement ID for artofsoulcraft.com

  function gaConfigured() {
    return /^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID) && GA_MEASUREMENT_ID.indexOf("XXXX") === -1;
  }

  function injectAnalytics() {
    if (typeof document === "undefined") return;
    if (!gaConfigured()) return;                       // placeholder not filled in yet
    if (document.getElementById("ga4-src")) return;    // inject exactly once per page
    var head = document.head || document.getElementsByTagName("head")[0];
    if (!head) return;
    var s = document.createElement("script");
    s.id = "ga4-src";
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
    head.appendChild(s);
    var inline = document.createElement("script");
    inline.id = "ga4-init";
    inline.text =
      "window.dataLayer=window.dataLayer||[];" +
      "function gtag(){dataLayer.push(arguments);}" +
      "gtag('js',new Date());" +
      "gtag('config','" + GA_MEASUREMENT_ID + "');";
    head.appendChild(inline);
  }

  var CSS = [
    "#site-header{position:sticky;top:0;z-index:30;background:rgba(16,12,34,0.82);backdrop-filter:blur(8px);border-bottom:1px solid rgba(196,181,253,0.10);font-family:'Source Sans 3',system-ui,sans-serif;}",
    ".sc-nav{max-width:64rem;margin:0 auto;padding:0 1.25rem;height:4rem;display:flex;align-items:center;justify-content:space-between;}",
    ".sc-brand{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.35rem;color:#f5f3ff;text-decoration:none;}",
    ".sc-brand:hover{color:#fde8b0;}",
    ".sc-links{display:flex;align-items:center;gap:1.25rem;font-size:15px;}",
    ".sc-link{color:rgba(224,218,246,0.85);text-decoration:none;transition:color .15s;background:none;border:none;cursor:pointer;font:inherit;display:flex;align-items:center;gap:.25rem;}",
    ".sc-link:hover{color:#fde68a;}",
    ".sc-link.sc-active{color:#fde8b0;}",
    ".sc-dd{position:relative;}",
    ".sc-menu{display:none;position:absolute;right:0;margin-top:.5rem;width:14rem;background:#1a1533;border:1px solid rgba(196,181,253,0.18);border-radius:.75rem;padding:.5rem 0;box-shadow:0 10px 30px rgba(0,0,0,0.4);}",
    ".sc-dd:hover .sc-menu,.sc-dd:focus-within .sc-menu,.sc-menu.sc-open{display:block;}",
    ".sc-menu a{display:block;padding:.5rem 1rem;font-size:14px;color:rgba(224,218,246,0.85);text-decoration:none;}",
    ".sc-menu a:hover{color:#fde68a;}",
    ".sc-menu-divider{height:1px;background:rgba(196,181,253,0.16);margin:.4rem 1rem;}",
    "#site-footer{border-top:1px solid rgba(196,181,253,0.10);margin-top:2rem;font-family:'Source Sans 3',system-ui,sans-serif;}",
    ".sc-foot{max-width:64rem;margin:0 auto;padding:2.5rem 1.25rem;font-size:14px;color:rgba(196,181,253,0.55);display:flex;flex-direction:column;gap:1.25rem;}",
    ".sc-foot-top{display:flex;flex-direction:column;gap:1rem;}",
    "@media(min-width:768px){.sc-foot-top{flex-direction:row;justify-content:space-between;align-items:flex-start;} .sc-nav{padding:0 2rem;}}",
    ".sc-foot-links{display:flex;flex-direction:column;gap:.4rem;}",
    "@media(min-width:768px){.sc-foot-links{align-items:flex-end;text-align:right;}}",
    ".sc-foot-row{display:flex;flex-wrap:wrap;gap:.5rem;}",
    ".sc-foot-sep{opacity:.4;}",
    ".sc-foot a{color:rgba(224,218,246,0.85);text-decoration:none;}.sc-foot a:hover{color:#fde68a;}",
    ".sc-foot-brand{font-family:'Cormorant Garamond',Georgia,serif;color:rgba(224,218,246,0.7);margin:0;}",
    ".sc-foot-tagline{font-size:12.5px;color:rgba(196,181,253,0.45);margin:0;}",
    "#sc-return-banner{position:relative;display:flex;align-items:center;justify-content:center;gap:.75rem;background:rgba(253,230,138,0.12);border-bottom:1px solid rgba(253,230,138,0.22);font-family:'Source Sans 3',system-ui,sans-serif;padding:.5rem 2.5rem;text-align:center;}",
    ".sc-return-link{color:#fde8b0;text-decoration:none;font-size:14px;font-weight:600;}",
    ".sc-return-link:hover{color:#fff6d8;text-decoration:underline;}",
    ".sc-return-dismiss{position:absolute;right:.6rem;top:50%;transform:translateY(-50%);background:none;border:0;color:rgba(253,232,176,0.7);font-size:20px;line-height:1;cursor:pointer;padding:.15rem .4rem;}",
    ".sc-return-dismiss:hover{color:#fde8b0;}",
    // --- Mobile hamburger nav (below 768px) ---
    ".sc-burger{display:none;align-items:center;justify-content:center;width:2.75rem;height:2.75rem;margin-right:-.4rem;background:none;border:0;cursor:pointer;color:#f5f3ff;padding:0;-webkit-tap-highlight-color:transparent;touch-action:manipulation;-webkit-appearance:none;appearance:none;}",
    ".sc-burger:hover{color:#fde8b0;}",
    ".sc-burger svg{display:block;pointer-events:none;}",
    ".sc-mobile{display:none;border-top:1px solid rgba(196,181,253,0.10);background:rgba(16,12,34,0.98);padding:.4rem 0 .8rem;}",
    ".sc-mobile.sc-open{display:block;}",
    ".sc-mobile a{display:block;padding:.6rem 1.5rem;font-size:16px;color:rgba(224,218,246,0.9);text-decoration:none;}",
    ".sc-mobile a:hover,.sc-mobile a.sc-active{color:#fde8b0;}",
    ".sc-m-group{padding:.7rem 1.5rem .1rem;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:rgba(196,181,253,0.5);margin:0;}",
    ".sc-mobile a.sc-m-sub{padding-left:2.5rem;font-size:15px;color:rgba(224,218,246,0.72);}",
    ".sc-m-divider{height:1px;background:rgba(196,181,253,0.12);margin:.35rem 1.5rem;}",
    "@media(max-width:767px){.sc-links{display:none;} .sc-burger{display:flex;}}",
    "@media(min-width:768px){.sc-mobile{display:none !important;}}"
  ].join("");

  var EXPLORE_ITEMS = [
    { href: "/how-it-works/", label: "How It Works" },
    { href: "/explore/#the-twelve", label: "The Twelve Archetypes" },
    { href: "/explore/bandwidth/", label: "Bandwidth" },
    { href: "/explore/temperaments/", label: "Temperament" },
    { href: "/explore/#pairings", label: "Pairings" },
    { href: "/explore/shadow/", label: "Shadow" },
    { divider: true },
    { href: "/integration-guide/", label: "Integration Guide" }
  ];

  function activeFromPath(p) {
    p = p || "/";
    if (p.indexOf("/about") === 0) return "about";
    if (p.indexOf("/how-it-works") === 0) return "explore";
    if (p.indexOf("/integration-guide") === 0) return "explore";
    if (p.indexOf("/explore") === 0) return "explore";
    if (p.indexOf("/pricing") === 0) return "pricing";
    if (p.indexOf("/my-results") === 0) return "results";
    if (p.indexOf("/contact") === 0) return "contact";
    if (p.indexOf("/support") === 0) return "support";
    return "home";
  }

  function headerHtml(active) {
    var menu = EXPLORE_ITEMS.map(function (it) {
      if (it.divider) return '<div class="sc-menu-divider" role="separator"></div>';
      return '<a href="' + it.href + '">' + it.label + "</a>";
    }).join("");
    var cls = function (name) { return "sc-link" + (active === name ? " sc-active" : ""); };
    // The same items, stacked, for the mobile drawer (Explore sub-items indented).
    var mact = function (name) { return active === name ? ' class="sc-active"' : ""; };
    var mobileExplore = EXPLORE_ITEMS.map(function (it) {
      if (it.divider) return '<div class="sc-m-divider" role="separator"></div>';
      return '<a class="sc-m-sub" href="' + it.href + '">' + it.label + "</a>";
    }).join("");
    var burger =
      '<button class="sc-burger" id="sc-burger" aria-label="Open menu" aria-expanded="false" aria-controls="sc-mobile-menu">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
          '<line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line>' +
        '</svg>' +
      '</button>';
    var mobile =
      '<div class="sc-mobile" id="sc-mobile-menu">' +
        '<a' + mact("home") + ' href="/">Home</a>' +
        '<a' + mact("about") + ' href="/about/">About</a>' +
        '<p class="sc-m-group">Explore</p>' +
        mobileExplore +
        '<div class="sc-m-divider" role="separator"></div>' +
        '<a' + mact("pricing") + ' href="/pricing/">Pricing</a>' +
        '<a' + mact("results") + ' href="/my-results/">My Results</a>' +
        '<a' + mact("contact") + ' href="/contact/">Contact</a>' +
      '</div>';
    return '' +
      '<header id="site-header"><nav class="sc-nav" aria-label="Primary">' +
        '<a class="sc-brand" href="/">The Art of Soulcraft</a>' +
        '<div class="sc-links">' +
          '<a class="' + cls("home") + '" href="/">Home</a>' +
          '<a class="' + cls("about") + '" href="/about/">About</a>' +
          '<div class="sc-dd">' +
            '<button id="sc-explore-btn" class="' + cls("explore") + '" aria-haspopup="true" aria-expanded="false">Explore <span style="font-size:.7em">▾</span></button>' +
            '<div class="sc-menu" id="sc-explore-menu">' + menu + '</div>' +
          '</div>' +
          '<a class="' + cls("pricing") + '" href="/pricing/">Pricing</a>' +
          '<a class="' + cls("results") + '" href="/my-results/">My Results</a>' +
          '<a class="' + cls("contact") + '" href="/contact/">Contact</a>' +
        '</div>' +
        burger +
      '</nav>' + mobile + '</header>';
  }

  function footerHtml() {
    return '' +
      '<footer id="site-footer"><div class="sc-foot">' +
        '<div class="sc-foot-top">' +
          '<p class="sc-foot-brand">The Art of Soulcraft <span style="opacity:.6">· a BridgeTender Studio project</span></p>' +
          '<div class="sc-foot-links">' +
            '<div class="sc-foot-row">' +
              '<a href="/contact/">Work With Us</a><span class="sc-foot-sep" aria-hidden="true">·</span>' +
              '<a href="/support/">Support</a><span class="sc-foot-sep" aria-hidden="true">·</span>' +
              '<a href="/privacy/">Privacy</a><span class="sc-foot-sep" aria-hidden="true">·</span>' +
              '<a href="/terms/">Terms</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<p class="sc-foot-tagline">You are not one of twelve types. You are all twelve.</p>' +
      '</div></footer>';
  }

  function wireDropdown() {
    if (typeof document === "undefined") return;
    var btn = document.getElementById("sc-explore-btn");
    var menu = document.getElementById("sc-explore-menu");
    if (!btn || !menu || btn.getAttribute("data-wired")) return;
    btn.setAttribute("data-wired", "1");
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = menu.classList.toggle("sc-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function () {
      menu.classList.remove("sc-open");
      btn.setAttribute("aria-expanded", "false");
    });
  }

  // Mobile hamburger. Uses document-level event DELEGATION rather than binding a
  // handler to the button directly: the listener lives on `document` (which always
  // exists), so it can't miss the button to a timing/order/null issue, and it keeps
  // working even if the header is injected or replaced after load. iOS Safari fires
  // `click` on a real <button>, and the SVG is pointer-events:none so the tap target
  // is always the button itself.
  function wireMobile() {
    if (typeof document === "undefined") return;
    var doc = document.documentElement;
    if (doc.getAttribute("data-sc-mobile-wired")) return; // bind exactly once
    doc.setAttribute("data-sc-mobile-wired", "1");

    var setOpen = function (open) {
      var m = document.getElementById("sc-mobile-menu");
      var b = document.getElementById("sc-burger");
      if (m) m.classList.toggle("sc-open", open);
      if (b) b.setAttribute("aria-expanded", open ? "true" : "false");
    };

    document.addEventListener("click", function (e) {
      var t = e.target;
      var onBurger = t && t.closest ? t.closest("#sc-burger") : null;
      var menu = document.getElementById("sc-mobile-menu");
      if (onBurger) {                                   // tap the hamburger → toggle
        setOpen(!(menu && menu.classList.contains("sc-open")));
        return;
      }
      if (!menu || !menu.classList.contains("sc-open")) return;
      if (menu.contains(t)) {                            // inside the drawer
        if (t.closest && t.closest("a")) setOpen(false); // a nav link → close (then navigate)
      } else {
        setOpen(false);                                  // anywhere outside → close
      }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  }

  // --- "Return to Your Mandala": session persistence (Task 1) ---------------
  // index.html writes a 30-day token to localStorage the moment a real result is
  // shown (key: soulcraft_result_token, a { expires, snapshot } envelope). Any
  // page can then offer a one-click way back to that reading. We never expose the
  // snapshot here — we only read whether a live token exists and, if so, surface
  // the affordance. The banner links to /?return=mandala; index.html restores the
  // snapshot from that same localStorage key.
  var TOKEN_KEY = "soulcraft_result_token";
  var DISMISS_KEY = "soulcraft_return_dismissed";

  function readResultToken() {
    try {
      var raw = window.localStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      var tok = JSON.parse(raw);
      if (!tok || !tok.snapshot) return null;
      if (tok.expires && tok.expires < Date.now()) {
        window.localStorage.removeItem(TOKEN_KEY);   // expired — clean it up
        return null;
      }
      return tok;
    } catch (e) { return null; }
  }

  function applyResultToken() {
    if (typeof document === "undefined") return;
    var tok = readResultToken();
    if (!tok) return;

    // 1) "My Results" checks localStorage first, then falls back to the email flow.
    var mr = document.querySelector('#site-header a[href="/my-results/"]');
    if (mr) mr.setAttribute("href", "/?return=mandala");

    // 2) A dismissible banner on every page EXCEPT the app itself (where the reading
    // already lives). Dismissal is per-session (sessionStorage), so it's persistent
    // but returns next visit.
    if (location.pathname === "/") return;
    var dismissed = false;
    try { dismissed = window.sessionStorage.getItem(DISMISS_KEY) === "1"; } catch (e) {}
    if (dismissed) return;
    if (document.getElementById("sc-return-banner")) return;
    var header = document.getElementById("site-header");
    if (!header) return;

    var bar = document.createElement("div");
    bar.id = "sc-return-banner";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Return to your results");
    bar.innerHTML =
      '<a class="sc-return-link" href="/?return=mandala">Return to your Mandala →</a>' +
      '<button type="button" class="sc-return-dismiss" aria-label="Dismiss">×</button>';
    header.insertAdjacentElement("afterend", bar);
    var x = bar.querySelector(".sc-return-dismiss");
    if (x) x.addEventListener("click", function () {
      try { window.sessionStorage.setItem(DISMISS_KEY, "1"); } catch (e) {}
      bar.parentNode && bar.parentNode.removeChild(bar);
    });
  }

  // --- Auth-aware nav (Task 3g) ---------------------------------------------
  // The baked nav is the logged-OUT default (real markup, crawlable). At runtime
  // we ask /api/me and, once, append the right affordance: "My Account" + "Log
  // Out" when signed in, "Log In" when signed out. The existing "My Results"
  // (magic-link) link stays for non-registered users either way.
  function doLogout() {
    fetch("/api/logout", { method: "POST", credentials: "same-origin" })
      .then(function () { window.location.href = "/"; })
      .catch(function () { window.location.href = "/"; });
  }

  function renderAuthNav(authed) {
    if (typeof document === "undefined") return;
    var links = document.querySelector("#site-header .sc-links");
    if (links && !links.querySelector(".sc-auth")) {
      if (authed) {
        var a = document.createElement("a");
        a.className = "sc-link sc-auth"; a.href = "/account/"; a.textContent = "My Account";
        links.appendChild(a);
        var b = document.createElement("button");
        b.className = "sc-link sc-auth"; b.type = "button"; b.textContent = "Log Out";
        b.addEventListener("click", doLogout);
        links.appendChild(b);
      } else {
        var l = document.createElement("a");
        l.className = "sc-link sc-auth"; l.href = "/login/"; l.textContent = "Log In";
        links.appendChild(l);
      }
    }
    var mobile = document.getElementById("sc-mobile-menu");
    if (mobile && !mobile.querySelector(".sc-auth")) {
      if (authed) {
        mobile.insertAdjacentHTML("beforeend",
          '<div class="sc-m-divider" role="separator"></div>' +
          '<a class="sc-auth" href="/account/">My Account</a>' +
          '<a class="sc-auth" href="#" role="button">Log Out</a>');
        var ml = mobile.querySelectorAll(".sc-auth");
        var last = ml[ml.length - 1];
        if (last) last.addEventListener("click", function (e) { e.preventDefault(); doLogout(); });
      } else {
        mobile.insertAdjacentHTML("beforeend",
          '<div class="sc-m-divider" role="separator"></div>' +
          '<a class="sc-auth" href="/login/">Log In</a>');
      }
    }
  }

  function applyAuthNav() {
    if (typeof document === "undefined") return;
    fetch("/api/me", { credentials: "same-origin" })
      .then(function (r) { return r.json(); })
      .then(function (d) { renderAuthNav(!!(d && d.authenticated)); })
      .catch(function () { renderAuthNav(false); });
  }

  // --- PWA service worker (Task 5) ------------------------------------------
  // Registered once from the shared chrome so it lives on every page. The worker
  // itself only caches a few static assets and never touches HTML or /api/*
  // (see /service-worker.js), so installing it can't make the app go stale.
  function registerServiceWorker() {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    if (typeof window === "undefined" || window.location.protocol === "file:") return;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/service-worker.js").catch(function () { /* non-fatal */ });
    });
  }

  return {
    CSS: CSS,
    headerHtml: headerHtml,
    footerHtml: footerHtml,
    activeFromPath: activeFromPath,
    wireDropdown: wireDropdown,
    wireMobile: wireMobile,
    readResultToken: readResultToken,
    applyResultToken: applyResultToken,
    applyAuthNav: applyAuthNav,
    injectAnalytics: injectAnalytics,
    registerServiceWorker: registerServiceWorker
  };
});
