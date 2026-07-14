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
      chrome.syncResultsActive();
      chrome.applyAuthNav();
      chrome.injectAnalytics();
      chrome.trackReturnVisit();
      chrome.registerServiceWorker();
      chrome.wireFeedback();
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
    ".sc-foot-admin{display:inline-block;margin-top:.75rem;font-size:11px;color:rgba(196,181,253,0.3);text-decoration:none;}",
    ".sc-foot-admin:hover{color:rgba(196,181,253,0.6);}",
    "#sc-return-banner{position:relative;display:flex;align-items:center;justify-content:center;gap:.75rem;background:rgba(253,230,138,0.12);border-bottom:1px solid rgba(253,230,138,0.22);font-family:'Source Sans 3',system-ui,sans-serif;padding:.5rem 2.5rem;text-align:center;}",
    ".sc-return-link{color:#fde8b0;text-decoration:none;font-size:14px;font-weight:600;}",
    ".sc-return-link:hover{color:#fff6d8;text-decoration:underline;}",
    ".sc-return-dismiss{position:absolute;right:.6rem;top:50%;transform:translateY(-50%);background:none;border:0;color:rgba(253,232,176,0.7);font-size:20px;line-height:1;cursor:pointer;padding:.15rem .4rem;}",
    ".sc-return-dismiss:hover{color:#fde8b0;}",
    // --- Mobile hamburger nav (below 768px) ---
    ".sc-burger{display:none;align-items:center;justify-content:center;width:2.75rem;height:2.75rem;margin-right:-.4rem;background:none;border:0;cursor:pointer;color:#f5f3ff;padding:0;-webkit-tap-highlight-color:transparent;touch-action:manipulation;-webkit-appearance:none;appearance:none;}",
    ".sc-burger:hover{color:#fde8b0;}",
    ".sc-burger svg{display:block;pointer-events:none;}",
    // The drawer lives inside a position:sticky header, so if it grows taller than
    // the viewport its bottom items (Mira, My Results, Contact) get pinned below the
    // fold with no way to scroll to them. Bound it to the viewport height (minus the
    // 4rem nav) and let it scroll internally so every item is always reachable.
    ".sc-mobile{display:none;border-top:1px solid rgba(196,181,253,0.10);background:rgba(16,12,34,0.98);padding:.4rem 0 .8rem;max-height:calc(100vh - 4rem);max-height:calc(100dvh - 4rem);overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;}",
    ".sc-mobile.sc-open{display:block;}",
    ".sc-mobile a{display:block;padding:.6rem 1.5rem;font-size:16px;color:rgba(224,218,246,0.9);text-decoration:none;}",
    ".sc-mobile a:hover,.sc-mobile a.sc-active{color:#fde8b0;}",
    ".sc-m-group{padding:.7rem 1.5rem .1rem;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:rgba(196,181,253,0.5);margin:0;}",
    ".sc-mobile a.sc-m-sub{padding-left:2.5rem;font-size:15px;color:rgba(224,218,246,0.72);}",
    ".sc-m-divider{height:1px;background:rgba(196,181,253,0.12);margin:.35rem 1.5rem;}",
    "@media(max-width:767px){.sc-links{display:none;} .sc-burger{display:flex;}}",
    "@media(min-width:768px){.sc-mobile{display:none !important;}}",
    // --- Floating feedback widget (sitewide, no login) ---
    ".sc-fb-btn{position:fixed;right:1.1rem;bottom:1.1rem;z-index:40;width:3.25rem;height:3.25rem;border-radius:50%;border:1px solid rgba(253,230,138,0.4);background:#1a1533;color:#fde8b0;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;transition:transform .15s,background .15s;font-family:'Source Sans 3',system-ui,sans-serif;}",
    ".sc-fb-btn:hover{transform:translateY(-2px);background:#241d44;}",
    ".sc-fb-btn svg{width:1.5rem;height:1.5rem;}",
    ".sc-fb-panel{position:fixed;right:1.1rem;bottom:5.25rem;z-index:41;width:20rem;max-width:calc(100vw - 2rem);background:#15102b;border:1px solid rgba(196,181,253,0.2);border-radius:1rem;padding:1.1rem 1.1rem 1.25rem;box-shadow:0 16px 44px rgba(0,0,0,0.5);font-family:'Source Sans 3',system-ui,sans-serif;color:#e0daf6;display:none;}",
    ".sc-fb-panel.sc-fb-open{display:block;}",
    ".sc-fb-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.3rem;color:#f5f3ff;margin:0 1.5rem .1rem 0;}",
    ".sc-fb-sub{font-size:13px;color:rgba(224,218,246,0.6);margin:0 0 .8rem;}",
    ".sc-fb-stars{display:flex;gap:.35rem;margin:0 0 .8rem;}",
    ".sc-fb-star{background:none;border:none;cursor:pointer;font-size:1.6rem;line-height:1;color:rgba(196,181,253,0.35);padding:0;transition:color .12s;}",
    ".sc-fb-star.sc-on,.sc-fb-star:hover{color:#fde8b0;}",
    ".sc-fb-txt,.sc-fb-email{width:100%;box-sizing:border-box;border-radius:.6rem;border:1px solid rgba(196,181,253,0.24);background:rgba(0,0,0,0.22);color:#efe9ff;font:inherit;font-size:14px;padding:.55rem .7rem;margin:0 0 .6rem;}",
    ".sc-fb-txt{min-height:4.5rem;resize:vertical;}",
    ".sc-fb-email{margin-bottom:.8rem;}",
    ".sc-fb-txt::placeholder,.sc-fb-email::placeholder{color:rgba(224,218,246,0.4);}",
    ".sc-fb-txt:focus,.sc-fb-email:focus{outline:none;border-color:rgba(253,230,138,0.55);}",
    ".sc-fb-send{width:100%;padding:.6rem;border-radius:.6rem;border:1px solid rgba(253,230,138,0.5);background:rgba(253,230,138,0.14);color:#fde8b0;font:inherit;font-size:15px;cursor:pointer;}",
    ".sc-fb-send:hover{background:rgba(253,230,138,0.22);}",
    ".sc-fb-send:disabled{opacity:.5;cursor:default;}",
    ".sc-fb-msg{font-size:13px;margin:.6rem 0 0;min-height:1em;}",
    ".sc-fb-msg.sc-fb-err{color:#fca5a5;}",
    ".sc-fb-msg.sc-fb-ok{color:#a7f3d0;}",
    ".sc-fb-close{position:absolute;top:.5rem;right:.7rem;background:none;border:none;color:rgba(224,218,246,0.5);font-size:1.25rem;cursor:pointer;line-height:1;}",
    ".sc-fb-close:hover{color:#e0daf6;}",
    "@media print{.sc-fb-btn,.sc-fb-panel{display:none !important;}}"
  ].join("");

  var EXPLORE_ITEMS = [
    { href: "/how-it-works/", label: "How It Works" },
    { href: "/explore/#the-twelve", label: "The Twelve Archetypes" },
    { href: "/explore/mindsets/", label: "Mindsets" },
    { href: "/explore/bandwidth/", label: "Bandwidth" },
    { href: "/explore/temperaments/", label: "Temperament" },
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
    if (p.indexOf("/companion") === 0) return "mira";
    // Account area — "My Account" is a runtime-added nav item, so nothing in the
    // static nav gets highlighted here; renderAuthNav() marks "My Account" active.
    if (p.indexOf("/account") === 0 || p.indexOf("/login") === 0 || p.indexOf("/register") === 0 ||
        p.indexOf("/forgot-password") === 0 || p.indexOf("/reset-password") === 0) return "account";
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
        '<a' + mact("mira") + ' href="/companion/">Mira</a>' +
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
          '<a class="' + cls("mira") + '" href="/companion/">Mira</a>' +
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
        // Deliberately low-key: plain, dim text, not in the main nav. The /admin
        // page is itself password-gated (X-Admin-Key), so this link only leads to
        // a prompt — nothing behind it opens without the existing admin key.
        '<a class="sc-foot-admin" href="/admin/">Admin</a>' +
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

  // The home page is reached with ?return=mandala / ?view=mine when the visitor
  // opens a SAVED reading via "My Results". On that landing the reading — not the
  // homepage — is what's showing, so highlight "My Results", not "Home". (This
  // runs before index.html's React effect strips the query string.)
  function syncResultsActive() {
    if (typeof document === "undefined") return;
    var params;
    try { params = new URLSearchParams(location.search); } catch (e) { return; }
    if (params.get("return") !== "mandala" && params.get("view") !== "mine") return;
    var header = document.getElementById("site-header");
    if (!header) return;
    var anchors = header.querySelectorAll(".sc-links a, #sc-mobile-menu a");
    for (var i = 0; i < anchors.length; i++) {
      var label = (anchors[i].textContent || "").trim();
      if (label === "Home") anchors[i].classList.remove("sc-active");
      if (label === "My Results") anchors[i].classList.add("sc-active");
    }
  }

  // --- Auth-aware nav (Task 3g) ---------------------------------------------
  // The baked nav is the logged-OUT default (real markup, crawlable). At runtime
  // we ask /api/me and, once, append the right affordance: "My Account" + "Log
  // Out" when signed in, "Log In" when signed out. The existing "My Results"
  // (magic-link) link stays for non-registered users either way.
  function doLogout() {
    // Clear per-user client state before leaving, so the next person on this
    // browser can't resurface the previous account's saved Mandala via the
    // "Return to Your Mandala" snapshot (or a stale pending-purchase snapshot).
    try {
      localStorage.removeItem("soulcraft_result_token");
      localStorage.removeItem("soulcraft_pending");
      localStorage.removeItem("mira_last_visit");
    } catch (e) { /* storage unavailable — nothing to clear */ }
    fetch("/api/logout", { method: "POST", credentials: "same-origin" })
      .then(function () { window.location.href = "/"; })
      .catch(function () { window.location.href = "/"; });
  }

  // Which account-area page are we on? "My Account" (or "Log In") is a runtime
  // nav item, so it's the one to highlight on /account, /login, /register.
  function onAccountArea() {
    try { return /^\/(account|login|register|forgot-password|reset-password)(\/|$)/.test(location.pathname); } catch (e) { return false; }
  }

  function renderAuthNav(authed) {
    if (typeof document === "undefined") return;
    var acct = onAccountArea();
    var links = document.querySelector("#site-header .sc-links");
    if (links && !links.querySelector(".sc-auth")) {
      if (authed) {
        var a = document.createElement("a");
        a.className = "sc-link sc-auth" + (acct ? " sc-active" : ""); a.href = "/account/"; a.textContent = "My Account";
        links.appendChild(a);
        var b = document.createElement("button");
        b.className = "sc-link sc-auth"; b.type = "button"; b.textContent = "Log Out";
        b.addEventListener("click", doLogout);
        links.appendChild(b);
      } else {
        var l = document.createElement("a");
        l.className = "sc-link sc-auth" + (acct ? " sc-active" : ""); l.href = "/login/"; l.textContent = "Log In";
        links.appendChild(l);
      }
    }
    var mobile = document.getElementById("sc-mobile-menu");
    if (mobile && !mobile.querySelector(".sc-auth")) {
      var actCls = acct ? ' class="sc-auth sc-active"' : ' class="sc-auth"';
      if (authed) {
        mobile.insertAdjacentHTML("beforeend",
          '<div class="sc-m-divider" role="separator"></div>' +
          '<a' + actCls + ' href="/account/">My Account</a>' +
          '<a class="sc-auth" href="#" role="button">Log Out</a>');
        var ml = mobile.querySelectorAll(".sc-auth");
        var last = ml[ml.length - 1];
        if (last) last.addEventListener("click", function (e) { e.preventDefault(); doLogout(); });
      } else {
        mobile.insertAdjacentHTML("beforeend",
          '<div class="sc-m-divider" role="separator"></div>' +
          '<a' + actCls + ' href="/login/">Log In</a>');
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

  // --- Funnel: return within 7 days (GA4) -----------------------------------
  // Stamp the first-ever visit; the first page of any LATER session that lands
  // between 30 min and 7 days after that first visit fires the event once.
  function trackReturnVisit() {
    if (typeof window === "undefined") return;
    try {
      var now = Date.now();
      var WEEK = 7 * 24 * 60 * 60 * 1000;
      if (window.sessionStorage.getItem("sc_session_seen")) return; // same session, not a return
      window.sessionStorage.setItem("sc_session_seen", "1");
      var first = window.localStorage.getItem("sc_first_visit");
      if (!first) { window.localStorage.setItem("sc_first_visit", String(now)); return; } // first ever visit
      if (window.localStorage.getItem("sc_return7_fired") === "1") return;
      var elapsed = now - parseInt(first, 10);
      if (elapsed > 30 * 60 * 1000 && elapsed <= WEEK) {
        window.localStorage.setItem("sc_return7_fired", "1");
        if (window.gtag) window.gtag("event", "return_within_7_days");
      }
    } catch (e) { /* storage blocked — skip */ }
  }

  // --- PWA service worker (Task 5) ------------------------------------------
  // Registered once from the shared chrome so it lives on every page. The worker
  // itself only caches a few static assets and never touches HTML or /api/*
  // (see /service-worker.js), so installing it can't make the app go stale.
  function registerServiceWorker() {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    if (typeof window === "undefined" || window.location.protocol === "file:") return;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/service-worker.js").then(function (reg) {
        // Force an update check on every load. An already-installed PWA otherwise
        // only re-checks the worker occasionally, so a stale worker (e.g. one from
        // before a code change) can keep controlling the app for a while. This makes
        // a new worker install promptly; it activates on the next navigation.
        if (reg && reg.update) { try { reg.update(); } catch (e) { /* ignore */ } }
      }).catch(function () { /* non-fatal */ });
    });
  }

  // --- Floating feedback widget --------------------------------------------
  // A chat-bubble button at bottom-right, sitewide, no login. Opens a small
  // panel: a 1–5 rating, a note, an optional follow-up email. Submits to
  // /api/feedback, which stores it in the `feedback` D1 table. The markup is
  // injected at runtime (not baked) so it appears identically on every page.
  function feedbackHtml() {
    var starsHtml = "";
    for (var n = 1; n <= 5; n++) {
      starsHtml += '<button type="button" class="sc-fb-star" data-v="' + n +
        '" role="radio" aria-checked="false" aria-label="' + n + ' out of 5">★</button>';
    }
    return '' +
      '<button id="sc-fb-btn" class="sc-fb-btn" type="button" aria-label="Give feedback" aria-expanded="false" title="How are we doing?">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
      '</button>' +
      '<div id="sc-fb-panel" class="sc-fb-panel" role="dialog" aria-label="Send feedback">' +
        '<button class="sc-fb-close" id="sc-fb-close" type="button" aria-label="Close feedback">×</button>' +
        '<p class="sc-fb-title">How are we doing?</p>' +
        '<p class="sc-fb-sub">Your honest take helps us shape Soulcraft.</p>' +
        '<div class="sc-fb-stars" id="sc-fb-stars" role="radiogroup" aria-label="Rating from 1 to 5">' + starsHtml + '</div>' +
        '<textarea id="sc-fb-txt" class="sc-fb-txt" maxlength="5000" placeholder="What\'s working? What\'s not?"></textarea>' +
        '<input id="sc-fb-email" class="sc-fb-email" type="email" maxlength="200" placeholder="Email (optional — if you\'d like us to follow up)">' +
        '<button id="sc-fb-send" class="sc-fb-send" type="button">Send feedback</button>' +
        '<p class="sc-fb-msg" id="sc-fb-msg" aria-live="polite"></p>' +
      '</div>';
  }

  function wireFeedback() {
    if (typeof document === "undefined") return;
    if (document.getElementById("sc-fb-btn")) return;        // inject once per page
    document.body.insertAdjacentHTML("beforeend", feedbackHtml());
    var btn = document.getElementById("sc-fb-btn");
    var panel = document.getElementById("sc-fb-panel");
    var closeBtn = document.getElementById("sc-fb-close");
    var stars = panel.querySelectorAll(".sc-fb-star");
    var txt = document.getElementById("sc-fb-txt");
    var email = document.getElementById("sc-fb-email");
    var send = document.getElementById("sc-fb-send");
    var msg = document.getElementById("sc-fb-msg");
    var rating = 0;
    function setRating(v) {
      rating = v;
      for (var i = 0; i < stars.length; i++) {
        stars[i].classList.toggle("sc-on", i < v);
        stars[i].setAttribute("aria-checked", (i + 1) === v ? "true" : "false");
      }
    }
    for (var i = 0; i < stars.length; i++) {
      (function (b) { b.addEventListener("click", function () { setRating(parseInt(b.getAttribute("data-v"), 10)); }); })(stars[i]);
    }
    function openPanel() { panel.classList.add("sc-fb-open"); btn.setAttribute("aria-expanded", "true"); setTimeout(function () { txt.focus(); }, 40); }
    function closePanel() { panel.classList.remove("sc-fb-open"); btn.setAttribute("aria-expanded", "false"); }
    btn.addEventListener("click", function () { panel.classList.contains("sc-fb-open") ? closePanel() : openPanel(); });
    closeBtn.addEventListener("click", closePanel);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && panel.classList.contains("sc-fb-open")) closePanel(); });
    send.addEventListener("click", function () {
      var message = (txt.value || "").trim();
      var mail = (email.value || "").trim();
      if (!rating && !message) { msg.className = "sc-fb-msg sc-fb-err"; msg.textContent = "Add a rating or a note first."; return; }
      if (mail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { msg.className = "sc-fb-msg sc-fb-err"; msg.textContent = "That email doesn't look right."; return; }
      msg.className = "sc-fb-msg"; msg.textContent = ""; send.disabled = true;
      fetch("/api/feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: rating || null, message: message, email: mail, page: location.pathname })
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          send.disabled = false;
          if (res.ok && res.j && res.j.ok) {
            try { if (window.gtag) window.gtag("event", "feedback_submitted", { rating: rating || 0 }); } catch (e) {}
            msg.className = "sc-fb-msg sc-fb-ok"; msg.textContent = "Thank you — we hear you.";
            setRating(0); txt.value = ""; email.value = "";
            setTimeout(closePanel, 1400);
          } else {
            msg.className = "sc-fb-msg sc-fb-err"; msg.textContent = (res.j && res.j.error) || "Couldn't send just now — please try again.";
          }
        })
        .catch(function () { send.disabled = false; msg.className = "sc-fb-msg sc-fb-err"; msg.textContent = "Couldn't reach the server — please try again."; });
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
    syncResultsActive: syncResultsActive,
    applyAuthNav: applyAuthNav,
    injectAnalytics: injectAnalytics,
    trackReturnVisit: trackReturnVisit,
    registerServiceWorker: registerServiceWorker,
    feedbackHtml: feedbackHtml,
    wireFeedback: wireFeedback
  };
});
