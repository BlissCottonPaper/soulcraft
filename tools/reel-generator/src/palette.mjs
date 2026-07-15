// ============================================================
// palette.mjs — the Soulcraft visual identity, reused (not reinvented)
// ============================================================
// Pulls the twelve archetypes (and their wheel order) straight from the site's
// single source of truth, /assets/soulcraft-data.js, and derives the exact hue
// mapping the site uses everywhere its mandala is drawn: hue = wheelIndex * 30,
// hsl(hue, 62%, L). Stage lightness matches the bandwidth viz (build/generate.js
// bandwidthWheelViz): STAGE_LIGHT [30,42,55,67,79], Devolved → Transcendent.
//
// Nothing here invents a color. If the site's palette changes, this follows.
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");

const mod = await import(path.join(REPO_ROOT, "assets", "soulcraft-data.js"));
const DATA = mod.default || mod;

// Wheel order defines hue: index 0 (Lover) = hue 0 … index 11 (Mystic) = hue 330.
export const ARCHETYPES = DATA.ARCHETYPES.map((a, i) => ({
  key: a.key,
  name: a.name,
  hue: i * 30,
  longing: a.longing,
  longingVerb: !!a.longingVerb,
  opposite: a.opposite,
  index: i,
}));

export const STAGE_NAMES = DATA.STAGE_NAMES;           // Devolved..Transcendent
export const STAGE_LIGHT = [30, 42, 55, 67, 79];        // matches the site's bandwidth viz

// Background / ink tokens — the same navy field + warm ink the site uses.
export const COLORS = {
  bgOuter: "#0c0819",
  bgMid: "#141029",
  bgInner: "#1c1636",
  ink: "rgba(245,243,255,0.96)",       // primary literary text
  inkSoft: "rgba(224,218,246,0.82)",   // secondary text
  amber: "rgba(253,230,138,0.92)",     // the site's accent (kicker/label)
  ring: "rgba(255,252,240,0.9)",       // the white dot border on mandala dots
  center: "rgba(255,254,250,0.98)",    // the white center dot
};

// Case-insensitive archetype lookup by name or key (for --archetype / ignite).
export function findArchetype(nameOrKey) {
  if (!nameOrKey) return null;
  const q = String(nameOrKey).trim().toLowerCase();
  return ARCHETYPES.find((a) => a.name.toLowerCase() === q || a.key.toLowerCase() === q) || null;
}

// The brand serif, inlined so headless rendering never depends on a system font.
export function brandFontDataUrl() {
  const p = path.join(__dirname, "..", "assets", "cormorant-600.woff2");
  const b64 = fs.readFileSync(p).toString("base64");
  return "data:font/woff2;base64," + b64;
}

// The whole palette bundle handed to the browser page in one object.
export function paletteBundle() {
  return { ARCHETYPES, STAGE_NAMES, STAGE_LIGHT, COLORS };
}
