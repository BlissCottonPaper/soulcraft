// ============================================================
// brief.mjs — parse a visual brief (.json or .txt) into normalized scenes
// ============================================================
// A brief says WHAT happens on screen; timeline.mjs decides WHEN (from the audio).
//
// JSON brief:
//   {
//     "title": "The Twelve",
//     "kicker": "THE TWELVE ARCHETYPES",   // small amber label, optional
//     "mood": "dark",                       // default mood for all scenes
//     "loop": false,                        // seamless loop (quote loops)
//     "scenes": [
//       { "text": ["Twelve voices.", "One center."],
//         "elements": ["mandala", "center"],   // layers to show
//         "ignite": "Warrior",                 // optional archetype to spotlight
//         "mood": "bright",                    // optional per-scene override
//         "weight": 2,                          // proportional time weight (default 1)
//         "pct": 0.0, "dur": 3.0 }              // optional explicit start(fraction)/duration(s)
//     ]
//   }
//
// Plain-text brief: paragraphs (blank-line separated) are scenes; each line is an
// on-screen text line. A line in [brackets] is a directive for its scene:
//   [elements: mandala, center]   [ignite: Warrior]   [mood: bright]   [weight: 2]
// A leading "kicker: …" or "title: …" line (before the first scene) sets those.
// ============================================================

import fs from "node:fs";

// Canonical element layers the renderer knows how to draw.
const ELEMENTS = new Set(["mandala", "bandwidth", "mindsets", "wheel", "center", "halo"]);
const ELEMENT_ALIASES = {
  ring: "mandala", base: "mandala", archetypes: "mandala",
  stages: "bandwidth", ladder: "bandwidth",
  pairings: "mindsets", blends: "mindsets",
  colorwheel: "wheel", spectrum: "wheel",
  dot: "center", whitedot: "center",
  glow: "halo",
};
function normElements(list) {
  const out = [];
  for (const raw of list || []) {
    const k = String(raw).trim().toLowerCase();
    const c = ELEMENTS.has(k) ? k : ELEMENT_ALIASES[k];
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
}

function normMood(m) {
  const s = String(m || "").trim().toLowerCase();
  return s === "bright" || s === "light" ? "bright" : "dark";
}

function normScene(s) {
  const text = Array.isArray(s.text) ? s.text.map((t) => String(t)) : (s.text ? [String(s.text)] : []);
  return {
    text: text.filter((t) => t.trim().length),
    elements: normElements(s.elements),
    ignite: s.ignite ? String(s.ignite) : null,
    mood: s.mood ? normMood(s.mood) : null,     // null = inherit brief mood
    weight: Number(s.weight) > 0 ? Number(s.weight) : 1,
    at: s.at != null && Number.isFinite(Number(s.at)) ? Number(s.at) : null,
    pct: s.pct != null && Number.isFinite(Number(s.pct)) ? Number(s.pct) : null,
    dur: s.dur != null && Number(s.dur) > 0 ? Number(s.dur) : null,
  };
}

function parseJson(obj) {
  const scenes = (obj.scenes || []).map(normScene).filter((s) => s.text.length || s.elements.length || s.ignite);
  return {
    title: obj.title ? String(obj.title) : null,
    kicker: obj.kicker ? String(obj.kicker) : null,
    mood: normMood(obj.mood),
    loop: !!obj.loop,
    duration: Number(obj.duration) > 0 ? Number(obj.duration) : null, // preset default seconds
    scenes,
  };
}

const DIRECTIVE = /^\[(elements|ignite|mood|weight|dur|pct|at)\s*:\s*(.+?)\]$/i;

function parseText(txt) {
  const blocks = txt.replace(/\r\n/g, "\n").split(/\n\s*\n/);
  const out = { title: null, kicker: null, mood: "dark", loop: false, duration: null, scenes: [] };
  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const scene = { text: [], elements: [], ignite: null, mood: null, weight: 1, at: null, pct: null, dur: null };
    let sawContent = out.scenes.length > 0;
    for (const line of lines) {
      const dm = line.match(DIRECTIVE);
      if (dm) {
        const key = dm[1].toLowerCase(), val = dm[2].trim();
        if (key === "elements") scene.elements = val.split(",").map((x) => x.trim());
        else if (key === "ignite") scene.ignite = val;
        else if (key === "mood") scene.mood = val;
        else if (key === "weight") scene.weight = Number(val) || 1;
        else if (key === "dur") scene.dur = Number(val) || null;
        else if (key === "pct") scene.pct = Number(val);
        else if (key === "at") scene.at = Number(val);
        continue;
      }
      // Header lines only count before the first scene has content.
      const hm = line.match(/^(kicker|title|mood)\s*:\s*(.+)$/i);
      if (hm && !sawContent) {
        const k = hm[1].toLowerCase();
        if (k === "kicker") out.kicker = hm[2].trim();
        else if (k === "title") out.title = hm[2].trim();
        else if (k === "mood") out.mood = hm[2].trim();
        continue;
      }
      scene.text.push(line);
      sawContent = true;
    }
    if (scene.text.length || scene.elements.length || scene.ignite) out.scenes.push(normScene(scene));
  }
  out.mood = normMood(out.mood);
  return out;
}

// Accepts a file path or an already-parsed object (used by presets).
export function parseBrief(input) {
  if (input && typeof input === "object") return parseJson(input);
  const raw = fs.readFileSync(input, "utf8");
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    let obj;
    try { obj = JSON.parse(trimmed); } catch (e) { throw new Error("Brief looks like JSON but failed to parse: " + e.message); }
    return parseJson(Array.isArray(obj) ? { scenes: obj } : obj);
  }
  return parseText(raw);
}
