// ============================================================
// /functions/mira/_prompt.js  —  Mira system-prompt assembly
// ============================================================
// Loads the verbatim template (bundled into _content.js from the .md files) and
// fills the five substitutions from D1: {{USER_PROFILE}}, {{SESSION_SUMMARIES}},
// {{SAVED_INSIGHTS}}, {{BELIEF_LENS}}, {{STAGE_LEXICON}}. Blockquote (`>`) lines
// are stripped before sending.
//
// Also the single source of truth for the AXIS-AWARE growth edge (see
// growthEdgeName) — the identical algorithm is mirrored in index.html so the
// site's results page and Mira always agree.
// ============================================================

import { PROMPT_TEMPLATE, STAGE_LEXICON } from "./_content.js";
import SOULCRAFT from "../../assets/soulcraft-data.js";
import { ensureMiraSchema } from "./_schema.js";

const ARCHETYPES = SOULCRAFT.ARCHETYPES;           // [{key,name,longing,longingVerb,stages[5],opposite}]
const STAGE_NAMES = SOULCRAFT.STAGE_NAMES;         // [Devolved..Transcendent]  (low → high)
const BLEND_TEXTURES = SOULCRAFT.BLEND_TEXTURES || {};
const byName = (n) => ARCHETYPES.find((a) => a.name === n);
const byKey = (k) => ARCHETYPES.find((a) => a.key === k);
const longs = (a) => (a.longingVerb ? "longs to " : "longs for ") + a.longing;

// ---- Axis-aware growth edge (canon, 2026-07-11) ----------------------------
// The growth edge is the fixed opposite of the highest-ranked archetype whose
// opposite is NOT already in the person's top three. Iterate rank 1 downward:
// skip any whose opposite is in the top three; the first that isn't gives the
// edge. rankedNames = archetype NAMES, strongest first.
export function growthEdgeName(rankedNames) {
  if (!rankedNames || !rankedNames.length) return null;
  const topThree = rankedNames.slice(0, 3);
  for (const name of rankedNames) {
    const a = byName(name);
    if (!a) continue;
    if (topThree.indexOf(a.opposite) === -1) return a.opposite; // opposite not among the loudest → the edge
  }
  // Degenerate case (every candidate's opposite is in the top three): fall back
  // to the plain opposite of the loudest voice.
  const first = byName(rankedNames[0]);
  return first ? first.opposite : null;
}

const NAME_UNKNOWN = "not yet known — ask them warmly what they'd like to be called";

// Obvious non-name local-parts (role/shared inboxes) — alphabetic but clearly
// not a person's name, so we defer to asking.
const NON_NAMES = new Set([
  "info", "admin", "hello", "hi", "contact", "team", "support", "sales",
  "noreply", "no", "reply", "mail", "email", "user", "test", "me", "account",
  "billing", "help", "service", "office", "inbox", "post", "webmaster", "root",
]);

// First name, best-effort from the email local-part (the assessment stores no
// name). Trust it ONLY when the whole local-part is PURELY alphabetic, 2–15
// chars, and not an obvious role/non-name. Any digit, dot, or other separator
// (e.g. "john.smith", "coolguy42", "j") means it isn't clearly a name, so we
// defer to asking. Returns null when nothing name-like is present.
function firstNameFromEmail(email) {
  if (!email) return null;
  const local = String(email).split("@")[0];
  if (!/^[A-Za-z]{2,15}$/.test(local)) return null;
  if (NON_NAMES.has(local.toLowerCase())) return null;
  return local.charAt(0).toUpperCase() + local.slice(1).toLowerCase();
}

// The resolved name to address the person by: an explicit display name they've
// set (or Mira learned) wins; otherwise the email-derived first name; otherwise
// NAME_UNKNOWN (a cue for Mira to ask). Exported so callers can tell whether the
// name is known and gate the "learn their name" instruction accordingly.
export function resolveKnownName(displayName, email) {
  const dn = typeof displayName === "string" ? displayName.trim() : "";
  return dn || firstNameFromEmail(email) || null;
}

// ---- {{USER_PROFILE}} ------------------------------------------------------
// Compact labels/values (not prose) built from the person's latest real reading.
async function buildUserProfile(env, userId, email, displayName) {
  const knownName = resolveKnownName(displayName, email);
  const firstName = knownName;
  let row = null;
  try {
    row = await env.DB
      .prepare("SELECT * FROM results WHERE user_id = ? AND archetype_scores <> '{}' AND archetype_scores <> '' ORDER BY created_at DESC LIMIT 1")
      .bind(userId)
      .first();
  } catch (e) { row = null; }

  if (!row) {
    return "First name: " + (firstName || NAME_UNKNOWN) + "\n" +
      "This person has not completed the Soulcraft assessment yet — their Mandala is unknown. Gently invite them to take it so you can meet their actual pattern; until then, work from what they tell you.";
  }

  let scores = {}, temper = {};
  try { scores = JSON.parse(row.archetype_scores) || {}; } catch (e) { scores = {}; }
  try { temper = JSON.parse(row.channel_scores) || {}; } catch (e) { temper = {}; }

  // Rank all twelve, strongest first (stable by wheel order on ties).
  const ranked = ARCHETYPES
    .map((a, i) => ({ a, i, score: Number(scores[a.key]) || 0 }))
    .sort((x, y) => y.score - x.score || x.i - y.i);
  const rankedNames = ranked.map((r) => r.a.name);

  // Bandwidth: the assessment does NOT measure a per-archetype Bandwidth stage,
  // so we mark each Base (ordinary register) and tell Mira to discover the live
  // stage in conversation rather than assert one.
  const rankLine = ranked
    .map((r, n) => `${n + 1}. ${r.a.name} (${r.score}) — Base*`)
    .join("\n");

  // Temperaments (Heart/Mind/Body/Soul), relative strengths, primary flagged.
  const TKEYS = [["heart", "Heart"], ["mind", "Mind"], ["body", "Body"], ["soul", "Soul"]];
  const tRanked = TKEYS
    .map(([k, label]) => ({ label, v: Number(temper[k]) || 0 }))
    .sort((a, b) => b.v - a.v);
  const primaryTemper = tRanked[0];
  const temperLine = tRanked
    .map((t) => `${t.label} ${t.v}${t === primaryTemper ? " (primary)" : ""}`)
    .join(" · ");

  // Primary pairing (loudest two).
  const top = ranked.map((r) => r.a);
  const pairName = SOULCRAFT.pairingName ? SOULCRAFT.pairingName(top[0].key, top[1].key) : null;
  const pairKey = [top[0].key, top[1].key].sort().join("|");
  const pairTexture = BLEND_TEXTURES[pairKey] || "";
  const pairLine = pairName
    ? `${top[0].name} × ${top[1].name} → ${pairName}${pairTexture ? " — " + pairTexture : ""}`
    : `${top[0].name} × ${top[1].name} (unnamed pairing)`;

  // Growth edge (axis-aware) + disowned (quietest) voices.
  const edge = growthEdgeName(rankedNames);
  const quietest = ranked.slice(-3).reverse().map((r) => r.a.name); // 3 quietest, quietest first
  const disowned = quietest.slice(0, 3);

  // Expanded write-ups: loudest three + quietest two–three.
  const writeup = (a) =>
    `- ${a.name} (${longs(a)}). Stage ladder low→high: ${a.stages.join(" · ")}. In their words: "${a.statement}"`;
  const loudWrite = top.slice(0, 3).map(writeup).join("\n");
  const quietWrite = ranked.slice(-3).map((r) => r.a).map(writeup).join("\n");

  const dateStr = row.created_at ? new Date(row.created_at * 1000).toISOString().slice(0, 10) : "unknown";

  return [
    "First name: " + (firstName || NAME_UNKNOWN),
    "Assessment date: " + dateStr,
    "",
    "Ranked twelve voices (strongest → quietest; score in parens):",
    rankLine,
    "*Bandwidth stage is NOT measured by the assessment — treat every voice as Base/unknown and discover its live stage in conversation; never assert a stage from the profile.",
    "",
    "Temperament (Heart/Mind/Body/Soul): " + temperLine,
    "Primary pairing: " + pairLine,
    "Growth edge (axis-aware): " + (edge || "unknown"),
    "Disowned / quietest voices: " + disowned.join(", "),
    "",
    "Loudest three, in depth:",
    loudWrite,
    "",
    "Quietest voices, in depth:",
    quietWrite,
  ].join("\n");
}

// ---- {{BELIEF_LENS}} -------------------------------------------------------
const TRADITION_LABELS = {
  christian: "Christian", jewish: "Jewish", muslim: "Muslim", hindu: "Hindu",
  buddhist: "Buddhist", taoist: "Taoist", indigenous: "Indigenous & shamanic",
  spiritual: "Spiritual but not religious", secular: "Secular / humanist",
};
function joinAnd(list) {
  if (list.length <= 1) return list.join("");
  if (list.length === 2) return list[0] + " and " + list[1];
  return list.slice(0, -1).join(", ") + ", and " + list[list.length - 1];
}
export function beliefLens(userRow) {
  const openAll = userRow && Number(userRow.belief_open_all) === 1;
  if (openAll) return "This person is open to all traditions — draw freely, and let the parallels surprise them.";
  let trads = [];
  try { trads = JSON.parse((userRow && userRow.belief_traditions) || "[]") || []; } catch (e) { trads = []; }
  const onlySecular = trads.length === 0 || (trads.length === 1 && trads[0] === "secular");
  if (onlySecular) return "This person is secular; work psychology-first.";
  const labels = trads.map((t) => TRADITION_LABELS[t] || t);
  const openness = (userRow && userRow.belief_openness) || "home";
  const tail = openness === "parallels"
    ? " and welcomes parallels between them."
    : " and prefers to stay within their tradition.";
  return "This person identifies with " + joinAnd(labels) + (labels.length === 1 ? " tradition" : " traditions") + tail;
}

// ---- assemble --------------------------------------------------------------
// Prompt caching (Session 3.1): the system prompt is split into a STATIC prefix
// (template shell + stage lexicon, with the four per-user placeholders replaced
// by fixed pointers) and a DYNAMIC tail (this person's profile, memory, insights,
// belief lens). The static prefix is byte-identical across all users and turns,
// so marking it cache_control:{type:"ephemeral"} and ordering it FIRST lets
// Anthropic serve repeat reads of it from cache (~10% of input cost).

const POINTER = "(Provided in the “About this person” section at the end of this system message.)";

let _staticCache = null;
export function staticSystemText() {
  if (_staticCache) return _staticCache;
  let out = PROMPT_TEMPLATE
    .replace("{{STAGE_LEXICON}}", STAGE_LEXICON.trim())
    .replace("{{USER_PROFILE}}", POINTER)
    .replace("{{SESSION_SUMMARIES}}", POINTER)
    .replace("{{SAVED_INSIGHTS}}", POINTER)
    .replace("{{BELIEF_LENS}}", POINTER);
  out = out.split("\n").filter((line) => !/^\s*>/.test(line)).join("\n");
  _staticCache = out;
  return out;
}

// The per-user tail. Never cached — changes with the person and the conversation.
async function dynamicBlock(env, userId, email) {
  let userRow = null;
  try {
    userRow = await env.DB
      .prepare("SELECT email, display_name, belief_traditions, belief_open_all, belief_openness FROM users WHERE id = ?")
      .bind(userId)
      .first();
  } catch (e) {
    // display_name may not exist yet on an un-migrated DB — retry without it.
    try {
      userRow = await env.DB
        .prepare("SELECT email, belief_traditions, belief_open_all, belief_openness FROM users WHERE id = ?")
        .bind(userId)
        .first();
    } catch (e2) { userRow = null; }
  }
  const resolvedEmail = email || (userRow && userRow.email) || null;
  const displayName = (userRow && userRow.display_name) || null;

  const profile = await buildUserProfile(env, userId, resolvedEmail, displayName);
  const nameKnown = !!resolveKnownName(displayName, resolvedEmail);

  // Session summaries — 5 most recent, newest first.
  let summaries = "This is your first conversation with this person.";
  try {
    const r = await env.DB
      .prepare("SELECT summary, created_at FROM mira_summaries WHERE user_id = ? ORDER BY id DESC LIMIT 5")
      .bind(userId).all();
    const rows = (r && r.results) || [];
    if (rows.length) summaries = rows.map((s) => "• (" + String(s.created_at).slice(0, 10) + ") " + s.summary).join("\n");
  } catch (e) { /* keep default */ }

  // Saved insights — 10 most recent with dates.
  let insights = "None saved yet.";
  try {
    const r = await env.DB
      .prepare("SELECT content, created_at FROM mira_insights WHERE user_id = ? ORDER BY id DESC LIMIT 10")
      .bind(userId).all();
    const rows = (r && r.results) || [];
    if (rows.length) insights = rows.map((s) => "• (" + String(s.created_at).slice(0, 10) + ") " + s.content).join("\n");
  } catch (e) { /* keep default */ }

  const lens = beliefLens(userRow);

  const parts = [
    "About this person (dynamic — this is the material the pointers above refer to):",
    "",
    "Who you are speaking with:",
    profile,
    "",
    "Memory of past conversations:",
    summaries,
    "",
    "Insights this person has chosen to keep:",
    insights,
    "",
    "Their spiritual home:",
    lens,
  ];

  // If we don't yet know their name, give Mira a silent way to remember it once
  // they share it. The ⟦remember-name: …⟧ marker is stripped by the server before
  // her reply reaches them (they never see the brackets) and persisted as their
  // display name, so she won't have to ask again next time.
  if (!nameKnown) {
    parts.push(
      "",
      "Remembering their name (system mechanic — do this silently):",
      "You don't know their name yet. If they tell you what they'd like to be called, use it warmly in your reply, and then, on its very last line, write exactly ⟦remember-name: NAME⟧ one time — replacing NAME with what they gave you (just the name, no quotes). The server strips this marker before your message is shown, so they never see the ⟦ ⟧ brackets; it simply lets the system remember their name. Emit it only once, only after they've actually told you, and never write those brackets for any other reason."
    );
  }

  return parts.join("\n");
}

// System blocks for the Anthropic call: [ static (cached), dynamic ].
export async function assembleMiraSystem(env, userId, email) {
  await ensureMiraSchema(env);
  const dyn = await dynamicBlock(env, userId, email);
  return [
    { type: "text", text: staticSystemText(), cache_control: { type: "ephemeral" } },
    { type: "text", text: dyn },
  ];
}

// Back-compat single-string form (used by tests and any non-caching caller).
export async function assembleMiraPrompt(env, userId, email) {
  const blocks = await assembleMiraSystem(env, userId, email);
  return blocks.map((b) => b.text).join("\n\n");
}
