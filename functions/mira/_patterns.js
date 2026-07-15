// ============================================================
// /functions/mira/_patterns.js  —  protective-pattern recognition
// ============================================================
// Wires the Atlas of Protective Patterns into Mira's live turn. Like _crisis.js,
// this is a deterministic pass over each incoming user message — but instead of a
// yes/no flag it returns CANDIDATE pattern IDs (0, 1, or many), so Mira can ask
// which one fits rather than assume.
//
// Two stages:
//   1. detectPatterns(message) scans against the always-loaded index (trigger
//      phrases + crosswalk aliases + pattern names). The endpoint injects a
//      lightweight note — candidate names + one-line recognition sentences only,
//      never the full entries.
//   2. Once narrowed to a single confirmed pattern, getPatternEntry(id) pulls
//      that ONE full entry from the large on-demand file, injected for that turn.
//
// Data files are generated from Notion by scripts/export-protective-patterns.mjs
// and are provisional — re-run that script as the source content is completed.
// ============================================================

import { PATTERN_INDEX } from "./patterns-index.js";

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

// Normalize to a comparable form: lowercase, straighten quotes, drop punctuation
// to single spaces, collapse whitespace. Keeps letters, digits and apostrophes.
function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[‘’ʼ`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const MIN_PHRASE_LEN = 10;   // a trigger sentence must be this long (normalized) to match
const MIN_TERM_LEN = 4;      // an alias/name must be this long to match

// Precompute the searchable signals for each pattern, once at module load.
//  - phrases : full trigger sentences (matched as a contained substring)
//  - terms   : crosswalk aliases + the pattern's own name (matched whole-word)
const SIGNALS = PATTERN_INDEX.map((p) => {
  const phrases = (p.triggers || []).map(normalize).filter((x) => x.length >= MIN_PHRASE_LEN);
  const termStrings = [p.name, ...(p.aliases || [])]
    .map(normalize)
    .filter((x) => x.length >= MIN_TERM_LEN);
  const terms = [...new Set(termStrings)].map((t) => new RegExp("(?:^| )" + escapeRe(t) + "(?: |$)"));
  return { id: p.id, name: p.name, recognition: p.recognition, phrases, terms };
});

function hit(msgNorm, sig) {
  for (let i = 0; i < sig.phrases.length; i++) if (msgNorm.includes(sig.phrases[i])) return true;
  for (let i = 0; i < sig.terms.length; i++) if (sig.terms[i].test(msgNorm)) return true;
  return false;
}

// Scan a message. Returns candidate patterns (possibly empty), each as
// { id, name, recognition } — never full content.
export function detectPatterns(message) {
  const msgNorm = normalize(message);
  if (!msgNorm || msgNorm.length < 3) return [];
  const out = [];
  for (let i = 0; i < SIGNALS.length; i++) {
    if (hit(msgNorm, SIGNALS[i])) {
      const s = SIGNALS[i];
      out.push({ id: s.id, name: s.name, recognition: s.recognition });
    }
  }
  return out;
}

// Stage-1 note: candidate names + recognition sentences only. Guides Mira to
// consider (and, when several fit, ask about) a pattern rather than assert one.
export function patternNote(candidates) {
  if (!candidates || !candidates.length) return "";
  const lines = candidates.map((c) => `• ${c.name} — “${c.recognition}”`).join("\n");
  const many = candidates.length > 1;
  return [
    "Possible protective pattern(s) this message may relate to (system hint — hold lightly, never diagnose or assert):",
    lines,
    many
      ? "Several could fit. If it feels relevant, reflect gently and ask which — if any — resonates, rather than assuming one."
      : "If it feels relevant, you may gently reflect it back and check whether it resonates — the person confirms, not you.",
  ].join("\n");
}

// Stage-2: the large full-entries file is imported dynamically the first time a
// single pattern is confirmed, then cached. Returns one entry or null.
let _full = null;
export async function getPatternEntry(patternId) {
  if (!patternId) return null;
  if (!_full) {
    try {
      const mod = await import("./patterns-full.js");
      _full = mod.PATTERN_FULL || {};
    } catch (e) { _full = {}; }
  }
  return _full[patternId] || null;
}

// Administrative / migration bookkeeping properties — stored in the full file for
// completeness, but omitted from the turn context so Mira sees only meaningful content.
const SKIP_PROPS = new Set([
  "Canonical Name", "Pattern ID", "url", "First Letter", "Source Batch",
  "Migration Notes", "Legacy Source", "Review Status", "Trigger Phrase Status",
]);

// Render one full entry as a compact context block for a single turn.
export function formatEntry(entry) {
  if (!entry) return "";
  const props = entry.properties || {};
  const parts = [`Confirmed protective pattern — deep context for this turn only: ${entry.name}`];
  for (const [k, v] of Object.entries(props)) {
    if (SKIP_PROPS.has(k)) continue;
    parts.push(`${k}: ${Array.isArray(v) ? v.join(", ") : v}`);
  }
  if (entry.body) parts.push("\n" + entry.body);
  return parts.join("\n");
}
