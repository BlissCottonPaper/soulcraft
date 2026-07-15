// ============================================================
// /functions/mira/_refresh.js  —  Results Refresh (post-G11 retakes)
// ============================================================
// After a returning user who already completed the First Orientation (G11)
// retakes the assessment, their new results silently become Mira's working
// profile — but nothing acknowledges what changed. This module supplies a gentle,
// recurring OFFER (never a gate) that Mira can raise naturally: "your results have
// shifted — would you like to walk through what's changed?"
//
// It is NOT the full induction. The person already knows the concepts, so the
// hint tells Mira to skip re-teaching and review only the deltas (new top three,
// new primary Mindset, new growth edge). Per G12's closing-well principle it is an
// offer, never manufactured pressure.
//
// Delivery discipline (why it never nags):
//   • the endpoint injects this hint ONLY on a session's opening turn, so the
//     offer can ride Mira's greeting at most once per session and never builds
//     mid-conversation;
//   • it recurs across future session-openers until reviewed, but rests after a
//     small cap of unreviewed openers;
//   • when Mira actually walks the review she emits ⟦results-reviewed⟧ and the
//     offer stops.
// ============================================================

import SOULCRAFT from "../../assets/soulcraft-data.js";
import { growthEdgeName } from "./_prompt.js";

const ARCHETYPES = SOULCRAFT.ARCHETYPES;

// Silent marker Mira emits once, when a results review has actually landed.
export const RESULTS_REVIEWED_MARKER = "results-reviewed";

// Openers that may carry the offer for a single retake before it rests.
const OFFER_CAP = 3;

// Rank the twelve from a stored score blob and derive the comparable shape:
// top three (in order), the primary (top-two) Mindset, and the axis-aware edge.
function shapeFromScores(scoresJson) {
  let scores = {};
  try { scores = JSON.parse(scoresJson) || {}; } catch (e) { scores = {}; }
  const ranked = ARCHETYPES
    .map((a, i) => ({ a, i, score: Number(scores[a.key]) || 0 }))
    .sort((x, y) => y.score - x.score || x.i - y.i);
  const names = ranked.map((r) => r.a.name);
  const k0 = ranked[0] && ranked[0].a.key;
  const k1 = ranked[1] && ranked[1].a.key;
  const primaryMindset = (SOULCRAFT.pairingName && k0 && k1) ? SOULCRAFT.pairingName(k0, k1) : null;
  return { top3: names.slice(0, 3), primaryMindset, edge: growthEdgeName(names) };
}

// The human-readable changes between two shapes. Widest threshold (per product
// decision): top-three membership OR order, the primary Mindset, OR the growth
// edge. Returns [] when nothing meaningful changed.
function deltaLines(prev, next) {
  const lines = [];
  const sameSet = JSON.stringify([...prev.top3].sort()) === JSON.stringify([...next.top3].sort());
  const sameOrder = JSON.stringify(prev.top3) === JSON.stringify(next.top3);
  if (!sameOrder) {
    lines.push(`Top three: ${prev.top3.join(", ")} → ${next.top3.join(", ")}${sameSet ? " (same three, new order)" : ""}`);
  }
  if ((prev.primaryMindset || null) !== (next.primaryMindset || null)) {
    lines.push(`Primary Mindset: ${prev.primaryMindset || "—"} → ${next.primaryMindset || "—"}`);
  }
  if ((prev.edge || null) !== (next.edge || null)) {
    lines.push(`Growth edge: ${prev.edge || "—"} → ${next.edge || "—"}`);
  }
  return lines;
}

function buildHint(lines) {
  return [
    "Their results have shifted since you last walked them (system hint for THIS opening only — an offer, never an agenda):",
    lines.map((l) => "• " + l).join("\n"),
    "They already completed the full first orientation, so they know the concepts — do NOT re-teach what Bandwidth, Shadow, or a Mindset is. If it feels natural, you may gently OFFER to talk through just what's changed — something like \"Would you like to walk through your updated results?\" — a brief review of these shifts, not the whole induction. Raise it at most once, lightly, woven into your greeting; if they'd rather not, or simply don't pick it up, let it rest and follow whatever they bring. Never manufacture pressure to engage.",
    "If — and only if — you actually walk them through the changes, place the silent marker ⟦" + RESULTS_REVIEWED_MARKER + "⟧ once when that review has landed, immediately before your ⟦suggest: …⟧ marker. The server strips it from view; it simply records that this update has been reviewed so you won't re-offer it.",
  ].join("\n");
}

// Compute the refresh offer for a session opener, or null when there's nothing to
// offer (not a G11 graduate, no newer retake, no meaningful change, already
// reviewed, or the offer has rested past the cap). Read-only — the caller writes
// the offer bookkeeping via noteResultsOffered once it actually injects the hint.
export async function resultsRefreshHint(env, userId) {
  if (!env || !env.DB || !userId) return null;
  let u = null;
  try {
    u = await env.DB
      .prepare("SELECT induction_status, results_reviewed_id, results_offer_id, results_offer_count FROM users WHERE id = ?")
      .bind(userId).first();
  } catch (e) { return null; }
  if (!u || u.induction_status !== "completed") return null; // only for people who did the full walk

  let rows = [];
  try {
    const r = await env.DB
      .prepare("SELECT id, archetype_scores FROM results WHERE user_id = ? AND archetype_scores <> '{}' AND archetype_scores <> '' ORDER BY created_at DESC LIMIT 2")
      .bind(userId).all();
    rows = (r && r.results) || [];
  } catch (e) { return null; }
  if (rows.length < 2) return null; // need a prior reading to diff against

  const latest = rows[0];
  const reviewedId = u.results_reviewed_id || null;
  if (reviewedId && latest.id === reviewedId) return null; // newest already reviewed

  // Baseline = the row Mira last acknowledged if we still have it, else the row
  // immediately before the latest.
  let baseline = null;
  if (reviewedId) {
    try {
      baseline = await env.DB
        .prepare("SELECT id, archetype_scores FROM results WHERE id = ? AND user_id = ?")
        .bind(reviewedId, userId).first();
    } catch (e) { baseline = null; }
  }
  if (!baseline) baseline = rows[1];
  if (!baseline || baseline.id === latest.id) return null;

  const lines = deltaLines(shapeFromScores(baseline.archetype_scores), shapeFromScores(latest.archetype_scores));
  if (!lines.length) return null; // nothing meaningful changed

  // Rest after the cap of unreviewed openers for THIS retake.
  if (u.results_offer_id === latest.id && (Number(u.results_offer_count) || 0) >= OFFER_CAP) return null;

  return {
    hint: buildHint(lines),
    latestId: latest.id,
    priorOfferId: u.results_offer_id || null,
    priorCount: Number(u.results_offer_count) || 0,
  };
}
