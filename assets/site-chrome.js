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
      chrome.applyResultToken();
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
    else run();
    root.SITE_CHROME = chrome;
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

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
    ".sc-foot{max-width:64rem;margin:0 auto;padding:2.5rem 1.25rem;font-size:14px;color:rgba(196,181,253,0.55);display:flex;flex-direction:column;gap:1rem;}",
    "@media(min-width:768px){.sc-foot{flex-direction:row;justify-content:space-between;} .sc-nav{padding:0 2rem;}}",
    ".sc-foot-links{display:flex;flex-wrap:wrap;gap:.5rem 1.25rem;}",
    ".sc-foot a{color:rgba(224,218,246,0.85);text-decoration:none;}.sc-foot a:hover{color:#fde68a;}",
    ".sc-foot-brand{font-family:'Cormorant Garamond',Georgia,serif;color:rgba(224,218,246,0.7);}",
    "#sc-return-banner{position:relative;display:flex;align-items:center;justify-content:center;gap:.75rem;background:rgba(253,230,138,0.12);border-bottom:1px solid rgba(253,230,138,0.22);font-family:'Source Sans 3',system-ui,sans-serif;padding:.5rem 2.5rem;text-align:center;}",
    ".sc-return-link{color:#fde8b0;text-decoration:none;font-size:14px;font-weight:600;}",
    ".sc-return-link:hover{color:#fff6d8;text-decoration:underline;}",
    ".sc-return-dismiss{position:absolute;right:.6rem;top:50%;transform:translateY(-50%);background:none;border:0;color:rgba(253,232,176,0.7);font-size:20px;line-height:1;cursor:pointer;padding:.15rem .4rem;}",
    ".sc-return-dismiss:hover{color:#fde8b0;}"
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
    return "home";
  }

  function headerHtml(active) {
    var menu = EXPLORE_ITEMS.map(function (it) {
      if (it.divider) return '<div class="sc-menu-divider" role="separator"></div>';
      return '<a href="' + it.href + '">' + it.label + "</a>";
    }).join("");
    var cls = function (name) { return "sc-link" + (active === name ? " sc-active" : ""); };
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
      '</nav></header>';
  }

  function footerHtml() {
    return '' +
      '<footer id="site-footer"><div class="sc-foot">' +
        '<p class="sc-foot-brand">The Art of Soulcraft <span style="opacity:.6">· a BridgeTender Studio project</span></p>' +
        '<div class="sc-foot-links">' +
          '<a href="/">Home</a><a href="/about/">About</a><a href="/how-it-works/">How It Works</a><a href="/explore/bandwidth/">Bandwidth</a>' +
          '<a href="/explore/temperaments/">Temperament</a><a href="/explore/core-needs/">Core Needs</a><a href="/explore/growth-edge/">Growth Edge</a><a href="/integration-guide/">Integration Guide</a><a href="/pricing/">Pricing</a><a href="/contact/">Work with us</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a>' +
        '</div>' +
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

  return {
    CSS: CSS,
    headerHtml: headerHtml,
    footerHtml: footerHtml,
    activeFromPath: activeFromPath,
    wireDropdown: wireDropdown,
    readResultToken: readResultToken,
    applyResultToken: applyResultToken
  };
});
