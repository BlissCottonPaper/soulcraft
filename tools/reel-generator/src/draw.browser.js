/* ============================================================
 * draw.browser.js — Canvas2D drawing, run inside headless Chromium
 * ============================================================
 * Reuses the site's mandala language exactly: twelve archetype axes at
 * angle -90 + i*30, hue = i*30, hsl(hue,62%,L); five bandwidth stage dots per
 * axis (STAGE_LIGHT, Devolved rim -> Transcendent center); the white-ringed Base
 * dot; the single white center dot. Everything is procedural, so a frame is
 * self-contained (no external images).
 *
 * Exposes window.SR with:
 *   init(canvas, palette, cfg)   — one-time setup (dimensions, font, palette)
 *   drawScenes(t, timeline)      — composite the active scenes at time t
 *   drawMorph(t, total)          — the ported "Mandala Morph" animation
 * ============================================================ */
(function () {
  var S = {};        // state: ctx, W, H, palette, font, mandala geometry
  var TAU = Math.PI * 2;

  function sm(x) { return x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x); } // smoothstep
  function rad(deg) { return (deg * Math.PI) / 180; }

  window.SR = {
    init: function (canvas, palette, cfg) {
      S.canvas = canvas;
      S.ctx = canvas.getContext("2d");
      S.W = cfg.W; S.H = cfg.H;
      S.palette = palette;
      S.font = cfg.font || "Georgia, serif";
      // Mandala box: centered horizontally, seated in the upper-middle so the
      // lower third is free for text and clear of the bottom UI-safe zone.
      S.cx = S.W / 2;
      S.cy = S.H * 0.4;
      S.R = Math.min(S.W * 0.46, S.H * 0.27);   // outer radius (Devolved rim)
      S.Rbase = S.R * 0.62;                       // the base archetype ring radius
      S.dotR = S.R * 0.031;
      canvas.width = S.W; canvas.height = S.H;
    },

    drawScenes: drawScenes,
    drawMorph: drawMorph,
    ready: function () { return !!S.ctx; },
  };

  // ---- shared primitives ---------------------------------------------------
  function background() {
    var ctx = S.ctx, c = S.palette.COLORS;
    var g = ctx.createRadialGradient(S.cx, S.cy, 0, S.cx, S.cy, Math.max(S.W, S.H) * 0.62);
    g.addColorStop(0, c.bgInner); g.addColorStop(0.55, c.bgMid); g.addColorStop(1, c.bgOuter);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, S.W, S.H);
    ctx.fillStyle = g; ctx.fillRect(0, 0, S.W, S.H);
  }

  function halo(alpha) {
    if (alpha <= 0.01) return;
    var ctx = S.ctx, R = S.R * 0.5;
    var g = ctx.createRadialGradient(S.cx, S.cy, 0, S.cx, S.cy, R);
    g.addColorStop(0, "rgba(255,254,248," + 0.8 * alpha + ")");
    g.addColorStop(0.4, "rgba(238,230,255," + 0.3 * alpha + ")");
    g.addColorStop(1, "rgba(238,230,255,0)");
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(S.cx, S.cy, R, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function mandalaRing(alpha) {
    if (alpha <= 0.01) return;
    var ctx = S.ctx, N = S.palette.ARCHETYPES.length;
    ctx.globalAlpha = alpha;
    for (var i = 0; i < N; i++) {
      var a = rad(-90 + i * 30), hue = i * 30;
      var x = S.cx + S.Rbase * Math.cos(a), y = S.cy + S.Rbase * Math.sin(a);
      ctx.fillStyle = "hsl(" + hue + ",62%,55%)";
      ctx.beginPath(); ctx.arc(x, y, S.dotR, 0, TAU); ctx.fill();
      ctx.lineWidth = Math.max(1.4, S.W * 0.0018);
      ctx.strokeStyle = S.palette.COLORS.ring; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function bandwidth(alpha, igniteIdx) {
    if (alpha <= 0.01) return;
    var ctx = S.ctx, N = S.palette.ARCHETYPES.length, SL = S.palette.STAGE_LIGHT;
    for (var i = 0; i < N; i++) {
      var a = rad(-90 + i * 30), hue = i * 30;
      var axisA = (igniteIdx >= 0 && i !== igniteIdx) ? alpha * 0.22 : alpha;
      ctx.globalAlpha = axisA;
      for (var s = 0; s < 5; s++) {
        var r = S.R * ((5 - s) / 5);                 // s0 Devolved (rim) -> s4 Transcendent (inner)
        var x = S.cx + r * Math.cos(a), y = S.cy + r * Math.sin(a);
        ctx.fillStyle = "hsl(" + hue + ",62%," + SL[s] + "%)";
        ctx.beginPath(); ctx.arc(x, y, S.dotR, 0, TAU); ctx.fill();
        if (s === 2) {                                // Base keeps the white ring
          ctx.lineWidth = Math.max(1.2, S.W * 0.0016);
          ctx.strokeStyle = "rgba(255,252,240," + (0.9 * axisA / Math.max(axisA, 0.001)) + ")";
          ctx.strokeStyle = "rgba(255,252,240,0.9)"; ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function mindsets(alpha) {
    if (alpha <= 0.01) return;
    var ctx = S.ctx, N = S.palette.ARCHETYPES.length, Rb = S.Rbase, pr = S.dotR * 0.6;
    ctx.globalAlpha = alpha;
    for (var k = 0; k < N; k++) {
      for (var j = k + 1; j < N; j++) {
        var sep = Math.min(j - k, N - (j - k));
        if (sep === 6) continue;                     // opposites don't pair
        var ak = rad(-90 + k * 30), aj = rad(-90 + j * 30);
        var mx = ((Math.cos(ak) + Math.cos(aj)) / 2) * Rb + S.cx;
        var my = ((Math.sin(ak) + Math.sin(aj)) / 2) * Rb + S.cy;
        var bh = (Math.atan2(Math.sin(rad(k * 30)) + Math.sin(rad(j * 30)),
                             Math.cos(rad(k * 30)) + Math.cos(rad(j * 30))) * 180) / Math.PI;
        ctx.fillStyle = "hsl(" + bh + ",48%,66%)";
        ctx.beginPath(); ctx.arc(mx, my, pr, 0, TAU); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function wheel(alpha) {
    if (alpha <= 0.01) return;
    var ctx = S.ctx, steps = 180, Ro = S.R;
    ctx.save(); ctx.globalAlpha = alpha;
    for (var i = 0; i < steps; i++) {
      var a0 = (i / steps) * TAU, a1 = ((i + 1) / steps) * TAU, hue = (i / steps) * 360;
      var g = ctx.createRadialGradient(S.cx, S.cy, 0, S.cx, S.cy, Ro);
      g.addColorStop(0, "hsl(" + hue + ",70%,96%)");
      g.addColorStop(1, "hsl(" + hue + ",68%,52%)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(S.cx, S.cy);
      ctx.arc(S.cx, S.cy, Ro, a0 - 0.01, a1 + 0.01); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function center(alpha, haloOn) {
    if (alpha <= 0.01) return;
    if (haloOn) halo(alpha * 0.9);
    var ctx = S.ctx;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = S.palette.COLORS.center;
    ctx.beginPath(); ctx.arc(S.cx, S.cy, S.dotR, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function igniteSpine(idx, alpha) {
    if (alpha <= 0.01 || idx < 0) return;
    var ctx = S.ctx, a = rad(-90 + idx * 30), hue = idx * 30;
    // a soft ray from center to rim along the archetype's axis
    var x2 = S.cx + S.R * Math.cos(a), y2 = S.cy + S.R * Math.sin(a);
    var g = ctx.createLinearGradient(S.cx, S.cy, x2, y2);
    g.addColorStop(0, "hsla(" + hue + ",70%,70%,0)");
    g.addColorStop(1, "hsla(" + hue + ",70%,68%," + 0.5 * alpha + ")");
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = g; ctx.lineWidth = S.dotR * 2.2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(S.cx, S.cy); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }

  // Literary text, centered, kept inside the central 80% width and clear of the
  // bottom 15% UI-safe zone.
  function textBlock(lines, alpha, opts) {
    if (!lines || !lines.length || alpha <= 0.01) return;
    opts = opts || {};
    var ctx = S.ctx, c = S.palette.COLORS;
    var maxW = S.W * 0.8;
    var size = opts.size || Math.round(S.W * 0.052);
    var lh = size * 1.28;
    var yCenter = opts.y != null ? opts.y : S.H * 0.72;   // seated below the mandala
    var totalH = lines.length * lh;
    var y = yCenter - totalH / 2 + lh * 0.5;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = opts.color || c.ink;
    ctx.font = "600 " + size + "px " + S.font;
    for (var i = 0; i < lines.length; i++) {
      var fit = fitLine(ctx, lines[i], maxW, size);
      if (fit.size !== size) ctx.font = "600 " + fit.size + "px " + S.font;
      // never let a baseline drop into the bottom 15%
      var yy = Math.min(y, S.H * 0.83 - lh * 0.3);
      ctx.fillText(fit.text, S.W / 2, yy);
      if (fit.size !== size) ctx.font = "600 " + size + "px " + S.font;
      y += lh;
    }
    ctx.restore();
  }

  // Shrink-to-fit a single line (down to 70% before it just rides at min size).
  function fitLine(ctx, text, maxW, size) {
    var s = size;
    while (s > size * 0.7 && ctx.measureText(text).width > maxW) {
      s -= 1; ctx.font = "600 " + s + "px " + S.font;
    }
    return { text: text, size: s };
  }

  function kicker(text, alpha) {
    if (!text || alpha <= 0.01) return;
    var ctx = S.ctx, size = Math.round(S.W * 0.026);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = S.palette.COLORS.amber;
    ctx.font = "600 " + size + "px " + S.font;
    // letter-spaced label near the top
    var spaced = String(text).toUpperCase().split("").join(" ");
    ctx.fillText(spaced, S.W / 2, S.H * 0.12);
    ctx.restore();
  }

  // ---- scene compositor ----------------------------------------------------
  // Element/layer envelope — cross-fades across scene boundaries so mandala
  // layers dissolve into each other.
  function envelope(t, s) {
    var a0 = s.start - s.fadeIn, a1 = s.start, a2 = s.end, a3 = s.end + s.fadeOut;
    if (a0 < 0) a0 = 0;
    if (t <= a0 || t >= a3) return 0;
    if (t < a1) return sm((t - a0) / Math.max(0.001, a1 - a0));
    if (t < a2) return 1;
    return 1 - sm((t - a2) / Math.max(0.001, a3 - a2));
  }

  // Text envelope — STRICTLY inside [start, end] with short internal fades, so two
  // scenes' words never overlap during a layer cross-fade (only one line reads at
  // a time). Adjacent scenes meet at start_{i+1} == end_i, so their text windows
  // are disjoint by construction.
  function textEnvelope(t, s) {
    var tf = Math.min(0.28, (s.end - s.start) * 0.35);
    if (t <= s.start || t >= s.end) return 0;
    if (t < s.start + tf) return sm((t - s.start) / tf);
    if (t > s.end - tf) return 1 - sm((t - (s.end - tf)) / tf);
    return 1;
  }

  function idxOf(name) {
    if (!name) return -1;
    var q = String(name).trim().toLowerCase(), A = S.palette.ARCHETYPES;
    for (var i = 0; i < A.length; i++) if (A[i].name.toLowerCase() === q || A[i].key.toLowerCase() === q) return i;
    return -1;
  }

  function drawScenes(t, tl) {
    background();
    var kMax = 0;
    for (var i = 0; i < tl.scenes.length; i++) {
      var s = tl.scenes[i];
      var a = envelope(t, s);
      if (a <= 0.001) continue;
      var mood = s.mood || tl.mood;
      var ig = idxOf(s.ignite);
      var els = s.elements || [];
      var haloOn = mood === "bright" || els.indexOf("halo") >= 0;

      if (els.indexOf("wheel") >= 0) wheel(a);
      if (els.indexOf("mindsets") >= 0) mindsets(a);
      if (els.indexOf("bandwidth") >= 0) bandwidth(a, ig);
      if (els.indexOf("mandala") >= 0) mandalaRing(a);
      if (ig >= 0) igniteSpine(ig, a);
      if (els.indexOf("center") >= 0 || els.indexOf("halo") >= 0) center(a, haloOn);

      // Text on its own tight envelope so lines never cross-fade over each other.
      textBlock(s.text, textEnvelope(t, s), { color: S.palette.COLORS.ink });
      if (a > kMax) kMax = a;
    }
    if (tl.kicker) kicker(tl.kicker, kMax);
  }

  // ---- the Mandala Morph (ported, self-contained) --------------------------
  // Faithful to the site's morph beat map, rescaled to any frame and with the
  // color wheel + closing line drawn procedurally instead of from PNGs.
  function drawMorph(t, total) {
    var ctx = S.ctx, N = S.palette.ARCHETYPES.length, SL = S.palette.STAGE_LIGHT;
    var scale = total / 22.0;                       // preserve the 22s beat map at any duration
    var tt = t / scale;
    var ramp = function (a, b) { return sm((tt - a) / (b - a)); };

    var bgFade = ramp(0.6, 2.4);
    var awareness = ramp(0.6, 2.4);
    var outDots = 1 - ramp(13.0, 15.4);
    var archIn = ramp(3.4, 5.6);
    var baseA = archIn * outDots;
    var stageA = ramp(6.6, 8.8) * outDots;
    var pairA = ramp(9.8, 12.0) * outDots;
    var wheelA = ramp(13.0, 15.4);
    var haloA = awareness * 0.85 * (1 - ramp(13.0, 14.2));
    var centerA = awareness * (1 - ramp(16.1, 16.7));
    var bp = ramp(16.4, 18.6);                       // whiteout
    var quoteA = ramp(18.6, 20.8);

    // full-frame background
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, S.W, S.H);
    if (bgFade > 0) {
      var g = ctx.createRadialGradient(S.cx, S.cy, 0, S.cx, S.cy, Math.max(S.W, S.H) * 0.62);
      g.addColorStop(0, S.palette.COLORS.bgInner); g.addColorStop(0.55, S.palette.COLORS.bgMid); g.addColorStop(1, S.palette.COLORS.bgOuter);
      ctx.globalAlpha = bgFade; ctx.fillStyle = g; ctx.fillRect(0, 0, S.W, S.H); ctx.globalAlpha = 1;
    }

    var cx = S.cx, cy = S.cy, Ro = S.R, Rbase = S.Rbase, dotR = S.dotR, pairR = dotR * 0.6;
    if (haloA > 0.01) halo(haloA);
    if (stageA > 0) bandwidthMorph(stageA, outDots);
    if (pairA > 0) mindsetsAlpha(pairA);
    if (baseA > 0) mandalaRingAlpha(baseA);
    if (wheelA > 0) wheel(wheelA);
    if (centerA > 0) center(centerA, false);
    if (bp > 0) whiteout(bp);
    if (quoteA > 0) {
      textBlock(["You are not one of twelve types.", "You are all twelve."], quoteA,
        { color: "rgba(40,30,60,0.92)", y: S.H * 0.5, size: Math.round(S.W * 0.05) });
    }
  }

  function bandwidthMorph(alpha, outDots) {
    var ctx = S.ctx, N = S.palette.ARCHETYPES.length, SL = S.palette.STAGE_LIGHT;
    ctx.globalAlpha = alpha;
    for (var i = 0; i < N; i++) {
      var a = rad(-90 + i * 30), hue = i * 30;
      for (var s = 0; s < 5; s++) {
        if (s === 2) continue;                       // base drawn by the ring layer
        var r = S.R * ((5 - s) / 5);
        ctx.fillStyle = "hsl(" + hue + ",62%," + SL[s] + "%)";
        ctx.beginPath(); ctx.arc(S.cx + r * Math.cos(a), S.cy + r * Math.sin(a), S.dotR, 0, TAU); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  function mandalaRingAlpha(alpha) { mandalaRing(alpha); }
  function mindsetsAlpha(alpha) { mindsets(alpha); }

  function whiteout(bp) {
    var ctx = S.ctx, D = Math.max(S.W, S.H);
    var rO = Math.max(2, bp * D * 1.2), rI = Math.max(1, rO - D * 0.28);
    var g = ctx.createRadialGradient(S.cx, S.cy, 0, S.cx, S.cy, rO);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(Math.min(0.999, rI / rO), "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, S.W, S.H);
  }
})();
