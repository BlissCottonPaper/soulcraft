// ============================================================
// /functions/api/mira/history.js  ->  GET /api/mira/history?session_id=<id>
// ============================================================
// Returns the saved turns of ONE Mira session so the /companion page can restore
// the exact conversation when a person navigates away and back. Without this, the
// chat view loads empty and the client used to auto-send a hidden bootstrap turn —
// which advanced the conversation past a question the person hadn't answered yet.
//
// Auth is the session cookie (same as the rest of Mira); we only ever return the
// caller's own messages, scoped to the session id they ask for. Chronological,
// capped, read-only. Never throws to the client.
//
//   GET ?session_id=<id> -> { authenticated: true, messages: [{ role, content }] }
//
// Needs the D1 binding env.DB.
// ============================================================

import { getSessionUser } from "../_auth.js";

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Vary": "Cookie" },
  });
}

export async function onRequestGet({ request, env }) {
  try {
    const user = await getSessionUser(request, env);
    if (!user) return json({ authenticated: false, messages: [] });

    const sid = new URL(request.url).searchParams.get("session_id");
    if (!sid) return json({ authenticated: true, messages: [] });

    // Oldest-first so the client rebuilds the thread top-to-bottom. Capped: a live
    // 30-minute session is short, and the client only needs what was on screen.
    let rows = [];
    try {
      const r = await env.DB
        .prepare("SELECT role, content FROM mira_messages WHERE user_id = ? AND session_id = ? ORDER BY id ASC LIMIT 60")
        .bind(user.id, sid)
        .all();
      rows = (r && r.results) || [];
    } catch (e) {
      rows = []; // table not present yet / partial schema → nothing to restore
    }

    return json({
      authenticated: true,
      messages: rows.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    });
  } catch (err) {
    return json({ authenticated: false, messages: [] });
  }
}
