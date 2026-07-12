// ============================================================
// /functions/api/mira/context.js  ->  GET /api/mira/context
// ============================================================
// One call the /companion page uses to decide what to render: gate (no
// subscription), onboarding (subscribed but no belief lens), or chat.
//   GET -> { authenticated, companion_active, companion_tier, email,
//            belief_set, belief_traditions, belief_open_all, belief_openness }
// Never throws to the client. Needs the D1 binding env.DB.
// ============================================================

import { getSessionUser } from "../_auth.js";
import { ensureMiraSchema, grantMiraTrial, miraAccess } from "../../mira/_schema.js";

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function onRequestGet({ request, env }) {
  try {
    const user = await getSessionUser(request, env);
    if (!user) return json({ authenticated: false });
    await ensureMiraSchema(env);

    // Front door: if they came through the $29 (or WHITEDOT) and haven't been
    // granted their 30-day trial yet, start it now. Idempotent + eligibility-gated.
    await grantMiraTrial(env, user.id);
    const access = await miraAccess(env, user.id);

    let row = null;
    try {
      row = await env.DB
        .prepare("SELECT belief_traditions, belief_open_all, belief_openness FROM users WHERE id = ?")
        .bind(user.id).first();
    } catch (e) { row = null; }

    let traditions = [];
    try { traditions = JSON.parse((row && row.belief_traditions) || "[]") || []; } catch (e) { traditions = []; }
    const openAll = row && Number(row.belief_open_all) === 1;
    const beliefSet = (row && row.belief_traditions !== null && row.belief_traditions !== undefined) && (openAll || traditions.length > 0);

    // Has this person ever spoken with Mira? Drives the first-ever bootstrap turn.
    let hasHistory = false;
    try {
      const h = await env.DB.prepare("SELECT 1 AS x FROM mira_messages WHERE user_id = ? LIMIT 1").bind(user.id).first();
      hasHistory = !!h;
    } catch (e) { hasHistory = false; }

    return json({
      authenticated: true,
      email: user.email,
      companion_active: !!user.companion_active,
      companion_tier: user.companion_tier || null,
      // Session 3.2 access model: chat is open with a live sub OR an unexpired trial.
      has_access: !!access.has_access,
      trial_until: access.trial_until || null,
      trialing: !!(access.trial_until && !access.active),
      has_full_purchase: !!access.has_full_purchase,
      belief_set: !!beliefSet,
      belief_traditions: traditions,
      belief_open_all: !!openAll,
      belief_openness: (row && row.belief_openness) || "home",
      has_history: hasHistory,
    });
  } catch (err) {
    return json({ authenticated: false });
  }
}
