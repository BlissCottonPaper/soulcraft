// ============================================================
// /functions/api/mira/insight.js  ->  POST /api/mira/insight
// ============================================================
// Powers the "✦ Save this insight" action under a Mira message.
//   POST { content }  ->  { ok: true }
// Auth-gated. Needs the D1 binding env.DB.
// ============================================================

import { getSessionUser } from "../_auth.js";
import { ensureMiraSchema } from "../../mira/_schema.js";

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
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) return json({ error: "Nothing to save." }, 400);
    if (content.length > 4000) return json({ error: "That insight is a little long." }, 400);

    await env.DB
      .prepare("INSERT INTO mira_insights (user_id, content) VALUES (?, ?)")
      .bind(user.id, content).run();
    return json({ ok: true });
  } catch (err) {
    return json({ error: "Server error", detail: err && err.message }, 500);
  }
}
