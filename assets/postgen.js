/* ============================================================================
   THE ART OF SOULCRAFT — POST GENERATOR (shared module)
   ----------------------------------------------------------------------------
   The Instagram content container — one visual shell, six modes (Quote, Pattern,
   Archetype, Mindset, Axial Q, Definition) — extracted from the old standalone
   /admin/postgen page so it can be MOUNTED inside the admin dashboard's POSTS
   tab. There is now ONE definition of this tool; /admin/postgen 301-redirects to
   the POSTS tab (see _redirects), and this module is what that tab renders.

   Usage (browser):
     <script src="/assets/soulcraft-data.js"></script>  // ARCHETYPES / HUE / SOULCRAFT
     <script src="/assets/postgen.js"></script>
     SOULCRAFT_POSTGEN.mount(containerEl);

   Depends on the canonical wheel data (ARCHETYPES, HUE, SOULCRAFT) being present
   as globals — colors, the Mindset formula, and axis questions all come from
   there, never re-typed. All markup/classes are namespaced `pg-` and all styles
   are scoped under `.pg-root`, so mounting inside another app (the admin shell)
   never collides with that app's own .card/.tabs/.tab classes.
   ============================================================================ */
(function (root) {
  "use strict";

  var STYLE_ID = "pg-styles";
  var CSS =
    // Self-hosted Cormorant Garamond — the site's real serif, so the canvas
    // renders the true typeface and never falls back to a system serif.
    "@font-face{font-family:'Cormorant Garamond';font-style:normal;font-weight:500;font-display:swap;src:url('/assets/fonts/cormorant-500.woff2') format('woff2');}" +
    "@font-face{font-family:'Cormorant Garamond';font-style:normal;font-weight:600;font-display:swap;src:url('/assets/fonts/cormorant-600.woff2') format('woff2');}" +
    "@font-face{font-family:'Cormorant Garamond';font-style:italic;font-weight:500;font-display:swap;src:url('/assets/fonts/cormorant-500-italic.woff2') format('woff2');}" +
    ".pg-root{--pg-ink:#f5f3ff;color:var(--pg-ink);font-family:'Source Sans 3',system-ui,sans-serif;}" +
    ".pg-lead{color:rgba(224,218,246,0.65);font-size:14px;margin:0 0 1.5rem;max-width:42rem;}" +
    ".pg-grid{display:grid;grid-template-columns:1fr;gap:2rem;}" +
    "@media(min-width:880px){.pg-grid{grid-template-columns:1fr 1fr;align-items:start;}}" +
    ".pg-panel-card{background:rgba(255,250,240,0.03);border:1px solid rgba(196,181,253,0.18);border-radius:1rem;padding:1.5rem;}" +
    ".pg-root label{display:block;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:rgba(224,218,246,0.65);margin:1rem 0 .4rem;}" +
    ".pg-root label.pg-first{margin-top:0;}" +
    ".pg-root input[type=text],.pg-root textarea,.pg-root select{width:100%;background:rgba(0,0,0,0.22);border:1px solid rgba(196,181,253,0.25);border-radius:.6rem;padding:.6rem .75rem;font:inherit;font-size:15px;color:#f5f3ff;outline:none;resize:vertical;}" +
    ".pg-root input:focus,.pg-root textarea:focus,.pg-root select:focus{border-color:rgba(253,230,138,0.6);}" +
    ".pg-root textarea{min-height:3.25rem;line-height:1.4;}" +
    ".pg-tabs{display:flex;gap:.35rem;margin-bottom:1.25rem;flex-wrap:wrap;}" +
    ".pg-tab{flex:1 0 auto;min-width:4.3rem;padding:.5rem .45rem;border-radius:.6rem;border:1px solid rgba(196,181,253,0.22);background:rgba(0,0,0,0.2);color:rgba(224,218,246,0.8);font:inherit;font-weight:600;font-size:13px;cursor:pointer;}" +
    ".pg-tab.on{border-color:rgba(253,230,138,0.6);background:rgba(253,230,138,0.12);color:#fde8b0;}" +
    ".pg-two{display:grid;grid-template-columns:1fr 1fr;gap:.6rem;}" +
    ".pg-hint{font-size:12px;color:rgba(224,218,246,0.5);margin:.35rem 0 0;}" +
    ".pg-actions{margin-top:1.5rem;display:flex;gap:.75rem;align-items:center;}" +
    ".pg-go{background:rgba(253,230,138,0.9);color:#1b1430;border:0;border-radius:.6rem;padding:.7rem 1.3rem;font:inherit;font-weight:600;cursor:pointer;}" +
    ".pg-go:hover{background:#fde8b0;}" +
    ".pg-go:disabled{opacity:.45;cursor:default;}" +
    ".pg-note{font-size:12.5px;color:rgba(224,218,246,0.55);}" +
    ".pg-preview-wrap{position:sticky;top:1.5rem;}" +
    ".pg-canvas-frame{width:100%;max-width:34rem;margin:0 auto;border-radius:1rem;overflow:hidden;border:1px solid rgba(196,181,253,0.18);box-shadow:0 18px 50px rgba(0,0,0,0.5);}" +
    ".pg-canvas-frame canvas{display:block;width:100%;height:auto;}" +
    ".pg-swap{display:none;}.pg-swap.on{display:block;}";

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  var MARKUP =
    '<p class="pg-lead">One shared visual shell, six modes. Every copy field is plain text — the tool renders only what you type. Colors, the Mindset formula, and axis questions come from the canonical wheel data. Download a square PNG.</p>' +
    '<div class="pg-grid">' +
      '<div class="pg-panel-card">' +
        '<div class="pg-tabs" data-pg="tabs">' +
          '<button class="pg-tab on" data-mode="quote" type="button">Quote</button>' +
          '<button class="pg-tab" data-mode="pattern" type="button">Pattern</button>' +
          '<button class="pg-tab" data-mode="archetype" type="button">Archetype</button>' +
          '<button class="pg-tab" data-mode="mindset" type="button">Mindset</button>' +
          '<button class="pg-tab" data-mode="axial" type="button">Axial Q</button>' +
          '<button class="pg-tab" data-mode="definitions" type="button">Definition</button>' +
        '</div>' +
        '<div class="pg-swap on" data-pg="mode-quote">' +
          '<label class="pg-first">Quote</label>' +
          '<textarea data-pg="q-text" placeholder="Until you make the unconscious conscious, it will direct your life — and you\'ll call it fate."></textarea>' +
          '<label>Attribution — rendered as “— …”. Use “Soulcraft” for our own lines.</label>' +
          '<input type="text" data-pg="q-attr" placeholder="after Carl Jung" />' +
        '</div>' +
        '<div class="pg-swap" data-pg="mode-pattern">' +
          '<label class="pg-first">Pattern name</label><input type="text" data-pg="p-name" placeholder="Cynicism" />' +
          '<label>Bandwidth tag — gold italic (plain language)</label><input type="text" data-pg="p-band" placeholder="low bandwidth" />' +
          '<label>Definition — one sentence</label><textarea data-pg="p-def" placeholder="Discernment that\'s stopped believing anything can go right."></textarea>' +
          '<label>Freer expression — the payoff (gold)</label><input type="text" data-pg="p-freer" placeholder="Discernment that leaves room for hope." />' +
          '<p class="pg-hint">Protective Patterns Atlas or archetype Bandwidth-stage names — same structure.</p>' +
        '</div>' +
        '<div class="pg-swap" data-pg="mode-archetype">' +
          '<label class="pg-first">Archetype — sets the wheel-color dot + prefills</label><select data-pg="a-select"></select>' +
          '<label>Name</label><input type="text" data-pg="a-name" placeholder="Lover" />' +
          '<label>Longing — one line</label><input type="text" data-pg="a-def" placeholder="longs for union" />' +
          '<label>Axial question</label><input type="text" data-pg="a-axis" placeholder="Do you trust what you feel, or what you can prove?" />' +
        '</div>' +
        '<div class="pg-swap" data-pg="mode-mindset">' +
          '<label class="pg-first">Parent archetypes — two dots + formula</label>' +
          '<div class="pg-two"><select data-pg="m-a"></select><select data-pg="m-b"></select></div>' +
          '<label>Mindset name</label><input type="text" data-pg="m-name" placeholder="The Charmer" />' +
          '<label>Formula (auto)</label><input type="text" data-pg="m-formula" readonly />' +
          '<label>Short descriptor</label><textarea data-pg="m-desc" placeholder="Warmth that opens any door — connection as a kind of play."></textarea>' +
        '</div>' +
        '<div class="pg-swap" data-pg="mode-axial">' +
          '<label class="pg-first">Axis — prefills question + subtitle</label><select data-pg="ax-select"></select>' +
          '<label>Question</label><textarea data-pg="ax-q" placeholder="Do you trust what you feel, or what you can prove?"></textarea>' +
          '<label>Axis subtitle (no leading dash)</label><input type="text" data-pg="ax-axis" placeholder="Lover ↔ Sage" />' +
        '</div>' +
        '<div class="pg-swap" data-pg="mode-definitions">' +
          '<label class="pg-first">Term</label><input type="text" data-pg="d-term" placeholder="Cynic" />' +
          '<label>Category — small caps, quiet (e.g. Sage, low bandwidth · protective pattern)</label><input type="text" data-pg="d-cat" placeholder="Sage, low bandwidth" />' +
          '<label>Definition — plain</label><textarea data-pg="d-def" placeholder="The Sage\'s voice curdled into contempt — truth that no longer believes anything can go right."></textarea>' +
        '</div>' +
        '<label>Instagram handle</label>' +
        '<input type="text" data-pg="handle" value="artofsoulcraft" />' +
        '<div class="pg-actions"><button class="pg-go" data-pg="download" type="button">Download image</button><span class="pg-note" data-pg="status"></span></div>' +
      '</div>' +
      '<div class="pg-preview-wrap">' +
        '<div class="pg-canvas-frame"><canvas data-pg="canvas" width="1080" height="1080"></canvas></div>' +
        '<p class="pg-note" style="text-align:center;margin-top:.75rem;">1080 × 1080 · PNG</p>' +
      '</div>' +
    '</div>';

  // Mount the generator into `container`. Idempotent per element (guards against
  // a double-mount when the POSTS tab is re-activated).
  function mount(container) {
    if (!container || container.getAttribute("data-pg-mounted")) return;
    ensureStyles();
    container.classList.add("pg-root");
    container.innerHTML = MARKUP;
    container.setAttribute("data-pg-mounted", "1");
    run(container);
  }

  function run(container) {
    var A_LIST = (typeof root.ARCHETYPES !== "undefined" && root.ARCHETYPES) || [];
    var HUEFN = (typeof root.HUE === "function") ? root.HUE : function (i) { return i * 30; };
    var SC = (typeof root.SOULCRAFT !== "undefined") ? root.SOULCRAFT : {};
    var PAIR = SC.pairingName || function () { return null; };
    var AXQ = SC.axisQuestion || function () { return null; };

    // Scope every lookup to this container so multiple admin panels never clash.
    var $ = function (id) { return container.querySelector('[data-pg="' + id + '"]'); };
    var canvas = $("canvas"), ctx = canvas.getContext("2d");
    var W = 1080, PAD = 112, CONTENT_W = W - PAD * 2, TOP = 130, BOTTOM = 872;

    var INK = "#f5f3ff", VIOLET = "rgba(224,218,246,0.82)", INDIGO = "rgba(178,170,236,0.72)";
    var AMBER = "#fde8b0", AMBER_DIM = "rgba(253,230,138,0.82)";
    var SERIF = "'Cormorant Garamond', Georgia, serif";
    var SANS = "'Source Sans 3', system-ui, sans-serif";

    var QUOTE_SIZE = 72, AXIAL_SIZE = 76;
    var mode = "quote";

    // ---- data helpers -----------------------------------------------------
    function archIndex(k) { for (var i = 0; i < A_LIST.length; i++) if (A_LIST[i].key === k) return i; return -1; }
    function archColor(k) { var i = archIndex(k); return i < 0 ? "hsl(0,0%,60%)" : "hsl(" + HUEFN(i) + ",62%,56%)"; }
    function arch(k) { for (var i = 0; i < A_LIST.length; i++) if (A_LIST[i].key === k) return A_LIST[i]; return null; }
    function archName(k) { var a = arch(k); return a ? a.name : k; }
    function archLonging(k) { var a = arch(k); return a ? ("longs " + (a.longingVerb ? "to " : "for ") + a.longing) : ""; }
    function sortedKeys(a, b) { return [a, b].sort(); }
    function mindsetFormula(a, b) { if (!a || !b) return ""; var s = sortedKeys(a, b); return "(" + archName(s[0]) + " × " + archName(s[1]) + ")"; }
    function axisLabel(k) { var a = arch(k); if (!a) return ""; var opp = A_LIST.filter(function (x) { return x.name === a.opposite; })[0]; if (!opp) return ""; var lo = archIndex(a.key) < archIndex(opp.key) ? a : opp, hi = lo === a ? opp : a; return lo.name + " ↔ " + hi.name; }

    // ---- text helpers -----------------------------------------------------
    function wrapText(text, maxWidth) {
      var words = String(text || "").trim().split(/\s+/), lines = [], cur = "";
      if (!words[0]) return [];
      for (var i = 0; i < words.length; i++) { var t = cur ? cur + " " + words[i] : words[i]; if (ctx.measureText(t).width > maxWidth && cur) { lines.push(cur); cur = words[i]; } else cur = t; }
      if (cur) lines.push(cur); return lines;
    }
    function drawDot(cx, cy, r, color) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(255,252,240,0.92)"; ctx.stroke();
    }

    // ---- block engine -----------------------------------------------------
    function measure(b) {
      if (b.type === "dot" || b.type === "dots") { b._h = b.r * 2 + 8; return; }
      ctx.font = b.font; ctx.letterSpacing = b.ls || "0px"; b._lines = wrapText(b.text, CONTENT_W); b._h = b._lines.length * b.lineHeight; ctx.letterSpacing = "0px";
    }
    function draw(b, x0, y, family) {
      if (b.type === "dot") { drawDot(W / 2, y + b.r + 4, b.r, b.color); return y + b._h; }
      if (b.type === "dots") { var gap = b.r * 1.4, tot = b.r * 4 + gap, sx = W / 2 - tot / 2; drawDot(sx + b.r, y + b.r + 4, b.r, b.colors[0]); drawDot(sx + b.r * 3 + gap, y + b.r + 4, b.r, b.colors[1]); return y + b._h; }
      ctx.font = b.font; ctx.fillStyle = b.color; ctx.letterSpacing = b.ls || "0px";
      var left = family === "leftblock";
      ctx.textAlign = left ? "left" : "center"; ctx.textBaseline = "top";
      var tx = left ? x0 : W / 2;
      for (var i = 0; i < b._lines.length; i++) { ctx.fillText(b._lines[i], tx, y); y += b.lineHeight; }
      ctx.letterSpacing = "0px"; return y;
    }
    function layout(blocks, family) {
      blocks = blocks.filter(Boolean); blocks.forEach(measure); blocks = blocks.filter(function (b) { return b._h > 0; });
      var total = 0; blocks.forEach(function (b) { total += b._h + (b.gapAfter || 0); });
      if (blocks.length) total -= (blocks[blocks.length - 1].gapAfter || 0);
      var x0 = PAD;
      if (family === "leftblock") {
        var maxW = 0;
        blocks.forEach(function (b) { if (!b._lines) return; ctx.font = b.font; ctx.letterSpacing = b.ls || "0px"; b._lines.forEach(function (l) { maxW = Math.max(maxW, ctx.measureText(l).width); }); });
        ctx.letterSpacing = "0px"; x0 = Math.max(PAD, (W - maxW) / 2);
      }
      var y = TOP + Math.max(0, ((BOTTOM - TOP) - total) / 2);
      for (var i = 0; i < blocks.length; i++) { y = draw(blocks[i], x0, y, family); y += (blocks[i].gapAfter || 0); }
    }

    // ---- shell ------------------------------------------------------------
    function background() {
      var g = ctx.createRadialGradient(W / 2, -80, 120, W / 2, 430, 1180);
      g.addColorStop(0, "#241d42"); g.addColorStop(0.42, "#171230"); g.addColorStop(1, "#100c22");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
      ctx.strokeStyle = "rgba(196,181,253,0.14)"; ctx.lineWidth = 2; ctx.strokeRect(40, 40, W - 80, W - 80);
    }
    function drawMandala(cx, cy, R) {
      // Palette comes from the shared wheel data (HUEFN = HUE from
      // assets/soulcraft-data.js), never a re-typed hue formula, so this footer
      // mark stays in lock-step with the site + reel palette.
      for (var i = 0; i < 12; i++) { var a = (-90 + i * 30) * Math.PI / 180; ctx.beginPath(); ctx.arc(cx + R * Math.cos(a), cy + R * Math.sin(a), R * 0.16, 0, Math.PI * 2); ctx.fillStyle = "hsl(" + HUEFN(i) + ",62%,58%)"; ctx.fill(); }
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.55); g.addColorStop(0, "rgba(255,252,240,0.9)"); g.addColorStop(1, "rgba(255,246,214,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.2, 0, Math.PI * 2); ctx.fillStyle = "rgb(255,252,240)"; ctx.fill();
    }
    function footer() {
      drawMandala(W / 2, 901, 33);
      ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.letterSpacing = "0px";
      ctx.font = "500 52px " + SERIF; ctx.fillStyle = "rgba(245,243,255,0.9)"; ctx.fillText("The Art of Soulcraft", W / 2, 942);
      var h = $("handle").value.replace(/^@+/, "").trim() || "artofsoulcraft";
      ctx.font = "400 34px " + SANS; ctx.fillStyle = "rgba(253,230,138,0.78)"; ctx.letterSpacing = "0.6px"; ctx.fillText("follow @" + h, W / 2, 1000); ctx.letterSpacing = "0px";
    }
    function catLabel(text) { return { type: "text", text: text, font: "600 21px " + SANS, color: AMBER_DIM, ls: "4px", lineHeight: 32, gapAfter: 18 }; }
    function bigQuoteMark() { ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.font = "600 150px " + SERIF; ctx.fillStyle = "rgba(253,230,138,0.26)"; ctx.fillText("“", W / 2, TOP + 10); }

    // ---- modes ------------------------------------------------------------
    function renderQuote() {
      var text = $("q-text").value.trim() || "A line worth keeping.", attr = $("q-attr").value.trim();
      bigQuoteMark();
      layout([
        { type: "text", text: text, font: "500 italic " + QUOTE_SIZE + "px " + SERIF, color: INK, lineHeight: QUOTE_SIZE + 16, gapAfter: attr ? 48 : 0 },
        attr ? { type: "text", text: "— " + attr, font: "500 32px " + SERIF, color: INDIGO, lineHeight: 42 } : null
      ], "center");
    }
    function renderPattern() {
      var name = $("p-name").value.trim(), band = $("p-band").value.trim(), def = $("p-def").value.trim();
      var freer = $("p-freer").value.trim();
      layout([
        name ? { type: "text", text: name, font: "600 84px " + SERIF, color: INK, lineHeight: 96, gapAfter: band ? 6 : 26 } : null,
        band ? { type: "text", text: band, font: "500 italic 32px " + SERIF, color: AMBER, lineHeight: 44, gapAfter: 28 } : null,
        def ? { type: "text", text: def, font: "500 36px " + SERIF, color: VIOLET, lineHeight: 50, gapAfter: 40 } : null,
        freer ? { type: "text", text: "With conscious choice, it can become:", font: "500 32px " + SERIF, color: "rgba(245,243,255,0.92)", lineHeight: 42, gapAfter: 12 } : null,
        freer ? { type: "text", text: freer, font: "500 46px " + SERIF, color: AMBER, lineHeight: 58 } : null
      ], "leftblock");
    }
    function renderArchetype() {
      var key = $("a-select").value, name = $("a-name").value.trim(), def = $("a-def").value.trim(), axis = $("a-axis").value.trim();
      layout([
        key ? { type: "dot", r: 26, color: archColor(key), gapAfter: 26 } : null,
        catLabel("ARCHETYPE"),
        name ? { type: "text", text: name, font: "600 98px " + SERIF, color: INK, lineHeight: 110, gapAfter: 14 } : null,
        def ? { type: "text", text: def, font: "500 38px " + SERIF, color: VIOLET, lineHeight: 50, gapAfter: axis ? 26 : 0 } : null,
        axis ? { type: "text", text: "“" + axis + "”", font: "500 italic 33px " + SERIF, color: INDIGO, lineHeight: 46 } : null
      ], "center");
    }
    function renderMindset() {
      var ka = $("m-a").value, kb = $("m-b").value, name = $("m-name").value.trim(), desc = $("m-desc").value.trim();
      var s = (ka && kb) ? sortedKeys(ka, kb) : null;
      layout([
        s ? { type: "dots", r: 22, colors: [archColor(s[0]), archColor(s[1])], gapAfter: 24 } : null,
        catLabel("MINDSET"),
        name ? { type: "text", text: name, font: "600 78px " + SERIF, color: INK, lineHeight: 90, gapAfter: 8 } : null,
        (ka && kb) ? { type: "text", text: mindsetFormula(ka, kb), font: "500 italic 31px " + SERIF, color: INDIGO, lineHeight: 42, gapAfter: 22 } : null,
        desc ? { type: "text", text: desc, font: "500 35px " + SERIF, color: VIOLET, lineHeight: 48 } : null
      ], "center");
    }
    function renderAxial() {
      var q = $("ax-q").value.trim() || "A question worth sitting with.", axis = $("ax-axis").value.trim();
      bigQuoteMark();
      layout([
        { type: "text", text: q, font: "500 italic " + AXIAL_SIZE + "px " + SERIF, color: INK, lineHeight: AXIAL_SIZE + 16, gapAfter: axis ? 48 : 0 },
        axis ? { type: "text", text: axis, font: "500 32px " + SERIF, color: INDIGO, lineHeight: 42 } : null
      ], "center");
    }
    function renderDefinitions() {
      var term = $("d-term").value.trim(), cat = $("d-cat").value.trim(), def = $("d-def").value.trim();
      layout([
        term ? { type: "text", text: term, font: "600 94px " + SERIF, color: INK, lineHeight: 106, gapAfter: cat ? 12 : 26 } : null,
        cat ? { type: "text", text: cat.toUpperCase(), font: "600 22px " + SANS, color: INDIGO, ls: "3px", lineHeight: 32, gapAfter: 30 } : null,
        def ? { type: "text", text: def, font: "500 37px " + SERIF, color: VIOLET, lineHeight: 51 } : null
      ], "leftblock");
    }
    function render() {
      background();
      ({ quote: renderQuote, pattern: renderPattern, archetype: renderArchetype, mindset: renderMindset, axial: renderAxial, definitions: renderDefinitions })[mode]();
      footer(); updateDownloadState();
    }

    // ---- download ---------------------------------------------------------
    function hasContent() {
      if (mode === "quote") return !!$("q-text").value.trim();
      if (mode === "pattern") return !!($("p-name").value.trim() && $("p-freer").value.trim());
      if (mode === "archetype") return !!$("a-name").value.trim();
      if (mode === "mindset") return !!($("m-name").value.trim() && $("m-a").value && $("m-b").value);
      if (mode === "axial") return !!$("ax-q").value.trim();
      return !!($("d-term").value.trim() && $("d-def").value.trim());
    }
    function updateDownloadState() {
      var ok = hasContent(); $("download").disabled = !ok;
      $("status").textContent = ok ? "" : ({ quote: "Enter a quote.", pattern: "Needs a name and a freer expression.", archetype: "Enter a name.", mindset: "Pick both parents and enter a name.", axial: "Enter a question.", definitions: "Needs a term and a definition." })[mode];
    }
    function slug(s) { return String(s || "post").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "post"; }
    function download() {
      var base = { quote: "q-text", pattern: "p-name", archetype: "a-name", mindset: "m-name", axial: "ax-q", definitions: "d-term" }[mode];
      canvas.toBlob(function (blob) {
        var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "soulcraft-" + mode + "-" + slug($(base).value) + ".png";
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000); $("status").textContent = "Downloaded.";
      }, "image/png");
    }

    // ---- wiring -----------------------------------------------------------
    var tabs = container.querySelectorAll('[data-pg="tabs"] .pg-tab');
    for (var t = 0; t < tabs.length; t++) (function (btn) {
      btn.addEventListener("click", function () {
        mode = btn.getAttribute("data-mode");
        for (var k = 0; k < tabs.length; k++) tabs[k].classList.toggle("on", tabs[k] === btn);
        ["quote", "pattern", "archetype", "mindset", "axial", "definitions"].forEach(function (m) { $("mode-" + m).classList.toggle("on", m === mode); });
        render();
      });
    })(tabs[t]);

    function fillArchSelect(sel, blank) { sel.appendChild(new Option(blank, "")); A_LIST.forEach(function (a) { sel.appendChild(new Option(a.name, a.key)); }); }
    fillArchSelect($("a-select"), "— choose —"); fillArchSelect($("m-a"), "— parent A —"); fillArchSelect($("m-b"), "— parent B —");
    var axSel = $("ax-select"); axSel.appendChild(new Option("— choose an axis —", ""));
    ["lover", "caregiver", "everyman", "ruler", "warrior", "creator"].forEach(function (k) { if (arch(k)) axSel.appendChild(new Option(axisLabel(k), k)); });

    $("a-select").addEventListener("change", function () { var k = $("a-select").value; if (k) { $("a-name").value = archName(k); $("a-def").value = archLonging(k); $("a-axis").value = AXQ(k) || ""; } render(); });
    function syncMindset() { var ka = $("m-a").value, kb = $("m-b").value; $("m-formula").value = mindsetFormula(ka, kb); if (ka && kb) { var nm = PAIR(ka, kb); if (nm) $("m-name").value = nm; } render(); }
    $("m-a").addEventListener("change", syncMindset); $("m-b").addEventListener("change", syncMindset);
    $("ax-select").addEventListener("change", function () { var k = $("ax-select").value; if (k) { $("ax-q").value = AXQ(k) || ""; $("ax-axis").value = axisLabel(k); } render(); });

    ["q-text", "q-attr", "p-name", "p-band", "p-def", "p-freer", "a-name", "a-def", "a-axis", "m-name", "m-desc", "ax-q", "ax-axis", "d-term", "d-cat", "d-def", "handle"].forEach(function (id) { $(id).addEventListener("input", render); });
    $("download").addEventListener("click", function () { if (!$("download").disabled) download(); });

    render();
    if (document.fonts && document.fonts.ready) {
      Promise.all([
        document.fonts.load("500 60px 'Cormorant Garamond'"),
        document.fonts.load("600 60px 'Cormorant Garamond'"),
        document.fonts.load("italic 500 60px 'Cormorant Garamond'"),
        document.fonts.load("600 22px 'Source Sans 3'")
      ]).then(render).catch(render);
      document.fonts.ready.then(render);
    }
  }

  root.SOULCRAFT_POSTGEN = { mount: mount };
})(typeof self !== "undefined" ? self : this);
