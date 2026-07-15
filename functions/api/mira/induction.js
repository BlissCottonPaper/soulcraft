// ============================================================
// /functions/api/mira/induction.js  ->  POST /api/mira/induction
// ============================================================
// Records the outcome of Mira's First Orientation (G11) when the CLIENT decides
// it — the only client-driven outcome is 'decline' (the threshold screen's "View
// the written results first"). Completion is normally recorded server-side by the
// chat endpoint when Mira emits the ⟦induction-complete⟧ marker, but 'complete' is
// accepted here too as a harmless idempotent backstop.
//
//   POST { action: 'decline' | 'complete' }  ->  { ok: true, status }
//
// Auth-gated. Never throws to the client. Needs the D1 binding env.DB.
// ============================================================

import { getSessionUser } from "../_auth.js";
import { setInductionStatus, getInductionStatus, getLatestResultId, markResultsReviewed } from "../../mira/_schema.js";

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env || !env.DB) return json({ error: "Database isn't configured." }, 500);
    const user = await getSessionUser(request, env);
    if (!user) return json({ error: "Please log in." }, 401);

    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === "string" ? body.action.trim() : "";
    const status = action === "decline" ? "declined" : action === "complete" ? "completed" : null;
    if (!status) return json({ error: "Unknown action." }, 400);

    await setInductionStatus(env, user.id, status);
    // Completing anchors the Results Refresh baseline to the current reading, so a
    // later retake is what surfaces the refresh offer (not this first walk).
    if (status === "completed") {
      const lid = await getLatestResultId(env, user.id);
      if (lid) await markResultsReviewed(env, user.id, lid);
    }
    return json({ ok: true, status: await getInductionStatus(env, user.id) });
  } catch (err) {
    return json({ error: "Server error." }, 500);
  }
}
