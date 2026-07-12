// ============================================================
// /functions/api/settings.js  ->  POST /api/settings
// ============================================================
// Saves account preferences. Today that's just the spoken-replies plumbing:
// a boolean stored on the user row (users.voice_output_enabled). No feature
// reads it yet — TTS isn't wired — but the choice persists so it's ready when
// it ships.
//
//   POST { voice_output_enabled: 0|1 }  ->  { ok: true, voice_output_enabled }
//
// Auth-gated. Needs the D1 binding env.DB.
// ============================================================

import { getSessionUser, ensureSchema } from "./_auth.js";

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ error: "Database isn't configured." }, 500);
    const user = await getSessionUser(request, env);
    if (!user) return json({ error: "Please log in." }, 401);
    await ensureSchema(env);

    const body = await request.json().catch(() => ({}));
    const voiceOut = body.voice_output_enabled ? 1 : 0;

    await env.DB
      .prepare("UPDATE users SET voice_output_enabled = ? WHERE id = ?")
      .bind(voiceOut, user.id)
      .run();

    return json({ ok: true, voice_output_enabled: !!voiceOut });
  } catch (err) {
    return json({ error: "Server error", detail: err && err.message }, 500);
  }
}
