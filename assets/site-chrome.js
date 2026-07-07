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
    "#site-footer{border-top:1px solid rgba(196,181,253,0.10);margin-top:2rem;font-family:'Source Sans 3',system-ui,sans-serif;}",
    ".sc-foot{max-width:64rem;margin:0 auto;padding:2.5rem 1.25rem;font-size:14px;color:rgba(196,181,253,0.55);display:flex;flex-direction:column;gap:1rem;}",
    "@media(min-width:768px){.sc-foot{flex-direction:row;justify-content:space-between;} .sc-nav{padding:0 2rem;}}",
    ".sc-foot-links{display:flex;flex-wrap:wrap;gap:.5rem 1.25rem;}",
    ".sc-foot a{color:rgba(224,218,246,0.85);text-decoration:none;}.sc-foot a:hover{color:#fde68a;}",
    ".sc-foot-brand{font-family:'Cormorant Garamond',Georgia,serif;color:rgba(224,218,246,0.7);}"
  ].join("");

  var EXPLORE_ITEMS = [
    { href: "/explore/", label: "Overview" },
    { href: "/explore/#the-twelve", label: "The Twelve Archetypes" },
    { href: "/explore/bandwidth/", label: "Bandwidth" },
    { href: "/explore/embodiments/", label: "Embodiments" },
    { href: "/explore/core-needs/", label: "Core Needs" }
  ];

  function activeFromPath(p) {
    p = p || "/";
    if (p.indexOf("/explore") === 0) return "explore";
    if (p.indexOf("/pricing") === 0) return "pricing";
    return "home";
  }

  function headerHtml(active) {
    var menu = EXPLORE_ITEMS.map(function (it) {
      return '<a href="' + it.href + '">' + it.label + "</a>";
    }).join("");
    var cls = function (name) { return "sc-link" + (active === name ? " sc-active" : ""); };
    return '' +
      '<header id="site-header"><nav class="sc-nav" aria-label="Primary">' +
        '<a class="sc-brand" href="/">The Art of Soulcraft</a>' +
        '<div class="sc-links">' +
          '<a class="' + cls("home") + '" href="/">Home</a>' +
          '<div class="sc-dd">' +
            '<button id="sc-explore-btn" class="' + cls("explore") + '" aria-haspopup="true" aria-expanded="false">Explore <span style="font-size:.7em">▾</span></button>' +
            '<div class="sc-menu" id="sc-explore-menu">' + menu + '</div>' +
          '</div>' +
          '<a class="' + cls("pricing") + '" href="/pricing/">Pricing</a>' +
        '</div>' +
      '</nav></header>';
  }

  function footerHtml() {
    return '' +
      '<footer id="site-footer"><div class="sc-foot">' +
        '<p class="sc-foot-brand">The Art of Soulcraft <span style="opacity:.6">· a BridgeTender Studio project</span></p>' +
        '<div class="sc-foot-links">' +
          '<a href="/">Home</a><a href="/explore/">Overview</a><a href="/explore/bandwidth/">Bandwidth</a>' +
          '<a href="/explore/embodiments/">Embodiments</a><a href="/explore/core-needs/">Core Needs</a><a href="/pricing/">Pricing</a>' +
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

  return {
    CSS: CSS,
    headerHtml: headerHtml,
    footerHtml: footerHtml,
    activeFromPath: activeFromPath,
    wireDropdown: wireDropdown
  };
});
