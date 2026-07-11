// ============================================================
// /functions/r/_public-page.js   (shared helper — not a route)
// ============================================================
// Server-renders a read-only, shareable Mandala page for /r/{resultId}.
// Pure functions (no D1) so they're unit-testable; the [id].js route does the
// lookup and calls renderPublicResultPage().
//
// The archetype table (wheel order, names, longings, descriptors) is a compact
// copy of assets/soulcraft-data.js — kept here so the Function is self-contained
// (Pages Functions can't reliably import from outside functions/). Wheel index i
// = hue i*30 and clock position (i*30-90), matching the on-screen Mandala.
// ============================================================

export const ARCHES = [
  { key: "lover",     name: "Lover",     longing: "union",                  verb: false, descriptors: ["passionate", "devoted", "sensual"] },
  { key: "caregiver", name: "Caregiver", longing: "nurture",                verb: true,  descriptors: ["nurturing", "supportive", "selfless"] },
  { key: "everyman",  name: "Everyman",  longing: "belong",                 verb: true,  descriptors: ["approachable", "down-to-earth", "inclusive"] },
  { key: "ruler",     name: "Ruler",     longing: "order",                  verb: false, descriptors: ["authoritative", "decisive", "responsible"] },
  { key: "warrior",   name: "Warrior",   longing: "protect",                verb: true,  descriptors: ["determined", "courageous", "protective"] },
  { key: "creator",   name: "Creator",   longing: "bring forth",            verb: true,  descriptors: ["imaginative", "artistic", "expressive"] },
  { key: "sage",      name: "Sage",      longing: "truth",                  verb: false, descriptors: ["analytical", "reflective", "insightful"] },
  { key: "explorer",  name: "Explorer",  longing: "freedom",                verb: false, descriptors: ["adventurous", "independent", "restless"] },
  { key: "rebel",     name: "Rebel",     longing: "justice",                verb: false, descriptors: ["defiant", "nonconformist", "outspoken"] },
  { key: "trickster", name: "Trickster", longing: "revelation",             verb: false, descriptors: ["playful", "mischievous", "irreverent"] },
  { key: "innocent",  name: "Innocent",  longing: "trust",                  verb: true,  descriptors: ["hopeful", "trusting", "optimistic"] },
  { key: "mystic",    name: "Mystic",    longing: "communion with mystery", verb: false, descriptors: ["intuitive", "otherworldly", "contemplative"] },
];

const SITE = "https://artofsoulcraft.com";
const OG_IMAGE = SITE + "/og-image.png";

export function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function longsPhrase(a) { return (a.verb ? "Longs to " : "Longs for ") + a.longing; }
function nodeXY(i, R, c) { const rad = ((i * 30 - 90) * Math.PI) / 180; return [c + R * Math.cos(rad), c + R * Math.sin(rad)]; }

// rank the 12 archetypes by score (ties broken by wheel order), returning the
// enriched list; caller takes the first three as the "loudest voices".
export function rankArchetypes(scores) {
  scores = scores || {};
  return ARCHES.map((a, i) => ({ ...a, i, score: Number(scores[a.key] || 0) }))
    .sort((x, y) => y.score - x.score || x.i - y.i);
}

// Read-only Mandala SVG — mirrors the on-screen (screen-palette) wheel: ring,
// spokes, the gold triangle across the top three, twelve coloured dots (top
// three enlarged), labels, and the glowing centre. No links, no interactivity.
export function buildMandalaSvg(ranked) {
  const c = 170, R = 128;
  const top3 = ranked.slice(0, 3).map((r) => r.i);
  const tri = top3.map((i) => nodeXY(i, R, c));
  let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -30 432 400" width="100%" role="img" aria-label="Mandala" style="max-width:460px;display:block;margin:0 auto">';
  s += '<defs><radialGradient id="ctr" r="50%">' +
       '<stop offset="0%" stop-color="rgba(255,252,240,0.95)"/>' +
       '<stop offset="45%" stop-color="rgba(255,246,214,0.28)"/>' +
       '<stop offset="100%" stop-color="rgba(255,246,214,0)"/></radialGradient></defs>';
  s += '<circle cx="' + c + '" cy="' + c + '" r="' + R + '" fill="none" stroke="rgba(210,200,240,0.14)" stroke-width="1"/>';
  for (let i = 0; i < 12; i++) { const [x, y] = nodeXY(i, R, c); s += '<line x1="' + c + '" y1="' + c + '" x2="' + x.toFixed(2) + '" y2="' + y.toFixed(2) + '" stroke="rgba(210,200,240,0.07)" stroke-width="1"/>'; }
  s += '<polygon points="' + tri.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(" ") + '" fill="rgba(255,250,235,0.06)" stroke="rgba(233,196,124,0.9)" stroke-width="1.5" stroke-linejoin="round"/>';
  for (let i = 0; i < 12; i++) {
    const a = ARCHES[i];
    const [x, y] = nodeXY(i, R, c);
    const [lx, ly] = nodeXY(i, R + 26, c);
    const isTop = top3.includes(i);
    const cosA = Math.cos(((i * 30 - 90) * Math.PI) / 180);
    const anchor = cosA > 0.35 ? "start" : cosA < -0.35 ? "end" : "middle";
    const nudge = anchor === "start" ? 5 : anchor === "end" ? -5 : 0;
    s += '<circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="' + (isTop ? 11 : 6) + '" fill="hsl(' + (i * 30) + ',62%,56%)" stroke="' + (isTop ? "rgba(255,252,240,0.95)" : "rgba(255,255,255,0.25)") + '" stroke-width="' + (isTop ? 2.2 : 0.8) + '"/>';
    s += '<text x="' + (lx + nudge).toFixed(2) + '" y="' + (ly + 3).toFixed(2) + '" text-anchor="' + anchor + '" font-size="' + (isTop ? 11.5 : 9.5) + '" font-weight="' + (isTop ? 600 : 400) + '" fill="' + (isTop ? "rgba(244,240,255,0.95)" : "rgba(196,190,222,0.62)") + '" style="font-family:\'Source Sans 3\',system-ui,sans-serif;letter-spacing:0.04em">' + esc(a.name) + '</text>';
  }
  s += '<circle cx="' + c + '" cy="' + c + '" r="30" fill="url(#ctr)"/>';
  s += '<circle cx="' + c + '" cy="' + c + '" r="6.5" fill="rgb(255,252,240)"/>';
  s += '<text x="' + c + '" y="' + (c + 24) + '" text-anchor="middle" font-size="9" fill="rgba(235,228,255,0.7)" style="font-family:\'Source Sans 3\',system-ui,sans-serif;letter-spacing:0.22em">YOU</text>';
  s += '</svg>';
  return s;
}

// Full HTML for /r/{id}. `id` is the result slug; `scores` the archetype_scores object.
export function renderPublicResultPage(id, scores) {
  const ranked = rankArchetypes(scores);
  const top3 = ranked.slice(0, 3);
  const names = top3.map((a) => a.name);
  const url = SITE + "/r/" + encodeURIComponent(id);
  const ogTitle = names.join(" · ") + " — The Art of Soulcraft";
  const ogDesc = "The three archetypal voices that speak loudest in this Mandala — from the twelve within. Discover your own at artofsoulcraft.com.";

  const cards = top3.map((a) =>
    '<div class="card">' +
    '<div class="dot" style="background:hsl(' + (a.i * 30) + ',62%,56%)"></div>' +
    '<div><p class="cn">' + esc(a.name) + '</p>' +
    '<p class="cd">' + esc(longsPhrase(a)) + " — " + esc(a.descriptors.join(", ")) + ".</p></div></div>"
  ).join("");

  return (
'<!DOCTYPE html><html lang="en"><head>' +
'<meta charset="UTF-8"/>' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0"/>' +
'<title>' + esc(ogTitle) + '</title>' +
'<meta name="description" content="' + esc(ogDesc) + '"/>' +
'<link rel="icon" href="/favicon.ico" sizes="32x32"/>' +
'<link rel="icon" href="/favicon.svg" type="image/svg+xml"/>' +
'<meta property="og:type" content="website"/>' +
'<meta property="og:title" content="' + esc(ogTitle) + '"/>' +
'<meta property="og:description" content="' + esc(ogDesc) + '"/>' +
'<meta property="og:url" content="' + esc(url) + '"/>' +
'<meta property="og:image" content="' + OG_IMAGE + '"/>' +
'<meta property="og:image:width" content="1200"/>' +
'<meta property="og:image:height" content="630"/>' +
'<meta name="twitter:card" content="summary_large_image"/>' +
'<meta name="twitter:title" content="' + esc(ogTitle) + '"/>' +
'<meta name="twitter:description" content="' + esc(ogDesc) + '"/>' +
'<meta name="twitter:image" content="' + OG_IMAGE + '"/>' +
'<link rel="preconnect" href="https://fonts.googleapis.com">' +
'<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet">' +
'<style>' +
":root{color-scheme:dark}*{box-sizing:border-box}" +
"body{margin:0;min-height:100vh;color:#f5f3ff;font-family:'Source Sans 3',system-ui,sans-serif;background:radial-gradient(1200px 700px at 50% -8%,#241d42 0%,#171230 42%,#100c22 100%)}" +
".wrap{max-width:640px;margin:0 auto;padding:40px 20px 64px;text-align:center}" +
".serif{font-family:'Cormorant Garamond',Georgia,serif}" +
".eyebrow{font-size:11px;letter-spacing:.4em;color:rgba(253,230,138,.75);text-transform:uppercase;margin:0 0 6px}" +
".sub{font-size:12px;letter-spacing:.28em;color:rgba(196,181,253,.55);text-transform:uppercase;margin:0 0 10px}" +
".names{font-family:'Cormorant Garamond',Georgia,serif;font-size:2.4rem;line-height:1.15;margin:0 0 6px;color:#f5f3ff}" +
".cards{display:flex;flex-direction:column;gap:10px;max-width:460px;margin:18px auto 6px;text-align:left}" +
".card{display:flex;gap:12px;align-items:flex-start;background:rgba(255,250,240,.03);border:1px solid rgba(196,181,253,.18);border-radius:14px;padding:12px 14px}" +
".dot{width:14px;height:14px;border-radius:9999px;margin-top:4px;flex:0 0 auto;box-shadow:0 0 0 1px rgba(255,255,255,.15)}" +
".cn{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.35rem;margin:0;color:#efe9ff}" +
".cd{font-size:13.5px;line-height:1.5;color:rgba(224,218,246,.78);margin:2px 0 0}" +
".cta{display:inline-block;margin-top:26px;background:rgba(253,230,138,.92);color:#1b1430;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:12px}" +
".cta:hover{background:#fde8b0}" +
".foot{margin-top:22px;font-size:12px;color:rgba(196,181,253,.45)}" +
".quiet{font-size:13px;color:rgba(196,181,253,.6);font-style:italic;margin-top:14px}" +
'</style></head><body><div class="wrap">' +
'<p class="eyebrow">The Art of Soulcraft</p>' +
'<p class="sub">A shared Mandala · loudest voices</p>' +
'<h1 class="names">' + esc(names.join(" · ")) + '</h1>' +
buildMandalaSvg(ranked) +
'<p class="quiet">Three of the twelve archetypal voices — the ones that speak loudest here.</p>' +
'<div class="cards">' + cards + '</div>' +
'<a class="cta" href="' + SITE + '/">Discover your own Mandala &rarr;</a>' +
'<p class="foot">artofsoulcraft.com — a reflective tool, a map, not a fortune.</p>' +
'</div></body></html>'
  );
}

// Shown when a result id isn't public / doesn't exist.
export function renderNotAvailablePage() {
  return (
'<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0"/>' +
'<meta name="robots" content="noindex"/>' +
'<title>Mandala not available — The Art of Soulcraft</title>' +
'<link rel="icon" href="/favicon.svg" type="image/svg+xml"/>' +
'<link rel="preconnect" href="https://fonts.googleapis.com">' +
'<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet">' +
'<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;color:#f5f3ff;font-family:\'Source Sans 3\',system-ui,sans-serif;background:radial-gradient(1200px 700px at 50% -8%,#241d42 0%,#171230 42%,#100c22 100%);padding:24px}' +
'h1{font-family:\'Cormorant Garamond\',Georgia,serif;font-size:2rem;margin:0 0 10px}a{color:#fde8b0}</style></head>' +
'<body><div><h1>This Mandala isn’t available</h1>' +
'<p style="color:rgba(224,218,246,.8)">It may be private, or the link may be mistyped.</p>' +
'<p style="margin-top:18px"><a href="' + SITE + '/">Discover your own Mandala &rarr;</a></p></div></body></html>'
  );
}
