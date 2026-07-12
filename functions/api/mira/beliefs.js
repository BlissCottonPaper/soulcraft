// ============================================================
// /functions/api/mira/beliefs.js  ->  POST /api/mira/beliefs
// ============================================================
// Saves the belief-lens onboarding (and later edits).
//   POST { traditions: string[], open_all: boolean, openness: 'home'|'parallels' }
//   -> { ok: true }
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
    const openAll = body.open_all ? 1 : 0;
    let traditions = Array.isArray(body.traditions) ? body.traditions.filter((t) => VALID.indexOf(t) !== -1) : [];
    // "Open to all" clears the specific selections.
    if (openAll) traditions = [];
    const openness = body.openness === "parallels" ? "parallels" : "home";

    // Require at least a choice (some tradition, or open-to-all).
    if (!openAll && traditions.length === 0) {
      return json({ error: "Please choose at least one tradition, or 'open to all'." }, 400);
    }

    await env.DB
      .prepare("UPDATE users SET belief_traditions = ?, belief_open_all = ?, belief_openness = ? WHERE id = ?")
      .bind(JSON.stringify(traditions), openAll, openness, user.id).run();
    return json({ ok: true });
  } catch (err) {
    return json({ error: "Server error", detail: err && err.message }, 500);
  }
}
