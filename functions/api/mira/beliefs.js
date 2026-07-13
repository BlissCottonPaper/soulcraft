// ============================================================
// /functions/api/mira/beliefs.js  ->  POST /api/mira/beliefs
// ============================================================
// Saves the belief-lens onboarding (and later edits).
//   POST { traditions: string[], open_all: boolean, openness: 'home'|'parallels',
//          other: string, declined: boolean }
//   -> { ok: true }
// "declined" ("prefer not to answer") stores no identity claim — just the flag —
// and is routed to the neutral/secular default at prompt time. "other" is a
// self-named tradition, kept verbatim in its own column.
// Auth-gated. Needs the D1 binding env.DB.
// ============================================================

import { getSessionUser } from "../_auth.js";
import { ensureMiraSchema } from "../../mira/_schema.js";

const VALID = ["christian", "jewish", "muslim", "hindu", "buddhist", "taoist", "indigenous", "spiritual", "secular"];

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json" } });
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ error: "Database isn't configured." }, 500);
    const user = await getSessionUser(request, env);
    if (!user) return json({ error: "Please log in." }, 401);
    await ensureMiraSchema(env);

    const body = await request.json().catch(() => ({}));
    const declined = body.declined ? 1 : 0;
    let openAll = body.open_all ? 1 : 0;
    let traditions = Array.isArray(body.traditions) ? body.traditions.filter((t) => VALID.indexOf(t) !== -1) : [];
    let other = typeof body.other === "string" ? body.other.trim().slice(0, 80) : "";
    const openness = body.openness === "parallels" ? "parallels" : "home";

    // "Prefer not to answer" is the strongest choice: store no identity claim at
    // all — no traditions, no other, not even open-to-all. Just the flag.
    if (declined) { openAll = 0; traditions = []; other = ""; }
    // "Open to all" clears the specific selections (including a self-named one).
    else if (openAll) { traditions = []; other = ""; }

    // Require at least a choice.
    if (!declined && !openAll && traditions.length === 0 && !other) {
      return json({ error: "Please choose at least one tradition, 'open to all', or 'prefer not to answer'." }, 400);
    }

    await env.DB
      .prepare("UPDATE users SET belief_traditions = ?, belief_open_all = ?, belief_openness = ?, belief_other = ?, belief_declined = ? WHERE id = ?")
      .bind(JSON.stringify(traditions), openAll, openness, other || null, declined, user.id).run();
    return json({ ok: true });
  } catch (err) {
    return json({ error: "Server error", detail: err && err.message }, 500);
  }
}
