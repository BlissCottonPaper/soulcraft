// ============================================================
// /functions/api/settings.js  ->  POST /api/settings
// ============================================================
// Saves account preferences. Partial updates: only the fields present in the
// body are touched.
//   • voice_output_enabled: 0|1 — spoken-replies plumbing (Session 4). No TTS
//     reads it yet; the choice just persists.
//   • display_name: string     — what to call the person (Session 5b). Empty
//     string clears it back to the email-derived fallback.
//
//   POST { voice_output_enabled?, display_name? }
//        -> { ok: true, voice_output_enabled?, display_name? }
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

// Trim, collapse whitespace, drop control chars, cap 40. Empty → null (clear).
function cleanDisplayName(v) {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
  return s || null;
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) return json({ error: "Database isn't configured." }, 500);
    const user = await getSessionUser(request, env);
    if (!user) return json({ error: "Please log in." }, 401);
    await ensureSchema(env);

    const body = await request.json().catch(() => ({}));
    const out = { ok: true };

    if ("voice_output_enabled" in body) {
      const voiceOut = body.voice_output_enabled ? 1 : 0;
      await env.DB
        .prepare("UPDATE users SET voice_output_enabled = ? WHERE id = ?")
        .bind(voiceOut, user.id)
        .run();
      out.voice_output_enabled = !!voiceOut;
    }

    if ("display_name" in body) {
      const name = cleanDisplayName(body.display_name);
      await env.DB
        .prepare("UPDATE users SET display_name = ? WHERE id = ?")
        .bind(name, user.id)
        .run();
      out.display_name = name;
    }

    return json(out);
  } catch (err) {
    return json({ error: "Server error", detail: err && err.message }, 500);
  }
}
