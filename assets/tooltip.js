/* ============================================================================
   THE ART OF SOULCRAFT — TOOLTIP / POPOVER RUNTIME (one reusable component)
   ----------------------------------------------------------------------------
   Reads definitions from /assets/tooltips.js (window.TOOLTIPS) — never hardcoded
   per page. Any element marked up as:

       <span class="tooltip-trigger" data-term="mandala">Mandala</span>

   becomes a click-to-open popover. Behavior (per the master definitions file):
     • Click to open, click anywhere else (or Esc) to close — NOT hover, so it
       works on touch devices.
     • Only one popover open at a time.
     • Positions above or below the trigger depending on available space, and is
       clamped to the viewport horizontally.
     • On narrow screens it opens as a centered bottom sheet with a backdrop.
   Namespaced `sc-tip-*` so it never collides with page styles. Self-contained:
   include /assets/tooltips.js then this file; no other wiring needed.
   ============================================================================ */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var CSS = [
    ".tooltip-trigger{color:#fde8b0;cursor:pointer;border:0;background:none;font:inherit;padding:0;",
      "text-decoration:underline;text-decoration-style:dotted;text-decoration-thickness:1px;text-underline-offset:3px;",
      "text-decoration-color:rgba(253,232,176,0.5);}",
    ".tooltip-trigger:hover,.tooltip-trigger:focus{text-decoration-color:#fde8b0;outline:none;}",
    ".tooltip-trigger[aria-expanded=\"true\"]{text-decoration-color:#fde8b0;}",
    "#sc-tip-pop{position:fixed;z-index:60;max-width:20rem;width:max-content;",
      "background:#1f1940;border:1px solid rgba(196,181,253,0.30);border-radius:.75rem;",
      "box-shadow:0 12px 34px rgba(0,0,0,0.5);padding:.85rem 1rem;",
      "font-family:'Source Sans 3',system-ui,sans-serif;color:#efe9ff;",
      "opacity:0;transform:translateY(4px);transition:opacity .12s ease,transform .12s ease;pointer-events:none;}",
    "#sc-tip-pop.sc-tip-open{opacity:1;transform:translateY(0);pointer-events:auto;}",
    "#sc-tip-pop .sc-tip-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.15rem;",
      "line-height:1.15;color:#fde8b0;margin:0 0 .3rem;}",
    "#sc-tip-pop .sc-tip-def{font-size:.83rem;line-height:1.5;color:rgba(224,218,246,0.9);margin:0;}",
    "#sc-tip-backdrop{position:fixed;inset:0;z-index:59;background:rgba(10,7,24,0.55);",
      "opacity:0;transition:opacity .12s ease;pointer-events:none;}",
    "#sc-tip-backdrop.sc-tip-open{opacity:1;pointer-events:auto;}",
    "@media (max-width:640px){",
      "#sc-tip-pop{position:fixed;left:1rem;right:1rem;bottom:1rem;top:auto;width:auto;max-width:none;",
        "transform:translateY(12px);padding:1.1rem 1.15rem;}",
      "#sc-tip-pop.sc-tip-open{transform:translateY(0);}",
      "#sc-tip-pop .sc-tip-title{font-size:1.3rem;}",
      "#sc-tip-pop .sc-tip-def{font-size:.92rem;}",
    "}"
  ].join("");

  var pop, backdrop, current = null;

  function ensureNodes() {
    if (pop) return;
    var style = document.getElementById("sc-tip-styles");
    if (!style) {
      style = document.createElement("style");
      style.id = "sc-tip-styles";
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    backdrop = document.createElement("div");
    backdrop.id = "sc-tip-backdrop";
    backdrop.addEventListener("click", close);
    document.body.appendChild(backdrop);

    pop = document.createElement("div");
    pop.id = "sc-tip-pop";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-live", "polite");
    // Clicks inside the popover shouldn't bubble up to the document close handler.
    pop.addEventListener("click", function (e) { e.stopPropagation(); });
    document.body.appendChild(pop);
  }

  function isMobile() {
    return (window.matchMedia && window.matchMedia("(max-width:640px)").matches) ||
      window.innerWidth <= 640;
  }

  function close() {
    if (!current) return;
    pop.classList.remove("sc-tip-open");
    backdrop.classList.remove("sc-tip-open");
    if (current.setAttribute) current.setAttribute("aria-expanded", "false");
    current = null;
  }

  function position(trigger) {
    if (isMobile()) return; // CSS pins the mobile bottom sheet — no JS math needed.
    var margin = 8;
    var r = trigger.getBoundingClientRect();
    var pw = pop.offsetWidth, ph = pop.offsetHeight;
    var vw = document.documentElement.clientWidth;
    var vh = document.documentElement.clientHeight;

    // Prefer below; flip above when there isn't room below but there is above.
    var below = r.bottom + margin + ph <= vh;
    var top = below ? (r.bottom + margin) : Math.max(margin, r.top - margin - ph);

    // Center horizontally on the trigger, then clamp into the viewport.
    var left = r.left + r.width / 2 - pw / 2;
    left = Math.max(margin, Math.min(left, vw - pw - margin));
    pop.style.left = left + "px";
    pop.style.top = top + "px";
  }

  function open(trigger) {
    var term = trigger.getAttribute("data-term");
    var defs = window.TOOLTIPS || {};
    var entry = defs[term];
    if (!entry) return; // unknown term — leave the word as plain text
    ensureNodes();

    // Toggle off if the same trigger is clicked again.
    if (current === trigger) { close(); return; }
    close();

    pop.innerHTML = "";
    var h = document.createElement("p");
    h.className = "sc-tip-title";
    h.textContent = entry.title || term;
    var d = document.createElement("p");
    d.className = "sc-tip-def";
    d.textContent = entry.def || "";
    pop.appendChild(h);
    pop.appendChild(d);

    // Reset any prior mobile/desktop inline positioning so measurement is clean.
    if (isMobile()) {
      pop.style.left = ""; pop.style.top = "";
      backdrop.classList.add("sc-tip-open");
    } else {
      backdrop.classList.remove("sc-tip-open");
    }
    // Make it measurable, place it, then reveal.
    pop.style.visibility = "hidden";
    pop.classList.add("sc-tip-open");
    position(trigger);
    pop.style.visibility = "";

    trigger.setAttribute("aria-expanded", "true");
    current = trigger;
  }

  function onDocClick(e) {
    var trigger = e.target.closest && e.target.closest(".tooltip-trigger");
    if (trigger) {
      e.preventDefault();
      e.stopPropagation();
      open(trigger);
      return;
    }
    // A click anywhere outside an open popover closes it.
    if (current && !(pop && pop.contains(e.target))) close();
  }

  function wire() {
    // Give every trigger the affordances of a real button, without changing markup.
    var triggers = document.querySelectorAll(".tooltip-trigger");
    for (var i = 0; i < triggers.length; i++) {
      var t = triggers[i];
      if (t.getAttribute("data-tip-wired")) continue;
      t.setAttribute("data-tip-wired", "1");
      t.setAttribute("role", "button");
      t.setAttribute("tabindex", "0");
      t.setAttribute("aria-expanded", "false");
      t.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(this); }
      });
    }
  }

  function init() {
    wire();
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    // Reposition-by-closing on scroll/resize keeps the card from drifting off its word.
    window.addEventListener("scroll", function () { if (current && !isMobile()) close(); }, true);
    window.addEventListener("resize", close);
    // In case triggers are injected after load (e.g. the assessment SPA), re-wire.
    if (window.MutationObserver) {
      new MutationObserver(wire).observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
